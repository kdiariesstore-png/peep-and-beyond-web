import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { calculateOrderTotal } from "../../../../lib/order/order-total";
import { createHostedPayment } from "../../../../lib/payments/oreem-client";
import { storePendingOrder } from "../../../../lib/order/pending-order-store";
import { PEEP_BOX_PRODUCT } from "../../../../lib/product";
import { getSiteUrl } from "../../../../lib/site-url";
import type { BuyerDetails, CartItem } from "../../../../lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const buyerCandidate = (body as Record<string, unknown> | null)?.buyer;
  const itemsCandidate = (body as Record<string, unknown> | null)?.items;

  if (!buyerCandidate || typeof buyerCandidate !== "object") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (!Array.isArray(itemsCandidate)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const buyer = buyerCandidate as BuyerDetails;
  let items = itemsCandidate as CartItem[];

  if (items.length === 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }

  for (const item of items) {
    const storyLanguage = item?.customization?.storyLanguage;
    if (storyLanguage !== "ar" && storyLanguage !== "en") {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    if (!Number.isInteger(item?.quantity) || (item?.quantity ?? 0) < 1) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
  }

  items = items.map((item) => ({ ...item, unitPriceBhd: PEEP_BOX_PRODUCT.priceBhd }));

  const { subtotalBhd, shippingBhd, totalBhd } = calculateOrderTotal(items, buyer.country);
  if (shippingBhd === null || totalBhd === null) {
    return NextResponse.json({ error: "shipping_not_available" }, { status: 400 });
  }

  const txnRef = `peep_${randomUUID()}`;

  // Store the order server-side and hand Oreem only a short opaque reference. Oreem's
  // redirect_url has a length limit on their side (discovered via a real completed
  // digital-product payment) and truncates anything past it before appending their own
  // status params — silently corrupting any order data embedded directly in the URL.
  // This must happen BEFORE creating the payment session: if we can't reliably store the
  // order, we must not let the customer pay for something we won't be able to retrieve.
  try {
    await storePendingOrder(txnRef, { txnRef, buyer, items, subtotalBhd, shippingBhd, totalBhd });
  } catch (error) {
    console.error("Failed to store pending order before payment", error);
    return NextResponse.json({ error: "order_storage_unavailable" }, { status: 502 });
  }

  // getSiteUrl() throws when the site URL is unconfigured in production; it shares this
  // try/catch with createHostedPayment so that case degrades to the same friendly 502
  // rather than an unhandled exception.
  try {
    const redirectUrl = `${getSiteUrl()}/order/confirmation?ref=${txnRef}`;
    const { paymentUrl } = await createHostedPayment({
      txnRef,
      amountBhd: totalBhd,
      customerName: buyer.fullName,
      customerEmail: buyer.email,
      customerPhone: buyer.phone,
      redirectUrl,
    });
    return NextResponse.json({ paymentUrl });
  } catch (error) {
    console.error("Failed to start Oreem hosted payment", error);
    return NextResponse.json({ error: "oreem_unavailable" }, { status: 502 });
  }
}

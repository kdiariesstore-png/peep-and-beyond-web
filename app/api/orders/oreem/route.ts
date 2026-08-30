import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { calculateOrderTotal } from "../../../../lib/order/order-total";
import { createHostedPayment } from "../../../../lib/payments/oreem-client";
import { storePendingOrder } from "../../../../lib/order/pending-order-store";
import { normalizePhysicalCartItems } from "../../../../lib/cart/validate-cart";
import type { BuyerDetails, CartItem } from "../../../../lib/types";

export const runtime = "nodejs";

// Never silently fall back to localhost in production: this URL is where Oreem sends a
// paying customer back to. A localhost redirect on a live payment means money taken and
// no order record at all, so fail loudly instead (the caller turns this into a 502).
function getSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_SITE_URL is not set");
    }
    return "http://localhost:3000";
  }
  return configured.replace(/\/+$/, "");
}

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
  const items = normalizePhysicalCartItems(itemsCandidate);
  if (!items) {
    return NextResponse.json({ error: "invalid_cart" }, { status: 400 });
  }

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

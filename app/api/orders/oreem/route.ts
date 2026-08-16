import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { calculateOrderTotal } from "../../../../lib/order/order-total";
import { encodeOrderPayload } from "../../../../lib/order/order-payload";
import { createHostedPayment } from "../../../../lib/payments/oreem-client";
import { PEEP_BOX_PRODUCT } from "../../../../lib/product";
import type { BuyerDetails, CartItem } from "../../../../lib/types";

export const runtime = "nodejs";

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
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
  const encodedOrder = encodeOrderPayload({
    txnRef,
    buyer,
    items,
    subtotalBhd,
    shippingBhd,
    totalBhd,
  });
  const redirectUrl = `${getSiteUrl()}/order/confirmation?order=${encodedOrder}`;

  try {
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
    console.error("Failed to create Oreem hosted payment", error);
    return NextResponse.json({ error: "oreem_unavailable" }, { status: 502 });
  }
}

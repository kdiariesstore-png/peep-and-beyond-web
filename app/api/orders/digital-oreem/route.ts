import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { calculateDigitalOrderTotal } from "../../../../lib/digital/order-total";
import { encodeDigitalOrderPayload } from "../../../../lib/digital/order-payload";
import { getDigitalProductPrice } from "../../../../lib/digital/catalog";
import { createHostedPayment } from "../../../../lib/payments/oreem-client";
import type { DigitalBuyerDetails, DigitalCartItem, DigitalProductId } from "../../../../lib/digital/types";

export const runtime = "nodejs";

const VALID_IDS = new Set<DigitalProductId>([
  "picky-eating",
  "potty-training",
  "screens-big-feelings",
  "sharing-sibling-conflict",
  "sleep-bedtime",
  "starting-school",
  "child-hits",
  "digital-bundle",
]);

// Never silently fall back to localhost in production — same reasoning as the physical
// box's app/api/orders/oreem/route.ts: this is where Oreem sends a paying customer back
// to, so a localhost redirect on a live payment means money taken with no order record.
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
  if (!Array.isArray(itemsCandidate) || itemsCandidate.length === 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }

  const buyer = buyerCandidate as DigitalBuyerDetails;
  if (
    typeof buyer.fullName !== "string" ||
    buyer.fullName.trim() === "" ||
    typeof buyer.email !== "string" ||
    buyer.email.trim() === "" ||
    typeof buyer.country !== "string" ||
    buyer.country.trim() === ""
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const rawItems = itemsCandidate as unknown[];
  const items: DigitalCartItem[] = [];
  for (const raw of rawItems) {
    const id = (raw as Record<string, unknown> | null)?.id;
    const language = (raw as Record<string, unknown> | null)?.language;
    if (typeof id !== "string" || !VALID_IDS.has(id as DigitalProductId)) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    if (language !== "ar" && language !== "en") {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    // Never trust a client-supplied price — resolve it server-side from the catalog,
    // same pattern as PEEP_BOX_PRODUCT.priceBhd in the physical Oreem route.
    const unitPriceBhd = getDigitalProductPrice(id as DigitalProductId);
    if (unitPriceBhd === null) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    items.push({ id: id as DigitalProductId, language, unitPriceBhd });
  }

  const { totalBhd } = calculateDigitalOrderTotal(items);
  const txnRef = `peepdigi_${randomUUID()}`;
  const encodedOrder = encodeDigitalOrderPayload({ txnRef, buyer, items, totalBhd });

  try {
    const redirectUrl = `${getSiteUrl()}/digital/confirmation?order=${encodedOrder}`;
    const { paymentUrl } = await createHostedPayment({
      txnRef,
      amountBhd: totalBhd,
      customerName: buyer.fullName,
      customerEmail: buyer.email,
      customerPhone: "",
      redirectUrl,
    });
    return NextResponse.json({ paymentUrl });
  } catch (error) {
    console.error("Failed to start Oreem hosted payment for digital order", error);
    return NextResponse.json({ error: "oreem_unavailable" }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { calculateDigitalOrderTotal } from "../../../../lib/digital/order-total";
import { getDigitalProductPrice } from "../../../../lib/digital/catalog";
import { createHostedPayment } from "../../../../lib/payments/oreem-client";
import { storePendingOrder } from "../../../../lib/order/pending-order-store";
import { getSiteUrl } from "../../../../lib/site-url";
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
  "school-season-toolkit",
  "activity-book",
  "peep-storybook",
  "digital-bundle",
  "school-season-bundle",
]);

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

  // Store the order server-side and hand Oreem only a short opaque reference. Oreem's
  // redirect_url has a length limit on their side (discovered via a real completed
  // payment) and truncates anything past it before appending their own status params —
  // silently corrupting any order data we tried to embed directly in the URL. This must
  // happen BEFORE creating the payment session: if we can't reliably store the order, we
  // must not let the customer pay for something we won't be able to retrieve afterward.
  try {
    await storePendingOrder(txnRef, { txnRef, buyer, items, totalBhd });
  } catch (error) {
    console.error("Failed to store pending digital order before payment", error);
    return NextResponse.json({ error: "order_storage_unavailable" }, { status: 502 });
  }

  try {
    const redirectUrl = `${getSiteUrl()}/digital/confirmation?ref=${txnRef}`;
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

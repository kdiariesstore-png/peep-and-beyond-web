import { NextRequest, NextResponse } from "next/server";
import { calculateOrderTotal } from "../../../../lib/order/order-total";
import {
  sendOrderNotificationEmail,
  sendCustomerConfirmationEmail,
  addToMarketingAudience,
} from "../../../../lib/email/resend-client";
import {
  getRemainingStock,
  decrementStockAfterOrder,
  isPreOrder,
  PRE_ORDER_NOTE,
} from "../../../../lib/inventory/story-stock";
import { isPhysicalBoxAvailable, PEEP_STORY_PRODUCT } from "../../../../lib/product";
import { claimBoxOrderPricing } from "../../../../lib/inventory/launch-pricing";
import { isValidCartItemsPayload, getItemStoryLanguage } from "../../../../lib/cart/cart-item-helpers";
import type { BuyerDetails } from "../../../../lib/types";

export const runtime = "nodejs";

// Cash on delivery is Bahrain-only (no courier COD support elsewhere), so this re-checks
// buyer.country server-side rather than trusting the UI having hidden the option —
// the same defence-in-depth the other order routes apply to their own constraints.
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
  if (!isValidCartItemsPayload(itemsCandidate)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const buyer = buyerCandidate as BuyerDetails;
  let items = itemsCandidate;

  if (items.length === 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }
  if (buyer.country !== "BH") {
    return NextResponse.json({ error: "cod_not_available" }, { status: 400 });
  }

  const hasBoxItem = items.some((item) => item.productId === "peep-box");
  if (hasBoxItem && !isPhysicalBoxAvailable()) {
    return NextResponse.json({ error: "box_not_available" }, { status: 403 });
  }

  // Never trust client-supplied prices: box lines get the server-claimed launch price,
  // story lines get the catalog's fixed price.
  const boxQty = items
    .filter((item) => item.productId === "peep-box")
    .reduce((sum, item) => sum + item.quantity, 0);
  const { unitPriceBhd: boxUnitPriceBhd } = await claimBoxOrderPricing(boxQty);
  items = items.map((item) =>
    item.productId === "peep-box"
      ? { ...item, unitPriceBhd: boxUnitPriceBhd }
      : { ...item, unitPriceBhd: PEEP_STORY_PRODUCT.priceBhd }
  );

  const { subtotalBhd, shippingBhd, totalBhd } = calculateOrderTotal(items, buyer.country);

  const notes: string[] = [];
  for (const item of items) {
    try {
      const language = getItemStoryLanguage(item);
      const remaining = await getRemainingStock(language);
      if (isPreOrder(remaining)) {
        notes.push(`${PRE_ORDER_NOTE} (${language})`);
      }
    } catch (error) {
      console.error("Failed to check story stock for pre-order flag", error);
    }
  }

  const emailData = {
    buyer,
    items,
    subtotalBhd,
    shippingBhd,
    totalBhd,
    paymentMethod: "cod" as const,
    notes: notes.length > 0 ? notes : undefined,
  };

  try {
    await sendOrderNotificationEmail({ data: emailData });
  } catch (error) {
    console.error("Failed to send COD order notification email", error);
    return NextResponse.json({ error: "email_failed" }, { status: 502 });
  }

  try {
    await sendCustomerConfirmationEmail(emailData);
  } catch (error) {
    console.error("Failed to send customer confirmation email", error);
  }

  if (buyer.marketingOptIn) {
    try {
      await addToMarketingAudience(buyer.email);
    } catch (error) {
      console.error("Failed to add buyer to marketing audience", error);
    }
  }

  for (const item of items) {
    try {
      await decrementStockAfterOrder(getItemStoryLanguage(item), item.quantity);
    } catch (error) {
      console.error("Failed to decrement story stock", error);
    }
  }

  return NextResponse.json({ status: "received" });
}

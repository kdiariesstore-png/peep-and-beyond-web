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
import { itemIncludesStory } from "../../../../lib/product";
import { normalizePhysicalCartItems } from "../../../../lib/cart/validate-cart";
import type { BuyerDetails } from "../../../../lib/types";

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
  // Cash on delivery only makes sense for a delivery the shop actually runs itself.
  if (buyer.country !== "BH") {
    return NextResponse.json({ error: "cod_not_available" }, { status: 400 });
  }

  const items = normalizePhysicalCartItems(itemsCandidate);
  if (!items) {
    return NextResponse.json({ error: "invalid_cart" }, { status: 400 });
  }

  const { subtotalBhd, shippingBhd, totalBhd } = calculateOrderTotal(items, buyer.country);
  if (shippingBhd === null || totalBhd === null) {
    return NextResponse.json({ error: "shipping_not_available" }, { status: 400 });
  }

  const notes: string[] = [];
  for (const item of items) {
    if (!itemIncludesStory(item)) continue;
    try {
      const remaining = await getRemainingStock(item.customization.storyLanguage);
      if (isPreOrder(remaining)) {
        notes.push(`${PRE_ORDER_NOTE} (${item.customization.storyLanguage})`);
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
    if (!itemIncludesStory(item)) continue;
    try {
      await decrementStockAfterOrder(item.customization.storyLanguage, item.quantity);
    } catch (error) {
      console.error("Failed to decrement story stock", error);
    }
  }

  return NextResponse.json({ status: "received" });
}

import { NextRequest, NextResponse } from "next/server";
import { calculateOrderTotalWithLiveShipping } from "../../../../lib/order/order-total";
import { validateReceiptFile } from "../../../../lib/order/validate-receipt";
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
import type { BuyerDetails, CartItem } from "../../../../lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const buyerJson = formData.get("buyer");
  const itemsJson = formData.get("items");
  const receipt = formData.get("receipt");

  if (typeof buyerJson !== "string" || typeof itemsJson !== "string") {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const receiptFile = receipt instanceof File ? receipt : null;
  const receiptCheck = validateReceiptFile(
    receiptFile ? { type: receiptFile.type, size: receiptFile.size } : null
  );
  if (!receiptCheck.valid) {
    return NextResponse.json({ error: receiptCheck.error }, { status: 400 });
  }

  let buyer: BuyerDetails;
  let items: CartItem[];
  try {
    buyer = JSON.parse(buyerJson) as BuyerDetails;
    if (!buyer || typeof buyer !== "object") throw new Error("invalid buyer");
    const parsedItems = JSON.parse(itemsJson);
    if (!isValidCartItemsPayload(parsedItems)) throw new Error("invalid items");
    items = parsedItems;
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const hasBoxItem = items.some((item) => item.productId === "peep-box");
  if (hasBoxItem && !isPhysicalBoxAvailable()) {
    return NextResponse.json({ error: "box_not_available" }, { status: 403 });
  }

  // Never trust client-supplied prices: box lines get the server-claimed launch price,
  // story lines get the catalog's fixed price — same "never trust the cart" principle,
  // just applied per product type instead of uniformly.
  const boxQty = items
    .filter((item) => item.productId === "peep-box")
    .reduce((sum, item) => sum + item.quantity, 0);
  const { unitPriceBhd: boxUnitPriceBhd } = await claimBoxOrderPricing(boxQty);
  items = items.map((item) =>
    item.productId === "peep-box"
      ? { ...item, unitPriceBhd: boxUnitPriceBhd }
      : { ...item, unitPriceBhd: PEEP_STORY_PRODUCT.priceBhd }
  );

  const { subtotalBhd, shippingBhd, totalBhd } = await calculateOrderTotalWithLiveShipping(
    items,
    buyer.country,
    buyer.city
  );

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

  let receiptBuffer: Buffer;
  try {
    receiptBuffer = Buffer.from(await (receiptFile as File).arrayBuffer());
  } catch {
    return NextResponse.json({ error: "receipt_unreadable" }, { status: 400 });
  }
  const emailData = {
    buyer,
    items,
    subtotalBhd,
    shippingBhd,
    totalBhd,
    paymentMethod: "iban" as const,
    notes: notes.length > 0 ? notes : undefined,
  };

  try {
    await sendOrderNotificationEmail({
      data: emailData,
      receiptAttachment: {
        filename: (receiptFile as File).name || "receipt",
        content: receiptBuffer,
      },
    });
  } catch (error) {
    console.error("Failed to send IBAN order notification email", error);
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

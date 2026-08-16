import { NextRequest, NextResponse } from "next/server";
import { calculateOrderTotal } from "../../../../lib/order/order-total";
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
import type { BuyerDetails, CartItem } from "../../../../lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
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
    items = JSON.parse(itemsJson) as CartItem[];
    if (!Array.isArray(items)) throw new Error("items is not an array");
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { subtotalBhd, shippingBhd, totalBhd } = calculateOrderTotal(items, buyer.country);

  const notes: string[] = [];
  for (const item of items) {
    const remaining = await getRemainingStock(item.customization.storyLanguage);
    if (isPreOrder(remaining)) {
      notes.push(`${PRE_ORDER_NOTE} (${item.customization.storyLanguage})`);
    }
  }

  const receiptBuffer = Buffer.from(await (receiptFile as File).arrayBuffer());
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
      await decrementStockAfterOrder(item.customization.storyLanguage, item.quantity);
    } catch (error) {
      console.error("Failed to decrement story stock", error);
    }
  }

  return NextResponse.json({ status: "received" });
}

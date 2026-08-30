import type { BuyerDetails, CartItem } from "../types";
import { isValidPhysicalCartItem } from "../cart/validate-cart";

export interface PendingOrderPayload {
  txnRef: string;
  buyer: BuyerDetails;
  items: CartItem[];
  subtotalBhd: number;
  shippingBhd: number;
  totalBhd: number;
}

export function encodeOrderPayload(payload: PendingOrderPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
}

export function decodeOrderPayload(encoded: string): PendingOrderPayload | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    const parsed = JSON.parse(json);
    // Validate shape, not just txnRef: this payload is round-tripped through the
    // customer's browser via a URL param, so a valid txnRef guarantees nothing about
    // the rest of it. Downstream (the confirmation page) iterates items and reads
    // buyer fields — a malformed payload there would crash the page *after* a real
    // payment already went through.
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.txnRef !== "string" ||
      !parsed.buyer ||
      typeof parsed.buyer !== "object" ||
      !Array.isArray(parsed.items)
    ) {
      return null;
    }

    // The money fields are formatted (`.toFixed(3)`) and compared numerically on the
    // confirmation page *after* the payment has already been taken — a non-numeric value
    // here turns a successful order into a crashed page.
    if (
      !Number.isFinite(parsed.subtotalBhd) ||
      !Number.isFinite(parsed.shippingBhd) ||
      !Number.isFinite(parsed.totalBhd)
    ) {
      return null;
    }

    // Mirrors the per-item validation in app/api/orders/oreem/route.ts: items reaching
    // this point drive the stock decrement and the order emails.
    if (!parsed.items.every(isValidPhysicalCartItem)) return null;

    return parsed as PendingOrderPayload;
  } catch {
    return null;
  }
}

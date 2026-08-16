import type { BuyerDetails, CartItem } from "../types";

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
    return parsed as PendingOrderPayload;
  } catch {
    return null;
  }
}

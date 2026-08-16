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
    if (!parsed || typeof parsed !== "object" || typeof parsed.txnRef !== "string") {
      return null;
    }
    return parsed as PendingOrderPayload;
  } catch {
    return null;
  }
}

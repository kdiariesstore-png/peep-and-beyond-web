import type { CartItem } from "../types";
import { getShippingRate } from "../shipping-rates";
import { quoteShippingBhd } from "./quote-shipping";

export interface OrderTotal {
  subtotalBhd: number;
  shippingBhd: number | null;
  totalBhd: number | null;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function calculateSubtotalBhd(items: CartItem[]): number {
  return round3(items.reduce((sum, item) => sum + item.unitPriceBhd * item.quantity, 0));
}

// Bahrain-only flat-rate lookup, no network call. Kept for callers that only ever
// serve Bahrain shipping (and for the shipping-not-configured "quoted later" case);
// international orders must use calculateOrderTotalWithLiveShipping instead.
export function calculateOrderTotal(items: CartItem[], countryCode: string): OrderTotal {
  const subtotalBhd = calculateSubtotalBhd(items);
  const shippingBhd = getShippingRate(countryCode);
  const totalBhd = shippingBhd === null ? null : round3(subtotalBhd + shippingBhd);
  return { subtotalBhd, shippingBhd, totalBhd };
}

// Server-only (calls Oreem's shipping-rate API for non-Bahrain destinations via
// quoteShippingBhd). Box quantity is the sum of item quantities in the cart, since every
// cart item here is a physical Peep Box.
export async function calculateOrderTotalWithLiveShipping(
  items: CartItem[],
  countryCode: string,
  city: string | undefined
): Promise<OrderTotal> {
  const subtotalBhd = calculateSubtotalBhd(items);
  const boxQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const shippingBhd = await quoteShippingBhd(countryCode, city, boxQty);
  const totalBhd = shippingBhd === null ? null : round3(subtotalBhd + shippingBhd);
  return { subtotalBhd, shippingBhd, totalBhd };
}

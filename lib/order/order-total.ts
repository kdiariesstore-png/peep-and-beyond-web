import type { CartItem } from "../types";
import { getShippingRate } from "../shipping-rates";

export interface OrderTotal {
  subtotalBhd: number;
  shippingBhd: number | null;
  totalBhd: number | null;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function calculateOrderTotal(items: CartItem[], countryCode: string): OrderTotal {
  const subtotalBhd = round3(
    items.reduce((sum, item) => sum + item.unitPriceBhd * item.quantity, 0)
  );
  const shippingBhd = getShippingRate(countryCode);
  const totalBhd = shippingBhd === null ? null : round3(subtotalBhd + shippingBhd);
  return { subtotalBhd, shippingBhd, totalBhd };
}

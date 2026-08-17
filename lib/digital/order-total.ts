import type { DigitalCartItem } from "./types";

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export interface DigitalOrderTotal {
  subtotalBhd: number;
  totalBhd: number;
}

// Digital delivery is always instant and free, so unlike the physical box's
// calculateOrderTotal there is no shipping line and no country-dependent branch.
export function calculateDigitalOrderTotal(items: DigitalCartItem[]): DigitalOrderTotal {
  const subtotalBhd = round3(items.reduce((sum, item) => sum + item.unitPriceBhd, 0));
  return { subtotalBhd, totalBhd: subtotalBhd };
}

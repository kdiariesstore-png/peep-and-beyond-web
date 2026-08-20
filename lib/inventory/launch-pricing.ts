import { kv } from "@vercel/kv";

export const LAUNCH_PRICE_BHD = 24.9;
export const REGULAR_PRICE_BHD = 28.9;
export const LAUNCH_UNIT_LIMIT = 10;

// Orders open at 8:00 PM Bahrain time on launch day.
export const ORDERS_OPEN_AT = new Date("2026-08-20T20:00:00+03:00");
// The launch price ends here even if fewer than LAUNCH_UNIT_LIMIT boxes have sold —
// 11:59 PM Bahrain time, Sunday Aug 23 (midnight going into Aug 24).
export const LAUNCH_PRICE_DEADLINE = new Date("2026-08-24T00:00:00+03:00");

const SOLD_KEY = "peep:box:launch-units-sold";

export function ordersAreOpen(now: Date = new Date()): boolean {
  return now.getTime() >= ORDERS_OPEN_AT.getTime();
}

export async function getLaunchUnitsSold(): Promise<number> {
  const existing = await kv.get<number>(SOLD_KEY);
  return existing ?? 0;
}

// Claims `quantity` units against the launch-price counter and returns the price the
// WHOLE order should be charged at. Uses kv.incrby (atomic in Redis) so two concurrent
// orders racing near the 10-unit cutoff can never both read a stale "9 sold" and both be
// granted the launch price — the increment itself is the ordering, not a prior read.
// An order that starts before the count reaches LAUNCH_UNIT_LIMIT is honoured in full at
// the launch price even if its own quantity pushes the running total past the limit
// (the cart's data model only supports one price per line item, so a single order is
// never split across two prices) — the next order after it is the one that pays full
// price. Once the deadline passes, every order pays full price regardless of the count.
export async function claimBoxOrderPricing(
  quantity: number,
  now: Date = new Date()
): Promise<{ unitPriceBhd: number; isLaunchPrice: boolean }> {
  if (quantity <= 0 || now.getTime() >= LAUNCH_PRICE_DEADLINE.getTime()) {
    return { unitPriceBhd: REGULAR_PRICE_BHD, isLaunchPrice: false };
  }

  const soldAfter = await kv.incrby(SOLD_KEY, quantity);
  const soldBefore = soldAfter - quantity;
  const isLaunchPrice = soldBefore < LAUNCH_UNIT_LIMIT;
  return { unitPriceBhd: isLaunchPrice ? LAUNCH_PRICE_BHD : REGULAR_PRICE_BHD, isLaunchPrice };
}

// Read-only version of the same decision, for display (e.g. the price shown on the
// homepage before anyone has ordered) — does not touch the counter.
export async function getCurrentBoxPriceBhd(now: Date = new Date()): Promise<{
  priceBhd: number;
  isLaunchPrice: boolean;
}> {
  if (now.getTime() >= LAUNCH_PRICE_DEADLINE.getTime()) {
    return { priceBhd: REGULAR_PRICE_BHD, isLaunchPrice: false };
  }
  const sold = await getLaunchUnitsSold();
  const isLaunchPrice = sold < LAUNCH_UNIT_LIMIT;
  return { priceBhd: isLaunchPrice ? LAUNCH_PRICE_BHD : REGULAR_PRICE_BHD, isLaunchPrice };
}

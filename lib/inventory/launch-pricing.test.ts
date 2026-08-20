import { describe, expect, it, vi, beforeEach } from "vitest";

const store = new Map<string, number>();

vi.mock("@vercel/kv", () => ({
  kv: {
    get: vi.fn((key: string) => Promise.resolve(store.has(key) ? store.get(key) : null)),
    incrby: vi.fn((key: string, amount: number) => {
      const next = (store.get(key) ?? 0) + amount;
      store.set(key, next);
      return Promise.resolve(next);
    }),
  },
}));

import {
  ordersAreOpen,
  getLaunchUnitsSold,
  claimBoxOrderPricing,
  getCurrentBoxPriceBhd,
  ORDERS_OPEN_AT,
  LAUNCH_PRICE_DEADLINE,
  LAUNCH_PRICE_BHD,
  REGULAR_PRICE_BHD,
} from "./launch-pricing";

beforeEach(() => {
  store.clear();
});

describe("ordersAreOpen", () => {
  it("is false before 8pm Bahrain time on launch day", () => {
    expect(ordersAreOpen(new Date(ORDERS_OPEN_AT.getTime() - 1000))).toBe(false);
  });

  it("is true at and after the opening moment", () => {
    expect(ordersAreOpen(new Date(ORDERS_OPEN_AT.getTime()))).toBe(true);
    expect(ordersAreOpen(new Date(ORDERS_OPEN_AT.getTime() + 1000))).toBe(true);
  });
});

describe("claimBoxOrderPricing", () => {
  it("grants the launch price to the first 10 units", async () => {
    const first = await claimBoxOrderPricing(6);
    expect(first).toEqual({ unitPriceBhd: LAUNCH_PRICE_BHD, isLaunchPrice: true });

    const second = await claimBoxOrderPricing(4);
    expect(second).toEqual({ unitPriceBhd: LAUNCH_PRICE_BHD, isLaunchPrice: true });
    expect(await getLaunchUnitsSold()).toBe(10);
  });

  it("charges full price once the running count has reached the limit", async () => {
    await claimBoxOrderPricing(10);
    const eleventh = await claimBoxOrderPricing(1);
    expect(eleventh).toEqual({ unitPriceBhd: REGULAR_PRICE_BHD, isLaunchPrice: false });
  });

  it("honours an order in full at the launch price even if it overshoots the limit", async () => {
    await claimBoxOrderPricing(9);
    const tenth = await claimBoxOrderPricing(3);
    expect(tenth).toEqual({ unitPriceBhd: LAUNCH_PRICE_BHD, isLaunchPrice: true });
    expect(await getLaunchUnitsSold()).toBe(12);
  });

  it("charges full price after the launch-price deadline regardless of units sold", async () => {
    const afterDeadline = new Date(LAUNCH_PRICE_DEADLINE.getTime() + 1000);
    const result = await claimBoxOrderPricing(1, afterDeadline);
    expect(result).toEqual({ unitPriceBhd: REGULAR_PRICE_BHD, isLaunchPrice: false });
    expect(await getLaunchUnitsSold()).toBe(0);
  });

  it("charges full price for a non-positive quantity without touching the counter", async () => {
    const result = await claimBoxOrderPricing(0);
    expect(result).toEqual({ unitPriceBhd: REGULAR_PRICE_BHD, isLaunchPrice: false });
    expect(await getLaunchUnitsSold()).toBe(0);
  });
});

describe("getCurrentBoxPriceBhd", () => {
  it("reads the launch price without touching the counter when units remain", async () => {
    store.set("peep:box:launch-units-sold", 5);
    const result = await getCurrentBoxPriceBhd();
    expect(result).toEqual({ priceBhd: LAUNCH_PRICE_BHD, isLaunchPrice: true });
  });

  it("reads the regular price once 10 or more units have sold", async () => {
    store.set("peep:box:launch-units-sold", 10);
    const result = await getCurrentBoxPriceBhd();
    expect(result).toEqual({ priceBhd: REGULAR_PRICE_BHD, isLaunchPrice: false });
  });

  it("reads the regular price after the deadline even with units remaining", async () => {
    store.set("peep:box:launch-units-sold", 2);
    const afterDeadline = new Date(LAUNCH_PRICE_DEADLINE.getTime() + 1000);
    const result = await getCurrentBoxPriceBhd(afterDeadline);
    expect(result).toEqual({ priceBhd: REGULAR_PRICE_BHD, isLaunchPrice: false });
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";

const store = new Map<string, number>();

vi.mock("@vercel/kv", () => ({
  kv: {
    get: vi.fn((key: string) =>
      Promise.resolve(store.has(key) ? store.get(key) : null)
    ),
    set: vi.fn((key: string, value: number) => {
      store.set(key, value);
      return Promise.resolve("OK");
    }),
    decrby: vi.fn((key: string, amount: number) => {
      const current = store.get(key) ?? 0;
      const next = current - amount;
      store.set(key, next);
      return Promise.resolve(next);
    }),
  },
}));

import { getRemainingStock, decrementStockAfterOrder, isPreOrder } from "./story-stock";

beforeEach(() => {
  store.clear();
});

describe("getRemainingStock", () => {
  it("initializes an unset language to 25", async () => {
    expect(await getRemainingStock("ar")).toBe(25);
  });

  it("returns the stored value on subsequent reads", async () => {
    store.set("peep:story-stock:en", 10);
    expect(await getRemainingStock("en")).toBe(10);
  });
});

describe("decrementStockAfterOrder", () => {
  it("decrements by the order quantity", async () => {
    await getRemainingStock("en");
    const next = await decrementStockAfterOrder("en", 3);
    expect(next).toBe(22);
  });

  it("can go negative once sold out, without throwing", async () => {
    store.set("peep:story-stock:ar", 0);
    const next = await decrementStockAfterOrder("ar", 1);
    expect(next).toBe(-1);
  });
});

describe("isPreOrder", () => {
  it("is false while stock remains", () => {
    expect(isPreOrder(5)).toBe(false);
  });

  it("is true at exactly zero remaining", () => {
    expect(isPreOrder(0)).toBe(true);
  });

  it("is true once oversold (negative remaining)", () => {
    expect(isPreOrder(-2)).toBe(true);
  });
});

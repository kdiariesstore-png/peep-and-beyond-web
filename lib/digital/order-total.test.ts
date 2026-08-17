// lib/digital/order-total.test.ts
import { describe, expect, it } from "vitest";
import { calculateDigitalOrderTotal } from "./order-total";
import type { DigitalCartItem } from "./types";

describe("calculateDigitalOrderTotal", () => {
  it("sums item prices with no shipping line", () => {
    const items: DigitalCartItem[] = [
      { id: "sleep-bedtime", language: "ar", unitPriceBhd: 2.7 },
      { id: "potty-training", language: "en", unitPriceBhd: 2.7 },
    ];
    const result = calculateDigitalOrderTotal(items);
    expect(result.subtotalBhd).toBe(5.4);
    expect(result.totalBhd).toBe(5.4);
  });

  it("returns zero for an empty cart", () => {
    const result = calculateDigitalOrderTotal([]);
    expect(result.subtotalBhd).toBe(0);
    expect(result.totalBhd).toBe(0);
  });

  it("rounds to 3 decimal places", () => {
    const items: DigitalCartItem[] = [
      { id: "sleep-bedtime", language: "ar", unitPriceBhd: 0.1 },
      { id: "potty-training", language: "ar", unitPriceBhd: 0.2 },
    ];
    expect(calculateDigitalOrderTotal(items).subtotalBhd).toBe(0.3);
  });
});

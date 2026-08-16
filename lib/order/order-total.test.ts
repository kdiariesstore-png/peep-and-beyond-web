import { describe, expect, it } from "vitest";
import { calculateOrderTotal } from "./order-total";
import type { CartItem } from "../types";

const item: CartItem = {
  id: "1",
  customization: {
    storyLanguage: "ar",
    cardLanguage: "ar",
    cupColor: "pink",
    childName: "سارة",
    giftCard: false,
  },
  unitPriceBhd: 21.9,
  quantity: 2,
};

describe("calculateOrderTotal", () => {
  it("computes subtotal, shipping, and total for Bahrain", () => {
    const result = calculateOrderTotal([item], "BH");
    expect(result.subtotalBhd).toBe(43.8);
    expect(result.shippingBhd).toBe(2.0);
    expect(result.totalBhd).toBe(45.8);
  });

  it("returns null shipping and total for a country with no rate yet", () => {
    const result = calculateOrderTotal([item], "SA");
    expect(result.subtotalBhd).toBe(43.8);
    expect(result.shippingBhd).toBeNull();
    expect(result.totalBhd).toBeNull();
  });

  it("returns a zero subtotal for an empty cart", () => {
    const result = calculateOrderTotal([], "BH");
    expect(result.subtotalBhd).toBe(0);
    expect(result.totalBhd).toBe(2.0);
  });
});

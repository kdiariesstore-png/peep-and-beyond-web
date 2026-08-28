import { describe, expect, it, vi, afterEach } from "vitest";
import { calculateOrderTotal, calculateOrderTotalWithLiveShipping } from "./order-total";
import * as oreemClient from "../payments/oreem-client";
import type { CartItem } from "../types";

const item: CartItem = {
  id: "1",
  productId: "peep-box",
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

describe("calculateOrderTotalWithLiveShipping", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the flat Bahrain rate without calling Oreem", async () => {
    const result = await calculateOrderTotalWithLiveShipping([item], "BH", "Manama");
    expect(result).toEqual({ subtotalBhd: 43.8, shippingBhd: 2.0, totalBhd: 45.8 });
  });

  it("resolves international shipping from the live Oreem quote", async () => {
    vi.spyOn(oreemClient, "fetchShippingRates").mockResolvedValue([
      { serviceName: "Aramex Economy", serviceCode: "aramex_economy", amountBhd: 8.5 },
    ]);

    const result = await calculateOrderTotalWithLiveShipping([item], "SA", "Jeddah");
    expect(result).toEqual({ subtotalBhd: 43.8, shippingBhd: 8.5, totalBhd: 52.3 });
  });

  it("leaves shipping and total null when Oreem has no rate for the destination", async () => {
    vi.spyOn(oreemClient, "fetchShippingRates").mockResolvedValue([]);

    const result = await calculateOrderTotalWithLiveShipping([item], "ZZ", undefined);
    expect(result).toEqual({ subtotalBhd: 43.8, shippingBhd: null, totalBhd: null });
  });
});

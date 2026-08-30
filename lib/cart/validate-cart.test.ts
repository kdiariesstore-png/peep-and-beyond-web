import { describe, expect, it } from "vitest";
import { normalizePhysicalCartItems } from "./validate-cart";
import type { CartItem } from "../types";

const base: CartItem = {
  id: "box-1",
  kind: "ready-to-gift",
  customization: {
    storyLanguage: "ar",
    cardLanguage: "ar",
    cupColor: "pink",
    childName: "نور",
    giftCard: true,
  },
  selectedProductIds: ["story", "puzzle", "magnetic-map", "coloring-book", "alphabet-cards"],
  unitPriceBhd: 0.001,
  quantity: 1,
};

describe("normalizePhysicalCartItems", () => {
  it("accepts a builder with five unique products and replaces a tampered client price", () => {
    const result = normalizePhysicalCartItems([base]);
    expect(result).not.toBeNull();
    expect(result?.[0].unitPriceBhd).toBe(21.5);
  });

  it("rejects builders with fewer than five products", () => {
    expect(normalizePhysicalCartItems([{ ...base, selectedProductIds: ["story", "puzzle"] }])).toBeNull();
  });

  it("does not count duplicate product ids toward the minimum", () => {
    expect(normalizePhysicalCartItems([{ ...base, selectedProductIds: ["story", "story", "story", "story", "story"] }])).toBeNull();
  });

  it("rejects unknown product ids", () => {
    expect(normalizePhysicalCartItems([{ ...base, selectedProductIds: [...base.selectedProductIds!, "made-up"] }])).toBeNull();
  });

  it("keeps legacy ready-made carts valid and applies the trusted complete-box price", () => {
    const legacy = { ...base, kind: undefined, selectedProductIds: undefined, unitPriceBhd: 1 };
    const result = normalizePhysicalCartItems([legacy]);
    expect(result?.[0].kind).toBe("ready-made");
    expect(result?.[0].unitPriceBhd).toBe(21.9);
  });
});

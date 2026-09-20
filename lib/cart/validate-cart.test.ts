import { describe, expect, it, beforeEach, afterEach } from "vitest";
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
  const originalEnv = process.env.NEXT_PUBLIC_READY_TO_GIFT_AVAILABLE;

  beforeEach(() => {
    // These tests exercise the general builder-validation logic, not the ready-to-gift
    // availability toggle itself (covered separately below) — keep the box available.
    process.env.NEXT_PUBLIC_READY_TO_GIFT_AVAILABLE = "true";
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_READY_TO_GIFT_AVAILABLE;
    } else {
      process.env.NEXT_PUBLIC_READY_TO_GIFT_AVAILABLE = originalEnv;
    }
  });

  it("accepts a builder with five unique products and replaces a tampered client price", () => {
    const result = normalizePhysicalCartItems([base]);
    expect(result).not.toBeNull();
    expect(result?.[0].unitPriceBhd).toBe(21);
  });

  it("rejects premium gift builders with fewer than five products", () => {
    expect(normalizePhysicalCartItems([{ ...base, selectedProductIds: ["story", "puzzle"] }])).toBeNull();
  });

  it("accepts a build-your-own box with three unique products", () => {
    const result = normalizePhysicalCartItems([{ ...base, kind: "build-your-own", selectedProductIds: ["story", "puzzle", "stickers"] }]);
    expect(result?.[0].unitPriceBhd).toBe(7.9);
  });

  it("accepts one standalone product and restores its trusted price", () => {
    const result = normalizePhysicalCartItems([{ ...base, kind: "individual-product", selectedProductIds: ["clothes-activity-book"] }]);
    expect(result?.[0].unitPriceBhd).toBe(5);
  });

  it("rejects a standalone item carrying more than one product id", () => {
    expect(normalizePhysicalCartItems([{ ...base, kind: "individual-product", selectedProductIds: ["story", "cup"] }])).toBeNull();
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
    expect(result?.[0].unitPriceBhd).toBe(24.6);
  });
});

describe("ready-to-gift availability", () => {
  const originalEnv = process.env.NEXT_PUBLIC_READY_TO_GIFT_AVAILABLE;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_READY_TO_GIFT_AVAILABLE;
    } else {
      process.env.NEXT_PUBLIC_READY_TO_GIFT_AVAILABLE = originalEnv;
    }
  });

  it("rejects a ready-to-gift item when the box is paused (unset)", () => {
    delete process.env.NEXT_PUBLIC_READY_TO_GIFT_AVAILABLE;
    expect(normalizePhysicalCartItems([base])).toBeNull();
  });

  it("rejects a ready-to-gift item when explicitly disabled", () => {
    process.env.NEXT_PUBLIC_READY_TO_GIFT_AVAILABLE = "false";
    expect(normalizePhysicalCartItems([base])).toBeNull();
  });

  it("accepts a ready-to-gift item once re-enabled", () => {
    process.env.NEXT_PUBLIC_READY_TO_GIFT_AVAILABLE = "true";
    expect(normalizePhysicalCartItems([base])).not.toBeNull();
  });

  it("does not affect other box kinds", () => {
    delete process.env.NEXT_PUBLIC_READY_TO_GIFT_AVAILABLE;
    const buildYourOwn = { ...base, kind: "build-your-own" as const, selectedProductIds: ["story", "puzzle", "stickers"] };
    expect(normalizePhysicalCartItems([buildYourOwn])).not.toBeNull();
  });
});

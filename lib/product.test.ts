import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  BUILDER_PRODUCTS,
  CUSTOM_BOX_MIN_PRODUCTS,
  GIFT_BOX_BASE_PRICE_BHD,
  GIFT_BOX_MIN_PRODUCTS,
  PEEP_BOX_PRODUCT,
  calculateBuilderPrice,
  createDefaultCustomization,
  getBuilderMinProducts,
  isPhysicalBoxAvailable,
  isReadyToGiftAvailable,
} from "./product";

describe("PEEP_BOX_PRODUCT", () => {
  it("has the correct price", () => {
    expect(PEEP_BOX_PRODUCT.priceBhd).toBe(24.6);
  });

  it("lists eight box contents in Arabic and English, kept in sync", () => {
    expect(PEEP_BOX_PRODUCT.contents.ar).toHaveLength(8);
    expect(PEEP_BOX_PRODUCT.contents.en).toHaveLength(8);
  });
});

describe("builder catalog", () => {
  it("uses a three-product minimum for custom boxes and five for premium gift boxes", () => {
    expect(CUSTOM_BOX_MIN_PRODUCTS).toBe(3);
    expect(GIFT_BOX_MIN_PRODUCTS).toBe(5);
    expect(GIFT_BOX_BASE_PRICE_BHD).toBe(4);
    expect(getBuilderMinProducts("build-your-own")).toBe(3);
    expect(getBuilderMinProducts("ready-to-gift")).toBe(5);
    expect(BUILDER_PRODUCTS.length).toBeGreaterThanOrEqual(GIFT_BOX_MIN_PRODUCTS);
  });

  it("calculates the custom box from selected products without an extra box fee", () => {
    expect(calculateBuilderPrice("build-your-own", ["story", "puzzle", "stickers"])).toBe(7.9);
  });

  it("applies the premium box fee and 10% discount only above five products", () => {
    const five = ["story", "puzzle", "magnetic-map", "coloring-book", "alphabet-cards"] as const;
    expect(calculateBuilderPrice("ready-to-gift", five)).toBe(21);
    expect(calculateBuilderPrice("ready-to-gift", [...five, "cup"])).toBe(22.23);
  });
});

describe("isPhysicalBoxAvailable", () => {
  const original = process.env.NEXT_PUBLIC_PHYSICAL_BOX_AVAILABLE;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_PHYSICAL_BOX_AVAILABLE;
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_PHYSICAL_BOX_AVAILABLE;
    } else {
      process.env.NEXT_PUBLIC_PHYSICAL_BOX_AVAILABLE = original;
    }
  });

  it("defaults to available when the env var is unset", () => {
    expect(isPhysicalBoxAvailable()).toBe(true);
  });

  it("is unavailable only when explicitly set to \"false\"", () => {
    process.env.NEXT_PUBLIC_PHYSICAL_BOX_AVAILABLE = "false";
    expect(isPhysicalBoxAvailable()).toBe(false);
  });

  it("stays available for any other value", () => {
    process.env.NEXT_PUBLIC_PHYSICAL_BOX_AVAILABLE = "true";
    expect(isPhysicalBoxAvailable()).toBe(true);
  });
});

describe("isReadyToGiftAvailable", () => {
  const original = process.env.NEXT_PUBLIC_READY_TO_GIFT_AVAILABLE;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_READY_TO_GIFT_AVAILABLE;
    } else {
      process.env.NEXT_PUBLIC_READY_TO_GIFT_AVAILABLE = original;
    }
  });

  it("defaults to unavailable when the env var is unset", () => {
    delete process.env.NEXT_PUBLIC_READY_TO_GIFT_AVAILABLE;
    expect(isReadyToGiftAvailable()).toBe(false);
  });

  it("is available only when explicitly set to \"true\"", () => {
    process.env.NEXT_PUBLIC_READY_TO_GIFT_AVAILABLE = "true";
    expect(isReadyToGiftAvailable()).toBe(true);
  });

  it("stays unavailable for any other value", () => {
    process.env.NEXT_PUBLIC_READY_TO_GIFT_AVAILABLE = "false";
    expect(isReadyToGiftAvailable()).toBe(false);
  });
});

describe("createDefaultCustomization", () => {
  it("defaults to Arabic story/card language and pink cup", () => {
    expect(createDefaultCustomization()).toEqual({
      storyLanguage: "ar",
      cardLanguage: "ar",
      cupColor: "pink",
      childName: "",
      giftCard: false,
    });
  });
});

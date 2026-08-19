import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  PEEP_BOX_PRODUCT,
  PEEP_BOX_CHARGEABLE_WEIGHT_KG,
  createDefaultCustomization,
  isPhysicalBoxAvailable,
} from "./product";

describe("PEEP_BOX_PRODUCT", () => {
  it("has the correct launch price and original price", () => {
    expect(PEEP_BOX_PRODUCT.priceBhd).toBe(24.9);
    expect(PEEP_BOX_PRODUCT.originalPriceBhd).toBe(28.9);
  });

  it("lists eight box contents in Arabic and English, kept in sync", () => {
    expect(PEEP_BOX_PRODUCT.contents.ar).toHaveLength(8);
    expect(PEEP_BOX_PRODUCT.contents.en).toHaveLength(8);
  });
});

describe("PEEP_BOX_CHARGEABLE_WEIGHT_KG", () => {
  it("uses the volumetric weight from the 34x35x14 package, since it exceeds the 1.1kg actual weight", () => {
    // (34*35*14)/5000 = 3.332kg
    expect(PEEP_BOX_CHARGEABLE_WEIGHT_KG).toBeCloseTo(3.332, 5);
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

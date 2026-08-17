import { describe, expect, it } from "vitest";
import { DIGITAL_PRODUCTS, DIGITAL_BUNDLE, getDigitalProductPrice, digitalFileName } from "./catalog";

describe("DIGITAL_PRODUCTS", () => {
  it("has exactly 7 topics, each priced at 2.700 BHD with Arabic and English names", () => {
    expect(DIGITAL_PRODUCTS).toHaveLength(7);
    for (const product of DIGITAL_PRODUCTS) {
      expect(product.priceBhd).toBe(2.7);
      expect(product.nameAr.length).toBeGreaterThan(0);
      expect(product.nameEn.length).toBeGreaterThan(0);
    }
  });

  it("has unique ids", () => {
    const ids = DIGITAL_PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("DIGITAL_BUNDLE", () => {
  it("is priced at 12.000 BHD and includes all 7 product ids", () => {
    expect(DIGITAL_BUNDLE.priceBhd).toBe(12.0);
    expect(DIGITAL_BUNDLE.includes).toEqual(DIGITAL_PRODUCTS.map((p) => p.id));
  });
});

describe("getDigitalProductPrice", () => {
  it("resolves the price for an individual topic and for the bundle", () => {
    expect(getDigitalProductPrice("sleep-bedtime")).toBe(2.7);
    expect(getDigitalProductPrice("digital-bundle")).toBe(12.0);
  });
});

describe("digitalFileName", () => {
  it("builds the source PDF filename for a topic and language", () => {
    expect(digitalFileName("sleep-bedtime", "ar")).toBe("sleep-bedtime-ar.pdf");
    expect(digitalFileName("sleep-bedtime", "en")).toBe("sleep-bedtime-en.pdf");
  });
});

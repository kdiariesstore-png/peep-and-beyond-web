import { describe, expect, it } from "vitest";
import {
  DIGITAL_PRODUCTS,
  DIGITAL_BUNDLE,
  SCHOOL_SEASON_BUNDLE,
  DIGITAL_BUNDLES,
  getDigitalProductPrice,
  digitalFileName,
} from "./catalog";

describe("DIGITAL_PRODUCTS", () => {
  it("has exactly 8 topics, each priced at 2.990 BHD with Arabic and English names", () => {
    expect(DIGITAL_PRODUCTS).toHaveLength(8);
    for (const product of DIGITAL_PRODUCTS) {
      expect(product.priceBhd).toBe(2.99);
      expect(product.nameAr.length).toBeGreaterThan(0);
      expect(product.nameEn.length).toBeGreaterThan(0);
    }
  });

  it("has unique ids", () => {
    const ids = DIGITAL_PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes the school-season-toolkit topic", () => {
    expect(DIGITAL_PRODUCTS.some((p) => p.id === "school-season-toolkit")).toBe(true);
  });
});

describe("DIGITAL_BUNDLE", () => {
  it("is priced at 13.990 BHD and includes the 7 general-topic guides, not the seasonal toolkit", () => {
    expect(DIGITAL_BUNDLE.priceBhd).toBe(13.99);
    expect(DIGITAL_BUNDLE.includes).toHaveLength(7);
    expect(DIGITAL_BUNDLE.includes).not.toContain("school-season-toolkit");
  });
});

describe("SCHOOL_SEASON_BUNDLE", () => {
  it("is priced at 3.900 BHD and includes exactly the toolkit and the starting-school guide", () => {
    expect(SCHOOL_SEASON_BUNDLE.priceBhd).toBe(3.9);
    expect(SCHOOL_SEASON_BUNDLE.includes).toEqual(["school-season-toolkit", "starting-school"]);
  });
});

describe("DIGITAL_BUNDLES", () => {
  it("lists both bundles", () => {
    expect(DIGITAL_BUNDLES).toEqual([DIGITAL_BUNDLE, SCHOOL_SEASON_BUNDLE]);
  });
});

describe("getDigitalProductPrice", () => {
  it("resolves the price for an individual topic and for each bundle", () => {
    expect(getDigitalProductPrice("sleep-bedtime")).toBe(2.99);
    expect(getDigitalProductPrice("school-season-toolkit")).toBe(2.99);
    expect(getDigitalProductPrice("digital-bundle")).toBe(13.99);
    expect(getDigitalProductPrice("school-season-bundle")).toBe(3.9);
  });
});

describe("digitalFileName", () => {
  it("builds the source PDF filename for a topic and language", () => {
    expect(digitalFileName("sleep-bedtime", "ar")).toBe("sleep-bedtime-ar.pdf");
    expect(digitalFileName("sleep-bedtime", "en")).toBe("sleep-bedtime-en.pdf");
  });
});

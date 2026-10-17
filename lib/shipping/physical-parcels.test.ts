import { describe, expect, it } from "vitest";
import type { CartItem } from "../types";
import { BUILDER_PRODUCTS, PEEP_BOX_PRODUCT } from "../product";
import {
  BOX_OUTER_PACKAGING_WEIGHT_GRAMS,
  MAILER_PACKAGING_WEIGHT_GRAMS,
  buildPhysicalShippingParcels,
} from "./physical-parcels";

const customization = {
  storyLanguage: "ar" as const,
  cardLanguage: "ar" as const,
  cupColor: "pink" as const,
  childName: "",
  giftCard: false,
};

function item(overrides: Partial<CartItem>): CartItem {
  return {
    id: "item",
    kind: "ready-made",
    customization,
    unitPriceBhd: 24.6,
    quantity: 1,
    ...overrides,
  };
}

describe("physical shipping measurements", () => {
  it("stores every measured product weight and gives the clothes booklet the cards weight", () => {
    expect(BUILDER_PRODUCTS).toHaveLength(11);
    for (const product of BUILDER_PRODUCTS) {
      expect(product.shipping.weightGrams).toBeGreaterThan(0);
      expect(product.shipping.dimensionsCm.length).toBeGreaterThan(0);
      expect(product.shipping.dimensionsCm.width).toBeGreaterThan(0);
      expect(product.shipping.dimensionsCm.height).toBeGreaterThan(0);
    }
    expect(
      Object.fromEntries(
        BUILDER_PRODUCTS.map((product) => [product.id, product.shipping.weightGrams])
      )
    ).toEqual({
      story: 177,
      puzzle: 140,
      "magnetic-map": 91,
      "coloring-book": 37,
      "lulu-coloring-book": 37,
      "alphabet-cards": 96,
      cup: 157,
      stickers: 6,
      "lulu-stickers": 6,
      "clothes-activity-book": 96,
      "welcome-card": 2,
    });
  });

  it("uses the measured empty box and adds 2 cm of protection on every side", () => {
    const [parcel] = buildPhysicalShippingParcels([item({})]);
    expect(PEEP_BOX_PRODUCT.shipping.emptyBoxWeightGrams).toBe(498);
    expect(parcel.dimensionsCm).toEqual({ length: 39, width: 30, height: 14 });
    expect(parcel.actualWeightKg).toBe(1.264);
    expect(parcel.chargeableWeightKg).toBe(3.276);
    expect(parcel.packaging).toBe("box");
  });

  it("estimates a fitted box for selected products and includes outer packaging weight", () => {
    const [parcel] = buildPhysicalShippingParcels([
      item({
        kind: "build-your-own",
        selectedProductIds: ["story", "puzzle", "magnetic-map"],
      }),
    ]);
    expect(parcel.packaging).toBe("box");
    expect(parcel.actualWeightKg * 1000).toBeGreaterThan(
      177 + 140 + 91 + BOX_OUTER_PACKAGING_WEIGHT_GRAMS
    );
    expect(parcel.dimensionsCm.length).toBeGreaterThanOrEqual(34.7);
    expect(parcel.dimensionsCm.width).toBeGreaterThanOrEqual(28);
  });

  it("combines standalone products in bubble wrap and a mailer without adding a box", () => {
    const [parcel] = buildPhysicalShippingParcels([
      item({
        kind: "individual-product",
        selectedProductIds: ["story"],
        unitPriceBhd: 3.5,
        quantity: 1,
      }),
      item({
        id: "stickers",
        kind: "individual-product",
        selectedProductIds: ["stickers"],
        unitPriceBhd: 0.9,
        quantity: 2,
      }),
    ]);
    expect(parcel.packaging).toBe("mailer");
    expect(parcel.qty).toBe(1);
    expect(parcel.actualWeightKg).toBe(
      (177 + 6 + 6 + MAILER_PACKAGING_WEIGHT_GRAMS) / 1000
    );
  });
});

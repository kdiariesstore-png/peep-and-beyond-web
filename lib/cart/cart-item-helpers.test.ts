import { describe, expect, it } from "vitest";
import {
  getItemStoryLanguage,
  isValidCartItemsPayload,
  buildShippingParcels,
} from "./cart-item-helpers";
import type { BoxCartItem, StoryCartItem } from "../types";
import { PEEP_BOX_CHARGEABLE_WEIGHT_KG, PEEP_STORY_CHARGEABLE_WEIGHT_KG } from "../product";

const boxItem: BoxCartItem = {
  id: "1",
  productId: "peep-box",
  customization: {
    storyLanguage: "ar",
    cardLanguage: "ar",
    cupColor: "pink",
    childName: "سارة",
    giftCard: false,
  },
  unitPriceBhd: 24.9,
  quantity: 2,
};

const storyItem: StoryCartItem = {
  id: "2",
  productId: "peep-story",
  storyLanguage: "en",
  unitPriceBhd: 5,
  quantity: 3,
};

describe("getItemStoryLanguage", () => {
  it("reads the story language out of a box item's customization", () => {
    expect(getItemStoryLanguage(boxItem)).toBe("ar");
  });

  it("reads the story language directly off a standalone story item", () => {
    expect(getItemStoryLanguage(storyItem)).toBe("en");
  });
});

describe("isValidCartItemsPayload", () => {
  it("accepts a well-formed mix of box and story items", () => {
    expect(isValidCartItemsPayload([boxItem, storyItem])).toBe(true);
  });

  it("accepts an empty cart", () => {
    expect(isValidCartItemsPayload([])).toBe(true);
  });

  it("rejects a non-array", () => {
    expect(isValidCartItemsPayload({})).toBe(false);
    expect(isValidCartItemsPayload(null)).toBe(false);
  });

  it("rejects an unrecognised productId", () => {
    expect(isValidCartItemsPayload([{ ...storyItem, productId: "something-else" }])).toBe(false);
  });

  it("rejects a box item with a malformed story language", () => {
    expect(
      isValidCartItemsPayload([
        { ...boxItem, customization: { ...boxItem.customization, storyLanguage: "fr" } },
      ])
    ).toBe(false);
  });

  it("rejects a story item with a malformed story language", () => {
    expect(isValidCartItemsPayload([{ ...storyItem, storyLanguage: "fr" }])).toBe(false);
  });

  it("rejects a non-integer or non-positive quantity", () => {
    expect(isValidCartItemsPayload([{ ...storyItem, quantity: 0 }])).toBe(false);
    expect(isValidCartItemsPayload([{ ...storyItem, quantity: 1.5 }])).toBe(false);
    expect(isValidCartItemsPayload([{ ...storyItem, quantity: "2" }])).toBe(false);
  });
});

describe("buildShippingParcels", () => {
  it("returns one parcel line for a box-only cart", () => {
    expect(buildShippingParcels([boxItem])).toEqual([
      { chargeableWeightKg: PEEP_BOX_CHARGEABLE_WEIGHT_KG, qty: 2 },
    ]);
  });

  it("returns one parcel line for a story-only cart", () => {
    expect(buildShippingParcels([storyItem])).toEqual([
      { chargeableWeightKg: PEEP_STORY_CHARGEABLE_WEIGHT_KG, qty: 3 },
    ]);
  });

  it("returns two parcel lines for a mixed box + story cart", () => {
    expect(buildShippingParcels([boxItem, storyItem])).toEqual([
      { chargeableWeightKg: PEEP_BOX_CHARGEABLE_WEIGHT_KG, qty: 2 },
      { chargeableWeightKg: PEEP_STORY_CHARGEABLE_WEIGHT_KG, qty: 3 },
    ]);
  });

  it("sums quantities across multiple lines of the same product", () => {
    const secondBoxLine: BoxCartItem = { ...boxItem, id: "3", quantity: 1 };
    expect(buildShippingParcels([boxItem, secondBoxLine])).toEqual([
      { chargeableWeightKg: PEEP_BOX_CHARGEABLE_WEIGHT_KG, qty: 3 },
    ]);
  });

  it("returns an empty array for an empty cart", () => {
    expect(buildShippingParcels([])).toEqual([]);
  });
});

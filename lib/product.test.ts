import { describe, expect, it } from "vitest";
import { PEEP_BOX_PRODUCT, createDefaultCustomization } from "./product";

describe("PEEP_BOX_PRODUCT", () => {
  it("has the correct price", () => {
    expect(PEEP_BOX_PRODUCT.priceBhd).toBe(21.9);
  });

  it("lists the seven box contents", () => {
    expect(PEEP_BOX_PRODUCT.contents).toHaveLength(7);
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

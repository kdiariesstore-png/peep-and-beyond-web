import { describe, expect, it } from "vitest";
import { buildCartItem, buildStoryCartItem } from "./build-cart-item";

describe("buildCartItem", () => {
  it("wraps a customization into a peep-box cart item with quantity 1 and the box price", () => {
    const item = buildCartItem({
      storyLanguage: "en",
      cardLanguage: "ar",
      cupColor: "blue",
      childName: "Omar",
      giftCard: true,
    });

    expect(item.productId).toBe("peep-box");
    if (item.productId !== "peep-box") throw new Error("expected a box item");
    expect(item.customization.childName).toBe("Omar");
    expect(item.unitPriceBhd).toBe(24.9);
    expect(item.quantity).toBe(1);
    expect(typeof item.id).toBe("string");
    expect(item.id.length).toBeGreaterThan(0);
  });

  it("generates a different id on each call", () => {
    const customization = {
      storyLanguage: "ar" as const,
      cardLanguage: "ar" as const,
      cupColor: "pink" as const,
      childName: "سارة",
      giftCard: false,
    };
    const a = buildCartItem(customization);
    const b = buildCartItem(customization);
    expect(a.id).not.toBe(b.id);
  });
});

describe("buildStoryCartItem", () => {
  it("wraps a story language into a peep-story cart item with quantity 1 and the story price", () => {
    const item = buildStoryCartItem("en");

    expect(item.productId).toBe("peep-story");
    if (item.productId !== "peep-story") throw new Error("expected a story item");
    expect(item.storyLanguage).toBe("en");
    expect(item.unitPriceBhd).toBe(5);
    expect(item.quantity).toBe(1);
    expect(typeof item.id).toBe("string");
    expect(item.id.length).toBeGreaterThan(0);
  });

  it("generates a different id on each call", () => {
    const a = buildStoryCartItem("ar");
    const b = buildStoryCartItem("ar");
    expect(a.id).not.toBe(b.id);
  });
});

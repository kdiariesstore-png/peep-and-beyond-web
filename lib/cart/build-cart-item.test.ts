import { describe, expect, it } from "vitest";
import { buildCartItem, buildIndividualProductCartItem } from "./build-cart-item";

describe("buildCartItem", () => {
  it("wraps a customization into a cart item with quantity 1 and the box price", () => {
    const item = buildCartItem({
      storyLanguage: "en",
      cardLanguage: "ar",
      cupColor: "blue",
      childName: "Omar",
      giftCard: true,
    });

    expect(item.customization.childName).toBe("Omar");
    expect(item.unitPriceBhd).toBe(24.6);
    expect(item.quantity).toBe(1);
    expect(typeof item.id).toBe("string");
    expect(item.id.length).toBeGreaterThan(0);
  });

  it("builds a standalone product item using the catalog price", () => {
    const item = buildIndividualProductCartItem("lulu-stickers", {
      storyLanguage: "ar",
      cardLanguage: "ar",
      cupColor: "pink",
      childName: "",
      giftCard: false,
    });
    expect(item.kind).toBe("individual-product");
    expect(item.selectedProductIds).toEqual(["lulu-stickers"]);
    expect(item.unitPriceBhd).toBe(0.9);
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

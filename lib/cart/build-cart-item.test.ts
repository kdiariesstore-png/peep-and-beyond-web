import { describe, expect, it } from "vitest";
import { buildCartItem } from "./build-cart-item";

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
    expect(item.unitPriceBhd).toBe(21.9);
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

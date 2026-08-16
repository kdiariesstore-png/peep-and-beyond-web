import { describe, expect, it } from "vitest";
import { deserializeCart, serializeCart } from "./cart-storage";
import type { CartItem } from "../types";

const sampleItem: CartItem = {
  id: "abc123",
  customization: {
    storyLanguage: "ar",
    cardLanguage: "ar",
    cupColor: "pink",
    childName: "سارة",
    giftCard: false,
  },
  unitPriceBhd: 21.9,
  quantity: 1,
};

describe("serializeCart / deserializeCart", () => {
  it("round-trips a cart through serialization", () => {
    const serialized = serializeCart([sampleItem]);
    expect(deserializeCart(serialized)).toEqual([sampleItem]);
  });

  it("returns an empty array for null input", () => {
    expect(deserializeCart(null)).toEqual([]);
  });

  it("returns an empty array for invalid JSON instead of throwing", () => {
    expect(deserializeCart("{not json")).toEqual([]);
  });

  it("returns an empty array if the parsed value isn't an array", () => {
    expect(deserializeCart('{"foo":"bar"}')).toEqual([]);
  });
});

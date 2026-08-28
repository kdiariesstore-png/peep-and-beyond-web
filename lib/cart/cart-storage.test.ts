import { describe, expect, it } from "vitest";
import { deserializeCart, serializeCart } from "./cart-storage";
import type { CartItem } from "../types";

const sampleBoxItem: CartItem = {
  id: "abc123",
  productId: "peep-box",
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

const sampleStoryItem: CartItem = {
  id: "def456",
  productId: "peep-story",
  storyLanguage: "en",
  unitPriceBhd: 5,
  quantity: 2,
};

describe("serializeCart / deserializeCart", () => {
  it("round-trips a cart through serialization", () => {
    const serialized = serializeCart([sampleBoxItem]);
    expect(deserializeCart(serialized)).toEqual([sampleBoxItem]);
  });

  it("round-trips a mixed box + story cart", () => {
    const serialized = serializeCart([sampleBoxItem, sampleStoryItem]);
    expect(deserializeCart(serialized)).toEqual([sampleBoxItem, sampleStoryItem]);
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

  it("filters out malformed items and keeps only valid cart items", () => {
    const malformed = { foo: 1 };
    const serialized = JSON.stringify([sampleBoxItem, sampleStoryItem, malformed]);
    expect(deserializeCart(serialized)).toEqual([sampleBoxItem, sampleStoryItem]);
  });

  it("drops a box item with an unrecognised productId", () => {
    const serialized = JSON.stringify([{ ...sampleBoxItem, productId: "something-else" }]);
    expect(deserializeCart(serialized)).toEqual([]);
  });

  it("drops a story item with a malformed storyLanguage", () => {
    const serialized = JSON.stringify([{ ...sampleStoryItem, storyLanguage: "fr" }]);
    expect(deserializeCart(serialized)).toEqual([]);
  });
});

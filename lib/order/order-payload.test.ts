import { describe, expect, it } from "vitest";
import { encodeOrderPayload, decodeOrderPayload, type PendingOrderPayload } from "./order-payload";
import type { BoxCartItem } from "../types";

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
  unitPriceBhd: 21.9,
  quantity: 1,
};

const payload: PendingOrderPayload = {
  txnRef: "peep_abc123",
  buyer: {
    fullName: "سارة أحمد",
    email: "sara@example.com",
    phone: "33001122",
    country: "BH",
    city: "المنامة",
    address: "شارع 10",
    marketingOptIn: false,
  },
  items: [boxItem],
  subtotalBhd: 21.9,
  shippingBhd: 2.0,
  totalBhd: 23.9,
};

describe("encodeOrderPayload / decodeOrderPayload", () => {
  it("round-trips a payload including Arabic text through base64url", () => {
    const encoded = encodeOrderPayload(payload);
    expect(decodeOrderPayload(encoded)).toEqual(payload);
  });

  it("produces a URL-safe string (no +, /, or = characters)", () => {
    const encoded = encodeOrderPayload(payload);
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("returns null for garbage input instead of throwing", () => {
    expect(decodeOrderPayload("not-valid-base64-json")).toBeNull();
  });

  it("returns null when the decoded JSON has no txnRef", () => {
    const encoded = Buffer.from(JSON.stringify({ foo: "bar" }), "utf-8").toString("base64url");
    expect(decodeOrderPayload(encoded)).toBeNull();
  });

  it("returns null when items is missing or is not an array", () => {
    const missingItems = Buffer.from(
      JSON.stringify({ txnRef: "peep_abc123", buyer: payload.buyer, totalBhd: 23.9 }),
      "utf-8"
    ).toString("base64url");
    expect(decodeOrderPayload(missingItems)).toBeNull();

    const itemsNotArray = Buffer.from(
      JSON.stringify({ txnRef: "peep_abc123", buyer: payload.buyer, items: "oops" }),
      "utf-8"
    ).toString("base64url");
    expect(decodeOrderPayload(itemsNotArray)).toBeNull();
  });

  it("returns null when buyer is missing or is not an object", () => {
    const missingBuyer = Buffer.from(
      JSON.stringify({ txnRef: "peep_abc123", items: [] }),
      "utf-8"
    ).toString("base64url");
    expect(decodeOrderPayload(missingBuyer)).toBeNull();
  });

  // The confirmation page formats these amounts (e.g. totalBhd.toFixed(3)) *after* a real
  // payment has already been taken, outside any try/catch — a non-numeric amount here
  // crashes a page that should be showing a successful order.
  it("returns null when any money field is not a finite number", () => {
    const encodeRaw = (value: unknown) =>
      Buffer.from(JSON.stringify(value), "utf-8").toString("base64url");

    expect(decodeOrderPayload(encodeRaw({ ...payload, totalBhd: null }))).toBeNull();
    expect(decodeOrderPayload(encodeRaw({ ...payload, totalBhd: "23.900" }))).toBeNull();
    expect(decodeOrderPayload(encodeRaw({ ...payload, subtotalBhd: undefined }))).toBeNull();
    expect(decodeOrderPayload(encodeRaw({ ...payload, shippingBhd: "free" }))).toBeNull();
  });

  // Items drive the stock decrement and the order emails; an unrecognised story language
  // or a fractional/zero/negative quantity must never reach either.
  it("returns null when any item has a malformed story language or quantity", () => {
    const withItem = (item: unknown) =>
      Buffer.from(JSON.stringify({ ...payload, items: [item] }), "utf-8").toString("base64url");

    const goodItem = boxItem;

    expect(
      decodeOrderPayload(
        withItem({ ...goodItem, customization: { ...goodItem.customization, storyLanguage: "fr" } })
      )
    ).toBeNull();
    expect(decodeOrderPayload(withItem({ ...goodItem, customization: undefined }))).toBeNull();
    expect(decodeOrderPayload(withItem({ ...goodItem, quantity: 0 }))).toBeNull();
    expect(decodeOrderPayload(withItem({ ...goodItem, quantity: 1.5 }))).toBeNull();
    expect(decodeOrderPayload(withItem({ ...goodItem, quantity: "2" }))).toBeNull();
    expect(decodeOrderPayload(withItem(null))).toBeNull();

    // A well-formed item still decodes, so the guard is not simply rejecting everything.
    expect(decodeOrderPayload(withItem(goodItem))).not.toBeNull();
  });
});

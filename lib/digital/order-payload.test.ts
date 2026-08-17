import { describe, expect, it } from "vitest";
import {
  encodeDigitalOrderPayload,
  decodeDigitalOrderPayload,
  wasDigitalItemPurchased,
  type DigitalPendingOrderPayload,
} from "./order-payload";

const payload: DigitalPendingOrderPayload = {
  txnRef: "peepdigi_abc123",
  buyer: {
    fullName: "سارة أحمد",
    email: "sara@example.com",
    country: "BH",
    marketingOptIn: false,
  },
  items: [
    { id: "sleep-bedtime", language: "ar", unitPriceBhd: 2.7 },
    { id: "potty-training", language: "en", unitPriceBhd: 2.7 },
  ],
  totalBhd: 5.4,
};

describe("encodeDigitalOrderPayload / decodeDigitalOrderPayload", () => {
  it("round-trips a payload including Arabic text through base64url", () => {
    const encoded = encodeDigitalOrderPayload(payload);
    expect(decodeDigitalOrderPayload(encoded)).toEqual(payload);
  });

  it("produces a URL-safe string (no +, /, or = characters)", () => {
    expect(encodeDigitalOrderPayload(payload)).not.toMatch(/[+/=]/);
  });

  it("returns null for garbage input instead of throwing", () => {
    expect(decodeDigitalOrderPayload("not-valid-base64-json")).toBeNull();
  });

  it("returns null when txnRef, buyer, or items is missing or malformed", () => {
    const encodeRaw = (value: unknown) =>
      Buffer.from(JSON.stringify(value), "utf-8").toString("base64url");

    expect(decodeDigitalOrderPayload(encodeRaw({ ...payload, txnRef: undefined }))).toBeNull();
    expect(decodeDigitalOrderPayload(encodeRaw({ ...payload, buyer: undefined }))).toBeNull();
    expect(decodeDigitalOrderPayload(encodeRaw({ ...payload, items: "oops" }))).toBeNull();
  });

  it("returns null when totalBhd is not a finite number", () => {
    const encodeRaw = (value: unknown) =>
      Buffer.from(JSON.stringify(value), "utf-8").toString("base64url");

    expect(decodeDigitalOrderPayload(encodeRaw({ ...payload, totalBhd: "5.4" }))).toBeNull();
    expect(decodeDigitalOrderPayload(encodeRaw({ ...payload, totalBhd: null }))).toBeNull();
  });

  it("returns null when any item has an unknown id, bad language, or non-numeric price", () => {
    const withItem = (item: unknown) =>
      Buffer.from(JSON.stringify({ ...payload, items: [item] }), "utf-8").toString("base64url");

    expect(decodeDigitalOrderPayload(withItem({ id: "not-real", language: "ar", unitPriceBhd: 2.7 }))).toBeNull();
    expect(decodeDigitalOrderPayload(withItem({ id: "sleep-bedtime", language: "fr", unitPriceBhd: 2.7 }))).toBeNull();
    expect(decodeDigitalOrderPayload(withItem({ id: "sleep-bedtime", language: "ar", unitPriceBhd: "2.7" }))).toBeNull();

    // A well-formed item still decodes, so the guard is not simply rejecting everything.
    expect(decodeDigitalOrderPayload(withItem(payload.items[0]))).not.toBeNull();
  });
});

describe("wasDigitalItemPurchased", () => {
  it("returns true for a topic/language bought as its own line", () => {
    expect(wasDigitalItemPurchased(payload, "sleep-bedtime", "ar")).toBe(true);
  });

  it("returns false for a language that wasn't purchased for that topic", () => {
    expect(wasDigitalItemPurchased(payload, "sleep-bedtime", "en")).toBe(false);
  });

  it("returns false for a topic not present in the order at all", () => {
    expect(wasDigitalItemPurchased(payload, "child-hits", "ar")).toBe(false);
  });

  it("returns true for any of the 7 topics when a matching-language bundle was bought", () => {
    const bundlePayload: DigitalPendingOrderPayload = {
      ...payload,
      items: [{ id: "digital-bundle", language: "en", unitPriceBhd: 12.0 }],
    };
    expect(wasDigitalItemPurchased(bundlePayload, "child-hits", "en")).toBe(true);
    expect(wasDigitalItemPurchased(bundlePayload, "child-hits", "ar")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { encodeOrderPayload, decodeOrderPayload, type PendingOrderPayload } from "./order-payload";

const payload: PendingOrderPayload = {
  txnRef: "peep_abc123",
  buyer: {
    fullName: "سارة أحمد",
    email: "sara@example.com",
    phone: "33001122",
    country: "BH",
    city: "المنامة",
    address: "شارع 10",
    preferredContact: "email",
    marketingOptIn: false,
  },
  items: [
    {
      id: "1",
      customization: {
        storyLanguage: "ar",
        cardLanguage: "ar",
        cupColor: "pink",
        childName: "سارة",
        giftCard: false,
      },
      unitPriceBhd: 21.9,
      quantity: 1,
    },
  ],
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
});

import { beforeEach, describe, expect, it } from "vitest";
import {
  encodeDigitalOrderPayload,
  decodeDigitalOrderPayload,
  wasDigitalItemPurchased,
  computeTrustedDigitalTotal,
  type DigitalPendingOrderPayload,
} from "./order-payload";
import type { DigitalCartItem } from "./types";

beforeEach(() => {
  process.env.DIGITAL_ORDER_SECRET = "test-signing-secret";
});

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
    // Sign with a correct signature (using encodeDigitalOrderPayload itself, which
    // doesn't validate shape) so these cases are rejected by the SHAPE check below the
    // signature check, not merely because the signature is missing.
    const encodeRaw = (value: unknown) =>
      encodeDigitalOrderPayload(value as DigitalPendingOrderPayload);

    expect(decodeDigitalOrderPayload(encodeRaw({ ...payload, txnRef: undefined }))).toBeNull();
    expect(decodeDigitalOrderPayload(encodeRaw({ ...payload, buyer: undefined }))).toBeNull();
    expect(decodeDigitalOrderPayload(encodeRaw({ ...payload, items: "oops" }))).toBeNull();
  });

  it("returns null when totalBhd is not a finite number", () => {
    const encodeRaw = (value: unknown) =>
      encodeDigitalOrderPayload(value as DigitalPendingOrderPayload);

    expect(decodeDigitalOrderPayload(encodeRaw({ ...payload, totalBhd: "5.4" }))).toBeNull();
    expect(decodeDigitalOrderPayload(encodeRaw({ ...payload, totalBhd: null }))).toBeNull();
  });

  it("returns null when any item has an unknown id, bad language, or non-numeric price", () => {
    const withItem = (item: unknown) =>
      encodeDigitalOrderPayload({ ...payload, items: [item as DigitalCartItem] });

    expect(decodeDigitalOrderPayload(withItem({ id: "not-real", language: "ar", unitPriceBhd: 2.7 }))).toBeNull();
    expect(decodeDigitalOrderPayload(withItem({ id: "sleep-bedtime", language: "fr", unitPriceBhd: 2.7 }))).toBeNull();
    expect(decodeDigitalOrderPayload(withItem({ id: "sleep-bedtime", language: "ar", unitPriceBhd: "2.7" }))).toBeNull();

    // A well-formed item still decodes, so the guard is not simply rejecting everything.
    expect(decodeDigitalOrderPayload(withItem(payload.items[0]))).not.toBeNull();
  });
});

describe("payload signing", () => {
  // This is the exploit from the whole-branch review: all 7 individual topics cost the
  // same 2.700 BHD, so a customer who legitimately paid for one topic could previously
  // decode the `order` URL param, edit `items` to name a DIFFERENT topic (or the bundle),
  // and re-encode without knowing DIGITAL_ORDER_SECRET. The amount-binding check alone
  // can't catch this since it only validates the TOTAL, not WHICH items it was for.
  it("rejects a payload whose items were swapped after signing, without re-signing", () => {
    const encoded = encodeDigitalOrderPayload(payload);
    const separatorIndex = encoded.lastIndexOf(".");
    const encodedPayloadPart = encoded.slice(0, separatorIndex);
    const signaturePart = encoded.slice(separatorIndex + 1);

    const decodedJson = JSON.parse(Buffer.from(encodedPayloadPart, "base64url").toString("utf-8"));
    // Swap the purchased topic for a different one, keeping the same forged price so a
    // naive amount-only check would still see a matching total.
    decodedJson.items = [{ id: "child-hits", language: "ar", unitPriceBhd: 2.7 }];
    const tamperedEncodedPayload = Buffer.from(JSON.stringify(decodedJson), "utf-8").toString("base64url");

    // Attacker doesn't know DIGITAL_ORDER_SECRET, so they can only reuse the original
    // signature (or omit it) — either way it no longer matches the tampered payload.
    const tampered = `${tamperedEncodedPayload}.${signaturePart}`;

    expect(decodeDigitalOrderPayload(tampered)).toBeNull();
  });

  it("returns null for a payload with no signature segment", () => {
    const encoded = encodeDigitalOrderPayload(payload);
    const separatorIndex = encoded.lastIndexOf(".");
    const encodedPayloadOnly = encoded.slice(0, separatorIndex);

    expect(decodeDigitalOrderPayload(encodedPayloadOnly)).toBeNull();
  });

  it("returns null for a payload with garbage after the signature separator", () => {
    const encoded = encodeDigitalOrderPayload(payload);
    const separatorIndex = encoded.lastIndexOf(".");
    const encodedPayloadPart = encoded.slice(0, separatorIndex);

    expect(decodeDigitalOrderPayload(`${encodedPayloadPart}.not-a-real-signature`)).toBeNull();
    expect(decodeDigitalOrderPayload(`${encodedPayloadPart}.`)).toBeNull();
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

describe("computeTrustedDigitalTotal", () => {
  it("matches an honest payload's totalBhd when unitPriceBhd is not forged", () => {
    expect(computeTrustedDigitalTotal(payload.items)).toBe(5.4);
  });

  it("ignores a forged low unitPriceBhd and recomputes from the catalog price instead", () => {
    // A customer could hand-edit the URL to claim the whole 7-topic bundle
    // (real catalog price 12.0 BHD) cost only 2.7 BHD, the price of one topic.
    // The trusted total must reflect the real catalog price, not this forged claim.
    const forgedItems: DigitalCartItem[] = [{ id: "digital-bundle", language: "ar", unitPriceBhd: 2.7 }];
    expect(computeTrustedDigitalTotal(forgedItems)).toBe(12.0);
  });

  it("sums catalog prices across multiple items and rounds to 3 decimals", () => {
    const items: DigitalCartItem[] = [
      { id: "sleep-bedtime", language: "ar", unitPriceBhd: 999 },
      { id: "potty-training", language: "en", unitPriceBhd: 999 },
      { id: "child-hits", language: "en", unitPriceBhd: 999 },
    ];
    expect(computeTrustedDigitalTotal(items)).toBe(8.1);
  });

  it("returns 0 for an empty items array", () => {
    expect(computeTrustedDigitalTotal([])).toBe(0);
  });
});

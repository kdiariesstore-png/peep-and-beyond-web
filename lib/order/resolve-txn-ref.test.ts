import { describe, expect, it } from "vitest";
import { resolveTxnRef } from "./resolve-txn-ref";

const PATTERN = /^peepdigi_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const VALID = "peepdigi_4e5b01b2-669e-42d1-a017-3d8c4b6d18d5";

describe("resolveTxnRef", () => {
  it("returns the first candidate when it matches", () => {
    expect(resolveTxnRef(PATTERN, VALID, "peepdigi_fallback")).toBe(VALID);
  });

  it("falls back to a later candidate when the first is corrupted", () => {
    // Reproduces Oreem's observed redirect behaviour: our own `ref` param gets a stray
    // "?status=success" appended, but the `txn_ref` param further along the query string
    // still echoes the clean reference.
    expect(resolveTxnRef(PATTERN, `${VALID}?status=success`, VALID)).toBe(VALID);
  });

  it("skips undefined candidates", () => {
    expect(resolveTxnRef(PATTERN, undefined, VALID)).toBe(VALID);
  });

  it("returns undefined when no candidate matches", () => {
    expect(resolveTxnRef(PATTERN, "garbage", undefined)).toBeUndefined();
  });

  it("returns undefined when given no candidates", () => {
    expect(resolveTxnRef(PATTERN)).toBeUndefined();
  });
});

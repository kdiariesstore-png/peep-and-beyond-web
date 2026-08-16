import { describe, expect, it } from "vitest";
import { getShippingRate } from "./shipping-rates";

describe("getShippingRate", () => {
  it("returns the flat 2.000 BHD rate for Bahrain", () => {
    expect(getShippingRate("BH")).toBe(2.0);
  });

  it("returns null for a country with no rate set yet", () => {
    expect(getShippingRate("SA")).toBeNull();
  });

  it("returns null for a completely unmapped country code", () => {
    expect(getShippingRate("ZZ")).toBeNull();
  });
});

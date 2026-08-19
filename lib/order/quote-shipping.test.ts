import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { quoteShippingBhd } from "./quote-shipping";
import * as oreemClient from "../payments/oreem-client";

beforeEach(() => {
  process.env.OREEM_API_TOKEN = "test-token";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("quoteShippingBhd", () => {
  it("returns the flat Bahrain rate without calling Oreem", async () => {
    const spy = vi.spyOn(oreemClient, "fetchShippingRates");
    const result = await quoteShippingBhd("BH", "Manama", 1);
    expect(result).toBe(2.0);
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns 0 for an empty cart regardless of destination", async () => {
    const result = await quoteShippingBhd("SA", "Jeddah", 0);
    expect(result).toBe(0);
  });

  it("returns the cheapest live Oreem rate for a non-Bahrain destination", async () => {
    vi.spyOn(oreemClient, "fetchShippingRates").mockResolvedValue([
      { serviceName: "Aramex Economy", serviceCode: "aramex_economy", amountBhd: 8.5 },
      { serviceName: "SMSA Express", serviceCode: "smsa_xs4", amountBhd: 19.2 },
    ]);

    const result = await quoteShippingBhd("SA", "Jeddah", 2);
    expect(result).toBe(8.5);
  });

  it("returns null when Oreem has no rated service for the destination", async () => {
    vi.spyOn(oreemClient, "fetchShippingRates").mockResolvedValue([]);
    const result = await quoteShippingBhd("ZZ", undefined, 1);
    expect(result).toBeNull();
  });

  it("returns null (fails closed) when the Oreem lookup throws", async () => {
    vi.spyOn(oreemClient, "fetchShippingRates").mockRejectedValue(new Error("network error"));
    const result = await quoteShippingBhd("SA", "Jeddah", 1);
    expect(result).toBeNull();
  });
});

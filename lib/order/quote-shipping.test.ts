import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { quoteShippingBhd } from "./quote-shipping";
import * as oreemClient from "../payments/oreem-client";

const oneParcel = [{ chargeableWeightKg: 1.96, qty: 1 }];
const twoParcels = [{ chargeableWeightKg: 1.96, qty: 2 }];

beforeEach(() => {
  process.env.OREEM_API_TOKEN = "test-token";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("quoteShippingBhd", () => {
  it("returns the flat Bahrain rate without calling Oreem", async () => {
    const spy = vi.spyOn(oreemClient, "fetchShippingRates");
    const result = await quoteShippingBhd("BH", "Manama", oneParcel);
    expect(result).toBe(2.0);
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns 0 for an empty cart regardless of destination", async () => {
    const result = await quoteShippingBhd("SA", "Jeddah", []);
    expect(result).toBe(0);
  });

  it("returns the cheapest live Oreem rate for a non-Bahrain destination", async () => {
    vi.spyOn(oreemClient, "fetchShippingRates").mockResolvedValue([
      { serviceName: "Aramex Economy", serviceCode: "aramex_economy", amountBhd: 8.5 },
      { serviceName: "SMSA Express", serviceCode: "smsa_xs4", amountBhd: 19.2 },
    ]);

    const result = await quoteShippingBhd("SA", "Jeddah", twoParcels);
    expect(result).toBe(8.5);
  });

  it("passes the given parcels straight through to Oreem", async () => {
    const spy = vi
      .spyOn(oreemClient, "fetchShippingRates")
      .mockResolvedValue([{ serviceName: "Aramex", serviceCode: "aramex", amountBhd: 8.5 }]);

    const parcels = [
      { chargeableWeightKg: 1.96, qty: 1 },
      { chargeableWeightKg: 0.2, qty: 2 },
    ];
    await quoteShippingBhd("SA", "Jeddah", parcels);
    expect(spy).toHaveBeenCalledWith({ destCountryCode: "SA", destCity: "Jeddah", parcels });
  });

  it("returns null when Oreem has no rated service for the destination", async () => {
    vi.spyOn(oreemClient, "fetchShippingRates").mockResolvedValue([]);
    const result = await quoteShippingBhd("ZZ", undefined, oneParcel);
    expect(result).toBeNull();
  });

  it("returns null without calling Oreem when the destination city is missing or blank", async () => {
    const spy = vi.spyOn(oreemClient, "fetchShippingRates");
    expect(await quoteShippingBhd("SA", undefined, oneParcel)).toBeNull();
    expect(await quoteShippingBhd("SA", "   ", oneParcel)).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns null (fails closed) when the Oreem lookup throws", async () => {
    vi.spyOn(oreemClient, "fetchShippingRates").mockRejectedValue(new Error("network error"));
    const result = await quoteShippingBhd("SA", "Jeddah", oneParcel);
    expect(result).toBeNull();
  });
});

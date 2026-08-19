import { describe, expect, it } from "vitest";
import { computeChargeableWeightKg } from "./chargeable-weight";

describe("computeChargeableWeightKg", () => {
  it("uses actual weight when it exceeds the volumetric weight", () => {
    // Volumetric = (10*10*10)/5000 = 0.2kg, well under the 2kg actual weight.
    expect(computeChargeableWeightKg(2, 10, 10, 10)).toBe(2);
  });

  it("uses volumetric weight when it exceeds the actual weight", () => {
    // Volumetric = (35*28*10)/5000 = 1.96kg, over a 1.1kg actual weight.
    expect(computeChargeableWeightKg(1.1, 35, 28, 10)).toBeCloseTo(1.96, 5);
  });
});

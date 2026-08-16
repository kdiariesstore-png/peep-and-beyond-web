import { describe, expect, it } from "vitest";
import { convertBhdToUsd, formatMoney } from "./currency";

describe("convertBhdToUsd", () => {
  it("converts a round BHD amount to USD using the fixed peg", () => {
    expect(convertBhdToUsd(10)).toBeCloseTo(26.6, 2);
  });

  it("converts the Peep Box price correctly", () => {
    expect(convertBhdToUsd(21.9)).toBeCloseTo(58.25, 2);
  });
});

describe("formatMoney", () => {
  it("formats BHD with three decimals and the د.ب suffix", () => {
    expect(formatMoney(21.9, "BHD")).toBe("21.900 د.ب");
  });

  it("formats USD with a dollar sign and two decimals", () => {
    expect(formatMoney(21.9, "USD")).toBe("$58.25");
  });
});

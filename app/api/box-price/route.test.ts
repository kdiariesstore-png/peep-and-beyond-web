import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";

const getCurrentBoxPriceMock = vi.fn();
vi.mock("../../../lib/inventory/launch-pricing", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/inventory/launch-pricing")>(
    "../../../lib/inventory/launch-pricing"
  );
  return {
    ...actual,
    getCurrentBoxPriceBhd: (...args: unknown[]) => getCurrentBoxPriceMock(...args),
  };
});

beforeEach(() => {
  getCurrentBoxPriceMock.mockReset();
});

describe("GET /api/box-price", () => {
  it("returns the launch price and flag while units remain", async () => {
    getCurrentBoxPriceMock.mockResolvedValue({ priceBhd: 24.9, isLaunchPrice: true });
    const response = await GET();
    expect(await response.json()).toEqual({
      priceBhd: 24.9,
      isLaunchPrice: true,
      originalPriceBhd: 28.9,
    });
  });

  it("returns the regular price once the launch price has ended", async () => {
    getCurrentBoxPriceMock.mockResolvedValue({ priceBhd: 28.9, isLaunchPrice: false });
    const response = await GET();
    expect(await response.json()).toEqual({
      priceBhd: 28.9,
      isLaunchPrice: false,
      originalPriceBhd: 28.9,
    });
  });

  it("fails closed to the regular price when the lookup throws", async () => {
    getCurrentBoxPriceMock.mockRejectedValue(new Error("boom"));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      priceBhd: 28.9,
      isLaunchPrice: false,
      originalPriceBhd: 28.9,
    });
  });
});

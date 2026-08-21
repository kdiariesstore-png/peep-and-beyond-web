import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const fetchCitiesMock = vi.fn();
vi.mock("../../../../lib/payments/oreem-client", () => ({
  fetchCities: (...args: unknown[]) => fetchCitiesMock(...args),
}));

beforeEach(() => {
  fetchCitiesMock.mockReset();
});

describe("GET /api/shipping/cities", () => {
  it("returns the city names for the requested country", async () => {
    fetchCitiesMock.mockResolvedValue([{ name: "Manama" }, { name: "Riffa" }]);
    const request = new NextRequest("http://localhost/api/shipping/cities?country=BH");
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ cities: ["Manama", "Riffa"] });
    expect(fetchCitiesMock).toHaveBeenCalledWith("BH");
  });

  it("returns 400 when country is missing", async () => {
    const request = new NextRequest("http://localhost/api/shipping/cities");
    const response = await GET(request);
    expect(response.status).toBe(400);
    expect(fetchCitiesMock).not.toHaveBeenCalled();
  });
});

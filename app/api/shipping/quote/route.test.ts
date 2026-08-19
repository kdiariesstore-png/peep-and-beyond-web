import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

const quoteShippingMock = vi.fn();
vi.mock("../../../../lib/order/quote-shipping", () => ({
  quoteShippingBhd: (...args: unknown[]) => quoteShippingMock(...args),
}));

function buildRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/shipping/quote", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  quoteShippingMock.mockReset();
});

describe("POST /api/shipping/quote", () => {
  it("returns the resolved shipping rate", async () => {
    quoteShippingMock.mockResolvedValue(8.5);
    const response = await POST(buildRequest({ countryCode: "SA", city: "Jeddah", boxQty: 1 }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ shippingBhd: 8.5 });
    expect(quoteShippingMock).toHaveBeenCalledWith("SA", "Jeddah", 1);
  });

  it("omits city when it is not a non-empty string", async () => {
    quoteShippingMock.mockResolvedValue(2.0);
    await POST(buildRequest({ countryCode: "BH", city: "", boxQty: 2 }));
    expect(quoteShippingMock).toHaveBeenCalledWith("BH", undefined, 2);
  });

  it("returns 400 when countryCode is missing", async () => {
    const response = await POST(buildRequest({ boxQty: 1 }));
    expect(response.status).toBe(400);
    expect(quoteShippingMock).not.toHaveBeenCalled();
  });

  it("returns 400 when boxQty is not a non-negative integer", async () => {
    const response = await POST(buildRequest({ countryCode: "SA", boxQty: -1 }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for an invalid JSON body", async () => {
    const request = new NextRequest("http://localhost/api/shipping/quote", {
      method: "POST",
      body: "not json",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 502 when the quote lookup throws", async () => {
    quoteShippingMock.mockRejectedValue(new Error("boom"));
    const response = await POST(buildRequest({ countryCode: "SA", boxQty: 1 }));
    expect(response.status).toBe(502);
  });
});

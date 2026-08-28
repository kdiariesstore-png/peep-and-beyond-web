import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import type { CartItem } from "../../../../lib/types";

const quoteShippingMock = vi.fn();
vi.mock("../../../../lib/order/quote-shipping", () => ({
  quoteShippingBhd: (...args: unknown[]) => quoteShippingMock(...args),
}));

const boxItem: CartItem = {
  id: "1",
  productId: "peep-box",
  customization: {
    storyLanguage: "ar",
    cardLanguage: "ar",
    cupColor: "pink",
    childName: "سارة",
    giftCard: false,
  },
  unitPriceBhd: 24.9,
  quantity: 1,
};

const storyItem: CartItem = {
  id: "2",
  productId: "peep-story",
  storyLanguage: "en",
  unitPriceBhd: 5,
  quantity: 2,
};

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
  it("returns the resolved shipping rate, building parcels from the cart items", async () => {
    quoteShippingMock.mockResolvedValue(8.5);
    const response = await POST(
      buildRequest({ countryCode: "SA", city: "Jeddah", items: [boxItem] })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ shippingBhd: 8.5 });
    expect(quoteShippingMock).toHaveBeenCalledWith("SA", "Jeddah", [
      { chargeableWeightKg: expect.any(Number), qty: 1 },
    ]);
  });

  it("builds separate parcel lines for a mixed box + story cart", async () => {
    quoteShippingMock.mockResolvedValue(8.5);
    await POST(buildRequest({ countryCode: "SA", city: "Jeddah", items: [boxItem, storyItem] }));
    const [, , parcels] = quoteShippingMock.mock.calls[0];
    expect(parcels).toHaveLength(2);
    expect(parcels[0].qty).toBe(1);
    expect(parcels[1].qty).toBe(2);
  });

  it("omits city when it is not a non-empty string", async () => {
    quoteShippingMock.mockResolvedValue(2.0);
    await POST(buildRequest({ countryCode: "BH", city: "", items: [boxItem] }));
    expect(quoteShippingMock.mock.calls[0][1]).toBeUndefined();
  });

  it("returns 400 when countryCode is missing", async () => {
    const response = await POST(buildRequest({ items: [boxItem] }));
    expect(response.status).toBe(400);
    expect(quoteShippingMock).not.toHaveBeenCalled();
  });

  it("returns 400 when items is missing or malformed", async () => {
    expect((await POST(buildRequest({ countryCode: "SA" }))).status).toBe(400);
    expect(
      (await POST(buildRequest({ countryCode: "SA", items: [{ ...boxItem, quantity: 0 }] })))
        .status
    ).toBe(400);
    expect(
      (await POST(buildRequest({ countryCode: "SA", items: [{ productId: "unknown" }] }))).status
    ).toBe(400);
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
    const response = await POST(buildRequest({ countryCode: "SA", items: [boxItem] }));
    expect(response.status).toBe(502);
  });
});

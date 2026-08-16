import { describe, expect, it } from "vitest";
import { buildOrderEmailHtml, buildOrderEmailSubject, type OrderEmailData } from "./order-notification-email";

const data: OrderEmailData = {
  buyer: {
    fullName: "سارة أحمد",
    email: "sara@example.com",
    phone: "33001122",
    country: "BH",
    city: "المنامة",
    address: "شارع 10، مبنى 5",
    preferredContact: "email",
    marketingOptIn: true,
  },
  items: [
    {
      id: "1",
      customization: {
        storyLanguage: "ar",
        cardLanguage: "ar",
        cupColor: "pink",
        childName: "سارة",
        giftCard: false,
      },
      unitPriceBhd: 21.9,
      quantity: 1,
    },
  ],
  subtotalBhd: 21.9,
  shippingBhd: 2.0,
  totalBhd: 23.9,
  paymentMethod: "iban",
};

describe("buildOrderEmailSubject", () => {
  it("includes the buyer's name", () => {
    expect(buildOrderEmailSubject(data)).toContain("سارة أحمد");
  });
});

describe("buildOrderEmailHtml", () => {
  it("includes buyer contact details, items, and totals", () => {
    const html = buildOrderEmailHtml(data);
    expect(html).toContain("sara@example.com");
    expect(html).toContain("33001122");
    expect(html).toContain("23.900");
    expect(html).toContain("تحويل بنكي");
  });

  it("shows 'to be confirmed' when shipping is unknown", () => {
    const html = buildOrderEmailHtml({ ...data, shippingBhd: null, totalBhd: null });
    expect(html).toContain("يُحدَّد لاحقًا");
  });

  it("includes the Oreem transaction reference when provided", () => {
    const html = buildOrderEmailHtml({
      ...data,
      paymentMethod: "oreem",
      oreemTransactionReference: "TXN-123",
    });
    expect(html).toContain("TXN-123");
  });
});

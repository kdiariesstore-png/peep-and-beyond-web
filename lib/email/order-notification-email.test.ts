import { describe, expect, it } from "vitest";
import { buildOrderEmailHtml, buildOrderEmailSubject, type OrderEmailData } from "./order-notification-email";
import type { BoxCartItem } from "../types";

const boxItem: BoxCartItem = {
  id: "1",
  productId: "peep-box",
  customization: {
    storyLanguage: "ar",
    cardLanguage: "ar",
    cupColor: "pink",
    childName: "سارة",
    giftCard: false,
  },
  unitPriceBhd: 21.9,
  quantity: 1,
};

const data: OrderEmailData = {
  buyer: {
    fullName: "سارة أحمد",
    email: "sara@example.com",
    phone: "33001122",
    country: "BH",
    city: "المنامة",
    address: "شارع 10، مبنى 5",
    marketingOptIn: true,
  },
  items: [boxItem],
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

  it("renders a standalone story line distinctly from a box line", () => {
    const html = buildOrderEmailHtml({
      ...data,
      items: [
        ...data.items,
        { id: "2", productId: "peep-story", storyLanguage: "en", unitPriceBhd: 5, quantity: 2 },
      ],
    });
    expect(html).toContain("قصة بيب المصورة (مطبوعة، لوحدها)");
    expect(html).toContain("× 2");
    expect(html).toContain("اللغة: English");
  });

  it("shows a cash-on-delivery label for cod orders", () => {
    const html = buildOrderEmailHtml({ ...data, paymentMethod: "cod" });
    expect(html).toContain("الدفع عند الاستلام");
  });

  it("includes the Oreem transaction reference when provided", () => {
    const html = buildOrderEmailHtml({
      ...data,
      paymentMethod: "oreem",
      oreemTransactionReference: "TXN-123",
    });
    expect(html).toContain("TXN-123");
  });

  it("escapes HTML special characters in user input", () => {
    const html = buildOrderEmailHtml({
      ...data,
      buyer: {
        ...data.buyer,
        fullName: '<img src=x>',
        email: 'test@example.com" onclick="alert(1)',
        address: '<script>alert("xss")</script>',
        city: 'City & "More"',
        country: "BH'>",
      },
      items: [
        {
          ...boxItem,
          customization: {
            ...boxItem.customization,
            childName: '<b>Bold</b>',
          },
        },
      ],
    });
    // Assert that dangerous characters are escaped
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img");
    expect(html).toContain("&quot;");
    expect(html).toContain("&lt;script");
    expect(html).not.toContain("<script");
    expect(html).toContain("&amp;");
    expect(html).not.toContain('<b>Bold</b>');
    expect(html).toContain("&lt;b&gt;");
  });

  it("renders notes when provided, e.g. a pre-order flag", () => {
    const html = buildOrderEmailHtml({ ...data, notes: ["طلب مسبق: نفدت نسخ القصة العربية"] });
    expect(html).toContain("طلب مسبق: نفدت نسخ القصة العربية");
  });

  it("prints the delivery address block with the full address and a human-readable country name", () => {
    const html = buildOrderEmailHtml(data);
    expect(html).toContain("عنوان التوصيل");
    expect(html).toContain("شارع 10، مبنى 5");
    expect(html).toContain("المنامة");
    expect(html).toContain("البحرين");
  });

  it("includes per-item customization details for packing", () => {
    const html = buildOrderEmailHtml(data);
    expect(html).toContain("اسم الطفل: سارة");
    expect(html).toContain("لون الكوب: وردي");
    expect(html).toContain("بطاقة إهداء: لا");
  });

  it("falls back to the raw country code when it isn't a known ISO code", () => {
    const html = buildOrderEmailHtml({ ...data, buyer: { ...data.buyer, country: "ZZ" } });
    expect(html).toContain("ZZ");
  });
});

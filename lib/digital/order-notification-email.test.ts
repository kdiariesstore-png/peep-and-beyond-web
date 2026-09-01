import { describe, expect, it } from "vitest";
import {
  buildDigitalOrderEmailSubject,
  buildDigitalOrderEmailHtml,
  buildDigitalCustomerConfirmationEmailHtml,
  type DigitalOrderEmailData,
  type DigitalCustomerConfirmationEmailData,
} from "./order-notification-email";

const data: DigitalOrderEmailData = {
  buyer: { fullName: "سارة أحمد", email: "sara@example.com", country: "BH", marketingOptIn: false },
  items: [
    { id: "sleep-bedtime", language: "ar", unitPriceBhd: 2.7 },
    { id: "potty-training", language: "en", unitPriceBhd: 2.7 },
  ],
  totalBhd: 5.4,
  txnRef: "peepdigi_abc123",
};

describe("buildDigitalOrderEmailSubject", () => {
  it("includes the buyer's name", () => {
    expect(buildDigitalOrderEmailSubject(data)).toContain("سارة أحمد");
  });
});

describe("buildDigitalOrderEmailHtml", () => {
  it("lists each purchased booklet by its Arabic-catalog name and chosen language", () => {
    const html = buildDigitalOrderEmailHtml(data);
    expect(html).toContain("النوم ووقت الفراش");
    expect(html).toContain("تدريب الحمام");
    expect(html).toContain(data.totalBhd.toFixed(3));
  });

  it("escapes HTML in the buyer's name to prevent injection", () => {
    const malicious: DigitalOrderEmailData = {
      ...data,
      buyer: { ...data.buyer, fullName: "<script>alert(1)</script>" },
    };
    const html = buildDigitalOrderEmailHtml(malicious);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("buildDigitalCustomerConfirmationEmailHtml", () => {
  const customerData: DigitalCustomerConfirmationEmailData = {
    ...data,
    downloads: [
      { label: "النوم ووقت الفراش (عربي)", href: "https://peep-and-beyond-web.vercel.app/api/digital-download?order=abc&product=sleep-bedtime&language=ar" },
      { label: "Potty training (English)", href: "https://peep-and-beyond-web.vercel.app/api/digital-download?order=abc&product=potty-training&language=en" },
    ],
  };

  it("includes a clickable link for every download", () => {
    const html = buildDigitalCustomerConfirmationEmailHtml(customerData);
    for (const download of customerData.downloads) {
      // The href goes through the same HTML-attribute escaping as everything else, so "&"
      // in the query string comes out as "&amp;" — that's correct escaping, not a bug.
      const escapedHref = download.href.replace(/&/g, "&amp;");
      expect(html).toContain(`href="${escapedHref}"`);
      expect(html).toContain(download.label);
    }
  });

  it("includes the order reference and total", () => {
    const html = buildDigitalCustomerConfirmationEmailHtml(customerData);
    expect(html).toContain(customerData.txnRef);
    expect(html).toContain(customerData.totalBhd.toFixed(3));
  });

  it("escapes HTML in a download label to prevent injection", () => {
    const malicious: DigitalCustomerConfirmationEmailData = {
      ...customerData,
      downloads: [{ label: "<script>alert(1)</script>", href: "https://example.com/x" }],
    };
    const html = buildDigitalCustomerConfirmationEmailHtml(malicious);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

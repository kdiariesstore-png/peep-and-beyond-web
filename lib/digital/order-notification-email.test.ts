import { describe, expect, it } from "vitest";
import {
  buildDigitalOrderEmailSubject,
  buildDigitalOrderEmailHtml,
  type DigitalOrderEmailData,
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

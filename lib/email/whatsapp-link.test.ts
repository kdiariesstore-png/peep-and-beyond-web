import { describe, expect, it } from "vitest";
import { buildWhatsappConfirmationLink, buildCustomerToOwnerWhatsappLink } from "./whatsapp-link";
import type { OrderEmailData } from "./order-notification-email";

const data: OrderEmailData = {
  buyer: {
    fullName: "سارة أحمد",
    email: "sara@example.com",
    phone: "+973 3001122",
    country: "BH",
    city: "المنامة",
    address: "شارع 10",
    preferredContact: "whatsapp",
    marketingOptIn: false,
  },
  items: [],
  subtotalBhd: 21.9,
  shippingBhd: 2.0,
  totalBhd: 23.9,
  paymentMethod: "iban",
};

describe("buildWhatsappConfirmationLink", () => {
  it("strips non-digit characters from the phone number", () => {
    const link = buildWhatsappConfirmationLink(data);
    expect(link).toContain("https://wa.me/9733001122");
  });

  it("url-encodes the pre-filled message text", () => {
    const link = buildWhatsappConfirmationLink(data);
    expect(link).toContain("text=");
    expect(link).not.toContain(" ");
  });

  it("shows 'to be confirmed' in the message when the total is unknown", () => {
    const link = buildWhatsappConfirmationLink({ ...data, totalBhd: null });
    const decoded = decodeURIComponent(link);
    expect(decoded).toContain("سيتم تأكيده لاحقًا");
  });
});

describe("buildCustomerToOwnerWhatsappLink", () => {
  it("builds a wa.me link from a plain phone number", () => {
    const link = buildCustomerToOwnerWhatsappLink("+973 3300 1122", "peep_abc123");
    expect(link).toMatch(/^https:\/\/wa\.me\/97333001122\?text=/);
  });

  it("appends the pre-filled text to a WhatsApp Business short link instead of treating it as a phone number", () => {
    const link = buildCustomerToOwnerWhatsappLink(
      "https://wa.me/message/NOEVIMNTTYKVO1",
      "peep_abc123"
    );
    expect(link).toMatch(/^https:\/\/wa\.me\/message\/NOEVIMNTTYKVO1\?text=/);
  });

  it("includes the order reference in the pre-filled message for both formats", () => {
    const phoneLink = buildCustomerToOwnerWhatsappLink("97333001122", "peep_xyz789");
    const shortLink = buildCustomerToOwnerWhatsappLink(
      "https://wa.me/message/NOEVIMNTTYKVO1",
      "peep_xyz789"
    );
    expect(decodeURIComponent(phoneLink)).toContain("peep_xyz789");
    expect(decodeURIComponent(shortLink)).toContain("peep_xyz789");
  });
});

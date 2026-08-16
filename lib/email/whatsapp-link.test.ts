import { describe, expect, it } from "vitest";
import { buildWhatsappConfirmationLink } from "./whatsapp-link";
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

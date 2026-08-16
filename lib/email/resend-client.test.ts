import { describe, expect, it, vi, beforeEach } from "vitest";

const sendMock = vi.fn().mockResolvedValue({ data: { id: "email_1" }, error: null });
const contactsCreateMock = vi.fn().mockResolvedValue({ data: { id: "contact_1" }, error: null });

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: sendMock },
    contacts: { create: contactsCreateMock },
  })),
}));

import {
  sendOrderNotificationEmail,
  sendCustomerConfirmationEmail,
  addToMarketingAudience,
} from "./resend-client";
import type { OrderEmailData } from "./order-notification-email";

const data: OrderEmailData = {
  buyer: {
    fullName: "سارة أحمد",
    email: "sara@example.com",
    phone: "33001122",
    country: "BH",
    city: "المنامة",
    address: "شارع 10",
    preferredContact: "email",
    marketingOptIn: true,
  },
  items: [],
  subtotalBhd: 21.9,
  shippingBhd: 2.0,
  totalBhd: 23.9,
  paymentMethod: "iban",
};

beforeEach(() => {
  sendMock.mockClear();
  contactsCreateMock.mockClear();
  process.env.RESEND_API_KEY = "test-key";
  process.env.OWNER_NOTIFICATION_EMAIL = "owner@example.com";
  process.env.RESEND_AUDIENCE_ID = "audience-1";
});

describe("sendOrderNotificationEmail", () => {
  it("sends to the owner's email with subject and html", async () => {
    await sendOrderNotificationEmail({ data });
    expect(sendMock).toHaveBeenCalledTimes(1);
    const call = sendMock.mock.calls[0][0];
    expect(call.to).toBe("owner@example.com");
    expect(call.subject).toContain("سارة أحمد");
  });

  it("attaches the receipt when provided", async () => {
    await sendOrderNotificationEmail({
      data,
      receiptAttachment: { filename: "receipt.png", content: Buffer.from("fake") },
    });
    const call = sendMock.mock.calls[0][0];
    expect(call.attachments[0].filename).toBe("receipt.png");
  });
});

describe("sendCustomerConfirmationEmail", () => {
  it("sends to the buyer's own email", async () => {
    await sendCustomerConfirmationEmail(data);
    const call = sendMock.mock.calls[0][0];
    expect(call.to).toBe("sara@example.com");
  });
});

describe("addToMarketingAudience", () => {
  it("creates a contact in the configured audience", async () => {
    await addToMarketingAudience("new@example.com");
    expect(contactsCreateMock).toHaveBeenCalledWith({
      email: "new@example.com",
      audienceId: "audience-1",
    });
  });
});

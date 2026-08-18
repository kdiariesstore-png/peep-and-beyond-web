import { Resend } from "resend";
import {
  buildDigitalOrderEmailHtml,
  buildDigitalOrderEmailSubject,
  buildDigitalCustomerConfirmationEmailHtml,
  type DigitalOrderEmailData,
  type DigitalCustomerConfirmationEmailData,
} from "./order-notification-email";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "orders@peepandbeyond.com";
}

export async function sendDigitalOrderNotificationEmail(
  data: DigitalOrderEmailData
): Promise<void> {
  const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL;
  if (!ownerEmail) throw new Error("OWNER_NOTIFICATION_EMAIL is not set");

  const resend = getResendClient();
  await resend.emails.send({
    from: getFromAddress(),
    to: ownerEmail,
    subject: buildDigitalOrderEmailSubject(data),
    html: buildDigitalOrderEmailHtml(data),
  });
}

export async function sendDigitalCustomerConfirmationEmail(
  data: DigitalCustomerConfirmationEmailData
): Promise<void> {
  const resend = getResendClient();
  await resend.emails.send({
    from: getFromAddress(),
    to: data.buyer.email,
    subject: "تم تأكيد طلبك من Peep & beyond",
    html: buildDigitalCustomerConfirmationEmailHtml(data),
  });
}

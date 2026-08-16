import { Resend } from "resend";
import {
  buildOrderEmailHtml,
  buildOrderEmailSubject,
  type OrderEmailData,
} from "./order-notification-email";
import { buildWhatsappConfirmationLink } from "./whatsapp-link";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "orders@peepandbeyond.com";
}

export interface SendOrderNotificationParams {
  data: OrderEmailData;
  receiptAttachment?: { filename: string; content: Buffer };
}

export async function sendOrderNotificationEmail(
  params: SendOrderNotificationParams
): Promise<void> {
  const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL;
  if (!ownerEmail) throw new Error("OWNER_NOTIFICATION_EMAIL is not set");

  const resend = getResendClient();
  const { data, receiptAttachment } = params;
  const whatsappLink = buildWhatsappConfirmationLink(data);
  const htmlWithWhatsapp = `${buildOrderEmailHtml(data)}<p><a href="${whatsappLink}">أرسل تأكيد واتساب</a></p>`;
  await resend.emails.send({
    from: getFromAddress(),
    to: ownerEmail,
    subject: buildOrderEmailSubject(data),
    html: htmlWithWhatsapp,
    attachments: receiptAttachment
      ? [{ filename: receiptAttachment.filename, content: receiptAttachment.content }]
      : undefined,
  });
}

export async function sendCustomerConfirmationEmail(data: OrderEmailData): Promise<void> {
  const resend = getResendClient();
  await resend.emails.send({
    from: getFromAddress(),
    to: data.buyer.email,
    subject: "تم استلام طلبك من Peep & beyond",
    html: buildOrderEmailHtml(data),
  });
}

export async function addToMarketingAudience(email: string): Promise<void> {
  const resend = getResendClient();
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) throw new Error("RESEND_AUDIENCE_ID is not set");
  await resend.contacts.create({ email, audienceId });
}

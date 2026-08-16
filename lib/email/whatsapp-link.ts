import type { OrderEmailData } from "./order-notification-email";

// Builds a chat FROM the customer TO the shop owner, for the customer-facing success
// page. Note the direction: buildWhatsappConfirmationLink below targets the *buyer's*
// number and is only correct when opened from the owner's own inbox. Putting that one in
// front of a customer would link them to themselves.
//
// `ownerContact` accepts two formats: a plain phone number (any punctuation is stripped,
// e.g. "+973 3300 1122"), or a full WhatsApp Business short link
// (e.g. "https://wa.me/message/NOEVIMNTTYKVO1", the format WhatsApp Business generates
// under Settings > Business tools > Short link) — that link already encodes which business
// account it opens, so it's used as-is with only the pre-filled text appended, never
// digit-stripped (a short link's code is alphanumeric, not a phone number).
export function buildCustomerToOwnerWhatsappLink(ownerContact: string, txnRef: string): string {
  const message = `مرحبًا، أرغب بتأكيد طلبي — رقم المرجع: ${txnRef}`;
  const trimmed = ownerContact.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    const url = new URL(trimmed);
    url.searchParams.set("text", message);
    return url.toString();
  }

  const phone = trimmed.replace(/[^0-9]/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// Owner-facing: opened from the order-notification email the owner receives, so the
// target number is deliberately the buyer's.
export function buildWhatsappConfirmationLink(data: OrderEmailData): string {
  const phone = data.buyer.phone.replace(/[^0-9]/g, "");
  const totalText =
    data.totalBhd === null ? "سيتم تأكيده لاحقًا" : `${data.totalBhd.toFixed(3)} د.ب`;
  const message = [
    `مرحبًا ${data.buyer.fullName}،`,
    `تم استلام طلبك من Peep & beyond.`,
    `الإجمالي: ${totalText}`,
    `شكرًا لتسوقك معنا! 🌿`,
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

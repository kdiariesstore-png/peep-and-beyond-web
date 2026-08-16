import type { OrderEmailData } from "./order-notification-email";

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

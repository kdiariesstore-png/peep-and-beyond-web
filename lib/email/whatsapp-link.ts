import type { OrderEmailData } from "./order-notification-email";

// Builds a chat FROM the customer TO the shop owner, for the customer-facing success
// page. Note the direction: buildWhatsappConfirmationLink below targets the *buyer's*
// number and is only correct when opened from the owner's own inbox. Putting that one in
// front of a customer would link them to themselves.
export function buildCustomerToOwnerWhatsappLink(ownerNumber: string, txnRef: string): string {
  const phone = ownerNumber.replace(/[^0-9]/g, "");
  const message = `مرحبًا، أرغب بتأكيد طلبي — رقم المرجع: ${txnRef}`;
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

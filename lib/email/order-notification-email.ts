import type { BuyerDetails, CartItem, PaymentMethod } from "../types";

export interface OrderEmailData {
  buyer: BuyerDetails;
  items: CartItem[];
  subtotalBhd: number;
  shippingBhd: number | null;
  totalBhd: number | null;
  paymentMethod: PaymentMethod;
  oreemTransactionReference?: string;
}

export function buildOrderEmailSubject(data: OrderEmailData): string {
  return `طلب جديد من ${data.buyer.fullName} — بوكس بيب`;
}

function describeItem(item: CartItem): string {
  const langLabel = item.customization.storyLanguage === "ar" ? "العربية" : "English";
  const cupLabel = item.customization.cupColor === "pink" ? "وردي" : "أزرق";
  return `بوكس بيب الكامل × ${item.quantity} — ${item.customization.childName || "بدون اسم"} · ${langLabel} · ${cupLabel}`;
}

export function buildOrderEmailHtml(data: OrderEmailData): string {
  const itemsHtml = data.items.map((item) => `<li>${describeItem(item)}</li>`).join("");
  const shippingText =
    data.shippingBhd === null ? "يُحدَّد لاحقًا" : `${data.shippingBhd.toFixed(3)} د.ب`;
  const totalText =
    data.totalBhd === null ? "يُحدَّد لاحقًا" : `${data.totalBhd.toFixed(3)} د.ب`;
  const paymentText =
    data.paymentMethod === "iban"
      ? "تحويل بنكي (IBAN)"
      : `أوريم${data.oreemTransactionReference ? ` — مرجع: ${data.oreemTransactionReference}` : ""}`;

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif;">
      <h2>طلب جديد</h2>
      <p><strong>الاسم:</strong> ${data.buyer.fullName}</p>
      <p><strong>الإيميل:</strong> ${data.buyer.email}</p>
      <p><strong>الهاتف:</strong> ${data.buyer.phone}</p>
      <p><strong>العنوان:</strong> ${data.buyer.address}, ${data.buyer.city}, ${data.buyer.country}</p>
      <p><strong>طريقة الدفع:</strong> ${paymentText}</p>
      <h3>تفاصيل الطلب</h3>
      <ul>${itemsHtml}</ul>
      <p><strong>المجموع الفرعي:</strong> ${data.subtotalBhd.toFixed(3)} د.ب</p>
      <p><strong>الشحن:</strong> ${shippingText}</p>
      <p><strong>الإجمالي:</strong> ${totalText}</p>
    </div>
  `;
}

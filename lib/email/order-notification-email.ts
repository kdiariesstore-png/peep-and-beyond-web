import type { BuyerDetails, CartItem, PaymentMethod } from "../types";
import { COUNTRIES } from "../countries";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface OrderEmailData {
  buyer: BuyerDetails;
  items: CartItem[];
  subtotalBhd: number;
  shippingBhd: number | null;
  totalBhd: number | null;
  paymentMethod: PaymentMethod;
  oreemTransactionReference?: string;
  notes?: string[];
}

export function buildOrderEmailSubject(data: OrderEmailData): string {
  return `طلب جديد من ${escapeHtml(data.buyer.fullName)} — بوكس بيب`;
}

function countryName(countryCode: string): string {
  return COUNTRIES.find((c) => c.code === countryCode)?.labelAr ?? countryCode;
}

function itemRowHtml(item: CartItem): string {
  const langLabel = item.customization.storyLanguage === "ar" ? "العربية" : "English";
  const cardLangLabel = item.customization.cardLanguage === "ar" ? "العربية" : "English";
  const cupLabel = item.customization.cupColor === "pink" ? "وردي" : "أزرق";
  const childName = escapeHtml(item.customization.childName || "بدون اسم");
  const giftCardLabel = item.customization.giftCard ? "نعم" : "لا";
  return `
    <tr>
      <td style="padding:8px 6px; border-bottom:1px solid #e5e5e5; vertical-align:top;">
        <strong>بوكس بيب الكامل</strong> × ${item.quantity}
        <div style="margin-top:4px; font-size:13px; color:#555;">
          اسم الطفل: ${childName} · لغة القصة: ${langLabel} · لغة البطاقات: ${cardLangLabel} · لون الكوب: ${cupLabel} · بطاقة إهداء: ${giftCardLabel}
        </div>
      </td>
    </tr>
  `;
}

// Designed to be printed directly from the inbox (Ctrl+P) as a combined shipping
// label + packing slip for one delivery: the address block up top is deliberately large
// and boxed like a label, order/customization details in the middle for packing, and the
// payment/amount summary (not needed by whoever is packing the box) last and smaller.
export function buildOrderEmailHtml(data: OrderEmailData): string {
  const itemsHtml = data.items.map(itemRowHtml).join("");
  const shippingText =
    data.shippingBhd === null ? "يُحدَّد لاحقًا" : `${data.shippingBhd.toFixed(3)} د.ب`;
  const totalText =
    data.totalBhd === null ? "يُحدَّد لاحقًا" : `${data.totalBhd.toFixed(3)} د.ب`;
  const paymentText =
    data.paymentMethod === "iban"
      ? "تحويل بنكي (IBAN)"
      : `أوريم${data.oreemTransactionReference ? ` — مرجع: ${data.oreemTransactionReference}` : ""}`;
  const contactLabel = data.buyer.preferredContact === "whatsapp" ? "واتساب" : "البريد الإلكتروني";
  const notesHtml =
    data.notes && data.notes.length > 0
      ? `<p style="margin:12px 0; padding:8px; background:#fef3c7; color:#92400e;"><strong>ملاحظات:</strong> ${data.notes.map(escapeHtml).join(" — ")}</p>`
      : "";

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px;">
      <h2 style="margin-bottom:4px;">طلب جديد — بوكس بيب</h2>
      ${notesHtml}

      <div style="border:2px solid #1f2937; border-radius:8px; padding:16px; margin:16px 0;">
        <p style="margin:0 0 8px; font-size:11px; letter-spacing:1px; color:#6b7280; text-transform:uppercase;">عنوان التوصيل</p>
        <p style="margin:0; font-size:20px; font-weight:bold;">${escapeHtml(data.buyer.fullName)}</p>
        <p style="margin:6px 0; font-size:16px;">📞 ${escapeHtml(data.buyer.phone)}</p>
        <p style="margin:6px 0; font-size:16px; line-height:1.5;">${escapeHtml(data.buyer.address)}<br>${escapeHtml(data.buyer.city)} — ${escapeHtml(countryName(data.buyer.country))}</p>
        <p style="margin:6px 0 0; font-size:13px; color:#6b7280;">التواصل المفضّل: ${contactLabel} (${escapeHtml(data.buyer.email)})</p>
      </div>

      <h3 style="margin:16px 0 8px;">محتويات الطلب</h3>
      <table style="width:100%; border-collapse:collapse;">${itemsHtml}</table>

      <div style="margin-top:16px; padding-top:8px; border-top:1px solid #d1d5db; font-size:13px; color:#374151;">
        <p style="margin:2px 0;">طريقة الدفع: ${paymentText}</p>
        <p style="margin:2px 0;">المجموع الفرعي: ${data.subtotalBhd.toFixed(3)} د.ب</p>
        <p style="margin:2px 0;">الشحن: ${shippingText}</p>
        <p style="margin:6px 0 0; font-size:15px; color:#111827;"><strong>الإجمالي: ${totalText}</strong></p>
      </div>
    </div>
  `;
}

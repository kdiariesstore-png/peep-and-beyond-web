import type { DigitalBuyerDetails, DigitalCartItem } from "./types";
import { DIGITAL_PRODUCTS, DIGITAL_BUNDLE } from "./catalog";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface DigitalOrderEmailData {
  buyer: DigitalBuyerDetails;
  items: DigitalCartItem[];
  totalBhd: number;
  txnRef: string;
}

export function buildDigitalOrderEmailSubject(data: DigitalOrderEmailData): string {
  return `طلب منتج رقمي جديد من ${escapeHtml(data.buyer.fullName)}`;
}

function describeItem(item: DigitalCartItem): string {
  const nameAr =
    item.id === "digital-bundle"
      ? DIGITAL_BUNDLE.nameAr
      : DIGITAL_PRODUCTS.find((p) => p.id === item.id)?.nameAr ?? item.id;
  const langLabel = item.language === "ar" ? "العربية" : "English";
  return `${nameAr} — ${langLabel}`;
}

export function buildDigitalOrderEmailHtml(data: DigitalOrderEmailData): string {
  const itemsHtml = data.items.map((item) => `<li>${describeItem(item)}</li>`).join("");

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif;">
      <h2>طلب منتج رقمي جديد</h2>
      <p><strong>الاسم:</strong> ${escapeHtml(data.buyer.fullName)}</p>
      <p><strong>الإيميل:</strong> ${escapeHtml(data.buyer.email)}</p>
      <p><strong>الدولة:</strong> ${escapeHtml(data.buyer.country)}</p>
      <p><strong>طريقة الدفع:</strong> أوريم — مرجع: ${escapeHtml(data.txnRef)}</p>
      <h3>المنتجات</h3>
      <ul>${itemsHtml}</ul>
      <p><strong>الإجمالي:</strong> ${data.totalBhd.toFixed(3)} د.ب</p>
    </div>
  `;
}

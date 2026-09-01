import type { DigitalBuyerDetails, DigitalCartItem } from "./types";
import { DIGITAL_PRODUCTS, DIGITAL_BUNDLES } from "./catalog";

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
  const bundle = DIGITAL_BUNDLES.find((b) => b.id === item.id);
  const nameAr = bundle
    ? bundle.nameAr
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

export interface DigitalDownloadLink {
  label: string;
  href: string;
}

export interface DigitalCustomerConfirmationEmailData extends DigitalOrderEmailData {
  // Absolute URLs only — this HTML is read in an email client, which has no notion of
  // "relative to our site" the way a browser tab does.
  downloads: DigitalDownloadLink[];
}

// The customer-facing counterpart to buildDigitalOrderEmailHtml (which is for the shop
// owner and intentionally carries no download links). This is the customer's only route to
// their files if they never make it back to the web confirmation page — e.g. Oreem's
// redirect lands on a stale deployment URL, or they close the tab before it finishes
// loading — so the links here must work standalone, with no dependency on that page.
export function buildDigitalCustomerConfirmationEmailHtml(
  data: DigitalCustomerConfirmationEmailData
): string {
  const itemsHtml = data.items.map((item) => `<li>${describeItem(item)}</li>`).join("");
  const downloadsHtml = data.downloads
    .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
    .join("");

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif;">
      <h2>تم تأكيد طلبك من Peep &amp; beyond!</h2>
      <p><strong>رقم مرجع طلبك:</strong> ${escapeHtml(data.txnRef)}</p>
      <h3>المنتجات</h3>
      <ul>${itemsHtml}</ul>
      <p><strong>الإجمالي:</strong> ${data.totalBhd.toFixed(3)} د.ب</p>
      <h3>روابط التحميل</h3>
      <ul>${downloadsHtml}</ul>
    </div>
  `;
}

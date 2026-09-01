"use client";

import { useCart } from "../lib/cart/cart-context";
import { useLocale } from "../lib/i18n/locale-context";
import { useCurrency } from "../lib/currency-context";
import { formatMoney } from "../lib/currency";
import { BUILDER_PRODUCTS, getBuilderProduct, isBuilderKind, isIndividualProductKind } from "../lib/product";
import type { CartItem } from "../lib/types";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, removeItem, updateQuantity } = useCart();
  const { t, locale } = useLocale();
  const { currency } = useCurrency();
  const ar = locale === "ar";

  if (!open) return null;

  const subtotalBhd = items.reduce((sum, item) => sum + item.unitPriceBhd * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 bg-brown/35 backdrop-blur-[2px]" onClick={onClose}>
    <aside className="absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-cream p-5 shadow-2xl sm:p-7" onClick={(event) => event.stopPropagation()} aria-label={t.cartTitle}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t.cartTitle}</h2>
        <button type="button" onClick={onClose} aria-label="close cart" className="grid h-10 w-10 place-items-center rounded-full border border-brown/15">
          ✕
        </button>
      </div>

      {items.length === 0 ? (
        <div className="grid flex-1 place-items-center text-center"><div><p className="text-4xl" aria-hidden>🎁</p><p className="mt-3 font-bold">{t.cartEmpty}</p><p className="mt-1 text-sm text-brown/60">{t.navGifts}</p></div></div>
      ) : (
        <ul className="mt-6 flex-1 space-y-4 overflow-y-auto pe-1">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl bg-white/70 p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="font-black">{isIndividualProductKind(item.kind)
                ? (ar ? getBuilderProduct(item.selectedProductIds?.[0]!)?.nameAr : getBuilderProduct(item.selectedProductIds?.[0]!)?.nameEn)
                : isBuilderKind(item.kind)
                  ? (item.kind === "ready-to-gift" ? (ar ? "بوكس بيب المميز" : "Premium Peep gift box") : (ar ? "بوكس بيب من اختيارك" : "Build Your Own Peep Box"))
                  : (ar ? "بوكس بيب الكامل" : "The Complete Peep Box")}</p>
              {item.customization.childName && !isIndividualProductKind(item.kind) && <p className="mt-1 text-xs text-brown/60">{ar ? "إلى" : "For"}: {item.customization.childName}</p>}</div>
              <p className="text-sm text-brown/60">
                {formatMoney(item.unitPriceBhd, currency)}
              </p></div>
              {isBuilderKind(item.kind) && <p className="mt-3 text-xs leading-5 text-brown/60">{(item.selectedProductIds ?? []).map((id) => { const product = BUILDER_PRODUCTS.find((entry) => entry.id === id); return ar ? product?.nameAr : product?.nameEn; }).filter(Boolean).join(" · ")}</p>}
              {isIndividualProductKind(item.kind) && individualOptionLabel(item, ar) && <p className="mt-2 text-xs text-brown/60">{individualOptionLabel(item, ar)}</p>}
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) =>
                    updateQuantity(item.id, Number(event.target.value) || 1)
                  }
                  aria-label={ar ? "الكمية" : "Quantity"}
                  className="w-16 rounded-lg border border-brown/20 bg-white p-2"
                />
                <button type="button" onClick={() => removeItem(item.id)} className="text-sm font-semibold text-red-700">
                  {ar ? "حذف" : "Remove"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <>
          <div className="mt-5 border-t border-brown/10 pt-5"><div className="flex items-center justify-between"><span className="font-semibold">{ar ? "المجموع الفرعي" : "Subtotal"}</span><strong className="text-xl">{formatMoney(subtotalBhd, currency)}</strong></div>
          <p className="mt-1 text-xs text-brown/55">{ar ? "يُحسب التوصيل بوضوح في الخطوة التالية." : "Delivery is calculated clearly at checkout."}</p>
          <a href="/checkout" className="button-primary mt-4 block text-center">
            {ar ? "إتمام الطلب بأمان" : "Secure checkout"}
          </a>
          </div>
        </>
      )}
    </aside>
    </div>
  );
}

function individualOptionLabel(item: CartItem, ar: boolean): string | null {
  const productId = item.selectedProductIds?.[0];
  if (productId === "story") return `${ar ? "اللغة" : "Language"}: ${item.customization.storyLanguage === "ar" ? (ar ? "العربية" : "Arabic") : "English"}`;
  if (productId === "alphabet-cards") return `${ar ? "اللغة" : "Language"}: ${item.customization.cardLanguage === "ar" ? (ar ? "العربية" : "Arabic") : "English"}`;
  if (productId === "cup") return `${ar ? "اللون" : "Color"}: ${item.customization.cupColor === "pink" ? (ar ? "وردي" : "Pink") : (ar ? "أزرق" : "Blue")}`;
  return null;
}

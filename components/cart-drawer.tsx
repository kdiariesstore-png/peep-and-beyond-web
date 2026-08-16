"use client";

import { useCart } from "../lib/cart/cart-context";
import { useLocale } from "../lib/i18n/locale-context";
import { useCurrency } from "../lib/currency-context";
import { formatMoney } from "../lib/currency";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, removeItem, updateQuantity } = useCart();
  const { t } = useLocale();
  const { currency } = useCurrency();

  if (!open) return null;

  const subtotalBhd = items.reduce((sum, item) => sum + item.unitPriceBhd * item.quantity, 0);

  return (
    <aside className="fixed inset-y-0 end-0 w-full max-w-sm bg-cream p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t.cartTitle}</h2>
        <button type="button" onClick={onClose} aria-label="close cart">
          ✕
        </button>
      </div>

      {items.length === 0 ? (
        <p className="mt-8 text-brown/60">{t.cartEmpty}</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="border-b border-brown/10 pb-4">
              <p className="font-semibold">{item.customization.childName || "—"}</p>
              <p className="text-sm text-brown/60">
                {formatMoney(item.unitPriceBhd, currency)}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) =>
                    updateQuantity(item.id, Number(event.target.value) || 1)
                  }
                  className="w-16 rounded border border-brown/20 p-1"
                />
                <button type="button" onClick={() => removeItem(item.id)}>
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <>
          <p className="mt-6 font-semibold">{formatMoney(subtotalBhd, currency)}</p>
          <a href="/checkout" className="mt-4 block rounded-full bg-leaf py-3 text-center text-white">
            إتمام الطلب
          </a>
        </>
      )}
    </aside>
  );
}

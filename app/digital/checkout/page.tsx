"use client";

import { useState } from "react";
import { Header } from "../../../components/header";
import { Footer } from "../../../components/footer";
import { CartDrawer } from "../../../components/cart-drawer";
import { useDigitalCart } from "../../../lib/digital/cart-context";
import { calculateDigitalOrderTotal } from "../../../lib/digital/order-total";
import { DigitalBuyerForm } from "../../../components/digital/buyer-form";
import { useCurrency } from "../../../lib/currency-context";
import { useLocale } from "../../../lib/i18n/locale-context";
import { formatMoney } from "../../../lib/currency";
import { DIGITAL_PRODUCTS, DIGITAL_BUNDLES } from "../../../lib/digital/catalog";
import type { DigitalBuyerDetails, DigitalProductId } from "../../../lib/digital/types";

const EMPTY_BUYER: DigitalBuyerDetails = {
  fullName: "",
  email: "",
  country: "BH",
  marketingOptIn: false,
};

export default function DigitalCheckoutPage() {
  const { items, removeItem } = useDigitalCart();
  const { currency } = useCurrency();
  const { locale, t } = useLocale();
  const [buyer, setBuyer] = useState<DigitalBuyerDetails>(EMPTY_BUYER);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const { totalBhd } = calculateDigitalOrderTotal(items);

  // Resolves a cart line's display name in the current locale, covering both individual
  // topics and any bundle (bundles live outside DIGITAL_PRODUCTS).
  function itemLabel(id: DigitalProductId): string {
    const bundle = DIGITAL_BUNDLES.find((b) => b.id === id);
    if (bundle) return locale === "ar" ? bundle.nameAr : bundle.nameEn;
    const product = DIGITAL_PRODUCTS.find((p) => p.id === id);
    return product ? (locale === "ar" ? product.nameAr : product.nameEn) : id;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders/digital-oreem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyer, items }),
      });
      const json = await response.json();
      if (!response.ok || typeof json.paymentUrl !== "string") {
        setSubmitError("تعذر بدء الدفع عبر أوريم. حاول مرة أخرى.");
        return;
      }
      window.location.href = json.paymentUrl;
    } catch {
      setSubmitError("تعذر بدء الدفع عبر أوريم. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header onCartClick={() => setShowCart(true)} />
      <main className="mx-auto grid max-w-4xl gap-8 p-6 md:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-sm text-brown/60">{t.digitalCheckoutSubtitle}</p>
          <DigitalBuyerForm value={buyer} onChange={setBuyer} />
          <p className="rounded border border-brown/20 bg-white/60 p-3 text-sm text-brown/70">
            {t.digitalPaymentNote}
          </p>
          {submitError && <p className="text-red-600">{submitError}</p>}
          <button
            type="submit"
            disabled={submitting || items.length === 0}
            className="w-full rounded-full bg-leaf py-3 text-white disabled:opacity-50"
          >
            {t.digitalConfirmButton}
          </button>
        </form>

        <aside className="rounded-xl bg-white/60 p-6">
          <h2 className="text-lg font-bold">{t.digitalCartTitle}</h2>
          {items.length === 0 ? (
            <p className="mt-4 text-brown/60">{t.digitalCartEmpty}</p>
          ) : (
            <>
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 border-b border-brown/10 pb-3"
                  >
                    <div>
                      <p className="font-medium">{itemLabel(item.id)}</p>
                      <p className="text-sm text-brown/60">
                        {item.language === "ar" ? t.languageArabic : t.languageEnglish} —{" "}
                        {formatMoney(item.unitPriceBhd, currency)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-sm text-brown/60 underline"
                    >
                      {t.digitalRemoveItem}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-4 font-semibold">{formatMoney(totalBhd, currency)}</p>
            </>
          )}
        </aside>
      </main>
      <Footer />
      <CartDrawer open={showCart} onClose={() => setShowCart(false)} />
    </>
  );
}

"use client";

import { useState } from "react";
import { useDigitalCart } from "../../../lib/digital/cart-context";
import { calculateDigitalOrderTotal } from "../../../lib/digital/order-total";
import { DigitalBuyerForm } from "../../../components/digital/buyer-form";
import { useCurrency } from "../../../lib/currency-context";
import { useLocale } from "../../../lib/i18n/locale-context";
import { formatMoney } from "../../../lib/currency";
import type { DigitalBuyerDetails } from "../../../lib/digital/types";

const EMPTY_BUYER: DigitalBuyerDetails = {
  fullName: "",
  email: "",
  country: "BH",
  marketingOptIn: false,
};

export default function DigitalCheckoutPage() {
  const { items } = useDigitalCart();
  const { currency } = useCurrency();
  const { t } = useLocale();
  const [buyer, setBuyer] = useState<DigitalBuyerDetails>(EMPTY_BUYER);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { totalBhd } = calculateDigitalOrderTotal(items);

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
          <p className="mt-4 font-semibold">{formatMoney(totalBhd, currency)}</p>
        )}
      </aside>
    </main>
  );
}

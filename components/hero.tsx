"use client";

import { useLocale } from "../lib/i18n/locale-context";
import { useCurrency } from "../lib/currency-context";
import { formatMoney } from "../lib/currency";
import { PEEP_BOX_PRODUCT } from "../lib/product";

export function Hero({ onOrderClick }: { onOrderClick: () => void }) {
  const { t } = useLocale();
  const { currency } = useCurrency();

  return (
    <section className="px-6 py-16 text-center">
      <h1 className="text-4xl font-bold leading-tight">
        {t.heroTitleLine1}
        <br />
        {t.heroTitleLine2}
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-brown/80">{t.heroSubtitle}</p>
      <p className="mt-6 text-2xl font-semibold">
        {formatMoney(PEEP_BOX_PRODUCT.priceBhd, currency)}
      </p>
      <div className="mt-6 flex justify-center gap-4">
        <button
          type="button"
          onClick={onOrderClick}
          className="rounded-full bg-leaf px-6 py-3 text-white"
        >
          {t.orderNow}
        </button>
        <a href="#inside" className="rounded-full border border-brown/20 px-6 py-3">
          {t.viewContents}
        </a>
      </div>
    </section>
  );
}

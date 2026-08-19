"use client";

import Image from "next/image";
import { useLocale } from "../lib/i18n/locale-context";
import { useCurrency } from "../lib/currency-context";
import { formatMoney } from "../lib/currency";
import { PEEP_BOX_PRODUCT, isPhysicalBoxAvailable } from "../lib/product";

export function InsideTheBox({ onOrderClick }: { onOrderClick: () => void }) {
  const { locale, t } = useLocale();
  const { currency } = useCurrency();
  const contents = PEEP_BOX_PRODUCT.contents[locale];
  const available = isPhysicalBoxAvailable();

  return (
    <section id="inside" className="mx-auto max-w-5xl px-6 py-16">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <Image
          src="/images/peep-box-product.png"
          alt={t.insideTitle}
          width={1254}
          height={1254}
          className="w-full rounded-2xl"
        />
        <div>
          <h2 className="text-2xl font-bold">{t.insideTitle}</h2>
          <p className="mt-2 text-brown/70">{t.insideSubtitle}</p>
          <ul className="mt-6 space-y-3">
            {contents.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden className="mt-1 text-leaf">
                  ✓
                </span>
                <span className="text-brown/80">{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 flex items-baseline gap-3">
            <span className="text-2xl font-semibold">{formatMoney(PEEP_BOX_PRODUCT.priceBhd, currency)}</span>
            <span className="text-lg text-brown/50 line-through">
              {formatMoney(PEEP_BOX_PRODUCT.originalPriceBhd, currency)}
            </span>
          </p>
          <button
            type="button"
            onClick={available ? onOrderClick : undefined}
            disabled={!available}
            className="mt-4 rounded-full bg-leaf px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {available ? t.addToCart : t.comingSoon}
          </button>
          {!available && <p className="mt-3 text-sm text-brown/60">{t.comingSoonNote}</p>}
        </div>
      </div>
    </section>
  );
}

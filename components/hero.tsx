"use client";

import Image from "next/image";
import { useLocale } from "../lib/i18n/locale-context";
import { useCurrency } from "../lib/currency-context";
import { formatMoney } from "../lib/currency";
import { PEEP_BOX_PRODUCT } from "../lib/product";

export function Hero({ onOrderClick }: { onOrderClick: () => void }) {
  const { t } = useLocale();
  const { currency } = useCurrency();

  return (
    <section className="mx-auto grid max-w-5xl items-center gap-8 px-6 py-16 md:grid-cols-2">
      <div className="text-center md:text-start">
        <h1 className="text-4xl font-bold leading-tight">
          {t.heroTitleLine1}
          <br />
          {t.heroTitleLine2}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-brown/80 md:mx-0">{t.heroSubtitle}</p>
        <p className="mt-6 text-2xl font-semibold">
          {formatMoney(PEEP_BOX_PRODUCT.priceBhd, currency)}
        </p>
        <div className="mt-6 flex justify-center gap-4 md:justify-start">
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
      </div>
      <div className="order-first md:order-last">
        <Image
          src="/images/peep-box-product.png"
          alt={t.insideTitle}
          width={800}
          height={600}
          className="w-full rounded-2xl"
          priority
        />
      </div>
    </section>
  );
}

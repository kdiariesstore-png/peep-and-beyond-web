"use client";

import { useLocale } from "../lib/i18n/locale-context";
import { useCurrency } from "../lib/currency-context";
import { formatMoney } from "../lib/currency";
import { isPhysicalBoxAvailable, PEEP_BOX_EXTERIOR_IMAGES } from "../lib/product";
import { useBoxPrice } from "../lib/use-box-price";
import { AutoImageCarousel } from "./auto-image-carousel";

export function Hero({ onOrderClick }: { onOrderClick: () => void }) {
  const { t } = useLocale();
  const { currency } = useCurrency();
  const available = isPhysicalBoxAvailable();
  const boxPrice = useBoxPrice();

  return (
    <section className="mx-auto grid max-w-5xl items-center gap-8 px-6 py-16 md:grid-cols-2">
      <div className="text-center md:text-start">
        <h1 className="text-4xl font-bold leading-tight">
          {t.heroTitleLine1}
          <br />
          {t.heroTitleLine2}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-brown/80 md:mx-0">{t.heroSubtitle}</p>
        <p className="mt-6 flex items-baseline justify-center gap-3 md:justify-start">
          <span className="text-2xl font-semibold">{formatMoney(boxPrice.priceBhd, currency)}</span>
          {boxPrice.isLaunchPrice && (
            <span className="text-lg text-brown/50 line-through">
              {formatMoney(boxPrice.originalPriceBhd, currency)}
            </span>
          )}
        </p>
        <div className="mt-6 flex justify-center gap-4 md:justify-start">
          <button
            type="button"
            onClick={available ? onOrderClick : undefined}
            disabled={!available}
            className="rounded-full bg-leaf px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {available ? t.orderNow : t.comingSoon}
          </button>
          <a href="#inside" className="rounded-full border border-brown/20 px-6 py-3">
            {t.viewContents}
          </a>
        </div>
        {!available && <p className="mt-3 text-sm text-brown/60">{t.comingSoonNote}</p>}
      </div>
      <div className="order-first md:order-last">
        <AutoImageCarousel images={PEEP_BOX_EXTERIOR_IMAGES} alt={t.insideTitle} />
      </div>
    </section>
  );
}

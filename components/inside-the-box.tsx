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
    <section id="inside" className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-[2rem] bg-[#e6ede1] p-5 shadow-sm sm:p-8 md:grid-cols-2 lg:p-12">
        <Image
          src="/images/peep-box-detail.webp"
          alt={t.insideTitle}
          width={800}
          height={600}
          className="aspect-[4/3] w-full rounded-[1.5rem] bg-cream object-contain shadow-lg"
        />
        <div>
          <p className="section-kicker">{locale === "ar" ? "الاختيار الجاهز" : "The ready-made favorite"}</p>
          <h2 className="mt-2 text-3xl font-black sm:text-4xl">{t.insideTitle}</h2>
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
          <p className="mt-6 text-2xl font-semibold">
            {formatMoney(PEEP_BOX_PRODUCT.priceBhd, currency)}
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

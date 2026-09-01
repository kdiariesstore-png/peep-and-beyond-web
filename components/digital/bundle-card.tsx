"use client";

import { useState } from "react";
import type { DigitalLanguage } from "../../lib/digital/types";
import type { DigitalBundle } from "../../lib/digital/catalog";
import { useLocale } from "../../lib/i18n/locale-context";
import { useCurrency } from "../../lib/currency-context";
import { formatMoney } from "../../lib/currency";

export function BundleCard({
  bundle,
  onAdd,
}: {
  bundle: DigitalBundle;
  onAdd: (language: DigitalLanguage) => void;
}) {
  const { locale, t } = useLocale();
  const { currency } = useCurrency();
  const [language, setLanguage] = useState<DigitalLanguage>(locale);

  const name = locale === "ar" ? bundle.nameAr : bundle.nameEn;

  return (
    <article className="rounded-xl border-2 border-leaf bg-leaf/5 p-6">
      <h3 className="text-xl font-bold">{name}</h3>
      <p className="mt-3 text-2xl font-semibold">{formatMoney(bundle.priceBhd, currency)}</p>

      <fieldset className="mt-4">
        <legend className="text-sm text-brown/60">{t.digitalLanguageChoiceLabel}</legend>
        <div className="mt-1 flex gap-2">
          {(["ar", "en"] as const).map((lang) => (
            <button
              type="button"
              key={lang}
              aria-pressed={language === lang}
              onClick={() => setLanguage(lang)}
              className={`rounded-full border px-3 py-1 text-sm ${
                language === lang ? "border-leaf bg-leaf text-white" : "border-brown/20 bg-white text-brown"
              }`}
            >
              {lang === "ar" ? t.languageArabic : t.languageEnglish}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={() => onAdd(language)}
        className="mt-4 w-full rounded-full bg-leaf py-3 text-white"
      >
        {t.digitalAddToCart}
      </button>
    </article>
  );
}

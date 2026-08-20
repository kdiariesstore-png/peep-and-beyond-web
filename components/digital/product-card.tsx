"use client";

import { useState } from "react";
import Image from "next/image";
import type { DigitalProduct } from "../../lib/digital/catalog";
import type { DigitalLanguage } from "../../lib/digital/types";
import { useLocale } from "../../lib/i18n/locale-context";
import { useCurrency } from "../../lib/currency-context";
import { formatMoney } from "../../lib/currency";

export function ProductCard({
  product,
  onAdd,
}: {
  product: DigitalProduct;
  onAdd: (language: DigitalLanguage) => void;
}) {
  const { locale, t } = useLocale();
  const { currency } = useCurrency();
  const availableLanguages = product.availableLanguages ?? ["ar", "en"];
  const [language, setLanguage] = useState<DigitalLanguage>(
    availableLanguages.includes(locale) ? locale : availableLanguages[0]
  );

  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const whatsInside = locale === "ar" ? product.whatsInsideAr : product.whatsInsideEn;

  return (
    <article className="flex flex-col rounded-xl border border-brown/10 bg-white/60 p-5">
      {product.coverImage && (
        <Image
          src={product.coverImage}
          alt={name}
          width={400}
          height={518}
          className="mb-3 w-full rounded-lg object-cover"
        />
      )}
      <h3 className="text-lg font-semibold">{name}</h3>
      <div className="mt-2 flex-1 rounded-lg bg-cream/60 p-3">
        <p className="text-xs font-semibold text-brown/60">{t.digitalWhatsInsideHeading}</p>
        <p className="mt-1 text-sm text-brown/70">{whatsInside}</p>
      </div>
      <p className="mt-4 font-semibold">{formatMoney(product.priceBhd, currency)}</p>

      {availableLanguages.length > 1 && (
        <fieldset className="mt-3">
          <legend className="text-sm text-brown/60">{t.digitalLanguageChoiceLabel}</legend>
          <div className="mt-1 flex gap-2">
            {availableLanguages.map((lang) => (
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
      )}

      <button
        type="button"
        onClick={() => onAdd(language)}
        className="mt-4 rounded-full bg-leaf py-2 text-white"
      >
        {t.digitalAddToCart}
      </button>
    </article>
  );
}

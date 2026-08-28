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
  const previewImages = product.previewImages ?? [];
  const [previewIndex, setPreviewIndex] = useState(0);

  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const whatsInside = locale === "ar" ? product.whatsInsideAr : product.whatsInsideEn;
  const coverImage = (language === "ar" && product.coverImageAr) || product.coverImage;
  const backCoverImage = (language === "ar" && product.backCoverImageAr) || product.backCoverImage;

  return (
    <article className="flex flex-col rounded-xl border border-brown/10 bg-white/60 p-5">
      {(coverImage || backCoverImage) && (
        <div className="mb-3 grid grid-cols-2 gap-2">
          {coverImage && (
            <Image
              src={coverImage}
              alt={name}
              width={400}
              height={518}
              className="w-full rounded-lg object-cover"
            />
          )}
          {backCoverImage && (
            <Image
              src={backCoverImage}
              alt={`${name} — ${t.digitalBackCoverAlt}`}
              width={400}
              height={518}
              className="w-full rounded-lg object-cover"
            />
          )}
        </div>
      )}
      <h3 className="text-lg font-semibold">{name}</h3>

      {previewImages.length > 0 && (
        <div className="relative mt-3">
          <Image
            src={previewImages[previewIndex]}
            alt={`${name} — ${previewIndex + 1}/${previewImages.length}`}
            width={400}
            height={518}
            className="w-full rounded-lg border border-brown/10 object-cover"
          />
          <button
            type="button"
            aria-label={t.digitalPreviewPrev}
            onClick={() =>
              setPreviewIndex((i) => (i - 1 + previewImages.length) % previewImages.length)
            }
            className="absolute start-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-lg leading-none shadow"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label={t.digitalPreviewNext}
            onClick={() => setPreviewIndex((i) => (i + 1) % previewImages.length)}
            className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-lg leading-none shadow"
          >
            ›
          </button>
          <p className="mt-1 text-center text-xs text-brown/50">
            {previewIndex + 1} / {previewImages.length}
          </p>
        </div>
      )}

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

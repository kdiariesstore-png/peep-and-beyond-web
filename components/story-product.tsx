"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { StoryLanguage } from "../lib/types";
import { PEEP_STORY_PRODUCT } from "../lib/product";
import { buildStoryCartItem } from "../lib/cart/build-cart-item";
import { useCart } from "../lib/cart/cart-context";
import { useLocale } from "../lib/i18n/locale-context";
import { useCurrency } from "../lib/currency-context";
import { formatMoney } from "../lib/currency";

interface StoryStockInfo {
  remaining: number;
  preOrder: boolean;
}

type StoryStockResponse = Record<StoryLanguage, StoryStockInfo>;

export function StoryProduct() {
  const { locale, t } = useLocale();
  const { currency } = useCurrency();
  const { addItem } = useCart();
  const [language, setLanguage] = useState<StoryLanguage>("ar");
  const [stock, setStock] = useState<StoryStockResponse | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch("/api/inventory/story-stock")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: StoryStockResponse | null) => setStock(data))
      .catch(() => setStock(null));
  }, []);

  function handleAdd() {
    addItem(buildStoryCartItem(language));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const selectedLanguageStock = stock?.[language];
  const name = locale === "ar" ? PEEP_STORY_PRODUCT.nameAr : PEEP_STORY_PRODUCT.nameEn;
  const description = locale === "ar" ? PEEP_STORY_PRODUCT.descriptionAr : PEEP_STORY_PRODUCT.descriptionEn;
  const coverImage = language === "ar" ? PEEP_STORY_PRODUCT.coverImageAr : PEEP_STORY_PRODUCT.coverImageEn;

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <Image
          src={coverImage}
          alt={name}
          width={1000}
          height={1000}
          className="w-full rounded-2xl"
        />
        <div>
          <h2 className="text-2xl font-bold">{name}</h2>
          <p className="mt-2 text-brown/70">{description}</p>
          <p className="mt-4 text-2xl font-semibold">{formatMoney(PEEP_STORY_PRODUCT.priceBhd, currency)}</p>

          <fieldset className="mt-4">
            <legend className="text-sm text-brown/60">{t.storyLanguageLabel}</legend>
            <div className="mt-2 flex gap-2">
              {(["ar", "en"] as const).map((lang) => (
                <button
                  type="button"
                  key={lang}
                  aria-pressed={language === lang}
                  onClick={() => setLanguage(lang)}
                  className={`rounded-full border px-4 py-2 text-sm ${
                    language === lang ? "border-leaf bg-leaf text-white" : "border-brown/20 bg-white text-brown"
                  }`}
                >
                  {lang === "ar" ? t.languageArabic : t.languageEnglish}
                </button>
              ))}
            </div>
            {selectedLanguageStock?.preOrder && (
              <p className="mt-1 text-sm text-amber-700">
                نفدت النسخ المطبوعة لهذه اللغة حاليًا — سيصبح طلبك طلب مسبق وقد يستغرق أكثر من
                10 أيام.
              </p>
            )}
          </fieldset>

          <button
            type="button"
            onClick={handleAdd}
            className="mt-4 rounded-full bg-leaf px-6 py-3 text-white"
          >
            {added ? "تمت الإضافة ✓" : t.addToCart}
          </button>
        </div>
      </div>
    </section>
  );
}

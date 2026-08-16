"use client";

import { useEffect, useState } from "react";
import type { BoxCustomization, StoryLanguage } from "../lib/types";
import { createDefaultCustomization } from "../lib/product";
import { buildCartItem } from "../lib/cart/build-cart-item";
import { useCart } from "../lib/cart/cart-context";
import { useLocale } from "../lib/i18n/locale-context";

interface StoryStockInfo {
  remaining: number;
  preOrder: boolean;
}

type StoryStockResponse = Record<StoryLanguage, StoryStockInfo>;

export function CustomizeBoxForm({ onDone }: { onDone: () => void }) {
  const { t } = useLocale();
  const { addItem } = useCart();
  const [customization, setCustomization] = useState<BoxCustomization>(
    createDefaultCustomization()
  );
  const [stock, setStock] = useState<StoryStockResponse | null>(null);

  useEffect(() => {
    fetch("/api/inventory/story-stock")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: StoryStockResponse | null) => setStock(data))
      .catch(() => setStock(null));
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    addItem(buildCartItem(customization));
    onDone();
  }

  const selectedLanguageStock = stock?.[customization.storyLanguage];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <h2 className="text-xl font-bold">{t.customizeTitle}</h2>
      <p className="text-sm text-brown/70">{t.customizeSubtitle}</p>

      <fieldset>
        <legend>{t.storyLanguageLabel}</legend>
        <div className="mt-2 flex gap-2">
          {(["ar", "en"] as const).map((lang) => (
            <button
              type="button"
              key={lang}
              aria-pressed={customization.storyLanguage === lang}
              onClick={() => setCustomization((c) => ({ ...c, storyLanguage: lang }))}
              className={`rounded-full border px-4 py-2 text-sm ${
                customization.storyLanguage === lang
                  ? "border-leaf bg-leaf text-white"
                  : "border-brown/20 bg-white text-brown"
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

      <fieldset>
        <legend>{t.cardLanguageLabel}</legend>
        <div className="mt-2 flex gap-2">
          {(["ar", "en"] as const).map((lang) => (
            <button
              type="button"
              key={lang}
              aria-pressed={customization.cardLanguage === lang}
              onClick={() => setCustomization((c) => ({ ...c, cardLanguage: lang }))}
              className={`rounded-full border px-4 py-2 text-sm ${
                customization.cardLanguage === lang
                  ? "border-leaf bg-leaf text-white"
                  : "border-brown/20 bg-white text-brown"
              }`}
            >
              {lang === "ar" ? t.languageArabic : t.languageEnglish}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>{t.cupColorLabel}</legend>
        <div className="mt-2 flex gap-2">
          {(["pink", "blue"] as const).map((color) => (
            <button
              type="button"
              key={color}
              aria-pressed={customization.cupColor === color}
              onClick={() => setCustomization((c) => ({ ...c, cupColor: color }))}
              className={`rounded-full border px-4 py-2 text-sm ${
                customization.cupColor === color
                  ? "border-leaf bg-leaf text-white"
                  : "border-brown/20 bg-white text-brown"
              }`}
            >
              {color === "pink" ? t.cupPink : t.cupBlue}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block">
        {t.childNameLabel}
        <input
          type="text"
          value={customization.childName}
          onChange={(event) =>
            setCustomization((c) => ({ ...c, childName: event.target.value }))
          }
          className="mt-1 block w-full rounded border border-brown/20 p-2"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={customization.giftCard}
          onChange={(event) =>
            setCustomization((c) => ({ ...c, giftCard: event.target.checked }))
          }
        />
        {t.giftCardLabel} ({t.giftCardFree})
      </label>

      <button type="submit" className="w-full rounded-full bg-leaf py-3 text-white">
        {t.addToCart}
      </button>
    </form>
  );
}

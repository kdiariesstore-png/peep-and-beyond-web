"use client";

import { useState } from "react";
import type { BoxCustomization } from "../lib/types";
import { createDefaultCustomization } from "../lib/product";
import { buildCartItem } from "../lib/cart/build-cart-item";
import { useCart } from "../lib/cart/cart-context";
import { useLocale } from "../lib/i18n/locale-context";

export function CustomizeBoxForm({ onDone }: { onDone: () => void }) {
  const { t } = useLocale();
  const { addItem } = useCart();
  const [customization, setCustomization] = useState<BoxCustomization>(
    createDefaultCustomization()
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    addItem(buildCartItem(customization));
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <h2 className="text-xl font-bold">{t.customizeTitle}</h2>
      <p className="text-sm text-brown/70">{t.customizeSubtitle}</p>

      <fieldset>
        <legend>{t.storyLanguageLabel}</legend>
        {(["ar", "en"] as const).map((lang) => (
          <button
            type="button"
            key={lang}
            aria-pressed={customization.storyLanguage === lang}
            onClick={() => setCustomization((c) => ({ ...c, storyLanguage: lang }))}
          >
            {lang === "ar" ? t.languageArabic : t.languageEnglish}
          </button>
        ))}
      </fieldset>

      <fieldset>
        <legend>{t.cardLanguageLabel}</legend>
        {(["ar", "en"] as const).map((lang) => (
          <button
            type="button"
            key={lang}
            aria-pressed={customization.cardLanguage === lang}
            onClick={() => setCustomization((c) => ({ ...c, cardLanguage: lang }))}
          >
            {lang === "ar" ? t.languageArabic : t.languageEnglish}
          </button>
        ))}
      </fieldset>

      <fieldset>
        <legend>{t.cupColorLabel}</legend>
        {(["pink", "blue"] as const).map((color) => (
          <button
            type="button"
            key={color}
            aria-pressed={customization.cupColor === color}
            onClick={() => setCustomization((c) => ({ ...c, cupColor: color }))}
          >
            {color === "pink" ? t.cupPink : t.cupBlue}
          </button>
        ))}
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

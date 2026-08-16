"use client";

import { useLocale } from "../lib/i18n/locale-context";
import { useCurrency } from "../lib/currency-context";
import { useCart } from "../lib/cart/cart-context";

export function Header({ onCartClick }: { onCartClick: () => void }) {
  const { locale, setLocale, t } = useLocale();
  const { currency, setCurrency } = useCurrency();
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="flex items-center justify-between border-b border-brown/10 px-6 py-4">
      <span className="text-xl font-bold">Peep &amp; beyond</span>
      <nav className="hidden gap-6 md:flex">
        <a href="#shop">{t.navShop}</a>
        <a href="#journey">{t.navStories}</a>
        <a href="#inside">{t.navGifts}</a>
        <a href="#about">{t.navAbout}</a>
      </nav>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          aria-label="toggle language"
        >
          {locale === "ar" ? "EN" : "العربية"}
        </button>
        <button
          type="button"
          onClick={() => setCurrency(currency === "BHD" ? "USD" : "BHD")}
          aria-label="toggle currency"
        >
          {currency === "BHD" ? "USD" : "BHD"}
        </button>
        <button type="button" onClick={onCartClick} aria-label="open cart">
          🛍️ {itemCount > 0 ? itemCount : ""}
        </button>
      </div>
    </header>
  );
}

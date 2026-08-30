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
    <header className="sticky top-0 z-40 border-b border-brown/10 bg-cream/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="/" className="text-lg font-black tracking-tight sm:text-xl">Peep &amp; beyond</a>
        <nav className="hidden gap-6 md:flex">
          <a href="/#choose" className="font-semibold hover:text-leaf">{locale === "ar" ? "اختر بوكسك" : "Choose your box"}</a>
          <a href="/#inside" className="font-semibold hover:text-leaf">{t.navGifts}</a>
          <a href="/digital" className="font-semibold hover:text-leaf">{t.navDigitalProducts}</a>
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
          <button type="button" onClick={onCartClick} aria-label="open cart" className="relative grid h-10 w-10 place-items-center rounded-full bg-brown text-cream">
            <span aria-hidden>🛍</span>{itemCount > 0 && <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-leaf px-1 text-[10px] font-bold text-white">{itemCount}</span>}
          </button>
        </div>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-5 overflow-x-auto border-t border-brown/10 px-4 py-2 text-sm font-semibold md:hidden">
        <a href="/#choose" className="whitespace-nowrap">{locale === "ar" ? "اختر بوكسك" : "Choose a box"}</a>
        <a href="/#inside" className="whitespace-nowrap">{t.navGifts}</a>
        <a href="/digital">{t.navDigitalProducts}</a>
      </nav>
    </header>
  );
}

"use client";

import { useState } from "react";
import { Header } from "../../components/header";
import { Footer } from "../../components/footer";
import { CartDrawer } from "../../components/cart-drawer";
import { ProductCard } from "../../components/digital/product-card";
import { BundleCard } from "../../components/digital/bundle-card";
import { DIGITAL_PRODUCTS, DIGITAL_BUNDLES } from "../../lib/digital/catalog";
import { useDigitalCart } from "../../lib/digital/cart-context";
import { useLocale } from "../../lib/i18n/locale-context";
import { useCurrency } from "../../lib/currency-context";
import { formatMoney } from "../../lib/currency";
import type { DigitalLanguage, DigitalProductId, DigitalTopicId } from "../../lib/digital/types";

export default function DigitalProductsPage() {
  const { locale, t } = useLocale();
  const { currency } = useCurrency();
  const { items, addOrReplaceItem, removeItem } = useDigitalCart();
  const [filter, setFilter] = useState<DigitalTopicId | "all">("all");
  const [showCart, setShowCart] = useState(false);

  const visibleProducts =
    filter === "all" ? DIGITAL_PRODUCTS : DIGITAL_PRODUCTS.filter((p) => p.id === filter);

  const subtotalBhd = items.reduce((sum, item) => sum + item.unitPriceBhd, 0);

  // Resolves a cart line's display name in the current locale, covering both individual
  // topics and any bundle (bundles live outside DIGITAL_PRODUCTS).
  function itemLabel(id: DigitalProductId): string {
    const bundle = DIGITAL_BUNDLES.find((b) => b.id === id);
    if (bundle) return locale === "ar" ? bundle.nameAr : bundle.nameEn;
    const product = DIGITAL_PRODUCTS.find((p) => p.id === id);
    return product ? (locale === "ar" ? product.nameAr : product.nameEn) : id;
  }

  return (
    <>
      <Header onCartClick={() => setShowCart(true)} />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold">{t.digitalPageTitle}</h1>
        <p className="mt-2 text-brown/70">{t.digitalPageSubtitle}</p>
        <p className="mt-1 text-sm text-brown/60">{t.digitalTabletNote}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {DIGITAL_BUNDLES.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              onAdd={(language) => addOrReplaceItem({ id: bundle.id, language, unitPriceBhd: bundle.priceBhd })}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
            className={`rounded-full border px-4 py-2 text-sm ${
              filter === "all" ? "border-leaf bg-leaf text-white" : "border-brown/20 bg-white text-brown"
            }`}
          >
            {t.digitalFilterAll}
          </button>
          {DIGITAL_PRODUCTS.map((product) => (
            <button
              type="button"
              key={product.id}
              aria-pressed={filter === product.id}
              onClick={() => setFilter(product.id)}
              className={`rounded-full border px-4 py-2 text-sm ${
                filter === product.id ? "border-leaf bg-leaf text-white" : "border-brown/20 bg-white text-brown"
              }`}
            >
              {locale === "ar" ? product.nameAr : product.nameEn}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={(language: DigitalLanguage) =>
                addOrReplaceItem({ id: product.id, language, unitPriceBhd: product.priceBhd })
              }
            />
          ))}
        </div>

      </main>
      <Footer />

      {items.length > 0 && (
        <div className="fixed left-4 top-24 z-40 max-h-[70vh] w-72 max-w-[85vw] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-bold">{t.digitalCartTitle}</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 border-b border-brown/10 pb-3"
              >
                <div>
                  <p className="font-medium">{itemLabel(item.id)}</p>
                  <p className="text-sm text-brown/60">
                    {item.language === "ar" ? t.languageArabic : t.languageEnglish} —{" "}
                    {formatMoney(item.unitPriceBhd, currency)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-sm text-brown/60 underline"
                >
                  {t.digitalRemoveItem}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-semibold">{formatMoney(subtotalBhd, currency)}</p>
          <a
            href="/digital/checkout"
            className="mt-4 block rounded-full bg-leaf px-6 py-3 text-center text-white"
          >
            {t.digitalConfirmButton}
          </a>
        </div>
      )}
      <CartDrawer open={showCart} onClose={() => setShowCart(false)} />
    </>
  );
}

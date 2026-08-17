"use client";

import { useState } from "react";
import { Header } from "../../components/header";
import { Footer } from "../../components/footer";
import { CartDrawer } from "../../components/cart-drawer";
import { ProductCard } from "../../components/digital/product-card";
import { BundleCard } from "../../components/digital/bundle-card";
import { DIGITAL_PRODUCTS, DIGITAL_BUNDLE } from "../../lib/digital/catalog";
import { useDigitalCart } from "../../lib/digital/cart-context";
import { useLocale } from "../../lib/i18n/locale-context";
import { useCurrency } from "../../lib/currency-context";
import { formatMoney } from "../../lib/currency";
import type { DigitalLanguage, DigitalTopicId } from "../../lib/digital/types";

export default function DigitalProductsPage() {
  const { locale, t } = useLocale();
  const { currency } = useCurrency();
  const { items, addOrReplaceItem } = useDigitalCart();
  const [filter, setFilter] = useState<DigitalTopicId | "all">("all");
  const [showCart, setShowCart] = useState(false);

  const visibleProducts =
    filter === "all" ? DIGITAL_PRODUCTS : DIGITAL_PRODUCTS.filter((p) => p.id === filter);

  const subtotalBhd = items.reduce((sum, item) => sum + item.unitPriceBhd, 0);

  return (
    <>
      <Header onCartClick={() => setShowCart(true)} />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold">{t.digitalPageTitle}</h1>
        <p className="mt-2 text-brown/70">{t.digitalPageSubtitle}</p>
        <p className="mt-1 text-sm text-brown/60">{t.digitalTabletNote}</p>

        <div className="mt-8">
          <BundleCard onAdd={(language) => addOrReplaceItem({ id: "digital-bundle", language, unitPriceBhd: DIGITAL_BUNDLE.priceBhd })} />
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

        {items.length > 0 && (
          <div className="mt-10 rounded-xl bg-white/60 p-6">
            <h2 className="text-lg font-bold">{t.digitalCartTitle}</h2>
            <p className="mt-2 font-semibold">{formatMoney(subtotalBhd, currency)}</p>
            <a
              href="/digital/checkout"
              className="mt-4 inline-block rounded-full bg-leaf px-6 py-3 text-white"
            >
              {t.digitalConfirmButton}
            </a>
          </div>
        )}
      </main>
      <Footer />
      <CartDrawer open={showCart} onClose={() => setShowCart(false)} />
    </>
  );
}

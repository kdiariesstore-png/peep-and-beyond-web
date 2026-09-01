"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "../lib/cart/cart-context";
import { buildIndividualProductCartItem } from "../lib/cart/build-cart-item";
import { formatMoney } from "../lib/currency";
import { useCurrency } from "../lib/currency-context";
import { useLocale } from "../lib/i18n/locale-context";
import {
  BUILDER_PRODUCTS,
  createDefaultCustomization,
  isPhysicalBoxAvailable,
} from "../lib/product";
import type { BuilderProductId } from "../lib/types";

const NEW_PRODUCTS = new Set<BuilderProductId>([
  "lulu-stickers",
  "lulu-coloring-book",
  "clothes-activity-book",
]);

export function ProductsShop({ onAdded }: { onAdded: () => void }) {
  const { addItem } = useCart();
  const { locale } = useLocale();
  const { currency } = useCurrency();
  const ar = locale === "ar";
  const available = isPhysicalBoxAvailable();
  const [customization, setCustomization] = useState(createDefaultCustomization);

  function addProduct(productId: BuilderProductId) {
    if (!available) return;
    addItem(buildIndividualProductCartItem(productId, customization));
    onAdded();
  }

  return (
    <section id="products" className="bg-white/45 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="section-kicker">{ar ? "كل منتجاتنا" : "The Peep shop"}</span>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              {ar ? "اختَر منتجًا واحدًا… أو أكثر" : "Choose one favorite—or a few"}
            </h2>
            <p className="mt-4 leading-7 text-brown/70">
              {ar ? "كل منتج متوفر للشراء على حدة، ويمكنك أيضًا جمعه داخل بوكس من اختيارك." : "Every product is available on its own, or you can add it to a box made your way."}
            </p>
          </div>
          <a href="/build?style=custom" className="button-secondary w-fit">
            {ar ? "أفضّل أصنع بوكس" : "I'd rather build a box"}
          </a>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {BUILDER_PRODUCTS.map((product) => (
            <article key={product.id} className="group flex overflow-hidden rounded-[1.75rem] border border-brown/10 bg-cream shadow-[0_12px_35px_rgba(59,42,30,.07)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(59,42,30,.12)] sm:flex-col">
              <div className="relative aspect-square w-36 shrink-0 overflow-hidden bg-[#f7efe3] sm:w-full">
                {NEW_PRODUCTS.has(product.id) && (
                  <span className="absolute start-3 top-3 z-10 rounded-full bg-gold px-3 py-1 text-[10px] font-black text-brown">
                    {ar ? "جديد" : "NEW"}
                  </span>
                )}
                <Image
                  src={product.image}
                  alt={ar ? product.nameAr : product.nameEn}
                  fill
                  className="object-contain p-2 transition duration-300 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 144px, (max-width: 1280px) 33vw, 25vw"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-black leading-6">{ar ? product.nameAr : product.nameEn}</h3>
                  <strong className="whitespace-nowrap text-leaf">{formatMoney(product.priceBhd, currency)}</strong>
                </div>
                <p className="mt-2 hidden text-sm leading-6 text-brown/60 sm:block">{ar ? product.descriptionAr : product.descriptionEn}</p>

                {product.id === "story" && (
                  <MiniChoice
                    label={ar ? "لغة القصة" : "Story language"}
                    value={customization.storyLanguage}
                    onChange={(value) => setCustomization((current) => ({ ...current, storyLanguage: value }))}
                    ar={ar}
                  />
                )}
                {product.id === "alphabet-cards" && (
                  <MiniChoice
                    label={ar ? "لغة البطاقات" : "Card language"}
                    value={customization.cardLanguage}
                    onChange={(value) => setCustomization((current) => ({ ...current, cardLanguage: value }))}
                    ar={ar}
                  />
                )}
                {product.id === "cup" && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-brown/60">{ar ? "لون الكوب" : "Cup color"}</p>
                    <div className="mt-2 flex gap-2">
                      {(["pink", "blue"] as const).map((color) => (
                        <button key={color} type="button" onClick={() => setCustomization((current) => ({ ...current, cupColor: color }))} className={`choice-pill !px-3 !py-1 text-xs ${customization.cupColor === color ? "choice-pill-active" : ""}`}>
                          {color === "pink" ? (ar ? "وردي" : "Pink") : (ar ? "أزرق" : "Blue")}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button type="button" onClick={() => addProduct(product.id)} disabled={!available} className="mt-auto pt-4 text-start text-sm font-black text-leaf disabled:cursor-not-allowed disabled:opacity-40">
                  {available ? (ar ? "+ أضف إلى السلة" : "+ Add to cart") : (ar ? "قريبًا" : "Coming soon")}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MiniChoice({ label, value, onChange, ar }: { label: string; value: "ar" | "en"; onChange: (value: "ar" | "en") => void; ar: boolean }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-bold text-brown/60">{label}</p>
      <div className="mt-2 flex gap-2">
        {(["ar", "en"] as const).map((option) => (
          <button key={option} type="button" onClick={() => onChange(option)} className={`choice-pill !px-3 !py-1 text-xs ${value === option ? "choice-pill-active" : ""}`}>
            {option === "ar" ? (ar ? "عربي" : "Arabic") : (ar ? "إنجليزي" : "English")}
          </button>
        ))}
      </div>
    </div>
  );
}

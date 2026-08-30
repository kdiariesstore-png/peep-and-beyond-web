"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { BuilderProductId, PhysicalBoxKind } from "../lib/types";
import {
  BUILDER_BASE_PRICE_BHD,
  BUILDER_MIN_PRODUCTS,
  BUILDER_PRODUCTS,
  calculateBuilderPrice,
  createDefaultCustomization,
} from "../lib/product";
import { useLocale } from "../lib/i18n/locale-context";
import { useCurrency } from "../lib/currency-context";
import { formatMoney } from "../lib/currency";
import { useCart } from "../lib/cart/cart-context";
import { buildCustomCartItem } from "../lib/cart/build-cart-item";

export function BoxBuilder({ kind, onAdded }: { kind: Exclude<PhysicalBoxKind, "ready-made">; onAdded: () => void }) {
  const { locale } = useLocale();
  const { currency } = useCurrency();
  const { addItem } = useCart();
  const ar = locale === "ar";
  const [selected, setSelected] = useState<BuilderProductId[]>([]);
  const [customization, setCustomization] = useState(() => ({
    ...createDefaultCustomization(),
    giftCard: kind === "ready-to-gift",
  }));
  const [attempted, setAttempted] = useState(false);
  const total = useMemo(() => calculateBuilderPrice(selected), [selected]);
  const remaining = Math.max(0, BUILDER_MIN_PRODUCTS - selected.length);
  const ready = remaining === 0;

  function toggle(id: BuilderProductId) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function addToCart() {
    setAttempted(true);
    if (!ready) return;
    addItem(buildCustomCartItem(kind, selected, customization));
    onAdded();
  }

  const includes = (id: BuilderProductId) => selected.includes(id);

  return (
    <main className="pb-32 lg:pb-16">
      <section className="border-b border-brown/10 bg-[#f4eadc] px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <a href="/" className="text-sm font-bold text-leaf">{ar ? "← العودة للمتجر" : "← Back to shop"}</a>
          <div className="mt-7 grid items-end gap-6 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <span className="section-kicker">{kind === "ready-to-gift" ? (ar ? "هدية بتفاصيلك" : "Gift-ready, made by you") : (ar ? "اختيارك من البداية" : "Made your way")}</span>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
                {kind === "ready-to-gift" ? (ar ? "جهّز بوكس بيب للإهداء" : "Create a Ready-to-Gift Peep Box") : (ar ? "اصنع بوكس بيب الخاص فيك" : "Build Your Own Peep Box")}
              </h1>
              <p className="mt-4 max-w-2xl leading-7 text-brown/70">
                {ar ? "البوكس يبدأ من 4 د.ب. اختر 5 منتجات على الأقل، وشاهد العدد والسعر يتحدثان مباشرة." : "Your box starts at BHD 4. Choose at least 5 products and watch the count and total update live."}
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-5 text-sm shadow-sm">
              <p className="text-brown/60">{ar ? "البوكس والتجهيز" : "Box & preparation"}</p>
              <p className="mt-1 text-2xl font-black">{formatMoney(BUILDER_BASE_PRICE_BHD, currency)}</p>
              <p className="mt-1 text-xs text-brown/60">{kind === "ready-to-gift" ? (ar ? "يشمل التغليف وبطاقة الإهداء" : "Includes wrapping & gift card") : (ar ? "يشمل البوكس والتجهيز" : "Includes box & preparation")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px] lg:py-14">
        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-leaf">{ar ? "الخطوة 1 من 2" : "Step 1 of 2"}</p>
              <h2 className="mt-1 text-2xl font-black">{ar ? "اختر المنتجات" : "Pick your products"}</h2>
            </div>
            <p className="text-sm font-bold" aria-live="polite">
              {selected.length} / {BUILDER_MIN_PRODUCTS} {ar ? "منتجات" : "products"}
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-brown/10" aria-hidden>
            <div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${Math.min(100, selected.length / BUILDER_MIN_PRODUCTS * 100)}%` }} />
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {BUILDER_PRODUCTS.map((product) => {
              const active = includes(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggle(product.id)}
                  aria-pressed={active}
                  className={`product-choice text-start ${active ? "product-choice-active" : ""}`}
                >
                  <div className="relative h-36 w-full overflow-hidden rounded-2xl bg-[#efe6d8]">
                    <Image src={product.image} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                    <span className={`absolute end-3 top-3 grid h-8 w-8 place-items-center rounded-full border-2 text-lg font-black ${active ? "border-leaf bg-leaf text-white" : "border-white bg-white/90 text-transparent"}`}>✓</span>
                  </div>
                  <div className="flex items-start justify-between gap-3 p-4">
                    <div>
                      <h3 className="font-black">{ar ? product.nameAr : product.nameEn}</h3>
                      <p className="mt-1 text-xs leading-5 text-brown/60">{ar ? product.descriptionAr : product.descriptionEn}</p>
                    </div>
                    <strong className="whitespace-nowrap text-sm">+ {formatMoney(product.priceBhd, currency)}</strong>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-12 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-bold text-leaf">{ar ? "الخطوة 2 من 2" : "Step 2 of 2"}</p>
            <h2 className="mt-1 text-2xl font-black">{ar ? "أضف اللمسة الشخصية" : "Add the personal touches"}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <label className="block text-sm font-bold">
                {ar ? "اسم الطفل (اختياري)" : "Child's name (optional)"}
                <input value={customization.childName} onChange={(event) => setCustomization((c) => ({ ...c, childName: event.target.value }))} className="field" placeholder={ar ? "مثال: يوسف" : "e.g. Yusuf"} />
              </label>
              {includes("story") && (
                <Choice label={ar ? "لغة القصة" : "Story language"} value={customization.storyLanguage} onChange={(value) => setCustomization((c) => ({ ...c, storyLanguage: value }))} ar={ar} />
              )}
              {includes("alphabet-cards") && (
                <Choice label={ar ? "لغة بطاقات الحروف" : "Alphabet card language"} value={customization.cardLanguage} onChange={(value) => setCustomization((c) => ({ ...c, cardLanguage: value }))} ar={ar} />
              )}
              {includes("cup") && (
                <div>
                  <p className="text-sm font-bold">{ar ? "لون الكوب" : "Cup color"}</p>
                  <div className="mt-2 flex gap-2">
                    {(["pink", "blue"] as const).map((color) => <button key={color} type="button" onClick={() => setCustomization((c) => ({ ...c, cupColor: color }))} className={`choice-pill ${customization.cupColor === color ? "choice-pill-active" : ""}`}>{color === "pink" ? (ar ? "وردي" : "Pink") : (ar ? "أزرق" : "Blue")}</button>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-3xl bg-brown p-6 text-cream shadow-xl">
            <p className="text-sm font-bold text-[#cbd9bd]">{ar ? "ملخص بوكسك" : "Your box summary"}</p>
            <div className="mt-5 flex items-end justify-between"><span>{ar ? "المنتجات" : "Products"}</span><strong className="text-2xl">{selected.length}</strong></div>
            <div className="my-5 border-t border-cream/15" />
            <div className="flex items-end justify-between"><span>{ar ? "الإجمالي" : "Total"}</span><strong className="text-2xl">{formatMoney(total, currency)}</strong></div>
            <p className={`mt-4 rounded-xl px-3 py-2 text-sm ${ready ? "bg-leaf/30 text-cream" : "bg-cream/10 text-cream/75"}`} aria-live="polite">
              {ready ? (ar ? "ممتاز! بوكسك جاهز للسلة." : "Perfect! Your box is ready.") : (ar ? `اختر ${remaining} ${remaining === 1 ? "منتج إضافي" : "منتجات إضافية"}` : `Choose ${remaining} more ${remaining === 1 ? "product" : "products"}`)}
            </p>
            <button type="button" onClick={addToCart} disabled={!ready} className="mt-5 w-full rounded-full bg-cream px-5 py-3 font-black text-brown disabled:cursor-not-allowed disabled:opacity-40">{ar ? "أضف بوكسك إلى السلة" : "Add your box to cart"}</button>
          </div>
        </aside>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brown/10 bg-cream/95 p-3 shadow-[0_-10px_30px_rgba(59,42,30,.12)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-brown/60">{selected.length}/{BUILDER_MIN_PRODUCTS} {ar ? "منتجات" : "products"}</p>
            <p className="text-xl font-black">{formatMoney(total, currency)}</p>
          </div>
          <button type="button" onClick={addToCart} disabled={!ready} className="rounded-full bg-leaf px-5 py-3 text-sm font-black text-white disabled:opacity-45">{ready ? (ar ? "أضف إلى السلة" : "Add to cart") : (ar ? `باقي ${remaining}` : `${remaining} to go`)}</button>
        </div>
        {attempted && !ready && <p className="mx-auto mt-2 max-w-lg text-xs font-bold text-red-700" role="alert">{ar ? "اختَر 5 منتجات على الأقل لإضافة البوكس." : "Choose at least 5 products to add this box."}</p>}
      </div>
    </main>
  );
}

function Choice({ label, value, onChange, ar }: { label: string; value: "ar" | "en"; onChange: (value: "ar" | "en") => void; ar: boolean }) {
  return <div><p className="text-sm font-bold">{label}</p><div className="mt-2 flex gap-2">{(["ar", "en"] as const).map((option) => <button key={option} type="button" onClick={() => onChange(option)} className={`choice-pill ${value === option ? "choice-pill-active" : ""}`}>{option === "ar" ? (ar ? "العربية" : "Arabic") : (ar ? "الإنجليزية" : "English")}</button>)}</div></div>;
}

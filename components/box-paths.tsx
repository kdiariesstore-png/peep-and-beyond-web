"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "../lib/i18n/locale-context";
import { useCurrency } from "../lib/currency-context";
import { formatMoney } from "../lib/currency";
import { PEEP_BOX_PRODUCT } from "../lib/product";

export function BoxPaths({ onReadyMadeAdd }: { onReadyMadeAdd: () => void }) {
  const { locale } = useLocale();
  const { currency } = useCurrency();
  const ar = locale === "ar";
  const paths = [
    {
      eyebrow: ar ? "اختيارك بالكامل" : "Make it yours",
      title: ar ? "اصنع بوكس بيب الخاص فيك" : "Build Your Own Peep Box",
      body: ar
        ? "اختيار مرن وبسيط: ابدأ بـ3 منتجات، ثم أضف ما يناسب الطفل وميزانيتك."
        : "A simple, flexible choice: start with 3 products, then add what fits the child and your budget.",
      price: ar ? "3 منتجات" : "3 products",
      pricePrefix: ar ? "يبدأ من" : "Starts with",
      href: "/build?style=custom",
      cta: ar ? "ابدأ الاختيار" : "Start building",
      image: "/images/peep-box-choose-products.webp",
      // An animated WebP — Next's image optimizer would flatten it to a single
      // static frame, so this one must bypass optimization to keep the animation.
      imageUnoptimized: true,
      accent: "bg-[#f0e7d6]",
    },
  ];

  return (
    <section id="choose" className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-kicker">{ar ? "طريقتان، فرحة واحدة" : "Two ways to make their day"}</span>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            {ar ? "أي بوكس يشبه هديتك؟" : "Which Peep Box feels right?"}
          </h2>
          <p className="mt-4 text-brown/70">
            {ar ? "اختيار سريع وواضح، مع السعر أمامك في كل خطوة." : "A clear, simple choice with the price visible at every step."}
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {paths.map((path) => (
            <article key={path.href} className="path-card">
              <div className={`relative h-56 overflow-hidden ${path.accent}`}>
                <Image
                  src={path.image}
                  alt=""
                  fill
                  unoptimized={path.imageUnoptimized}
                  className="object-contain p-2"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">{path.eyebrow}</p>
                <h3 className="mt-2 text-2xl font-black">{path.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-brown/70">{path.body}</p>
                <p className="mt-6 text-sm text-brown/60">
                  {path.pricePrefix} <strong className="text-xl text-brown">{path.price}</strong>
                </p>
                <Link href={path.href} className="button-primary mt-4 text-center">{path.cta}</Link>
              </div>
            </article>
          ))}

          <article className="path-card border-brown/10 bg-brown text-cream">
            <div className="relative h-56 overflow-hidden bg-[#d6b98c]">
              <span className="absolute start-4 top-4 z-10 rounded-full bg-cream px-3 py-1 text-xs font-bold text-brown">
                {ar ? "جاهز فورًا" : "Ready now"}
              </span>
              <Image src="/images/peep-box-detail.webp" alt="" fill className="object-contain p-2" sizes="(max-width: 1024px) 100vw, 33vw" />
            </div>
            <div className="flex flex-1 flex-col p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#cbd9bd]">{ar ? "اختيارنا الكامل" : "Our complete pick"}</p>
              <h3 className="mt-2 text-2xl font-black">{ar ? "بوكس بيب الكامل" : "The Complete Peep Box"}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-cream/75">
                {ar ? "كل منتجات بيب المحبوبة داخل بوكس واحد، جاهز للإضافة إلى السلة بضغطة." : "Every Peep favorite in one complete box, ready to add in a single tap."}
              </p>
              <p className="mt-6 text-xl font-black">{formatMoney(PEEP_BOX_PRODUCT.priceBhd, currency)}</p>
              <button type="button" onClick={onReadyMadeAdd} className="mt-4 rounded-full bg-cream px-5 py-3 font-bold text-brown transition hover:bg-white">
                {ar ? "أضف البوكس الكامل" : "Add the complete box"}
              </button>
              <a href="#inside" className="mt-3 text-center text-sm font-semibold text-cream/75 underline underline-offset-4">
                {ar ? "شاهد كل المحتويات" : "See everything inside"}
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useLocale } from "../lib/i18n/locale-context";
import Link from "next/link";

export function Hero() {
  const { locale } = useLocale();
  const ar = locale === "ar";

  return (
    <section className="hero-surface px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.02fr_.98fr]">
      <div className="text-center lg:text-start">
        <span className="section-kicker">{ar ? "هدية صغيرة… أثرها يكبر" : "A little box. A big feeling."}</span>
        <h1 className="mt-4 text-4xl font-black leading-[1.12] tracking-tight sm:text-6xl lg:text-7xl">
          {ar ? "اصنع فرحتهم،" : "Build their joy,"}<br />
          <span className="text-leaf">{ar ? "قطعةً قطعة." : "one little piece at a time."}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-brown/70 sm:text-lg lg:mx-0">
          {ar ? "اختر بوكس بيب الكامل، اصنع بوكسك من 3 منتجات، أو جهّز بوكسًا مميزًا للإهداء. قصة ولعب وتعلّم، باختيارك أنت." : "Choose the complete Peep Box, build your own from 3 products, or create a premium gift box—story, play and learning, picked by you."}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
          <Link href="/build?style=custom" className="button-primary">{ar ? "ابدأ بوكسك" : "Build your box"}</Link>
          <a href="#products" className="button-secondary">{ar ? "تسوّق المنتجات" : "Shop products"}</a>
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold text-brown/65 lg:justify-start">
          <span>✓ {ar ? "ابدأ من 3 منتجات" : "Start with 3 products"}</span>
          <span>✓ {ar ? "توصيل البحرين 2 د.ب" : "Bahrain delivery BHD 2"}</span>
          <span>✓ {ar ? "دفع آمن" : "Secure checkout"}</span>
        </div>
      </div>
      <div className="relative order-first lg:order-last">
        <div className="absolute -inset-3 rotate-2 rounded-[2.5rem] bg-[#dfe8d8]" aria-hidden />
        <Image
          src="/images/peep-box-real.webp"
          alt={ar ? "بوكس بيب مفتوح مع منتجاته" : "An open Peep Box with its products"}
          width={920}
          height={1150}
          className="relative aspect-[4/5] w-full rounded-[2rem] bg-cream object-contain shadow-xl"
          priority
        />
      </div>
      </div>
    </section>
  );
}

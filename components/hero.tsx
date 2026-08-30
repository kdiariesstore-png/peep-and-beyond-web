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
          {ar ? "بوكس بيب،" : "A Peep Box,"}<br />
          <span className="text-leaf">{ar ? "بالطريقة اللي تحبها." : "made their way."}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-brown/70 sm:text-lg lg:mx-0">
          {ar ? "اختَر بوكسًا جاهزًا، أو اصنع هدية من 5 منتجات وأكثر. قصة ولعب وتعلّم، بتغليف يفرّح من أول نظرة." : "Choose a complete box or build a thoughtful gift with 5 or more products—story, play and learning, wrapped to delight."}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
          <Link href="/build?style=gift" className="button-primary">{ar ? "جهّز هدية بيب" : "Create a Peep gift"}</Link>
          <a href="#choose" className="button-secondary">{ar ? "شاهد الخيارات الثلاثة" : "Explore all three options"}</a>
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold text-brown/65 lg:justify-start">
          <span>✓ {ar ? "يبدأ من 4 د.ب" : "From BHD 4"}</span>
          <span>✓ {ar ? "توصيل البحرين 2 د.ب" : "Bahrain delivery BHD 2"}</span>
          <span>✓ {ar ? "دفع آمن" : "Secure checkout"}</span>
        </div>
      </div>
      <div className="relative order-first lg:order-last">
        <div className="absolute -inset-3 rotate-2 rounded-[2.5rem] bg-[#dfe8d8]" aria-hidden />
        <Image
          src="/images/peep-box-product.png"
          alt={ar ? "بوكس بيب مفتوح مع منتجاته" : "An open Peep Box with its products"}
          width={800}
          height={600}
          className="relative aspect-[4/3] w-full rounded-[2rem] object-cover shadow-xl"
          priority
        />
      </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useLocale } from "../lib/i18n/locale-context";

export function ThreeMoments() {
  const { locale } = useLocale();
  const moments =
    locale === "ar"
      ? [
          { title: "اقرأ", body: "قصة مصوّرة ممتعة تنمّي الخيال وتفتح باب الحوار.", image: "/images/products/story.webp" },
          { title: "العب", body: "خريطة مغناطيسية وبزل بيب لوقت لعب مليء بالخيال.", image: "/images/products/puzzle.webp" },
          { title: "تعلّم", body: "بطاقات الحروف العربية أو الإنجليزية تدعم التعلّم والاستكشاف.", image: "/images/products/alphabet-cards.webp" },
        ]
      : [
          { title: "Read", body: "A fun illustrated story that grows imagination and opens conversation.", image: "/images/products/story.webp" },
          { title: "Play", body: "A Peep puzzle and magnetic map for imaginative play.", image: "/images/products/puzzle.webp" },
          { title: "Learn", body: "Arabic or English letter cards support learning and discovery.", image: "/images/products/alphabet-cards.webp" },
        ];

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <span className="section-kicker">{locale === "ar" ? "أكثر من مجرد لعبة" : "More than play"}</span>
        <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{locale === "ar" ? "ثلاث لحظات في كل يوم" : "Three moments in every day"}</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {moments.map((moment) => (
          <article key={moment.title} className="overflow-hidden rounded-[1.75rem] border border-brown/10 bg-white/65 shadow-sm">
            <Image
              src={moment.image}
              alt={moment.title}
              width={600}
              height={400}
              className="h-56 w-full bg-[#f7efe3] object-contain p-3"
            />
            <div className="p-6">
              <h3 className="text-lg font-semibold">{moment.title}</h3>
              <p className="mt-2 text-brown/70">{moment.body}</p>
            </div>
          </article>
        ))}
      </div>
      </div>
    </section>
  );
}

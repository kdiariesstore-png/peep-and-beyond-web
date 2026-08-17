"use client";

import Image from "next/image";
import { useLocale } from "../lib/i18n/locale-context";

export function ThreeMoments() {
  const { locale } = useLocale();
  const moments =
    locale === "ar"
      ? [
          { title: "اقرأ", body: "قصة مصوّرة ممتعة تنمّي الخيال وتفتح باب الحوار.", image: "/images/scene-read.png" },
          { title: "العب", body: "خريطة مغناطيسية وملصقات بيب لوقت لعب مليء بالخيال.", image: "/images/scene-play.png" },
          { title: "تعلّم", body: "بطاقات الحروف العربية أو الإنجليزية تدعم التعلّم والاستكشاف.", image: "/images/scene-learn.png" },
        ]
      : [
          { title: "Read", body: "A fun illustrated story that grows imagination and opens conversation.", image: "/images/scene-read.png" },
          { title: "Play", body: "A magnetic map and Peep stickers for imaginative play.", image: "/images/scene-play.png" },
          { title: "Learn", body: "Arabic or English letter cards support learning and discovery.", image: "/images/scene-learn.png" },
        ];

  return (
    <section className="px-6 py-10">
      <div className="grid gap-6 md:grid-cols-3">
        {moments.map((moment) => (
          <article key={moment.title} className="overflow-hidden rounded-xl bg-white/60">
            <Image
              src={moment.image}
              alt={moment.title}
              width={600}
              height={400}
              className="h-48 w-full object-cover"
            />
            <div className="p-6">
              <h3 className="text-lg font-semibold">{moment.title}</h3>
              <p className="mt-2 text-brown/70">{moment.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useLocale } from "../lib/i18n/locale-context";

export function ThreeMoments() {
  const { locale } = useLocale();
  const moments =
    locale === "ar"
      ? [
          { title: "اقرأ", body: "قصة مصوّرة ممتعة تنمّي الخيال وتفتح باب الحوار." },
          { title: "العب", body: "خريطة مغناطيسية وملصقات بيب لوقت لعب مليء بالخيال." },
          { title: "تعلّم", body: "بطاقات الحروف العربية أو الإنجليزية تدعم التعلّم والاستكشاف." },
        ]
      : [
          { title: "Read", body: "A fun illustrated story that grows imagination and opens conversation." },
          { title: "Play", body: "A magnetic map and Peep stickers for imaginative play." },
          { title: "Learn", body: "Arabic or English letter cards support learning and discovery." },
        ];

  return (
    <section className="px-6 py-10">
      <div className="grid gap-6 md:grid-cols-3">
        {moments.map((moment) => (
          <article key={moment.title} className="rounded-xl bg-white/60 p-6">
            <h3 className="text-lg font-semibold">{moment.title}</h3>
            <p className="mt-2 text-brown/70">{moment.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

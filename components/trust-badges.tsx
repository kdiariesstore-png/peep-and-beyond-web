"use client";

import { useLocale } from "../lib/i18n/locale-context";

export function TrustBadges() {
  const { locale } = useLocale();
  const badges =
    locale === "ar"
      ? [
          { title: "متجر بحريني", subtitle: "نصنع الفكرة بحب في البحرين" },
          { title: "دفع آمن", subtitle: "بطاقات عبر أوريم أو تحويل بنكي" },
          { title: "توصيل مرن", subtitle: "2 د.ب داخل البحرين" },
          { title: "تغليف بحب", subtitle: "جاهز ليصل كهدية" },
        ]
      : [
          { title: "Bahraini store", subtitle: "Made with love in Bahrain" },
          { title: "Secure payment", subtitle: "Oreem cards or bank transfer" },
          { title: "Flexible delivery", subtitle: "2 BHD within Bahrain" },
          { title: "Wrapped with love", subtitle: "Ready to arrive as a gift" },
        ];

  return (
    <section className="grid grid-cols-2 gap-4 px-6 py-10 md:grid-cols-4">
      {badges.map((badge) => (
        <article key={badge.title} className="rounded-xl bg-white/60 p-4 text-center">
          <h3 className="font-semibold">{badge.title}</h3>
          <p className="text-sm text-brown/70">{badge.subtitle}</p>
        </article>
      ))}
    </section>
  );
}

"use client";

import { useLocale } from "../lib/i18n/locale-context";

export function TrustBadges() {
  const { locale } = useLocale();
  const badges =
    locale === "ar"
      ? [
          { icon: "🇧🇭", title: "متجر بحريني", subtitle: "نصنع الفكرة بحب في البحرين" },
          { icon: "🔒", title: "دفع آمن", subtitle: "بطاقات عبر أوريم أو تحويل بنكي" },
          { icon: "🚚", title: "توصيل مرن", subtitle: "2 د.ب داخل البحرين" },
          { icon: "🎁", title: "تغليف بحب", subtitle: "جاهز ليصل كهدية" },
        ]
      : [
          { icon: "🇧🇭", title: "Bahraini store", subtitle: "Made with love in Bahrain" },
          { icon: "🔒", title: "Secure payment", subtitle: "Oreem cards or bank transfer" },
          { icon: "🚚", title: "Flexible delivery", subtitle: "BHD 2 within Bahrain" },
          { icon: "🎁", title: "Wrapped with love", subtitle: "Ready to arrive as a gift" },
        ];

  return (
    <section className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-8 sm:px-6 md:grid-cols-4 md:gap-4">
      {badges.map((badge) => (
        <article key={badge.title} className="rounded-2xl border border-brown/10 bg-white/65 p-4 text-center shadow-sm">
          <span className="text-xl" aria-hidden>{badge.icon}</span>
          <h3 className="font-semibold">{badge.title}</h3>
          <p className="text-sm text-brown/70">{badge.subtitle}</p>
        </article>
      ))}
    </section>
  );
}

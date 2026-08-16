"use client";

import { useLocale } from "../lib/i18n/locale-context";

export function Footer() {
  const { locale } = useLocale();
  return (
    <footer className="bg-brown px-6 py-10 text-center text-cream">
      <p className="text-xl font-bold">Peep &amp; beyond</p>
      <p className="mt-2 text-sm text-cream/70">
        {locale === "ar"
          ? "عالم صغير… يمتد بالخيال إلى ما هو أبعد."
          : "A small world… that stretches with imagination beyond."}
      </p>
      <a href="https://instagram.com/peepandbeyond" className="mt-4 block text-sm">
        @peepandbeyond
      </a>
      <p className="mt-6 text-xs text-cream/50">
        Peep &amp; beyond by Khadija AbdulRasool © 2026
      </p>
    </footer>
  );
}

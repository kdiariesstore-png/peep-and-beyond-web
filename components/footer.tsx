"use client";

import { useState } from "react";
import { useLocale } from "../lib/i18n/locale-context";

export function Footer() {
  const { locale } = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubscribe(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(response.ok ? "done" : "error");
      if (response.ok) setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <footer className="bg-brown px-6 py-10 text-center text-cream">
      <p className="text-xl font-bold">Peep &amp; beyond</p>
      <p className="mt-2 text-sm text-cream/70">
        {locale === "ar"
          ? "عالم صغير… يمتد بالخيال إلى ما هو أبعد."
          : "A small world… that stretches with imagination beyond."}
      </p>

      <form onSubmit={handleSubscribe} className="mx-auto mt-6 flex max-w-sm gap-2">
        <input
          type="email"
          required
          placeholder="اشتركي بالنشرة البريدية"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-full px-4 py-2 text-brown"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-full bg-leaf px-4 py-2 text-white disabled:opacity-50"
        >
          اشتركي
        </button>
      </form>
      {status === "done" && <p className="mt-2 text-sm">تم الاشتراك بنجاح!</p>}
      {status === "error" && <p className="mt-2 text-sm">تعذر الاشتراك، حاول مرة أخرى.</p>}

      <div className="mt-4 flex justify-center gap-4 text-sm">
        <a href="https://www.instagram.com/peepandbeyond" target="_blank" rel="noreferrer">
          Instagram
        </a>
        <a href="https://www.tiktok.com/@thepeepversebyme" target="_blank" rel="noreferrer">
          TikTok
        </a>
        <a href="https://youtube.com/@peepbeyond" target="_blank" rel="noreferrer">
          YouTube
        </a>
      </div>
      <p className="mt-6 text-xs text-cream/50">
        Peep &amp; beyond by Khadija AbdulRasool © 2026
      </p>
    </footer>
  );
}

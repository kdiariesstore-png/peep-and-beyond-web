"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Locale } from "../types";
import { ar, type Dictionary } from "./dictionaries/ar";
import { en } from "./dictionaries/en";

const dictionaries: Record<Locale, Dictionary> = { ar, en };
const STORAGE_KEY = "peep-locale-v1";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored === "ar" || stored === "en") setLocaleState(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Swallow write failures (e.g. QuotaExceededError, SecurityError).
    }
  }, [locale, hydrated]);

  const setLocale = (next: Locale) => setLocaleState(next);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}

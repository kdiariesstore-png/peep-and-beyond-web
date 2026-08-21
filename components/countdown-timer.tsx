"use client";

import { useEffect, useState } from "react";
import { useLocale } from "../lib/i18n/locale-context";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getRemaining(targetMs: number): Remaining | null {
  const diff = targetMs - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

// Renders nothing until mounted (remaining starts null) so the server-rendered markup
// and the pre-hydration client markup match exactly — computing "now" during render would
// otherwise diff between the build-time server render and the browser's real clock.
export function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const { t } = useLocale();
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    const targetMs = targetDate.getTime();
    setRemaining(getRemaining(targetMs));
    const timer = setInterval(() => {
      setRemaining(getRemaining(targetMs));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!remaining) return null;

  const units: Array<[number, string]> = [
    [remaining.days, t.countdownDays],
    [remaining.hours, t.countdownHours],
    [remaining.minutes, t.countdownMinutes],
    [remaining.seconds, t.countdownSeconds],
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-6 text-center">
      <p className="text-sm font-semibold text-brown/70">{t.countdownLabel}</p>
      <div className="mt-2 flex items-end justify-center gap-4 sm:gap-6">
        {units.map(([value, label]) => (
          <div key={label}>
            <span className="text-4xl font-extrabold tabular-nums text-leaf sm:text-6xl">
              {pad(value)}
            </span>
            <span className="mt-1 block text-xs font-medium text-brown/60 sm:text-sm">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

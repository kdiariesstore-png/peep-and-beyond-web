"use client";

import type { DigitalBuyerDetails } from "../../lib/digital/types";
import { useLocale } from "../../lib/i18n/locale-context";

const COUNTRIES = [
  { code: "BH", labelAr: "البحرين" },
  { code: "SA", labelAr: "السعودية" },
  { code: "AE", labelAr: "الإمارات" },
  { code: "KW", labelAr: "الكويت" },
  { code: "OM", labelAr: "عُمان" },
  { code: "QA", labelAr: "قطر" },
  { code: "GB", labelAr: "United Kingdom" },
  { code: "US", labelAr: "United States" },
];

export function DigitalBuyerForm({
  value,
  onChange,
}: {
  value: DigitalBuyerDetails;
  onChange: (value: DigitalBuyerDetails) => void;
}) {
  const { t } = useLocale();

  function update<K extends keyof DigitalBuyerDetails>(key: K, fieldValue: DigitalBuyerDetails[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-bold">{t.digitalCheckoutTitle}</legend>

      <label className="block">
        الاسم الكامل
        <input
          required
          type="text"
          value={value.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          className="mt-1 block w-full rounded border border-brown/20 p-2"
        />
      </label>

      <label className="block">
        البريد الإلكتروني
        <input
          required
          type="email"
          value={value.email}
          onChange={(e) => update("email", e.target.value)}
          className="mt-1 block w-full rounded border border-brown/20 p-2"
        />
      </label>

      <label className="block">
        الدولة
        <select
          value={value.country}
          onChange={(e) => update("country", e.target.value)}
          className="mt-1 block w-full rounded border border-brown/20 p-2"
        >
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.labelAr}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value.marketingOptIn}
          onChange={(e) => update("marketingOptIn", e.target.checked)}
        />
        أرغب أستلم آخر العروض والمنتجات الجديدة
      </label>
    </fieldset>
  );
}

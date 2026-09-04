"use client";

import type { BuyerDetails } from "../../lib/types";

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

export function BuyerForm({
  value,
  onChange,
  cityOptions,
  cityOptionsLoading,
}: {
  value: BuyerDetails;
  onChange: (value: BuyerDetails) => void;
  // Oreem's own recognized city names for the selected country (from GET
  // /shipments/cities), when available. A non-empty list renders a dropdown instead of
  // free text, so the value sent to the rates endpoint always matches spelling Oreem
  // knows — a free-typed city that doesn't match is a common cause of a bogus "shipping
  // unavailable" result. Falls back to free text when the list is empty/unavailable.
  cityOptions?: string[];
  cityOptionsLoading?: boolean;
}) {
  function update<K extends keyof BuyerDetails>(key: K, fieldValue: BuyerDetails[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-bold">بيانات الطلب</legend>

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
        رقم الهاتف
        <input
          required
          type="tel"
          value={value.phone}
          onChange={(e) => update("phone", e.target.value)}
          className="mt-1 block w-full rounded border border-brown/20 p-2"
        />
      </label>

      <label className="block">
        دولة التوصيل
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

      <label className="block">
        المدينة / المحافظة
        {cityOptions && cityOptions.length > 0 ? (
          <select
            required
            value={value.city}
            onChange={(e) => update("city", e.target.value)}
            className="mt-1 block w-full rounded border border-brown/20 p-2"
          >
            <option value="" disabled>
              اختاري المدينة
            </option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        ) : (
          <input
            required
            type="text"
            value={value.city}
            onChange={(e) => update("city", e.target.value)}
            className="mt-1 block w-full rounded border border-brown/20 p-2"
          />
        )}
        {cityOptionsLoading && (
          <span className="mt-1 block text-xs text-brown/60">جارٍ تحميل قائمة المدن...</span>
        )}
      </label>

      <label className="block">
        عنوان التوصيل بالتفصيل
        <textarea
          required
          value={value.address}
          onChange={(e) => update("address", e.target.value)}
          className="mt-1 block w-full rounded border border-brown/20 p-2"
        />
      </label>

      <fieldset>
        <legend>أين تفضل استلام الفاتورة وتحديثات الشحن؟</legend>
        {(["email", "whatsapp"] as const).map((channel) => (
          <button
            type="button"
            key={channel}
            aria-pressed={value.preferredContact === channel}
            onClick={() => update("preferredContact", channel)}
          >
            {channel === "email" ? "البريد الإلكتروني" : "الواتساب"}
          </button>
        ))}
      </fieldset>

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

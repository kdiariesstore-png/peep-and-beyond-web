"use client";

import type { PaymentMethod } from "../../lib/types";

export function PaymentMethodSelector({
  value,
  onChange,
  receiptError,
  onReceiptChange,
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  receiptError: string | null;
  onReceiptChange: (file: File | null) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-lg font-bold">طريقة الدفع</legend>

      <button
        type="button"
        aria-pressed={value === "iban"}
        onClick={() => onChange("iban")}
        className="block w-full rounded border border-brown/20 p-4 text-start"
      >
        <strong>تحويل بنكي (IBAN)</strong>
        <p className="text-sm text-brown/70">
          حوّل إلى BH04BBKU00200004090874 ثم أرفق الإيصال.
        </p>
      </button>

      {value === "iban" && (
        <label className="block">
          صورة إيصال التحويل (إلزامي — JPG أو PNG أو WebP أو PDF، بحد أقصى 8MB)
          <input
            required
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => onReceiptChange(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full"
          />
          {receiptError && <p className="text-sm text-red-600">{receiptError}</p>}
        </label>
      )}

      <button
        type="button"
        aria-pressed={value === "oreem"}
        disabled
        title="قريبًا"
        className="block w-full rounded border border-brown/20 p-4 text-start opacity-50"
      >
        <strong>بطاقة عبر أوريم (قريبًا)</strong>
        <p className="text-sm text-brown/70">بيئة اختبار آمنة لبطاقات Benefit وVisa وMastercard.</p>
      </button>
    </fieldset>
  );
}

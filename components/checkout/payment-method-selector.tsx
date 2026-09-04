"use client";

import type { PaymentMethod } from "../../lib/types";

const RECEIPT_ERROR_MESSAGES: Record<string, string> = {
  receipt_required: "يرجى إرفاق صورة إيصال التحويل.",
  receipt_invalid_type: "نوع الملف غير مدعوم — استخدم JPG أو PNG أو WebP أو PDF.",
  receipt_too_large: "حجم الملف كبير جدًا — الحد الأقصى 4 ميغابايت.",
};

export function PaymentMethodSelector({
  method,
  isBahrain,
  receiptError,
  onMethodChange,
  onReceiptChange,
}: {
  method: PaymentMethod;
  isBahrain: boolean;
  receiptError: string | null;
  onMethodChange: (method: PaymentMethod) => void;
  onReceiptChange: (file: File | null) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-lg font-bold">طريقة الدفع</legend>

      {isBahrain && (
        <div className="flex gap-2">
          <button
            type="button"
            aria-pressed={method === "iban"}
            onClick={() => onMethodChange("iban")}
            className={`rounded-full border px-4 py-2 text-sm ${
              method === "iban" ? "border-leaf bg-leaf text-white" : "border-brown/20 bg-white text-brown"
            }`}
          >
            تحويل بنكي
          </button>
          <button
            type="button"
            aria-pressed={method === "cod"}
            onClick={() => onMethodChange("cod")}
            className={`rounded-full border px-4 py-2 text-sm ${
              method === "cod" ? "border-leaf bg-leaf text-white" : "border-brown/20 bg-white text-brown"
            }`}
          >
            الدفع عند الاستلام
          </button>
        </div>
      )}

      {method === "iban" && (
        <div className="rounded border border-brown/20 p-4">
          <strong>تحويل بنكي (IBAN)</strong>
          <p className="text-sm text-brown/70">
            حوّل إلى BH04BBKU00200004090874 ثم أرفق الإيصال.
          </p>
          <p className="mt-2 text-xs text-brown/60">
            التحويل البنكي متاح للطلبات داخل البحرين فقط.
          </p>

          <label className="mt-3 block">
            صورة إيصال التحويل (إلزامي — JPG أو PNG أو WebP أو PDF، بحد أقصى 4MB)
            <input
              required
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => onReceiptChange(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full"
            />
            {receiptError && (
              <p className="text-sm text-red-600">
                {RECEIPT_ERROR_MESSAGES[receiptError] ?? "حدث خطأ في الملف المرفق."}
              </p>
            )}
          </label>
        </div>
      )}

      {method === "cod" && (
        <div className="rounded border border-brown/20 p-4">
          <strong>الدفع عند الاستلام</strong>
          <p className="text-sm text-brown/70">تدفعين نقدًا لمندوب التوصيل عند استلام طلبك.</p>
          <p className="mt-2 text-xs text-brown/60">
            الدفع عند الاستلام متاح للطلبات داخل البحرين فقط.
          </p>
        </div>
      )}

      {method === "oreem" && (
        <div className="rounded border border-brown/20 p-4">
          <strong>بطاقة عبر أوريم</strong>
          <p className="text-sm text-brown/70">دفع آمن ببطاقات Benefit وVisa وMastercard.</p>
          <p className="mt-2 text-xs text-brown/60">
            الدفع بالبطاقة متاح للطلبات خارج البحرين.
          </p>
        </div>
      )}
    </fieldset>
  );
}

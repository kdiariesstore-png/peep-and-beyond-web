"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../lib/cart/cart-context";
import { useCurrency } from "../../lib/currency-context";
import { formatMoney } from "../../lib/currency";
import { calculateOrderTotal } from "../../lib/order/order-total";
import { validateReceiptFile } from "../../lib/order/validate-receipt";
import { BuyerForm } from "../../components/checkout/buyer-form";
import { PaymentMethodSelector } from "../../components/checkout/payment-method-selector";
import type { BuyerDetails, PaymentMethod } from "../../lib/types";

const EMPTY_BUYER: BuyerDetails = {
  fullName: "",
  email: "",
  phone: "",
  country: "BH",
  city: "",
  address: "",
  preferredContact: "email",
  marketingOptIn: false,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear } = useCart();
  const { currency } = useCurrency();
  const [buyer, setBuyer] = useState<BuyerDetails>(EMPTY_BUYER);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("iban");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { subtotalBhd, shippingBhd, totalBhd } = calculateOrderTotal(items, buyer.country);

  function handleReceiptChange(file: File | null) {
    setReceipt(file);
    if (file) {
      const result = validateReceiptFile({ type: file.type, size: file.size });
      setReceiptError(result.valid ? null : (result.error ?? null));
    } else {
      setReceiptError(null);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    if (paymentMethod === "iban") {
      const result = validateReceiptFile(receipt ? { type: receipt.type, size: receipt.size } : null);
      if (!result.valid) {
        setReceiptError(result.error ?? "receipt_required");
        return;
      }

      const formData = new FormData();
      formData.set("buyer", JSON.stringify(buyer));
      formData.set("items", JSON.stringify(items));
      formData.set("receipt", receipt as File);

      setSubmitting(true);
      try {
        const response = await fetch("/api/orders/iban", { method: "POST", body: formData });
        if (!response.ok) {
          setSubmitError("تعذر إرسال الطلب. حاول مرة أخرى.");
          return;
        }
        clear();
        router.push("/order/confirmation?method=iban");
      } catch {
        setSubmitError("تعذر إرسال الطلب. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.");
      } finally {
        setSubmitting(false);
      }
    }
  }

  return (
    <main className="mx-auto grid max-w-4xl gap-8 p-6 md:grid-cols-2">
      <form onSubmit={handleSubmit} className="space-y-6">
        <BuyerForm value={buyer} onChange={setBuyer} />
        <PaymentMethodSelector
          value={paymentMethod}
          onChange={setPaymentMethod}
          receiptError={receiptError}
          onReceiptChange={handleReceiptChange}
        />
        {submitError && <p className="text-red-600">{submitError}</p>}
        <button
          type="submit"
          disabled={submitting || items.length === 0}
          className="w-full rounded-full bg-leaf py-3 text-white disabled:opacity-50"
        >
          تأكيد الطلب
        </button>
      </form>

      <aside className="rounded-xl bg-white/60 p-6">
        <h2 className="text-lg font-bold">ملخص الطلب</h2>
        <p className="mt-4">{formatMoney(subtotalBhd, currency)}</p>
        <p className="text-sm text-brown/70">
          الشحن: {shippingBhd === null ? "يُحدَّد لاحقًا" : formatMoney(shippingBhd, currency)}
        </p>
        <p className="mt-2 font-semibold">
          الإجمالي: {totalBhd === null ? "يُحدَّد لاحقًا" : formatMoney(totalBhd, currency)}
        </p>
      </aside>
    </main>
  );
}

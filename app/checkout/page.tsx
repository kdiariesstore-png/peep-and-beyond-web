"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../lib/cart/cart-context";
import { useCurrency } from "../../lib/currency-context";
import { formatMoney } from "../../lib/currency";
import { calculateOrderTotal } from "../../lib/order/order-total";
import { validateReceiptFile } from "../../lib/order/validate-receipt";
import { BuyerForm } from "../../components/checkout/buyer-form";
import { PaymentMethodSelector } from "../../components/checkout/payment-method-selector";
import { useBoxPrice } from "../../lib/use-box-price";
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
  // undefined = not yet quoted (still typing / Bahrain doesn't need this), null = quoted
  // but unavailable for this destination, number = the resolved live rate.
  const [liveShippingBhd, setLiveShippingBhd] = useState<number | null | undefined>(undefined);
  const [shippingLoading, setShippingLoading] = useState(false);

  const boxPrice = useBoxPrice();
  const { shippingBhd: bahrainShippingBhd } = calculateOrderTotal(items, buyer.country);
  const boxQty = items.reduce((sum, item) => sum + item.quantity, 0);
  // Recomputed from the live current price rather than each item's stored unitPriceBhd,
  // since the launch price can flip between add-to-cart and checkout — this is what will
  // actually be charged (claimBoxOrderPricing decides the final price server-side).
  const subtotalBhd = boxPrice.priceBhd * boxQty;
  const isBahrain = buyer.country === "BH";
  const shippingBhd = isBahrain ? bahrainShippingBhd : (liveShippingBhd ?? null);
  const totalBhd = shippingBhd === null ? null : subtotalBhd + shippingBhd;

  // International shipping is quoted live from Oreem, keyed on country/city/box count.
  // Debounced so typing a city doesn't fire a request per keystroke.
  useEffect(() => {
    if (isBahrain || boxQty === 0) {
      setLiveShippingBhd(undefined);
      setShippingLoading(false);
      return;
    }
    setLiveShippingBhd(undefined);
    setShippingLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/shipping/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ countryCode: buyer.country, city: buyer.city, boxQty }),
        });
        const json = await response.json();
        setLiveShippingBhd(response.ok && typeof json.shippingBhd === "number" ? json.shippingBhd : null);
      } catch {
        setLiveShippingBhd(null);
      } finally {
        setShippingLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [isBahrain, buyer.country, buyer.city, boxQty]);

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
      return;
    }

    if (paymentMethod === "oreem") {
      setSubmitting(true);
      try {
        const response = await fetch("/api/orders/oreem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buyer, items }),
        });
        const json = await response.json();
        if (!response.ok || typeof json.paymentUrl !== "string") {
          setSubmitError("تعذر بدء الدفع عبر أوريم. حاول مرة أخرى.");
          return;
        }
        window.location.href = json.paymentUrl;
      } catch {
        setSubmitError("تعذر بدء الدفع عبر أوريم. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.");
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
          method={paymentMethod}
          onMethodChange={setPaymentMethod}
          countryCode={buyer.country}
          receiptError={receiptError}
          onReceiptChange={handleReceiptChange}
        />
        {submitError && <p className="text-red-600">{submitError}</p>}
        <button
          type="submit"
          disabled={submitting || shippingLoading || items.length === 0}
          className="w-full rounded-full bg-leaf py-3 text-white disabled:opacity-50"
        >
          تأكيد الطلب
        </button>
      </form>

      <aside className="rounded-xl bg-white/60 p-6">
        <h2 className="text-lg font-bold">ملخص الطلب</h2>
        <p className="mt-4">{formatMoney(subtotalBhd, currency)}</p>
        <p className="text-sm text-brown/70">
          الشحن:{" "}
          {shippingLoading
            ? "جارٍ حساب الشحن..."
            : shippingBhd === null
              ? "الشحن غير متاح حاليًا لهذه الدولة — تواصلي معنا"
              : formatMoney(shippingBhd, currency)}
        </p>
        <p className="mt-2 font-semibold">
          الإجمالي: {totalBhd === null ? "يُحدَّد لاحقًا" : formatMoney(totalBhd, currency)}
        </p>
        <p className="mt-4 text-xs text-brown/60">
          ⏳ تجهيز وتوصيل الطلب قد يستغرق أكثر من 7 أيام.
        </p>
      </aside>
    </main>
  );
}

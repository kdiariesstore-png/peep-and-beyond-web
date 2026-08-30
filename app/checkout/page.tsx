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
import type { BuyerDetails, PaymentMethod } from "../../lib/types";
import { BUILDER_PRODUCTS, isBuilderKind } from "../../lib/product";

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

  useEffect(() => {
    setPaymentMethod(buyer.country === "BH" ? "iban" : "oreem");
  }, [buyer.country]);

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
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-14">
      <a href="/" className="text-sm font-bold text-leaf">← العودة للمتجر</a>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl bg-white/70 p-5 shadow-sm sm:p-8">
        <div><p className="section-kicker">الخطوة الأخيرة</p><h1 className="mt-2 text-3xl font-black">إتمام الطلب</h1><p className="mt-2 text-sm text-brown/60">بياناتك محمية، ولن يتم تغيير المبلغ بعد تأكيدك.</p></div>
        <BuyerForm value={buyer} onChange={setBuyer} />
        <PaymentMethodSelector
          method={paymentMethod}
          receiptError={receiptError}
          onReceiptChange={handleReceiptChange}
        />
        {submitError && <p className="text-red-600">{submitError}</p>}
        <button
          type="submit"
          disabled={submitting || items.length === 0}
          className="button-primary w-full disabled:opacity-50"
        >
          تأكيد الطلب
        </button>
      </form>

      <aside className="h-fit rounded-3xl bg-brown p-6 text-cream lg:sticky lg:top-28">
        <h2 className="text-xl font-black">ملخص الطلب</h2>
        <ul className="mt-5 space-y-4">{items.map((item) => <li key={item.id} className="border-b border-cream/15 pb-4"><div className="flex justify-between gap-4"><span className="font-bold">{isBuilderKind(item.kind) ? (item.kind === "ready-to-gift" ? "بوكس للإهداء" : "بوكس من اختيارك") : "بوكس بيب الكامل"} × {item.quantity}</span><span>{formatMoney(item.unitPriceBhd * item.quantity, currency)}</span></div>{isBuilderKind(item.kind) && <p className="mt-2 text-xs leading-5 text-cream/60">{(item.selectedProductIds ?? []).map((id) => BUILDER_PRODUCTS.find((product) => product.id === id)?.nameAr).filter(Boolean).join(" · ")}</p>}</li>)}</ul>
        <div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span>المجموع الفرعي</span><span>{formatMoney(subtotalBhd, currency)}</span></div>
        <div className="flex justify-between"><span>الشحن</span><span>{shippingBhd === null ? "يُحدَّد لاحقًا" : formatMoney(shippingBhd, currency)}</span></div>
        <div className="flex justify-between border-t border-cream/15 pt-4 text-lg font-black"><span>الإجمالي</span><span>{totalBhd === null ? "يُحدَّد لاحقًا" : formatMoney(totalBhd, currency)}</span></div></div>
        <div className="mt-6 rounded-2xl bg-cream/10 p-4 text-xs leading-6 text-cream/70">🔒 دفع آمن عبر أوريم أو تحويل بنكي · توصيل البحرين 2 د.ب</div>
      </aside>
      </div>
    </main>
  );
}

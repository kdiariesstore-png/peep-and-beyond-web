import { decodeOrderPayload } from "../../../lib/order/order-payload";
import { claimOrderProcessing } from "../../../lib/order/order-processing-lock";
import { verifyTransaction, type VerifyTransactionResult } from "../../../lib/payments/oreem-client";
import {
  sendOrderNotificationEmail,
  sendCustomerConfirmationEmail,
} from "../../../lib/email/resend-client";
import { buildWhatsappConfirmationLink } from "../../../lib/email/whatsapp-link";
import {
  getRemainingStock,
  decrementStockAfterOrder,
  isPreOrder,
  PRE_ORDER_NOTE,
} from "../../../lib/inventory/story-stock";
import { OrderConfirmationMessage } from "../../../components/order-confirmation-message";
import { ClearCartOnMount } from "../../../components/clear-cart-on-mount";
import type { OrderEmailData } from "../../../lib/email/order-notification-email";

export const runtime = "nodejs";

interface ConfirmationPageProps {
  searchParams: {
    method?: string;
    order?: string;
    status?: string;
    transaction_reference?: string;
  };
}

export default async function OrderConfirmationPage({ searchParams }: ConfirmationPageProps) {
  if (searchParams.method === "iban") {
    return (
      <OrderConfirmationMessage
        success={true}
        title="تم استلام طلبك!"
        body="سنتحقق من تحويلك البنكي ونؤكد طلبك قريبًا. تحقق من بريدك الإلكتروني للتأكيد."
      />
    );
  }

  const encodedOrder = searchParams.order;
  if (!encodedOrder) {
    return (
      <OrderConfirmationMessage success={false} title="لا يوجد طلب لعرضه" body="" />
    );
  }

  const payload = decodeOrderPayload(encodedOrder);
  if (!payload) {
    return (
      <OrderConfirmationMessage
        success={false}
        title="تعذر قراءة تفاصيل الطلب"
        body="حاول العودة للمتجر والطلب مرة أخرى."
      />
    );
  }

  // verifyTransaction throws on any non-ok HTTP response (e.g. Oreem returns 404 for a
  // transaction that hasn't been attempted yet — a customer landing here directly, or
  // refreshing while Oreem is still processing). Treat that the same as "not verified"
  // instead of letting it crash the page.
  let verification: VerifyTransactionResult;
  try {
    verification = await verifyTransaction(payload.txnRef);
  } catch (error) {
    console.error("Failed to verify Oreem transaction", error);
    verification = { verified: false, status: "verification_failed" };
  }

  if (!verification.verified) {
    // Distinguish "we could not reach Oreem" from "Oreem told us the payment did not
    // complete". In the first case we genuinely do not know whether the card was
    // charged, so telling the customer to just pay again risks a double charge.
    if (verification.status === "verification_failed") {
      return (
        <OrderConfirmationMessage
          success={false}
          title="تعذر التحقق من حالة الدفع"
          body="لم نتمكن من التواصل مع مزوّد الدفع للتأكد من حالة عمليتك. إذا تم خصم مبلغ من بطاقتك، لا تدفع مرة أخرى — تواصل معنا مباشرة عبر واتساب أو البريد الإلكتروني لتأكيد طلبك."
        />
      );
    }
    return (
      <OrderConfirmationMessage
        success={false}
        title="لم يتم تأكيد الدفع"
        body="لم نتمكن من تأكيد عملية الدفع. لم يتم خصم أي مبلغ إذا لم تكتمل العملية — حاول مرة أخرى."
      />
    );
  }

  // The payload is unsigned and arrives via a URL param the customer controls, so a
  // valid txnRef alone does not make its items/totals trustworthy. Bind the payload to
  // what Oreem actually confirms was paid before acting on any of its contents.
  // Phrased as "must positively match" rather than "must not differ": a payload whose
  // totalBhd is absent or non-numeric makes the subtraction NaN, and `NaN > 0.001` is
  // false — which would wave the forged payload straight through.
  if (
    verification.amountBhd !== undefined &&
    !(
      Number.isFinite(payload.totalBhd) &&
      Math.abs(verification.amountBhd - payload.totalBhd) <= 0.001
    )
  ) {
    console.error("Oreem verified amount does not match order payload total", {
      txnRef: payload.txnRef,
      verifiedAmount: verification.amountBhd,
      payloadTotal: payload.totalBhd,
    });
    return (
      <OrderConfirmationMessage
        success={false}
        title="تعذر تأكيد تفاصيل الطلب"
        body="حدث تعارض في بيانات الطلب. يرجى التواصل معنا مباشرة قبل إعادة المحاولة."
      />
    );
  }

  // Untrusted URL input that ends up inside the order notification email's HTML.
  // Accept only an opaque reference token; anything else is dropped entirely.
  const rawTransactionReference = searchParams.transaction_reference;
  const oreemTransactionReference =
    typeof rawTransactionReference === "string" &&
    /^[A-Za-z0-9_-]{1,64}$/.test(rawTransactionReference)
      ? rawTransactionReference
      : undefined;

  // One payment must produce at most one set of side effects, no matter how many times
  // this URL is hit (refresh, back button, link-preview bot).
  const isFirstProcessing = await claimOrderProcessing(payload.txnRef);

  // Defaults to true on a repeat visit: we are not re-sending anything, so we must not
  // show the "your email may not have arrived" copy on every subsequent visit.
  let ownerEmailSucceeded = true;

  const notes: string[] = [];
  const emailData: OrderEmailData = {
    buyer: payload.buyer,
    items: payload.items,
    subtotalBhd: payload.subtotalBhd,
    shippingBhd: payload.shippingBhd,
    totalBhd: payload.totalBhd,
    paymentMethod: "oreem",
    oreemTransactionReference,
    notes: undefined,
  };

  if (isFirstProcessing) {
    for (const item of payload.items) {
      try {
        const remaining = await getRemainingStock(item.customization.storyLanguage);
        if (isPreOrder(remaining)) {
          notes.push(`${PRE_ORDER_NOTE} (${item.customization.storyLanguage})`);
        }
      } catch (error) {
        console.error("Failed to check story stock for pre-order flag", error);
      }
    }
    emailData.notes = notes.length > 0 ? notes : undefined;

    try {
      await sendOrderNotificationEmail({ data: emailData });
    } catch (error) {
      console.error("Failed to send Oreem order notification email", error);
      ownerEmailSucceeded = false;
    }

    try {
      await sendCustomerConfirmationEmail(emailData);
    } catch (error) {
      console.error("Failed to send Oreem customer confirmation email", error);
    }

    for (const item of payload.items) {
      try {
        await decrementStockAfterOrder(item.customization.storyLanguage, item.quantity);
      } catch (error) {
        console.error("Failed to decrement story stock after Oreem order", error);
      }
    }
  }

  const whatsappLink = buildWhatsappConfirmationLink(emailData);

  return (
    <>
      <OrderConfirmationMessage
        success={true}
        title="تم تأكيد طلبك بنجاح!"
        body={
          ownerEmailSucceeded
            ? "شكرًا لتسوقك من Peep & beyond — وصلك تأكيد على بريدك الإلكتروني."
            : "شكرًا لتسوقك من Peep & beyond — تم الدفع بنجاح. يرجى الضغط على الزر أدناه لإرسال تأكيد طلبك عبر واتساب لضمان استلامه."
        }
        whatsappLink={whatsappLink}
      />
      <ClearCartOnMount />
    </>
  );
}

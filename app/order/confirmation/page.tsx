import { decodeOrderPayload } from "../../../lib/order/order-payload";
import { verifyTransaction } from "../../../lib/payments/oreem-client";
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
  let verification: { verified: boolean; status: string };
  try {
    verification = await verifyTransaction(payload.txnRef);
  } catch (error) {
    console.error("Failed to verify Oreem transaction", error);
    verification = { verified: false, status: "verification_failed" };
  }

  if (!verification.verified) {
    return (
      <OrderConfirmationMessage
        success={false}
        title="لم يتم تأكيد الدفع"
        body="لم نتمكن من تأكيد عملية الدفع. لم يتم خصم أي مبلغ إذا لم تكتمل العملية — حاول مرة أخرى."
      />
    );
  }

  const notes: string[] = [];
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

  const emailData: OrderEmailData = {
    buyer: payload.buyer,
    items: payload.items,
    subtotalBhd: payload.subtotalBhd,
    shippingBhd: payload.shippingBhd,
    totalBhd: payload.totalBhd,
    paymentMethod: "oreem",
    oreemTransactionReference: searchParams.transaction_reference,
    notes: notes.length > 0 ? notes : undefined,
  };

  try {
    await sendOrderNotificationEmail({ data: emailData });
  } catch (error) {
    console.error("Failed to send Oreem order notification email", error);
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

  const whatsappLink = buildWhatsappConfirmationLink(emailData);

  return (
    <OrderConfirmationMessage
      success={true}
      title="تم تأكيد طلبك بنجاح!"
      body="شكرًا لتسوقك من Peep & beyond — وصلك تأكيد على بريدك الإلكتروني."
      whatsappLink={whatsappLink}
    />
  );
}

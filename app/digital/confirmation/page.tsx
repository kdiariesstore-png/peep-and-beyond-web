import { decodeDigitalOrderPayload } from "../../../lib/digital/order-payload";
import { claimOrderProcessing } from "../../../lib/order/order-processing-lock";
import { verifyTransaction } from "../../../lib/payments/oreem-client";
import {
  sendDigitalOrderNotificationEmail,
  sendDigitalCustomerConfirmationEmail,
} from "../../../lib/digital/resend-client";
import { addToMarketingAudience } from "../../../lib/email/resend-client";
import { buildCustomerToOwnerWhatsappLink } from "../../../lib/email/whatsapp-link";
import { DIGITAL_PRODUCTS, DIGITAL_BUNDLE } from "../../../lib/digital/catalog";
import { OrderConfirmationMessage } from "../../../components/order-confirmation-message";
import { ClearDigitalCartOnMount } from "../../../components/digital/clear-digital-cart-on-mount";
import type { DigitalTopicId } from "../../../lib/digital/types";

export const runtime = "nodejs";

const INSTAGRAM_HANDLE = "@peepandbeyond";

interface ConfirmationPageProps {
  searchParams: {
    order?: string;
  };
}

// Expands the purchased items into a flat list of {topicId, language} download entries,
// unrolling any "digital-bundle" line into its 7 underlying topics.
function resolveDownloads(
  items: { id: string; language: "ar" | "en" }[]
): { topicId: DigitalTopicId; language: "ar" | "en" }[] {
  const downloads: { topicId: DigitalTopicId; language: "ar" | "en" }[] = [];
  for (const item of items) {
    if (item.id === "digital-bundle") {
      for (const topicId of DIGITAL_BUNDLE.includes) {
        downloads.push({ topicId, language: item.language });
      }
    } else {
      downloads.push({ topicId: item.id as DigitalTopicId, language: item.language });
    }
  }
  return downloads;
}

export default async function DigitalConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const encodedOrder = searchParams.order;
  if (!encodedOrder) {
    return <OrderConfirmationMessage success={false} title="لا يوجد طلب لعرضه" body="" />;
  }

  const payload = decodeDigitalOrderPayload(encodedOrder);
  if (!payload) {
    return (
      <OrderConfirmationMessage
        success={false}
        title="تعذر قراءة تفاصيل الطلب"
        body="حاول العودة للمتجر والطلب مرة أخرى."
      />
    );
  }

  let verification;
  try {
    verification = await verifyTransaction(payload.txnRef);
  } catch (error) {
    console.error("Failed to verify Oreem transaction for digital order", error);
    verification = { verified: false, status: "verification_failed" as const };
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

  if (
    verification.amountBhd !== undefined &&
    !(
      Number.isFinite(payload.totalBhd) &&
      Math.abs(verification.amountBhd - payload.totalBhd) <= 0.001
    )
  ) {
    console.error("Oreem verified amount does not match digital order payload total", {
      txnRef: payload.txnRef,
      verifiedAmount: verification.amountBhd,
      payloadTotal: payload.totalBhd,
    });
    return (
      <OrderConfirmationMessage
        success={false}
        title="تعذر تأكيد تفاصيل الطلب"
        body={`حدث تعارض في بيانات الطلب. يرجى التواصل معنا عبر انستقرام ${INSTAGRAM_HANDLE} مع ذكر رقم المرجع: ${payload.txnRef} قبل إعادة المحاولة.`}
        allowRetry={false}
      />
    );
  }

  // One payment must produce at most one set of side effects, no matter how many times
  // this URL is hit (refresh, back button, link-preview bot) — same guard as the
  // physical box's confirmation page.
  const isFirstProcessing = await claimOrderProcessing(payload.txnRef);
  let ownerEmailSucceeded = true;

  if (isFirstProcessing) {
    const emailData = { buyer: payload.buyer, items: payload.items, totalBhd: payload.totalBhd, txnRef: payload.txnRef };

    try {
      await sendDigitalOrderNotificationEmail(emailData);
    } catch (error) {
      console.error("Failed to send digital order notification email", error);
      ownerEmailSucceeded = false;
    }

    try {
      await sendDigitalCustomerConfirmationEmail(emailData);
    } catch (error) {
      console.error("Failed to send digital customer confirmation email", error);
    }

    if (payload.buyer.marketingOptIn) {
      try {
        await addToMarketingAudience(payload.buyer.email);
      } catch (error) {
        console.error("Failed to add digital buyer to marketing audience", error);
      }
    }
  }

  let whatsappLink: string | undefined;
  const ownerWhatsappContact = process.env.OWNER_WHATSAPP_NUMBER;
  if (ownerWhatsappContact && ownerWhatsappContact.trim().length > 0) {
    try {
      whatsappLink = buildCustomerToOwnerWhatsappLink(ownerWhatsappContact, payload.txnRef);
    } catch (error) {
      console.error("Failed to build customer-to-owner WhatsApp link for digital order", error);
      whatsappLink = undefined;
    }
  }

  const downloads = resolveDownloads(payload.items);
  const successBody = ownerEmailSucceeded
    ? "شكرًا لتسوقك من Peep & beyond — وصلك تأكيد على بريدك الإلكتروني، وروابط التحميل بالأسفل."
    : `شكرًا لتسوقك من Peep & beyond — تم الدفع بنجاح. رقم مرجع طلبك: ${payload.txnRef}. روابط التحميل بالأسفل — احتفظي بهذه الصفحة لو احتجتِ تنزيل الملفات مرة أخرى.`;

  return (
    <>
      <OrderConfirmationMessage
        success={true}
        title="تم تأكيد طلبك بنجاح!"
        body={successBody}
        whatsappLink={whatsappLink}
      />
      <div className="mx-auto max-w-lg px-10 pb-10">
        <h2 className="text-lg font-bold">روابط التحميل</h2>
        <ul className="mt-4 space-y-2">
          {downloads.map(({ topicId, language }) => {
            const product = DIGITAL_PRODUCTS.find((p) => p.id === topicId);
            const label = product ? (language === "ar" ? product.nameAr : product.nameEn) : topicId;
            const href = `/api/digital-download?order=${encodeURIComponent(encodedOrder)}&product=${topicId}&language=${language}`;
            return (
              <li key={`${topicId}-${language}`}>
                <a href={href} className="text-leaf underline">
                  {label} ({language === "ar" ? "عربي" : "English"}) — تحميل
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      <ClearDigitalCartOnMount />
    </>
  );
}

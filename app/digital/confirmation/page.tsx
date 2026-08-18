import {
  encodeDigitalOrderPayload,
  computeTrustedDigitalTotal,
  type DigitalPendingOrderPayload,
} from "../../../lib/digital/order-payload";
import { claimOrderProcessing } from "../../../lib/order/order-processing-lock";
import { getPendingOrder } from "../../../lib/order/pending-order-store";
import { resolveTxnRef } from "../../../lib/order/resolve-txn-ref";
import { verifyTransaction } from "../../../lib/payments/oreem-client";
import {
  sendDigitalOrderNotificationEmail,
  sendDigitalCustomerConfirmationEmail,
} from "../../../lib/digital/resend-client";
import { addToMarketingAudience } from "../../../lib/email/resend-client";
import { buildCustomerToOwnerWhatsappLink } from "../../../lib/email/whatsapp-link";
import { getSiteUrl } from "../../../lib/site-url";
import { DIGITAL_PRODUCTS, DIGITAL_BUNDLE } from "../../../lib/digital/catalog";
import { OrderConfirmationMessage } from "../../../components/order-confirmation-message";
import { ClearDigitalCartOnMount } from "../../../components/digital/clear-digital-cart-on-mount";
import type { DigitalTopicId } from "../../../lib/digital/types";

export const runtime = "nodejs";

// The only statuses we are willing to read as "this payment definitively did not go
// through, so it is safe to invite the customer to pay again". Anything else — a
// still-settling "pending"/"processing", an unrecognised status, or our own
// "verification_failed" placeholder — means we do not actually know, and inviting a
// retry there risks a second charge on a card that may already have been debited.
// Fail closed by default. Mirrors app/order/confirmation/page.tsx's identical guard.
const RETRYABLE_FAILURE_STATUSES = new Set([
  "failed",
  "declined",
  "cancelled",
  "canceled",
  "expired",
  "rejected",
]);

const INSTAGRAM_HANDLE = "@peepandbeyond";

interface ConfirmationPageProps {
  searchParams: {
    ref?: string;
    txn_ref?: string;
  };
}

// Oreem only reliably echoes back what we hand it as txnRef, in exactly the shape we
// generated it in (app/api/orders/digital-oreem/route.ts's `peepdigi_${randomUUID()}`).
// Validating the shape before using it as a KV lookup key is defence in depth, not a
// security boundary on its own — @vercel/kv's client doesn't build raw query strings
// from it, so there's no injection risk either way.
const TXN_REF_PATTERN = /^peepdigi_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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
  const txnRef = resolveTxnRef(TXN_REF_PATTERN, searchParams.ref, searchParams.txn_ref);
  if (!txnRef) {
    return <OrderConfirmationMessage success={false} title="لا يوجد طلب لعرضه" body="" />;
  }

  let payload: DigitalPendingOrderPayload | null;
  try {
    payload = await getPendingOrder<DigitalPendingOrderPayload>(txnRef);
  } catch (error) {
    console.error("Failed to read pending digital order", error);
    payload = null;
  }
  if (!payload) {
    return (
      <OrderConfirmationMessage
        success={false}
        title="تعذر العثور على تفاصيل الطلب"
        body={`قد يكون الرابط انتهت صلاحيته. إذا تم خصم مبلغ من بطاقتك، تواصلي معنا عبر انستقرام ${INSTAGRAM_HANDLE} مع ذكر رقم المرجع: ${txnRef}.`}
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
    // Distinguish "Oreem told us the payment definitively did not complete" from every
    // other unverified state ("we could not reach Oreem", a still-processing payment, an
    // unrecognised status). Only the first is safe to retry; everything else gets the
    // cautious no-retry message, since telling a customer whose card may already have
    // been charged to "just try again" risks a double charge.
    const isKnownRetryableFailure = RETRYABLE_FAILURE_STATUSES.has(verification.status);
    if (!isKnownRetryableFailure) {
      return (
        <OrderConfirmationMessage
          success={false}
          title="تعذر التحقق من حالة الدفع"
          body={`لم نتمكن من تأكيد حالة عمليتك مع مزوّد الدفع. إذا تم خصم مبلغ من بطاقتك، لا تدفعي مرة أخرى — تواصلي معنا عبر انستقرام ${INSTAGRAM_HANDLE} مع ذكر رقم المرجع: ${payload.txnRef}.`}
          allowRetry={false}
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

  // payload.totalBhd is unsigned client-controlled input and must never be trusted
  // directly — a forged unitPriceBhd on an item (e.g. claiming the bundle costs the
  // price of one topic) would leave totalBhd looking consistent while granting access
  // to items never actually paid for. Compare Oreem's verified amount against the
  // CATALOG-derived trusted total instead.
  const trustedTotalBhd = computeTrustedDigitalTotal(payload.items);
  // An undefined amountBhd means Oreem's response carried no usable amount for an
  // otherwise-verified transaction — that must be treated as a binding-check FAILURE,
  // not silently skipped, or a verified-but-amount-less response would let any item
  // claim through unchecked.
  if (
    verification.amountBhd === undefined ||
    !(
      Number.isFinite(trustedTotalBhd) &&
      Math.abs(verification.amountBhd - trustedTotalBhd) <= 0.001
    )
  ) {
    console.error("Oreem verified amount does not match digital order trusted total", {
      txnRef: payload.txnRef,
      verifiedAmount: verification.amountBhd,
      trustedTotalBhd,
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

  // Computed up front (rather than only for the page's own download list further below)
  // because the customer confirmation email needs these same links, in absolute form —
  // they're the customer's only route to their files if they never make it back to this
  // page (e.g. Oreem's redirect lands on a stale deployment URL).
  const encodedOrder = encodeDigitalOrderPayload(payload);
  const downloads = resolveDownloads(payload.items).map(({ topicId, language }) => {
    const product = DIGITAL_PRODUCTS.find((p) => p.id === topicId);
    const name = product ? (language === "ar" ? product.nameAr : product.nameEn) : topicId;
    return {
      topicId,
      language,
      label: `${name} (${language === "ar" ? "عربي" : "English"})`,
      path: `/api/digital-download?order=${encodeURIComponent(encodedOrder)}&product=${topicId}&language=${language}`,
    };
  });

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
      const siteUrl = getSiteUrl();
      await sendDigitalCustomerConfirmationEmail({
        ...emailData,
        downloads: downloads.map((d) => ({ label: d.label, href: `${siteUrl}${d.path}` })),
      });
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
          {downloads.map(({ topicId, language, label, path }) => (
            <li key={`${topicId}-${language}`}>
              <a href={path} target="_blank" rel="noreferrer" className="text-leaf underline">
                {label} — تحميل
              </a>
            </li>
          ))}
        </ul>
      </div>
      <ClearDigitalCartOnMount />
    </>
  );
}

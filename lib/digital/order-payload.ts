import { createHmac, timingSafeEqual } from "node:crypto";
import type { DigitalBuyerDetails, DigitalCartItem, DigitalLanguage, DigitalTopicId } from "./types";
import { DIGITAL_BUNDLE, getDigitalProductPrice } from "./catalog";

// Same rounding as lib/digital/order-total.ts's round3 (kept local rather than imported
// to avoid coupling this module's public API to that file's internals) — 3 decimal
// places matches BHD's minor unit (fils) and avoids floating-point drift when summing.
function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export interface DigitalPendingOrderPayload {
  txnRef: string;
  buyer: DigitalBuyerDetails;
  items: DigitalCartItem[];
  totalBhd: number;
}

const VALID_IDS = new Set([
  "picky-eating",
  "potty-training",
  "screens-big-feelings",
  "sharing-sibling-conflict",
  "sleep-bedtime",
  "starting-school",
  "child-hits",
  "digital-bundle",
]);

// The payload round-trips through the customer's browser via an unsigned-looking URL
// param, so without a signature a customer could decode it, edit `items` to claim a
// DIFFERENT topic (or the bundle) than what was actually paid for, and re-encode. Since
// all 7 individual topics share one price, the amount-binding check alone can't catch
// this — it only proves the TOTAL matches, not WHICH items it was for. An HMAC over the
// exact JSON bytes closes that: only someone holding DIGITAL_ORDER_SECRET can produce a
// payload that verifies, so a hand-edited `items` array is rejected outright.
function getSigningSecret(): string {
  const secret = process.env.DIGITAL_ORDER_SECRET;
  if (!secret) throw new Error("DIGITAL_ORDER_SECRET is not set");
  return secret;
}

function sign(payloadJson: string): string {
  return createHmac("sha256", getSigningSecret()).update(payloadJson).digest("base64url");
}

export function encodeDigitalOrderPayload(payload: DigitalPendingOrderPayload): string {
  const json = JSON.stringify(payload);
  const encodedPayload = Buffer.from(json, "utf-8").toString("base64url");
  const signature = sign(json);
  return `${encodedPayload}.${signature}`;
}

export function decodeDigitalOrderPayload(encoded: string): DigitalPendingOrderPayload | null {
  try {
    // "." is not a base64url character, so splitting on the LAST "." unambiguously
    // separates the base64url payload from its signature.
    const separatorIndex = encoded.lastIndexOf(".");
    if (separatorIndex === -1) return null;

    const encodedPayload = encoded.slice(0, separatorIndex);
    const signature = encoded.slice(separatorIndex + 1);
    if (!encodedPayload || !signature) return null;

    const json = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const expectedSignature = sign(json);

    const providedSignatureBuffer = Buffer.from(signature, "base64url");
    const expectedSignatureBuffer = Buffer.from(expectedSignature, "base64url");
    // timingSafeEqual throws on a length mismatch rather than returning false — an
    // attacker-controlled signature of the wrong length just means "not equal", not a
    // crash, so treat that case as an ordinary verification failure.
    let signatureValid: boolean;
    try {
      signatureValid = timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer);
    } catch {
      signatureValid = false;
    }
    if (!signatureValid) return null;

    const parsed = JSON.parse(json);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.txnRef !== "string" ||
      !parsed.buyer ||
      typeof parsed.buyer !== "object" ||
      !Array.isArray(parsed.items)
    ) {
      return null;
    }

    // The signature above only proves this payload was produced by our own server (not
    // hand-edited by the customer) — it says nothing about whether the amount it claims
    // was actually paid. The confirmation and download routes both independently verify
    // the paid amount with Oreem before trusting anything here.
    if (!Number.isFinite(parsed.totalBhd)) {
      return null;
    }

    // Every item drives which files get delivered, so an unrecognised id or language
    // must never reach the download route.
    for (const item of parsed.items) {
      if (typeof item?.id !== "string" || !VALID_IDS.has(item.id)) return null;
      if (item?.language !== "ar" && item?.language !== "en") return null;
      if (typeof item?.unitPriceBhd !== "number") return null;
    }

    return parsed as DigitalPendingOrderPayload;
  } catch {
    return null;
  }
}

// A topic/language is authorized for download if it was bought as its own line, or if a
// bundle in that same language was bought (a bundle covers all 7 topics in one language).
// Pure and independent of any network call, so the download route's entitlement check
// (Task 10) can be unit tested without mocking fetch/NextRequest.
export function wasDigitalItemPurchased(
  payload: DigitalPendingOrderPayload,
  topicId: DigitalTopicId,
  language: DigitalLanguage
): boolean {
  return payload.items.some((item) => {
    if (item.language !== language) return false;
    if (item.id === topicId) return true;
    if (item.id === "digital-bundle") {
      return (DIGITAL_BUNDLE.includes as DigitalTopicId[]).includes(topicId);
    }
    return false;
  });
}

// The signature on the payload proves it wasn't hand-edited after our server produced
// it, but it was still generated from client-submitted prices before payment — so
// payload.totalBhd and every item's unitPriceBhd reflect whatever the cart claimed at
// checkout time, not proof of what was actually charged. This recomputes the order's
// true total from the CATALOG price for each item id, so a stale/forged unitPriceBhd
// (e.g. claiming the 12.0 BHD bundle costs 2.7 BHD) cannot influence it. Callers must
// compare Oreem's independently-verified paid amount against THIS value, never against
// payload.totalBhd directly.
export function computeTrustedDigitalTotal(items: DigitalCartItem[]): number {
  return round3(
    items.reduce((sum, item) => {
      const catalogPrice = getDigitalProductPrice(item.id);
      return sum + (catalogPrice ?? 0);
    }, 0)
  );
}

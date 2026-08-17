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

export function encodeDigitalOrderPayload(payload: DigitalPendingOrderPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
}

export function decodeDigitalOrderPayload(encoded: string): DigitalPendingOrderPayload | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf-8");
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

    // This payload arrives back via a URL param the customer's browser round-trips, so a
    // valid txnRef guarantees nothing about totalBhd — the confirmation and download
    // routes both format/compare it numerically after a real payment has been taken.
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

// The payload arrives back via an unsigned URL param the customer's browser round-trips
// (see decodeDigitalOrderPayload above), so payload.totalBhd — and every item's
// unitPriceBhd — is just whatever number the request claims, not proof of what was
// actually charged. This recomputes the order's true total from the CATALOG price for
// each item id, so a forged unitPriceBhd (e.g. claiming the 12.0 BHD bundle costs 2.7
// BHD) cannot influence it. Callers must compare Oreem's independently-verified paid
// amount against THIS value, never against payload.totalBhd directly.
export function computeTrustedDigitalTotal(items: DigitalCartItem[]): number {
  return round3(
    items.reduce((sum, item) => {
      const catalogPrice = getDigitalProductPrice(item.id);
      return sum + (catalogPrice ?? 0);
    }, 0)
  );
}

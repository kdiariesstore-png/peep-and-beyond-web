import type { CartItem, StoryLanguage } from "../types";
import { PEEP_BOX_CHARGEABLE_WEIGHT_KG, PEEP_STORY_CHARGEABLE_WEIGHT_KG } from "../product";

// Every cart item — box or standalone story — carries exactly one printed story
// booklet per unit (the box's included insert, or the standalone copy itself), drawn
// from the same finite print-stock pool. This is the one place that knows how to get
// "which language's stock does this line consume" regardless of product type.
export function getItemStoryLanguage(item: CartItem): StoryLanguage {
  return item.productId === "peep-box" ? item.customization.storyLanguage : item.storyLanguage;
}

// Defence-in-depth validation shared by every order route: mirrors exactly what the
// pre-refactor per-route loop checked (a recognised story language + a positive integer
// quantity) — deliberately does not validate cosmetic fields (cardLanguage, cupColor,
// childName, giftCard), which were never validated server-side either.
export function isValidCartItemsPayload(items: unknown): items is CartItem[] {
  if (!Array.isArray(items)) return false;
  for (const item of items) {
    if (!Number.isInteger((item as { quantity?: unknown })?.quantity)) return false;
    if (((item as { quantity: number }).quantity ?? 0) < 1) return false;

    const productId = (item as { productId?: unknown })?.productId;
    if (productId === "peep-box") {
      const storyLanguage = (item as { customization?: { storyLanguage?: unknown } })?.customization
        ?.storyLanguage;
      if (storyLanguage !== "ar" && storyLanguage !== "en") return false;
    } else if (productId === "peep-story") {
      const storyLanguage = (item as { storyLanguage?: unknown })?.storyLanguage;
      if (storyLanguage !== "ar" && storyLanguage !== "en") return false;
    } else {
      return false;
    }
  }
  return true;
}

export interface ShippingParcel {
  chargeableWeightKg: number;
  qty: number;
}

// Oreem's rates endpoint accepts one parcel entry per distinct weight — a box and a
// standalone story have different packaging, so a mixed cart becomes two parcel lines
// (same request, summed rate) rather than one blended weight.
export function buildShippingParcels(items: CartItem[]): ShippingParcel[] {
  const boxQty = items
    .filter((item) => item.productId === "peep-box")
    .reduce((sum, item) => sum + item.quantity, 0);
  const storyQty = items
    .filter((item) => item.productId === "peep-story")
    .reduce((sum, item) => sum + item.quantity, 0);

  const parcels: ShippingParcel[] = [];
  if (boxQty > 0) parcels.push({ chargeableWeightKg: PEEP_BOX_CHARGEABLE_WEIGHT_KG, qty: boxQty });
  if (storyQty > 0) parcels.push({ chargeableWeightKg: PEEP_STORY_CHARGEABLE_WEIGHT_KG, qty: storyQty });
  return parcels;
}

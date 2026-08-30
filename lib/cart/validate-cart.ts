import type { CartItem } from "../types";
import {
  BUILDER_MIN_PRODUCTS,
  calculateTrustedItemPrice,
  isBuilderKind,
  isBuilderProductId,
} from "../product";

export function isValidPhysicalCartItem(item: unknown): item is CartItem {
  if (!item || typeof item !== "object") return false;
  const candidate = item as CartItem;
  if (!candidate.customization || typeof candidate.customization !== "object") return false;
  if (candidate.customization.storyLanguage !== "ar" && candidate.customization.storyLanguage !== "en") return false;
  if (candidate.customization.cardLanguage !== "ar" && candidate.customization.cardLanguage !== "en") return false;
  if (candidate.customization.cupColor !== "pink" && candidate.customization.cupColor !== "blue") return false;
  if (!Number.isInteger(candidate.quantity) || candidate.quantity < 1) return false;
  if (candidate.kind && !["ready-made", "build-your-own", "ready-to-gift"].includes(candidate.kind)) return false;

  if (isBuilderKind(candidate.kind)) {
    if (!Array.isArray(candidate.selectedProductIds)) return false;
    const uniqueIds = [...new Set(candidate.selectedProductIds)];
    if (uniqueIds.length < BUILDER_MIN_PRODUCTS || uniqueIds.some((id) => !isBuilderProductId(id))) return false;
  }
  return true;
}

export function normalizePhysicalCartItems(items: unknown): CartItem[] | null {
  if (!Array.isArray(items) || items.length === 0 || !items.every(isValidPhysicalCartItem)) {
    return null;
  }
  return items.map((item) => ({
    ...item,
    kind: item.kind ?? "ready-made",
    selectedProductIds: isBuilderKind(item.kind)
      ? [...new Set(item.selectedProductIds)]
      : undefined,
    unitPriceBhd: calculateTrustedItemPrice(item),
  }));
}

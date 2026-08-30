import type { BoxCustomization, BuilderProductId, CartItem, PhysicalBoxKind } from "../types";
import { calculateBuilderPrice, PEEP_BOX_PRODUCT } from "../product";

export function buildCartItem(customization: BoxCustomization): CartItem {
  return {
    id: crypto.randomUUID(),
    kind: "ready-made",
    customization,
    unitPriceBhd: PEEP_BOX_PRODUCT.priceBhd,
    quantity: 1,
  };
}

export function buildCustomCartItem(
  kind: Exclude<PhysicalBoxKind, "ready-made">,
  selectedProductIds: BuilderProductId[],
  customization: BoxCustomization
): CartItem {
  return {
    id: crypto.randomUUID(),
    kind,
    selectedProductIds: [...new Set(selectedProductIds)],
    customization,
    unitPriceBhd: calculateBuilderPrice(selectedProductIds),
    quantity: 1,
  };
}

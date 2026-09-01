import type { BoxCustomization, BuilderBoxKind, BuilderProductId, CartItem } from "../types";
import { calculateBuilderPrice, getBuilderProduct, PEEP_BOX_PRODUCT } from "../product";

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
  kind: BuilderBoxKind,
  selectedProductIds: BuilderProductId[],
  customization: BoxCustomization
): CartItem {
  return {
    id: crypto.randomUUID(),
    kind,
    selectedProductIds: [...new Set(selectedProductIds)],
    customization,
    unitPriceBhd: calculateBuilderPrice(kind, selectedProductIds),
    quantity: 1,
  };
}

export function buildIndividualProductCartItem(
  productId: BuilderProductId,
  customization: BoxCustomization
): CartItem {
  return {
    id: crypto.randomUUID(),
    kind: "individual-product",
    selectedProductIds: [productId],
    customization,
    unitPriceBhd: getBuilderProduct(productId)?.priceBhd ?? 0,
    quantity: 1,
  };
}

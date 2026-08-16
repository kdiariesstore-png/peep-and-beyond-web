import type { BoxCustomization, CartItem } from "../types";
import { PEEP_BOX_PRODUCT } from "../product";

export function buildCartItem(customization: BoxCustomization): CartItem {
  return {
    id: crypto.randomUUID(),
    customization,
    unitPriceBhd: PEEP_BOX_PRODUCT.priceBhd,
    quantity: 1,
  };
}

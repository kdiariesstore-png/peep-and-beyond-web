import type { BoxCustomization, CartItem, StoryLanguage } from "../types";
import { PEEP_BOX_PRODUCT, PEEP_STORY_PRODUCT } from "../product";

export function buildCartItem(customization: BoxCustomization): CartItem {
  return {
    id: crypto.randomUUID(),
    productId: "peep-box",
    customization,
    unitPriceBhd: PEEP_BOX_PRODUCT.priceBhd,
    quantity: 1,
  };
}

export function buildStoryCartItem(storyLanguage: StoryLanguage): CartItem {
  return {
    id: crypto.randomUUID(),
    productId: "peep-story",
    storyLanguage,
    unitPriceBhd: PEEP_STORY_PRODUCT.priceBhd,
    quantity: 1,
  };
}

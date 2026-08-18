export type DigitalTopicId =
  | "picky-eating"
  | "potty-training"
  | "screens-big-feelings"
  | "sharing-sibling-conflict"
  | "sleep-bedtime"
  | "starting-school"
  | "child-hits"
  | "school-season-toolkit";

export type DigitalBundleId = "digital-bundle" | "school-season-bundle";

export type DigitalProductId = DigitalTopicId | DigitalBundleId;

export type DigitalLanguage = "ar" | "en";

// At most one entry per DigitalProductId in a cart — adding an id that's already present
// replaces its language choice instead of creating a second line (see cart-context.tsx).
export interface DigitalCartItem {
  id: DigitalProductId;
  language: DigitalLanguage;
  unitPriceBhd: number;
}

export interface DigitalBuyerDetails {
  fullName: string;
  email: string;
  country: string;
  marketingOptIn: boolean;
}

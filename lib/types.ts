export type Locale = "ar" | "en";
export type Currency = "BHD" | "USD";

export type StoryLanguage = "ar" | "en";
export type CardLanguage = "ar" | "en";
export type CupColor = "pink" | "blue";

export interface BoxCustomization {
  storyLanguage: StoryLanguage;
  cardLanguage: CardLanguage;
  cupColor: CupColor;
  childName: string;
  giftCard: boolean;
}

export type PhysicalBoxKind = "ready-made" | "build-your-own" | "ready-to-gift";
export type BuilderProductId =
  | "story"
  | "puzzle"
  | "magnetic-map"
  | "coloring-book"
  | "alphabet-cards"
  | "cup"
  | "stickers"
  | "welcome-card";

export interface CartItem {
  id: string;
  /** Missing on carts saved before the builder launch; those are ready-made boxes. */
  kind?: PhysicalBoxKind;
  customization: BoxCustomization;
  selectedProductIds?: BuilderProductId[];
  unitPriceBhd: number;
  quantity: number;
}

export interface BuyerDetails {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  preferredContact: "email" | "whatsapp";
  marketingOptIn: boolean;
}

export type PaymentMethod = "iban" | "oreem";

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

export interface CartItem {
  id: string;
  customization: BoxCustomization;
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
  marketingOptIn: boolean;
}

export type PaymentMethod = "iban" | "oreem";

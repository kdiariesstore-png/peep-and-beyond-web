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

export type PhysicalProductId = "peep-box" | "peep-story";

export interface BoxCartItem {
  id: string;
  productId: "peep-box";
  customization: BoxCustomization;
  unitPriceBhd: number;
  quantity: number;
}

// The story sold on its own (the same printed booklet that ships inside a Peep Box) —
// only a language choice, none of the box's other customization.
export interface StoryCartItem {
  id: string;
  productId: "peep-story";
  storyLanguage: StoryLanguage;
  unitPriceBhd: number;
  quantity: number;
}

export type CartItem = BoxCartItem | StoryCartItem;

export interface BuyerDetails {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  marketingOptIn: boolean;
}

export type PaymentMethod = "iban" | "oreem" | "cod";

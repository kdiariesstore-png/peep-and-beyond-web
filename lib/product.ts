import type { BoxCustomization } from "./types";

export const PEEP_BOX_PRODUCT = {
  id: "peep-box",
  nameAr: "بوكس بيب الكامل",
  nameEn: "The Complete Peep Box",
  priceBhd: 21.9,
  contents: [
    "قصة بيب المصوّرة",
    "كتاب تلوين",
    "بزل بيب 42 × 42 سم",
    "خريطة الغابة المغناطيسية",
    "بطاقات حروف عربية أو إنجليزية",
    "ملصقات بيب",
    "كوب أطفال",
  ],
} as const;

export function createDefaultCustomization(): BoxCustomization {
  return {
    storyLanguage: "ar",
    cardLanguage: "ar",
    cupColor: "pink",
    childName: "",
    giftCard: false,
  };
}

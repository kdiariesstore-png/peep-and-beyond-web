import type { BoxCustomization } from "./types";

export const PEEP_BOX_PRODUCT = {
  id: "peep-box",
  nameAr: "بوكس بيب الكامل",
  nameEn: "The Complete Peep Box",
  priceBhd: 21.9,
  contents: {
    ar: [
      "بزل تعليمي يزيد من ثقة الطفل بنفسه مع كل قطعة",
      "خريطة مغناطيسية مع شخصيات مغناطيسية لزيادة خيال الطفل",
      "قصة بيب المصوّرة لما قبل النوم",
      "كتاب تلوين لزيادة إبداع الطفل",
      "بطاقات الحروف الأبجدية مع قلم سبورة قابل لإعادة الاستخدام للتعلّم مرارًا",
      "كوب أطفال بمصاص، متوفر بلونين",
      "ملصقات بيب الديناصور",
      "بطاقة ترحيب باسم الطفل — أجمل لمسة خاصة بهديته",
    ],
    en: [
      "Educational puzzle that builds your child's confidence with every piece",
      "Magnetic map with magnetic characters to spark your child's imagination",
      "Peep's illustrated bedtime story",
      "Coloring book to boost your child's creativity",
      "Alphabet cards with a reusable whiteboard marker for learning again and again",
      "Kid-friendly cup with a straw, available in two colors",
      "Peep the dinosaur stickers",
      "A welcome card with your child's name — the perfect personal touch for their gift",
    ],
  },
} as const;

// Lets the owner temporarily close physical Peep Box ordering (e.g. a soft launch that
// opens with digital products only) without a code change: set
// NEXT_PUBLIC_PHYSICAL_BOX_AVAILABLE=false in Vercel and redeploy. Defaults to available
// so an unset/forgotten env var never accidentally closes the store.
export function isPhysicalBoxAvailable(): boolean {
  return process.env.NEXT_PUBLIC_PHYSICAL_BOX_AVAILABLE !== "false";
}

export function createDefaultCustomization(): BoxCustomization {
  return {
    storyLanguage: "ar",
    cardLanguage: "ar",
    cupColor: "pink",
    childName: "",
    giftCard: false,
  };
}

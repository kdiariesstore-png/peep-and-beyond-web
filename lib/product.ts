import type { BoxCustomization } from "./types";
import { computeChargeableWeightKg } from "./payments/chargeable-weight";
import { ordersAreOpen } from "./inventory/launch-pricing";

export const PEEP_BOX_PRODUCT = {
  id: "peep-box",
  nameAr: "بوكس بيب الكامل",
  nameEn: "The Complete Peep Box",
  // The actual charged price — cart, checkout, and server-side total recomputation all
  // read this field, so it alone controls what a customer pays.
  priceBhd: 24.9,
  // Display-only: the crossed-out "was" price next to the launch price above. Never read
  // by cart/checkout/payment logic.
  originalPriceBhd: 28.9,
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

// Measured by the owner: actual packaged weight, and the outer package's
// length/width/height (cm) as shipped (bubble wrap + box). Used to compute the
// chargeable weight Oreem's shipping-rate calculator bills per box.
const PEEP_BOX_PACKAGE = {
  actualWeightKg: 1.1,
  lengthCm: 34,
  widthCm: 35,
  heightCm: 14,
} as const;

export const PEEP_BOX_CHARGEABLE_WEIGHT_KG = computeChargeableWeightKg(
  PEEP_BOX_PACKAGE.actualWeightKg,
  PEEP_BOX_PACKAGE.lengthCm,
  PEEP_BOX_PACKAGE.widthCm,
  PEEP_BOX_PACKAGE.heightCm
);

// Lets the owner temporarily close physical Peep Box ordering (e.g. a soft launch that
// opens with digital products only) without a code change: set
// NEXT_PUBLIC_PHYSICAL_BOX_AVAILABLE=false in Vercel and redeploy. Defaults to available
// so an unset/forgotten env var never accidentally closes the store. Also gated on the
// launch clock (ORDERS_OPEN_AT) so the box opens automatically at the announced time
// instead of relying on the owner to flip the env var at the exact minute.
export function isPhysicalBoxAvailable(now: Date = new Date()): boolean {
  if (process.env.NEXT_PUBLIC_PHYSICAL_BOX_AVAILABLE === "false") return false;
  return ordersAreOpen(now);
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

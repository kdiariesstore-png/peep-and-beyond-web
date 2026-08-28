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

// Real photos of the box's contents, shown as an auto-rotating gallery on the homepage.
// Add more paths here as more photos become available — a single entry just renders as a
// static image with no rotation.
export const PEEP_BOX_GALLERY_IMAGES: string[] = [
  "/images/peep-box-product.png",
  "/images/peep-box-gallery-storybook.jpg",
  "/images/peep-box-gallery-puzzle.jpg",
  "/images/peep-box-gallery-coloring-book.jpg",
  "/images/peep-box-gallery-forest-map.jpg",
  "/images/peep-box-gallery-alphabet-cards.jpg",
  "/images/peep-box-gallery-cups.jpg",
  "/images/peep-box-gallery-welcome-card.jpg",
];

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

// The same story printed inside every Peep Box, sold on its own — same printed booklet,
// same print-stock pool (see lib/inventory/story-stock.ts), just without the rest of the
// box's contents. Description text and cover art come directly from the owner's own book
// cover / promo graphics.
export const PEEP_STORY_PRODUCT = {
  id: "peep-story",
  nameAr: "قصة بيب المصورة — قفزة السعادة",
  nameEn: "Peep the Dinosaur — A Leap of Joy",
  priceBhd: 5,
  descriptionAr:
    "قد يكون بيب صغيرًا، لكن قفزاته المرحة تحمل سحرًا يجعل الأزهار تتفتح. وعندما يجد نفسه في غابة غريبة تبدأ قفزة بسيطة مليئة بالأصدقاء الجدد والشجاعة واللطف والسعادة. انضموا إلى بيب ليكتشف أن أصغرنا يستطيع أن يترك أثرًا جميلًا أينما ذهب.",
  descriptionEn:
    "Peep, a small dinosaur with joyful leaps, brings flowers to bloom. His adventure in an unfamiliar forest leads to new friends and lessons in courage, kindness, and joy. Join Peep in discovering that even the smallest can make a beautiful impact.",
  coverImageAr: "/images/peep-story-cover-ar.jpg",
  coverImageEn: "/images/peep-story-cover-en.jpg",
} as const;

// Estimated (the owner didn't have a scale handy) — a slim ~24-page softcover picture
// book in a padded mailer. Update with real measurements once available; Oreem's rate
// calculator is only as accurate as this number.
const PEEP_STORY_PACKAGE = {
  actualWeightKg: 0.2,
  lengthCm: 22,
  widthCm: 22,
  heightCm: 2,
} as const;

export const PEEP_STORY_CHARGEABLE_WEIGHT_KG = computeChargeableWeightKg(
  PEEP_STORY_PACKAGE.actualWeightKg,
  PEEP_STORY_PACKAGE.lengthCm,
  PEEP_STORY_PACKAGE.widthCm,
  PEEP_STORY_PACKAGE.heightCm
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

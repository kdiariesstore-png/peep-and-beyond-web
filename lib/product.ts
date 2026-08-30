import type {
  BoxCustomization,
  BuilderProductId,
  CartItem,
  PhysicalBoxKind,
} from "./types";

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

export const BUILDER_BASE_PRICE_BHD = 4;
export const BUILDER_MIN_PRODUCTS = 5;

export interface BuilderProduct {
  id: BuilderProductId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  priceBhd: number;
  image: string;
}

export const BUILDER_PRODUCTS: readonly BuilderProduct[] = [
  {
    id: "story",
    nameAr: "قصة بيب المصوّرة",
    nameEn: "Peep's illustrated story",
    descriptionAr: "قصة دافئة قبل النوم، بالعربية أو الإنجليزية.",
    descriptionEn: "A warm bedtime story in Arabic or English.",
    priceBhd: 5,
    image: "/images/scene-read.png",
  },
  {
    id: "puzzle",
    nameAr: "البزل التعليمي",
    nameEn: "Educational puzzle",
    descriptionAr: "قطع ممتعة تبني التركيز والثقة.",
    descriptionEn: "Playful pieces that build focus and confidence.",
    priceBhd: 3.5,
    image: "/images/scene-play.png",
  },
  {
    id: "magnetic-map",
    nameAr: "الخريطة المغناطيسية",
    nameEn: "Magnetic map",
    descriptionAr: "شخصيات ومغامرات مفتوحة للخيال.",
    descriptionEn: "Characters and open-ended imaginative play.",
    priceBhd: 3.5,
    image: "/images/scene-play.png",
  },
  {
    id: "coloring-book",
    nameAr: "كتاب التلوين",
    nameEn: "Coloring book",
    descriptionAr: "صفحات بيب لتلوين هادئ ومبدع.",
    descriptionEn: "Peep pages for calm, creative coloring.",
    priceBhd: 2.5,
    image: "/images/scene-learn.png",
  },
  {
    id: "alphabet-cards",
    nameAr: "بطاقات الحروف",
    nameEn: "Alphabet cards",
    descriptionAr: "بطاقات قابلة لإعادة الاستخدام مع قلم سبورة.",
    descriptionEn: "Reusable learning cards with a whiteboard marker.",
    priceBhd: 3,
    image: "/images/scene-learn.png",
  },
  {
    id: "cup",
    nameAr: "كوب الأطفال",
    nameEn: "Kids' cup",
    descriptionAr: "كوب بمصاص، بالوردي أو الأزرق.",
    descriptionEn: "Straw cup, available in pink or blue.",
    priceBhd: 2.9,
    image: "/images/peep-box-product.png",
  },
  {
    id: "stickers",
    nameAr: "ملصقات بيب",
    nameEn: "Peep stickers",
    descriptionAr: "ملصقات لطيفة للدفاتر واللعب.",
    descriptionEn: "Sweet stickers for notebooks and playtime.",
    priceBhd: 1,
    image: "/images/scene-play.png",
  },
  {
    id: "welcome-card",
    nameAr: "بطاقة باسم الطفل",
    nameEn: "Personalized welcome card",
    descriptionAr: "لمسة خاصة باسم الطفل داخل البوكس.",
    descriptionEn: "A personal welcome with the child's name.",
    priceBhd: 0.5,
    image: "/images/scene-read.png",
  },
] as const;

const BUILDER_PRODUCT_IDS = new Set<string>(BUILDER_PRODUCTS.map((product) => product.id));

export function isBuilderKind(kind: PhysicalBoxKind | undefined): boolean {
  return kind === "build-your-own" || kind === "ready-to-gift";
}

export function isBuilderProductId(value: unknown): value is BuilderProductId {
  return typeof value === "string" && BUILDER_PRODUCT_IDS.has(value);
}

export function calculateBuilderPrice(productIds: readonly BuilderProductId[]): number {
  const selected = new Set(productIds);
  return BUILDER_PRODUCTS.reduce(
    (total, product) => total + (selected.has(product.id) ? product.priceBhd : 0),
    BUILDER_BASE_PRICE_BHD
  );
}

export function calculateTrustedItemPrice(item: CartItem): number {
  if (!isBuilderKind(item.kind)) return PEEP_BOX_PRODUCT.priceBhd;
  return calculateBuilderPrice(item.selectedProductIds ?? []);
}

export function itemIncludesStory(item: CartItem): boolean {
  return !isBuilderKind(item.kind) || (item.selectedProductIds ?? []).includes("story");
}

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

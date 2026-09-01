import type {
  BoxCustomization,
  BuilderBoxKind,
  BuilderProductId,
  CartItem,
  PhysicalBoxKind,
} from "./types";

export const PEEP_BOX_PRODUCT = {
  id: "peep-box",
  nameAr: "بوكس بيب الكامل",
  nameEn: "The Complete Peep Box",
  priceBhd: 24.6,
  shipping: {
    // Measured empty printed Peep box.
    emptyBoxWeightGrams: 498,
    dimensionsCm: { length: 35, width: 26, height: 10 },
  },
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

export const CUSTOM_BOX_MIN_PRODUCTS = 3;
export const GIFT_BOX_MIN_PRODUCTS = 5;
export const GIFT_BOX_BASE_PRICE_BHD = 4;
export const GIFT_BOX_DISCOUNT_THRESHOLD = 5;
export const GIFT_BOX_DISCOUNT_RATE = 0.1;

export interface BuilderProduct {
  id: BuilderProductId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  priceBhd: number;
  image: string;
  shipping: {
    weightGrams: number;
    dimensionsCm: { length: number; width: number; height: number };
  };
}

export const BUILDER_PRODUCTS: readonly BuilderProduct[] = [
  {
    id: "story",
    nameAr: "قصة بيب المصوّرة",
    nameEn: "Peep's illustrated story",
    descriptionAr: "قصة دافئة قبل النوم، بالعربية أو الإنجليزية.",
    descriptionEn: "A warm bedtime story in Arabic or English.",
    priceBhd: 3.5,
    image: "/images/products/story.webp",
    shipping: { weightGrams: 177, dimensionsCm: { length: 23, width: 23, height: 1 } },
  },
  {
    id: "puzzle",
    nameAr: "البزل التعليمي",
    nameEn: "Educational puzzle",
    descriptionAr: "قطع ممتعة تبني التركيز والثقة.",
    descriptionEn: "Playful pieces that build focus and confidence.",
    priceBhd: 3.5,
    image: "/images/products/puzzle.webp",
    shipping: { weightGrams: 140, dimensionsCm: { length: 29.7, width: 21, height: 1 } },
  },
  {
    id: "magnetic-map",
    nameAr: "الخريطة المغناطيسية",
    nameEn: "Magnetic map",
    descriptionAr: "شخصيات ومغامرات مفتوحة للخيال.",
    descriptionEn: "Characters and open-ended imaginative play.",
    priceBhd: 2.5,
    image: "/images/products/magnetic-map.webp",
    shipping: { weightGrams: 91, dimensionsCm: { length: 29.7, width: 21, height: 1 } },
  },
  {
    id: "coloring-book",
    nameAr: "كتاب تلوين بيب",
    nameEn: "Peep coloring book",
    descriptionAr: "صفحات بيب لتلوين هادئ ومبدع.",
    descriptionEn: "Peep pages for calm, creative coloring.",
    priceBhd: 1.5,
    image: "/images/products/peep-coloring.webp",
    shipping: { weightGrams: 37, dimensionsCm: { length: 21, width: 14.8, height: 1 } },
  },
  {
    id: "lulu-coloring-book",
    nameAr: "كتاب تلوين لولو",
    nameEn: "Lulu coloring book",
    descriptionAr: "مغامرات لولو والطبيعة في صفحات ممتعة للتلوين.",
    descriptionEn: "Lulu's nature adventures in playful coloring pages.",
    priceBhd: 1.5,
    image: "/images/products/lulu-coloring.webp",
    shipping: { weightGrams: 37, dimensionsCm: { length: 21, width: 14.8, height: 1 } },
  },
  {
    id: "alphabet-cards",
    nameAr: "بطاقات الحروف",
    nameEn: "Alphabet cards",
    descriptionAr: "بطاقات قابلة لإعادة الاستخدام مع قلم سبورة.",
    descriptionEn: "Reusable learning cards with a whiteboard marker.",
    priceBhd: 4.5,
    image: "/images/products/alphabet-cards.webp",
    shipping: { weightGrams: 96, dimensionsCm: { length: 12, width: 12, height: 3 } },
  },
  {
    id: "cup",
    nameAr: "كوب الأطفال",
    nameEn: "Kids' cup",
    descriptionAr: "كوب بمصاص، بالوردي أو الأزرق.",
    descriptionEn: "Straw cup, available in pink or blue.",
    priceBhd: 3.7,
    image: "/images/products/cup.webp",
    shipping: { weightGrams: 157, dimensionsCm: { length: 16, width: 11, height: 11 } },
  },
  {
    id: "stickers",
    nameAr: "ملصقات بيب",
    nameEn: "Peep stickers",
    descriptionAr: "ملصقات لطيفة للدفاتر واللعب.",
    descriptionEn: "Sweet stickers for notebooks and playtime.",
    priceBhd: 0.9,
    image: "/images/products/peep-stickers.webp",
    shipping: { weightGrams: 6, dimensionsCm: { length: 29.7, width: 21, height: 0.2 } },
  },
  {
    id: "lulu-stickers",
    nameAr: "ملصقات لولو",
    nameEn: "Lulu stickers",
    descriptionAr: "ستيكرات لولو اللطيفة لمحبي الطبيعة والزهور.",
    descriptionEn: "Sweet Lulu stickers for little nature lovers.",
    priceBhd: 0.9,
    image: "/images/products/lulu-stickers.webp",
    shipping: { weightGrams: 6, dimensionsCm: { length: 29.7, width: 21, height: 0.2 } },
  },
  {
    id: "clothes-activity-book",
    nameAr: "كتيب ماذا نرتدي؟ مع بيب",
    nameEn: "What Should We Wear? with Peep",
    descriptionAr: "نشاط تلبيس وروتين يومي ممتع في 10 صفحات.",
    descriptionEn: "A 10-page outfit and daily-routine activity book.",
    priceBhd: 5,
    image: "/images/products/clothes-activity-book.webp",
    // Owner requested the clothes booklet use the same shipping weight as the cards.
    shipping: { weightGrams: 96, dimensionsCm: { length: 29.7, width: 21, height: 1.5 } },
  },
  {
    id: "welcome-card",
    nameAr: "بطاقة باسم الطفل",
    nameEn: "Personalized welcome card",
    descriptionAr: "لمسة خاصة باسم الطفل داخل البوكس.",
    descriptionEn: "A personal welcome with the child's name.",
    priceBhd: 0.5,
    image: "/images/products/welcome-card.webp",
    shipping: { weightGrams: 2, dimensionsCm: { length: 14.8, width: 10.5, height: 0.2 } },
  },
] as const;

const BUILDER_PRODUCT_IDS = new Set<string>(BUILDER_PRODUCTS.map((product) => product.id));

export function isBuilderKind(kind: PhysicalBoxKind | undefined): kind is BuilderBoxKind {
  return kind === "build-your-own" || kind === "ready-to-gift";
}

export function isIndividualProductKind(kind: PhysicalBoxKind | undefined): boolean {
  return kind === "individual-product";
}

export function isBuilderProductId(value: unknown): value is BuilderProductId {
  return typeof value === "string" && BUILDER_PRODUCT_IDS.has(value);
}

export function getBuilderMinProducts(kind: BuilderBoxKind): number {
  return kind === "ready-to-gift" ? GIFT_BOX_MIN_PRODUCTS : CUSTOM_BOX_MIN_PRODUCTS;
}

export function getBuilderBasePrice(kind: BuilderBoxKind): number {
  return kind === "ready-to-gift" ? GIFT_BOX_BASE_PRICE_BHD : 0;
}

export function getBuilderProductsSubtotal(productIds: readonly BuilderProductId[]): number {
  const selected = new Set(productIds);
  return BUILDER_PRODUCTS.reduce(
    (total, product) => total + (selected.has(product.id) ? product.priceBhd : 0),
    0
  );
}

export function calculateBuilderPrice(
  kind: BuilderBoxKind,
  productIds: readonly BuilderProductId[]
): number {
  const selected = new Set(productIds);
  const beforeDiscount = getBuilderBasePrice(kind) + getBuilderProductsSubtotal(productIds);
  const discount =
    kind === "ready-to-gift" && selected.size > GIFT_BOX_DISCOUNT_THRESHOLD
      ? beforeDiscount * GIFT_BOX_DISCOUNT_RATE
      : 0;
  return Math.round((beforeDiscount - discount) * 1000) / 1000;
}

export function getBuilderProduct(id: BuilderProductId): BuilderProduct | undefined {
  return BUILDER_PRODUCTS.find((product) => product.id === id);
}

export function calculateTrustedItemPrice(item: CartItem): number {
  if (isBuilderKind(item.kind)) {
    return calculateBuilderPrice(item.kind, item.selectedProductIds ?? []);
  }
  if (isIndividualProductKind(item.kind)) {
    const productId = item.selectedProductIds?.[0];
    return productId ? getBuilderProduct(productId)?.priceBhd ?? 0 : 0;
  }
  return PEEP_BOX_PRODUCT.priceBhd;
}

export function itemIncludesStory(item: CartItem): boolean {
  if (item.kind === "ready-made" || item.kind === undefined) return true;
  return (item.selectedProductIds ?? []).includes("story");
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

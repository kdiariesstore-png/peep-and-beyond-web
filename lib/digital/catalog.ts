import type { DigitalBundleId, DigitalLanguage, DigitalProductId, DigitalTopicId } from "./types";

export interface DigitalProduct {
  id: DigitalTopicId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  priceBhd: number;
}

export interface DigitalBundle {
  id: DigitalBundleId;
  nameAr: string;
  nameEn: string;
  priceBhd: number;
  includes: DigitalTopicId[];
}

export const DIGITAL_PRODUCTS: DigitalProduct[] = [
  {
    id: "picky-eating",
    nameAr: "الأكل الانتقائي",
    nameEn: "Picky Eating",
    descriptionAr: "دليل عملي لمساعدة طفلك على تجربة أطعمة جديدة بثقة وبدون توتر وقت الأكل.",
    descriptionEn: "A practical guide to help your child try new foods with confidence, without mealtime stress.",
    priceBhd: 2.99,
  },
  {
    id: "potty-training",
    nameAr: "تدريب الحمام",
    nameEn: "Potty Training",
    descriptionAr: "خطوات بسيطة وواضحة لدعم طفلك في رحلة التخلي عن الحفاض بثقة.",
    descriptionEn: "Simple, clear steps to support your child through potty training with confidence.",
    priceBhd: 2.99,
  },
  {
    id: "screens-big-feelings",
    nameAr: "الشاشات والمشاعر الكبيرة",
    nameEn: "Screens and Big Feelings",
    descriptionAr: "كيف تدير وقت الشاشة وتساعد طفلك على التعامل مع مشاعره القوية.",
    descriptionEn: "How to manage screen time and help your child handle big emotions.",
    priceBhd: 2.99,
  },
  {
    id: "sharing-sibling-conflict",
    nameAr: "المشاركة والخلاف بين الإخوة",
    nameEn: "Sharing and Sibling Conflict",
    descriptionAr: "أفكار عملية لتعليم طفلك المشاركة وتخفيف الخلافات بين الإخوة.",
    descriptionEn: "Practical ideas to teach sharing and ease conflict between siblings.",
    priceBhd: 2.99,
  },
  {
    id: "sleep-bedtime",
    nameAr: "النوم ووقت الفراش",
    nameEn: "Sleep and Bedtime",
    descriptionAr: "روتين هادئ يساعد طفلك على النوم بسهولة كل ليلة.",
    descriptionEn: "A calm routine to help your child fall asleep easily every night.",
    priceBhd: 2.99,
  },
  {
    id: "starting-school",
    nameAr: "بداية المدرسة والانفصال",
    nameEn: "Starting School and Separation",
    descriptionAr: "دعم طفلك في أول يوم مدرسة والتعامل مع قلق الانفصال.",
    descriptionEn: "Supporting your child through their first day of school and separation anxiety.",
    priceBhd: 2.99,
  },
  {
    id: "child-hits",
    nameAr: "عندما يضرب طفلك",
    nameEn: "When Your Child Hits",
    descriptionAr: "فهم سبب الضرب عند الأطفال وطرق هادئة وفعالة للتعامل معه.",
    descriptionEn: "Understanding why young children hit, and calm, effective ways to respond.",
    priceBhd: 2.99,
  },
  {
    id: "school-season-toolkit",
    nameAr: "مجموعة العودة للمدرسة",
    nameEn: "The School Season Toolkit",
    descriptionAr:
      "سبع أدوات جاهزة للطباعة — جداول وتشيك ليست وسكريبتات — تساعد طفلك (وتساعدك) على الانتقال بهدوء للحضانة أو الروضة أو المدرسة.",
    descriptionEn:
      "Seven ready-to-use schedules, checklists, and scripts to help your child (and you) ease into daycare, preschool, or school.",
    priceBhd: 2.99,
  },
];

export const DIGITAL_BUNDLE: DigitalBundle = {
  id: "digital-bundle",
  nameAr: "الباقة الكاملة (السبعة مواضيع)",
  nameEn: "The Complete Bundle (all 7 topics)",
  priceBhd: 13.99,
  includes: DIGITAL_PRODUCTS.filter((p) => p.id !== "school-season-toolkit").map((p) => p.id),
};

// A seasonal, narrower bundle: just the new toolkit plus the existing guide it's designed
// to sit alongside (the toolkit's own intro explicitly says so) — distinct from
// DIGITAL_BUNDLE, which covers the 7 general-topic guides.
export const SCHOOL_SEASON_BUNDLE: DigitalBundle = {
  id: "school-season-bundle",
  nameAr: "الحزمة الكاملة للعودة للمدرسة",
  nameEn: "The Complete Back-to-School Bundle",
  priceBhd: 3.9,
  includes: ["school-season-toolkit", "starting-school"],
};

export const DIGITAL_BUNDLES: DigitalBundle[] = [DIGITAL_BUNDLE, SCHOOL_SEASON_BUNDLE];

export function getDigitalProductPrice(id: DigitalProductId): number | null {
  const bundle = DIGITAL_BUNDLES.find((b) => b.id === id);
  if (bundle) return bundle.priceBhd;
  return DIGITAL_PRODUCTS.find((p) => p.id === id)?.priceBhd ?? null;
}

export function digitalFileName(id: DigitalTopicId, language: DigitalLanguage): string {
  return `${id}-${language}.pdf`;
}

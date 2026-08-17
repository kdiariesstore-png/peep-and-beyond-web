import type { DigitalLanguage, DigitalProductId, DigitalTopicId } from "./types";

export interface DigitalProduct {
  id: DigitalTopicId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  priceBhd: number;
}

export const DIGITAL_PRODUCTS: DigitalProduct[] = [
  {
    id: "picky-eating",
    nameAr: "الأكل الانتقائي",
    nameEn: "Picky Eating",
    descriptionAr: "دليل عملي لمساعدة طفلك على تجربة أطعمة جديدة بثقة وبدون توتر وقت الأكل.",
    descriptionEn: "A practical guide to help your child try new foods with confidence, without mealtime stress.",
    priceBhd: 2.7,
  },
  {
    id: "potty-training",
    nameAr: "تدريب الحمام",
    nameEn: "Potty Training",
    descriptionAr: "خطوات بسيطة وواضحة لدعم طفلك في رحلة التخلي عن الحفاض بثقة.",
    descriptionEn: "Simple, clear steps to support your child through potty training with confidence.",
    priceBhd: 2.7,
  },
  {
    id: "screens-big-feelings",
    nameAr: "الشاشات والمشاعر الكبيرة",
    nameEn: "Screens and Big Feelings",
    descriptionAr: "كيف تدير وقت الشاشة وتساعد طفلك على التعامل مع مشاعره القوية.",
    descriptionEn: "How to manage screen time and help your child handle big emotions.",
    priceBhd: 2.7,
  },
  {
    id: "sharing-sibling-conflict",
    nameAr: "المشاركة والخلاف بين الإخوة",
    nameEn: "Sharing and Sibling Conflict",
    descriptionAr: "أفكار عملية لتعليم طفلك المشاركة وتخفيف الخلافات بين الإخوة.",
    descriptionEn: "Practical ideas to teach sharing and ease conflict between siblings.",
    priceBhd: 2.7,
  },
  {
    id: "sleep-bedtime",
    nameAr: "النوم ووقت الفراش",
    nameEn: "Sleep and Bedtime",
    descriptionAr: "روتين هادئ يساعد طفلك على النوم بسهولة كل ليلة.",
    descriptionEn: "A calm routine to help your child fall asleep easily every night.",
    priceBhd: 2.7,
  },
  {
    id: "starting-school",
    nameAr: "بداية المدرسة والانفصال",
    nameEn: "Starting School and Separation",
    descriptionAr: "دعم طفلك في أول يوم مدرسة والتعامل مع قلق الانفصال.",
    descriptionEn: "Supporting your child through their first day of school and separation anxiety.",
    priceBhd: 2.7,
  },
  {
    id: "child-hits",
    nameAr: "عندما يضرب طفلك",
    nameEn: "When Your Child Hits",
    descriptionAr: "فهم سبب الضرب عند الأطفال وطرق هادئة وفعالة للتعامل معه.",
    descriptionEn: "Understanding why young children hit, and calm, effective ways to respond.",
    priceBhd: 2.7,
  },
];

export const DIGITAL_BUNDLE = {
  id: "digital-bundle" as const,
  nameAr: "الباقة الكاملة (السبعة مواضيع)",
  nameEn: "The Complete Bundle (all 7 topics)",
  priceBhd: 12.0,
  includes: DIGITAL_PRODUCTS.map((p) => p.id),
};

export function getDigitalProductPrice(id: DigitalProductId): number | null {
  if (id === "digital-bundle") return DIGITAL_BUNDLE.priceBhd;
  return DIGITAL_PRODUCTS.find((p) => p.id === id)?.priceBhd ?? null;
}

export function digitalFileName(id: DigitalTopicId, language: DigitalLanguage): string {
  return `${id}-${language}.pdf`;
}

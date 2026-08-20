import type { DigitalBundleId, DigitalLanguage, DigitalProductId, DigitalTopicId } from "./types";

export interface DigitalProduct {
  id: DigitalTopicId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  // The booklet's own "What's inside" paragraph (from page 2 of the PDF), shown on the
  // product card so a customer can read exactly what they're buying before checkout.
  whatsInsideAr: string;
  whatsInsideEn: string;
  priceBhd: number;
  // Which language files actually exist for this product. Defaults to both when omitted
  // (every product so far has an -ar.pdf and an -en.pdf) — set this when a product only
  // ships in one language, so the product card doesn't offer a language that has no file.
  availableLanguages?: DigitalLanguage[];
  // Optional cover image (path under /public) shown at the top of the product card.
  coverImage?: string;
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
    id: "activity-book",
    nameAr: "كتاب الأنشطة التحضيري",
    nameEn: "Preschool Activity Book",
    descriptionAr: "كتاب أنشطة تفاعلي باللغة الإنجليزية لتعليم طفلك الحروف والأرقام بطريقة ممتعة.",
    descriptionEn:
      "An interactive English-language activity book to help your child learn letters, numbers, and more through fun, hands-on pages.",
    whatsInsideAr:
      "كتاب باللغة الإنجليزية من 81 صفحة يضم أنشطة الحروف الأبجدية، والأرقام من 0 إلى 20، وتتبع الخطوط، والمتاهات، والتلوين، والمطابقة، والألغاز، وألعابًا ممتعة — مخصص للأطفال من سن 3 إلى 5 سنوات.",
    whatsInsideEn:
      "An 81-page English activity book: ABC letters, numbers 0–20, tracing, mazes, coloring, matching, quizzes, and fun games — designed for kids ages 3–5.",
    priceBhd: 3.9,
    availableLanguages: ["en"],
    coverImage: "/images/activity-book-cover.png",
  },
  {
    id: "picky-eating",
    nameAr: "الأكل الانتقائي",
    nameEn: "Picky Eating",
    descriptionAr: "دليل عملي لمساعدة طفلك على تجربة أطعمة جديدة بثقة وبدون توتر وقت الأكل.",
    descriptionEn: "A practical guide to help your child try new foods with confidence, without mealtime stress.",
    whatsInsideAr:
      "لماذا يصبح بعض الأطفال انتقائيين في الأكل من الأساس، وما هو واقعي توقعه في كل مرحلة عمرية، وطريقة بسيطة من أربع خطوات لأوقات طعام أهدأ مبنية على أبحاث حقيقية في تغذية الأطفال، وعبارات جاهزة للحظات التي تخرج عن السيطرة، والعادات التي تزيد من صعوبة الأكل الانتقائي دون أن ندري، وكيف تبنين إيقاعًا عائليًا حول الطعام يُخرج المعركة اليومية من المعادلة.",
    whatsInsideEn:
      "Why kids get picky in the first place, what's realistic to expect at each age, a simple four-step method for calmer mealtimes built on real pediatric-nutrition research, ready-to-use scripts for the moments that go sideways, the habits that quietly make picky eating worse, and how to build a family mealtime rhythm that takes the daily battle out of the equation.",
    priceBhd: 2.99,
  },
  {
    id: "potty-training",
    nameAr: "تدريب الحمام",
    nameEn: "Potty Training",
    descriptionAr: "خطوات بسيطة وواضحة لدعم طفلك في رحلة التخلي عن الحفاض بثقة.",
    descriptionEn: "Simple, clear steps to support your child through potty training with confidence.",
    whatsInsideAr:
      "لماذا يهم الاستعداد الجسدي والنمائي أكثر من عيد الميلاد، وكيف يبدو التدريب عبر ثلاث مراحل عملية، وطريقة قابلة للتكرار من أربع خطوات لبناء إيقاع يومي للتدريب، وعبارات جاهزة للتشجيع على استخدام الحمام والتعامل مع الحوادث، والعادات التي تُبطئ التدريب دون أن ندري، وكيف تبنين روتينًا أهدأ في المنزل، نهارًا وليلاً.",
    whatsInsideEn:
      "Why physical and developmental readiness matters more than a birthday, what training looks like across three practical stages, a repeatable four-step method for the daily rhythm of training, ready-to-use scripts for encouraging use of the potty and handling accidents, the habits that quietly slow training down, and how to build a calmer routine at home, day and night.",
    priceBhd: 2.99,
  },
  {
    id: "screens-big-feelings",
    nameAr: "الشاشات والمشاعر الكبيرة",
    nameEn: "Screens and Big Feelings",
    descriptionAr: "كيف تدير وقت الشاشة وتساعد طفلك على التعامل مع مشاعره القوية.",
    descriptionEn: "How to manage screen time and help your child handle big emotions.",
    whatsInsideAr:
      "لماذا يُعد الانتقال بعيدًا عن الشاشة صعبًا بشكل خاص على دماغ في طور النمو، وما هو واقعي توقعه في كل مرحلة عمرية وفق أحدث إرشادات طب الأطفال، وطريقة بسيطة من أربع خطوات لإنهاء وقت الشاشة دون معركة، وعبارات جاهزة للاستخدام، والعادات التي تزيد من صعوبة الانتقال دون أن ندري، وكيف تبنين إيقاعًا أسريًا حول الشاشات لا يعتمد على قوة الإرادة وحدها.",
    whatsInsideEn:
      "Why screen transitions are uniquely hard for a developing brain, what's realistic to expect at each age under the newest pediatric guidance, a simple four-step method for ending screen time without a battle, ready-to-use scripts, the habits that quietly make screen meltdowns worse, and how to build a household rhythm around screens that doesn't rely on willpower alone.",
    priceBhd: 2.99,
  },
  {
    id: "sharing-sibling-conflict",
    nameAr: "المشاركة والخلاف بين الإخوة",
    nameEn: "Sharing and Sibling Conflict",
    descriptionAr: "أفكار عملية لتعليم طفلك المشاركة وتخفيف الخلافات بين الإخوة.",
    descriptionEn: "Practical ideas to teach sharing and ease conflict between siblings.",
    whatsInsideAr:
      "لماذا يتنافس الإخوة على الألعاب والمساحة واهتمامك من الأساس، وما هو واقعي توقعه في كل عمر بينما ما زال حس العدل وضبط النفس قيد التكوّن، وطريقة بسيطة من أربع خطوات للتعامل مع الخلاف في لحظته، وعبارات جاهزة للاستخدام، والعادات التي تزيد التنافس دون أن ندري، وكيف تبنين إيقاعًا أسريًا لا يجعل الشجار الطريقة الوحيدة ليشعر أطفالك بأنهم مرئيون.",
    whatsInsideEn:
      "Why siblings compete over toys, space, and your attention in the first place, what's realistic to expect at each age as fairness and self-control are still under construction, a simple four-step method for mediating conflict in the moment, ready-to-use scripts, the habits that quietly make rivalry worse, and how to build a household rhythm where fighting isn't the only way your kids get noticed.",
    priceBhd: 2.99,
  },
  {
    id: "sleep-bedtime",
    nameAr: "النوم ووقت الفراش",
    nameEn: "Sleep and Bedtime",
    descriptionAr: "روتين هادئ يساعد طفلك على النوم بسهولة كل ليلة.",
    descriptionEn: "A calm routine to help your child fall asleep easily every night.",
    whatsInsideAr:
      "لماذا يصعب النوم على الأطفال، وما هو واقعي توقعه في كل مرحلة عمرية وفق أحدث إرشادات طب النوم، وطريقة بسيطة من أربع خطوات لبناء وقت نوم هادئ وثابت، وعبارات جاهزة للمماطلة والاستيقاظ الليلي، والعادات التي تزيد صعوبة وقت النوم دون أن ندري، وكيف تبنين إيقاعًا أسريًا حول النوم لا يعتمد على معركة كل ليلة.",
    whatsInsideEn:
      "Why sleep is hard for kids to settle into, what's realistic to expect at each age based on current sleep-medicine guidance, a simple four-step method for calm and consistent bedtimes, ready-to-use scripts for stalling and night waking, the habits that quietly make bedtime harder, and how to build a household rhythm around sleep that doesn't rely on a fight every night.",
    priceBhd: 2.99,
  },
  {
    id: "starting-school",
    nameAr: "بداية المدرسة والانفصال",
    nameEn: "Starting School and Separation",
    descriptionAr: "دعم طفلك في أول يوم مدرسة والتعامل مع قلق الانفصال.",
    descriptionEn: "Supporting your child through their first day of school and separation anxiety.",
    whatsInsideAr:
      "لماذا يُعد القلق من الانفصال في الواقع علامة على تعلّق صحي، وما هو واقعي توقعه في كل مرحلة عمرية من الطفولة المبكرة حتى سنوات المدرسة، وطريقة بسيطة من أربع خطوات للتعامل مع الوداع بضيق أقل، وعبارات جاهزة للاستخدام، والعادات التي تزيد من صعوبة الوداع دون أن ندري، وكيف تبنين روتينًا حول الانتقالات لا يعتمد على صباح مثالي في كل مرة.",
    whatsInsideEn:
      "Why separation anxiety is actually a sign of a healthy bond, what's realistic to expect at each age from toddlerhood through the school years, a simple four-step method for handling drop-off with less distress, ready-to-use goodbye scripts, the habits that quietly make separation harder, and how to build a routine around transitions that doesn't rely on a perfect morning every time.",
    priceBhd: 2.99,
  },
  {
    id: "child-hits",
    nameAr: "عندما يضرب طفلك",
    nameEn: "When Your Child Hits",
    descriptionAr: "فهم سبب الضرب عند الأطفال وطرق هادئة وفعالة للتعامل معه.",
    descriptionEn: "Understanding why young children hit, and calm, effective ways to respond.",
    whatsInsideAr:
      'جولة سريعة في "لماذا" يغضب الأطفال ويضربون، وما هو طبيعي في كل مرحلة عمرية من الطفولة المبكرة حتى سنوات المدرسة، وطريقة بسيطة من أربع خطوات يمكنك استخدامها في لحظة الانفعال، وعبارات جاهزة تقولينها لطفلك، وأكثر الأخطاء شيوعًا التي تزيد الأمور سوءًا دون أن ندري، وكيف تمنعين العاصفة قبل أن تبدأ.',
    whatsInsideEn:
      'A short tour of the "why" behind anger and hitting, what\'s typical at each age from toddlerhood through the school years, a simple four-step method you can use in the heat of the moment, ready-to-use scripts, the most common mistakes that quietly make things worse, and how to prevent the storm before it starts.',
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
    whatsInsideAr:
      "جدول العودة التدريجي للروتين لمدة 14 يوم، تشيك ليست مستلزمات المدرسة حسب العمر، جدول تعديل النوم التدريجي، جدول مهارات الاستقلالية حسب العمر، قسم قصير مكتوب لك انتِ (الأم) قبل أول يوم، تشيك ليست آخر 3 أيام، ومجموعة بطاقات مهارات اجتماعية لتكوين أول صداقة.",
    whatsInsideEn:
      "A 14-day gradual return-to-routine schedule, an age-by-age school supplies checklist, a gradual sleep-adjustment schedule, an age-by-age independence-skills schedule, a short section written for you (the parent) before the first day, a last-3-days checklist, and a set of social-skills conversation cards for making new friends.",
    priceBhd: 2.99,
  },
];

export const DIGITAL_BUNDLE: DigitalBundle = {
  id: "digital-bundle",
  nameAr: "الباقة الكاملة (السبعة مواضيع)",
  nameEn: "The Complete Bundle (all 7 topics)",
  priceBhd: 13.99,
  includes: DIGITAL_PRODUCTS.filter(
    (p) => p.id !== "school-season-toolkit" && p.id !== "activity-book"
  ).map((p) => p.id),
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

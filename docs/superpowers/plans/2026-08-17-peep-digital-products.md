# Digital Products Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new, independent "Digital Products" line to the site — 7 parenting-topic PDF
booklets (each in Arabic/English) plus a bundle, with their own browse page, cart, checkout,
Oreem-only payment, and instant watermarked download delivery.

**Architecture:** A fully parallel system next to the existing physical Peep Box code —
separate types, cart (`localStorage` key `peep-digital-cart-v1`), checkout page, Oreem order
route, and confirmation/delivery page — living under `lib/digital/`, `components/digital/`,
and `app/digital/`. It reuses the physical flow's already-hardened building blocks directly
where the interface is generic enough (`verifyTransaction`, `createHostedPayment`,
`claimOrderProcessing`, `buildCustomerToOwnerWhatsappLink`), and does not modify any existing
physical-box file except `app/layout.tsx` (new provider) and `components/header.tsx` (new nav
link).

**Tech Stack:** Next.js 14 App Router / TypeScript / Tailwind, Vitest + Testing Library, adds
`pdf-lib` (pure JS, no native dependencies — safe for Vercel serverless functions) for
watermarking PDFs at download time.

## Global Constraints

- Guest checkout only — no accounts, matching the rest of the site.
- Digital orders never mix with physical Peep Box orders — enforced structurally by using a
  completely separate cart/checkout, not a runtime guard.
- Digital checkout collects only `fullName`, `email`, `country`, `marketingOptIn` — no phone,
  city, or address (nothing ships).
- Payment for digital products is **Oreem only**, in every country — no IBAN option, because
  IBAN payments need the owner's manual receipt review and digital delivery must be instant.
- Never trust client-supplied prices or product ids — always resolve the real price server-side
  from the catalog (`lib/digital/catalog.ts`), same pattern as `PEEP_BOX_PRODUCT.priceBhd` in
  the existing Oreem route.
- The download route must independently re-verify payment via `verifyTransaction` before
  serving any file — never trust the confirmation page or a bare URL parameter.
- Watermark text must be ASCII-only (e.g. `Peep & beyond - Order <txnRef>`) — pdf-lib's
  standard 14 fonts have no Arabic glyphs, and shipping a custom Arabic font is out of scope.
- All new pages/components must be mobile-responsive by default (single-column base layout,
  `md:` breakpoints for wider layouts) — the same pattern already used throughout the site
  (e.g. `components/hero.tsx`, `components/three-moments.tsx`).
- Prices: 2.700 BHD per individual booklet, 12.000 BHD for the 7-booklet bundle.
- HTML-escape any user-supplied string (buyer name/email) before it goes into email HTML,
  matching `escapeHtml` in `lib/email/order-notification-email.ts`.
- No stock tracking, no zipping the bundle — one download link per booklet, always.

---

### Task 1: Digital product types and catalog

**Files:**
- Create: `lib/digital/types.ts`
- Create: `lib/digital/catalog.ts`
- Test: `lib/digital/catalog.test.ts`

**Interfaces:**
- Produces: `DigitalTopicId`, `DigitalLanguage`, `DigitalCartItem`, `DigitalBuyerDetails`
  (from `types.ts`); `DIGITAL_PRODUCTS`, `DIGITAL_BUNDLE`, `getDigitalProductPrice(id)`,
  `digitalFileName(id, language)` (from `catalog.ts`) — every later task imports from these
  two files instead of redefining product data.

- [ ] **Step 1: Create the types file**

```ts
// lib/digital/types.ts
export type DigitalTopicId =
  | "picky-eating"
  | "potty-training"
  | "screens-big-feelings"
  | "sharing-sibling-conflict"
  | "sleep-bedtime"
  | "starting-school"
  | "child-hits";

export type DigitalProductId = DigitalTopicId | "digital-bundle";

export type DigitalLanguage = "ar" | "en";

// At most one entry per DigitalProductId in a cart — adding an id that's already present
// replaces its language choice instead of creating a second line (see cart-context.tsx).
export interface DigitalCartItem {
  id: DigitalProductId;
  language: DigitalLanguage;
  unitPriceBhd: number;
}

export interface DigitalBuyerDetails {
  fullName: string;
  email: string;
  country: string;
  marketingOptIn: boolean;
}
```

- [ ] **Step 2: Write the failing catalog test**

```ts
// lib/digital/catalog.test.ts
import { describe, expect, it } from "vitest";
import { DIGITAL_PRODUCTS, DIGITAL_BUNDLE, getDigitalProductPrice, digitalFileName } from "./catalog";

describe("DIGITAL_PRODUCTS", () => {
  it("has exactly 7 topics, each priced at 2.700 BHD with Arabic and English names", () => {
    expect(DIGITAL_PRODUCTS).toHaveLength(7);
    for (const product of DIGITAL_PRODUCTS) {
      expect(product.priceBhd).toBe(2.7);
      expect(product.nameAr.length).toBeGreaterThan(0);
      expect(product.nameEn.length).toBeGreaterThan(0);
    }
  });

  it("has unique ids", () => {
    const ids = DIGITAL_PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("DIGITAL_BUNDLE", () => {
  it("is priced at 12.000 BHD and includes all 7 product ids", () => {
    expect(DIGITAL_BUNDLE.priceBhd).toBe(12.0);
    expect(DIGITAL_BUNDLE.includes).toEqual(DIGITAL_PRODUCTS.map((p) => p.id));
  });
});

describe("getDigitalProductPrice", () => {
  it("resolves the price for an individual topic and for the bundle", () => {
    expect(getDigitalProductPrice("sleep-bedtime")).toBe(2.7);
    expect(getDigitalProductPrice("digital-bundle")).toBe(12.0);
  });
});

describe("digitalFileName", () => {
  it("builds the source PDF filename for a topic and language", () => {
    expect(digitalFileName("sleep-bedtime", "ar")).toBe("sleep-bedtime-ar.pdf");
    expect(digitalFileName("sleep-bedtime", "en")).toBe("sleep-bedtime-en.pdf");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run lib/digital/catalog.test.ts`
Expected: FAIL — `./catalog` does not exist yet.

- [ ] **Step 4: Implement the catalog**

```ts
// lib/digital/catalog.ts
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run lib/digital/catalog.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/digital/types.ts lib/digital/catalog.ts lib/digital/catalog.test.ts
git commit -m "feat: add digital product catalog and types"
```

---

### Task 2: Digital order total calculator

**Files:**
- Create: `lib/digital/order-total.ts`
- Test: `lib/digital/order-total.test.ts`

**Interfaces:**
- Consumes: `DigitalCartItem` from `lib/digital/types.ts` (Task 1).
- Produces: `calculateDigitalOrderTotal(items: DigitalCartItem[]): { subtotalBhd: number; totalBhd: number }`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/digital/order-total.test.ts
import { describe, expect, it } from "vitest";
import { calculateDigitalOrderTotal } from "./order-total";
import type { DigitalCartItem } from "./types";

describe("calculateDigitalOrderTotal", () => {
  it("sums item prices with no shipping line", () => {
    const items: DigitalCartItem[] = [
      { id: "sleep-bedtime", language: "ar", unitPriceBhd: 2.7 },
      { id: "potty-training", language: "en", unitPriceBhd: 2.7 },
    ];
    const result = calculateDigitalOrderTotal(items);
    expect(result.subtotalBhd).toBe(5.4);
    expect(result.totalBhd).toBe(5.4);
  });

  it("returns zero for an empty cart", () => {
    const result = calculateDigitalOrderTotal([]);
    expect(result.subtotalBhd).toBe(0);
    expect(result.totalBhd).toBe(0);
  });

  it("rounds to 3 decimal places", () => {
    const items: DigitalCartItem[] = [
      { id: "sleep-bedtime", language: "ar", unitPriceBhd: 0.1 },
      { id: "potty-training", language: "ar", unitPriceBhd: 0.2 },
    ];
    expect(calculateDigitalOrderTotal(items).subtotalBhd).toBe(0.3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/digital/order-total.test.ts`
Expected: FAIL — `./order-total` does not exist yet.

- [ ] **Step 3: Implement**

```ts
// lib/digital/order-total.ts
import type { DigitalCartItem } from "./types";

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export interface DigitalOrderTotal {
  subtotalBhd: number;
  totalBhd: number;
}

// Digital delivery is always instant and free, so unlike the physical box's
// calculateOrderTotal there is no shipping line and no country-dependent branch.
export function calculateDigitalOrderTotal(items: DigitalCartItem[]): DigitalOrderTotal {
  const subtotalBhd = round3(items.reduce((sum, item) => sum + item.unitPriceBhd, 0));
  return { subtotalBhd, totalBhd: subtotalBhd };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/digital/order-total.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/digital/order-total.ts lib/digital/order-total.test.ts
git commit -m "feat: add digital order total calculator"
```

---

### Task 3: Digital cart storage and React context

**Files:**
- Create: `lib/digital/cart-storage.ts`
- Create: `lib/digital/cart-context.tsx`
- Test: `lib/digital/cart-storage.test.ts`
- Test: `lib/digital/cart-context.test.tsx`

**Interfaces:**
- Consumes: `DigitalCartItem`, `DigitalProductId` from `lib/digital/types.ts` (Task 1).
- Produces: `loadDigitalCart()`, `saveDigitalCart(items)`, `serializeDigitalCart(items)`,
  `deserializeDigitalCart(raw)` (from `cart-storage.ts`); `DigitalCartProvider`,
  `useDigitalCart()` returning
  `{ items, hydrated, addOrReplaceItem(item), removeItem(id), clear() }` (from
  `cart-context.tsx`) — the checkout page (Task 12) and confirmation page (Task 13) both
  depend on this exact shape.

- [ ] **Step 1: Write the failing storage test**

```ts
// lib/digital/cart-storage.test.ts
import { describe, expect, it, beforeEach } from "vitest";
import {
  serializeDigitalCart,
  deserializeDigitalCart,
  loadDigitalCart,
  saveDigitalCart,
} from "./cart-storage";
import type { DigitalCartItem } from "./types";

const item: DigitalCartItem = { id: "sleep-bedtime", language: "ar", unitPriceBhd: 2.7 };

beforeEach(() => {
  window.localStorage.clear();
});

describe("serializeDigitalCart / deserializeDigitalCart", () => {
  it("round-trips a list of items", () => {
    expect(deserializeDigitalCart(serializeDigitalCart([item]))).toEqual([item]);
  });

  it("returns an empty array for null, garbage, or non-array JSON", () => {
    expect(deserializeDigitalCart(null)).toEqual([]);
    expect(deserializeDigitalCart("not json")).toEqual([]);
    expect(deserializeDigitalCart(JSON.stringify({ not: "an array" }))).toEqual([]);
  });

  it("drops entries with an unknown id, bad language, or non-numeric price", () => {
    const bad = [
      { id: "not-a-real-product", language: "ar", unitPriceBhd: 2.7 },
      { id: "sleep-bedtime", language: "fr", unitPriceBhd: 2.7 },
      { id: "sleep-bedtime", language: "ar", unitPriceBhd: "2.7" },
    ];
    expect(deserializeDigitalCart(JSON.stringify(bad))).toEqual([]);
  });
});

describe("loadDigitalCart / saveDigitalCart", () => {
  it("persists and reloads items via localStorage", () => {
    saveDigitalCart([item]);
    expect(loadDigitalCart()).toEqual([item]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/digital/cart-storage.test.ts`
Expected: FAIL — `./cart-storage` does not exist yet.

- [ ] **Step 3: Implement cart-storage.ts**

```ts
// lib/digital/cart-storage.ts
import type { DigitalCartItem } from "./types";

const STORAGE_KEY = "peep-digital-cart-v1";

const VALID_IDS = new Set([
  "picky-eating",
  "potty-training",
  "screens-big-feelings",
  "sharing-sibling-conflict",
  "sleep-bedtime",
  "starting-school",
  "child-hits",
  "digital-bundle",
]);

function isDigitalCartItem(value: unknown): value is DigitalCartItem {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Record<string, unknown>;
  if (typeof c.id !== "string" || !VALID_IDS.has(c.id)) return false;
  if (c.language !== "ar" && c.language !== "en") return false;
  if (typeof c.unitPriceBhd !== "number") return false;
  return true;
}

export function serializeDigitalCart(items: DigitalCartItem[]): string {
  return JSON.stringify(items);
}

export function deserializeDigitalCart(raw: string | null): DigitalCartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDigitalCartItem);
  } catch {
    return [];
  }
}

export function loadDigitalCart(): DigitalCartItem[] {
  if (typeof window === "undefined") return [];
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }
  return deserializeDigitalCart(raw);
}

export function saveDigitalCart(items: DigitalCartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeDigitalCart(items));
  } catch {
    // Swallow write failures (e.g. QuotaExceededError, SecurityError).
  }
}
```

- [ ] **Step 4: Run storage test to verify it passes**

Run: `npx vitest run lib/digital/cart-storage.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Write the failing context test**

```tsx
// lib/digital/cart-context.test.tsx
import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DigitalCartProvider, useDigitalCart } from "./cart-context";

function TestHarness() {
  const { items, addOrReplaceItem, removeItem } = useDigitalCart();
  return (
    <div>
      <div data-testid="count">{items.length}</div>
      <div data-testid="lang">{items[0]?.language ?? ""}</div>
      <button
        onClick={() => addOrReplaceItem({ id: "sleep-bedtime", language: "ar", unitPriceBhd: 2.7 })}
      >
        add-ar
      </button>
      <button
        onClick={() => addOrReplaceItem({ id: "sleep-bedtime", language: "en", unitPriceBhd: 2.7 })}
      >
        add-en
      </button>
      <button onClick={() => removeItem("sleep-bedtime")}>remove</button>
    </div>
  );
}

describe("DigitalCartProvider / useDigitalCart", () => {
  it("adds an item, replaces it in place when the same id is added again, and removes it", () => {
    render(
      <DigitalCartProvider>
        <TestHarness />
      </DigitalCartProvider>
    );

    expect(screen.getByTestId("count").textContent).toBe("0");

    fireEvent.click(screen.getByText("add-ar"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("lang").textContent).toBe("ar");

    fireEvent.click(screen.getByText("add-en"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("lang").textContent).toBe("en");

    fireEvent.click(screen.getByText("remove"));
    expect(screen.getByTestId("count").textContent).toBe("0");
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run lib/digital/cart-context.test.tsx`
Expected: FAIL — `./cart-context` does not exist yet.

- [ ] **Step 7: Implement cart-context.tsx**

```tsx
// lib/digital/cart-context.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { DigitalCartItem, DigitalProductId } from "./types";
import { loadDigitalCart, saveDigitalCart } from "./cart-storage";

interface DigitalCartContextValue {
  items: DigitalCartItem[];
  // True once the load-from-localStorage effect has run — same hydration-guard pattern
  // as the physical cart's CartContextValue, needed for the same reason (React runs
  // child effects before parent effects, so an unguarded mount-time write would be
  // clobbered by this provider's own hydration).
  hydrated: boolean;
  addOrReplaceItem: (item: DigitalCartItem) => void;
  removeItem: (id: DigitalProductId) => void;
  clear: () => void;
}

const DigitalCartContext = createContext<DigitalCartContextValue | null>(null);

export function DigitalCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<DigitalCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadDigitalCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveDigitalCart(items);
  }, [items, hydrated]);

  // Each product can appear at most once in the digital cart, so adding an id that's
  // already present replaces its language choice instead of creating a duplicate line.
  const addOrReplaceItem = (item: DigitalCartItem) =>
    setItems((prev) => [...prev.filter((existing) => existing.id !== item.id), item]);

  const removeItem = (id: DigitalProductId) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  const clear = () => setItems([]);

  return (
    <DigitalCartContext.Provider value={{ items, hydrated, addOrReplaceItem, removeItem, clear }}>
      {children}
    </DigitalCartContext.Provider>
  );
}

export function useDigitalCart(): DigitalCartContextValue {
  const ctx = useContext(DigitalCartContext);
  if (!ctx) throw new Error("useDigitalCart must be used within a DigitalCartProvider");
  return ctx;
}
```

- [ ] **Step 8: Run context test to verify it passes**

Run: `npx vitest run lib/digital/cart-context.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 9: Wire the provider into the root layout**

Modify `app/layout.tsx` — add the import and wrap `CartProvider`'s children with
`DigitalCartProvider` (nesting order doesn't matter functionally, but keeping it innermost
matches "most specific provider closest to children"):

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "../lib/i18n/locale-context";
import { CurrencyProvider } from "../lib/currency-context";
import { CartProvider } from "../lib/cart/cart-context";
import { DigitalCartProvider } from "../lib/digital/cart-context";

export const metadata: Metadata = {
  title: "Peep & beyond | Peep Box",
  description: "بوكس بيب — قصة، لعب، وتعلّم بعيدًا عن الشاشات.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <LocaleProvider>
          <CurrencyProvider>
            <CartProvider>
              <DigitalCartProvider>{children}</DigitalCartProvider>
            </CartProvider>
          </CurrencyProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 10: Run the full test suite to confirm nothing else broke**

Run: `npx vitest run`
Expected: PASS, all existing tests plus the new ones green.

- [ ] **Step 11: Commit**

```bash
git add lib/digital/cart-storage.ts lib/digital/cart-storage.test.ts lib/digital/cart-context.tsx lib/digital/cart-context.test.tsx app/layout.tsx
git commit -m "feat: add digital cart storage and context"
```

---

### Task 4: i18n dictionary keys for digital products

**Files:**
- Modify: `lib/i18n/dictionaries/ar.ts`
- Modify: `lib/i18n/dictionaries/en.ts`
- Test: `lib/i18n/dictionaries.test.ts` (existing file — extend it)

**Interfaces:**
- Produces: new keys on the shared `Dictionary` type (`navDigitalProducts`,
  `digitalPageTitle`, `digitalPageSubtitle`, `digitalTabletNote`, `digitalFilterAll`,
  `digitalBundleLabel`, `digitalLanguageChoiceLabel`, `digitalAddToCart`,
  `digitalCartTitle`, `digitalCartEmpty`, `digitalCheckoutTitle`, `digitalCheckoutSubtitle`,
  `digitalPaymentNote`, `digitalConfirmButton`, `digitalDownloadHeading`,
  `digitalDownloadLinkLabel`) — every later UI task (5, 11, 12, 13) reads `t.<key>` from
  `useLocale()`, so these names are load-bearing for the rest of the plan.

- [ ] **Step 1: Read the existing dictionary test to match its style**

Read `lib/i18n/dictionaries.test.ts` before editing — it likely asserts that `ar` and `en`
have exactly the same keys. Keep that invariant: every key added to `ar.ts` must be added to
`en.ts` too, or that test fails.

- [ ] **Step 2: Add the new keys to `lib/i18n/dictionaries/ar.ts`**

Add these entries inside the existing `ar` object, just before the closing `} as const;`:

```ts
  navDigitalProducts: "المنتجات الرقمية",
  digitalPageTitle: "المنتجات الرقمية",
  digitalPageSubtitle:
    "كتيبات إرشادية للأهل بصيغة PDF، متوفرة بالعربي والإنجليزي — أفضل تجربة قراءة على آيباد أو تابلت.",
  digitalTabletNote: "يُفضّل القراءة على آيباد أو تابلت للحصول على أفضل تجربة.",
  digitalFilterAll: "الكل",
  digitalBundleLabel: "الباقة الكاملة (السبعة مواضيع)",
  digitalLanguageChoiceLabel: "لغة الكتيب",
  digitalAddToCart: "أضف إلى السلة",
  digitalCartTitle: "سلتك من المنتجات الرقمية",
  digitalCartEmpty: "سلتك فارغة",
  digitalCheckoutTitle: "بيانات الطلب",
  digitalCheckoutSubtitle: "منتج رقمي — التسليم فوري بعد تأكيد الدفع.",
  digitalPaymentNote: "الدفع بالبطاقة عبر أوريم (Benefit, Visa, Mastercard).",
  digitalConfirmButton: "الدفع وتأكيد الطلب",
  digitalDownloadHeading: "روابط التحميل",
  digitalDownloadLinkLabel: "تحميل الملف",
```

- [ ] **Step 3: Add the matching keys to `lib/i18n/dictionaries/en.ts`**

Add these entries inside the existing `en` object, just before the closing `};`:

```ts
  navDigitalProducts: "Digital Products",
  digitalPageTitle: "Digital Products",
  digitalPageSubtitle:
    "Parenting guide booklets as PDFs, available in Arabic and English — best read on an iPad or tablet.",
  digitalTabletNote: "For the best experience, we recommend reading on an iPad or tablet.",
  digitalFilterAll: "All",
  digitalBundleLabel: "The Complete Bundle (all 7 topics)",
  digitalLanguageChoiceLabel: "Booklet language",
  digitalAddToCart: "Add to cart",
  digitalCartTitle: "Your digital products cart",
  digitalCartEmpty: "Your cart is empty",
  digitalCheckoutTitle: "Order details",
  digitalCheckoutSubtitle: "Digital product — delivered instantly after payment is confirmed.",
  digitalPaymentNote: "Card payment via Oreem (Benefit, Visa, Mastercard).",
  digitalConfirmButton: "Pay and confirm order",
  digitalDownloadHeading: "Download links",
  digitalDownloadLinkLabel: "Download file",
```

- [ ] **Step 4: Run the dictionary test**

Run: `npx vitest run lib/i18n/dictionaries.test.ts`
Expected: PASS — `ar` and `en` still have identical key sets.

- [ ] **Step 5: Run the full test suite and typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS with no type errors.

- [ ] **Step 6: Commit**

```bash
git add lib/i18n/dictionaries/ar.ts lib/i18n/dictionaries/en.ts
git commit -m "feat: add i18n copy for digital products"
```

---

### Task 5: Copy source PDFs and build the watermarking helper

**Files:**
- Create: `content/digital-products/*.pdf` (14 files, copied and renamed)
- Create: `lib/digital/watermark-pdf.ts`
- Test: `lib/digital/watermark-pdf.test.ts`
- Modify: `package.json` (add `pdf-lib` dependency)

**Interfaces:**
- Produces: `watermarkPdf(sourceBytes: Buffer, watermarkText: string): Promise<Buffer>` — the
  download route (Task 10) depends on this exact signature. Also produces the 14 files on disk
  at `content/digital-products/<id>-<language>.pdf`, matching `digitalFileName()` from Task 1
  exactly — the download route resolves file paths with that function.

- [ ] **Step 1: Install pdf-lib**

Run: `npm install pdf-lib`

Expected: `package.json`'s `dependencies` gains a `"pdf-lib": "^1.x.x"` entry (pure JS, no
native bindings — safe for Vercel's serverless functions, same constraint that ruled out
native deps elsewhere in this project).

- [ ] **Step 2: Create the destination directory and copy the source PDFs**

The 7 topics' source files live at
`C:\Users\endfl\OneDrive\project\digital files\Peep-and-Beyond_<Topic-Slug>_<Arabic|English>.pdf`.
Copy and rename each into the repo at `content/digital-products/<id>-<language>.pdf`, matching
the `DigitalTopicId` values from Task 1 exactly:

```bash
mkdir -p content/digital-products
SRC="/c/Users/endfl/OneDrive/project/digital files"
DST="content/digital-products"
cp "$SRC/Peep-and-Beyond_Picky-Eating_Arabic.pdf" "$DST/picky-eating-ar.pdf"
cp "$SRC/Peep-and-Beyond_Picky-Eating_English.pdf" "$DST/picky-eating-en.pdf"
cp "$SRC/Peep-and-Beyond_Potty-Training_Arabic.pdf" "$DST/potty-training-ar.pdf"
cp "$SRC/Peep-and-Beyond_Potty-Training_English.pdf" "$DST/potty-training-en.pdf"
cp "$SRC/Peep-and-Beyond_Screens-and-Big-Feelings_Arabic.pdf" "$DST/screens-big-feelings-ar.pdf"
cp "$SRC/Peep-and-Beyond_Screens-and-Big-Feelings_English.pdf" "$DST/screens-big-feelings-en.pdf"
cp "$SRC/Peep-and-Beyond_Sharing-and-Sibling-Conflict_Arabic.pdf" "$DST/sharing-sibling-conflict-ar.pdf"
cp "$SRC/Peep-and-Beyond_Sharing-and-Sibling-Conflict_English.pdf" "$DST/sharing-sibling-conflict-en.pdf"
cp "$SRC/Peep-and-Beyond_Sleep-and-Bedtime_Arabic.pdf" "$DST/sleep-bedtime-ar.pdf"
cp "$SRC/Peep-and-Beyond_Sleep-and-Bedtime_English.pdf" "$DST/sleep-bedtime-en.pdf"
cp "$SRC/Peep-and-Beyond_Starting-School-and-Separation_Arabic.pdf" "$DST/starting-school-ar.pdf"
cp "$SRC/Peep-and-Beyond_Starting-School-and-Separation_English.pdf" "$DST/starting-school-en.pdf"
cp "$SRC/Peep-and-Beyond_When-Your-Child-Hits_Arabic.pdf" "$DST/child-hits-ar.pdf"
cp "$SRC/Peep-and-Beyond_When-Your-Child-Hits_English.pdf" "$DST/child-hits-en.pdf"
ls -la "$DST"
```

Expected: 14 files listed, ~1.4-1.6MB each. **Do not add `content/` to `.gitignore`** — these
files are the paid product itself and must be committed so Vercel has them at build/runtime;
they are not secrets, and the download route (not Next's static file server) is what keeps
them from being publicly reachable.

- [ ] **Step 3: Write the failing watermark test**

```ts
// lib/digital/watermark-pdf.test.ts
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { watermarkPdf } from "./watermark-pdf";

async function makeTestPdf(pageCount: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([200, 200]);
  }
  return Buffer.from(await doc.save());
}

describe("watermarkPdf", () => {
  it("returns a valid PDF with the same page count as the source", async () => {
    const source = await makeTestPdf(3);
    const result = await watermarkPdf(source, "Peep & beyond - Order test123");
    const resultDoc = await PDFDocument.load(result);
    expect(resultDoc.getPageCount()).toBe(3);
  });

  it("produces different bytes than the unwatermarked source", async () => {
    const source = await makeTestPdf(1);
    const result = await watermarkPdf(source, "Peep & beyond - Order test123");
    expect(Buffer.compare(source, result)).not.toBe(0);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run lib/digital/watermark-pdf.test.ts`
Expected: FAIL — `./watermark-pdf` does not exist yet.

- [ ] **Step 5: Implement the watermarking helper**

```ts
// lib/digital/watermark-pdf.ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Watermark text must stay ASCII-only: pdf-lib's 14 standard fonts (WinAnsi encoding)
// have no Arabic glyphs, and embedding a custom Arabic font is out of scope for this
// lightweight, traceability-only stamp (site name + order reference, not DRM).
export async function watermarkPdf(sourceBytes: Buffer, watermarkText: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(sourceBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    page.drawText(watermarkText, {
      x: 12,
      y: 12,
      size: 8,
      font,
      color: rgb(0.55, 0.55, 0.55),
      opacity: 0.65,
    });
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run lib/digital/watermark-pdf.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json content/digital-products lib/digital/watermark-pdf.ts lib/digital/watermark-pdf.test.ts
git commit -m "feat: add source PDFs and watermarking helper"
```

---

### Task 6: Digital order payload encode/decode

**Files:**
- Create: `lib/digital/order-payload.ts`
- Test: `lib/digital/order-payload.test.ts`

**Interfaces:**
- Consumes: `DigitalCartItem`, `DigitalBuyerDetails` from `lib/digital/types.ts` (Task 1);
  `DIGITAL_BUNDLE` from `lib/digital/catalog.ts` (Task 1).
- Produces: `DigitalPendingOrderPayload` (`{ txnRef, buyer, items, totalBhd }`),
  `encodeDigitalOrderPayload(payload)`, `decodeDigitalOrderPayload(encoded)`,
  `wasDigitalItemPurchased(payload, topicId, language)` — the Oreem route (Task 9) encodes,
  the confirmation page (Task 13) decodes, and the download route (Task 10) both decodes and
  calls `wasDigitalItemPurchased` to check entitlement.

- [ ] **Step 1: Write the failing test**

```ts
// lib/digital/order-payload.test.ts
import { describe, expect, it } from "vitest";
import {
  encodeDigitalOrderPayload,
  decodeDigitalOrderPayload,
  type DigitalPendingOrderPayload,
} from "./order-payload";

const payload: DigitalPendingOrderPayload = {
  txnRef: "peepdigi_abc123",
  buyer: {
    fullName: "سارة أحمد",
    email: "sara@example.com",
    country: "BH",
    marketingOptIn: false,
  },
  items: [
    { id: "sleep-bedtime", language: "ar", unitPriceBhd: 2.7 },
    { id: "potty-training", language: "en", unitPriceBhd: 2.7 },
  ],
  totalBhd: 5.4,
};

describe("encodeDigitalOrderPayload / decodeDigitalOrderPayload", () => {
  it("round-trips a payload including Arabic text through base64url", () => {
    const encoded = encodeDigitalOrderPayload(payload);
    expect(decodeDigitalOrderPayload(encoded)).toEqual(payload);
  });

  it("produces a URL-safe string (no +, /, or = characters)", () => {
    expect(encodeDigitalOrderPayload(payload)).not.toMatch(/[+/=]/);
  });

  it("returns null for garbage input instead of throwing", () => {
    expect(decodeDigitalOrderPayload("not-valid-base64-json")).toBeNull();
  });

  it("returns null when txnRef, buyer, or items is missing or malformed", () => {
    const encodeRaw = (value: unknown) =>
      Buffer.from(JSON.stringify(value), "utf-8").toString("base64url");

    expect(decodeDigitalOrderPayload(encodeRaw({ ...payload, txnRef: undefined }))).toBeNull();
    expect(decodeDigitalOrderPayload(encodeRaw({ ...payload, buyer: undefined }))).toBeNull();
    expect(decodeDigitalOrderPayload(encodeRaw({ ...payload, items: "oops" }))).toBeNull();
  });

  it("returns null when totalBhd is not a finite number", () => {
    const encodeRaw = (value: unknown) =>
      Buffer.from(JSON.stringify(value), "utf-8").toString("base64url");

    expect(decodeDigitalOrderPayload(encodeRaw({ ...payload, totalBhd: "5.4" }))).toBeNull();
    expect(decodeDigitalOrderPayload(encodeRaw({ ...payload, totalBhd: null }))).toBeNull();
  });

  it("returns null when any item has an unknown id, bad language, or non-numeric price", () => {
    const withItem = (item: unknown) =>
      Buffer.from(JSON.stringify({ ...payload, items: [item] }), "utf-8").toString("base64url");

    expect(decodeDigitalOrderPayload(withItem({ id: "not-real", language: "ar", unitPriceBhd: 2.7 }))).toBeNull();
    expect(decodeDigitalOrderPayload(withItem({ id: "sleep-bedtime", language: "fr", unitPriceBhd: 2.7 }))).toBeNull();
    expect(decodeDigitalOrderPayload(withItem({ id: "sleep-bedtime", language: "ar", unitPriceBhd: "2.7" }))).toBeNull();

    // A well-formed item still decodes, so the guard is not simply rejecting everything.
    expect(decodeDigitalOrderPayload(withItem(payload.items[0]))).not.toBeNull();
  });
});

describe("wasDigitalItemPurchased", () => {
  it("returns true for a topic/language bought as its own line", () => {
    expect(wasDigitalItemPurchased(payload, "sleep-bedtime", "ar")).toBe(true);
  });

  it("returns false for a language that wasn't purchased for that topic", () => {
    expect(wasDigitalItemPurchased(payload, "sleep-bedtime", "en")).toBe(false);
  });

  it("returns false for a topic not present in the order at all", () => {
    expect(wasDigitalItemPurchased(payload, "child-hits", "ar")).toBe(false);
  });

  it("returns true for any of the 7 topics when a matching-language bundle was bought", () => {
    const bundlePayload: DigitalPendingOrderPayload = {
      ...payload,
      items: [{ id: "digital-bundle", language: "en", unitPriceBhd: 12.0 }],
    };
    expect(wasDigitalItemPurchased(bundlePayload, "child-hits", "en")).toBe(true);
    expect(wasDigitalItemPurchased(bundlePayload, "child-hits", "ar")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/digital/order-payload.test.ts`
Expected: FAIL — `./order-payload` does not exist yet.

- [ ] **Step 3: Implement**

```ts
// lib/digital/order-payload.ts
import type { DigitalBuyerDetails, DigitalCartItem, DigitalLanguage, DigitalTopicId } from "./types";
import { DIGITAL_BUNDLE } from "./catalog";

export interface DigitalPendingOrderPayload {
  txnRef: string;
  buyer: DigitalBuyerDetails;
  items: DigitalCartItem[];
  totalBhd: number;
}

const VALID_IDS = new Set([
  "picky-eating",
  "potty-training",
  "screens-big-feelings",
  "sharing-sibling-conflict",
  "sleep-bedtime",
  "starting-school",
  "child-hits",
  "digital-bundle",
]);

export function encodeDigitalOrderPayload(payload: DigitalPendingOrderPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
}

export function decodeDigitalOrderPayload(encoded: string): DigitalPendingOrderPayload | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    const parsed = JSON.parse(json);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.txnRef !== "string" ||
      !parsed.buyer ||
      typeof parsed.buyer !== "object" ||
      !Array.isArray(parsed.items)
    ) {
      return null;
    }

    // This payload arrives back via a URL param the customer's browser round-trips, so a
    // valid txnRef guarantees nothing about totalBhd — the confirmation and download
    // routes both format/compare it numerically after a real payment has been taken.
    if (!Number.isFinite(parsed.totalBhd)) {
      return null;
    }

    // Every item drives which files get delivered, so an unrecognised id or language
    // must never reach the download route.
    for (const item of parsed.items) {
      if (typeof item?.id !== "string" || !VALID_IDS.has(item.id)) return null;
      if (item?.language !== "ar" && item?.language !== "en") return null;
      if (typeof item?.unitPriceBhd !== "number") return null;
    }

    return parsed as DigitalPendingOrderPayload;
  } catch {
    return null;
  }
}

// A topic/language is authorized for download if it was bought as its own line, or if a
// bundle in that same language was bought (a bundle covers all 7 topics in one language).
// Pure and independent of any network call, so the download route's entitlement check
// (Task 10) can be unit tested without mocking fetch/NextRequest.
export function wasDigitalItemPurchased(
  payload: DigitalPendingOrderPayload,
  topicId: DigitalTopicId,
  language: DigitalLanguage
): boolean {
  return payload.items.some((item) => {
    if (item.language !== language) return false;
    if (item.id === topicId) return true;
    if (item.id === "digital-bundle") {
      return (DIGITAL_BUNDLE.includes as DigitalTopicId[]).includes(topicId);
    }
    return false;
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/digital/order-payload.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/digital/order-payload.ts lib/digital/order-payload.test.ts
git commit -m "feat: add digital order payload encode/decode"
```

---

### Task 7: Digital order notification email content

**Files:**
- Create: `lib/digital/order-notification-email.ts`
- Test: `lib/digital/order-notification-email.test.ts`

**Interfaces:**
- Consumes: `DigitalPendingOrderPayload`-shaped data (buyer + items + totalBhd), plus a
  `txnRef` string.
- Produces: `DigitalOrderEmailData` type, `buildDigitalOrderEmailSubject(data)`,
  `buildDigitalOrderEmailHtml(data)` — the resend wrapper (Task 8, folded below) and the
  confirmation page (Task 13) both use these.

- [ ] **Step 1: Write the failing test**

```ts
// lib/digital/order-notification-email.test.ts
import { describe, expect, it } from "vitest";
import {
  buildDigitalOrderEmailSubject,
  buildDigitalOrderEmailHtml,
  type DigitalOrderEmailData,
} from "./order-notification-email";

const data: DigitalOrderEmailData = {
  buyer: { fullName: "سارة أحمد", email: "sara@example.com", country: "BH", marketingOptIn: false },
  items: [
    { id: "sleep-bedtime", language: "ar", unitPriceBhd: 2.7 },
    { id: "potty-training", language: "en", unitPriceBhd: 2.7 },
  ],
  totalBhd: 5.4,
  txnRef: "peepdigi_abc123",
};

describe("buildDigitalOrderEmailSubject", () => {
  it("includes the buyer's name", () => {
    expect(buildDigitalOrderEmailSubject(data)).toContain("سارة أحمد");
  });
});

describe("buildDigitalOrderEmailHtml", () => {
  it("lists each purchased booklet by its Arabic-catalog name and chosen language", () => {
    const html = buildDigitalOrderEmailHtml(data);
    expect(html).toContain("النوم ووقت الفراش");
    expect(html).toContain("تدريب الحمام");
    expect(html).toContain(data.totalBhd.toFixed(3));
  });

  it("escapes HTML in the buyer's name to prevent injection", () => {
    const malicious: DigitalOrderEmailData = {
      ...data,
      buyer: { ...data.buyer, fullName: "<script>alert(1)</script>" },
    };
    const html = buildDigitalOrderEmailHtml(malicious);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/digital/order-notification-email.test.ts`
Expected: FAIL — `./order-notification-email` does not exist yet.

- [ ] **Step 3: Implement**

```ts
// lib/digital/order-notification-email.ts
import type { DigitalBuyerDetails, DigitalCartItem } from "./types";
import { DIGITAL_PRODUCTS, DIGITAL_BUNDLE } from "./catalog";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface DigitalOrderEmailData {
  buyer: DigitalBuyerDetails;
  items: DigitalCartItem[];
  totalBhd: number;
  txnRef: string;
}

export function buildDigitalOrderEmailSubject(data: DigitalOrderEmailData): string {
  return `طلب منتج رقمي جديد من ${escapeHtml(data.buyer.fullName)}`;
}

function describeItem(item: DigitalCartItem): string {
  const nameAr =
    item.id === "digital-bundle"
      ? DIGITAL_BUNDLE.nameAr
      : DIGITAL_PRODUCTS.find((p) => p.id === item.id)?.nameAr ?? item.id;
  const langLabel = item.language === "ar" ? "العربية" : "English";
  return `${nameAr} — ${langLabel}`;
}

export function buildDigitalOrderEmailHtml(data: DigitalOrderEmailData): string {
  const itemsHtml = data.items.map((item) => `<li>${describeItem(item)}</li>`).join("");

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif;">
      <h2>طلب منتج رقمي جديد</h2>
      <p><strong>الاسم:</strong> ${escapeHtml(data.buyer.fullName)}</p>
      <p><strong>الإيميل:</strong> ${escapeHtml(data.buyer.email)}</p>
      <p><strong>الدولة:</strong> ${escapeHtml(data.buyer.country)}</p>
      <p><strong>طريقة الدفع:</strong> أوريم — مرجع: ${escapeHtml(data.txnRef)}</p>
      <h3>المنتجات</h3>
      <ul>${itemsHtml}</ul>
      <p><strong>الإجمالي:</strong> ${data.totalBhd.toFixed(3)} د.ب</p>
    </div>
  `;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/digital/order-notification-email.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/digital/order-notification-email.ts lib/digital/order-notification-email.test.ts
git commit -m "feat: add digital order notification email content"
```

---

### Task 8: Digital Resend email sending wrapper

**Files:**
- Create: `lib/digital/resend-client.ts`

**Interfaces:**
- Consumes: `DigitalOrderEmailData` from `lib/digital/order-notification-email.ts` (Task 7).
- Produces: `sendDigitalOrderNotificationEmail(data)`, `sendDigitalCustomerConfirmationEmail(data)`
  — the confirmation page (Task 13) calls both. Reuses the existing `addToMarketingAudience`
  from `lib/email/resend-client.ts` directly (it already takes a plain email string, no
  physical-box-specific typing), so no digital-specific version is needed for that one.

This task has no new pure logic worth a unit test (it's a thin wrapper around the `resend`
SDK, same as the existing `lib/email/resend-client.ts`, which also has no test file) — write
the implementation directly and verify it via the manual end-to-end check in Task 14.

- [ ] **Step 1: Implement**

```ts
// lib/digital/resend-client.ts
import { Resend } from "resend";
import {
  buildDigitalOrderEmailHtml,
  buildDigitalOrderEmailSubject,
  type DigitalOrderEmailData,
} from "./order-notification-email";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "orders@peepandbeyond.com";
}

export async function sendDigitalOrderNotificationEmail(data: DigitalOrderEmailData): Promise<void> {
  const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL;
  if (!ownerEmail) throw new Error("OWNER_NOTIFICATION_EMAIL is not set");

  const resend = getResendClient();
  await resend.emails.send({
    from: getFromAddress(),
    to: ownerEmail,
    subject: buildDigitalOrderEmailSubject(data),
    html: buildDigitalOrderEmailHtml(data),
  });
}

export async function sendDigitalCustomerConfirmationEmail(data: DigitalOrderEmailData): Promise<void> {
  const resend = getResendClient();
  await resend.emails.send({
    from: getFromAddress(),
    to: data.buyer.email,
    subject: "تم تأكيد طلبك من Peep & beyond",
    html: buildDigitalOrderEmailHtml(data),
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS with no type errors.

- [ ] **Step 3: Commit**

```bash
git add lib/digital/resend-client.ts
git commit -m "feat: add digital order email sending"
```

---

### Task 9: Digital Oreem order API route

**Files:**
- Create: `app/api/orders/digital-oreem/route.ts`

**Interfaces:**
- Consumes: `DigitalBuyerDetails`, `DigitalCartItem` (Task 1); `getDigitalProductPrice` (Task
  1); `calculateDigitalOrderTotal` (Task 2); `encodeDigitalOrderPayload` (Task 6);
  `createHostedPayment` from the existing `lib/payments/oreem-client.ts` (unchanged, reused
  as-is).
- Produces: `POST /api/orders/digital-oreem` accepting `{ buyer, items }` and returning
  `{ paymentUrl }` on success — the digital checkout page (Task 12) calls this exact route
  and reads `paymentUrl` the same way the physical checkout page does today.

No new pure logic here beyond what Tasks 1, 2, and 6 already test — this route is
integration/wiring, verified by Task 14's manual walkthrough (same as the existing
`app/api/orders/oreem/route.ts`, which also has no dedicated test file).

- [ ] **Step 1: Implement**

```ts
// app/api/orders/digital-oreem/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { calculateDigitalOrderTotal } from "../../../../lib/digital/order-total";
import { encodeDigitalOrderPayload } from "../../../../lib/digital/order-payload";
import { getDigitalProductPrice } from "../../../../lib/digital/catalog";
import { createHostedPayment } from "../../../../lib/payments/oreem-client";
import type { DigitalBuyerDetails, DigitalCartItem, DigitalProductId } from "../../../../lib/digital/types";

export const runtime = "nodejs";

const VALID_IDS = new Set<DigitalProductId>([
  "picky-eating",
  "potty-training",
  "screens-big-feelings",
  "sharing-sibling-conflict",
  "sleep-bedtime",
  "starting-school",
  "child-hits",
  "digital-bundle",
]);

// Never silently fall back to localhost in production — same reasoning as the physical
// box's app/api/orders/oreem/route.ts: this is where Oreem sends a paying customer back
// to, so a localhost redirect on a live payment means money taken with no order record.
function getSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_SITE_URL is not set");
    }
    return "http://localhost:3000";
  }
  return configured.replace(/\/+$/, "");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const buyerCandidate = (body as Record<string, unknown> | null)?.buyer;
  const itemsCandidate = (body as Record<string, unknown> | null)?.items;

  if (!buyerCandidate || typeof buyerCandidate !== "object") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (!Array.isArray(itemsCandidate) || itemsCandidate.length === 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }

  const buyer = buyerCandidate as DigitalBuyerDetails;
  if (
    typeof buyer.fullName !== "string" ||
    buyer.fullName.trim() === "" ||
    typeof buyer.email !== "string" ||
    buyer.email.trim() === "" ||
    typeof buyer.country !== "string" ||
    buyer.country.trim() === ""
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const rawItems = itemsCandidate as unknown[];
  const items: DigitalCartItem[] = [];
  for (const raw of rawItems) {
    const id = (raw as Record<string, unknown> | null)?.id;
    const language = (raw as Record<string, unknown> | null)?.language;
    if (typeof id !== "string" || !VALID_IDS.has(id as DigitalProductId)) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    if (language !== "ar" && language !== "en") {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    // Never trust a client-supplied price — resolve it server-side from the catalog,
    // same pattern as PEEP_BOX_PRODUCT.priceBhd in the physical Oreem route.
    const unitPriceBhd = getDigitalProductPrice(id as DigitalProductId);
    if (unitPriceBhd === null) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    items.push({ id: id as DigitalProductId, language, unitPriceBhd });
  }

  const { totalBhd } = calculateDigitalOrderTotal(items);
  const txnRef = `peepdigi_${randomUUID()}`;
  const encodedOrder = encodeDigitalOrderPayload({ txnRef, buyer, items, totalBhd });

  try {
    const redirectUrl = `${getSiteUrl()}/digital/confirmation?order=${encodedOrder}`;
    const { paymentUrl } = await createHostedPayment({
      txnRef,
      amountBhd: totalBhd,
      customerName: buyer.fullName,
      customerEmail: buyer.email,
      customerPhone: "",
      redirectUrl,
    });
    return NextResponse.json({ paymentUrl });
  } catch (error) {
    console.error("Failed to start Oreem hosted payment for digital order", error);
    return NextResponse.json({ error: "oreem_unavailable" }, { status: 502 });
  }
}
```

Note: `createHostedPayment` requires a `customerPhone` field (Oreem's API expects it), but
the digital buyer form deliberately has no phone field per the spec — passing an empty string
is fine here since Oreem's hosted payment page still collects/confirms payment details
directly with the customer.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS with no type errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/orders/digital-oreem/route.ts
git commit -m "feat: add digital Oreem order API route"
```

---

### Task 10: Digital download API route

**Files:**
- Create: `app/api/digital-download/route.ts`

**Interfaces:**
- Consumes: `decodeDigitalOrderPayload`, `wasDigitalItemPurchased` (Task 6), `verifyTransaction`
  from the existing `lib/payments/oreem-client.ts` (unchanged, reused as-is), `watermarkPdf`
  (Task 5), `digitalFileName` (Task 1).
- Produces: `GET /api/digital-download?order=<encoded>&product=<id>&language=<ar|en>`
  returning the watermarked PDF as `application/pdf` on success — the confirmation page
  (Task 13) builds links to this exact route/query-param shape.

- [ ] **Step 1: Implement**

```ts
// app/api/digital-download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { decodeDigitalOrderPayload, wasDigitalItemPurchased } from "../../../lib/digital/order-payload";
import { verifyTransaction } from "../../../lib/payments/oreem-client";
import { watermarkPdf } from "../../../lib/digital/watermark-pdf";
import { digitalFileName } from "../../../lib/digital/catalog";
import type { DigitalLanguage, DigitalTopicId } from "../../../lib/digital/types";

export const runtime = "nodejs";

const VALID_TOPIC_IDS = new Set<DigitalTopicId>([
  "picky-eating",
  "potty-training",
  "screens-big-feelings",
  "sharing-sibling-conflict",
  "sleep-bedtime",
  "starting-school",
  "child-hits",
]);

export async function GET(request: NextRequest) {
  const encodedOrder = request.nextUrl.searchParams.get("order");
  const product = request.nextUrl.searchParams.get("product");
  const language = request.nextUrl.searchParams.get("language");

  if (
    !encodedOrder ||
    !product ||
    !VALID_TOPIC_IDS.has(product as DigitalTopicId) ||
    (language !== "ar" && language !== "en")
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const payload = decodeDigitalOrderPayload(encodedOrder);
  if (!payload) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // Never trust the confirmation page or the URL alone — independently re-verify the
  // payment before serving anything, same fail-closed pattern as the physical box's
  // confirmation page.
  let verification;
  try {
    verification = await verifyTransaction(payload.txnRef);
  } catch (error) {
    console.error("Failed to verify Oreem transaction for digital download", error);
    return NextResponse.json({ error: "verification_failed" }, { status: 502 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "payment_not_verified" }, { status: 403 });
  }

  if (
    verification.amountBhd !== undefined &&
    !(
      Number.isFinite(payload.totalBhd) &&
      Math.abs(verification.amountBhd - payload.totalBhd) <= 0.001
    )
  ) {
    console.error("Oreem verified amount does not match digital order payload total", {
      txnRef: payload.txnRef,
      verifiedAmount: verification.amountBhd,
      payloadTotal: payload.totalBhd,
    });
    return NextResponse.json({ error: "amount_mismatch" }, { status: 403 });
  }

  // Confirm the requested product/language was actually part of what this txnRef paid
  // for — either as its own line, or covered by a bundle purchase in the same language.
  const topicId = product as DigitalTopicId;
  if (!wasDigitalItemPurchased(payload, topicId, language as DigitalLanguage)) {
    return NextResponse.json({ error: "not_purchased" }, { status: 403 });
  }

  const fileName = digitalFileName(topicId, language as DigitalLanguage);
  const filePath = path.join(process.cwd(), "content", "digital-products", fileName);

  let sourceBytes: Buffer;
  try {
    sourceBytes = await readFile(filePath);
  } catch (error) {
    console.error("Failed to read digital product source file", { fileName, error });
    return NextResponse.json({ error: "file_unavailable" }, { status: 500 });
  }

  let watermarked: Buffer;
  try {
    watermarked = await watermarkPdf(sourceBytes, `Peep & beyond - Order ${payload.txnRef}`);
  } catch (error) {
    console.error("Failed to watermark digital product file", { fileName, error });
    return NextResponse.json({ error: "watermark_failed" }, { status: 500 });
  }

  return new NextResponse(watermarked, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS with no type errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/digital-download/route.ts
git commit -m "feat: add digital download route with re-verification and watermarking"
```

---

### Task 11: Header nav link and digital products browse page

**Files:**
- Modify: `components/header.tsx`
- Create: `components/digital/product-card.tsx`
- Create: `components/digital/bundle-card.tsx`
- Create: `app/digital/page.tsx`

**Interfaces:**
- Consumes: `DIGITAL_PRODUCTS`, `DIGITAL_BUNDLE` (Task 1); `useDigitalCart` (Task 3);
  `useLocale`, `useCurrency`, `formatMoney` (existing, unchanged).
- Produces: the `/digital` route; `ProductCard` and `BundleCard` components taking an
  `onAdd` callback — reused as-is by nothing else in this plan, but kept in their own files
  per the file-structure principle (one card = one file, easy to hold in context).

- [ ] **Step 1: Add the nav link**

Modify `components/header.tsx` — add a second `<a>` inside the existing `<nav>`, right after
the current `#inside` link:

```tsx
// components/header.tsx
      <nav className="hidden gap-6 md:flex">
        <a href="#inside">{t.navGifts}</a>
        <a href="/digital">{t.navDigitalProducts}</a>
      </nav>
```

Also add the same link to a mobile-visible spot, since the existing nav is `hidden md:flex`
(desktop-only) and there's no mobile menu yet — for now, render a second, always-visible row
directly under the header on small screens so the digital-products link isn't unreachable on
phones:

```tsx
// components/header.tsx — replace the whole component body with this version
"use client";

import { useLocale } from "../lib/i18n/locale-context";
import { useCurrency } from "../lib/currency-context";
import { useCart } from "../lib/cart/cart-context";

export function Header({ onCartClick }: { onCartClick: () => void }) {
  const { locale, setLocale, t } = useLocale();
  const { currency, setCurrency } = useCurrency();
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="border-b border-brown/10">
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-xl font-bold">Peep &amp; beyond</span>
        <nav className="hidden gap-6 md:flex">
          <a href="#inside">{t.navGifts}</a>
          <a href="/digital">{t.navDigitalProducts}</a>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            aria-label="toggle language"
          >
            {locale === "ar" ? "EN" : "العربية"}
          </button>
          <button
            type="button"
            onClick={() => setCurrency(currency === "BHD" ? "USD" : "BHD")}
            aria-label="toggle currency"
          >
            {currency === "BHD" ? "USD" : "BHD"}
          </button>
          <button type="button" onClick={onCartClick} aria-label="open cart">
            🛍️ {itemCount > 0 ? itemCount : ""}
          </button>
        </div>
      </div>
      <nav className="flex gap-6 border-t border-brown/10 px-6 py-2 md:hidden">
        <a href="#inside">{t.navGifts}</a>
        <a href="/digital">{t.navDigitalProducts}</a>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Create the product card component**

```tsx
// components/digital/product-card.tsx
"use client";

import { useState } from "react";
import type { DigitalProduct } from "../../lib/digital/catalog";
import type { DigitalLanguage } from "../../lib/digital/types";
import { useLocale } from "../../lib/i18n/locale-context";
import { useCurrency } from "../../lib/currency-context";
import { formatMoney } from "../../lib/currency";

export function ProductCard({
  product,
  onAdd,
}: {
  product: DigitalProduct;
  onAdd: (language: DigitalLanguage) => void;
}) {
  const { locale, t } = useLocale();
  const { currency } = useCurrency();
  const [language, setLanguage] = useState<DigitalLanguage>(locale);

  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const description = locale === "ar" ? product.descriptionAr : product.descriptionEn;

  return (
    <article className="flex flex-col rounded-xl border border-brown/10 bg-white/60 p-5">
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-2 flex-1 text-sm text-brown/70">{description}</p>
      <p className="mt-4 font-semibold">{formatMoney(product.priceBhd, currency)}</p>

      <fieldset className="mt-3">
        <legend className="text-sm text-brown/60">{t.digitalLanguageChoiceLabel}</legend>
        <div className="mt-1 flex gap-2">
          {(["ar", "en"] as const).map((lang) => (
            <button
              type="button"
              key={lang}
              aria-pressed={language === lang}
              onClick={() => setLanguage(lang)}
              className={`rounded-full border px-3 py-1 text-sm ${
                language === lang ? "border-leaf bg-leaf text-white" : "border-brown/20 bg-white text-brown"
              }`}
            >
              {lang === "ar" ? t.languageArabic : t.languageEnglish}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={() => onAdd(language)}
        className="mt-4 rounded-full bg-leaf py-2 text-white"
      >
        {t.digitalAddToCart}
      </button>
    </article>
  );
}
```

- [ ] **Step 3: Create the bundle card component**

```tsx
// components/digital/bundle-card.tsx
"use client";

import { useState } from "react";
import type { DigitalLanguage } from "../../lib/digital/types";
import { DIGITAL_BUNDLE } from "../../lib/digital/catalog";
import { useLocale } from "../../lib/i18n/locale-context";
import { useCurrency } from "../../lib/currency-context";
import { formatMoney } from "../../lib/currency";

export function BundleCard({ onAdd }: { onAdd: (language: DigitalLanguage) => void }) {
  const { locale, t } = useLocale();
  const { currency } = useCurrency();
  const [language, setLanguage] = useState<DigitalLanguage>(locale);

  const name = locale === "ar" ? DIGITAL_BUNDLE.nameAr : DIGITAL_BUNDLE.nameEn;

  return (
    <article className="rounded-xl border-2 border-leaf bg-leaf/5 p-6">
      <h3 className="text-xl font-bold">{name}</h3>
      <p className="mt-3 text-2xl font-semibold">{formatMoney(DIGITAL_BUNDLE.priceBhd, currency)}</p>

      <fieldset className="mt-4">
        <legend className="text-sm text-brown/60">{t.digitalLanguageChoiceLabel}</legend>
        <div className="mt-1 flex gap-2">
          {(["ar", "en"] as const).map((lang) => (
            <button
              type="button"
              key={lang}
              aria-pressed={language === lang}
              onClick={() => setLanguage(lang)}
              className={`rounded-full border px-3 py-1 text-sm ${
                language === lang ? "border-leaf bg-leaf text-white" : "border-brown/20 bg-white text-brown"
              }`}
            >
              {lang === "ar" ? t.languageArabic : t.languageEnglish}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={() => onAdd(language)}
        className="mt-4 w-full rounded-full bg-leaf py-3 text-white"
      >
        {t.digitalAddToCart}
      </button>
    </article>
  );
}
```

- [ ] **Step 4: Create the browse page**

```tsx
// app/digital/page.tsx
"use client";

import { useState } from "react";
import { Header } from "../../components/header";
import { Footer } from "../../components/footer";
import { CartDrawer } from "../../components/cart-drawer";
import { ProductCard } from "../../components/digital/product-card";
import { BundleCard } from "../../components/digital/bundle-card";
import { DIGITAL_PRODUCTS, DIGITAL_BUNDLE } from "../../lib/digital/catalog";
import { useDigitalCart } from "../../lib/digital/cart-context";
import { useLocale } from "../../lib/i18n/locale-context";
import { useCurrency } from "../../lib/currency-context";
import { formatMoney } from "../../lib/currency";
import type { DigitalLanguage, DigitalTopicId } from "../../lib/digital/types";

export default function DigitalProductsPage() {
  const { locale, t } = useLocale();
  const { currency } = useCurrency();
  const { items, addOrReplaceItem } = useDigitalCart();
  const [filter, setFilter] = useState<DigitalTopicId | "all">("all");
  const [showCart, setShowCart] = useState(false);

  const visibleProducts =
    filter === "all" ? DIGITAL_PRODUCTS : DIGITAL_PRODUCTS.filter((p) => p.id === filter);

  const subtotalBhd = items.reduce((sum, item) => sum + item.unitPriceBhd, 0);

  return (
    <>
      <Header onCartClick={() => setShowCart(true)} />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold">{t.digitalPageTitle}</h1>
        <p className="mt-2 text-brown/70">{t.digitalPageSubtitle}</p>
        <p className="mt-1 text-sm text-brown/60">{t.digitalTabletNote}</p>

        <div className="mt-8">
          <BundleCard onAdd={(language) => addOrReplaceItem({ id: "digital-bundle", language, unitPriceBhd: DIGITAL_BUNDLE.priceBhd })} />
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
            className={`rounded-full border px-4 py-2 text-sm ${
              filter === "all" ? "border-leaf bg-leaf text-white" : "border-brown/20 bg-white text-brown"
            }`}
          >
            {t.digitalFilterAll}
          </button>
          {DIGITAL_PRODUCTS.map((product) => (
            <button
              type="button"
              key={product.id}
              aria-pressed={filter === product.id}
              onClick={() => setFilter(product.id)}
              className={`rounded-full border px-4 py-2 text-sm ${
                filter === product.id ? "border-leaf bg-leaf text-white" : "border-brown/20 bg-white text-brown"
              }`}
            >
              {locale === "ar" ? product.nameAr : product.nameEn}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={(language: DigitalLanguage) =>
                addOrReplaceItem({ id: product.id, language, unitPriceBhd: product.priceBhd })
              }
            />
          ))}
        </div>

        {items.length > 0 && (
          <div className="mt-10 rounded-xl bg-white/60 p-6">
            <h2 className="text-lg font-bold">{t.digitalCartTitle}</h2>
            <p className="mt-2 font-semibold">{formatMoney(subtotalBhd, currency)}</p>
            <a
              href="/digital/checkout"
              className="mt-4 inline-block rounded-full bg-leaf px-6 py-3 text-white"
            >
              {t.digitalConfirmButton}
            </a>
          </div>
        )}
      </main>
      <Footer />
      <CartDrawer open={showCart} onClose={() => setShowCart(false)} />
    </>
  );
}
```

Note: the physical `<CartDrawer>` is intentionally reused here for the physical-box icon in
the header (unrelated to the digital cart) — clicking it opens the physical cart, which is
correct: this page's own digital-cart summary is the inline block above, not a drawer.

- [ ] **Step 5: Manually verify in the browser**

Start the dev server and open `/digital` at both a desktop width and a phone width (375px) —
see Task 14 for the full walkthrough checklist. At minimum for this task: confirm the bundle
card and all 7 product cards render, filters narrow the grid correctly, and adding an item
updates the cart summary block.

- [ ] **Step 6: Run the full test suite and typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS with no failures or type errors.

- [ ] **Step 7: Commit**

```bash
git add components/header.tsx components/digital/product-card.tsx components/digital/bundle-card.tsx app/digital/page.tsx
git commit -m "feat: add digital products browse page with topic filters"
```

---

### Task 12: Digital checkout page

**Files:**
- Create: `components/digital/buyer-form.tsx`
- Create: `app/digital/checkout/page.tsx`

**Interfaces:**
- Consumes: `useDigitalCart` (Task 3); `DigitalBuyerDetails` (Task 1); `calculateDigitalOrderTotal`
  (Task 2); `POST /api/orders/digital-oreem` (Task 9).
- Produces: the `/digital/checkout` route.

- [ ] **Step 1: Create the shortened buyer form**

```tsx
// components/digital/buyer-form.tsx
"use client";

import type { DigitalBuyerDetails } from "../../lib/digital/types";
import { useLocale } from "../../lib/i18n/locale-context";

const COUNTRIES = [
  { code: "BH", labelAr: "البحرين" },
  { code: "SA", labelAr: "السعودية" },
  { code: "AE", labelAr: "الإمارات" },
  { code: "KW", labelAr: "الكويت" },
  { code: "OM", labelAr: "عُمان" },
  { code: "QA", labelAr: "قطر" },
  { code: "GB", labelAr: "United Kingdom" },
  { code: "US", labelAr: "United States" },
];

export function DigitalBuyerForm({
  value,
  onChange,
}: {
  value: DigitalBuyerDetails;
  onChange: (value: DigitalBuyerDetails) => void;
}) {
  const { t } = useLocale();

  function update<K extends keyof DigitalBuyerDetails>(key: K, fieldValue: DigitalBuyerDetails[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-bold">{t.digitalCheckoutTitle}</legend>

      <label className="block">
        الاسم الكامل
        <input
          required
          type="text"
          value={value.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          className="mt-1 block w-full rounded border border-brown/20 p-2"
        />
      </label>

      <label className="block">
        البريد الإلكتروني
        <input
          required
          type="email"
          value={value.email}
          onChange={(e) => update("email", e.target.value)}
          className="mt-1 block w-full rounded border border-brown/20 p-2"
        />
      </label>

      <label className="block">
        الدولة
        <select
          value={value.country}
          onChange={(e) => update("country", e.target.value)}
          className="mt-1 block w-full rounded border border-brown/20 p-2"
        >
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.labelAr}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value.marketingOptIn}
          onChange={(e) => update("marketingOptIn", e.target.checked)}
        />
        أرغب أستلم آخر العروض والمنتجات الجديدة
      </label>
    </fieldset>
  );
}
```

- [ ] **Step 2: Create the checkout page**

```tsx
// app/digital/checkout/page.tsx
"use client";

import { useState } from "react";
import { useDigitalCart } from "../../../lib/digital/cart-context";
import { calculateDigitalOrderTotal } from "../../../lib/digital/order-total";
import { DigitalBuyerForm } from "../../../components/digital/buyer-form";
import { useCurrency } from "../../../lib/currency-context";
import { useLocale } from "../../../lib/i18n/locale-context";
import { formatMoney } from "../../../lib/currency";
import type { DigitalBuyerDetails } from "../../../lib/digital/types";

const EMPTY_BUYER: DigitalBuyerDetails = {
  fullName: "",
  email: "",
  country: "BH",
  marketingOptIn: false,
};

export default function DigitalCheckoutPage() {
  const { items } = useDigitalCart();
  const { currency } = useCurrency();
  const { t } = useLocale();
  const [buyer, setBuyer] = useState<DigitalBuyerDetails>(EMPTY_BUYER);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { totalBhd } = calculateDigitalOrderTotal(items);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders/digital-oreem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyer, items }),
      });
      const json = await response.json();
      if (!response.ok || typeof json.paymentUrl !== "string") {
        setSubmitError("تعذر بدء الدفع عبر أوريم. حاول مرة أخرى.");
        return;
      }
      window.location.href = json.paymentUrl;
    } catch {
      setSubmitError("تعذر بدء الدفع عبر أوريم. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-4xl gap-8 p-6 md:grid-cols-2">
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-brown/60">{t.digitalCheckoutSubtitle}</p>
        <DigitalBuyerForm value={buyer} onChange={setBuyer} />
        <p className="rounded border border-brown/20 bg-white/60 p-3 text-sm text-brown/70">
          {t.digitalPaymentNote}
        </p>
        {submitError && <p className="text-red-600">{submitError}</p>}
        <button
          type="submit"
          disabled={submitting || items.length === 0}
          className="w-full rounded-full bg-leaf py-3 text-white disabled:opacity-50"
        >
          {t.digitalConfirmButton}
        </button>
      </form>

      <aside className="rounded-xl bg-white/60 p-6">
        <h2 className="text-lg font-bold">{t.digitalCartTitle}</h2>
        {items.length === 0 ? (
          <p className="mt-4 text-brown/60">{t.digitalCartEmpty}</p>
        ) : (
          <p className="mt-4 font-semibold">{formatMoney(totalBhd, currency)}</p>
        )}
      </aside>
    </main>
  );
}
```

- [ ] **Step 3: Manually verify in the browser**

With at least one item in the digital cart, load `/digital/checkout`, confirm the form
renders with just name/email/country/marketing-checkbox (no phone/city/address), and confirm
the total matches the cart. Full payment submission is covered in Task 14.

- [ ] **Step 4: Run the full test suite and typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS with no failures or type errors.

- [ ] **Step 5: Commit**

```bash
git add components/digital/buyer-form.tsx app/digital/checkout/page.tsx
git commit -m "feat: add digital checkout page"
```

---

### Task 13: Digital confirmation page and cart-clear-on-mount

**Files:**
- Create: `components/digital/clear-digital-cart-on-mount.tsx`
- Create: `app/digital/confirmation/page.tsx`

**Interfaces:**
- Consumes: `decodeDigitalOrderPayload` (Task 6); `verifyTransaction`, `claimOrderProcessing`
  from existing `lib/payments/oreem-client.ts` / `lib/order/order-processing-lock.ts`
  (unchanged, reused as-is — `claimOrderProcessing` is already generic on `txnRef`);
  `sendDigitalOrderNotificationEmail`, `sendDigitalCustomerConfirmationEmail` (Task 8);
  `addToMarketingAudience` from existing `lib/email/resend-client.ts` (unchanged, reused as-is
  — already takes a plain email string); `buildCustomerToOwnerWhatsappLink` from existing
  `lib/email/whatsapp-link.ts` (unchanged, reused as-is); `OrderConfirmationMessage` from
  existing `components/order-confirmation-message.tsx` (unchanged, reused as-is);
  `DIGITAL_PRODUCTS`, `DIGITAL_BUNDLE` (Task 1); `useDigitalCart` (Task 3).
- Produces: the `/digital/confirmation` route.

- [ ] **Step 1: Create the digital cart-clear-on-mount component**

```tsx
// components/digital/clear-digital-cart-on-mount.tsx
"use client";

import { useEffect, useRef } from "react";
import { useDigitalCart } from "../../lib/digital/cart-context";

// Same pattern as components/clear-cart-on-mount.tsx for the physical cart: gated on
// `hydrated` because React runs child effects before parent effects, so an unguarded
// mount-time clear would fire before DigitalCartProvider's own load-from-storage effect
// and get overwritten by it.
export function ClearDigitalCartOnMount() {
  const { clear, hydrated } = useDigitalCart();
  const hasCleared = useRef(false);

  useEffect(() => {
    if (hydrated && !hasCleared.current) {
      hasCleared.current = true;
      clear();
    }
  }, [hydrated, clear]);

  return null;
}
```

- [ ] **Step 2: Create the confirmation page**

```tsx
// app/digital/confirmation/page.tsx
import { decodeDigitalOrderPayload } from "../../../lib/digital/order-payload";
import { claimOrderProcessing } from "../../../lib/order/order-processing-lock";
import { verifyTransaction } from "../../../lib/payments/oreem-client";
import {
  sendDigitalOrderNotificationEmail,
  sendDigitalCustomerConfirmationEmail,
} from "../../../lib/digital/resend-client";
import { addToMarketingAudience } from "../../../lib/email/resend-client";
import { buildCustomerToOwnerWhatsappLink } from "../../../lib/email/whatsapp-link";
import { DIGITAL_PRODUCTS, DIGITAL_BUNDLE } from "../../../lib/digital/catalog";
import { OrderConfirmationMessage } from "../../../components/order-confirmation-message";
import { ClearDigitalCartOnMount } from "../../../components/digital/clear-digital-cart-on-mount";
import type { DigitalTopicId } from "../../../lib/digital/types";

export const runtime = "nodejs";

const INSTAGRAM_HANDLE = "@peepandbeyond";

interface ConfirmationPageProps {
  searchParams: {
    order?: string;
  };
}

// Expands the purchased items into a flat list of {topicId, language} download entries,
// unrolling any "digital-bundle" line into its 7 underlying topics.
function resolveDownloads(
  items: { id: string; language: "ar" | "en" }[]
): { topicId: DigitalTopicId; language: "ar" | "en" }[] {
  const downloads: { topicId: DigitalTopicId; language: "ar" | "en" }[] = [];
  for (const item of items) {
    if (item.id === "digital-bundle") {
      for (const topicId of DIGITAL_BUNDLE.includes) {
        downloads.push({ topicId, language: item.language });
      }
    } else {
      downloads.push({ topicId: item.id as DigitalTopicId, language: item.language });
    }
  }
  return downloads;
}

export default async function DigitalConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const encodedOrder = searchParams.order;
  if (!encodedOrder) {
    return <OrderConfirmationMessage success={false} title="لا يوجد طلب لعرضه" body="" />;
  }

  const payload = decodeDigitalOrderPayload(encodedOrder);
  if (!payload) {
    return (
      <OrderConfirmationMessage
        success={false}
        title="تعذر قراءة تفاصيل الطلب"
        body="حاول العودة للمتجر والطلب مرة أخرى."
      />
    );
  }

  let verification;
  try {
    verification = await verifyTransaction(payload.txnRef);
  } catch (error) {
    console.error("Failed to verify Oreem transaction for digital order", error);
    verification = { verified: false, status: "verification_failed" as const };
  }

  if (!verification.verified) {
    return (
      <OrderConfirmationMessage
        success={false}
        title="لم يتم تأكيد الدفع"
        body="لم نتمكن من تأكيد عملية الدفع. لم يتم خصم أي مبلغ إذا لم تكتمل العملية — حاول مرة أخرى."
      />
    );
  }

  if (
    verification.amountBhd !== undefined &&
    !(
      Number.isFinite(payload.totalBhd) &&
      Math.abs(verification.amountBhd - payload.totalBhd) <= 0.001
    )
  ) {
    console.error("Oreem verified amount does not match digital order payload total", {
      txnRef: payload.txnRef,
      verifiedAmount: verification.amountBhd,
      payloadTotal: payload.totalBhd,
    });
    return (
      <OrderConfirmationMessage
        success={false}
        title="تعذر تأكيد تفاصيل الطلب"
        body={`حدث تعارض في بيانات الطلب. يرجى التواصل معنا عبر انستقرام ${INSTAGRAM_HANDLE} مع ذكر رقم المرجع: ${payload.txnRef} قبل إعادة المحاولة.`}
        allowRetry={false}
      />
    );
  }

  // One payment must produce at most one set of side effects, no matter how many times
  // this URL is hit (refresh, back button, link-preview bot) — same guard as the
  // physical box's confirmation page.
  const isFirstProcessing = await claimOrderProcessing(payload.txnRef);
  let ownerEmailSucceeded = true;

  if (isFirstProcessing) {
    const emailData = { buyer: payload.buyer, items: payload.items, totalBhd: payload.totalBhd, txnRef: payload.txnRef };

    try {
      await sendDigitalOrderNotificationEmail(emailData);
    } catch (error) {
      console.error("Failed to send digital order notification email", error);
      ownerEmailSucceeded = false;
    }

    try {
      await sendDigitalCustomerConfirmationEmail(emailData);
    } catch (error) {
      console.error("Failed to send digital customer confirmation email", error);
    }

    if (payload.buyer.marketingOptIn) {
      try {
        await addToMarketingAudience(payload.buyer.email);
      } catch (error) {
        console.error("Failed to add digital buyer to marketing audience", error);
      }
    }
  }

  let whatsappLink: string | undefined;
  const ownerWhatsappContact = process.env.OWNER_WHATSAPP_NUMBER;
  if (ownerWhatsappContact && ownerWhatsappContact.trim().length > 0) {
    try {
      whatsappLink = buildCustomerToOwnerWhatsappLink(ownerWhatsappContact, payload.txnRef);
    } catch (error) {
      console.error("Failed to build customer-to-owner WhatsApp link for digital order", error);
      whatsappLink = undefined;
    }
  }

  const downloads = resolveDownloads(payload.items);
  const successBody = ownerEmailSucceeded
    ? "شكرًا لتسوقك من Peep & beyond — وصلك تأكيد على بريدك الإلكتروني، وروابط التحميل بالأسفل."
    : `شكرًا لتسوقك من Peep & beyond — تم الدفع بنجاح. رقم مرجع طلبك: ${payload.txnRef}. روابط التحميل بالأسفل — احتفظي بهذه الصفحة لو احتجتِ تنزيل الملفات مرة أخرى.`;

  return (
    <>
      <OrderConfirmationMessage
        success={true}
        title="تم تأكيد طلبك بنجاح!"
        body={successBody}
        whatsappLink={whatsappLink}
      />
      <div className="mx-auto max-w-lg px-10 pb-10">
        <h2 className="text-lg font-bold">روابط التحميل</h2>
        <ul className="mt-4 space-y-2">
          {downloads.map(({ topicId, language }) => {
            const product = DIGITAL_PRODUCTS.find((p) => p.id === topicId);
            const label = product ? (language === "ar" ? product.nameAr : product.nameEn) : topicId;
            const href = `/api/digital-download?order=${encodeURIComponent(encodedOrder)}&product=${topicId}&language=${language}`;
            return (
              <li key={`${topicId}-${language}`}>
                <a href={href} className="text-leaf underline">
                  {label} ({language === "ar" ? "عربي" : "English"}) — تحميل
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      <ClearDigitalCartOnMount />
    </>
  );
}
```

- [ ] **Step 3: Run the full test suite and typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS with no failures or type errors.

- [ ] **Step 4: Commit**

```bash
git add components/digital/clear-digital-cart-on-mount.tsx app/digital/confirmation/page.tsx
git commit -m "feat: add digital confirmation page with download delivery"
```

---

### Task 14: End-to-end manual verification

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Use the project's preview tooling to start `npm run dev` and open the site in the browser.

- [ ] **Step 2: Desktop walkthrough**

1. Click the new "المنتجات الرقمية" nav link — confirm `/digital` loads with the bundle card
   pinned above 7 product cards.
2. Click a few topic filter chips — confirm the grid narrows to the matching product, and
   "الكل" restores all 7.
3. Pick a language on one product card and add it to cart — confirm the inline cart summary
   appears with the correct price.
4. Add the same product again with the other language — confirm the cart still shows exactly
   one line for it (replaced, not duplicated).
5. Click through to `/digital/checkout` — confirm the form only asks for name, email,
   country, and the marketing checkbox (no phone/city/address), and the total matches.
6. Fill the form with real-looking test data and submit — confirm it redirects to Oreem's
   real hosted payment page showing the correct amount and merchant name. **Do not enter card
   details or complete the payment** — this only confirms the session was created correctly,
   matching the scoped verification already done for the physical box's Oreem integration.
7. Navigate directly to `/digital/confirmation?order=<something-invalid>` — confirm it shows
   the "تعذر قراءة تفاصيل الطلب" failure message instead of crashing.

- [ ] **Step 3: Mobile walkthrough**

Resize the browser to a phone width (375px) and repeat: confirm the header's mobile nav row
shows the digital-products link, the bundle/product card grid stacks to a single column, the
filter chips wrap instead of overflowing, and the checkout form and confirmation page are
fully usable without horizontal scrolling.

- [ ] **Step 4: Spot-check the existing site at mobile width**

While already at 375px, briefly revisit the home page and the physical checkout page (`/checkout`).
This plan does not change those pages, but confirm they still look correct at phone width —
if something is broken, note it and report it separately rather than fixing it inline here
(out of scope for this plan).

- [ ] **Step 5: Run the full test suite one last time**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS — full suite green, no type errors.

- [ ] **Step 6: Report results**

Summarize what was checked and any issues found (in-scope issues get fixed before this task is
considered done; out-of-scope issues from Step 4 get reported to the user, not fixed here).

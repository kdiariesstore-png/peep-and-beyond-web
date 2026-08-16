# Peep & Beyond — Storefront Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a Next.js storefront for the single "Peep Box" product with working
bilingual (AR/EN) + dual-currency (BHD/USD) toggles, a customization form, and a
client-side cart — no checkout yet (that's Plan 2).

**Architecture:** Next.js 14 App Router + TypeScript, hand-authored scaffold (no
`create-next-app` wizard, since the directory already has `.git`/`.env.local`/`docs/`).
Tailwind CSS for styling. Pure business logic (currency conversion, cart serialization,
product config) lives in `lib/` and is unit-tested with Vitest. React components are
manually verified in a real browser via the dev server — component composition isn't
meaningfully unit-testable and the project has no visual regression tooling yet.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Vitest,
@testing-library/react (for the cart context test only).

## Global Constraints

- Product: single item "Peep Box", price 21.900 BHD, options: story language (ar/en),
  letter-card language (ar/en), cup color (pink/blue), child's name (free text), optional
  free gift card toggle. (Spec §5)
- Arabic is the default locale and the source of truth for copy; English is a translated
  mirror. Locale switch sets `<html lang>` and `dir` (`rtl` for ar, `ltr` for en). (Spec §6)
- BHD is the default currency; USD is display-only via a fixed conversion constant
  (1 BHD ≈ 2.6596 USD) — never used for actual charges. (Spec §6)
- No user accounts/login anywhere in this build. (Spec §3)
- Cart persists in `localStorage`, no backend cart. (Spec §4)
- Secrets live only in `.env.local` (already git-ignored) — this plan introduces no new
  secrets, but must not regress that.

---

### Task 1: Hand-authored Next.js + TypeScript + Tailwind scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `next-env.d.ts`
- Create: `vitest.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

**Interfaces:**
- Produces: a runnable `npm run dev` Next.js app and a runnable `npm test` Vitest setup
  that every later task builds on.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "peep-and-beyond-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "resend": "^3.5.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@types/node": "^20.14.10",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "jsdom": "^24.1.1",
    "postcss": "^8.4.40",
    "tailwindcss": "^3.4.7",
    "typescript": "^5.5.4",
    "vitest": "^2.0.4"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

- [ ] **Step 4: Write `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF3E7",
        brown: "#3B2A1E",
        leaf: "#6B8E5A",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Write `postcss.config.mjs`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Write `next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 7: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 8: Write `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

body {
  background-color: #fbf3e7;
  color: #3b2a1e;
}
```

- [ ] **Step 9: Write `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peep & beyond | Peep Box",
  description: "بوكس بيب — قصة، لعب، وتعلّم بعيدًا عن الشاشات.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 10: Write `app/page.tsx`**

```tsx
export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Peep &amp; beyond</h1>
      <p>الموقع قيد الإنشاء…</p>
    </main>
  );
}
```

- [ ] **Step 11: Install dependencies**

Run: `npm install`
Expected: installs without errors, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 12: Verify the dev server runs**

Run: `npm run dev` (in the background, or run then Ctrl+C after confirming)
Expected: server starts on `http://localhost:3000` with no errors; visiting it shows
"Peep & beyond" heading. Stop the server after confirming.

- [ ] **Step 13: Verify typecheck and test runner both work**

Run: `npm run typecheck`
Expected: exits 0, no errors.

Run: `npm test`
Expected: "No test files found" (expected — no tests written yet) but exits without a
config error.

- [ ] **Step 14: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.mjs next-env.d.ts vitest.config.ts app/
git commit -m "chore: scaffold Next.js + TypeScript + Tailwind + Vitest"
```

---

### Task 2: Core domain types

**Files:**
- Create: `lib/types.ts`

**Interfaces:**
- Produces: `Locale`, `Currency`, `StoryLanguage`, `CardLanguage`, `CupColor`,
  `BoxCustomization`, `CartItem`, `BuyerDetails`, `PaymentMethod` — used by every task
  from here on in this plan and in Plans 2–3.

- [ ] **Step 1: Write `lib/types.ts`**

```ts
export type Locale = "ar" | "en";
export type Currency = "BHD" | "USD";

export type StoryLanguage = "ar" | "en";
export type CardLanguage = "ar" | "en";
export type CupColor = "pink" | "blue";

export interface BoxCustomization {
  storyLanguage: StoryLanguage;
  cardLanguage: CardLanguage;
  cupColor: CupColor;
  childName: string;
  giftCard: boolean;
}

export interface CartItem {
  id: string;
  customization: BoxCustomization;
  unitPriceBhd: number;
  quantity: number;
}

export interface BuyerDetails {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  preferredContact: "email" | "whatsapp";
  marketingOptIn: boolean;
}

export type PaymentMethod = "iban" | "oreem";
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add core domain types"
```

---

### Task 3: Currency conversion

**Files:**
- Create: `lib/currency.ts`
- Test: `lib/currency.test.ts`

**Interfaces:**
- Consumes: `Currency` from `lib/types.ts`
- Produces: `BHD_TO_USD_RATE: number`, `convertBhdToUsd(bhd: number): number`,
  `formatMoney(amountBhd: number, currency: Currency): string` — used by product/cart
  display components and, in Plan 2, order summaries.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { convertBhdToUsd, formatMoney } from "./currency";

describe("convertBhdToUsd", () => {
  it("converts a round BHD amount to USD using the fixed peg", () => {
    expect(convertBhdToUsd(10)).toBeCloseTo(26.6, 2);
  });

  it("converts the Peep Box price correctly", () => {
    expect(convertBhdToUsd(21.9)).toBeCloseTo(58.25, 2);
  });
});

describe("formatMoney", () => {
  it("formats BHD with three decimals and the د.ب suffix", () => {
    expect(formatMoney(21.9, "BHD")).toBe("21.900 د.ب");
  });

  it("formats USD with a dollar sign and two decimals", () => {
    expect(formatMoney(21.9, "USD")).toBe("$58.25");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/currency.test.ts`
Expected: FAIL — `Cannot find module './currency'`.

- [ ] **Step 3: Write `lib/currency.ts`**

```ts
import type { Currency } from "./types";

export const BHD_TO_USD_RATE = 2.6596;

export function convertBhdToUsd(bhd: number): number {
  return Math.round(bhd * BHD_TO_USD_RATE * 100) / 100;
}

export function formatMoney(amountBhd: number, currency: Currency): string {
  if (currency === "USD") {
    return `$${convertBhdToUsd(amountBhd).toFixed(2)}`;
  }
  return `${amountBhd.toFixed(3)} د.ب`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/currency.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/currency.ts lib/currency.test.ts
git commit -m "feat: add BHD/USD currency conversion"
```

---

### Task 4: Product configuration

**Files:**
- Create: `lib/product.ts`
- Test: `lib/product.test.ts`

**Interfaces:**
- Consumes: nothing new
- Produces: `PEEP_BOX_PRODUCT` constant (`{ id, nameAr, nameEn, priceBhd, contents: string[] }`)
  and `createDefaultCustomization(): BoxCustomization` — used by the customization form
  (Task 10) and product display components (Task 9).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { PEEP_BOX_PRODUCT, createDefaultCustomization } from "./product";

describe("PEEP_BOX_PRODUCT", () => {
  it("has the correct price", () => {
    expect(PEEP_BOX_PRODUCT.priceBhd).toBe(21.9);
  });

  it("lists the seven box contents", () => {
    expect(PEEP_BOX_PRODUCT.contents).toHaveLength(7);
  });
});

describe("createDefaultCustomization", () => {
  it("defaults to Arabic story/card language and pink cup", () => {
    expect(createDefaultCustomization()).toEqual({
      storyLanguage: "ar",
      cardLanguage: "ar",
      cupColor: "pink",
      childName: "",
      giftCard: false,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/product.test.ts`
Expected: FAIL — `Cannot find module './product'`.

- [ ] **Step 3: Write `lib/product.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/product.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/product.ts lib/product.test.ts
git commit -m "feat: add Peep Box product configuration"
```

---

### Task 5: Cart storage (localStorage persistence, pure functions)

**Files:**
- Create: `lib/cart/cart-storage.ts`
- Test: `lib/cart/cart-storage.test.ts`

**Interfaces:**
- Consumes: `CartItem` from `lib/types.ts`
- Produces: `serializeCart(items: CartItem[]): string`,
  `deserializeCart(raw: string | null): CartItem[]`, `loadCart(): CartItem[]`,
  `saveCart(items: CartItem[]): void` — used by the cart context (Task 6).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { deserializeCart, serializeCart } from "./cart-storage";
import type { CartItem } from "../types";

const sampleItem: CartItem = {
  id: "abc123",
  customization: {
    storyLanguage: "ar",
    cardLanguage: "ar",
    cupColor: "pink",
    childName: "سارة",
    giftCard: false,
  },
  unitPriceBhd: 21.9,
  quantity: 1,
};

describe("serializeCart / deserializeCart", () => {
  it("round-trips a cart through serialization", () => {
    const serialized = serializeCart([sampleItem]);
    expect(deserializeCart(serialized)).toEqual([sampleItem]);
  });

  it("returns an empty array for null input", () => {
    expect(deserializeCart(null)).toEqual([]);
  });

  it("returns an empty array for invalid JSON instead of throwing", () => {
    expect(deserializeCart("{not json")).toEqual([]);
  });

  it("returns an empty array if the parsed value isn't an array", () => {
    expect(deserializeCart('{"foo":"bar"}')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/cart/cart-storage.test.ts`
Expected: FAIL — `Cannot find module './cart-storage'`.

- [ ] **Step 3: Write `lib/cart/cart-storage.ts`**

```ts
import type { CartItem } from "../types";

const STORAGE_KEY = "peep-cart-v1";

export function serializeCart(items: CartItem[]): string {
  return JSON.stringify(items);
}

export function deserializeCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CartItem[];
  } catch {
    return [];
  }
}

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  return deserializeCart(window.localStorage.getItem(STORAGE_KEY));
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, serializeCart(items));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/cart/cart-storage.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/cart/cart-storage.ts lib/cart/cart-storage.test.ts
git commit -m "feat: add cart localStorage serialization"
```

---

### Task 6: Cart context/provider

**Files:**
- Create: `lib/cart/cart-context.tsx`
- Test: `lib/cart/cart-context.test.tsx`

**Interfaces:**
- Consumes: `CartItem` from `lib/types.ts`; `loadCart`, `saveCart` from
  `lib/cart/cart-storage.ts`
- Produces: `CartProvider` (React component), `useCart()` hook returning
  `{ items: CartItem[], addItem: (item: CartItem) => void, removeItem: (id: string) => void,
  updateQuantity: (id: string, quantity: number) => void, clear: () => void }` — used by
  the customize form (Task 10), cart drawer (Task 11), header (Task 8), and checkout
  (Plan 2).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CartProvider, useCart } from "./cart-context";

function TestHarness() {
  const { items, addItem, removeItem, updateQuantity } = useCart();
  return (
    <div>
      <div data-testid="count">{items.length}</div>
      <div data-testid="qty">{items[0]?.quantity ?? 0}</div>
      <button
        onClick={() =>
          addItem({
            id: "item-1",
            customization: {
              storyLanguage: "ar",
              cardLanguage: "ar",
              cupColor: "pink",
              childName: "سارة",
              giftCard: false,
            },
            unitPriceBhd: 21.9,
            quantity: 1,
          })
        }
      >
        add
      </button>
      <button onClick={() => updateQuantity("item-1", 3)}>bump</button>
      <button onClick={() => removeItem("item-1")}>remove</button>
    </div>
  );
}

describe("CartProvider / useCart", () => {
  it("adds, updates quantity, and removes an item", () => {
    render(
      <CartProvider>
        <TestHarness />
      </CartProvider>
    );

    expect(screen.getByTestId("count").textContent).toBe("0");

    fireEvent.click(screen.getByText("add"));
    expect(screen.getByTestId("count").textContent).toBe("1");

    fireEvent.click(screen.getByText("bump"));
    expect(screen.getByTestId("qty").textContent).toBe("3");

    fireEvent.click(screen.getByText("remove"));
    expect(screen.getByTestId("count").textContent).toBe("0");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/cart/cart-context.test.tsx`
Expected: FAIL — `Cannot find module './cart-context'`.

- [ ] **Step 3: Write `lib/cart/cart-context.tsx`**

```tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CartItem } from "../types";
import { loadCart, saveCart } from "./cart-storage";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(loadCart());
  }, []);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = (item: CartItem) => setItems((prev) => [...prev, item]);

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  const updateQuantity = (id: string, quantity: number) =>
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );

  const clear = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/cart/cart-context.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add lib/cart/cart-context.tsx lib/cart/cart-context.test.tsx
git commit -m "feat: add cart React context with localStorage persistence"
```

---

### Task 7: i18n dictionaries

**Files:**
- Create: `lib/i18n/dictionaries/ar.ts`
- Create: `lib/i18n/dictionaries/en.ts`
- Create: `lib/i18n/locale-context.tsx`
- Test: `lib/i18n/dictionaries.test.ts`

**Interfaces:**
- Consumes: `Locale` from `lib/types.ts`
- Produces: `dictionaries: Record<Locale, Dictionary>`, `LocaleProvider`, `useLocale()`
  hook returning `{ locale: Locale, setLocale: (l: Locale) => void, t: Dictionary }` —
  used by every UI component from Task 8 onward.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { ar } from "./dictionaries/ar";
import { en } from "./dictionaries/en";

describe("i18n dictionaries", () => {
  it("have exactly the same set of keys in Arabic and English", () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });

  it("have no empty string values in either dictionary", () => {
    const allValues = [...Object.values(ar), ...Object.values(en)];
    expect(allValues.every((value) => value.trim().length > 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/i18n/dictionaries.test.ts`
Expected: FAIL — `Cannot find module './dictionaries/ar'`.

- [ ] **Step 3: Write `lib/i18n/dictionaries/ar.ts`**

```ts
export const ar = {
  navShop: "تسوّق",
  navStories: "القصص",
  navGifts: "الهدايا",
  navAbout: "عن Peep & beyond",
  heroTitleLine1: "افتحوا الصندوق…",
  heroTitleLine2: "وابدأوا المغامرة",
  heroSubtitle:
    "تجربة متكاملة تجمع بين قصة ممتعة وتلوين وبطاقات حروف وهدايا مختارة بعناية؛ لتصنع لطفلك لحظات جميلة وتدعم خياله كل يوم.",
  orderNow: "اطلب الآن",
  viewContents: "شاهد محتويات البوكس",
  addToCart: "أضف إلى السلة",
  cartTitle: "سلة المشتريات",
  cartEmpty: "سلتك فارغة",
  customizeTitle: "جهّز بوكس طفلك",
  customizeSubtitle: "اختر تفاصيل البوكس قبل إضافته إلى السلة.",
  storyLanguageLabel: "لغة القصة",
  cardLanguageLabel: "لغة بطاقات الحروف",
  cupColorLabel: "لون الكوب",
  childNameLabel: "اسم الطفل",
  giftCardLabel: "إضافة بطاقة إهداء مخصصة",
  giftCardFree: "مجانية",
  languageArabic: "العربية",
  languageEnglish: "الإنجليزية",
  cupPink: "وردي",
  cupBlue: "أزرق",
} as const;

export type Dictionary = typeof ar;
```

- [ ] **Step 4: Write `lib/i18n/dictionaries/en.ts`**

```ts
import type { Dictionary } from "./ar";

export const en: Dictionary = {
  navShop: "Shop",
  navStories: "Stories",
  navGifts: "Gifts",
  navAbout: "About Peep & beyond",
  heroTitleLine1: "Open the box…",
  heroTitleLine2: "and start the adventure",
  heroSubtitle:
    "A complete experience combining a fun story, coloring, letter cards, and carefully chosen gifts — creating beautiful moments and nurturing your child's imagination every day.",
  orderNow: "Order Now",
  viewContents: "See what's inside",
  addToCart: "Add to cart",
  cartTitle: "Cart",
  cartEmpty: "Your cart is empty",
  customizeTitle: "Prepare your child's box",
  customizeSubtitle: "Choose the box details before adding it to your cart.",
  storyLanguageLabel: "Story language",
  cardLanguageLabel: "Letter cards language",
  cupColorLabel: "Cup color",
  childNameLabel: "Child's name",
  giftCardLabel: "Add a personalized gift card",
  giftCardFree: "Free",
  languageArabic: "Arabic",
  languageEnglish: "English",
  cupPink: "Pink",
  cupBlue: "Blue",
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- lib/i18n/dictionaries.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Write `lib/i18n/locale-context.tsx`**

```tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Locale } from "../types";
import { ar, type Dictionary } from "./dictionaries/ar";
import { en } from "./dictionaries/en";

const dictionaries: Record<Locale, Dictionary> = { ar, en };
const STORAGE_KEY = "peep-locale-v1";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "en") setLocaleState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = (next: Locale) => setLocaleState(next);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
```

- [ ] **Step 7: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 8: Commit**

```bash
git add lib/i18n/
git commit -m "feat: add AR/EN dictionaries and locale context"
```

---

### Task 8: Currency context + Header component

**Files:**
- Create: `lib/currency-context.tsx`
- Create: `components/header.tsx`

**Interfaces:**
- Consumes: `useLocale` from `lib/i18n/locale-context.tsx`; `useCart` from
  `lib/cart/cart-context.tsx`
- Produces: `CurrencyProvider`, `useCurrency()` hook returning
  `{ currency: Currency, setCurrency: (c: Currency) => void }` — used by any price display
  from here on; `Header` component — used by `app/page.tsx` (Task 13).

- [ ] **Step 1: Write `lib/currency-context.tsx`**

```tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Currency } from "./types";

const STORAGE_KEY = "peep-currency-v1";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("BHD");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "BHD" || stored === "USD") setCurrencyState(stored);
  }, []);

  const setCurrency = (next: Currency) => {
    setCurrencyState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}
```

- [ ] **Step 2: Write `components/header.tsx`**

```tsx
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
    <header className="flex items-center justify-between border-b border-brown/10 px-6 py-4">
      <span className="text-xl font-bold">Peep &amp; beyond</span>
      <nav className="hidden gap-6 md:flex">
        <a href="#shop">{t.navShop}</a>
        <a href="#journey">{t.navStories}</a>
        <a href="#inside">{t.navGifts}</a>
        <a href="#about">{t.navAbout}</a>
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
    </header>
  );
}
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add lib/currency-context.tsx components/header.tsx
git commit -m "feat: add currency context and header with locale/currency toggles"
```

---

### Task 9: Landing page static sections

**Files:**
- Create: `components/hero.tsx`
- Create: `components/trust-badges.tsx`
- Create: `components/three-moments.tsx`

**Interfaces:**
- Consumes: `useLocale` from `lib/i18n/locale-context.tsx`; `useCurrency` from
  `lib/currency-context.tsx`; `formatMoney` from `lib/currency.ts`; `PEEP_BOX_PRODUCT` from
  `lib/product.ts`
- Produces: `Hero`, `TrustBadges`, `ThreeMoments` components — used by `app/page.tsx`
  (Task 13).

- [ ] **Step 1: Write `components/hero.tsx`**

```tsx
"use client";

import { useLocale } from "../lib/i18n/locale-context";
import { useCurrency } from "../lib/currency-context";
import { formatMoney } from "../lib/currency";
import { PEEP_BOX_PRODUCT } from "../lib/product";

export function Hero({ onOrderClick }: { onOrderClick: () => void }) {
  const { t } = useLocale();
  const { currency } = useCurrency();

  return (
    <section className="px-6 py-16 text-center">
      <h1 className="text-4xl font-bold leading-tight">
        {t.heroTitleLine1}
        <br />
        {t.heroTitleLine2}
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-brown/80">{t.heroSubtitle}</p>
      <p className="mt-6 text-2xl font-semibold">
        {formatMoney(PEEP_BOX_PRODUCT.priceBhd, currency)}
      </p>
      <div className="mt-6 flex justify-center gap-4">
        <button
          type="button"
          onClick={onOrderClick}
          className="rounded-full bg-leaf px-6 py-3 text-white"
        >
          {t.orderNow}
        </button>
        <a href="#inside" className="rounded-full border border-brown/20 px-6 py-3">
          {t.viewContents}
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write `components/trust-badges.tsx`**

```tsx
"use client";

import { useLocale } from "../lib/i18n/locale-context";

export function TrustBadges() {
  const { locale } = useLocale();
  const badges =
    locale === "ar"
      ? [
          { title: "متجر بحريني", subtitle: "نصنع الفكرة بحب في البحرين" },
          { title: "دفع آمن", subtitle: "بطاقات عبر أوريم أو تحويل بنكي" },
          { title: "توصيل مرن", subtitle: "2 د.ب داخل البحرين" },
          { title: "تغليف بحب", subtitle: "جاهز ليصل كهدية" },
        ]
      : [
          { title: "Bahraini store", subtitle: "Made with love in Bahrain" },
          { title: "Secure payment", subtitle: "Oreem cards or bank transfer" },
          { title: "Flexible delivery", subtitle: "2 BHD within Bahrain" },
          { title: "Wrapped with love", subtitle: "Ready to arrive as a gift" },
        ];

  return (
    <section className="grid grid-cols-2 gap-4 px-6 py-10 md:grid-cols-4">
      {badges.map((badge) => (
        <article key={badge.title} className="rounded-xl bg-white/60 p-4 text-center">
          <h3 className="font-semibold">{badge.title}</h3>
          <p className="text-sm text-brown/70">{badge.subtitle}</p>
        </article>
      ))}
    </section>
  );
}
```

- [ ] **Step 3: Write `components/three-moments.tsx`**

```tsx
"use client";

import { useLocale } from "../lib/i18n/locale-context";

export function ThreeMoments() {
  const { locale } = useLocale();
  const moments =
    locale === "ar"
      ? [
          { title: "اقرأ", body: "قصة مصوّرة ممتعة تنمّي الخيال وتفتح باب الحوار." },
          { title: "العب", body: "خريطة مغناطيسية وملصقات بيب لوقت لعب مليء بالخيال." },
          { title: "تعلّم", body: "بطاقات الحروف العربية أو الإنجليزية تدعم التعلّم والاستكشاف." },
        ]
      : [
          { title: "Read", body: "A fun illustrated story that grows imagination and opens conversation." },
          { title: "Play", body: "A magnetic map and Peep stickers for imaginative play." },
          { title: "Learn", body: "Arabic or English letter cards support learning and discovery." },
        ];

  return (
    <section className="px-6 py-10">
      <div className="grid gap-6 md:grid-cols-3">
        {moments.map((moment) => (
          <article key={moment.title} className="rounded-xl bg-white/60 p-6">
            <h3 className="text-lg font-semibold">{moment.title}</h3>
            <p className="mt-2 text-brown/70">{moment.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add components/hero.tsx components/trust-badges.tsx components/three-moments.tsx
git commit -m "feat: add hero, trust badges, and three-moments landing sections"
```

---

### Task 10: Box customization form + add-to-cart

**Files:**
- Create: `lib/cart/build-cart-item.ts`
- Test: `lib/cart/build-cart-item.test.ts`
- Create: `components/customize-box-form.tsx`

**Interfaces:**
- Consumes: `BoxCustomization`, `CartItem` from `lib/types.ts`;
  `createDefaultCustomization`, `PEEP_BOX_PRODUCT` from `lib/product.ts`; `useCart` from
  `lib/cart/cart-context.tsx`; `useLocale` from `lib/i18n/locale-context.tsx`
- Produces: `buildCartItem(customization: BoxCustomization): CartItem` (pure, generates a
  fresh id); `CustomizeBoxForm` component (modal) — used by `app/page.tsx` (Task 13).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildCartItem } from "./build-cart-item";

describe("buildCartItem", () => {
  it("wraps a customization into a cart item with quantity 1 and the box price", () => {
    const item = buildCartItem({
      storyLanguage: "en",
      cardLanguage: "ar",
      cupColor: "blue",
      childName: "Omar",
      giftCard: true,
    });

    expect(item.customization.childName).toBe("Omar");
    expect(item.unitPriceBhd).toBe(21.9);
    expect(item.quantity).toBe(1);
    expect(typeof item.id).toBe("string");
    expect(item.id.length).toBeGreaterThan(0);
  });

  it("generates a different id on each call", () => {
    const customization = {
      storyLanguage: "ar" as const,
      cardLanguage: "ar" as const,
      cupColor: "pink" as const,
      childName: "سارة",
      giftCard: false,
    };
    const a = buildCartItem(customization);
    const b = buildCartItem(customization);
    expect(a.id).not.toBe(b.id);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/cart/build-cart-item.test.ts`
Expected: FAIL — `Cannot find module './build-cart-item'`.

- [ ] **Step 3: Write `lib/cart/build-cart-item.ts`**

```ts
import type { BoxCustomization, CartItem } from "../types";
import { PEEP_BOX_PRODUCT } from "../product";

export function buildCartItem(customization: BoxCustomization): CartItem {
  return {
    id: crypto.randomUUID(),
    customization,
    unitPriceBhd: PEEP_BOX_PRODUCT.priceBhd,
    quantity: 1,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/cart/build-cart-item.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Write `components/customize-box-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { BoxCustomization } from "../lib/types";
import { createDefaultCustomization } from "../lib/product";
import { buildCartItem } from "../lib/cart/build-cart-item";
import { useCart } from "../lib/cart/cart-context";
import { useLocale } from "../lib/i18n/locale-context";

export function CustomizeBoxForm({ onDone }: { onDone: () => void }) {
  const { t } = useLocale();
  const { addItem } = useCart();
  const [customization, setCustomization] = useState<BoxCustomization>(
    createDefaultCustomization()
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    addItem(buildCartItem(customization));
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <h2 className="text-xl font-bold">{t.customizeTitle}</h2>
      <p className="text-sm text-brown/70">{t.customizeSubtitle}</p>

      <fieldset>
        <legend>{t.storyLanguageLabel}</legend>
        {(["ar", "en"] as const).map((lang) => (
          <button
            type="button"
            key={lang}
            aria-pressed={customization.storyLanguage === lang}
            onClick={() => setCustomization((c) => ({ ...c, storyLanguage: lang }))}
          >
            {lang === "ar" ? t.languageArabic : t.languageEnglish}
          </button>
        ))}
      </fieldset>

      <fieldset>
        <legend>{t.cardLanguageLabel}</legend>
        {(["ar", "en"] as const).map((lang) => (
          <button
            type="button"
            key={lang}
            aria-pressed={customization.cardLanguage === lang}
            onClick={() => setCustomization((c) => ({ ...c, cardLanguage: lang }))}
          >
            {lang === "ar" ? t.languageArabic : t.languageEnglish}
          </button>
        ))}
      </fieldset>

      <fieldset>
        <legend>{t.cupColorLabel}</legend>
        {(["pink", "blue"] as const).map((color) => (
          <button
            type="button"
            key={color}
            aria-pressed={customization.cupColor === color}
            onClick={() => setCustomization((c) => ({ ...c, cupColor: color }))}
          >
            {color === "pink" ? t.cupPink : t.cupBlue}
          </button>
        ))}
      </fieldset>

      <label className="block">
        {t.childNameLabel}
        <input
          type="text"
          value={customization.childName}
          onChange={(event) =>
            setCustomization((c) => ({ ...c, childName: event.target.value }))
          }
          className="mt-1 block w-full rounded border border-brown/20 p-2"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={customization.giftCard}
          onChange={(event) =>
            setCustomization((c) => ({ ...c, giftCard: event.target.checked }))
          }
        />
        {t.giftCardLabel} ({t.giftCardFree})
      </label>

      <button type="submit" className="w-full rounded-full bg-leaf py-3 text-white">
        {t.addToCart}
      </button>
    </form>
  );
}
```

- [ ] **Step 6: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add lib/cart/build-cart-item.ts lib/cart/build-cart-item.test.ts components/customize-box-form.tsx
git commit -m "feat: add box customization form and add-to-cart"
```

---

### Task 11: Cart drawer

**Files:**
- Create: `components/cart-drawer.tsx`

**Interfaces:**
- Consumes: `useCart` from `lib/cart/cart-context.tsx`; `useLocale` from
  `lib/i18n/locale-context.tsx`; `useCurrency` from `lib/currency-context.tsx`;
  `formatMoney` from `lib/currency.ts`
- Produces: `CartDrawer` component — used by `app/page.tsx` (Task 13).

- [ ] **Step 1: Write `components/cart-drawer.tsx`**

```tsx
"use client";

import { useCart } from "../lib/cart/cart-context";
import { useLocale } from "../lib/i18n/locale-context";
import { useCurrency } from "../lib/currency-context";
import { formatMoney } from "../lib/currency";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, removeItem, updateQuantity } = useCart();
  const { t } = useLocale();
  const { currency } = useCurrency();

  if (!open) return null;

  const subtotalBhd = items.reduce((sum, item) => sum + item.unitPriceBhd * item.quantity, 0);

  return (
    <aside className="fixed inset-y-0 end-0 w-full max-w-sm bg-cream p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t.cartTitle}</h2>
        <button type="button" onClick={onClose} aria-label="close cart">
          ✕
        </button>
      </div>

      {items.length === 0 ? (
        <p className="mt-8 text-brown/60">{t.cartEmpty}</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="border-b border-brown/10 pb-4">
              <p className="font-semibold">{item.customization.childName || "—"}</p>
              <p className="text-sm text-brown/60">
                {formatMoney(item.unitPriceBhd, currency)}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) =>
                    updateQuantity(item.id, Number(event.target.value) || 1)
                  }
                  className="w-16 rounded border border-brown/20 p-1"
                />
                <button type="button" onClick={() => removeItem(item.id)}>
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <p className="mt-6 font-semibold">{formatMoney(subtotalBhd, currency)}</p>
      )}
    </aside>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add components/cart-drawer.tsx
git commit -m "feat: add cart drawer"
```

---

### Task 12: Footer (placeholder)

**Files:**
- Create: `components/footer.tsx`

**Interfaces:**
- Consumes: `useLocale` from `lib/i18n/locale-context.tsx`
- Produces: `Footer` component — used by `app/page.tsx` (Task 13). Newsletter signup is
  added to this component in Plan 2 — this task only lays out the static footer.

- [ ] **Step 1: Write `components/footer.tsx`**

```tsx
"use client";

import { useLocale } from "../lib/i18n/locale-context";

export function Footer() {
  const { locale } = useLocale();
  return (
    <footer className="bg-brown px-6 py-10 text-center text-cream">
      <p className="text-xl font-bold">Peep &amp; beyond</p>
      <p className="mt-2 text-sm text-cream/70">
        {locale === "ar"
          ? "عالم صغير… يمتد بالخيال إلى ما هو أبعد."
          : "A small world… that stretches with imagination beyond."}
      </p>
      <a href="https://instagram.com/peepandbeyond" className="mt-4 block text-sm">
        @peepandbeyond
      </a>
      <p className="mt-6 text-xs text-cream/50">
        Peep &amp; beyond by Khadija AbdulRasool © 2026
      </p>
    </footer>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add components/footer.tsx
git commit -m "feat: add static footer"
```

---

### Task 13: Assemble the landing page and manually verify end-to-end

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: every component and provider produced in Tasks 1–12.
- Produces: a fully working landing page — the deliverable of this plan.

- [ ] **Step 1: Rewrite `app/layout.tsx` to wrap providers**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "../lib/i18n/locale-context";
import { CurrencyProvider } from "../lib/currency-context";
import { CartProvider } from "../lib/cart/cart-context";

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
            <CartProvider>{children}</CartProvider>
          </CurrencyProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Rewrite `app/page.tsx` to assemble the landing page**

```tsx
"use client";

import { useState } from "react";
import { Header } from "../components/header";
import { Hero } from "../components/hero";
import { TrustBadges } from "../components/trust-badges";
import { ThreeMoments } from "../components/three-moments";
import { CustomizeBoxForm } from "../components/customize-box-form";
import { CartDrawer } from "../components/cart-drawer";
import { Footer } from "../components/footer";

export default function HomePage() {
  const [showCustomize, setShowCustomize] = useState(false);
  const [showCart, setShowCart] = useState(false);

  return (
    <>
      <Header onCartClick={() => setShowCart(true)} />
      <main>
        <Hero onOrderClick={() => setShowCustomize(true)} />
        <TrustBadges />
        <ThreeMoments />
        <section id="inside" className="px-6 py-10 text-center">
          <button
            type="button"
            onClick={() => setShowCustomize(true)}
            className="rounded-full bg-leaf px-6 py-3 text-white"
          >
            جهّز بوكسك
          </button>
        </section>
      </main>
      <Footer />

      {showCustomize && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-cream">
            <CustomizeBoxForm onDone={() => setShowCustomize(false)} />
          </div>
        </div>
      )}

      <CartDrawer open={showCart} onClose={() => setShowCart(false)} />
    </>
  );
}
```

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all tests pass (currency, product, cart-storage, cart-context, dictionaries,
build-cart-item).

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 5: Manual browser verification**

Run: `npm run dev`, then use the browser tool to visit `http://localhost:3000` and verify:
- The hero, trust badges, "3 moments", and footer render.
- Clicking the language toggle switches all visible text to English and flips the page to
  LTR (check `<html dir>` via the accessibility tree or console).
- Clicking the currency toggle changes the displayed price from `21.900 د.ب` to a `$`
  amount.
- Clicking "اطلب الآن" / "جهّز بوكسك" opens the customization form; filling it in and
  submitting closes the form and increments the cart icon's count.
- Opening the cart shows the added item with the correct name/price, and quantity/remove
  controls work.
- Reloading the page preserves the cart contents (localStorage persistence).

Stop the dev server after confirming.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/layout.tsx
git commit -m "feat: assemble landing page with header, hero, customize form, and cart"
```

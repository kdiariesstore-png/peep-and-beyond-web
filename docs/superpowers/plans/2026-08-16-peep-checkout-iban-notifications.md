# Peep & Beyond — Checkout, IBAN Payment, and Order Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a guest checkout that reliably completes an order via bank transfer (IBAN),
emails the owner every order (with the uploaded receipt attached), gives the customer an
email confirmation plus a one-tap WhatsApp confirmation link for the owner, and lets both
buyers and site visitors opt into a marketing email list — all without any login. This is
the direct fix for the original bug: the old prototype's checkout died with
`POST /api/orders → 502 {"error":"Not authenticated"}` because it silently required a
logged-in session.

**Architecture:** Builds directly on Plan 1's storefront (cart, i18n, currency, product).
Adds a `/checkout` page, a Next.js Route Handler (`app/api/orders/iban/route.ts`) that
receives the order as `multipart/form-data` (buyer JSON + cart JSON + receipt file), and a
`/order/confirmation` page. Order emails are built by pure, unit-tested functions and sent
through a thin Resend wrapper. Oreem is visible as a payment option but disabled
("قريبًا") — Plan 3 wires it up. Also adds the one piece of persistent state in this
project: a Vercel KV counter per story language (Arabic/English), since the owner has a
limited printed run (25 copies each) and orders past that threshold must be flagged as
pre-orders rather than blocked.

**Tech Stack:** Same as Plan 1 (Next.js 14, TypeScript, Tailwind, Vitest), plus `resend`
(already in `package.json` from Plan 1) for transactional email and marketing audience
management, and `@vercel/kv` for the story-language stock counter.

## Global Constraints

- No user accounts/login — guest checkout only. (Spec §3, §8)
- Bahrain shipping is a hardcoded flat 2.000 BHD; other countries use a rate table the
  owner fills in later, defaulting to "quoted after we contact you" until set. (Spec §7)
- Peep Box price stays 21.900 BHD (confirmed current/correct by the owner — it's a launch
  price that may change later, so it's kept as a single easy-to-edit constant in
  `lib/product.ts` from Plan 1). Cup colors are pink and blue (confirmed correct, matching
  the live prototype) — not pink/yellow, despite what an earlier internal inventory
  spreadsheet suggested; the owner explicitly confirmed pink/blue with counts blue=4,
  pink=5. No PayPal payment option (owner confirmed IBAN + Oreem only).
- Story-language stock: 25 Arabic + 25 English copies. Once a language's stock reaches zero
  (or goes negative from continued orders), orders for that language are still accepted but
  flagged as a pre-order with a "takes more than 10 days" note shown to the customer and
  included in the owner's order email — never a hard block on checkout. (Owner's explicit
  instruction, 2026-08-16.)
- Every successful order (any payment method) emails the owner the full order details; for
  IBAN, the receipt image is attached. (Spec §2, §8.1)
- Every successful order also emails the customer directly, plus gives the owner a one-tap
  `wa.me` link (pre-filled, not automatic) to send a WhatsApp confirmation to the customer —
  this is *not* fully automatic WhatsApp delivery; that requires a real WhatsApp Business
  API account, which is out of scope. (Spec §8.3)
- Checkout has an unchecked-by-default marketing opt-in checkbox; the footer has a separate
  newsletter signup box. Both add an email to the Resend Audience — no password, no login.
  (Spec §9)
- `RESEND_API_KEY` (and later `RESEND_AUDIENCE_ID`, `OWNER_NOTIFICATION_EMAIL`) are supplied
  as environment variables in `.env.local` (already git-ignored) — never hardcoded, never
  committed.
- Every server-side failure must show the customer a specific, friendly retry message —
  never a raw 502 or stack trace, and never silently drop the order. (Spec §9)

---

### Task 1: Shipping rate table and lookup

**Files:**
- Create: `lib/shipping-rates.ts`
- Test: `lib/shipping-rates.test.ts`

**Interfaces:**
- Produces: `getShippingRate(countryCode: string): number | null` (returns `null` when the
  rate isn't set yet, meaning "quote later") — used by the order total calculator (Task 2).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { getShippingRate } from "./shipping-rates";

describe("getShippingRate", () => {
  it("returns the flat 2.000 BHD rate for Bahrain", () => {
    expect(getShippingRate("BH")).toBe(2.0);
  });

  it("returns null for a country with no rate set yet", () => {
    expect(getShippingRate("SA")).toBeNull();
  });

  it("returns null for a completely unmapped country code", () => {
    expect(getShippingRate("ZZ")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/shipping-rates.test.ts`
Expected: FAIL — `Cannot find module './shipping-rates'`.

- [ ] **Step 3: Write `lib/shipping-rates.ts`**

```ts
/**
 * Country code -> flat shipping price in BHD.
 * `null` means "no rate set yet" -> checkout shows a "quoted after we contact you" message.
 * The owner will supply real international rates once the box's shipping weight is known.
 */
const SHIPPING_RATES: Record<string, number | null> = {
  BH: 2.0,
  SA: null,
  AE: null,
  KW: null,
  OM: null,
  QA: null,
  GB: null,
  US: null,
};

export function getShippingRate(countryCode: string): number | null {
  return SHIPPING_RATES[countryCode] ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/shipping-rates.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/shipping-rates.ts lib/shipping-rates.test.ts
git commit -m "feat: add shipping rate table with Bahrain flat rate"
```

---

### Task 2: Order total calculator

**Files:**
- Create: `lib/order/order-total.ts`
- Test: `lib/order/order-total.test.ts`

**Interfaces:**
- Consumes: `CartItem` from `lib/types.ts`; `getShippingRate` from `lib/shipping-rates.ts`
- Produces: `OrderTotal` type (`{ subtotalBhd: number, shippingBhd: number | null,
  totalBhd: number | null }`), `calculateOrderTotal(items: CartItem[], countryCode:
  string): OrderTotal` — used by the checkout page (Task 6), IBAN route (Task 9), and
  Plan 3's Oreem route.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { calculateOrderTotal } from "./order-total";
import type { CartItem } from "../types";

const item: CartItem = {
  id: "1",
  customization: {
    storyLanguage: "ar",
    cardLanguage: "ar",
    cupColor: "pink",
    childName: "سارة",
    giftCard: false,
  },
  unitPriceBhd: 21.9,
  quantity: 2,
};

describe("calculateOrderTotal", () => {
  it("computes subtotal, shipping, and total for Bahrain", () => {
    const result = calculateOrderTotal([item], "BH");
    expect(result.subtotalBhd).toBe(43.8);
    expect(result.shippingBhd).toBe(2.0);
    expect(result.totalBhd).toBe(45.8);
  });

  it("returns null shipping and total for a country with no rate yet", () => {
    const result = calculateOrderTotal([item], "SA");
    expect(result.subtotalBhd).toBe(43.8);
    expect(result.shippingBhd).toBeNull();
    expect(result.totalBhd).toBeNull();
  });

  it("returns a zero subtotal for an empty cart", () => {
    const result = calculateOrderTotal([], "BH");
    expect(result.subtotalBhd).toBe(0);
    expect(result.totalBhd).toBe(2.0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/order/order-total.test.ts`
Expected: FAIL — `Cannot find module './order-total'`.

- [ ] **Step 3: Write `lib/order/order-total.ts`**

```ts
import type { CartItem } from "../types";
import { getShippingRate } from "../shipping-rates";

export interface OrderTotal {
  subtotalBhd: number;
  shippingBhd: number | null;
  totalBhd: number | null;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function calculateOrderTotal(items: CartItem[], countryCode: string): OrderTotal {
  const subtotalBhd = round3(
    items.reduce((sum, item) => sum + item.unitPriceBhd * item.quantity, 0)
  );
  const shippingBhd = getShippingRate(countryCode);
  const totalBhd = shippingBhd === null ? null : round3(subtotalBhd + shippingBhd);
  return { subtotalBhd, shippingBhd, totalBhd };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/order/order-total.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/order/order-total.ts lib/order/order-total.test.ts
git commit -m "feat: add order total calculator with per-country shipping"
```

---

### Task 3: Order confirmation email content builder

**Files:**
- Create: `lib/email/order-notification-email.ts`
- Test: `lib/email/order-notification-email.test.ts`

**Interfaces:**
- Consumes: `BuyerDetails`, `CartItem`, `PaymentMethod` from `lib/types.ts`
- Produces: `OrderEmailData` type, `buildOrderEmailSubject(data): string`,
  `buildOrderEmailHtml(data): string` — used by the Resend wrapper (Task 4) and the
  customer confirmation email (Task 8).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildOrderEmailHtml, buildOrderEmailSubject, type OrderEmailData } from "./order-notification-email";

const data: OrderEmailData = {
  buyer: {
    fullName: "سارة أحمد",
    email: "sara@example.com",
    phone: "33001122",
    country: "BH",
    city: "المنامة",
    address: "شارع 10، مبنى 5",
    preferredContact: "email",
    marketingOptIn: true,
  },
  items: [
    {
      id: "1",
      customization: {
        storyLanguage: "ar",
        cardLanguage: "ar",
        cupColor: "pink",
        childName: "سارة",
        giftCard: false,
      },
      unitPriceBhd: 21.9,
      quantity: 1,
    },
  ],
  subtotalBhd: 21.9,
  shippingBhd: 2.0,
  totalBhd: 23.9,
  paymentMethod: "iban",
};

describe("buildOrderEmailSubject", () => {
  it("includes the buyer's name", () => {
    expect(buildOrderEmailSubject(data)).toContain("سارة أحمد");
  });
});

describe("buildOrderEmailHtml", () => {
  it("includes buyer contact details, items, and totals", () => {
    const html = buildOrderEmailHtml(data);
    expect(html).toContain("sara@example.com");
    expect(html).toContain("33001122");
    expect(html).toContain("23.900");
    expect(html).toContain("تحويل بنكي");
  });

  it("shows 'to be confirmed' when shipping is unknown", () => {
    const html = buildOrderEmailHtml({ ...data, shippingBhd: null, totalBhd: null });
    expect(html).toContain("يُحدَّد لاحقًا");
  });

  it("includes the Oreem transaction reference when provided", () => {
    const html = buildOrderEmailHtml({
      ...data,
      paymentMethod: "oreem",
      oreemTransactionReference: "TXN-123",
    });
    expect(html).toContain("TXN-123");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/email/order-notification-email.test.ts`
Expected: FAIL — `Cannot find module './order-notification-email'`.

- [ ] **Step 3: Write `lib/email/order-notification-email.ts`**

```ts
import type { BuyerDetails, CartItem, PaymentMethod } from "../types";

export interface OrderEmailData {
  buyer: BuyerDetails;
  items: CartItem[];
  subtotalBhd: number;
  shippingBhd: number | null;
  totalBhd: number | null;
  paymentMethod: PaymentMethod;
  oreemTransactionReference?: string;
}

export function buildOrderEmailSubject(data: OrderEmailData): string {
  return `طلب جديد من ${data.buyer.fullName} — بوكس بيب`;
}

function describeItem(item: CartItem): string {
  const langLabel = item.customization.storyLanguage === "ar" ? "العربية" : "English";
  const cupLabel = item.customization.cupColor === "pink" ? "وردي" : "أزرق";
  return `بوكس بيب الكامل × ${item.quantity} — ${item.customization.childName || "بدون اسم"} · ${langLabel} · ${cupLabel}`;
}

export function buildOrderEmailHtml(data: OrderEmailData): string {
  const itemsHtml = data.items.map((item) => `<li>${describeItem(item)}</li>`).join("");
  const shippingText =
    data.shippingBhd === null ? "يُحدَّد لاحقًا" : `${data.shippingBhd.toFixed(3)} د.ب`;
  const totalText =
    data.totalBhd === null ? "يُحدَّد لاحقًا" : `${data.totalBhd.toFixed(3)} د.ب`;
  const paymentText =
    data.paymentMethod === "iban"
      ? "تحويل بنكي (IBAN)"
      : `أوريم${data.oreemTransactionReference ? ` — مرجع: ${data.oreemTransactionReference}` : ""}`;

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif;">
      <h2>طلب جديد</h2>
      <p><strong>الاسم:</strong> ${data.buyer.fullName}</p>
      <p><strong>الإيميل:</strong> ${data.buyer.email}</p>
      <p><strong>الهاتف:</strong> ${data.buyer.phone}</p>
      <p><strong>العنوان:</strong> ${data.buyer.address}, ${data.buyer.city}, ${data.buyer.country}</p>
      <p><strong>طريقة الدفع:</strong> ${paymentText}</p>
      <h3>تفاصيل الطلب</h3>
      <ul>${itemsHtml}</ul>
      <p><strong>المجموع الفرعي:</strong> ${data.subtotalBhd.toFixed(3)} د.ب</p>
      <p><strong>الشحن:</strong> ${shippingText}</p>
      <p><strong>الإجمالي:</strong> ${totalText}</p>
    </div>
  `;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/email/order-notification-email.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/email/order-notification-email.ts lib/email/order-notification-email.test.ts
git commit -m "feat: add order notification email content builder"
```

---

### Task 4: WhatsApp confirmation link builder

**Files:**
- Create: `lib/email/whatsapp-link.ts`
- Test: `lib/email/whatsapp-link.test.ts`

**Interfaces:**
- Consumes: `OrderEmailData` from `lib/email/order-notification-email.ts`
- Produces: `buildWhatsappConfirmationLink(data: OrderEmailData): string` — used by the
  Resend wrapper (Task 5) to include in the owner's notification email.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildWhatsappConfirmationLink } from "./whatsapp-link";
import type { OrderEmailData } from "./order-notification-email";

const data: OrderEmailData = {
  buyer: {
    fullName: "سارة أحمد",
    email: "sara@example.com",
    phone: "+973 3300 1122",
    country: "BH",
    city: "المنامة",
    address: "شارع 10",
    preferredContact: "whatsapp",
    marketingOptIn: false,
  },
  items: [],
  subtotalBhd: 21.9,
  shippingBhd: 2.0,
  totalBhd: 23.9,
  paymentMethod: "iban",
};

describe("buildWhatsappConfirmationLink", () => {
  it("strips non-digit characters from the phone number", () => {
    const link = buildWhatsappConfirmationLink(data);
    expect(link).toContain("https://wa.me/9733001122");
  });

  it("url-encodes the pre-filled message text", () => {
    const link = buildWhatsappConfirmationLink(data);
    expect(link).toContain("text=");
    expect(link).not.toContain(" ");
  });

  it("shows 'to be confirmed' in the message when the total is unknown", () => {
    const link = buildWhatsappConfirmationLink({ ...data, totalBhd: null });
    const decoded = decodeURIComponent(link);
    expect(decoded).toContain("سيتم تأكيده لاحقًا");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/email/whatsapp-link.test.ts`
Expected: FAIL — `Cannot find module './whatsapp-link'`.

- [ ] **Step 3: Write `lib/email/whatsapp-link.ts`**

```ts
import type { OrderEmailData } from "./order-notification-email";

export function buildWhatsappConfirmationLink(data: OrderEmailData): string {
  const phone = data.buyer.phone.replace(/[^0-9]/g, "");
  const totalText =
    data.totalBhd === null ? "سيتم تأكيده لاحقًا" : `${data.totalBhd.toFixed(3)} د.ب`;
  const message = [
    `مرحبًا ${data.buyer.fullName}،`,
    `تم استلام طلبك من Peep & beyond.`,
    `الإجمالي: ${totalText}`,
    `شكرًا لتسوقك معنا! 🌿`,
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/email/whatsapp-link.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/email/whatsapp-link.ts lib/email/whatsapp-link.test.ts
git commit -m "feat: add WhatsApp confirmation link builder"
```

---

### Task 5: Resend email client wrapper

**Files:**
- Create: `lib/email/resend-client.ts`
- Test: `lib/email/resend-client.test.ts`
- Modify: `.env.local` (add placeholders — see Step 6)

**Interfaces:**
- Consumes: `OrderEmailData` from `lib/email/order-notification-email.ts`;
  `buildOrderEmailHtml`, `buildOrderEmailSubject` from the same file;
  `buildWhatsappConfirmationLink` from `lib/email/whatsapp-link.ts`
- Produces: `sendOrderNotificationEmail(params: SendOrderNotificationParams): Promise<void>`,
  `sendCustomerConfirmationEmail(data: OrderEmailData): Promise<void>`,
  `addToMarketingAudience(email: string): Promise<void>` — used by the IBAN route (Task 9),
  the newsletter route (Task 11), and Plan 3's Oreem confirmation page.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const sendMock = vi.fn().mockResolvedValue({ data: { id: "email_1" }, error: null });
const contactsCreateMock = vi.fn().mockResolvedValue({ data: { id: "contact_1" }, error: null });

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: sendMock },
    contacts: { create: contactsCreateMock },
  })),
}));

import {
  sendOrderNotificationEmail,
  sendCustomerConfirmationEmail,
  addToMarketingAudience,
} from "./resend-client";
import type { OrderEmailData } from "./order-notification-email";

const data: OrderEmailData = {
  buyer: {
    fullName: "سارة أحمد",
    email: "sara@example.com",
    phone: "33001122",
    country: "BH",
    city: "المنامة",
    address: "شارع 10",
    preferredContact: "email",
    marketingOptIn: true,
  },
  items: [],
  subtotalBhd: 21.9,
  shippingBhd: 2.0,
  totalBhd: 23.9,
  paymentMethod: "iban",
};

beforeEach(() => {
  sendMock.mockClear();
  contactsCreateMock.mockClear();
  process.env.RESEND_API_KEY = "test-key";
  process.env.OWNER_NOTIFICATION_EMAIL = "owner@example.com";
  process.env.RESEND_AUDIENCE_ID = "audience-1";
});

describe("sendOrderNotificationEmail", () => {
  it("sends to the owner's email with subject and html", async () => {
    await sendOrderNotificationEmail({ data });
    expect(sendMock).toHaveBeenCalledTimes(1);
    const call = sendMock.mock.calls[0][0];
    expect(call.to).toBe("owner@example.com");
    expect(call.subject).toContain("سارة أحمد");
  });

  it("attaches the receipt when provided", async () => {
    await sendOrderNotificationEmail({
      data,
      receiptAttachment: { filename: "receipt.png", content: Buffer.from("fake") },
    });
    const call = sendMock.mock.calls[0][0];
    expect(call.attachments[0].filename).toBe("receipt.png");
  });
});

describe("sendCustomerConfirmationEmail", () => {
  it("sends to the buyer's own email", async () => {
    await sendCustomerConfirmationEmail(data);
    const call = sendMock.mock.calls[0][0];
    expect(call.to).toBe("sara@example.com");
  });
});

describe("addToMarketingAudience", () => {
  it("creates a contact in the configured audience", async () => {
    await addToMarketingAudience("new@example.com");
    expect(contactsCreateMock).toHaveBeenCalledWith({
      email: "new@example.com",
      audienceId: "audience-1",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/email/resend-client.test.ts`
Expected: FAIL — `Cannot find module './resend-client'`.

- [ ] **Step 3: Write `lib/email/resend-client.ts`**

```ts
import { Resend } from "resend";
import {
  buildOrderEmailHtml,
  buildOrderEmailSubject,
  type OrderEmailData,
} from "./order-notification-email";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "orders@peepandbeyond.com";
}

export interface SendOrderNotificationParams {
  data: OrderEmailData;
  receiptAttachment?: { filename: string; content: Buffer };
}

export async function sendOrderNotificationEmail(
  params: SendOrderNotificationParams
): Promise<void> {
  const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL;
  if (!ownerEmail) throw new Error("OWNER_NOTIFICATION_EMAIL is not set");

  const resend = getResendClient();
  const { data, receiptAttachment } = params;
  await resend.emails.send({
    from: getFromAddress(),
    to: ownerEmail,
    subject: buildOrderEmailSubject(data),
    html: buildOrderEmailHtml(data),
    attachments: receiptAttachment
      ? [{ filename: receiptAttachment.filename, content: receiptAttachment.content }]
      : undefined,
  });
}

export async function sendCustomerConfirmationEmail(data: OrderEmailData): Promise<void> {
  const resend = getResendClient();
  await resend.emails.send({
    from: getFromAddress(),
    to: data.buyer.email,
    subject: "تم استلام طلبك من Peep & beyond",
    html: buildOrderEmailHtml(data),
  });
}

export async function addToMarketingAudience(email: string): Promise<void> {
  const resend = getResendClient();
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) throw new Error("RESEND_AUDIENCE_ID is not set");
  await resend.contacts.create({ email, audienceId });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/email/resend-client.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Run the full test suite to confirm nothing else broke**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 6: Add placeholder environment variable names to `.env.local`**

Open `.env.local` (already git-ignored) and append these lines if not already present,
leaving real values blank until the owner supplies them:

```
RESEND_API_KEY=
RESEND_FROM_EMAIL=orders@peepandbeyond.com
RESEND_AUDIENCE_ID=
OWNER_NOTIFICATION_EMAIL=k.diaries.store@gmail.com
```

This file must never be committed — confirm with `git status` that `.env.local` still
shows as ignored, not staged.

- [ ] **Step 7: Commit (code only, never `.env.local`)**

```bash
git add lib/email/resend-client.ts lib/email/resend-client.test.ts
git commit -m "feat: add Resend email client wrapper for orders and marketing audience"
```

---

### Task 6: Checkout buyer form component

**Files:**
- Create: `components/checkout/buyer-form.tsx`

**Interfaces:**
- Consumes: `BuyerDetails` from `lib/types.ts`; `useLocale` from
  `lib/i18n/locale-context.tsx`
- Produces: `BuyerForm` component with props
  `{ value: BuyerDetails, onChange: (value: BuyerDetails) => void }` — a controlled form
  used by the checkout page (Task 8).

- [ ] **Step 1: Write `components/checkout/buyer-form.tsx`**

```tsx
"use client";

import type { BuyerDetails } from "../../lib/types";

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

export function BuyerForm({
  value,
  onChange,
}: {
  value: BuyerDetails;
  onChange: (value: BuyerDetails) => void;
}) {
  function update<K extends keyof BuyerDetails>(key: K, fieldValue: BuyerDetails[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-bold">بيانات الطلب</legend>

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
        رقم الهاتف
        <input
          required
          type="tel"
          value={value.phone}
          onChange={(e) => update("phone", e.target.value)}
          className="mt-1 block w-full rounded border border-brown/20 p-2"
        />
      </label>

      <label className="block">
        دولة التوصيل
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

      <label className="block">
        المدينة / المحافظة
        <input
          required
          type="text"
          value={value.city}
          onChange={(e) => update("city", e.target.value)}
          className="mt-1 block w-full rounded border border-brown/20 p-2"
        />
      </label>

      <label className="block">
        عنوان التوصيل بالتفصيل
        <textarea
          required
          value={value.address}
          onChange={(e) => update("address", e.target.value)}
          className="mt-1 block w-full rounded border border-brown/20 p-2"
        />
      </label>

      <fieldset>
        <legend>أين تفضل استلام الفاتورة وتحديثات الشحن؟</legend>
        {(["email", "whatsapp"] as const).map((channel) => (
          <button
            type="button"
            key={channel}
            aria-pressed={value.preferredContact === channel}
            onClick={() => update("preferredContact", channel)}
          >
            {channel === "email" ? "البريد الإلكتروني" : "الواتساب"}
          </button>
        ))}
      </fieldset>

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

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add components/checkout/buyer-form.tsx
git commit -m "feat: add checkout buyer details form"
```

---

### Task 7: Receipt file validation

**Files:**
- Create: `lib/order/validate-receipt.ts`
- Test: `lib/order/validate-receipt.test.ts`

**Interfaces:**
- Produces: `ALLOWED_RECEIPT_TYPES: string[]`, `MAX_RECEIPT_BYTES: number`,
  `validateReceiptFile(file: { type: string; size: number } | null): { valid: boolean;
  error?: string }` — used by the payment method selector (Task 8, client-side check) and
  the IBAN route (Task 9, server-side check — the same rules must hold on both sides).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { validateReceiptFile, MAX_RECEIPT_BYTES } from "./validate-receipt";

describe("validateReceiptFile", () => {
  it("rejects a missing file", () => {
    expect(validateReceiptFile(null)).toEqual({ valid: false, error: "receipt_required" });
  });

  it("rejects an unsupported file type", () => {
    expect(validateReceiptFile({ type: "text/plain", size: 100 })).toEqual({
      valid: false,
      error: "receipt_invalid_type",
    });
  });

  it("rejects a file over the size limit", () => {
    expect(
      validateReceiptFile({ type: "image/png", size: MAX_RECEIPT_BYTES + 1 })
    ).toEqual({ valid: false, error: "receipt_too_large" });
  });

  it("accepts a valid png under the size limit", () => {
    expect(validateReceiptFile({ type: "image/png", size: 1000 })).toEqual({ valid: true });
  });

  it("accepts a valid pdf", () => {
    expect(
      validateReceiptFile({ type: "application/pdf", size: 1000 })
    ).toEqual({ valid: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/order/validate-receipt.test.ts`
Expected: FAIL — `Cannot find module './validate-receipt'`.

- [ ] **Step 3: Write `lib/order/validate-receipt.ts`**

```ts
export const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const MAX_RECEIPT_BYTES = 8 * 1024 * 1024;

export interface ReceiptValidationResult {
  valid: boolean;
  error?: "receipt_required" | "receipt_invalid_type" | "receipt_too_large";
}

export function validateReceiptFile(
  file: { type: string; size: number } | null
): ReceiptValidationResult {
  if (!file) return { valid: false, error: "receipt_required" };
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    return { valid: false, error: "receipt_invalid_type" };
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    return { valid: false, error: "receipt_too_large" };
  }
  return { valid: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/order/validate-receipt.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/order/validate-receipt.ts lib/order/validate-receipt.test.ts
git commit -m "feat: add IBAN receipt file validation"
```

---

### Task 8: Payment method selector + checkout page assembly

**Files:**
- Create: `components/checkout/payment-method-selector.tsx`
- Create: `app/checkout/page.tsx`
- Modify: `components/footer.tsx` (add newsletter signup — see Task 11 for the API route
  this posts to; this task only builds the UI wiring)

**Interfaces:**
- Consumes: `BuyerForm` from Task 6; `validateReceiptFile` from Task 7;
  `calculateOrderTotal` from Task 2; `useCart` from `lib/cart/cart-context.tsx`;
  `formatMoney` from `lib/currency.ts`; `useCurrency` from `lib/currency-context.tsx`
- Produces: `PaymentMethodSelector` component; the `/checkout` route — the deliverable of
  this task, submits to the IBAN API route built in Task 9.

- [ ] **Step 1: Write `components/checkout/payment-method-selector.tsx`**

```tsx
"use client";

import type { PaymentMethod } from "../../lib/types";

export function PaymentMethodSelector({
  value,
  onChange,
  receiptError,
  onReceiptChange,
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  receiptError: string | null;
  onReceiptChange: (file: File | null) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-lg font-bold">طريقة الدفع</legend>

      <button
        type="button"
        aria-pressed={value === "iban"}
        onClick={() => onChange("iban")}
        className="block w-full rounded border border-brown/20 p-4 text-start"
      >
        <strong>تحويل بنكي (IBAN)</strong>
        <p className="text-sm text-brown/70">
          حوّل إلى BH04BBKU00200004090874 ثم أرفق الإيصال.
        </p>
      </button>

      {value === "iban" && (
        <label className="block">
          صورة إيصال التحويل (إلزامي — JPG أو PNG أو WebP أو PDF، بحد أقصى 8MB)
          <input
            required
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => onReceiptChange(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full"
          />
          {receiptError && <p className="text-sm text-red-600">{receiptError}</p>}
        </label>
      )}

      <button
        type="button"
        aria-pressed={value === "oreem"}
        disabled
        title="قريبًا"
        className="block w-full rounded border border-brown/20 p-4 text-start opacity-50"
      >
        <strong>بطاقة عبر أوريم (قريبًا)</strong>
        <p className="text-sm text-brown/70">بيئة اختبار آمنة لبطاقات Benefit وVisa وMastercard.</p>
      </button>
    </fieldset>
  );
}
```

- [ ] **Step 2: Write `app/checkout/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../lib/cart/cart-context";
import { useCurrency } from "../../lib/currency-context";
import { formatMoney } from "../../lib/currency";
import { calculateOrderTotal } from "../../lib/order/order-total";
import { validateReceiptFile } from "../../lib/order/validate-receipt";
import { BuyerForm } from "../../components/checkout/buyer-form";
import { PaymentMethodSelector } from "../../components/checkout/payment-method-selector";
import type { BuyerDetails, PaymentMethod } from "../../lib/types";

const EMPTY_BUYER: BuyerDetails = {
  fullName: "",
  email: "",
  phone: "",
  country: "BH",
  city: "",
  address: "",
  preferredContact: "email",
  marketingOptIn: false,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear } = useCart();
  const { currency } = useCurrency();
  const [buyer, setBuyer] = useState<BuyerDetails>(EMPTY_BUYER);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("iban");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { subtotalBhd, shippingBhd, totalBhd } = calculateOrderTotal(items, buyer.country);

  function handleReceiptChange(file: File | null) {
    setReceipt(file);
    if (file) {
      const result = validateReceiptFile({ type: file.type, size: file.size });
      setReceiptError(result.valid ? null : (result.error ?? null));
    } else {
      setReceiptError(null);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    if (paymentMethod === "iban") {
      const result = validateReceiptFile(receipt ? { type: receipt.type, size: receipt.size } : null);
      if (!result.valid) {
        setReceiptError(result.error ?? "receipt_required");
        return;
      }

      const formData = new FormData();
      formData.set("buyer", JSON.stringify(buyer));
      formData.set("items", JSON.stringify(items));
      formData.set("receipt", receipt as File);

      setSubmitting(true);
      try {
        const response = await fetch("/api/orders/iban", { method: "POST", body: formData });
        if (!response.ok) {
          setSubmitError("تعذر إرسال الطلب. حاول مرة أخرى.");
          return;
        }
        clear();
        router.push("/order/confirmation?method=iban");
      } catch {
        setSubmitError("تعذر إرسال الطلب. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.");
      } finally {
        setSubmitting(false);
      }
    }
  }

  return (
    <main className="mx-auto grid max-w-4xl gap-8 p-6 md:grid-cols-2">
      <form onSubmit={handleSubmit} className="space-y-6">
        <BuyerForm value={buyer} onChange={setBuyer} />
        <PaymentMethodSelector
          value={paymentMethod}
          onChange={setPaymentMethod}
          receiptError={receiptError}
          onReceiptChange={handleReceiptChange}
        />
        {submitError && <p className="text-red-600">{submitError}</p>}
        <button
          type="submit"
          disabled={submitting || items.length === 0}
          className="w-full rounded-full bg-leaf py-3 text-white disabled:opacity-50"
        >
          تأكيد الطلب
        </button>
      </form>

      <aside className="rounded-xl bg-white/60 p-6">
        <h2 className="text-lg font-bold">ملخص الطلب</h2>
        <p className="mt-4">{formatMoney(subtotalBhd, currency)}</p>
        <p className="text-sm text-brown/70">
          الشحن: {shippingBhd === null ? "يُحدَّد لاحقًا" : formatMoney(shippingBhd, currency)}
        </p>
        <p className="mt-2 font-semibold">
          الإجمالي: {totalBhd === null ? "يُحدَّد لاحقًا" : formatMoney(totalBhd, currency)}
        </p>
      </aside>
    </main>
  );
}
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add components/checkout/payment-method-selector.tsx app/checkout/page.tsx
git commit -m "feat: add checkout page with buyer form and payment method selection"
```

---

### Task 9: IBAN order API route

**Files:**
- Create: `app/api/orders/iban/route.ts`

**Interfaces:**
- Consumes: `calculateOrderTotal` from `lib/order/order-total.ts`; `validateReceiptFile`
  from `lib/order/validate-receipt.ts`; `sendOrderNotificationEmail`,
  `sendCustomerConfirmationEmail`, `addToMarketingAudience` from
  `lib/email/resend-client.ts`; `BuyerDetails`, `CartItem` from `lib/types.ts`
- Produces: `POST /api/orders/iban` — consumed by the checkout page (Task 8).

- [ ] **Step 1: Write `app/api/orders/iban/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { calculateOrderTotal } from "../../../../lib/order/order-total";
import { validateReceiptFile } from "../../../../lib/order/validate-receipt";
import {
  sendOrderNotificationEmail,
  sendCustomerConfirmationEmail,
  addToMarketingAudience,
} from "../../../../lib/email/resend-client";
import type { BuyerDetails, CartItem } from "../../../../lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const buyerJson = formData.get("buyer");
  const itemsJson = formData.get("items");
  const receipt = formData.get("receipt");

  if (typeof buyerJson !== "string" || typeof itemsJson !== "string") {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const receiptFile = receipt instanceof File ? receipt : null;
  const receiptCheck = validateReceiptFile(
    receiptFile ? { type: receiptFile.type, size: receiptFile.size } : null
  );
  if (!receiptCheck.valid) {
    return NextResponse.json({ error: receiptCheck.error }, { status: 400 });
  }

  const buyer = JSON.parse(buyerJson) as BuyerDetails;
  const items = JSON.parse(itemsJson) as CartItem[];
  const { subtotalBhd, shippingBhd, totalBhd } = calculateOrderTotal(items, buyer.country);

  const receiptBuffer = Buffer.from(await (receiptFile as File).arrayBuffer());
  const emailData = {
    buyer,
    items,
    subtotalBhd,
    shippingBhd,
    totalBhd,
    paymentMethod: "iban" as const,
  };

  try {
    await sendOrderNotificationEmail({
      data: emailData,
      receiptAttachment: {
        filename: (receiptFile as File).name || "receipt",
        content: receiptBuffer,
      },
    });
  } catch (error) {
    console.error("Failed to send IBAN order notification email", error);
    return NextResponse.json({ error: "email_failed" }, { status: 502 });
  }

  try {
    await sendCustomerConfirmationEmail(emailData);
  } catch (error) {
    console.error("Failed to send customer confirmation email", error);
  }

  if (buyer.marketingOptIn) {
    try {
      await addToMarketingAudience(buyer.email);
    } catch (error) {
      console.error("Failed to add buyer to marketing audience", error);
    }
  }

  return NextResponse.json({ status: "received" });
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/api/orders/iban/route.ts
git commit -m "feat: add IBAN order API route with owner/customer emails"
```

---

### Task 10: Order confirmation page (IBAN success state)

**Files:**
- Create: `app/order/confirmation/page.tsx`

**Interfaces:**
- Consumes: nothing new — reads its own `searchParams`
- Produces: the `/order/confirmation` route — the deliverable of this task. Plan 3 extends
  this same file to also handle the Oreem return flow, so keep the IBAN branch cleanly
  separated (an early `if (method === "iban")` return) so it's easy to add the Oreem branch
  alongside it later.

- [ ] **Step 1: Write `app/order/confirmation/page.tsx`**

```tsx
interface ConfirmationPageProps {
  searchParams: { method?: string };
}

export default function OrderConfirmationPage({ searchParams }: ConfirmationPageProps) {
  if (searchParams.method === "iban") {
    return (
      <main className="mx-auto max-w-lg p-10 text-center">
        <h1 className="text-2xl font-bold">تم استلام طلبك!</h1>
        <p className="mt-4 text-brown/70">
          سنتحقق من تحويلك البنكي ونؤكد طلبك قريبًا. تحقق من بريدك الإلكتروني للتأكيد.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-10 text-center">
      <h1 className="text-2xl font-bold">لا يوجد طلب لعرضه</h1>
    </main>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/order/confirmation/page.tsx
git commit -m "feat: add order confirmation page (IBAN success state)"
```

---

### Task 11: Newsletter signup (footer + API route)

**Files:**
- Create: `lib/newsletter/validate-email.ts`
- Test: `lib/newsletter/validate-email.test.ts`
- Create: `app/api/newsletter/route.ts`
- Modify: `components/footer.tsx`

**Interfaces:**
- Consumes: `addToMarketingAudience` from `lib/email/resend-client.ts`
- Produces: `isValidEmail(email: string): boolean`; `POST /api/newsletter`; the footer
  signup form — the deliverable of this task.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { isValidEmail } from "./validate-email";

describe("isValidEmail", () => {
  it("accepts a normal email address", () => {
    expect(isValidEmail("sara@example.com")).toBe(true);
  });

  it("rejects a string with no @", () => {
    expect(isValidEmail("sara.example.com")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects an email with no domain", () => {
    expect(isValidEmail("sara@")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/newsletter/validate-email.test.ts`
Expected: FAIL — `Cannot find module './validate-email'`.

- [ ] **Step 3: Write `lib/newsletter/validate-email.ts`**

```ts
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/newsletter/validate-email.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Write `app/api/newsletter/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { isValidEmail } from "../../../lib/newsletter/validate-email";
import { addToMarketingAudience } from "../../../lib/email/resend-client";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  try {
    await addToMarketingAudience(email);
  } catch (error) {
    console.error("Failed to add newsletter signup to marketing audience", error);
    return NextResponse.json({ error: "subscribe_failed" }, { status: 502 });
  }

  return NextResponse.json({ status: "subscribed" });
}
```

- [ ] **Step 6: Update `components/footer.tsx` to add the signup form**

```tsx
"use client";

import { useState } from "react";
import { useLocale } from "../lib/i18n/locale-context";

export function Footer() {
  const { locale } = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubscribe(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(response.ok ? "done" : "error");
      if (response.ok) setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <footer className="bg-brown px-6 py-10 text-center text-cream">
      <p className="text-xl font-bold">Peep &amp; beyond</p>
      <p className="mt-2 text-sm text-cream/70">
        {locale === "ar"
          ? "عالم صغير… يمتد بالخيال إلى ما هو أبعد."
          : "A small world… that stretches with imagination beyond."}
      </p>

      <form onSubmit={handleSubscribe} className="mx-auto mt-6 flex max-w-sm gap-2">
        <input
          type="email"
          required
          placeholder="اشتركي بالنشرة البريدية"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-full px-4 py-2 text-brown"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-full bg-leaf px-4 py-2 text-white disabled:opacity-50"
        >
          اشتركي
        </button>
      </form>
      {status === "done" && <p className="mt-2 text-sm">تم الاشتراك بنجاح!</p>}
      {status === "error" && <p className="mt-2 text-sm">تعذر الاشتراك، حاول مرة أخرى.</p>}

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

- [ ] **Step 7: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 8: Commit**

```bash
git add lib/newsletter/ app/api/newsletter/route.ts components/footer.tsx
git commit -m "feat: add footer newsletter signup"
```

---

### Task 12: Story-language stock tracking (pure logic + persistent counter)

**Context:** the owner has 25 printed Arabic story copies and 25 English copies. Once a
language sells out, orders for that language should still be accepted, but flagged as a
pre-order that "takes more than 10 days." Since this counter must survive across separate
serverless requests, it needs real persistent storage — this is the one place this project
uses a database, via Vercel KV (a small Redis-compatible store that provisions directly
from the Vercel dashboard for this project).

**Files:**
- Create: `lib/inventory/story-stock.ts`
- Test: `lib/inventory/story-stock.test.ts`
- Modify: `package.json` (add `@vercel/kv` dependency)

**Interfaces:**
- Consumes: `StoryLanguage` from `lib/types.ts`
- Produces: `INITIAL_STORY_STOCK: number`, `PRE_ORDER_NOTE: string`,
  `getRemainingStock(language: StoryLanguage): Promise<number>`,
  `decrementStockAfterOrder(language: StoryLanguage, quantity: number): Promise<number>`,
  `isPreOrder(remainingStock: number): boolean` — used by the stock API route (Task 13),
  the customize form (Task 15), and the IBAN order route (Task 16).

- [ ] **Step 1: Add the `@vercel/kv` dependency**

Add `"@vercel/kv": "^2.0.0"` to the `dependencies` section of `package.json`, then run:

Run: `npm install`
Expected: installs without errors.

- [ ] **Step 2: Write the failing test**

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const store = new Map<string, number>();

vi.mock("@vercel/kv", () => ({
  kv: {
    get: vi.fn((key: string) =>
      Promise.resolve(store.has(key) ? store.get(key) : null)
    ),
    set: vi.fn((key: string, value: number) => {
      store.set(key, value);
      return Promise.resolve("OK");
    }),
    decrby: vi.fn((key: string, amount: number) => {
      const current = store.get(key) ?? 0;
      const next = current - amount;
      store.set(key, next);
      return Promise.resolve(next);
    }),
  },
}));

import { getRemainingStock, decrementStockAfterOrder, isPreOrder } from "./story-stock";

beforeEach(() => {
  store.clear();
});

describe("getRemainingStock", () => {
  it("initializes an unset language to 25", async () => {
    expect(await getRemainingStock("ar")).toBe(25);
  });

  it("returns the stored value on subsequent reads", async () => {
    store.set("peep:story-stock:en", 10);
    expect(await getRemainingStock("en")).toBe(10);
  });
});

describe("decrementStockAfterOrder", () => {
  it("decrements by the order quantity", async () => {
    await getRemainingStock("en");
    const next = await decrementStockAfterOrder("en", 3);
    expect(next).toBe(22);
  });

  it("can go negative once sold out, without throwing", async () => {
    store.set("peep:story-stock:ar", 0);
    const next = await decrementStockAfterOrder("ar", 1);
    expect(next).toBe(-1);
  });
});

describe("isPreOrder", () => {
  it("is false while stock remains", () => {
    expect(isPreOrder(5)).toBe(false);
  });

  it("is true at exactly zero remaining", () => {
    expect(isPreOrder(0)).toBe(true);
  });

  it("is true once oversold (negative remaining)", () => {
    expect(isPreOrder(-2)).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- lib/inventory/story-stock.test.ts`
Expected: FAIL — `Cannot find module './story-stock'`.

- [ ] **Step 4: Write `lib/inventory/story-stock.ts`**

```ts
import { kv } from "@vercel/kv";
import type { StoryLanguage } from "../types";

export const INITIAL_STORY_STOCK = 25;
export const PRE_ORDER_NOTE =
  "نفدت النسخ المطبوعة لهذه اللغة حاليًا — سيتحول طلبك إلى طلب مسبق وقد يستغرق أكثر من 10 أيام.";

function stockKey(language: StoryLanguage): string {
  return `peep:story-stock:${language}`;
}

export async function getRemainingStock(language: StoryLanguage): Promise<number> {
  const existing = await kv.get<number>(stockKey(language));
  if (existing === null || existing === undefined) {
    await kv.set(stockKey(language), INITIAL_STORY_STOCK);
    return INITIAL_STORY_STOCK;
  }
  return existing;
}

export async function decrementStockAfterOrder(
  language: StoryLanguage,
  quantity: number
): Promise<number> {
  await getRemainingStock(language); // ensure initialized before decrementing
  return kv.decrby(stockKey(language), quantity);
}

export function isPreOrder(remainingStock: number): boolean {
  return remainingStock <= 0;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- lib/inventory/story-stock.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/inventory/story-stock.ts lib/inventory/story-stock.test.ts
git commit -m "feat: add per-language story stock tracking with pre-order threshold"
```

---

### Task 13: Story stock API route

**Files:**
- Create: `app/api/inventory/story-stock/route.ts`

**Interfaces:**
- Consumes: `getRemainingStock`, `isPreOrder` from `lib/inventory/story-stock.ts`
- Produces: `GET /api/inventory/story-stock` returning
  `{ ar: { remaining: number, preOrder: boolean }, en: { remaining: number, preOrder:
  boolean } }` — used by the customize form (Task 15).

- [ ] **Step 1: Write `app/api/inventory/story-stock/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getRemainingStock, isPreOrder } from "../../../../lib/inventory/story-stock";

export const runtime = "nodejs";

export async function GET() {
  const [ar, en] = await Promise.all([
    getRemainingStock("ar"),
    getRemainingStock("en"),
  ]);
  return NextResponse.json({
    ar: { remaining: ar, preOrder: isPreOrder(ar) },
    en: { remaining: en, preOrder: isPreOrder(en) },
  });
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/api/inventory/story-stock/route.ts
git commit -m "feat: add story stock API route"
```

---

### Task 14: Extend order email builder with a pre-order note

**Files:**
- Modify: `lib/email/order-notification-email.ts`
- Modify: `lib/email/order-notification-email.test.ts`

**Interfaces:**
- Produces: extends `OrderEmailData` with an optional `notes?: string[]` field, rendered
  in `buildOrderEmailHtml` — used by the IBAN route (Task 16) to flag pre-order items.

- [ ] **Step 1: Add the failing test case**

Add this test to the existing `describe("buildOrderEmailHtml", ...)` block in
`lib/email/order-notification-email.test.ts`:

```ts
  it("renders notes when provided, e.g. a pre-order flag", () => {
    const html = buildOrderEmailHtml({ ...data, notes: ["طلب مسبق: نفدت نسخ القصة العربية"] });
    expect(html).toContain("طلب مسبق: نفدت نسخ القصة العربية");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/email/order-notification-email.test.ts`
Expected: FAIL — the rendered HTML doesn't contain the note text yet.

- [ ] **Step 3: Update `lib/email/order-notification-email.ts`**

Add `notes?: string[];` to the `OrderEmailData` interface, and render it in
`buildOrderEmailHtml`:

```ts
export interface OrderEmailData {
  buyer: BuyerDetails;
  items: CartItem[];
  subtotalBhd: number;
  shippingBhd: number | null;
  totalBhd: number | null;
  paymentMethod: PaymentMethod;
  oreemTransactionReference?: string;
  notes?: string[];
}
```

In `buildOrderEmailHtml`, add a notes section right after the payment line:

```ts
  const notesHtml =
    data.notes && data.notes.length > 0
      ? `<p style="color:#b45309;"><strong>ملاحظات:</strong> ${data.notes.join(" — ")}</p>`
      : "";
```

And include `${notesHtml}` in the returned template string, right after the
`<p><strong>طريقة الدفع:</strong> ${paymentText}</p>` line.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/email/order-notification-email.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/email/order-notification-email.ts lib/email/order-notification-email.test.ts
git commit -m "feat: support order notes (e.g. pre-order flag) in the order email"
```

---

### Task 15: Show pre-order note in the box customization form

**Files:**
- Modify: `components/customize-box-form.tsx` (created in Plan 1, Task 10)

**Interfaces:**
- Consumes: `GET /api/inventory/story-stock` from Task 13
- Produces: an inline note next to the story-language choice when the selected language is
  sold out — no new exports, this is a UI-only change.

- [ ] **Step 1: Update `components/customize-box-form.tsx`**

Replace the full file with this version, which adds stock fetching and an inline note:

```tsx
"use client";

import { useEffect, useState } from "react";
import type { BoxCustomization, StoryLanguage } from "../lib/types";
import { createDefaultCustomization } from "../lib/product";
import { buildCartItem } from "../lib/cart/build-cart-item";
import { useCart } from "../lib/cart/cart-context";
import { useLocale } from "../lib/i18n/locale-context";

interface StoryStockInfo {
  remaining: number;
  preOrder: boolean;
}

type StoryStockResponse = Record<StoryLanguage, StoryStockInfo>;

export function CustomizeBoxForm({ onDone }: { onDone: () => void }) {
  const { t } = useLocale();
  const { addItem } = useCart();
  const [customization, setCustomization] = useState<BoxCustomization>(
    createDefaultCustomization()
  );
  const [stock, setStock] = useState<StoryStockResponse | null>(null);

  useEffect(() => {
    fetch("/api/inventory/story-stock")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: StoryStockResponse | null) => setStock(data))
      .catch(() => setStock(null));
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    addItem(buildCartItem(customization));
    onDone();
  }

  const selectedLanguageStock = stock?.[customization.storyLanguage];

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
        {selectedLanguageStock?.preOrder && (
          <p className="mt-1 text-sm text-amber-700">
            نفدت النسخ المطبوعة لهذه اللغة حاليًا — سيصبح طلبك طلب مسبق وقد يستغرق أكثر من
            10 أيام.
          </p>
        )}
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

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, use the browser tool to open the customize form. With fresh Vercel KV
(or the local dev fallback — see Task 16's note on local development), no pre-order note
should show. This is fully exercised once Task 16 wires up decrementing; a full check
happens in Task 17.

- [ ] **Step 4: Commit**

```bash
git add components/customize-box-form.tsx
git commit -m "feat: show pre-order note when a story language is sold out"
```

---

### Task 16: Decrement stock and flag pre-orders in the IBAN route

**Files:**
- Modify: `app/api/orders/iban/route.ts`

**Interfaces:**
- Consumes: `getRemainingStock`, `decrementStockAfterOrder`, `isPreOrder`, `PRE_ORDER_NOTE`
  from `lib/inventory/story-stock.ts`
- Produces: updates the IBAN route to check pre-order status before sending the email (so
  the owner sees the note) and decrement stock after a successful order.

- [ ] **Step 1: Update `app/api/orders/iban/route.ts`**

Replace the full file with this version:

```ts
import { NextRequest, NextResponse } from "next/server";
import { calculateOrderTotal } from "../../../../lib/order/order-total";
import { validateReceiptFile } from "../../../../lib/order/validate-receipt";
import {
  sendOrderNotificationEmail,
  sendCustomerConfirmationEmail,
  addToMarketingAudience,
} from "../../../../lib/email/resend-client";
import {
  getRemainingStock,
  decrementStockAfterOrder,
  isPreOrder,
  PRE_ORDER_NOTE,
} from "../../../../lib/inventory/story-stock";
import type { BuyerDetails, CartItem } from "../../../../lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const buyerJson = formData.get("buyer");
  const itemsJson = formData.get("items");
  const receipt = formData.get("receipt");

  if (typeof buyerJson !== "string" || typeof itemsJson !== "string") {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const receiptFile = receipt instanceof File ? receipt : null;
  const receiptCheck = validateReceiptFile(
    receiptFile ? { type: receiptFile.type, size: receiptFile.size } : null
  );
  if (!receiptCheck.valid) {
    return NextResponse.json({ error: receiptCheck.error }, { status: 400 });
  }

  const buyer = JSON.parse(buyerJson) as BuyerDetails;
  const items = JSON.parse(itemsJson) as CartItem[];
  const { subtotalBhd, shippingBhd, totalBhd } = calculateOrderTotal(items, buyer.country);

  const notes: string[] = [];
  for (const item of items) {
    const remaining = await getRemainingStock(item.customization.storyLanguage);
    if (isPreOrder(remaining)) {
      notes.push(`${PRE_ORDER_NOTE} (${item.customization.storyLanguage})`);
    }
  }

  const receiptBuffer = Buffer.from(await (receiptFile as File).arrayBuffer());
  const emailData = {
    buyer,
    items,
    subtotalBhd,
    shippingBhd,
    totalBhd,
    paymentMethod: "iban" as const,
    notes: notes.length > 0 ? notes : undefined,
  };

  try {
    await sendOrderNotificationEmail({
      data: emailData,
      receiptAttachment: {
        filename: (receiptFile as File).name || "receipt",
        content: receiptBuffer,
      },
    });
  } catch (error) {
    console.error("Failed to send IBAN order notification email", error);
    return NextResponse.json({ error: "email_failed" }, { status: 502 });
  }

  try {
    await sendCustomerConfirmationEmail(emailData);
  } catch (error) {
    console.error("Failed to send customer confirmation email", error);
  }

  if (buyer.marketingOptIn) {
    try {
      await addToMarketingAudience(buyer.email);
    } catch (error) {
      console.error("Failed to add buyer to marketing audience", error);
    }
  }

  for (const item of items) {
    try {
      await decrementStockAfterOrder(item.customization.storyLanguage, item.quantity);
    } catch (error) {
      console.error("Failed to decrement story stock", error);
    }
  }

  return NextResponse.json({ status: "received" });
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/api/orders/iban/route.ts
git commit -m "feat: flag pre-orders and decrement story stock on IBAN order"
```

---

### Task 17: End-to-end manual verification of the IBAN checkout flow

**Files:** none (verification only)

- [ ] **Step 1: Set up real Resend and Vercel KV credentials**

The owner creates a free Resend account, verifies a sending domain (or uses Resend's test
domain for now), creates an Audience, and supplies `RESEND_API_KEY` and
`RESEND_AUDIENCE_ID` — fill these into `.env.local` (already git-ignored). Separately,
provision a Vercel KV database from the Vercel dashboard for this project and copy its
`KV_REST_API_URL` / `KV_REST_API_TOKEN` (or `KV_URL`, depending on the Vercel KV UI at
setup time) into `.env.local` too — `@vercel/kv`'s `kv` client reads these automatically.

- [ ] **Step 2: Run the full automated test suite**

Run: `npm test`
Expected: all tests pass across every `lib/` module written in Plan 1 and this plan.

- [ ] **Step 3: Manual browser walkthrough**

Run: `npm run dev`, then use the browser tool to:
1. Add a Peep Box to the cart with a real-looking name.
2. Go to checkout, fill in all buyer fields, leave the marketing checkbox checked.
3. Select IBAN, attach a small real image file as the "receipt".
4. Submit and confirm you land on `/order/confirmation?method=iban` with the Arabic
   success message.
5. Check the owner's inbox (`OWNER_NOTIFICATION_EMAIL`) for the order email with the
   receipt attached and a correct total.
6. Check the buyer's own inbox for the confirmation email.
7. Check the Resend Audience dashboard for the new contact.
8. Go to the footer, submit a different email through the newsletter box, and confirm it
   also appears in the Resend Audience.
9. Try submitting the IBAN form again with no receipt file attached — confirm the client
   shows "إلزامي" validation instead of allowing submit, and that going around the client
   (e.g. `curl` with no receipt file to `/api/orders/iban`) gets a `400 receipt_required`
   response, not a silent failure or a 502.

- [ ] **Step 4: Verify the story-language pre-order threshold**

Using the Vercel KV dashboard (or a temporary debug script calling
`kv.set("peep:story-stock:ar", 0)`), manually set the Arabic story stock to `0`. Reload the
customize form and confirm:
- Selecting "العربية" for story language now shows the pre-order note inline.
- Selecting "الإنجليزية" shows no note (English stock untouched).
- Completing an IBAN order with Arabic selected still succeeds (order is *not* blocked),
  and the owner's order email includes the pre-order note.
- After that order, `GET /api/inventory/story-stock` shows the Arabic count has gone more
  negative by the ordered quantity (oversold tracking, not a hard block).

Reset the KV value back to a real remaining count afterward (or leave it if it reflects
reality — the owner will ask for adjustments as actual stock changes, since there's no
admin dashboard for this in this build).

- [ ] **Step 5: Confirm no regression from the original bug**

This is the key acceptance check: unlike the old prototype's `POST /api/orders → 502
{"error":"Not authenticated"}`, this flow must complete with **no login step at any point**
and a real `200`/`received` response.

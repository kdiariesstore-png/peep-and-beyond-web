# Peep & Beyond — Oreem Payment Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up real card payments through Oreem's hosted checkout
(`https://app.oreem.com/docs`), enable the previously-disabled "Oreem" option in checkout,
and independently verify payment status on return — the actual test of whether the owner's
"Oreem isn't cooperating" problem is now fixed, using her real API token.

**Architecture:** Builds on Plan 2's checkout page, order-total calculator, email
notification system, and story-stock tracking. Adds a thin server-side Oreem API client, an
order-payload encoder that survives the redirect round-trip to Oreem and back (embedded in
`redirect_url`'s own query string), a new `/api/orders/oreem` route that creates the hosted
payment session, and extends `/order/confirmation` to verify the transaction and complete
the order (email + stock decrement) only after independent verification — never by trusting
the redirect alone, which is the class of bug that broke the old prototype.

**Tech Stack:** Same as Plans 1–2 (Next.js 14, TypeScript, Tailwind, Vitest, Resend,
`@vercel/kv`). No new payment SDK — Oreem's hosted-payments API is a plain REST call.

## Global Constraints

- Oreem integration: `POST /api/v1/hosted-payments` with `Authorization: Bearer
  {OREEM_API_TOKEN}`, `amount`, `currency=BHD`, `txn_ref`, customer name/email/phone, and
  `redirect_url`; response contains `data.payment_url` to redirect the customer to. After
  payment, Oreem redirects back to `redirect_url` with `status`, `txn_ref`,
  `transaction_reference` query params. (Spec §8.2, sourced from
  `https://app.oreem.com/docs`)
- Payment status must be **independently verified server-side** before treating an order as
  paid — never trust the redirect's `status` param alone. (Spec §8.2)
- `OREEM_API_TOKEN` lives only in `.env.local` (already populated from the owner's real
  account) and Vercel's environment variables at deploy time — never in code, never
  committed, never logged in full. (Spec §11)
- On verified failure/cancellation, show a clear retry state with the cart intact — never a
  raw error page. (Spec §8.2, §9)
- Story-language stock decrement and pre-order flagging apply identically to Oreem orders
  as they do to IBAN orders (see Plan 2, Task 12). (Owner's instruction, 2026-08-16)
- The exact path/response shape of Oreem's transaction-verification endpoint is not fully
  documented in the summary this project has access to — Task 2 includes a step to confirm
  it against the real docs/sandbox and adjust if needed.

---

### Task 1: Order payload encode/decode for the Oreem redirect round-trip

**Files:**
- Create: `lib/order/order-payload.ts`
- Test: `lib/order/order-payload.test.ts`

**Interfaces:**
- Consumes: `BuyerDetails`, `CartItem` from `lib/types.ts`
- Produces: `PendingOrderPayload` type, `encodeOrderPayload(payload): string`,
  `decodeOrderPayload(encoded: string): PendingOrderPayload | null` — used by the Oreem
  order route (Task 3) and the confirmation page (Task 5).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { encodeOrderPayload, decodeOrderPayload, type PendingOrderPayload } from "./order-payload";

const payload: PendingOrderPayload = {
  txnRef: "peep_abc123",
  buyer: {
    fullName: "سارة أحمد",
    email: "sara@example.com",
    phone: "33001122",
    country: "BH",
    city: "المنامة",
    address: "شارع 10",
    preferredContact: "email",
    marketingOptIn: false,
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
};

describe("encodeOrderPayload / decodeOrderPayload", () => {
  it("round-trips a payload including Arabic text through base64url", () => {
    const encoded = encodeOrderPayload(payload);
    expect(decodeOrderPayload(encoded)).toEqual(payload);
  });

  it("produces a URL-safe string (no +, /, or = characters)", () => {
    const encoded = encodeOrderPayload(payload);
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("returns null for garbage input instead of throwing", () => {
    expect(decodeOrderPayload("not-valid-base64-json")).toBeNull();
  });

  it("returns null when the decoded JSON has no txnRef", () => {
    const encoded = Buffer.from(JSON.stringify({ foo: "bar" }), "utf-8").toString("base64url");
    expect(decodeOrderPayload(encoded)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/order/order-payload.test.ts`
Expected: FAIL — `Cannot find module './order-payload'`.

- [ ] **Step 3: Write `lib/order/order-payload.ts`**

```ts
import type { BuyerDetails, CartItem } from "../types";

export interface PendingOrderPayload {
  txnRef: string;
  buyer: BuyerDetails;
  items: CartItem[];
  subtotalBhd: number;
  shippingBhd: number;
  totalBhd: number;
}

export function encodeOrderPayload(payload: PendingOrderPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
}

export function decodeOrderPayload(encoded: string): PendingOrderPayload | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || typeof parsed.txnRef !== "string") {
      return null;
    }
    return parsed as PendingOrderPayload;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/order/order-payload.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/order/order-payload.ts lib/order/order-payload.test.ts
git commit -m "feat: add order payload encoding for the Oreem redirect round-trip"
```

---

### Task 2: Oreem API client (create hosted payment + verify transaction)

**Files:**
- Create: `lib/payments/oreem-client.ts`
- Test: `lib/payments/oreem-client.test.ts`

**Interfaces:**
- Produces: `createHostedPayment(params: CreateHostedPaymentParams):
  Promise<CreateHostedPaymentResult>`, `verifyTransaction(txnRef: string):
  Promise<VerifyTransactionResult>` — used by the Oreem order route (Task 3) and the
  confirmation page (Task 5).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createHostedPayment, verifyTransaction } from "./oreem-client";

beforeEach(() => {
  process.env.OREEM_API_TOKEN = "test-token";
  process.env.OREEM_BASE_URL = "https://app.oreem.com";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createHostedPayment", () => {
  it("posts to the hosted-payments endpoint with a bearer token and returns the payment url", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { payment_url: "https://app.oreem.com/pay/xyz" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createHostedPayment({
      txnRef: "peep_abc123",
      amountBhd: 23.9,
      customerName: "سارة أحمد",
      customerEmail: "sara@example.com",
      customerPhone: "33001122",
      redirectUrl: "https://peepandbeyond.example/order/confirmation?order=xyz",
    });

    expect(result.paymentUrl).toBe("https://app.oreem.com/pay/xyz");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.oreem.com/api/v1/hosted-payments");
    expect(options.headers.Authorization).toBe("Bearer test-token");
    const body = JSON.parse(options.body);
    expect(body.currency).toBe("BHD");
    expect(body.txn_ref).toBe("peep_abc123");
  });

  it("throws a clear error when Oreem responds with a non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({}) })
    );

    await expect(
      createHostedPayment({
        txnRef: "peep_bad",
        amountBhd: 10,
        customerName: "Test",
        customerEmail: "t@example.com",
        customerPhone: "000",
        redirectUrl: "https://example.com",
      })
    ).rejects.toThrow(/status 401/);
  });
});

describe("verifyTransaction", () => {
  it("reports verified=true for a successful transaction status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { status: "success" } }),
      })
    );

    const result = await verifyTransaction("peep_abc123");
    expect(result.verified).toBe(true);
    expect(result.status).toBe("success");
  });

  it("reports verified=false for a failed transaction status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { status: "failed" } }),
      })
    );

    const result = await verifyTransaction("peep_abc123");
    expect(result.verified).toBe(false);
    expect(result.status).toBe("failed");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/payments/oreem-client.test.ts`
Expected: FAIL — `Cannot find module './oreem-client'`.

- [ ] **Step 3: Write `lib/payments/oreem-client.ts`**

```ts
export interface CreateHostedPaymentParams {
  txnRef: string;
  amountBhd: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  redirectUrl: string;
}

export interface CreateHostedPaymentResult {
  paymentUrl: string;
}

export interface VerifyTransactionResult {
  verified: boolean;
  status: string;
}

function getBaseUrl(): string {
  return process.env.OREEM_BASE_URL ?? "https://app.oreem.com";
}

function getToken(): string {
  const token = process.env.OREEM_API_TOKEN;
  if (!token) throw new Error("OREEM_API_TOKEN is not set");
  return token;
}

export async function createHostedPayment(
  params: CreateHostedPaymentParams
): Promise<CreateHostedPaymentResult> {
  const response = await fetch(`${getBaseUrl()}/api/v1/hosted-payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      txn_ref: params.txnRef,
      amount: params.amountBhd.toFixed(3),
      currency: "BHD",
      redirect_url: params.redirectUrl,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
      fee_bearer: "merchant",
    }),
  });

  if (!response.ok) {
    throw new Error(`Oreem hosted-payments request failed with status ${response.status}`);
  }

  const json = await response.json();
  const paymentUrl = json?.data?.payment_url;
  if (typeof paymentUrl !== "string") {
    throw new Error("Oreem response missing data.payment_url");
  }
  return { paymentUrl };
}

export async function verifyTransaction(txnRef: string): Promise<VerifyTransactionResult> {
  const response = await fetch(`${getBaseUrl()}/api/v1/transactions/${encodeURIComponent(txnRef)}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!response.ok) {
    throw new Error(`Oreem transaction verification failed with status ${response.status}`);
  }

  const json = await response.json();
  const status: string = json?.data?.status ?? json?.status ?? "unknown";
  const verified = status === "success" || status === "paid" || status === "completed";
  return { verified, status };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/payments/oreem-client.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Confirm the verification endpoint shape against real docs**

The transaction-verification path/response shape above (`GET
/api/v1/transactions/{txn_ref}`, status field at `data.status`) is inferred from a
docs summary, not the full page. Before relying on it: fetch
`https://app.oreem.com/docs` directly (or check the sandbox dashboard/Postman collection if
Oreem provides one) and confirm the real endpoint path and response field names. If they
differ, update `verifyTransaction` accordingly and re-run this task's tests with corrected
mock response shapes. This will be re-confirmed for real against the sandbox in Task 6.

- [ ] **Step 6: Commit**

```bash
git add lib/payments/oreem-client.ts lib/payments/oreem-client.test.ts
git commit -m "feat: add Oreem hosted-payments client (create + verify)"
```

---

### Task 3: Oreem order API route

**Files:**
- Create: `app/api/orders/oreem/route.ts`

**Interfaces:**
- Consumes: `calculateOrderTotal` from `lib/order/order-total.ts`; `encodeOrderPayload`
  from `lib/order/order-payload.ts`; `createHostedPayment` from
  `lib/payments/oreem-client.ts`; `BuyerDetails`, `CartItem` from `lib/types.ts`
- Produces: `POST /api/orders/oreem` returning `{ paymentUrl: string }` — used by the
  checkout page (Task 4).

- [ ] **Step 1: Write `app/api/orders/oreem/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { calculateOrderTotal } from "../../../../lib/order/order-total";
import { encodeOrderPayload } from "../../../../lib/order/order-payload";
import { createHostedPayment } from "../../../../lib/payments/oreem-client";
import type { BuyerDetails, CartItem } from "../../../../lib/types";

export const runtime = "nodejs";

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const buyer = body.buyer as BuyerDetails;
  const items = body.items as CartItem[];

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }

  const { subtotalBhd, shippingBhd, totalBhd } = calculateOrderTotal(items, buyer.country);
  if (shippingBhd === null || totalBhd === null) {
    return NextResponse.json({ error: "shipping_not_available" }, { status: 400 });
  }

  const txnRef = `peep_${randomUUID()}`;
  const encodedOrder = encodeOrderPayload({
    txnRef,
    buyer,
    items,
    subtotalBhd,
    shippingBhd,
    totalBhd,
  });
  const redirectUrl = `${getSiteUrl()}/order/confirmation?order=${encodedOrder}`;

  try {
    const { paymentUrl } = await createHostedPayment({
      txnRef,
      amountBhd: totalBhd,
      customerName: buyer.fullName,
      customerEmail: buyer.email,
      customerPhone: buyer.phone,
      redirectUrl,
    });
    return NextResponse.json({ paymentUrl });
  } catch (error) {
    console.error("Failed to create Oreem hosted payment", error);
    return NextResponse.json({ error: "oreem_unavailable" }, { status: 502 });
  }
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/api/orders/oreem/route.ts
git commit -m "feat: add Oreem order API route"
```

---

### Task 4: Enable Oreem in the payment method selector and checkout submit

**Files:**
- Modify: `components/checkout/payment-method-selector.tsx` (from Plan 2, Task 8)
- Modify: `app/checkout/page.tsx` (from Plan 2, Task 8)

**Interfaces:**
- Consumes: `POST /api/orders/oreem` from Task 3
- Produces: an enabled Oreem option that redirects the browser to Oreem's `payment_url` on
  submit.

- [ ] **Step 1: Update `components/checkout/payment-method-selector.tsx`**

Change the disabled Oreem button block to an enabled one (remove `disabled` and the
"(قريبًا)" label):

```tsx
      <button
        type="button"
        aria-pressed={value === "oreem"}
        onClick={() => onChange("oreem")}
        className="block w-full rounded border border-brown/20 p-4 text-start"
      >
        <strong>بطاقة عبر أوريم</strong>
        <p className="text-sm text-brown/70">بيئة اختبار آمنة لبطاقات Benefit وVisa وMastercard.</p>
      </button>
```

- [ ] **Step 2: Update `app/checkout/page.tsx`'s `handleSubmit` to branch on payment method**

Replace the `handleSubmit` function with a version that adds the Oreem branch:

```tsx
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
      return;
    }

    if (paymentMethod === "oreem") {
      setSubmitting(true);
      try {
        const response = await fetch("/api/orders/oreem", {
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
  }
```

Note: the cart is intentionally **not** cleared before the Oreem redirect — it's only
cleared on the confirmation page after a *verified* successful payment (Task 5), so a
cancelled/failed Oreem payment leaves the cart intact for retry, per the spec's error
handling requirement.

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add components/checkout/payment-method-selector.tsx app/checkout/page.tsx
git commit -m "feat: enable Oreem payment method in checkout"
```

---

### Task 5: Extend the confirmation page to handle the Oreem return

**Files:**
- Modify: `app/order/confirmation/page.tsx` (from Plan 2, Task 10)
- Create: `components/order-confirmation-message.tsx`

**Interfaces:**
- Consumes: `decodeOrderPayload` from `lib/order/order-payload.ts`; `verifyTransaction`
  from `lib/payments/oreem-client.ts`; `sendOrderNotificationEmail`,
  `sendCustomerConfirmationEmail` from `lib/email/resend-client.ts`;
  `buildWhatsappConfirmationLink` from `lib/email/whatsapp-link.ts`;
  `getRemainingStock`, `decrementStockAfterOrder`, `isPreOrder`, `PRE_ORDER_NOTE` from
  `lib/inventory/story-stock.ts`
- Produces: the completed `/order/confirmation` route handling both IBAN (from Plan 2) and
  Oreem outcomes.

- [ ] **Step 1: Write `components/order-confirmation-message.tsx`**

```tsx
export function OrderConfirmationMessage({
  success,
  title,
  body,
  whatsappLink,
}: {
  success: boolean;
  title: string;
  body: string;
  whatsappLink?: string;
}) {
  return (
    <main className="mx-auto max-w-lg p-10 text-center">
      <h1 className={`text-2xl font-bold ${success ? "text-leaf" : "text-red-600"}`}>
        {title}
      </h1>
      <p className="mt-4 text-brown/70">{body}</p>
      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block rounded-full bg-green-600 px-6 py-3 text-white"
        >
          أرسل تأكيد واتساب
        </a>
      )}
      {!success && (
        <a href="/checkout" className="mt-6 block text-leaf underline">
          حاول مرة أخرى
        </a>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Rewrite `app/order/confirmation/page.tsx`**

```tsx
import { decodeOrderPayload } from "../../../lib/order/order-payload";
import { verifyTransaction } from "../../../lib/payments/oreem-client";
import {
  sendOrderNotificationEmail,
  sendCustomerConfirmationEmail,
} from "../../../lib/email/resend-client";
import { buildWhatsappConfirmationLink } from "../../../lib/email/whatsapp-link";
import {
  getRemainingStock,
  decrementStockAfterOrder,
  isPreOrder,
  PRE_ORDER_NOTE,
} from "../../../lib/inventory/story-stock";
import { OrderConfirmationMessage } from "../../../components/order-confirmation-message";
import type { OrderEmailData } from "../../../lib/email/order-notification-email";

export const runtime = "nodejs";

interface ConfirmationPageProps {
  searchParams: {
    method?: string;
    order?: string;
    status?: string;
    transaction_reference?: string;
  };
}

export default async function OrderConfirmationPage({ searchParams }: ConfirmationPageProps) {
  if (searchParams.method === "iban") {
    return (
      <OrderConfirmationMessage
        success={true}
        title="تم استلام طلبك!"
        body="سنتحقق من تحويلك البنكي ونؤكد طلبك قريبًا. تحقق من بريدك الإلكتروني للتأكيد."
      />
    );
  }

  const encodedOrder = searchParams.order;
  if (!encodedOrder) {
    return (
      <OrderConfirmationMessage success={false} title="لا يوجد طلب لعرضه" body="" />
    );
  }

  const payload = decodeOrderPayload(encodedOrder);
  if (!payload) {
    return (
      <OrderConfirmationMessage
        success={false}
        title="تعذر قراءة تفاصيل الطلب"
        body="حاول العودة للمتجر والطلب مرة أخرى."
      />
    );
  }

  const verification = await verifyTransaction(payload.txnRef);
  if (!verification.verified) {
    return (
      <OrderConfirmationMessage
        success={false}
        title="لم يتم تأكيد الدفع"
        body="لم نتمكن من تأكيد عملية الدفع. لم يتم خصم أي مبلغ إذا لم تكتمل العملية — حاول مرة أخرى."
      />
    );
  }

  const notes: string[] = [];
  for (const item of payload.items) {
    const remaining = await getRemainingStock(item.customization.storyLanguage);
    if (isPreOrder(remaining)) {
      notes.push(`${PRE_ORDER_NOTE} (${item.customization.storyLanguage})`);
    }
  }

  const emailData: OrderEmailData = {
    buyer: payload.buyer,
    items: payload.items,
    subtotalBhd: payload.subtotalBhd,
    shippingBhd: payload.shippingBhd,
    totalBhd: payload.totalBhd,
    paymentMethod: "oreem",
    oreemTransactionReference: searchParams.transaction_reference,
    notes: notes.length > 0 ? notes : undefined,
  };

  try {
    await sendOrderNotificationEmail({ data: emailData });
  } catch (error) {
    console.error("Failed to send Oreem order notification email", error);
  }

  try {
    await sendCustomerConfirmationEmail(emailData);
  } catch (error) {
    console.error("Failed to send Oreem customer confirmation email", error);
  }

  for (const item of payload.items) {
    try {
      await decrementStockAfterOrder(item.customization.storyLanguage, item.quantity);
    } catch (error) {
      console.error("Failed to decrement story stock after Oreem order", error);
    }
  }

  const whatsappLink = buildWhatsappConfirmationLink(emailData);

  return (
    <OrderConfirmationMessage
      success={true}
      title="تم تأكيد طلبك بنجاح!"
      body="شكرًا لتسوقك من Peep & beyond — وصلك تأكيد على بريدك الإلكتروني."
      whatsappLink={whatsappLink}
    />
  );
}
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 4: Update the IBAN confirmation usage in `app/checkout/page.tsx` if needed**

No change needed — Plan 2's IBAN success redirect (`/order/confirmation?method=iban`)
already matches the `method === "iban"` branch above.

- [ ] **Step 5: Commit**

```bash
git add app/order/confirmation/page.tsx components/order-confirmation-message.tsx
git commit -m "feat: handle Oreem payment verification and success/failure on confirmation page"
```

---

### Task 6: Real Oreem sandbox test — the actual bug-fix verification

**Files:** none (verification only)

This is the task that directly answers the original question: is Oreem actually broken, or
was it the old prototype's login requirement? With this build there's no login step at all,
so this test isolates the Oreem integration itself.

- [ ] **Step 1: Set the real Oreem token and site URL**

Confirm `.env.local` has `OREEM_API_TOKEN` set to the owner's real token (already provided
during brainstorming) and add `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local
testing.

- [ ] **Step 2: Run the full automated test suite**

Run: `npm test`
Expected: all tests pass across Plans 1–3.

- [ ] **Step 3: Manual browser walkthrough — happy path**

Run: `npm run dev`, then use the browser tool to:
1. Add a Peep Box to the cart, go to checkout, fill buyer details.
2. Select "بطاقة عبر أوريم", submit.
3. Confirm the browser navigates to a real `app.oreem.com` payment page (not an error).
4. Complete payment using one of Oreem's documented sandbox test cards (Benefit,
   Visa, or Mastercard test numbers from `https://app.oreem.com/docs`).
5. Confirm you're redirected back to `/order/confirmation` with a **success** message, and
   inspect the network requests/response to confirm `verifyTransaction` actually ran
   (check server logs for the `GET /api/v1/transactions/...` call — not just that the
   redirect's `status` param said success).
6. Check the owner's inbox for the order email with the Oreem transaction reference.
7. Check the buyer's confirmation email.
8. Confirm the cart is now empty (cleared only after verified success).

- [ ] **Step 4: Manual browser walkthrough — failure/cancel path**

Repeat the flow but deliberately fail or cancel the payment on Oreem's page (using a
documented decline test card, or Oreem's cancel option if the hosted page offers one).
Confirm:
- The confirmation page shows the Arabic failure message, not a raw error.
- The cart still has the item in it (not cleared).
- No order email was sent for the failed attempt.
- A "حاول مرة أخرى" link returns to `/checkout`.

- [ ] **Step 5: Document the actual root cause**

Based on Steps 3–4, write one paragraph (in the commit message for this task, or a short
note appended to the design spec's background section) stating definitively whether Oreem's
API itself works correctly once called without the old prototype's authentication bug in
the way. This closes the loop on the original complaint.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: verify real Oreem sandbox payment flow (success and failure paths)"
```

---

### Task 7: Deployment to Vercel

**Files:**
- Create: `README.md`

**Interfaces:** none — this task ships the site.

- [ ] **Step 1: Write `README.md`**

```markdown
# Peep & beyond — Website

Bilingual (AR/EN), dual-currency (BHD/USD) storefront for the Peep Box product, with guest
checkout via bank transfer (IBAN) or card payment (Oreem).

## Local development

```bash
npm install
npm run dev
```

## Required environment variables (`.env.local`, never committed)

- `OREEM_API_TOKEN` — bearer token from the Oreem merchant dashboard.
- `RESEND_API_KEY` — from the Resend account used for order/newsletter emails.
- `RESEND_FROM_EMAIL` — verified sending address (e.g. `orders@peepandbeyond.com`).
- `RESEND_AUDIENCE_ID` — the Resend Audience used for the marketing newsletter list.
- `OWNER_NOTIFICATION_EMAIL` — where order notifications are sent.
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or equivalent Vercel KV variables) — for the
  story-language stock counter.
- `NEXT_PUBLIC_SITE_URL` — the deployed site's own URL, used to build Oreem's
  `redirect_url`.

## Deployment

Deployed on Vercel. Connect this repository, set the environment variables above in the
Vercel project settings (not in code), and provision a Vercel KV database for the project
(Storage tab) before the first deploy that needs stock tracking to work.
```

- [ ] **Step 2: Deploy**

Run: `vercel` (or connect the repo via the Vercel dashboard) and set all environment
variables listed in the README in the Vercel project settings.
Expected: a live production URL.

- [ ] **Step 3: Final smoke test on the production URL**

Using the browser tool, repeat a shortened version of Task 6's happy-path walkthrough
against the real production URL (not `localhost`) to confirm environment variables and the
Oreem `redirect_url` (which must now point at the production domain, via
`NEXT_PUBLIC_SITE_URL`) all work correctly in production.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup and deployment instructions"
```

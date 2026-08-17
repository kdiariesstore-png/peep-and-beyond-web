# Peep & Beyond — Digital Products Design Spec

Date: 2026-08-17
Status: Approved by user, ready for implementation planning

## 1. Background

The site currently sells one physical product, the Peep Box (see
`2026-08-16-peep-and-beyond-website-design.md`). The owner (Khadija) now has 7 parenting-topic
booklets as finished PDFs, each in Arabic and English, and wants to sell them as digital
downloads alongside the physical box — a new, independent product line rather than an
extension of the box.

This is a separate subsystem (its own catalog, its own cart, its own checkout, its own
delivery mechanism) and gets its own spec/plan per the project's existing pattern of
decomposing independent pieces of work.

## 2. Goals

- New top-nav link "المنتجات الرقمية" (Digital Products) leading to a single browse page
  listing all 7 booklets plus a bundle, filterable by topic.
- Each booklet purchasable individually; a bundle of all 7 purchasable at a discount.
- Every booklet available in Arabic or English — one product, a language choice at
  add-to-cart time (not two separate catalog entries).
- Guest checkout, consistent with the rest of the site (no accounts).
- A digital order can never contain a physical Peep Box, and vice versa — they are two
  fully separate cart/checkout systems, so this holds by construction rather than by a
  runtime guard.
- Payment: **Oreem only**, regardless of the buyer's country (unlike the physical box,
  which is IBAN-in-Bahrain / Oreem-elsewhere). IBAN is not offered for digital products at
  all, because IBAN payments are confirmed manually (the owner reviews a receipt) and
  releasing a file before that manual confirmation would let a customer download without
  ever actually paying. Oreem confirms automatically, so it's the only method compatible
  with instant delivery.
- Instant delivery after Oreem confirms payment: download links on the confirmation page
  and in the confirmation email, each file watermarked with the site name and the order's
  transaction reference at download time.
- A short note on each booklet's page recommending it's best read on a tablet/iPad rather
  than a phone (not a hard restriction — phones still work).

## 3. Non-goals

- Zipping the bundle into one download — the confirmation page instead shows 7 separate
  download links. Avoids adding a zip dependency for a small, one-time convenience.
- Per-page or heavy DRM-style watermarking — a light, unobtrusive stamp (site name + order
  reference) on each page, for traceability if a file leaks, not copy protection.
- Any change to the existing physical Peep Box cart, checkout, or order pipeline. This spec
  only adds new, parallel code paths.
- Stock tracking for digital products (unlike the physical box's printed-copy stock) — a
  digital file has no scarcity.
- Letting a customer mix languages within one bundle purchase — a bundle purchase is one
  language (Arabic or English) applied to all 7 included booklets. (Buying, say, 3 in
  Arabic and 4 in English is still possible by adding individual booklets to the cart
  instead of the bundle.)

## 4. Product catalog

7 topics, each with an Arabic and an English PDF already supplied at:
`digital files/Peep-and-Beyond_<Topic-Slug>_<Arabic|English>.pdf`

| id | Arabic name | English name | Price |
|---|---|---|---|
| `picky-eating` | الأكل الانتقائي | Picky Eating | 2.700 BHD |
| `potty-training` | تدريب الحمام | Potty Training | 2.700 BHD |
| `screens-big-feelings` | الشاشات والمشاعر الكبيرة | Screens and Big Feelings | 2.700 BHD |
| `sharing-sibling-conflict` | المشاركة والخلاف بين الإخوة | Sharing and Sibling Conflict | 2.700 BHD |
| `sleep-bedtime` | النوم ووقت الفراش | Sleep and Bedtime | 2.700 BHD |
| `starting-school` | بداية المدرسة والانفصال | Starting School and Separation | 2.700 BHD |
| `child-hits` | عندما يضرب طفلك | When Your Child Hits | 2.700 BHD |
| `digital-bundle` | الباقة الكاملة (السبعة مواضيع) | The Complete Bundle (all 7 topics) | 12.000 BHD |

Each of the 7 individual products is offered in a buyer-chosen language (`ar`/`en`); the
bundle is offered the same way, applied to all 7 included files.

The PDF files themselves are copied into the repo at `content/digital-products/` (not
`public/` — see §7) as part of implementation, keeping the source filenames' topic/language
pattern but normalized to the `id` values above, e.g. `sleep-bedtime-ar.pdf`,
`sleep-bedtime-en.pdf`.

## 5. Browsing page

One route (e.g. `/digital`) reachable from a new header nav link. Renders:
- A pinned bundle card at the top (all 7 topics, 12.000 BHD).
- A grid of the 7 individual booklet cards below, each showing title, short description
  (reusing the existing bilingual dictionary pattern), price, and a language toggle
  (ar/en) before "add to cart".
- Topic filter chips above the grid (one per topic + "الكل" / "All") that filter the grid
  client-side; the bundle card is unaffected by filters.
- A short note near each card (and in more detail on an "about" blurb at the top of the
  page) recommending reading on a tablet/iPad for the best experience.

## 6. Cart, checkout, and pricing

A new, self-contained cart — its own `localStorage` key, its own React context
(`DigitalCartProvider`/`useDigitalCart`), separate from the physical box's `CartProvider`.
Item shape:

```ts
export type DigitalProductId =
  | "picky-eating"
  | "potty-training"
  | "screens-big-feelings"
  | "sharing-sibling-conflict"
  | "sleep-bedtime"
  | "starting-school"
  | "child-hits"
  | "digital-bundle";

export interface DigitalCartItem {
  id: DigitalProductId;
  language: "ar" | "en";
  unitPriceBhd: number;
}
```

No quantity field — each product can appear at most once per cart (adding an already-present
id replaces its language choice rather than duplicating the line).

Checkout page (`/digital/checkout`) uses a shortened buyer form: full name, email, country
(the country is still needed because the order-confirmation/email flow displays it and it's
useful for the owner's own records — but it does not affect payment method, unlike the
physical box). No phone, city, or address fields — there is nothing to ship.

Order total: `subtotalBhd` = sum of cart item prices; there is no shipping line at all (not
even a "quoted later" state — digital delivery is always instant and free). `totalBhd` =
`subtotalBhd`.

Payment: the checkout page shows Oreem only (no IBAN option, no country-based switch). The
existing Oreem client (`lib/payments/oreem-client.ts`) and order-payload encode/decode
(`lib/order/order-payload.ts`) are reused as-is; a new API route
(`app/api/orders/digital-oreem/route.ts`) builds the Oreem session for a digital cart the
same way `app/api/orders/oreem/route.ts` does for the physical box, with a payload shape
carrying the digital items instead of `BoxCustomization`.

## 7. Delivery and watermarking

**File storage:** the 14 source PDFs live at `content/digital-products/` at the repo root —
committed to git (they are paid content, not secrets, and Vercel needs them at runtime), but
outside `public/`, so Next.js never serves them as static files. The only way to reach a PDF
is through the download API route below.

**Confirmation flow:** a new page `app/digital/confirmation/page.tsx`, mirroring the
existing `app/order/confirmation/page.tsx` Oreem-verification logic (independent
server-side `verifyTransaction` call, amount-binding against the decoded payload, the same
fail-closed handling of ambiguous/unknown statuses). On successful verification it:
- Sends the owner-notification and customer-confirmation emails (new digital-order email
  template, reusing the existing Resend client wrapper and HTML-escaping helper).
- Renders one download link per purchased product (7 links for a bundle, 1 per individual
  item), each pointing at the download route below with the order's transaction reference
  and the product id embedded.
- Adds the buyer to the marketing audience if they opted in, same as the physical flow.
- Same idempotency guard as the physical Oreem flow (`claimOrderProcessing`) so refreshing
  the confirmation page never re-sends emails.

**Download route** (`app/api/digital-download/route.ts`): accepts the transaction reference
and product id as query params. It independently re-verifies the transaction via
`verifyTransaction` (never trusts the confirmation page or the URL alone) and confirms the
requested product id was actually part of that paid order's decoded payload before serving
anything. On success, it reads the matching PDF from `content/digital-products/`, stamps a
light watermark (site name + transaction reference, small text in a corner of every page)
using `pdf-lib` (pure JS, no native dependencies — safe for Vercel's serverless functions),
and streams the result back with `Content-Disposition: attachment`. The same link is also
what's included in the confirmation email, so it must stay independently verifiable (not
single-use-only) — download links are not time-limited or one-time-use in this version,
since the only reasonable resharing risk (a bought-once file getting passed around) is
already addressed by the watermark's traceability, and adding expiry/one-time tokens would
need persistent storage this project doesn't otherwise have.

## 8. i18n and copy

New dictionary keys in `lib/i18n/dictionaries/ar.ts` / `en.ts` for: nav link label, digital
page headings/filter labels, the tablet/iPad reading note, bundle card copy, and the digital
checkout/confirmation page copy (mirroring the tone of the existing physical-flow copy).

## 9. Testing

Unit tests mirror the existing suite's patterns:
- Digital product catalog config (7 products + bundle, correct prices).
- Digital order total calculator (no shipping ever).
- Digital cart storage/context (add/replace-by-id/remove, persistence, hydration guard —
  same pattern as the existing `cart-context.test.tsx`).
- Download route's verification logic (mocked `verifyTransaction`): rejects an
  unverified/mismatched transaction, rejects a product id not present in the paid order's
  payload, accepts a valid one.
- Watermarking helper: produces a valid PDF with the same page count as the source and with
  the expected text present.

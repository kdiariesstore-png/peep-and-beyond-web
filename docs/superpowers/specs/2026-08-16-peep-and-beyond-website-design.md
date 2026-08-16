# Peep & Beyond Website — Design Spec

Date: 2026-08-16
Status: Approved by user, ready for implementation planning

## 1. Background

Peep & beyond is a Bahrain-based children's brand (dinosaur mascot "Peep") selling a single
flagship product, the **Peep Box** (storybook + coloring book + puzzle + magnetic map +
letter cards + stickers + kids' cup), for 21.900 BHD.

A prototype already exists, built with a third-party ChatGPT site builder
(`peepandbeyond.khadijaabdulrasool.chatgpt.site`). It has the right shape (bilingual,
dual-currency, cart, checkout with IBAN/Oreem/PayPal options) but its checkout is broken:
submitting an order (regardless of payment method) fails with `POST /api/orders → 502`
and body `{"error":"Not authenticated"}` — the backend requires a logged-in session with
no working guest-checkout path, and payment method selection never actually gets reached.
That platform cannot be edited or scripted by Claude, so this spec is for a fresh,
custom-coded replacement the user (Khadija) can actually own, deploy, and debug.

## 2. Goals

- Bilingual storefront (Arabic default/RTL, English/LTR) for the Peep Box product.
- Dual currency display (BHD default, USD display-only via fixed peg).
- Client-side cart supporting one customizable product.
- Guest checkout (no accounts/login) that reliably reaches a payment step.
- Two payment methods: bank transfer (IBAN, manual + receipt upload) and card payment via
  Oreem's hosted checkout (`https://app.oreem.com/docs`).
- Bahrain shipping: flat 2.000 BHD. International shipping: per-country rate table the
  owner fills in later; unlisted countries show "quoted after we contact you".
- Every successful order (either payment method) emails the full order details — including
  the IBAN receipt image — to the owner's inbox. No admin dashboard, no database of orders.
- Every successful order gives the customer a confirmation via **both** email and a
  WhatsApp link (see §8.3) — not a choice between the two, both happen.
- An opt-in way to collect marketing emails (checkout checkbox + footer signup box) so the
  owner can announce new products/promotions later, without requiring any account/login.

## 3. Non-goals (explicitly out of scope for this build)

- Multiple products / product catalog browsing — only Peep Box, matching current scope.
- User accounts, login, order history.
- PayPal (present in the old prototype, not requested here — can be added later).
- Admin dashboard / order management UI.
- Automatic international shipping cost calculation (e.g. by weight/carrier API) — rates
  are a manually maintained table.
- Full WhatsApp Business API integration (Meta-verified account, pre-approved message
  templates, automatic server-sent WhatsApp messages). Deferred — see §8.3 for the
  lightweight `wa.me` approach used instead for this build.
- **"Vote for the next story character" feature** (poll among Peep/Lolo/Coco/Bambo/Fifi,
  restricted to customers who bought and read a story). Explicitly deferred to a Phase 2
  spec — it's a separate subsystem (vote storage, purchaser verification via a per-order
  emailed link, results display) that shouldn't block shipping the store itself. Revisit
  once checkout/payment are live and stable.

## 4. Tech stack

- **Next.js (App Router, TypeScript)**, deployed on Vercel.
- Styling: Tailwind CSS (fast to match the warm/cream, illustrated brand look from the
  existing screenshots).
- Cart state: React context + `localStorage` persistence (no backend cart needed since
  there's one product).
- Email: **Resend** for transactional order-notification emails (owner creates a free
  account and supplies an API key as a Vercel environment variable).
- Payments: direct server-side integration with Oreem's Hosted Payments API (no third-party
  payment SDK needed — it's a simple REST call).
- No database. No auth. Secrets (Oreem bearer token, Resend API key, bank IBAN if treated
  as sensitive) live in environment variables only, never in client code or chat.

## 5. Site structure

- `/` — landing page: hero, "why us" trust badges, "3 moments" (read/play/learn), "what's
  inside the box" section with the customization form entry point, footer.
- Product customization happens in a modal/form on the landing page (as in the current
  prototype): story language (AR/EN), letter-card language (AR/EN), cup color (pink/blue),
  child's name (text), optional free gift card toggle. Adds one line item to the cart.
- Cart drawer: shown from a header icon, editable quantity/remove, subtotal + shipping
  preview, "Checkout" button.
- `/checkout` — buyer details (name, email, phone, delivery country, city, address,
  preferred contact channel), payment method selection, order summary sidebar, submit.
- `/order/confirmation` — shown after a successful IBAN submission, or after returning from
  Oreem's hosted payment page with a verified successful transaction. Shows a clear
  "we received your order" / "payment failed, try again" state depending on outcome.

## 6. Language & currency

- A header toggle switches `ar` ⇄ `en`. Arabic is the source of truth for copy; English is
  a translated mirror. Switching sets `<html lang>` and `dir` (`rtl` for Arabic, `ltr` for
  English) and persists the choice (cookie or `localStorage`).
- A header toggle switches `BHD` ⇄ `USD` **display only**. All prices are authored in BHD;
  USD is computed with a fixed constant (Bahrain's currency-board peg, 1 BHD ≈ 2.6596 USD)
  defined in one place so it's trivial to update if it's ever needed. The cart, checkout,
  and the amount actually sent to Oreem always use BHD — Oreem's docs confirm BHD as the
  expected `currency` value for Bahrain merchants, and the bank IBAN is a BHD account.

## 7. Shipping

- A shipping-rate config (e.g. `lib/shipping-rates.ts`) maps country code → flat BHD price.
- Bahrain (`BH`) ships for a hardcoded 2.000 BHD, matching the current site.
- Other countries start with placeholder/TBD entries; the owner will supply real rates once
  the box's shipping weight is known (her stated plan). Until a country has a real rate,
  checkout shows: "شحن هذا البلد يُحدَّد لاحقًا — سنتواصل معك لتأكيد السعر" (shipping for
  this country will be confirmed after we contact you) instead of a number, and the order
  still submits normally with shipping marked "to be confirmed."

## 8. Checkout & order flow

Both payment paths are guest checkout — no login, unlike the broken prototype.

### 8.1 IBAN bank transfer
1. Customer fills buyer details, selects "IBAN", uploads a receipt image/PDF (required,
   client + server validated: jpg/png/webp/pdf, ≤8MB).
2. On submit, a Next.js Server Action / API route receives the form + file, and immediately
   sends an email (via Resend) to the owner with: full order details, box customization,
   shipping address, computed total, and the receipt as an attachment.
3. Customer is shown the confirmation page: "order received, we'll verify your transfer and
   confirm shortly." No payment is verified automatically — the owner reconciles the bank
   transfer manually, as today.

### 8.2 Oreem card payment
1. Customer fills buyer details, selects "Oreem", submits.
2. Server generates a unique `txn_ref`, then POSTs to Oreem's
   `POST /api/v1/hosted-payments` with `Authorization: Bearer {OREEM_API_TOKEN}`, `amount`,
   `currency=BHD`, `txn_ref`, customer name/email/phone, and a `redirect_url` pointing back
   to `/order/confirmation` with the order reference encoded in the query string.
3. Customer is redirected to the returned `data.payment_url` to pay on Oreem's own hosted
   page (Benefit/Visa/Mastercard).
4. Oreem redirects the customer back to `redirect_url` with `status`, `txn_ref`, and
   `transaction_reference` query params.
5. The confirmation page's server logic **independently verifies** the transaction via
   Oreem's verification endpoint (per their docs) rather than trusting the redirect status
   alone — this is exactly the kind of step the old prototype seems to have skipped.
6. On verified success: send the owner the order-notification email (same content as the
   IBAN path, minus the receipt, plus the Oreem transaction reference) and show a success
   confirmation to the customer.
7. On verified failure/cancellation: show a clear failure state with a "try again" action
   that returns to checkout with the cart intact — never a raw error page.

### 8.3 Order confirmation delivery (email + WhatsApp)

Every successful order (IBAN or Oreem) delivers a confirmation to the customer via email
automatically, plus a WhatsApp confirmation with one manual tap from the owner (see caveat
below):

- **Email**: sent via Resend to the customer automatically, same order-notification system
  as the owner's copy, with the order summary.
- **WhatsApp**: a lightweight `wa.me` deep link — no server-side sending, no Business API
  account required. **Important limitation:** a plain `wa.me` link cannot deliver a message
  to the customer automatically — only a real WhatsApp Business API can do that. So for this
  build, the owner's order-notification email includes a
  `https://wa.me/<customer_phone>?text=<url-encoded invoice summary>` button: one tap opens
  WhatsApp on the owner's device with a chat to the customer already pre-filled with the
  invoice text, ready to send. It's a one-tap-send workflow for the owner, not a fully
  automatic delivery to the customer — upgradeable later to true automatic sending once a
  verified WhatsApp Business API account and approved message templates exist (see
  non-goals).

**Open technical risk, to validate during implementation:** the exact mechanism for
carrying order details (name, address, box customization) across the redirect to Oreem and
back — since Oreem's redirect only guarantees `status`/`txn_ref`/`transaction_reference`
are appended. Plan A is to embed the order payload in `redirect_url`'s own query string and
rely on Oreem preserving unrecognized params (common for hosted-checkout providers). If
testing against the real Oreem sandbox shows params get stripped, fall back to a short-lived
server-side store (e.g. Vercel KV) keyed by `txn_ref`, holding the pending order payload
with a ~1 hour TTL. This will be confirmed once real Oreem credentials are available for
testing — see open questions.

## 9. Marketing email list (newsletter)

Fully separate from checkout/accounts — just an email address, no password, no login:

- **Checkout opt-in**: an unchecked-by-default checkbox ("أرغب أستلم آخر العروض والمنتجات
  الجديدة") next to the buyer's email field. If checked on order submit, that email is
  added to the marketing list.
- **Footer signup**: a standalone "subscribe" box (email only) for visitors who want updates
  without buying.
- **List/campaign tool**: Resend Audiences (Resend also handles order-notification emails,
  so this avoids adding a second vendor). The owner sends future promotional/new-product
  broadcasts from her Resend dashboard — no custom admin UI needed for this build.

## 10. Error handling

- Client-side form validation (required fields, file type/size) before any submit.
- Every server-side failure (Oreem API error, Resend send failure, malformed upload) shows
  the customer a specific, friendly retry message — never a raw 502 or stack trace, and
  never silently drops the order.
- If the order email fails to send after a successful Oreem payment, the confirmation page
  still shows success to the customer (since they *were* charged), and the failure is
  logged server-side so it isn't silently lost — exact logging destination (e.g. Vercel
  logs) is sufficient for this scope since there's no admin dashboard.

## 11. Testing plan

- Manual walkthrough in the browser for both payment paths (IBAN happy path with a real
  test file upload; Oreem happy path against their sandbox test cards from the docs;
  Oreem failure/cancel path).
- Verify language + currency toggles persist across navigation and affect RTL/LTR layout
  correctly.
- Verify Bahrain shipping is always exactly 2.000 BHD, and an unmapped country shows the
  "quoted later" state instead of a wrong number.
- Verify order emails arrive with correct totals and, for IBAN, the receipt attached.
- Verify the post-order WhatsApp `wa.me` link opens with a correctly pre-filled, correctly
  encoded order summary (including Arabic text).
- Verify checkout opt-in and footer signup both correctly add an email to the Resend
  Audience, and that unchecked opt-in does not.

## 12. Secrets / accounts needed from the owner before full implementation

- `OREEM_API_TOKEN` — real bearer token from her existing Oreem merchant account (received;
  stored locally in `.env.local`, git-ignored, never committed).
- `RESEND_API_KEY` — from a new free Resend account (also used for the Audiences/newsletter
  list — no separate marketing-email vendor needed).
- Confirmation of the bank IBAN to display (already known: `BH04BBKU00200004090874`, to be
  reconfirmed).
- Real international shipping rates once box weight is known (placeholder table ships
  first).
- A phone number to use as the `wa.me` link target for WhatsApp order confirmations (the
  owner's business number, unless the intent is a pre-filled message the *customer* sends
  to themselves/saves — to confirm during implementation).

All secrets are supplied as environment variables at deploy time — never typed into chat or
committed to the repo.

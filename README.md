# Peep & beyond — Website

Bilingual (Arabic/English), dual-currency (BHD/USD) storefront for the Peep Box product,
with guest checkout via bank transfer (IBAN) or card payment (Oreem).

## Local development

```bash
npm install
npm run dev
```

Runs on `http://localhost:3000`.

```bash
npm test          # run the automated test suite
npm run typecheck # TypeScript check
```

## Required environment variables (`.env.local`, never committed)

| Variable | Purpose |
|---|---|
| `OREEM_API_TOKEN` | Bearer token from the Oreem merchant dashboard (app.oreem.com). |
| `RESEND_API_KEY` | From the Resend account used for order/newsletter emails. |
| `RESEND_FROM_EMAIL` | Verified sending address (e.g. `orders@peepandbeyond.com`). |
| `RESEND_AUDIENCE_ID` | The Resend Audience used for the marketing newsletter list. |
| `OWNER_NOTIFICATION_EMAIL` | Where order notifications are sent. |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Vercel KV credentials, for the story-language stock counter and payment idempotency lock. Auto-populated by Vercel when you provision a KV database and link it to this project — you usually don't set these by hand. |
| `NEXT_PUBLIC_SITE_URL` | The deployed site's own URL (e.g. `https://peepandbeyond.vercel.app` or your custom domain), used to build Oreem's `redirect_url`. **Required in production** — the card-payment route refuses to create a payment session (returns a friendly error) rather than redirect a paying customer to `localhost`. Falls back to `https://$VERCEL_URL` when Vercel provides it. |
| `OWNER_WHATSAPP_NUMBER` | *Optional, blank by default.* The shop owner's WhatsApp contact — either a plain phone number in international digits (e.g. `97333001122`), **or** a full WhatsApp Business short link (e.g. `https://wa.me/message/NOEVIMNTTYKVO1`, generated under WhatsApp Business → Settings → Business tools → Short link) — both formats work. Currently set to Peep & beyond's business number. When set, a paid-order confirmation page shows a one-tap "message us on WhatsApp" button pre-filled with the order's reference number. When blank, the page degrades gracefully and tells the customer to confirm via Instagram `@peepandbeyond` instead — nothing breaks either way. |
| `DIGITAL_ORDER_SECRET` | **Required for the Digital Products feature.** HMAC-SHA256 signing key for the digital order payload that round-trips through the customer's browser via the `order` URL param — without it, a customer could edit which topic/bundle they claim to have paid for. Generate a real random value, e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`, and set it in Vercel's project environment variables before this feature can work in production. Rotating this value invalidates every in-flight (unpaid or not-yet-downloaded) digital order link. |

## What's still pending before this is fully live

This codebase is complete and tested (71 automated tests, real Oreem API integration
verified against the live merchant account — see `docs/superpowers/sdd/` history for
details). The following remain, and they need the account owner's direct action since they
involve real accounts/credentials no one else should touch:

1. **Create a Resend account** (resend.com) — needed for order-notification and newsletter
   emails to actually send. Without it, orders will still complete (IBAN emails the owner
   directly on submit; Oreem orders show the WhatsApp fallback), but automated emails won't
   go out.
2. **Provision a Vercel KV database** and link it to this project (Vercel dashboard →
   Storage tab) — needed for the story-language stock counter (25 Arabic + 25 English copy
   tracking) and for the Oreem payment idempotency lock (prevents duplicate order emails on
   page refresh). Without it, the site still works — these features fail open/gracefully
   degrade — but stock tracking won't persist and refreshing a payment confirmation page
   could re-send order notifications.
3. **Real international shipping rates** — `lib/shipping-rates.ts` currently has Bahrain's
   flat 2.000 BHD rate and `null` (meaning "quoted after we contact you") for every other
   country. Update this file once the box's shipping weight and real carrier rates are
   known.

`OWNER_WHATSAPP_NUMBER` is already set (Peep & beyond's WhatsApp Business number), so paying
customers get a one-tap "confirm my order" button rather than the Instagram fallback.

**Watch the first real payment closely.** The redirect round-trip — Oreem appending its own
query parameters to our confirmation URL and the page verifying that transaction — has not
yet been observed end-to-end with a genuinely completed payment; only session creation and
verification of a not-yet-paid transaction have been exercised against the live account. Do
the first production payment yourself, with a small amount, and confirm the confirmation
page, the order email, and the stock decrement all behave before pointing customers at it.

## Deployment (Vercel)

1. Push this repository to a Git provider (GitHub/GitLab/Bitbucket) if it isn't already —
   Vercel deploys from a connected repo.
2. From the Vercel dashboard, "Add New Project" and import this repository (or run
   `npx vercel` from this directory and follow the prompts to link/create a project).
3. In the Vercel project's **Settings → Environment Variables**, add every variable listed
   in the table above (except `KV_REST_API_URL`/`KV_REST_API_TOKEN`, which Vercel fills in
   automatically once you complete step 4).
4. In the Vercel project's **Storage** tab, create a new KV database and connect it to this
   project — this injects the `KV_REST_API_URL`/`KV_REST_API_TOKEN` variables automatically.
5. Set `NEXT_PUBLIC_SITE_URL` to your actual deployed URL (Vercel gives you one immediately
   after the first deploy, e.g. `https://peep-and-beyond-web.vercel.app`; update this env
   var with it, then redeploy so the Oreem `redirect_url` points at the right place).
6. Trigger a deploy (push to the connected branch, or `npx vercel --prod`).
7. Once live, do one real end-to-end smoke test on the production URL: add an item, go
   through checkout with IBAN (confirm the owner email arrives) and, when ready, a real
   Oreem payment (confirm the redirect and confirmation flow both work against production).

## Architecture notes

- **No user accounts/login anywhere** — guest checkout only, by design (this replaces an
  earlier prototype whose checkout was broken specifically because it silently required a
  login).
- **No database** except the two advisory Vercel KV uses above — everything else is
  stateless or client-side (cart in `localStorage`, language/currency preference in
  `localStorage`).
- **Server always recomputes price and shipping** — the client's cart is never trusted for
  the amount actually charged or emailed.
- Full design spec: `docs/superpowers/specs/2026-08-16-peep-and-beyond-website-design.md`.
  Full implementation plans (3 phases): `docs/superpowers/plans/`.

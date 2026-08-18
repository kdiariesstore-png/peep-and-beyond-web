// Never silently fall back to localhost in production: this URL is where Oreem sends a
// paying customer back to. A localhost redirect on a live payment means money taken and
// no order record at all, so fail loudly instead (callers turn this into a 502).
//
// Preference order: an explicitly configured NEXT_PUBLIC_SITE_URL always wins (it's the
// only way to point at a custom domain). Failing that, prefer Vercel's
// VERCEL_PROJECT_PRODUCTION_URL — the project's stable assigned domain — over VERCEL_URL,
// which is unique to each individual deployment (e.g. a fresh preview-looking hash on
// every production build) and sends paying customers to a URL that stops working the
// moment the next deploy ships.
export function getSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_SITE_URL is not set");
    }
    return "http://localhost:3000";
  }
  return configured.replace(/\/+$/, "");
}

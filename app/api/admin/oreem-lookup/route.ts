import { NextRequest, NextResponse } from "next/server";
import { fetchTransactionByOreemReference } from "../../../../lib/payments/oreem-client";

export const runtime = "nodejs";

// A reconciliation tool for the shop owner: given a transaction reference from the Oreem
// merchant dashboard (the "AP-..." value — that dashboard doesn't expose our own txn_ref),
// looks the transaction up directly with Oreem so a payment that reached Oreem but never
// produced a completed order on our confirmation page can still be found and fulfilled
// manually. There is no admin login system in this app, so this is gated by a single
// shared secret rather than a session — acceptable for a low-traffic, owner-only tool, but
// it must never be reachable without ADMIN_TOOLS_SECRET configured and matched exactly.
function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_TOOLS_SECRET;
  if (!expected) return false;
  const bearer = request.headers.get("authorization");
  const provided = bearer?.startsWith("Bearer ") ? bearer.slice("Bearer ".length) : undefined;
  // Also accepted as a query param so the owner can just paste a URL into a browser
  // instead of needing to set a header — the value is a long random secret either way, so
  // this trades a little more exposure (URLs can end up in logs/history) for usability on
  // a tool nobody but the owner is expected to ever call.
  const queryValue = request.nextUrl.searchParams.get("secret") ?? undefined;
  return provided === expected || queryValue === expected;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const reference = request.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "missing_reference" }, { status: 400 });
  }

  try {
    const data = await fetchTransactionByOreemReference(reference);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Admin Oreem lookup failed", error);
    return NextResponse.json({ error: "lookup_failed" }, { status: 502 });
  }
}

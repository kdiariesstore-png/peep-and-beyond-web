import { kv } from "@vercel/kv";

const PENDING_ORDER_TTL_SECONDS = 60 * 60 * 24 * 3; // 3 days

function pendingOrderKey(txnRef: string): string {
  return `peep:pending-order:${txnRef}`;
}

// Oreem's hosted-payment redirect_url is truncated beyond some length limit on their
// side, then their own status params get appended to whatever survived — silently
// corrupting any order data we tried to embed in the URL itself (discovered via a real
// completed payment whose redirect_url exceeded the limit and came back unparseable).
// Storing the payload server-side and handing Oreem only a short opaque txnRef avoids
// that failure mode entirely, since the redirect_url never carries more than the txnRef.
export async function storePendingOrder(txnRef: string, payload: unknown): Promise<void> {
  await kv.set(pendingOrderKey(txnRef), payload, { ex: PENDING_ORDER_TTL_SECONDS });
}

export async function getPendingOrder<T>(txnRef: string): Promise<T | null> {
  const value = await kv.get<T>(pendingOrderKey(txnRef));
  return value ?? null;
}

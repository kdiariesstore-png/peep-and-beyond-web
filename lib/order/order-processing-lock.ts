import { kv } from "@vercel/kv";

const LOCK_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Claims the one-time right to run an order's side effects (emails, stock decrement).
// The confirmation page is a plain GET URL: a refresh, a back-navigation, or a link
// preview bot would otherwise re-run every side effect for a single real payment.
// Returns true only for the first caller for a given txnRef.
export async function claimOrderProcessing(txnRef: string): Promise<boolean> {
  try {
    const result = await kv.set(`peep:order-processed:${txnRef}`, "1", {
      nx: true,
      ex: LOCK_TTL_SECONDS,
    });
    return result === "OK";
  } catch (error) {
    console.error("Failed to claim order processing lock, proceeding anyway", error);
    return true; // fail open: don't block a genuinely successful payment's confirmation over a KV hiccup
  }
}

// Oreem's hosted-payment redirect appends its own callback params (status,
// transaction_reference, txn_ref, message, ...) to our redirect_url by concatenating
// "?" + params rather than checking whether redirect_url already has a query string. Since
// our redirect_url is itself `${site}/.../confirmation?ref=${txnRef}`, the result is a URL
// with two "?" characters — and a URL only has one real query string, delimited by the
// first "?". Everything after that is parsed as query params split on "&", so the second
// "?" is not a delimiter: it lands inside the *value* of our own `ref` param, corrupting it
// (e.g. `ref=peepdigi_xxxx?status=success`). Observed against a real completed payment.
//
// Oreem's own `txn_ref` param (present later in that same query string, past the first "&",
// so it parses cleanly) happens to echo back exactly what we sent as `ref` — so it's a
// reliable fallback once the primary `ref` value fails to match our own reference shape.
export function resolveTxnRef(
  pattern: RegExp,
  ...candidates: (string | undefined)[]
): string | undefined {
  for (const candidate of candidates) {
    if (candidate && pattern.test(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

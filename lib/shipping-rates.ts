/**
 * Country code -> flat shipping price in BHD.
 * `null` means "no verified rate set yet". Checkout and both payment routes fail closed:
 * the customer must request a shipping quote before payment.
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

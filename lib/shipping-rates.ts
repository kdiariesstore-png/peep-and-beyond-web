/**
 * Country code -> flat shipping price in BHD.
 * `null` means "no rate set yet" -> checkout shows a "quoted after we contact you" message.
 * The owner will supply real international rates once the box's shipping weight is known.
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

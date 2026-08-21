import { getShippingRate } from "../shipping-rates";
import { fetchShippingRates } from "../payments/oreem-client";
import { PEEP_BOX_CHARGEABLE_WEIGHT_KG } from "../product";

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

// Bahrain keeps the flat local rate (no Oreem call needed); every other destination is
// quoted live from Oreem's shipping-rate calculator using the box's real chargeable
// weight, taking the cheapest carrier Oreem returns. Returns null when Oreem has no rate
// for that destination (unsupported country, or the lookup itself failed) — callers must
// treat that the same as "quoted later", never as free shipping.
export async function quoteShippingBhd(
  countryCode: string,
  city: string | undefined,
  boxQty: number
): Promise<number | null> {
  if (boxQty <= 0) return 0;
  if (countryCode === "BH") return getShippingRate("BH");
  // Oreem's shipments/rates endpoint requires a real destination city (a null/blank
  // city_name is rejected with a 422) — skip the call entirely rather than let every
  // international quote fail once the buyer hasn't typed a city yet.
  if (!city || city.trim().length === 0) return null;

  try {
    const options = await fetchShippingRates({
      destCountryCode: countryCode,
      destCity: city,
      chargeableWeightKg: PEEP_BOX_CHARGEABLE_WEIGHT_KG,
      qty: boxQty,
    });
    if (options.length === 0) return null;
    return round3(options[0].amountBhd);
  } catch (error) {
    console.error("Failed to fetch live shipping rate from Oreem", error);
    return null;
  }
}

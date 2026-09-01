import type { CartItem } from "../types";
import { getShippingRate } from "../shipping-rates";
import { fetchShippingRates } from "../payments/oreem-client";
import { buildPhysicalShippingParcels } from "../shipping/physical-parcels";

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export async function quoteShippingBhd(
  countryCode: string,
  city: string,
  items: CartItem[]
): Promise<number | null> {
  if (countryCode === "BH") return getShippingRate("BH");
  if (!city.trim() || items.length === 0) return null;

  const parcels = buildPhysicalShippingParcels(items);
  if (parcels.length === 0) return null;

  try {
    const rates = await fetchShippingRates({
      destCountryCode: countryCode,
      destCity: city.trim(),
      parcels: parcels.map(({ chargeableWeightKg, qty }) => ({ chargeableWeightKg, qty })),
    });
    return rates.length > 0 ? round3(rates[0].amountBhd) : null;
  } catch (error) {
    console.error("Failed to fetch live shipping rate from Oreem", error);
    return null;
  }
}

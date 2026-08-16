import type { Currency } from "./types";

export const BHD_TO_USD_RATE = 2.6596;

export function convertBhdToUsd(bhd: number): number {
  return Math.round(bhd * BHD_TO_USD_RATE * 100) / 100;
}

export function formatMoney(amountBhd: number, currency: Currency): string {
  if (currency === "USD") {
    return `$${convertBhdToUsd(amountBhd).toFixed(2)}`;
  }
  return `${amountBhd.toFixed(3)} د.ب`;
}

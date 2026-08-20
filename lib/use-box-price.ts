"use client";

import { useEffect, useState } from "react";
import { PEEP_BOX_PRODUCT } from "./product";

export interface BoxPrice {
  priceBhd: number;
  originalPriceBhd: number;
  isLaunchPrice: boolean;
}

// Starts from the static catalog price (correct in the common case) so there is no flash
// of a wrong number before the live /api/box-price response lands.
const INITIAL: BoxPrice = {
  priceBhd: PEEP_BOX_PRODUCT.priceBhd,
  originalPriceBhd: PEEP_BOX_PRODUCT.originalPriceBhd,
  isLaunchPrice: true,
};

export function useBoxPrice(): BoxPrice {
  const [price, setPrice] = useState<BoxPrice>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/box-price")
      .then((response) => response.json())
      .then((json) => {
        if (cancelled) return;
        if (
          typeof json.priceBhd === "number" &&
          typeof json.originalPriceBhd === "number" &&
          typeof json.isLaunchPrice === "boolean"
        ) {
          setPrice({
            priceBhd: json.priceBhd,
            originalPriceBhd: json.originalPriceBhd,
            isLaunchPrice: json.isLaunchPrice,
          });
        }
      })
      .catch(() => {
        // Keep showing the static fallback price; not worth surfacing an error for this.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return price;
}

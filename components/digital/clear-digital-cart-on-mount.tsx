"use client";

import { useEffect, useRef } from "react";
import { useDigitalCart } from "../../lib/digital/cart-context";

// Same pattern as components/clear-cart-on-mount.tsx for the physical cart: gated on
// `hydrated` because React runs child effects before parent effects, so an unguarded
// mount-time clear would fire before DigitalCartProvider's own load-from-storage effect
// and get overwritten by it.
export function ClearDigitalCartOnMount() {
  const { clear, hydrated } = useDigitalCart();
  const hasCleared = useRef(false);

  useEffect(() => {
    if (hydrated && !hasCleared.current) {
      hasCleared.current = true;
      clear();
    }
  }, [hydrated, clear]);

  return null;
}

"use client";

import { useEffect, useRef } from "react";
import { useCart } from "../lib/cart/cart-context";

// Rendered only on the Oreem *success* page: the confirmation page is a server
// component and cannot call useCart().clear() itself, so this clears the paid-for
// cart client-side once the success page mounts. Never render this on a failure
// path — the cart must survive for a retry.
export function ClearCartOnMount() {
  const { clear } = useCart();
  // `clear` is a fresh closure on every CartProvider render, and clearing re-renders
  // the provider — without this guard the effect would re-fire forever.
  const cleared = useRef(false);

  useEffect(() => {
    if (cleared.current) return;
    cleared.current = true;
    clear();
  }, [clear]);

  return null;
}

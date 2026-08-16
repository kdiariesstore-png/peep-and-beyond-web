"use client";

import { useEffect, useRef } from "react";
import { useCart } from "../lib/cart/cart-context";

// Rendered only on the Oreem *success* page: the confirmation page is a server
// component and cannot call useCart().clear() itself, so this clears the paid-for
// cart client-side once the success page mounts. Never render this on a failure
// path — the cart must survive for a retry.
export function ClearCartOnMount() {
  const { clear, hydrated } = useCart();
  const hasCleared = useRef(false);

  // Gate on `hydrated`, not just on mount. React runs child effects before parent
  // effects, so clearing on mount would fire BEFORE CartProvider's load-from-storage
  // effect, and that hydration would then restore the cart we just cleared. Waiting
  // for `hydrated` means nothing can overwrite the clear afterwards: `saveCart` only
  // runs for post-hydration changes, so it persists the empty cart correctly.
  useEffect(() => {
    if (hydrated && !hasCleared.current) {
      hasCleared.current = true;
      clear();
    }
  }, [hydrated, clear]);

  return null;
}

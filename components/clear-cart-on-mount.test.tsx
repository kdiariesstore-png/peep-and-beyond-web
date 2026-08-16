import React from "react";
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "../lib/cart/cart-context";
import { ClearCartOnMount } from "./clear-cart-on-mount";
import type { CartItem } from "../lib/types";

const STORAGE_KEY = "peep-cart-v1";

const persistedItem: CartItem = {
  id: "item-1",
  customization: {
    storyLanguage: "ar",
    cardLanguage: "ar",
    cupColor: "pink",
    childName: "سارة",
    giftCard: false,
  },
  unitPriceBhd: 21.9,
  quantity: 1,
};

function CartProbe() {
  const { items } = useCart();
  return <div data-testid="count">{items.length}</div>;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("ClearCartOnMount", () => {
  // Regression test for a mount-ordering race: React runs child effects before parent
  // effects, so a naive clear-on-mount fires BEFORE CartProvider's load-from-storage
  // effect, and the hydration then restores the cart the child just cleared. The cart
  // must end up empty in both React state and localStorage.
  it("clears a cart restored from localStorage, and the clear survives hydration", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([persistedItem]));

    render(
      <CartProvider>
        <ClearCartOnMount />
        <CartProbe />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("0");
    });

    // The emptied cart must also be persisted — otherwise the next page load would
    // resurrect the already-paid-for items.
    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("[]");
    });
  });

  it("leaves an already-empty cart empty without error", async () => {
    render(
      <CartProvider>
        <ClearCartOnMount />
        <CartProbe />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("0");
    });
  });
});

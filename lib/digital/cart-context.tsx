"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { DigitalCartItem, DigitalProductId } from "./types";
import { loadDigitalCart, saveDigitalCart } from "./cart-storage";

interface DigitalCartContextValue {
  items: DigitalCartItem[];
  // True once the load-from-localStorage effect has run — same hydration-guard pattern
  // as the physical cart's CartContextValue, needed for the same reason (React runs
  // child effects before parent effects, so an unguarded mount-time write would be
  // clobbered by this provider's own hydration).
  hydrated: boolean;
  addOrReplaceItem: (item: DigitalCartItem) => void;
  removeItem: (id: DigitalProductId) => void;
  clear: () => void;
}

const DigitalCartContext = createContext<DigitalCartContextValue | null>(null);

export function DigitalCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<DigitalCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadDigitalCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveDigitalCart(items);
  }, [items, hydrated]);

  // Each product can appear at most once in the digital cart, so adding an id that's
  // already present replaces its language choice instead of creating a duplicate line.
  const addOrReplaceItem = (item: DigitalCartItem) =>
    setItems((prev) => [...prev.filter((existing) => existing.id !== item.id), item]);

  const removeItem = (id: DigitalProductId) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  const clear = () => setItems([]);

  return (
    <DigitalCartContext.Provider value={{ items, hydrated, addOrReplaceItem, removeItem, clear }}>
      {children}
    </DigitalCartContext.Provider>
  );
}

export function useDigitalCart(): DigitalCartContextValue {
  const ctx = useContext(DigitalCartContext);
  if (!ctx) throw new Error("useDigitalCart must be used within a DigitalCartProvider");
  return ctx;
}

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { CartItem } from "../types";
import { loadCart, saveCart } from "./cart-storage";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCart(items);
  }, [items, hydrated]);

  const addItem = (item: CartItem) => setItems((prev) => [...prev, item]);

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    const safeQuantity = Math.max(1, Math.floor(quantity) || 1);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: safeQuantity } : item))
    );
  };

  const clear = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

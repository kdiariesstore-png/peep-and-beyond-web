import type { CartItem } from "../types";

const STORAGE_KEY = "peep-cart-v1";

export function serializeCart(items: CartItem[]): string {
  return JSON.stringify(items);
}

export function deserializeCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CartItem[];
  } catch {
    return [];
  }
}

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  return deserializeCart(window.localStorage.getItem(STORAGE_KEY));
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, serializeCart(items));
}

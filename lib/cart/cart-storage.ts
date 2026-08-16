import type { CartItem } from "../types";

const STORAGE_KEY = "peep-cart-v1";

export function serializeCart(items: CartItem[]): string {
  return JSON.stringify(items);
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;

  if (typeof candidate.id !== "string") return false;
  if (typeof candidate.unitPriceBhd !== "number") return false;
  if (typeof candidate.quantity !== "number") return false;

  const customization = candidate.customization;
  if (typeof customization !== "object" || customization === null) return false;
  const c = customization as Record<string, unknown>;

  if (c.storyLanguage !== "ar" && c.storyLanguage !== "en") return false;
  if (c.cardLanguage !== "ar" && c.cardLanguage !== "en") return false;
  if (c.cupColor !== "pink" && c.cupColor !== "blue") return false;
  if (typeof c.childName !== "string") return false;
  if (typeof c.giftCard !== "boolean") return false;

  return true;
}

export function deserializeCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }
  return deserializeCart(raw);
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeCart(items));
  } catch {
    // Swallow write failures (e.g. QuotaExceededError, SecurityError).
  }
}

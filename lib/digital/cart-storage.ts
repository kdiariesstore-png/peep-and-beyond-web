import type { DigitalCartItem } from "./types";

const STORAGE_KEY = "peep-digital-cart-v1";

const VALID_IDS = new Set([
  "picky-eating",
  "potty-training",
  "screens-big-feelings",
  "sharing-sibling-conflict",
  "sleep-bedtime",
  "starting-school",
  "child-hits",
  "digital-bundle",
]);

function isDigitalCartItem(value: unknown): value is DigitalCartItem {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Record<string, unknown>;
  if (typeof c.id !== "string" || !VALID_IDS.has(c.id)) return false;
  if (c.language !== "ar" && c.language !== "en") return false;
  if (typeof c.unitPriceBhd !== "number") return false;
  return true;
}

export function serializeDigitalCart(items: DigitalCartItem[]): string {
  return JSON.stringify(items);
}

export function deserializeDigitalCart(raw: string | null): DigitalCartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDigitalCartItem);
  } catch {
    return [];
  }
}

export function loadDigitalCart(): DigitalCartItem[] {
  if (typeof window === "undefined") return [];
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }
  return deserializeDigitalCart(raw);
}

export function saveDigitalCart(items: DigitalCartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeDigitalCart(items));
  } catch {
    // Swallow write failures (e.g. QuotaExceededError, SecurityError).
  }
}

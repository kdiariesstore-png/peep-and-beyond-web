import { kv } from "@vercel/kv";
import type { StoryLanguage } from "../types";

export const INITIAL_STORY_STOCK = 25;
export const PRE_ORDER_NOTE =
  "نفدت النسخ المطبوعة لهذه اللغة حاليًا — سيتحول طلبك إلى طلب مسبق وقد يستغرق أكثر من 10 أيام.";

function stockKey(language: StoryLanguage): string {
  return `peep:story-stock:${language}`;
}

export async function getRemainingStock(language: StoryLanguage): Promise<number> {
  const existing = await kv.get<number>(stockKey(language));
  if (existing === null || existing === undefined) {
    await kv.set(stockKey(language), INITIAL_STORY_STOCK);
    return INITIAL_STORY_STOCK;
  }
  return existing;
}

export async function decrementStockAfterOrder(
  language: StoryLanguage,
  quantity: number
): Promise<number> {
  await getRemainingStock(language); // ensure initialized before decrementing
  return kv.decrby(stockKey(language), quantity);
}

export function isPreOrder(remainingStock: number): boolean {
  return remainingStock <= 0;
}

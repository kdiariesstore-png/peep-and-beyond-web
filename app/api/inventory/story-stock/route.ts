import { NextResponse } from "next/server";
import {
  getRemainingStock,
  isPreOrder,
  INITIAL_STORY_STOCK,
} from "../../../../lib/inventory/story-stock";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [ar, en] = await Promise.all([
      getRemainingStock("ar"),
      getRemainingStock("en"),
    ]);
    return NextResponse.json({
      ar: { remaining: ar, preOrder: isPreOrder(ar) },
      en: { remaining: en, preOrder: isPreOrder(en) },
    });
  } catch (error) {
    console.error("Failed to read story stock", error);
    return NextResponse.json({
      ar: { remaining: INITIAL_STORY_STOCK, preOrder: false },
      en: { remaining: INITIAL_STORY_STOCK, preOrder: false },
    });
  }
}

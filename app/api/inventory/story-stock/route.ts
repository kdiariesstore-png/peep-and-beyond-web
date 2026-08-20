import { NextResponse } from "next/server";
import {
  getRemainingStock,
  isPreOrder,
  INITIAL_STORY_STOCK,
} from "../../../../lib/inventory/story-stock";

export const runtime = "nodejs";
// Without this, Next.js statically optimizes this plain GET and caches the response at
// build time — freezing "remaining stock" at whatever it read during `next build` instead
// of the live KV count. Discovered while adding /api/box-price, which had the same bug.
export const dynamic = "force-dynamic";

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

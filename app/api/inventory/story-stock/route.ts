import { NextResponse } from "next/server";
import { getRemainingStock, isPreOrder } from "../../../../lib/inventory/story-stock";

export const runtime = "nodejs";

export async function GET() {
  const [ar, en] = await Promise.all([
    getRemainingStock("ar"),
    getRemainingStock("en"),
  ]);
  return NextResponse.json({
    ar: { remaining: ar, preOrder: isPreOrder(ar) },
    en: { remaining: en, preOrder: isPreOrder(en) },
  });
}

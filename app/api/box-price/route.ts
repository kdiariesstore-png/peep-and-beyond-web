import { NextResponse } from "next/server";
import { getCurrentBoxPriceBhd, REGULAR_PRICE_BHD } from "../../../lib/inventory/launch-pricing";

export const runtime = "nodejs";
// A plain GET with no dynamic APIs used would otherwise get statically optimized by
// Next.js and cached at build time — freezing the launch price forever at whatever it
// happened to be during `next build`. This must read the live KV counter on every request.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { priceBhd, isLaunchPrice } = await getCurrentBoxPriceBhd();
    return NextResponse.json({
      priceBhd,
      isLaunchPrice,
      originalPriceBhd: REGULAR_PRICE_BHD,
    });
  } catch (error) {
    console.error("Failed to read the current box price", error);
    // Fail closed to the regular (higher) price rather than risk under-charging.
    return NextResponse.json({
      priceBhd: REGULAR_PRICE_BHD,
      isLaunchPrice: false,
      originalPriceBhd: REGULAR_PRICE_BHD,
    });
  }
}

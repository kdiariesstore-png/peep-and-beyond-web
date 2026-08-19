import { NextRequest, NextResponse } from "next/server";
import { quoteShippingBhd } from "../../../../lib/order/quote-shipping";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const countryCode = (body as Record<string, unknown> | null)?.countryCode;
  const city = (body as Record<string, unknown> | null)?.city;
  const boxQty = (body as Record<string, unknown> | null)?.boxQty;

  if (typeof countryCode !== "string" || countryCode.length === 0) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (!Number.isInteger(boxQty) || (boxQty as number) < 0) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const shippingBhd = await quoteShippingBhd(
      countryCode,
      typeof city === "string" && city.length > 0 ? city : undefined,
      boxQty as number
    );
    return NextResponse.json({ shippingBhd });
  } catch (error) {
    console.error("Shipping quote request failed", error);
    return NextResponse.json({ error: "quote_failed" }, { status: 502 });
  }
}

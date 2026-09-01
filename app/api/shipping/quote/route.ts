import { NextRequest, NextResponse } from "next/server";
import { normalizePhysicalCartItems } from "../../../../lib/cart/validate-cart";
import { quoteShippingBhd } from "../../../../lib/order/quote-shipping";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const candidate = body as Record<string, unknown> | null;
  const countryCode = candidate?.countryCode;
  const city = candidate?.city;
  const items = normalizePhysicalCartItems(candidate?.items);
  if (
    typeof countryCode !== "string" ||
    typeof city !== "string" ||
    !items
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const shippingBhd = await quoteShippingBhd(countryCode, city, items);
  return NextResponse.json({ shippingBhd });
}

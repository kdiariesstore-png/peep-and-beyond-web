import { NextRequest, NextResponse } from "next/server";
import { fetchCities } from "../../../../lib/payments/oreem-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const countryCode = request.nextUrl.searchParams.get("country");
  if (!countryCode) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const cities = await fetchCities(countryCode);
  return NextResponse.json({ cities: cities.map((c) => c.name) });
}

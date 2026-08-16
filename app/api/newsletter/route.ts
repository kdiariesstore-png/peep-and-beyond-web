import { NextRequest, NextResponse } from "next/server";
import { isValidEmail } from "../../../lib/newsletter/validate-email";
import { addToMarketingAudience } from "../../../lib/email/resend-client";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  try {
    await addToMarketingAudience(email);
  } catch (error) {
    console.error("Failed to add newsletter signup to marketing audience", error);
    return NextResponse.json({ error: "subscribe_failed" }, { status: 502 });
  }

  return NextResponse.json({ status: "subscribed" });
}

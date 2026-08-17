import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { decodeDigitalOrderPayload, wasDigitalItemPurchased } from "../../../lib/digital/order-payload";
import { verifyTransaction } from "../../../lib/payments/oreem-client";
import { watermarkPdf } from "../../../lib/digital/watermark-pdf";
import { digitalFileName } from "../../../lib/digital/catalog";
import type { DigitalLanguage, DigitalTopicId } from "../../../lib/digital/types";

export const runtime = "nodejs";

const VALID_TOPIC_IDS = new Set<DigitalTopicId>([
  "picky-eating",
  "potty-training",
  "screens-big-feelings",
  "sharing-sibling-conflict",
  "sleep-bedtime",
  "starting-school",
  "child-hits",
]);

export async function GET(request: NextRequest) {
  const encodedOrder = request.nextUrl.searchParams.get("order");
  const product = request.nextUrl.searchParams.get("product");
  const language = request.nextUrl.searchParams.get("language");

  if (
    !encodedOrder ||
    !product ||
    !VALID_TOPIC_IDS.has(product as DigitalTopicId) ||
    (language !== "ar" && language !== "en")
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const payload = decodeDigitalOrderPayload(encodedOrder);
  if (!payload) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // Never trust the confirmation page or the URL alone — independently re-verify the
  // payment before serving anything, same fail-closed pattern as the physical box's
  // confirmation page.
  let verification;
  try {
    verification = await verifyTransaction(payload.txnRef);
  } catch (error) {
    console.error("Failed to verify Oreem transaction for digital download", error);
    return NextResponse.json({ error: "verification_failed" }, { status: 502 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "payment_not_verified" }, { status: 403 });
  }

  if (
    verification.amountBhd !== undefined &&
    !(
      Number.isFinite(payload.totalBhd) &&
      Math.abs(verification.amountBhd - payload.totalBhd) <= 0.001
    )
  ) {
    console.error("Oreem verified amount does not match digital order payload total", {
      txnRef: payload.txnRef,
      verifiedAmount: verification.amountBhd,
      payloadTotal: payload.totalBhd,
    });
    return NextResponse.json({ error: "amount_mismatch" }, { status: 403 });
  }

  // Confirm the requested product/language was actually part of what this txnRef paid
  // for — either as its own line, or covered by a bundle purchase in the same language.
  const topicId = product as DigitalTopicId;
  if (!wasDigitalItemPurchased(payload, topicId, language as DigitalLanguage)) {
    return NextResponse.json({ error: "not_purchased" }, { status: 403 });
  }

  const fileName = digitalFileName(topicId, language as DigitalLanguage);
  const filePath = path.join(process.cwd(), "content", "digital-products", fileName);

  let sourceBytes: Buffer;
  try {
    sourceBytes = await readFile(filePath);
  } catch (error) {
    console.error("Failed to read digital product source file", { fileName, error });
    return NextResponse.json({ error: "file_unavailable" }, { status: 500 });
  }

  let watermarked: Buffer;
  try {
    watermarked = await watermarkPdf(sourceBytes, `Peep & beyond - Order ${payload.txnRef}`);
  } catch (error) {
    console.error("Failed to watermark digital product file", { fileName, error });
    return NextResponse.json({ error: "watermark_failed" }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(watermarked), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

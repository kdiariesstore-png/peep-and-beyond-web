// @vitest-environment node
//
// pdf-lib's typed-array checks (`instanceof Uint8Array`) break under the project's default
// jsdom test environment (see lib/digital/watermark-pdf.test.ts for the full explanation),
// and this route both loads a PDF through pdf-lib and constructs real NextRequest objects,
// so it opts into the Node environment like that file does.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PDFDocument } from "pdf-lib";
import { encodeDigitalOrderPayload } from "../../../lib/digital/order-payload";
import type { DigitalCartItem } from "../../../lib/digital/types";
import { GET } from "./route";

// The route calls readFile() with a runtime-computed path into content/digital-products/,
// which doesn't need to exist for these tests — we only care about the route's own logic
// (param validation, signature/entitlement checks, response shape), not the real PDF
// files on disk. Returning an in-memory, pdf-lib-valid PDF keeps the "valid request"
// case exercising the real watermark step without touching the filesystem.
const readFileMock = vi.fn();
vi.mock("node:fs/promises", () => ({
  readFile: (...args: unknown[]) => readFileMock(...args),
}));

// Independently re-verifying with Oreem is the whole point of this route, so every test
// controls what "Oreem" says via this mock rather than making a real network call.
const verifyTransactionMock = vi.fn();
vi.mock("../../../lib/payments/oreem-client", () => ({
  verifyTransaction: (...args: unknown[]) => verifyTransactionMock(...args),
}));

async function makeTestPdfBytes(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  return Buffer.from(await doc.save());
}

function buildRequest(params: Record<string, string | undefined>): NextRequest {
  const url = new URL("http://localhost/api/digital-download");
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

const SINGLE_TOPIC_ITEM: DigitalCartItem = { id: "sleep-bedtime", language: "ar", unitPriceBhd: 2.99 };

beforeEach(() => {
  process.env.DIGITAL_ORDER_SECRET = "test-signing-secret";
  readFileMock.mockReset();
  verifyTransactionMock.mockReset();
});

describe("GET /api/digital-download", () => {
  it("returns 400 when the order param is missing", async () => {
    const response = await GET(buildRequest({ product: "sleep-bedtime", language: "ar" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });

  it("returns 400 when the product param is missing or not a recognised topic", async () => {
    const encoded = encodeDigitalOrderPayload({
      txnRef: "peepdigi_abc123",
      buyer: { fullName: "سارة أحمد", email: "sara@example.com", country: "BH", marketingOptIn: false },
      items: [SINGLE_TOPIC_ITEM],
      totalBhd: 2.99,
    });

    const missingProduct = await GET(buildRequest({ order: encoded, language: "ar" }));
    expect(missingProduct.status).toBe(400);

    // "digital-bundle" is a valid cart item id but is never itself a download target —
    // only the 7 individual topic ids are.
    const bundleAsProduct = await GET(
      buildRequest({ order: encoded, product: "digital-bundle", language: "ar" })
    );
    expect(bundleAsProduct.status).toBe(400);
  });

  it("returns 400 when the language param is missing or invalid", async () => {
    const encoded = encodeDigitalOrderPayload({
      txnRef: "peepdigi_abc123",
      buyer: { fullName: "سارة أحمد", email: "sara@example.com", country: "BH", marketingOptIn: false },
      items: [SINGLE_TOPIC_ITEM],
      totalBhd: 2.99,
    });

    const response = await GET(buildRequest({ order: encoded, product: "sleep-bedtime", language: "fr" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when the order param fails to decode (garbage or tampered)", async () => {
    const response = await GET(
      buildRequest({ order: "not-a-real-payload", product: "sleep-bedtime", language: "ar" })
    );
    expect(response.status).toBe(400);
    expect(verifyTransactionMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the payload's txnRef is not in the digital namespace, without calling Oreem", async () => {
    // A txnRef that doesn't start with "peepdigi_" (the prefix
    // app/api/orders/digital-oreem/route.ts always generates) must never reach
    // verifyTransaction — this is the defence-in-depth guard against a digital-download
    // request being pointed at some other order's txnRef.
    const encoded = encodeDigitalOrderPayload({
      txnRef: "peepbox_someotherorder",
      buyer: { fullName: "سارة أحمد", email: "sara@example.com", country: "BH", marketingOptIn: false },
      items: [SINGLE_TOPIC_ITEM],
      totalBhd: 2.99,
    });

    const response = await GET(buildRequest({ order: encoded, product: "sleep-bedtime", language: "ar" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
    expect(verifyTransactionMock).not.toHaveBeenCalled();
  });

  it("returns 403 when Oreem reports the transaction as not verified", async () => {
    verifyTransactionMock.mockResolvedValue({ verified: false, status: "pending" });
    const encoded = encodeDigitalOrderPayload({
      txnRef: "peepdigi_abc123",
      buyer: { fullName: "سارة أحمد", email: "sara@example.com", country: "BH", marketingOptIn: false },
      items: [SINGLE_TOPIC_ITEM],
      totalBhd: 2.99,
    });

    const response = await GET(buildRequest({ order: encoded, product: "sleep-bedtime", language: "ar" }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "payment_not_verified" });
  });

  it("returns 403 when Oreem's verified amount doesn't match the trusted catalog total", async () => {
    verifyTransactionMock.mockResolvedValue({ verified: true, status: "completed", amountBhd: 99 });
    const encoded = encodeDigitalOrderPayload({
      txnRef: "peepdigi_abc123",
      buyer: { fullName: "سارة أحمد", email: "sara@example.com", country: "BH", marketingOptIn: false },
      items: [SINGLE_TOPIC_ITEM],
      totalBhd: 2.99,
    });

    const response = await GET(buildRequest({ order: encoded, product: "sleep-bedtime", language: "ar" }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "amount_mismatch" });
  });

  it("returns 403 when Oreem's response is verified but carries no usable amount (fail closed)", async () => {
    verifyTransactionMock.mockResolvedValue({ verified: true, status: "completed", amountBhd: undefined });
    const encoded = encodeDigitalOrderPayload({
      txnRef: "peepdigi_abc123",
      buyer: { fullName: "سارة أحمد", email: "sara@example.com", country: "BH", marketingOptIn: false },
      items: [SINGLE_TOPIC_ITEM],
      totalBhd: 2.99,
    });

    const response = await GET(buildRequest({ order: encoded, product: "sleep-bedtime", language: "ar" }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "amount_mismatch" });
  });

  it("returns 403 when the requested item was not part of what this txnRef paid for", async () => {
    verifyTransactionMock.mockResolvedValue({ verified: true, status: "completed", amountBhd: 2.99 });
    // Payload legitimately paid for "sleep-bedtime", but the request asks for
    // "child-hits" — this is the exact forged-item-identity scenario the whole-branch
    // review flagged, and it must be rejected even though the payload's own signature
    // is valid (it's real, just doesn't cover this product).
    const encoded = encodeDigitalOrderPayload({
      txnRef: "peepdigi_abc123",
      buyer: { fullName: "سارة أحمد", email: "sara@example.com", country: "BH", marketingOptIn: false },
      items: [SINGLE_TOPIC_ITEM],
      totalBhd: 2.99,
    });

    const response = await GET(buildRequest({ order: encoded, product: "child-hits", language: "ar" }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "not_purchased" });
  });

  it("returns 200 with a watermarked PDF for a fully valid, verified request", async () => {
    verifyTransactionMock.mockResolvedValue({ verified: true, status: "completed", amountBhd: 2.99 });
    readFileMock.mockResolvedValue(await makeTestPdfBytes());
    const encoded = encodeDigitalOrderPayload({
      txnRef: "peepdigi_abc123",
      buyer: { fullName: "سارة أحمد", email: "sara@example.com", country: "BH", marketingOptIn: false },
      items: [SINGLE_TOPIC_ITEM],
      totalBhd: 2.99,
    });

    const response = await GET(buildRequest({ order: encoded, product: "sleep-bedtime", language: "ar" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("sleep-bedtime-ar.pdf");

    const bytes = new Uint8Array(await response.arrayBuffer());
    const resultDoc = await PDFDocument.load(bytes);
    expect(resultDoc.getPageCount()).toBe(1);
  });

  it("returns 200 for a topic covered by a purchased same-language bundle", async () => {
    verifyTransactionMock.mockResolvedValue({ verified: true, status: "completed", amountBhd: 13.99 });
    readFileMock.mockResolvedValue(await makeTestPdfBytes());
    const encoded = encodeDigitalOrderPayload({
      txnRef: "peepdigi_bundle123",
      buyer: { fullName: "سارة أحمد", email: "sara@example.com", country: "BH", marketingOptIn: false },
      items: [{ id: "digital-bundle", language: "ar", unitPriceBhd: 13.99 }],
      totalBhd: 13.99,
    });

    const response = await GET(buildRequest({ order: encoded, product: "child-hits", language: "ar" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
  });

  it("returns 200 for starting-school when the school-season bundle was bought", async () => {
    verifyTransactionMock.mockResolvedValue({ verified: true, status: "completed", amountBhd: 3.9 });
    readFileMock.mockResolvedValue(await makeTestPdfBytes());
    const encoded = encodeDigitalOrderPayload({
      txnRef: "peepdigi_schoolbundle123",
      buyer: { fullName: "سارة أحمد", email: "sara@example.com", country: "BH", marketingOptIn: false },
      items: [{ id: "school-season-bundle", language: "en", unitPriceBhd: 3.9 }],
      totalBhd: 3.9,
    });

    const response = await GET(buildRequest({ order: encoded, product: "starting-school", language: "en" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
  });

  it("returns 403 for a topic outside the school-season bundle", async () => {
    verifyTransactionMock.mockResolvedValue({ verified: true, status: "completed", amountBhd: 3.9 });
    const encoded = encodeDigitalOrderPayload({
      txnRef: "peepdigi_schoolbundle123",
      buyer: { fullName: "سارة أحمد", email: "sara@example.com", country: "BH", marketingOptIn: false },
      items: [{ id: "school-season-bundle", language: "en", unitPriceBhd: 3.9 }],
      totalBhd: 3.9,
    });

    const response = await GET(buildRequest({ order: encoded, product: "child-hits", language: "en" }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "not_purchased" });
  });
});

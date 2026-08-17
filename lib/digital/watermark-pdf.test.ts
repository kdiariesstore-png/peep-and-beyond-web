// @vitest-environment node
//
// pdf-lib's typed-array checks (`instanceof Uint8Array`) break under the project's default
// jsdom test environment: jsdom's realm has its own Uint8Array/ArrayBuffer globals, distinct
// from the ones Node's Buffer is built on, so `Buffer.from(...) instanceof Uint8Array` fails
// across the realm boundary and pdf-lib's `PDFDocument.load` rejects valid Buffers. This file
// only exercises pure Node/Buffer logic (no DOM), so it opts into the Node environment.
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { watermarkPdf } from "./watermark-pdf";

async function makeTestPdf(pageCount: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([200, 200]);
  }
  return Buffer.from(await doc.save());
}

describe("watermarkPdf", () => {
  it("returns a valid PDF with the same page count as the source", async () => {
    const source = await makeTestPdf(3);
    const result = await watermarkPdf(source, "Peep & beyond - Order test123");
    const resultDoc = await PDFDocument.load(result);
    expect(resultDoc.getPageCount()).toBe(3);
  });

  it("produces different bytes than the unwatermarked source", async () => {
    const source = await makeTestPdf(1);
    const result = await watermarkPdf(source, "Peep & beyond - Order test123");
    expect(Buffer.compare(source, result)).not.toBe(0);
  });
});

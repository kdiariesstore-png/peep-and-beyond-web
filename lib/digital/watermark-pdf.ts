import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Watermark text must stay ASCII-only: pdf-lib's 14 standard fonts (WinAnsi encoding)
// have no Arabic glyphs, and embedding a custom Arabic font is out of scope for this
// lightweight, traceability-only stamp (site name + order reference, not DRM).
export async function watermarkPdf(sourceBytes: Buffer, watermarkText: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(sourceBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    page.drawText(watermarkText, {
      x: 12,
      y: 12,
      size: 8,
      font,
      color: rgb(0.55, 0.55, 0.55),
      opacity: 0.65,
    });
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

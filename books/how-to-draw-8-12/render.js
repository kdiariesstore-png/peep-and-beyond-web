// Renders out/interior.html and out/cover.html to KDP-ready PDFs (+ PNG previews).
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const out = path.join(__dirname, 'out');
  const specs = fs.readFileSync(path.join(out, 'specs.txt'), 'utf8');
  const [cw, ch] = specs.match(/Cover size.*?: ([\d.]+) x ([\d.]+)/).slice(1).map(Number);
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + path.join(out, 'interior.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(out, 'interior.pdf'), preferCSSPageSize: true, printBackground: true });
  const c = await b.newPage({ viewport: { width: Math.round(cw * 96), height: Math.round(ch * 96) }, deviceScaleFactor: 300 / 96 });
  await c.goto('file://' + path.join(out, 'cover.html'), { waitUntil: 'networkidle' });
  await c.evaluate(() => document.fonts.ready);
  // Raster at 300 dpi; cover_pdf.py places it on a PDF page of the exact KDP size
  // (Chromium rounds PDF page sizes, and KDP checks cover dimensions).
  await c.screenshot({ path: path.join(out, 'cover-300dpi.png') });
  await b.close();
})();

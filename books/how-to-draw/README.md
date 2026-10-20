# How to Draw Everything for Kids (KDP book)

100 step-by-step drawings in 10 themes. The interior is 8.5 x 11 in, black & white, with no bleed. The cover is a yellow full wrap.

## Upload to KDP
- **Interior:** `out/interior.pdf` (118 pages). Trim 8.5 x 11 in, no bleed, black & white, white paper.
- **Cover:** `out/cover.pdf`, 17.5157 x 11.25 in (0.125 in bleed, 0.2657 in spine). KDP prints its barcode in the white box on the back.

## Edit & rebuild
- Title, author and age range are set at the top of `build.py`.
- Each drawing lives in `drawings/d*.py` as a list of steps built from simple shapes (`dsl.py`).
- `python3 preview.py d01_pets sheet.html` writes a contact sheet so you can check a set of drawings.

```bash
python3 build.py && NODE_PATH=$(npm root -g) node render.js && python3 cover_pdf.py
```

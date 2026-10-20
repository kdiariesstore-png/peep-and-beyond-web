# Draw Like a Pro for Kids (ages 8-12, KDP book)

This book has 50 detailed drawings in 5 chapters. Each drawing gets a steps page (6-7 steps, guidelines, an instruction under every step, a Pro Tip) and a practice page with a proportion grid.

- **Interior:** `out/interior.pdf` (114 pages). Trim 8.5 x 11 in, no bleed, black & white.
- **Cover:** `out/cover.pdf`, 17.5067 x 11.25 in (0.125 in bleed, 0.2567 in spine).
- **Amazon listing:** `LISTING.md`

The drawings live in `drawings/e*.py`, with shared parts in `drawings/chibi.py`. The drawing engine (`dsl.py`) lives in `../how-to-draw`.

```bash
python3 build.py && NODE_PATH=$(npm root -g) node render.js && python3 cover_pdf.py
```

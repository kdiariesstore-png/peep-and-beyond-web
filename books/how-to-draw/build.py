"""Build the interior and cover HTML for "How to Draw Everything for Kids".

    python3 build.py && NODE_PATH=$(npm root -g) node render.js
"""
import glob
import importlib
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "drawings"))
import dsl  # noqa: E402

for f in sorted(glob.glob(os.path.join(HERE, "drawings", "d*.py"))):
    importlib.import_module(os.path.basename(f)[:-3])

# ---- Book settings (edit these) -------------------------------------------
TITLE = "How to Draw Everything for Kids"
SUBTITLE = "100 Easy Step-by-Step Drawings"
AUTHOR = "Khadija AbdulRasool"
AGES = "Ages 3-8"
YEAR = 2026
PAPER_IN_PER_PAGE = 0.002252  # KDP white paper, black ink
OUT = os.path.join(HERE, "out")
# ---------------------------------------------------------------------------

FONTS = ('<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800'
         '&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">')

STROKES = """
.old{stroke:#b3b3b3;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.new{stroke:#111;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
"""

drawings = dsl.DRAWINGS
categories = []
for d in drawings:
    if d["category"] not in categories:
        categories.append(d["category"])


def final_svg(d):
    return dsl.render_svg(d, len(d["steps"]) - 1, highlight=False)


def article(name):
    return "an" if name[0].lower() in "aeiou" else "a"


# ---------------------------------------------------------------------------
# Interior
# ---------------------------------------------------------------------------
pages = []  # (kind, html, show_page_number)


def page(html, kind="", number=True):
    pages.append((kind, html, number))


page(f"""
<div class="title-page">
  <div class="tp-sub">{AGES}</div>
  <h1>{TITLE}</h1>
  <div class="tp-subtitle">{SUBTITLE}</div>
  <div class="tp-grid">{''.join(f'<div class="tp-cell">{final_svg(d)}</div>' for d in drawings[::11][:9])}</div>
  <div class="tp-author">{AUTHOR}</div>
</div>""", number=False)

page(f"""
<div class="copyright">
  <p><b>{TITLE}</b><br>{SUBTITLE}</p>
  <p>Copyright &copy; {YEAR} {AUTHOR}. All rights reserved.</p>
  <p>No part of this book may be reproduced, stored, or transmitted in any form or by any means
  without written permission from the publisher, except for brief quotations in reviews.</p>
  <p>Pages may be copied by the purchaser for personal, home, or single-classroom use only.</p>
  <p>First edition.</p>
</div>""", number=False)

page("""
<div class="belongs">
  <div class="frame">
    <div class="b-head">This book belongs to</div>
    <div class="b-line"></div>
    <div class="b-sub">Draw yourself here!</div>
    <div class="b-box"></div>
  </div>
</div>""")

page(f"""
<div class="howto">
  <h2>How to Use This Book</h2>
  <div class="tips">
    <div class="tip"><span class="n">1</span><div><b>Pick a drawing.</b> Start with anything you like &mdash; there are 100 to choose from!</div></div>
    <div class="tip"><span class="n">2</span><div><b>Follow the steps.</b> In each box, the <b>dark black lines</b> are what you draw next.
      The <span class="grey">light grey lines</span> are what you already drew.</div></div>
    <div class="tip"><span class="n">3</span><div><b>Draw lightly with a pencil.</b> Small, soft lines are easy to erase and fix.</div></div>
    <div class="tip"><span class="n">4</span><div><b>Use the big box.</b> Every page has a space that says <b>Your Turn!</b> &mdash; draw it there.</div></div>
    <div class="tip"><span class="n">5</span><div><b>Add color!</b> Go over your lines with a marker, then color it in any way you want.</div></div>
    <div class="tip"><span class="n">6</span><div><b>Mistakes are OK!</b> Every artist practices. Try again and it gets easier every time.</div></div>
  </div>
  <div class="example">
    <div class="ex-cell">{dsl.render_svg(drawings[0], 1)}<span>light grey = already drawn</span></div>
    <div class="ex-arrow">&rarr;</div>
    <div class="ex-cell">{dsl.render_svg(drawings[0], 2)}<span>black = draw this now</span></div>
  </div>
  <div class="supplies"><b>You will need:</b> a pencil &bull; an eraser &bull; crayons, colored pencils or markers</div>
</div>""")

contents_index = len(pages)
page("CONTENTS")  # replaced once page numbers are known

body_start = {}
for ci, cat in enumerate(categories):
    items = [d for d in drawings if d["category"] == cat]
    body_start[cat] = len(pages)
    previews = "".join(f'<div class="dv-cell">{final_svg(d)}</div>' for d in items[:6])
    page(f"""
<div class="divider">
  <div class="dv-kicker">Part {ci + 1}</div>
  <h2>{cat}</h2>
  <div class="dv-count">{len(items)} drawings to learn</div>
  <div class="dv-grid">{previews}</div>
</div>""", kind="divider")
    for d in items:
        d["page_index"] = len(pages)
        n = len(d["steps"])
        cells = "".join(
            f'<div class="step"><span class="sn">{i + 1}</span>{dsl.render_svg(d, i)}</div>'
            for i in range(n))
        layout = "four" if n == 4 else "five"
        page(f"""
<div class="dpage">
  <div class="dhead">
    <div class="dnum">{drawings.index(d) + 1}</div>
    <div class="dtitle"><small>How to draw {article(d['name'])}</small>{d['name']}</div>
    <div class="dcat">{cat}</div>
  </div>
  <div class="steps {layout}">{cells}</div>
  <div class="practice"><span class="yt">Your Turn!</span></div>
</div>""", kind="drawing")

for _ in range(2):
    page("""
<div class="dpage">
  <div class="dhead"><div class="dtitle"><small>Free drawing page</small>Draw Anything You Like!</div></div>
  <div class="practice tall"><span class="yt">Your Imagination</span></div>
</div>""")

cert_pics = "".join(f'<div class="c-cell">{final_svg(drawings[i])}</div>' for i in (0, 20, 50, 70, 80))
page(f"""
<div class="cert">
  <div class="cert-in">
    <div class="c-kicker">Certificate of Awesome</div>
    <h2>Super Artist!</h2>
    <p>This certifies that</p>
    <div class="c-line"></div>
    <p>learned to draw <b>100 amazing things</b><br>and is now an official Super Artist!</p>
    <div class="c-stars">{cert_pics}</div>
    <div class="c-sign"><div><div class="c-line short"></div>Date</div><div><div class="c-line short"></div>Signed</div></div>
  </div>
</div>""")

if len(pages) % 2:
    page('<div class="blank"></div>', number=False)

rows = []
for cat in categories:
    items = [d for d in drawings if d["category"] == cat]
    names = " &middot; ".join(f"{d['name']} <i>{d['page_index'] + 1}</i>" for d in items)
    rows.append(f'<div class="toc-row"><div class="toc-cat"><span>{cat}</span><span class="toc-p">{body_start[cat] + 1}</span></div>'
                f'<div class="toc-items">{names}</div></div>')
pages[contents_index] = ("", f'<div class="toc"><h2>What\'s Inside</h2>{"".join(rows)}</div>', True)

INTERIOR_CSS = """
@page { size: 8.5in 11in; margin: 0 }
* { box-sizing: border-box }
html, body { margin: 0; padding: 0; background: #fff; color: #111 }
body { font-family: 'Nunito', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact }
.page { width: 8.5in; height: 11in; padding: 0.6in 0.7in 0.65in; position: relative; overflow: hidden;
        page-break-after: always; break-after: page }
.pnum { position: absolute; bottom: 0.3in; left: 0; right: 0; text-align: center; font: 700 11pt 'Nunito'; color: #555 }
h1, h2 { font-family: 'Baloo 2', sans-serif; margin: 0 }
svg { display: block; width: 100%; height: 100% }

.title-page { height: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: .3in }
.title-page h1 { font-size: 46pt; line-height: 1; margin: .15in 0 .1in }
.tp-sub { font: 800 14pt 'Nunito'; border: 2.5px solid #111; border-radius: 30px; padding: 4px 18px }
.tp-subtitle { font: 700 18pt 'Nunito'; color: #333 }
.tp-grid { display: grid; grid-template-columns: repeat(3, 1.65in); gap: .22in; margin: .55in 0 }
.tp-cell { width: 1.65in; height: 1.65in; border: 2px solid #111; border-radius: 22px; padding: .14in }
.tp-author { margin-top: auto; font: 800 16pt 'Baloo 2' }

.copyright { height: 100%; display: flex; flex-direction: column; justify-content: flex-end; font-size: 10pt; color: #333; line-height: 1.5 }

.belongs .frame { margin-top: .3in; border: 3px dashed #111; border-radius: 30px; height: 9.2in; padding: .5in; text-align: center }
.b-head { font: 800 32pt 'Baloo 2' }
.b-line { border-bottom: 3px solid #111; margin: .5in .4in .5in; height: .4in }
.b-sub { font: 700 15pt 'Nunito'; color: #444 }
.b-box { margin: .25in auto 0; width: 5in; height: 5.4in; border: 2.5px solid #111; border-radius: 24px }

.howto h2, .toc h2 { font-size: 34pt; text-align: center; margin-bottom: .25in }
.tips { display: grid; gap: .16in }
.tip { display: flex; gap: .18in; align-items: flex-start; font-size: 13.5pt; line-height: 1.35 }
.tip .n { flex: none; width: .45in; height: .45in; border-radius: 50%; border: 2.5px solid #111;
          display: flex; align-items: center; justify-content: center; font: 800 15pt 'Baloo 2' }
.grey { color: #888; font-weight: 700 }
.example { display: flex; align-items: center; justify-content: center; gap: .3in; margin: .35in 0 .25in }
.ex-cell { width: 2.1in; height: 2.1in; border: 2px solid #111; border-radius: 18px; padding: .15in; position: relative }
.ex-cell span { position: absolute; bottom: -.32in; left: -.2in; right: -.2in; text-align: center; font: 700 10.5pt 'Nunito' }
.ex-arrow { font-size: 34pt; font-weight: 800 }
.supplies { margin-top: .5in; text-align: center; font-size: 12.5pt; border-top: 2px solid #111; padding-top: .15in }

.toc-row { border-bottom: 1.5px solid #ccc; padding: .085in 0 }
.toc-cat { display: flex; justify-content: space-between; font: 800 15pt 'Baloo 2'; line-height: 1.2 }
.toc-items { font-size: 9.6pt; color: #333; line-height: 1.45 }
.toc-items i { font-style: normal; color: #888; font-weight: 700 }

.divider { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
           border: 4px solid #111; border-radius: 36px; padding: .4in }
.dv-kicker { font: 800 16pt 'Nunito'; letter-spacing: 3px; text-transform: uppercase; color: #555 }
.divider h2 { font-size: 50pt; line-height: 1.05; margin: .1in 0 }
.dv-count { font: 700 15pt 'Nunito'; color: #444 }
.dv-grid { display: grid; grid-template-columns: repeat(3, 1.7in); gap: .25in; margin-top: .55in }
.dv-cell { width: 1.7in; height: 1.7in; border: 2px dashed #999; border-radius: 50%; padding: .25in }

.dpage { height: 100%; display: flex; flex-direction: column }
.dhead { display: flex; align-items: center; gap: .16in; border-bottom: 3px solid #111; padding-bottom: .1in; margin-bottom: .24in }
.dnum { flex: none; width: .62in; height: .62in; border-radius: 50%; background: #111; color: #fff;
        display: flex; align-items: center; justify-content: center; font: 800 19pt 'Baloo 2'; padding-top: 2px }
.dtitle { font: 800 27pt 'Baloo 2'; line-height: .95; flex: 1 }
.dtitle small { display: block; font: 700 11pt 'Nunito'; color: #666; margin-bottom: 2px }
.dcat { font: 700 9.5pt 'Nunito'; border: 1.5px solid #111; border-radius: 20px; padding: 3px 10px; white-space: nowrap }
.steps { display: grid; gap: .2in .16in; justify-content: center }
.steps.five { grid-template-columns: repeat(6, 1.1in) }
.steps.five .step { grid-column: span 2; height: 2.05in }
.steps.five .step:nth-child(4) { grid-column: 2 / span 2 }
.steps.four { grid-template-columns: repeat(4, 1.65in) }
.steps.four .step { height: 1.65in }
.step { border: 2px solid #111; border-radius: 16px; padding: .12in; position: relative }
.sn { position: absolute; top: -.13in; left: -.09in; width: .34in; height: .34in; border-radius: 50%; background: #fff;
      border: 2px solid #111; display: flex; align-items: center; justify-content: center; font: 800 12pt 'Baloo 2'; padding-top: 1px }
.practice { flex: 1; margin-top: .3in; border: 2.5px dashed #111; border-radius: 22px; position: relative;
            background-image: radial-gradient(#cfcfcf 1.1px, transparent 1.3px); background-size: .25in .25in; background-position: center }
.practice.tall { margin-top: .2in }
.yt { position: absolute; top: -.17in; left: .3in; background: #fff; padding: 0 .12in; font: 800 15pt 'Baloo 2' }

.cert { height: 100%; border: 6px double #111; border-radius: 30px; padding: .25in }
.cert-in { height: 100%; border: 2px solid #111; border-radius: 20px; text-align: center; padding: .6in .5in; display: flex; flex-direction: column; align-items: center }
.c-kicker { font: 800 15pt 'Nunito'; letter-spacing: 3px; text-transform: uppercase }
.cert h2 { font-size: 58pt; line-height: 1.1; margin: .1in 0 .2in }
.cert p { font-size: 15pt; line-height: 1.5; margin: .1in 0 }
.c-line { border-bottom: 2.5px solid #111; width: 80%; height: .55in; margin-bottom: .15in }
.c-line.short { width: 2.3in; margin: 0 auto .05in }
.c-stars { display: flex; gap: .15in; margin: .4in 0 }
.c-cell { width: 1.1in; height: 1.1in }
.c-sign { margin-top: auto; display: flex; gap: .7in; font: 700 12pt 'Nunito' }
"""

os.makedirs(OUT, exist_ok=True)
html_pages = []
for i, (kind, html, number) in enumerate(pages):
    pn = f'<div class="pnum">{i + 1}</div>' if number else ""
    html_pages.append(f'<section class="page {kind}">{html}{pn}</section>')
with open(os.path.join(OUT, "interior.html"), "w") as fh:
    fh.write(f'<!doctype html><html><head><meta charset="utf-8"><title>{TITLE} - Interior</title>{FONTS}'
             f'<style>{INTERIOR_CSS}{STROKES}</style></head><body>{"".join(html_pages)}</body></html>')
PAGE_COUNT = len(pages)

# ---------------------------------------------------------------------------
# Cover (full wrap: back + spine + front, 0.125in bleed)
# ---------------------------------------------------------------------------
BLEED = 0.125
SPINE = round(PAGE_COUNT * PAPER_IN_PER_PAGE, 4)
W = BLEED * 2 + 8.5 * 2 + SPINE
H = 11 + BLEED * 2

by_name = {d["name"]: d for d in drawings}
cat = by_name["Cat"]
demo = "".join(
    f'<div class="demo-cell"><span>{i + 1}</span>{dsl.render_svg(cat, i)}</div>'
    + ('<div class="arrow">&#10140;</div>' if i < len(cat["steps"]) - 1 else "")
    for i in range(len(cat["steps"])))
front_pics = ["Lion", "Rocket", "T-Rex", "Unicorn", "Ice Cream", "Car", "Octopus", "Butterfly", "Puppy"]
stickers = "".join(f'<div class="stk s{i}">{final_svg(by_name[n])}</div>' for i, n in enumerate(front_pics))
back_pics = "".join(f'<div class="bk-cell">{final_svg(by_name[n])}</div>'
                    for n in ["Bunny", "Whale", "Snail", "Pizza", "Helicopter", "Sunflower", "Astronaut", "Castle"])
burst_d = dsl.STAR(50, 50, 49, 40, n=14).svg.split('d="')[1].split('"')[0]

COVER_CSS = f"""
@page {{ size: {W}in {H}in; margin: 0 }}
* {{ box-sizing: border-box }}
html, body {{ margin: 0; padding: 0 }}
body {{ width: {W}in; height: {H}in; position: relative; background: #FFD23F; font-family: 'Nunito', sans-serif; color: #1d1d1b;
        -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: hidden }}
svg {{ display: block; width: 100%; height: 100% }}
.new, .old {{ stroke: #1d1d1b; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round }}
.old {{ stroke: #c9b37a }}
.bg-dots {{ position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,.5) 2.2px, transparent 2.6px); background-size: .32in .32in }}
.front {{ position: absolute; top: 0; bottom: 0; left: {BLEED + 8.5 + SPINE}in; width: {8.5 + BLEED}in; padding: {BLEED + .45}in {BLEED + .45}in 0 .45in }}
.back  {{ position: absolute; top: 0; bottom: 0; left: 0; width: {8.5 + BLEED}in; padding: {BLEED + .5}in .55in 0 {BLEED + .5}in }}
.spine {{ position: absolute; top: 0; bottom: 0; left: {BLEED + 8.5}in; width: {SPINE}in; background: #1d1d1b }}
.spine-text {{ position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(90deg); white-space: nowrap;
              color: #FFD23F; font: 800 {min(SPINE * 72 * 0.5, 12):.1f}pt 'Baloo 2'; letter-spacing: .5px }}
.ages {{ display: inline-block; background: #1d1d1b; color: #FFD23F; font: 800 17pt 'Nunito'; padding: 6px 22px; border-radius: 40px; transform: rotate(-3deg) }}
.front h1 {{ font: 800 66pt/0.9 'Baloo 2'; margin: .18in 0 .14in; color: #1d1d1b }}
.front h1 .big {{ font-size: 92pt; display: block; color: #E4572E; text-shadow: 5px 5px 0 #1d1d1b; line-height: 1; margin: .04in 0 .02in }}
.sub {{ display: inline-block; background: #fff; border: 3px solid #1d1d1b; border-radius: 16px; padding: 4px 18px; font: 800 21pt 'Baloo 2'; box-shadow: 5px 5px 0 #1d1d1b }}
.sub b {{ color: #E4572E }}
.demo {{ display: flex; align-items: center; gap: .05in; margin: .32in 0 0; background: #fff; border: 3px solid #1d1d1b; border-radius: 20px; padding: .12in .14in; box-shadow: 5px 5px 0 #1d1d1b; width: fit-content }}
.demo-cell {{ width: .95in; height: .95in; position: relative }}
.demo-cell span {{ position: absolute; top: -4px; left: -2px; width: .26in; height: .26in; border-radius: 50%; background: #FFD23F; border: 2px solid #1d1d1b;
                   font: 800 10pt 'Baloo 2'; display: flex; align-items: center; justify-content: center; z-index: 2 }}
.arrow {{ font-size: 15pt; font-weight: 800; color: #E4572E }}
.stk {{ position: absolute; background: #fff; border: 3px solid #1d1d1b; border-radius: 50%; padding: .2in; box-shadow: 5px 5px 0 #1d1d1b }}
.s0 {{ width: 2in; height: 2in; left: .35in; top: 6.6in; transform: rotate(-6deg) }}
.s1 {{ width: 1.65in; height: 1.65in; left: 2.5in; top: 6.85in; transform: rotate(5deg) }}
.s2 {{ width: 2in; height: 2in; left: 4.3in; top: 6.55in; transform: rotate(-4deg) }}
.s3 {{ width: 1.65in; height: 1.65in; left: 6.45in; top: 6.85in; transform: rotate(6deg) }}
.s4 {{ width: 1.45in; height: 1.45in; left: .75in; top: 8.8in; transform: rotate(4deg) }}
.s5 {{ width: 1.45in; height: 1.45in; left: 2.6in; top: 8.75in; transform: rotate(-5deg) }}
.s6 {{ width: 1.45in; height: 1.45in; left: 4.45in; top: 8.8in; transform: rotate(5deg) }}
.s7 {{ width: 1.45in; height: 1.45in; left: 6.3in; top: 8.75in; transform: rotate(-6deg) }}
.s8 {{ width: 1.3in; height: 1.3in; left: 6.75in; top: 4.85in; transform: rotate(8deg) }}
.burst {{ position: absolute; right: {BLEED + .45}in; top: {BLEED + 2.95}in; width: 1.5in; height: 1.5in; transform: rotate(10deg) }}
.burst .t {{ position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
             font: 800 10.5pt/1 'Nunito'; color: #fff }}
.burst .t b {{ font: 800 34pt/0.9 'Baloo 2' }}
.author {{ position: absolute; bottom: {BLEED + .32}in; left: 0; right: {BLEED}in; text-align: center; font: 800 15pt 'Baloo 2' }}
.back h2 {{ font: 800 31pt/1 'Baloo 2'; margin: 0 0 .15in }}
.back p {{ font-size: 13pt; line-height: 1.45; margin: 0 0 .14in }}
.back ul {{ margin: 0 0 .2in; padding-left: .25in; font-size: 12.5pt; line-height: 1.55 }}
.back-card {{ background: #fff; border: 3px solid #1d1d1b; border-radius: 22px; padding: .3in .35in; box-shadow: 6px 6px 0 #1d1d1b }}
.bk-grid {{ display: grid; grid-template-columns: repeat(4, 1.55in); gap: .2in; margin-top: .35in }}
.bk-cell {{ width: 1.55in; height: 1.55in; background: #fff; border: 2.5px solid #1d1d1b; border-radius: 50%; padding: .2in }}
.perfect {{ margin-top: .35in; font: 800 14pt 'Baloo 2'; max-width: 5.3in; line-height: 1.3 }}
.barcode {{ position: absolute; right: .55in; bottom: {BLEED + .45}in; width: 2in; height: 1.2in; background: #fff }}
"""

cover = f"""<!doctype html><html><head><meta charset="utf-8"><title>{TITLE} - Cover</title>{FONTS}<style>{COVER_CSS}</style></head><body>
<div class="bg-dots"></div>
<div class="back">
  <div class="back-card">
    <h2>Every kid can be an artist!</h2>
    <p>Turn simple shapes into <b>100 adorable drawings</b>. Each page breaks a picture into a few easy steps &mdash;
    new lines are dark and the lines already drawn are light &mdash; so little artists always know exactly what to draw next.</p>
    <ul>
      <li><b>100 drawings</b> in 10 fun themes: pets, wild animals, sea creatures, bugs, food, vehicles, nature, space, dinosaurs &amp; magic, and toys</li>
      <li><b>4-5 simple steps</b> for every drawing</li>
      <li>A big <b>&ldquo;Your Turn!&rdquo;</b> practice space on every page</li>
      <li>Large 8.5 x 11 in pages &mdash; perfect for crayons, markers and pencils</li>
      <li>A <b>Super Artist certificate</b> to celebrate at the end</li>
    </ul>
    <p style="margin:0">Builds confidence, focus and fine motor skills &mdash; a perfect screen-free gift for ages 3-8.</p>
  </div>
  <div class="bk-grid">{back_pics}</div>
  <div class="perfect">Perfect for birthdays &bull; road trips &bull; rainy days &bull; classrooms &bull; quiet time</div>
</div>
<div class="spine"></div>
<div class="front">
  <div class="ages">{AGES}</div>
  <h1>How to Draw <span class="big">Everything</span>for Kids</h1>
  <div class="sub"><b>100</b> Easy Step-by-Step Drawings</div>
  <div class="demo">{demo}</div>
  <div class="burst">
    <svg viewBox="0 0 100 100"><path d="{burst_d}" fill="#E4572E" stroke="#1d1d1b" stroke-width="2.5" stroke-linejoin="round"/></svg>
    <div class="t"><b>100</b>DRAWINGS</div>
  </div>
  {stickers}
  <div class="author">{AUTHOR}</div>
</div>
</body></html>"""
with open(os.path.join(OUT, "cover.html"), "w") as fh:
    fh.write(cover)
with open(os.path.join(OUT, "specs.txt"), "w") as fh:
    fh.write(f"Interior pages: {PAGE_COUNT}\nTrim: 8.5 x 11 in, no bleed, black & white, white paper\n"
             f"Spine width: {SPINE} in\nCover size (with 0.125 in bleed): {W:.4f} x {H} in\n")
print(f"pages={PAGE_COUNT} spine={SPINE} cover={W:.4f}x{H}")

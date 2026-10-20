"""Build the interior and cover HTML for "Draw Like a Pro for Kids" (ages 8-12).

    python3 build.py && NODE_PATH=$(npm root -g) node render.js && python3 cover_pdf.py
"""
import glob
import importlib
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "how-to-draw"))
sys.path.insert(0, os.path.join(HERE, "drawings"))
import dsl  # noqa: E402

for f in sorted(glob.glob(os.path.join(HERE, "drawings", "e*.py"))):
    importlib.import_module(os.path.basename(f)[:-3])

# ---- Book settings (edit these) -------------------------------------------
TITLE = "Draw Like a Pro for Kids"
SUBTITLE = "50 Step-by-Step Drawings: Characters, Castles, Fantasy Creatures, Animals & Cool Stuff"
AUTHOR = "Khadija AbdulRasool"
AGES = "Ages 8-12"
YEAR = 2026
PAPER_IN_PER_PAGE = 0.002252  # KDP white paper, black ink
OUT = os.path.join(HERE, "out")
# ---------------------------------------------------------------------------

FONTS = ('<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800'
         '&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">')

STROKES = """
.old{stroke:#b0b0b0;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.new{stroke:#111;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.guide{stroke:#8a8a8a;stroke-width:0.9;stroke-dasharray:2.2 2;stroke-linecap:round}
"""

TIPS = [
    "Press lightly with your pencil for the first steps. Light lines are easy to erase later.",
    "Guidelines are your secret weapon. Pros use them to keep everything in the right place.",
    "Draw the big shapes first, then the medium ones, and save the tiny details for last.",
    "Turn your paper as you draw. It is easier to make smooth curves that way.",
    "When you finish, trace over your best lines with a black pen, then erase the pencil.",
    "Try shading: pick where the light comes from and darken the opposite side.",
    "Change it up! Give your drawing a new outfit, pose or background to make it yours.",
    "Look at the whole drawing from far away. It helps you spot what needs fixing.",
    "Mistakes are part of learning. Every artist's sketchbook is full of them.",
    "Practise each drawing two or three times. You will be amazed how fast you improve.",
]

drawings = dsl.DRAWINGS
categories = []
for d in drawings:
    if d["category"] not in categories:
        categories.append(d["category"])


def final_svg(d):
    return dsl.render_svg(d, len(d["steps"]) - 1, highlight=False)


def difficulty(d):
    n = sum(len(s) for s in d["steps"])
    return 1 if n < 28 else 2 if n < 42 else 3


pages = []  # (kind, html, show_page_number)

GRID = ('<svg class="grid" viewBox="0 0 100 100" preserveAspectRatio="none">'
        + "".join(f'<line x1="{v}" y1="0" x2="{v}" y2="100"/><line x1="0" y1="{v}" x2="100" y2="{v}"/>' for v in (25, 50, 75))
        .replace("/>", ' stroke="#cfcfcf" stroke-width="1" vector-effect="non-scaling-stroke"/>') + "</svg>")


def page(html, kind="", number=True):
    pages.append((kind, html, number))


showcase = [d for d in drawings if d["name"] in ("Princess", "Fairy-Tale Castle", "Dragon", "Tiger", "Sports Car", "Ninja")]

page(f"""
<div class="title-page">
  <div class="tp-sub">{AGES}</div>
  <h1>{TITLE}</h1>
  <div class="tp-subtitle">{SUBTITLE}</div>
  <div class="tp-grid">{''.join(f'<div class="tp-cell">{final_svg(d)}</div>' for d in showcase)}</div>
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
    <div class="b-head">This Sketchbook Belongs To</div>
    <div class="b-line"></div>
    <div class="b-sub">Artist signature</div>
    <div class="b-line short"></div>
    <div class="b-sub">Draw your own self-portrait here</div>
    <div class="b-box"></div>
  </div>
</div>""")

guide_demo = next(d for d in drawings if d["name"] == "Girl with a Ponytail")
page(f"""
<div class="howto">
  <h2>How to Draw Like a Pro</h2>
  <div class="tips">
    <div class="tip"><span class="n">1</span><div><b>Start with guidelines.</b> Every drawing begins with <span class="dash">dashed guide lines</span>:
      simple circles, ovals and cross lines that show where everything goes. Draw them very lightly.</div></div>
    <div class="tip"><span class="n">2</span><div><b>Follow the steps.</b> The <b>black lines</b> show what to draw in each step.
      The <span class="grey">grey lines</span> are what you have already drawn. Read the short instruction under each box.</div></div>
    <div class="tip"><span class="n">3</span><div><b>Erase the guidelines.</b> In the last step the guidelines disappear. Erase yours too, and your drawing will look clean and professional.</div></div>
    <div class="tip"><span class="n">4</span><div><b>Practise on the next page.</b> Every drawing has its own full practice page with a light grid to help you get the size and shape right.</div></div>
    <div class="tip"><span class="n">5</span><div><b>Check the difficulty.</b> Look for the stars: <b>&#9733;</b> easy, <b>&#9733;&#9733;</b> medium, <b>&#9733;&#9733;&#9733;</b> challenge.</div></div>
  </div>
  <div class="example">
    <div class="ex-cell">{dsl.render_svg(guide_demo, 0)}<span>1. Guidelines</span></div>
    <div class="ex-arrow">&rarr;</div>
    <div class="ex-cell">{dsl.render_svg(guide_demo, 3)}<span>2. Build it up</span></div>
    <div class="ex-arrow">&rarr;</div>
    <div class="ex-cell">{dsl.render_svg(guide_demo, len(guide_demo['steps']) - 1, highlight=False)}<span>3. Erase &amp; finish</span></div>
  </div>
  <div class="supplies"><b>Your art kit:</b> HB pencil &bull; soft 2B pencil for shading &bull; eraser &bull; black fine-liner pen &bull; colored pencils or markers</div>
</div>""")

warm = "".join(f'<div class="wu"><div class="wu-ex">{ex}</div><div class="wu-row"></div></div>' for ex in [
    '<svg viewBox="0 0 100 20"><g fill="none" stroke="#111" stroke-width="1.4"><circle cx="10" cy="10" r="7"/><circle cx="30" cy="10" r="7"/></g>'
    '<g fill="none" stroke="#999" stroke-width="1" stroke-dasharray="2 2"><circle cx="50" cy="10" r="7"/><circle cx="70" cy="10" r="7"/><circle cx="90" cy="10" r="7"/></g></svg>',
    '<svg viewBox="0 0 100 20"><g fill="none" stroke="#111" stroke-width="1.4"><ellipse cx="10" cy="10" rx="8" ry="5"/><ellipse cx="30" cy="10" rx="5" ry="8"/></g>'
    '<g fill="none" stroke="#999" stroke-width="1" stroke-dasharray="2 2"><ellipse cx="50" cy="10" rx="8" ry="5"/><ellipse cx="70" cy="10" rx="5" ry="8"/><ellipse cx="90" cy="10" rx="8" ry="5"/></g></svg>',
    '<svg viewBox="0 0 100 20"><g fill="none" stroke="#111" stroke-width="1.4"><path d="M2 15 Q10 2 18 15 M22 15 Q30 2 38 15"/></g>'
    '<g fill="none" stroke="#999" stroke-width="1" stroke-dasharray="2 2"><path d="M42 15 Q50 2 58 15 M62 15 Q70 2 78 15 M82 15 Q90 2 98 15"/></g></svg>',
    '<svg viewBox="0 0 100 20"><g fill="none" stroke="#111" stroke-width="1.4"><path d="M2 10 Q6 3 10 10 Q14 17 18 10 Q22 3 26 10 Q30 17 34 10"/></g>'
    '<g fill="none" stroke="#999" stroke-width="1" stroke-dasharray="2 2"><path d="M38 10 Q42 3 46 10 Q50 17 54 10 Q58 3 62 10 Q66 17 70 10 Q74 3 78 10 Q82 17 86 10 Q90 3 94 10 Q98 17 99 12"/></g></svg>',
    '<svg viewBox="0 0 100 20"><g fill="none" stroke="#111" stroke-width="1.4" stroke-linejoin="round"><path d="M2 16 L8 4 L14 16 L20 4 L26 16"/></g>'
    '<g fill="none" stroke="#999" stroke-width="1" stroke-dasharray="2 2" stroke-linejoin="round"><path d="M32 16 L38 4 L44 16 L50 4 L56 16 L62 4 L68 16 L74 4 L80 16 L86 4 L92 16 L98 4"/></g></svg>',
    '<svg viewBox="0 0 100 20"><g fill="none" stroke="#111" stroke-width="1.4"><path d="M10 3 L12 8 L17.5 8 L13 11.5 L14.5 17 L10 13.5 L5.5 17 L7 11.5 L2.5 8 L8 8 Z"/></g>'
    '<g fill="none" stroke="#999" stroke-width="1" stroke-dasharray="2 2"><path d="M35 3 L37 8 L42.5 8 L38 11.5 L39.5 17 L35 13.5 L30.5 17 L32 11.5 L27.5 8 L33 8 Z M60 3 L62 8 L67.5 8 L63 11.5 L64.5 17 L60 13.5 L55.5 17 L57 11.5 L52.5 8 L58 8 Z M85 3 L87 8 L92.5 8 L88 11.5 L89.5 17 L85 13.5 L80.5 17 L82 11.5 L77.5 8 L83 8 Z"/></g></svg>',
])
page(f"""
<div class="warmup">
  <h2>Warm-Up Time!</h2>
  <p class="lead">Every drawing in this book is made from these simple shapes. Trace the dotted ones, then draw your own on the line.</p>
  {warm}
</div>""")

contents_index = len(pages)
page("CONTENTS")

body_start = {}
num = 0
for ci, cat in enumerate(categories):
    items = [d for d in drawings if d["category"] == cat]
    body_start[cat] = len(pages)
    previews = "".join(f'<div class="dv-cell">{final_svg(d)}</div>' for d in items[:6])
    page(f"""
<div class="divider">
  <div class="dv-kicker">Chapter {ci + 1}</div>
  <h2>{cat}</h2>
  <div class="dv-count">{len(items)} step-by-step drawings</div>
  <div class="dv-grid">{previews}</div>
</div>""", kind="divider")
    for d in items:
        num += 1
        d["page_index"] = len(pages)
        n = len(d["steps"])
        stars = "&#9733;" * difficulty(d) + '<span class="off">' + "&#9733;" * (3 - difficulty(d)) + "</span>"
        cells = "".join(
            f'<div class="step"><div class="box"><span class="sn">{i + 1}</span>{dsl.render_svg(d, i)}</div>'
            f'<div class="cap">{d["captions"][i]}</div></div>' for i in range(n))
        tip = TIPS[(num - 1) % len(TIPS)]
        span = 3 - (n % 3) if n % 3 else 3
        cells += f'<div class="protip" style="grid-column: span {span}"><b>Pro Tip</b>{tip}</div>'
        page(f"""
<div class="dpage">
  <div class="dhead">
    <div class="dnum">{num}</div>
    <div class="dtitle"><small>How to draw</small>{d['name']}</div>
    <div class="dmeta"><div class="dcat">{cat}</div><div class="stars">{stars}</div></div>
  </div>
  <div class="steps">{cells}</div>
</div>""", kind="drawing")
        page(f"""
<div class="dpage">
  <div class="dhead">
    <div class="dtitle"><small>Practice page &bull; #{num}</small>Your Turn: {d['name']}</div>
    <div class="ref">{final_svg(d)}</div>
  </div>
  <div class="practice">{GRID}<span class="yt">Start with light guidelines!</span></div>
  <div class="checks">&#9744; Guidelines &nbsp;&nbsp; &#9744; Shapes &nbsp;&nbsp; &#9744; Details &nbsp;&nbsp; &#9744; Erased guides &nbsp;&nbsp; &#9744; Colored in</div>
</div>""", kind="practice")

page(f"""
<div class="dpage">
  <div class="dhead"><div class="dtitle"><small>Bonus challenge</small>Design Your Own Character</div></div>
  <p class="lead">Use these guidelines to invent a brand-new character. Give them a hairstyle, an outfit and a special item!</p>
  <div class="practice tall template">{dsl.render_svg(drawings[0], 0)}<span class="yt">My character's name: ____________________</span></div>
</div>""")

page(f"""
<div class="dpage">
  <div class="dhead"><div class="dtitle"><small>Bonus challenge</small>Draw a Whole Scene!</div></div>
  <p class="lead">Put it all together: a castle in the background, a character in front, and a creature flying in the sky.</p>
  <div class="practice tall">{GRID}<span class="yt">My masterpiece</span></div>
</div>""")

cert_pics = "".join(f'<div class="c-cell">{final_svg(d)}</div>' for d in showcase[:5])
page(f"""
<div class="cert">
  <div class="cert-in">
    <div class="c-kicker">Certificate of Achievement</div>
    <h2>Pro Artist</h2>
    <p>This certifies that</p>
    <div class="c-line"></div>
    <p>completed all <b>50 step-by-step drawings</b><br>and is officially drawing like a pro!</p>
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
    rows.append(f'<div class="toc-row"><div class="toc-cat"><span>{cat}</span><span>{body_start[cat] + 1}</span></div>'
                f'<div class="toc-items">{names}</div></div>')
pages[contents_index] = ("", f'<div class="toc"><h2>Contents</h2>{"".join(rows)}'
                             f'<div class="toc-extra">Bonus: Design Your Own Character &middot; Draw a Whole Scene &middot; Pro Artist Certificate</div></div>', True)

INTERIOR_CSS = """
@page { size: 8.5in 11in; margin: 0 }
* { box-sizing: border-box }
html, body { margin: 0; padding: 0; background: #fff; color: #111 }
body { font-family: 'Nunito', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact }
.page { width: 8.5in; height: 11in; padding: 0.55in 0.7in 0.6in; position: relative; overflow: hidden; break-after: page }
.pnum { position: absolute; bottom: 0.28in; left: 0; right: 0; text-align: center; font: 700 10.5pt 'Nunito'; color: #555 }
h1, h2 { font-family: 'Baloo 2', sans-serif; margin: 0 }
svg { display: block; width: 100%; height: 100% }
.lead { font-size: 12.5pt; line-height: 1.45; margin: 0 0 .2in }

.title-page { height: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: .3in }
.title-page h1 { font-size: 48pt; line-height: 1; margin: .15in 0 .12in }
.tp-sub { font: 800 14pt 'Nunito'; border: 2.5px solid #111; border-radius: 30px; padding: 4px 18px }
.tp-subtitle { font: 700 15pt/1.35 'Nunito'; color: #333; max-width: 6in }
.tp-grid { display: grid; grid-template-columns: repeat(3, 1.9in); gap: .2in; margin: .5in 0 }
.tp-cell { width: 1.9in; height: 1.9in; border: 2px solid #111; border-radius: 20px; padding: .1in }
.tp-author { margin-top: auto; font: 800 16pt 'Baloo 2' }

.copyright { height: 100%; display: flex; flex-direction: column; justify-content: flex-end; font-size: 10pt; color: #333; line-height: 1.5 }

.belongs .frame { margin-top: .2in; border: 3px dashed #111; border-radius: 30px; height: 9.4in; padding: .45in; text-align: center }
.b-head { font: 800 30pt 'Baloo 2' }
.b-line { border-bottom: 3px solid #111; margin: .35in .4in .1in; height: .35in }
.b-line.short { margin: .2in 1.4in .1in }
.b-sub { font: 700 12pt 'Nunito'; color: #555 }
.b-box { margin: .25in auto 0; width: 4.6in; height: 4.6in; border: 2.5px solid #111; border-radius: 22px }

.howto h2, .toc h2, .warmup h2 { font-size: 32pt; text-align: center; margin-bottom: .2in }
.tips { display: grid; gap: .14in }
.tip { display: flex; gap: .18in; align-items: flex-start; font-size: 12.5pt; line-height: 1.38 }
.tip .n { flex: none; width: .44in; height: .44in; border-radius: 50%; border: 2.5px solid #111;
          display: flex; align-items: center; justify-content: center; font: 800 15pt 'Baloo 2' }
.grey { color: #888; font-weight: 700 }
.dash { border-bottom: 2px dashed #777; font-weight: 700 }
.example { display: flex; align-items: center; justify-content: center; gap: .16in; margin: .3in 0 .45in }
.ex-cell { width: 1.85in; height: 1.85in; border: 2px solid #111; border-radius: 16px; padding: .08in; position: relative }
.ex-cell span { position: absolute; bottom: -.3in; left: -.2in; right: -.2in; text-align: center; font: 800 11pt 'Nunito' }
.ex-arrow { font-size: 26pt; font-weight: 800 }
.supplies { text-align: center; font-size: 12pt; border-top: 2px solid #111; padding-top: .14in; line-height: 1.5 }

.warmup .lead { text-align: center }
.wu { border: 2px solid #111; border-radius: 16px; padding: .1in .2in; margin-bottom: .12in }
.wu-ex { height: .5in }
.wu-row { height: .42in; border-bottom: 1.5px dashed #aaa }

.toc-row { border-bottom: 1.5px solid #ccc; padding: .14in 0 }
.toc-cat { display: flex; justify-content: space-between; font: 800 18pt 'Baloo 2'; line-height: 1.2 }
.toc-items { font-size: 11pt; color: #333; line-height: 1.55 }
.toc-items i { font-style: normal; color: #888; font-weight: 700 }
.toc-extra { margin-top: .2in; font: 700 11.5pt 'Nunito'; color: #444 }

.divider { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
           border: 4px solid #111; border-radius: 36px; padding: .4in }
.dv-kicker { font: 800 16pt 'Nunito'; letter-spacing: 3px; text-transform: uppercase; color: #555 }
.divider h2 { font-size: 50pt; line-height: 1.05; margin: .1in 0 }
.dv-count { font: 700 15pt 'Nunito'; color: #444 }
.dv-grid { display: grid; grid-template-columns: repeat(3, 1.8in); gap: .22in; margin-top: .5in }
.dv-cell { width: 1.8in; height: 1.8in; border: 2px dashed #999; border-radius: 50%; padding: .18in }

.dpage { height: 100%; display: flex; flex-direction: column }
.dhead { display: flex; align-items: center; gap: .16in; border-bottom: 3px solid #111; padding-bottom: .08in; margin-bottom: .2in }
.dnum { flex: none; width: .6in; height: .6in; border-radius: 50%; background: #111; color: #fff;
        display: flex; align-items: center; justify-content: center; font: 800 19pt 'Baloo 2'; padding-top: 2px }
.dtitle { font: 800 25pt 'Baloo 2'; line-height: .98; flex: 1 }
.dtitle small { display: block; font: 700 10.5pt 'Nunito'; color: #666; margin-bottom: 2px }
.dmeta { text-align: right }
.dcat { font: 700 9.5pt 'Nunito'; border: 1.5px solid #111; border-radius: 20px; padding: 2px 10px; white-space: nowrap }
.stars { font-size: 15pt; letter-spacing: 1px; margin-top: 2px } .stars .off { color: #ccc }
.ref { width: .85in; height: .85in; border: 1.5px solid #111; border-radius: 10px; padding: .03in }
.steps { display: grid; grid-template-columns: repeat(3, 2.3in); gap: .14in .16in; justify-content: center }
.step .box { height: 2.22in; border: 2px solid #111; border-radius: 14px; padding: .06in; position: relative }
.cap { font-size: 9.6pt; line-height: 1.28; margin-top: .05in; min-height: .5in; color: #222 }
.sn { position: absolute; top: -.11in; left: -.08in; width: .32in; height: .32in; border-radius: 50%; background: #111; color: #fff;
      display: flex; align-items: center; justify-content: center; font: 800 11.5pt 'Baloo 2'; padding-top: 1px }
.protip { border: 2px dashed #111; border-radius: 14px; padding: .14in .18in; font-size: 11pt; line-height: 1.4; align-self: start; min-height: 1.1in }
.protip b { display: block; font: 800 14pt 'Baloo 2'; margin-bottom: 2px }
.practice { flex: 1; border: 2.5px solid #111; border-radius: 18px; position: relative; margin-top: .1in;
            overflow: hidden }
.practice svg.grid { position: absolute; inset: 0; width: 100%; height: 100% }
.practice.template svg { position: absolute; inset: .3in; width: auto; height: auto; opacity: .9 }
.yt { position: absolute; top: .08in; left: .14in; background: #fff; padding: 0 .1in; font: 800 13pt 'Baloo 2'; border-radius: 6px }
.checks { margin-top: .12in; text-align: center; font: 700 11pt 'Nunito'; color: #333 }

.cert { height: 100%; border: 6px double #111; border-radius: 30px; padding: .25in }
.cert-in { height: 100%; border: 2px solid #111; border-radius: 20px; text-align: center; padding: .6in .5in; display: flex; flex-direction: column; align-items: center }
.c-kicker { font: 800 15pt 'Nunito'; letter-spacing: 3px; text-transform: uppercase }
.cert h2 { font-size: 60pt; line-height: 1.1; margin: .1in 0 .2in }
.cert p { font-size: 15pt; line-height: 1.5; margin: .1in 0 }
.c-line { border-bottom: 2.5px solid #111; width: 80%; height: .55in; margin-bottom: .15in }
.c-line.short { width: 2.3in; margin: 0 auto .05in }
.c-stars { display: flex; gap: .12in; margin: .35in 0 }
.c-cell { width: 1.15in; height: 1.15in }
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
demo_d = by_name["Girl with a Ponytail"]
demo_idx = [0, 2, 3, 4, 6]
demo = "".join(
    f'<div class="demo-cell"><span>{k + 1}</span>{dsl.render_svg(demo_d, i, highlight=(i != demo_idx[-1]))}</div>'
    + ('<div class="arrow">&#10140;</div>' if k < len(demo_idx) - 1 else "")
    for k, i in enumerate(demo_idx))
front_pics = ["Dragon", "Fairy-Tale Castle", "Boy in a Hoodie", "Unicorn", "Sports Car", "Howling Wolf", "Boba Tea"]
stickers = "".join(f'<div class="stk s{i}">{final_svg(by_name[n])}</div>' for i, n in enumerate(front_pics))
back_pics = "".join(f'<div class="bk-cell">{final_svg(by_name[n])}</div>'
                    for n in ["Arabian Palace", "Mermaid", "Tiger", "Game Controller", "Phoenix", "Treehouse", "Knight", "Sneaker"])
burst_d = dsl.STAR(50, 50, 49, 40, n=14).svg.split('d="')[1].split('"')[0]

INK, BG, ACC, ACC2 = "#2a0d17", "#7B1E3A", "#FFD23F", "#FF7A45"

COVER_CSS = f"""
@page {{ size: {W}in {H}in; margin: 0 }}
* {{ box-sizing: border-box }}
html, body {{ margin: 0; padding: 0 }}
body {{ width: {W}in; height: {H}in; position: relative; background: {BG}; font-family: 'Nunito', sans-serif; color: {INK};
        -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: hidden }}
svg {{ display: block; width: 100%; height: 100% }}
.new, .old {{ stroke: {INK}; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round }}
.old {{ stroke: #d8b4c0 }}
.guide {{ stroke: #b9849a; stroke-width: 1; stroke-dasharray: 2.2 2; fill: none }}
.bg-grid {{ position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.09) 1.5px, transparent 1.5px),
            linear-gradient(90deg, rgba(255,255,255,.09) 1.5px, transparent 1.5px); background-size: .5in .5in }}
.front {{ position: absolute; top: 0; bottom: 0; left: {BLEED + 8.5 + SPINE}in; width: {8.5 + BLEED}in; padding: {BLEED + .45}in {BLEED + .45}in 0 .45in }}
.back  {{ position: absolute; top: 0; bottom: 0; left: 0; width: {8.5 + BLEED}in; padding: {BLEED + .5}in .55in 0 {BLEED + .5}in }}
.spine {{ position: absolute; top: 0; bottom: 0; left: {BLEED + 8.5}in; width: {SPINE}in; background: {ACC} }}
.spine-text {{ position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(90deg); white-space: nowrap;
              color: {INK}; font: 800 {min(SPINE * 72 * 0.5, 12):.1f}pt 'Baloo 2'; letter-spacing: .5px }}
.ages {{ display: inline-block; background: {ACC}; color: {INK}; font: 800 17pt 'Nunito'; padding: 6px 22px; border-radius: 40px; transform: rotate(-3deg);
         border: 3px solid {INK} }}
.front h1 {{ font: 800 58pt/0.95 'Baloo 2'; margin: .2in 0 .12in; color: #fff; text-shadow: 4px 4px 0 {INK} }}
.front h1 .big {{ font-size: 104pt; display: block; color: {ACC}; text-shadow: 6px 6px 0 {INK}; line-height: .92; margin: .02in 0 }}
.sub {{ display: inline-block; background: #fff; border: 3px solid {INK}; border-radius: 16px; padding: 4px 18px; font: 800 19pt 'Baloo 2'; box-shadow: 5px 5px 0 {INK} }}
.sub b {{ color: {ACC2} }}
.demo {{ display: flex; align-items: center; gap: .03in; margin: .28in 0 0; background: #fff; border: 3px solid {INK}; border-radius: 20px; padding: .1in .12in; box-shadow: 5px 5px 0 {INK}; width: fit-content }}
.demo-cell {{ width: .98in; height: .98in; position: relative }}
.demo-cell span {{ position: absolute; top: -4px; left: -2px; width: .26in; height: .26in; border-radius: 50%; background: {ACC}; border: 2px solid {INK};
                   font: 800 10pt 'Baloo 2'; display: flex; align-items: center; justify-content: center; z-index: 2 }}
.arrow {{ font-size: 13pt; font-weight: 800; color: {ACC2} }}
.stk {{ position: absolute; background: #fff; border: 3px solid {INK}; border-radius: 26px; padding: .1in; box-shadow: 6px 6px 0 {INK} }}
.s0 {{ width: 2.35in; height: 2.35in; left: .35in; top: 6.35in; transform: rotate(-5deg) }}
.s1 {{ width: 2.2in; height: 2.2in; left: 2.85in; top: 6.5in; transform: rotate(3deg) }}
.s2 {{ width: 2.25in; height: 2.25in; left: 5.4in; top: 6.3in; transform: rotate(-3deg) }}
.s3 {{ width: 1.5in; height: 1.5in; left: .65in; top: 8.8in; transform: rotate(4deg) }}
.s4 {{ width: 1.5in; height: 1.5in; left: 2.4in; top: 8.8in; transform: rotate(-4deg) }}
.s5 {{ width: 1.5in; height: 1.5in; left: 4.15in; top: 8.8in; transform: rotate(3deg) }}
.s6 {{ width: 1.5in; height: 1.5in; left: 5.9in; top: 8.8in; transform: rotate(-5deg) }}
.s7 {{ width: 1.4in; height: 1.4in; left: 6.85in; top: 4.75in; transform: rotate(7deg) }}
.burst {{ position: absolute; right: {BLEED + .4}in; top: {BLEED + 2.75}in; width: 1.55in; height: 1.55in; transform: rotate(10deg) }}
.burst .t {{ position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
             font: 800 10pt/1.05 'Nunito'; color: #fff }}
.burst .t b {{ font: 800 32pt/0.9 'Baloo 2' }}
.author {{ position: absolute; bottom: {BLEED + .28}in; left: 0; right: {BLEED}in; text-align: center; font: 800 15pt 'Baloo 2'; color: #fff }}
.back h2 {{ font: 800 30pt/1 'Baloo 2'; margin: 0 0 .15in }}
.back p {{ font-size: 12.5pt; line-height: 1.45; margin: 0 0 .13in }}
.back ul {{ margin: 0 0 .15in; padding-left: .25in; font-size: 12pt; line-height: 1.5 }}
.back-card {{ background: #fff; border: 3px solid {INK}; border-radius: 22px; padding: .28in .35in; box-shadow: 6px 6px 0 {INK} }}
.bk-grid {{ display: grid; grid-template-columns: repeat(4, 1.6in); gap: .18in; margin-top: .32in }}
.bk-cell {{ width: 1.6in; height: 1.6in; background: #fff; border: 2.5px solid {INK}; border-radius: 20px; padding: .08in }}
.perfect {{ margin-top: .3in; font: 800 14pt 'Baloo 2'; max-width: 5.2in; line-height: 1.3; color: #fff }}
.barcode {{ position: absolute; right: .55in; bottom: {BLEED + .45}in; width: 2in; height: 1.2in; background: #fff }}
"""

cover = f"""<!doctype html><html><head><meta charset="utf-8"><title>{TITLE} - Cover</title>{FONTS}<style>{COVER_CSS}{''}</style></head><body>
<div class="bg-grid"></div>
<div class="back">
  <div class="back-card">
    <h2>Ready to level up your drawing?</h2>
    <p>This book teaches the same trick real artists use: start with simple <b>guidelines</b>, build up the shapes step by step,
    then erase the guides for a clean, professional finish. Every step has a short, clear instruction.</p>
    <ul>
      <li><b>50 detailed drawings</b> in 5 chapters: characters, castles &amp; places, fantasy creatures, amazing animals and cool stuff</li>
      <li><b>6-7 steps per drawing</b> with easy-to-follow instructions</li>
      <li><b>A full practice page</b> with a proportion grid after every drawing</li>
      <li>Difficulty stars, Pro Tips, warm-up exercises and bonus challenges</li>
      <li>Big 8.5 x 11 in pages and a Pro Artist certificate at the end</li>
    </ul>
    <p style="margin:0">Draw a princess, a ninja, a fairy-tale castle, an Arabian palace, a dragon, a howling wolf, sneakers, a sports car and much more!</p>
  </div>
  <div class="bk-grid">{back_pics}</div>
  <div class="perfect">For curious creators ages 8-12 &bull; beginners &amp; young artists</div>
  <div class="barcode"></div>
</div>
<div class="spine"><div class="spine-text">{TITLE.upper()} &nbsp;&bull;&nbsp; {AUTHOR}</div></div>
<div class="front">
  <div class="ages">{AGES}</div>
  <h1>Draw Like a <span class="big">PRO</span>for Kids</h1>
  <div class="sub"><b>50</b> Step-by-Step Drawings</div>
  <div class="demo">{demo}</div>
  <div class="burst">
    <svg viewBox="0 0 100 100"><path d="{burst_d}" fill="{ACC2}" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/></svg>
    <div class="t"><b>50</b>DRAWINGS<br>+ PRACTICE</div>
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
print(f"drawings={len(drawings)} pages={PAGE_COUNT} spine={SPINE} cover={W:.4f}x{H}")

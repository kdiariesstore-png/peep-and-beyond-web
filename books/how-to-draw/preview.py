"""Contact sheet of drawings (all steps) for visual checking: python3 preview.py <module> out.html"""
import importlib, sys
import dsl
sys.path.insert(0, "drawings")
mods = sys.argv[1].split(",")
for m in mods:
    importlib.import_module(m)
rows = []
for d in dsl.DRAWINGS:
    n = len(d["steps"])
    cells = "".join(f'<div class=c>{dsl.render_svg(d, i)}</div>' for i in range(n))
    cells += f'<div class=c style="border-color:red">{dsl.render_svg(d, n-1, highlight=False)}</div>'
    rows.append(f'<div class=r><b>{d["name"]}</b>{cells}</div>')
html = f"""<html><head><style>
body{{font-family:sans-serif;margin:8px;width:1100px}}
.r{{display:flex;align-items:center;gap:6px;margin:4px 0}} b{{width:90px;font-size:12px}}
.c{{width:120px;height:120px;border:1px solid #ccc}} svg{{width:100%;height:100%}}
.old{{stroke:#bbb;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}}
.new{{stroke:#000;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}}
</style></head><body>{''.join(rows)}</body></html>"""
open(sys.argv[2], "w").write(html)

"""Large finals-only sheet: python3 finals.py <modules> out.html <drawings_dir>"""
import importlib, sys
import dsl
sys.path.insert(0, sys.argv[3])
for m in sys.argv[1].split(","):
    importlib.import_module(m)
cells = "".join(f'<div class=c><b>{d["name"]}</b>{dsl.render_svg(d, len(d["steps"]) - 1, highlight=False)}</div>' for d in dsl.DRAWINGS)
open(sys.argv[2], "w").write(f"""<html><head><style>body{{margin:8px;width:1500px;display:flex;flex-wrap:wrap;gap:8px;font:12px sans-serif}}
.c{{width:290px;height:310px;border:1px solid #ccc}} svg{{width:290px;height:290px}}
.new{{stroke:#000;stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round}}</style></head><body>{cells}</body></html>""")

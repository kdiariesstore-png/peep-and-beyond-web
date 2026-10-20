"""Tiny DSL for step-by-step drawings on a 100x100 canvas.

Each drawing is a list of steps; each step is a list of elements.
Closed shapes are filled white so later-z shapes hide what is behind them.
"""

DRAWINGS = []


class El:
    def __init__(self, svg_tag, z=None, filled_black=False, closed=True):
        self.svg = svg_tag
        self.z = z
        self.black = filled_black
        self.closed = closed

    def render(self, cls):
        if self.black:
            fill = "#000" if cls == "new" else "#bbb"
        elif self.closed:
            fill = "#fff"
        else:
            fill = "none"
        return self.svg.replace("{A}", f'class="{cls}" fill="{fill}"')


def C(cx, cy, r, z=None):
    return El(f'<circle cx="{cx}" cy="{cy}" r="{r}" {{A}}/>', z)


def E(cx, cy, rx, ry, rot=0, z=None):
    t = f' transform="rotate({rot} {cx} {cy})"' if rot else ""
    return El(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"{t} {{A}}/>', z)


def R(x, y, w, h, rx=0, z=None):
    return El(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" {{A}}/>', z)


def P(d, z=None, closed=None):
    if closed is None:
        closed = d.strip().upper().endswith("Z")
    return El(f'<path d="{d}" {{A}}/>', z, closed=closed)


def L(*pts, z=None):
    d = "M" + " L".join(f"{x} {y}" for x, y in zip(pts[::2], pts[1::2]))
    return El(f'<path d="{d}" {{A}}/>', z, closed=False)


def DOT(cx, cy, r=2, z=99):
    return El(f'<circle cx="{cx}" cy="{cy}" r="{r}" {{A}}/>', z, filled_black=True)


def BLK(d, z=99):
    """Solid black filled path (pupils, noses...)."""
    return El(f'<path d="{d}" {{A}}/>', z, filled_black=True)


def EYE(cx, cy, r=4, z=98):
    """Cute eye: white circle with pupil and highlight."""
    return [C(cx, cy, r, z=z), DOT(cx + r * 0.15, cy + r * 0.1, r * 0.6, z=z + 0.5)]


def flat(items):
    out = []
    for it in items:
        if isinstance(it, (list, tuple)):
            out.extend(flat(it))
        else:
            out.append(it)
    return out


def draw(name, category, *steps):
    DRAWINGS.append({"name": name, "category": category, "steps": [flat(s) for s in steps]})


def render_svg(drawing, upto, highlight=True, size=None):
    """SVG of the drawing through step index `upto` (inclusive)."""
    items = []
    order = 0
    for si, step in enumerate(drawing["steps"][: upto + 1]):
        for el in step:
            z = el.z if el.z is not None else 0
            cls = "new" if (si == upto or not highlight) else "old"
            items.append((z, order, el.render(cls)))
            order += 1
    items.sort(key=lambda t: (t[0], t[1]))
    body = "".join(t[2] for t in items)
    wh = f' width="{size}" height="{size}"' if size else ""
    return f'<svg viewBox="-2 -2 104 104"{wh} xmlns="http://www.w3.org/2000/svg">{body}</svg>'


def BE(cx, cy, rx, ry, rot=0, z=99):
    """Solid black ellipse."""
    t = f' transform="rotate({rot} {cx} {cy})"' if rot else ""
    return El(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"{t} {{A}}/>', z, filled_black=True)


def CLOUD(cx, cy, rx, ry, n=10, bump=5, z=None, start=0.0):
    """Fluffy scalloped outline (clouds, sheep wool, tree tops)."""
    import math
    pts = []
    for i in range(n + 1):
        a = 2 * math.pi * (i / n) + start
        pts.append((cx + rx * math.cos(a), cy + ry * math.sin(a)))
    d = f"M{pts[0][0]:.1f} {pts[0][1]:.1f}"
    for i in range(n):
        (x1, y1), (x2, y2) = pts[i], pts[i + 1]
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        vx, vy = mx - cx, my - cy
        ln = math.hypot(vx, vy) or 1
        qx, qy = mx + vx / ln * bump * 2, my + vy / ln * bump * 2
        d += f" Q{qx:.1f} {qy:.1f} {x2:.1f} {y2:.1f}"
    return P(d + " Z", z=z)


def STAR(cx, cy, r1, r2, n=5, rot=-90, z=None):
    import math
    pts = []
    for i in range(2 * n):
        r = r1 if i % 2 == 0 else r2
        a = math.radians(rot + 180 * i / n)
        pts.append(f"{cx + r * math.cos(a):.1f} {cy + r * math.sin(a):.1f}")
    return P("M" + " L".join(pts) + " Z", z=z)


def mirror(d, axis=50):
    """Mirror an absolute-coordinate path (M/L/Q/C/Z only) horizontally."""
    import re
    toks = re.findall(r"[MLQCZ]|-?\d+\.?\d*", d)
    out, xturn = [], True
    for t in toks:
        if t in "MLQCZ":
            out.append(t)
            xturn = True
        else:
            v = float(t)
            if xturn:
                v = 2 * axis - v
            out.append(f"{v:g}")
            xturn = not xturn
    s = " ".join(out)
    return s.replace("M ", "M").replace("L ", "L").replace("Q ", "Q").replace("C ", "C")


def PM(d, z=None, closed=None, axis=50):
    """Path plus its horizontal mirror image."""
    return [P(d, z=z, closed=closed), P(mirror(d, axis), z=z, closed=closed)]

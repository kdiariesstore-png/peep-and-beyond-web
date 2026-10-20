"""Shared helpers for the 8-12 book: chibi character parts and shape generators."""
import math

from dsl import *

# Shared chibi body pieces (front view, standing). Head centre (50, 28).
FACE = "M33.5 27 Q33.5 11 50 11 Q66.5 11 66.5 27 Q66.5 40 59 45.5 Q50 50.5 41 45.5 Q33.5 40 33.5 27 Z"


def guides():
    return G(C(50, 28, 17), L(50, 10, 50, 48), L(33, 32, 67, 32), L(50, 48, 50, 92), L(38, 56, 62, 56),
             L(42, 74, 58, 74), L(38, 56, 34, 73), L(62, 56, 66, 73), L(45, 74, 44, 92), L(55, 74, 56, 92))


def head():
    return [P(FACE), E(33.5, 31, 2.4, 3.8, z=-1), E(66.5, 31, 2.4, 3.8, z=-1), R(46.5, 46, 7, 8, 1, z=-2)]


def eyes(girl=False, brows="soft"):
    out = []
    for x, side in ((43, -1), (57, 1)):
        out += [E(x, 32, 3, 3.8, z=5), BE(x + 0.2, 32.8, 2.3, 3.1, z=6), HL(x + 1.1, 31.4, 0.9), HL(x - 0.8, 34.2, 0.45)]
        if girl:
            outer = x + 3.6 * side
            out.append(P(f"M{x - 3.6} 29.6 Q{x} 26.8 {x + 3.6} 29.6 M{outer} 29.6 L{outer + 1.3 * side} 28.3", z=7))
        if brows == "soft":
            out.append(P(f"M{x - 3} 25.4 Q{x} 24 {x + 3} 25", z=7))
        else:
            hi, lo = (24.4, 26.4) if side < 0 else (26.4, 24.4)
            out.append(P(f"M{x - 3} {hi} L{x + 3} {lo}", z=7))
    return out


def mouth(smile=True, blush=True):
    out = [P("M50 37 L49.3 38.4 L50.3 38.6", z=5)]
    out.append(P("M47.3 41.2 Q50 43.8 52.7 41.2", z=5) if smile else P("M48 41.6 L52 41.6", z=5))
    if blush:
        out.append(P("M37.4 38.4 L38.4 37 M39.4 38.4 L40.4 37 M59.6 38.4 L60.6 37 M61.6 38.4 L62.6 37", z=5))
    return out


def arms_short_sleeve():
    return [PM("M40.5 54.5 Q35 56 33.5 62.5 L38.6 63.6 Z", z=-0.9),
            PM("M34.2 62.5 L32.8 72 L36.8 72.6 L38.4 63.6 Z", z=-1.5),
            C(34.8, 74, 2.5, z=-1.4), C(65.2, 74, 2.5, z=-1.4)]


def arms_long_sleeve():
    return [PM("M40.5 54.5 Q35 56 33.5 62.5 L32.6 71.6 L37.2 72.2 L38.6 63.6 Z", z=-0.9),
            PM("M32.6 70 L37.4 70.6", z=-0.85), C(34.8, 74, 2.5, z=-1.4), C(65.2, 74, 2.5, z=-1.4)]


def tee():
    return [P("M40 54 Q50 51 60 54 L62 74 L38 74 Z", z=-1), P("M46 52.6 Q50 55.4 54 52.6", z=-0.95)]


def pants():
    return [P("M38 73 L62 73 L61.5 89 L52 89 L50 78 L48 89 L38.5 89 Z", z=-1.2)]


def sneakers():
    return [PM("M38 89 L47.8 89 L48.6 92 Q49 94.5 46 94.5 L38 94.5 Q35.8 94.5 36.4 92 Z", z=-1),
            PM("M36.4 92.3 L48.8 92.3 M41 89 L42 91", z=-0.9)]


def kid(name, hair, top, bottom, details, girl=False, category="Characters", brows="soft", smile=True,
        hair_cap="Draw the hair. Start at the part line and work outwards.",
        top_cap="Draw the top: shirt, sleeves, arms and hands.",
        bottom_cap="Draw the legs and shoes.",
        detail_cap="Add the fun details, then erase your guidelines."):
    draw(name, category,
         ["Draw a circle for the head with two cross lines, then a stick-figure body.", guides()],
         ["Shape the face, ears and neck around the circle.", head()],
         ["Add big eyes on the cross line, then the eyebrows, nose and mouth.", eyes(girl, brows), mouth(smile)],
         [hair_cap, hair],
         [top_cap, top],
         [bottom_cap, bottom],
         [detail_cap, details])




def petal(cx, cy, ang, length, width, z=None, bend=0):
    """Leaf/feather/tail shape from (cx, cy) pointing at `ang` degrees."""
    a = math.radians(ang)
    ux, uy, px, py = math.cos(a), math.sin(a), -math.sin(a), math.cos(a)
    tx, ty = cx + ux * length + px * bend, cy + uy * length + py * bend
    mx, my = cx + ux * length * 0.55, cy + uy * length * 0.55
    s1 = (mx + px * width, my + py * width)
    s2 = (mx - px * width, my - py * width)
    return P(f"M{cx:.1f} {cy:.1f} Q{s1[0]:.1f} {s1[1]:.1f} {tx:.1f} {ty:.1f} Q{s2[0]:.1f} {s2[1]:.1f} {cx:.1f} {cy:.1f} Z", z=z)


def rot_rect(cx, cy, ang, r0, r1, w, z=None):
    """Rectangle from radius r0 to r1 along angle `ang` (degrees) around (cx, cy)."""
    a = math.radians(ang)
    ux, uy, px, py = math.cos(a), math.sin(a), -math.sin(a) * w / 2, math.cos(a) * w / 2
    pts = [(cx + ux * r0 + px, cy + uy * r0 + py), (cx + ux * r1 + px, cy + uy * r1 + py),
           (cx + ux * r1 - px, cy + uy * r1 - py), (cx + ux * r0 - px, cy + uy * r0 - py)]
    return P("M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + " Z", z=z)


def waves(y, z=3, amp=4):
    d = f"M0 {y}"
    for x in range(0, 100, 10):
        d += f" Q{x + 5} {y - amp} {x + 10} {y}"
    return [WF(d + " L100 102 L0 102 Z", z), P(d, z=z + 0.01, closed=False)]


def fur(cx, cy, rx, ry, n=24, depth=2.2, z=None, start=0):
    """Zig-zag furry outline around an ellipse."""
    pts = []
    for i in range(2 * n):
        a = 2 * math.pi * i / (2 * n) + start
        r = 1 if i % 2 == 0 else 1 + depth / max(rx, ry)
        pts.append(f"{cx + rx * r * math.cos(a):.1f} {cy + ry * r * math.sin(a):.1f}")
    return P("M" + " L".join(pts) + " Z", z=z)

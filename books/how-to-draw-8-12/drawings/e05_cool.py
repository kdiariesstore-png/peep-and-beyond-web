from chibi import *

C_ = "Cool Stuff"


def big_eye(x, y, s=1.0, z=5):
    return [E(x, y, 3 * s, 3.6 * s, z=z), BE(x - 0.3 * s, y + 0.6 * s, 2.2 * s, 2.8 * s, z=z + 1),
            HL(x + 0.6 * s, y - 0.8 * s, 0.9 * s)]


def spokes(cx, cy, r, n=6, z=1.2):
    d = ""
    for i in range(n):
        a = math.radians(360 * i / n)
        d += f" M{cx:.1f} {cy:.1f} L{cx + r * math.cos(a):.1f} {cy + r * math.sin(a):.1f}"
    return P(d.strip(), z=z, closed=False)


def capsule(cx, cy, ang, length, w, z=None):
    a = math.radians(ang)
    ux, uy, px, py = math.cos(a), math.sin(a), -math.sin(a), math.cos(a)
    h, r = length / 2 - w / 2, w / 2
    p1 = (cx - ux * h + px * r, cy - uy * h + py * r)
    p2 = (cx + ux * h + px * r, cy + uy * h + py * r)
    p3 = (cx + ux * h - px * r, cy + uy * h - py * r)
    p4 = (cx - ux * h - px * r, cy - uy * h - py * r)
    return P(f"M{p1[0]:.1f} {p1[1]:.1f} L{p2[0]:.1f} {p2[1]:.1f} A{r} {r} 0 0 0 {p3[0]:.1f} {p3[1]:.1f} "
             f"L{p4[0]:.1f} {p4[1]:.1f} A{r} {r} 0 0 0 {p1[0]:.1f} {p1[1]:.1f} Z", z=z)


draw("Sneaker", C_,
    ["Draw a long flat sole line and a light box for the shoe.", G(L(4, 86, 96, 86), R(8, 34, 86, 52))],
    ["Draw the thick rubber sole.", P("M8 74 L90 74 Q96 74 96 80 Q96 86 88 86 L12 86 Q6 86 6 80 Q6 74 8 74 Z")],
    ["Draw the top of the shoe and the tongue.",
     P("M10 74 Q8 56 16 48 Q24 46 34 46 L42 41 Q50 44 57 49 Q72 56 86 60 Q94 64 94 74 Z", z=-1),
     P("M33 46 Q33 33 41 31 Q48 33 46 43 Z", z=-1.5)],
    ["Add the toe cap and the heel tab.",
     P("M74 74 Q74 62 86 60 Q94 64 94 74 Z", z=0.5), P("M9.5 66 Q7 56 14 50 L19 49 Q13 57 15 66 Z", z=0.5)],
    ["Draw the eyelets and criss-cross laces.",
     DOT(46, 45, 1), DOT(53, 48.5, 1), DOT(60, 52, 1), DOT(43, 50, 1), DOT(50, 53.5, 1), DOT(57, 57, 1),
     P("M46 45 L50 53.5 M53 48.5 L43 50 M53 48.5 L57 57 M60 52 L50 53.5 M46 45 Q40 38 36 40", z=0.6)],
    ["Draw a cool side stripe.", P("M20 68 Q40 58 70 66 Q44 64 22 73 Z", z=0.6), STAR(30, 63, 3, 1.3, z=0.7)],
    ["Add the tread and stitching lines, then erase the guidelines.",
     P("M12 80 L90 80", z=0.1), P("M14 70 Q12 58 22 52", z=-0.9),
     P("M16 86 L18 83 M24 86 L26 83 M32 86 L34 83 M40 86 L42 83 M48 86 L50 83 M56 86 L58 83 M64 86 L66 83 M72 86 L74 83 M80 86 L82 83", z=0.1)],
)

draw("Game Controller", C_,
    ["Draw a centre line and a wide shape for the controller.", G(L(50, 28, 50, 86), E(50, 58, 42, 24))],
    ["Draw the controller body with two handles.",
     P("M20 40 Q30 32 50 36 Q70 32 80 40 Q94 56 92 74 Q90 84 82 82 Q76 80 70 70 L30 70 Q24 80 18 82 Q10 84 8 74 Q6 56 20 40 Z")],
    ["Draw the direction pad on the left.",
     P("M25 44 L31 44 L31 47 L34 47 L34 53 L31 53 L31 56 L25 56 L25 53 L22 53 L22 47 L25 47 Z", z=1)],
    ["Draw four round buttons on the right.",
     C(72, 44, 2.8, z=1), C(72, 56, 2.8, z=1), C(66, 50, 2.8, z=1), C(78, 50, 2.8, z=1),
     P("M70.6 42.6 L73.4 45.4 M73.4 42.6 L70.6 45.4", z=1.1), C(72, 56, 1.2, z=1.1)],
    ["Add two thumb sticks.", C(40, 61, 6, z=1), C(40, 61, 3.4, z=1.1), C(60, 61, 6, z=1), C(60, 61, 3.4, z=1.1)],
    ["Draw the small middle buttons and the shoulder bumpers.",
     R(43, 45, 5, 2.6, 1.2, z=1), R(52, 45, 5, 2.6, 1.2, z=1),
     P("M21 40 Q25 32 36 33 L36 37 Q28 36 24 41 Z", z=-1), P("M79 40 Q75 32 64 33 L64 37 Q72 36 76 41 Z", z=-1)],
    ["Add a cable and sparkles, then erase the guidelines.",
     P("M50 36 Q50 22 60 18 Q72 14 76 6", z=-2), STAR(14, 20, 3, 1.3, z=0), STAR(88, 22, 2.4, 1, z=0), DOT(90, 90, 1)],
)

draw("Headphones", C_,
    ["Draw a big circle as a guide for the headband.", G(C(50, 52, 32), L(50, 10, 50, 90))],
    ["Draw the curved headband.",
     P("M18 56 Q16 14 50 12 Q84 14 82 56 L76 56 Q76 20 50 18 Q24 20 24 56 Z")],
    ["Draw a big ear cup on each side.", R(11, 52, 17, 31, 7, z=1), R(72, 52, 17, 31, 7, z=1)],
    ["Add the soft cushions on the inside.", R(27, 56, 6, 23, 3, z=0.5), R(67, 56, 6, 23, 3, z=0.5)],
    ["Draw the padding on top of the headband.", P("M30 23 Q50 10 70 23 L68 28 Q50 17 32 28 Z", z=0.5)],
    ["Add a round logo with a music note on each cup.",
     C(19.5, 67.5, 5, z=1.1), C(80.5, 67.5, 5, z=1.1),
     BE(18.6, 69.5, 1.4, 1.1), P("M19.8 69.5 L19.8 64.5 L21.8 65.5", z=1.2),
     BE(79.6, 69.5, 1.4, 1.1), P("M80.8 69.5 L80.8 64.5 L82.8 65.5", z=1.2)],
    ["Draw floating music notes, then erase the guidelines.",
     BE(46, 50, 2.2, 1.7), P("M48 50 L48 40 L54 38 L54 47", z=99), BE(52, 47, 2.2, 1.7),
     BE(40, 76, 1.8, 1.4), P("M41.6 76 L41.6 68 L44.6 69.5", z=99), STAR(60, 70, 2.4, 1, z=0)],
)

draw("Skateboard", C_,
    ["Draw a tilted line through the middle.", G(L(8, 60, 92, 36))],
    ["Draw the long deck with rounded ends.", capsule(50, 48, -16, 84, 22)],
    ["Draw a bold lightning bolt on the deck.",
     BLK("M54 36 L42 50 L50 50 L44 62 L60 46 L52 46 L58 36 Z", z=1)],
    ["Add stars and stripes to the design.",
     STAR(28, 55, 3.6, 1.6, z=1), STAR(72, 42, 3.6, 1.6, z=1), P("M16 62 L22 46 M80 50 L86 34", z=1)],
    ["Draw the metal trucks under the deck.", R(22, 62, 12, 4, 1, z=-1), R(66, 50, 12, 4, 1, z=-1)],
    ["Draw four wheels.",
     E(21, 68, 4, 4.5, z=-0.5), E(35, 64, 4, 4.5, z=-0.5), E(65, 56, 4, 4.5, z=-0.5), E(79, 52, 4, 4.5, z=-0.5)],
    ["Add motion lines, then erase the guidelines.", P("M4 78 L22 78 M10 84 L32 84 M60 72 L84 72", z=0)],
)

draw("Sports Car", C_,
    ["Draw a ground line and two circles for the wheels.", G(L(2, 76, 98, 76), C(26, 66, 10), C(76, 66, 10))],
    ["Draw the long, low body of the car.",
     P("M6 66 Q6 56 16 54 L36 50 Q46 38 62 38 Q74 38 84 50 L94 54 Q98 58 96 66 Z")],
    ["Draw the sleek windows.", P("M42 50 Q48 42 58 42 L58 50 Z", z=0.5), P("M62 42 Q71 42 78 50 L62 50 Z", z=0.5)],
    ["Draw the wheels with rims.",
     C(26, 66, 10, z=1), C(76, 66, 10, z=1), C(26, 66, 6, z=1.1), C(76, 66, 6, z=1.1), spokes(26, 66, 6), spokes(76, 66, 6)],
    ["Add a spoiler, headlight, door and side vents.",
     P("M7 54 L4 47 L16 47 L16 52 Z", z=-1), E(91, 57, 3.5, 2, z=0.5), P("M60 50 L60 64 M64 54 L68 54", z=0.5),
     P("M38 58 L44 58 M37 61 L43 61", z=0.5), P("M82 50 L86 46 L88 49", z=0.4)],
    ["Draw a racing stripe along the side.", P("M10 59 L22 57 M38 55 L94 57", z=0.6)],
    ["Add speed lines and the road, then erase the guidelines.",
     P("M2 76 L98 76 M10 84 L24 84 M42 84 L58 84 M76 84 L90 84", z=0), P("M0 50 L-2 50 M-2 56 L2 56", z=0)],
)

draw("Motorcycle", C_,
    ["Draw a ground line and two big circles for the wheels.", G(L(2, 86, 98, 86), C(22, 70, 15), C(78, 70, 15))],
    ["Draw two chunky wheels.", C(22, 70, 15, z=1), C(22, 70, 9, z=1.1), C(78, 70, 15, z=1), C(78, 70, 9, z=1.1)],
    ["Draw the fuel tank and the seat.",
     P("M40 48 Q48 40 62 42 Q66 48 62 54 L42 56 Z", z=0), P("M22 50 Q32 45 41 50 L40 55 L22 55 Z", z=0)],
    ["Draw the engine and the frame.",
     R(42, 57, 18, 13, 2, z=0), P("M22 70 L34 56 L44 56 M60 56 L70 44 M34 56 L42 70", z=-0.5),
     P("M46 61 L56 61 M46 65 L56 65", z=0.1)],
    ["Draw the front fork, handlebar and headlight.",
     P("M68 40 L78 70 M71 39 L80.5 66", z=-0.3), P("M64 36 L70 32 L74 34 M70 32 L68 28", z=0.2), E(75, 45, 3.6, 4.6, rot=-20, z=0.2)],
    ["Add fenders and the exhaust pipe.",
     P("M64 63 Q78 50 92 63", z=1.5), P("M8 61 Q22 50 34 60", z=1.5), P("M42 70 L10 64 L10 69 L42 74 Z", z=0.8)],
    ["Draw the spokes and speed lines, then erase the guidelines.",
     spokes(22, 70, 9, 8), spokes(78, 70, 9, 8), P("M2 86 L98 86 M0 40 L12 40 M0 46 L8 46", z=0)],
)

draw("Spaceship", C_,
    ["Draw a centre line and a big triangle guide.", G(L(50, 2, 50, 96), P("M50 6 L10 78 L90 78 Z"))],
    ["Draw the long body of the ship.", P("M50 6 Q58 20 58 72 L42 72 Q42 20 50 6 Z")],
    ["Draw two wide wings.", PM("M42 38 L12 68 L13 78 L42 64 Z", z=-1)],
    ["Add the cockpit window.", E(50, 30, 4, 9, z=1), P("M48.5 25 Q49 22 50.5 21.5", z=1.1)],
    ["Draw two engines with flames.",
     R(41, 70, 7, 10, 1.5, z=-0.5), R(52, 70, 7, 10, 1.5, z=-0.5),
     P("M41.5 80 Q44.5 94 47.5 80 Z", z=-1), P("M52.5 80 Q55.5 94 58.5 80 Z", z=-1)],
    ["Add laser cannons and stripes on the wings.",
     R(14, 52, 3, 18, 1, z=-1.5), R(83, 52, 3, 18, 1, z=-1.5), PM("M30 60 L40 52 M26 66 L40 56", z=-0.9),
     P("M45 50 L55 50 M45 56 L55 56", z=0.5)],
    ["Draw stars and a planet, then erase the guidelines.",
     STAR(14, 18, 3, 1.3, z=0), STAR(86, 30, 2.4, 1, z=0), STAR(24, 90, 2, 0.9, z=0), C(84, 86, 7, z=0),
     P("M74 88 Q84 82 95 84", z=0.1)],
)

draw("Boba Tea", C_,
    ["Draw a centre line and the tapered sides of the cup.", G(L(50, 0, 50, 94), L(28, 34, 34, 92), L(72, 34, 66, 92))],
    ["Draw the cup.", P("M28 34 L72 34 L66 92 L34 92 Z")],
    ["Draw the dome lid with a rim.", P("M24 34 Q24 20 50 20 Q76 20 76 34 Z", z=1), R(22, 32, 56, 5, 2, z=1.1)],
    ["Draw a big straw poking out.", P("M52 22 L58 0 L64 1 L58 22 Z", z=0.9)],
    ["Give it a cute face.",
     big_eye(42, 56), big_eye(58, 56), P("M47 62 Q50 65 53 62", z=7), E(36, 61, 3, 1.8, z=1), E(64, 61, 3, 1.8, z=1)],
    ["Draw the tapioca pearls at the bottom.",
     [DOT(x, y, 2.6) for x, y in ((40, 87), (46, 88), (52, 87.5), (58, 88), (43, 82), (49, 82.5), (55, 82), (61, 83), (38, 82.5))]],
    ["Draw the tea line and sparkles, then erase the guidelines.",
     P("M30 44 Q35 42 40 44 Q45 46 50 44 Q55 42 60 44 Q65 46 70 44", z=0.5),
     STAR(14, 30, 3, 1.3, z=0), STAR(86, 50, 2.4, 1, z=0), DOT(16, 70, 1), DOT(84, 80, 1)],
)

draw("Electric Guitar", C_,
    ["Draw a centre line, an oval for the body and a long box for the neck.",
     G(L(50, 2, 50, 96), E(50, 70, 22, 24), R(46, 8, 8, 40))],
    ["Draw the curvy guitar body with two horns.",
     P("M34 60 Q24 56 28 46 Q32 40 38 44 Q42 48 46 46 L54 46 Q58 48 64 42 Q70 40 72 48 Q74 56 66 62 Q74 72 68 84 Q60 94 50 92 Q40 94 32 86 Q26 74 34 60 Z")],
    ["Draw the neck and the angled headstock.",
     R(46, 10, 8, 38, 1, z=-1), P("M45 10 L44 1 L57 0 L55 10 Z", z=-0.9)],
    ["Draw the pickups, the bridge and the knobs.",
     R(42, 57, 16, 4, 1, z=1), R(42, 65, 16, 4, 1, z=1), R(42, 76, 16, 3, 1, z=1),
     C(62, 78, 2, z=1), C(64, 85, 2, z=1), P("M60 52 Q66 54 64 62 Q70 72 64 82", z=0.5)],
    ["Draw the strings and frets.",
     P("M48 4 L48 77 M50 4 L50 77 M52 4 L52 77", z=1.2), P("M46 16 L54 16 M46 22 L54 22 M46 28 L54 28 M46 34 L54 34 M46 40 L54 40", z=-0.8)],
    ["Add the tuning pegs and a lightning decal.",
     DOT(43.5, 3, 1.2), DOT(43.5, 7, 1.2), DOT(57, 2, 1.2), DOT(56, 6.5, 1.2),
     P("M34 66 L30 72 L34 72 L31 79", z=0.6)],
    ["Draw music notes around it, then erase the guidelines.",
     BE(20, 30, 2.2, 1.7), P("M22 30 L22 20 L27 21.5", z=99), BE(80, 26, 2.2, 1.7), P("M82 26 L82 16 L88 14 L88 23", z=99),
     BE(86, 23, 2.2, 1.7)],
)

draw("Instant Camera", C_,
    ["Draw a big box and a circle in the middle for the lens.", G(R(14, 30, 72, 52), C(50, 58, 16))],
    ["Draw the camera body with rounded corners.", R(14, 30, 72, 52, 8)],
    ["Add the flash and the top button.", R(62, 23, 16, 9, 2, z=-1), R(22, 25, 10, 6, 2, z=-1), R(64, 25, 12, 5, 1, z=-0.9)],
    ["Draw the big lens with rings.",
     C(50, 58, 16, z=1), C(50, 58, 11, z=1.1), C(50, 58, 6, z=1.2), P("M44 52 Q46 49 50 48.5", z=1.3)],
    ["Add the viewfinder, a stripe and the photo slot.",
     R(20, 37, 11, 8, 2, z=0.5), C(78, 40, 3, z=0.5), P("M14 48 L34 48 M66 48 L86 48", z=0.5),
     P("M30 78 L70 78", z=0.5)],
    ["Draw a photo sliding out with a picture on it.",
     R(30, 80, 40, 18, 1, z=-1), R(33, 82, 34, 11, 0, z=-0.9),
     P("M33 93 L42 85 L48 90 L54 84 L67 93", z=-0.8), C(60, 86, 1.8, z=-0.8)],
    ["Add sparkles, then erase the guidelines.",
     STAR(10, 16, 3, 1.3, z=0), STAR(90, 14, 2.4, 1, z=0), P("M86 30 L92 26 M88 34 L95 33", z=0)],
)

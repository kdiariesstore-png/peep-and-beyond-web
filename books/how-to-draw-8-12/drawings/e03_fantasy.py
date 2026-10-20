from chibi import *

C_ = "Fantasy Creatures"


def big_eye(x, y, s=1.0, z=5):
    return [E(x, y, 3 * s, 3.6 * s, z=z), BE(x - 0.3 * s, y + 0.6 * s, 2.2 * s, 2.8 * s, z=z + 1),
            HL(x + 0.6 * s, y - 0.8 * s, 0.9 * s)]


draw("Dragon", C_,
    ["Draw a circle for the head, an oval for the body and a curve for the tail.",
     G(C(32, 28, 12), E(58, 64, 22, 17), P("M76 74 Q94 78 95 92", closed=False))],
    ["Draw the round head and a long snout.",
     E(33, 27, 12, 11), P("M25 29 Q12 29 11 36 Q11 43 21 43 L34 41 Z", z=0.5),
     DOT(15, 34, 0.9), P("M13.5 40 Q21 41.5 28 39", z=0.6)],
    ["Add two curved horns, the eye and a little smile line.",
     P("M35 17.5 Q37 7 45 4 Q41 11 41.5 18.5 Z", z=-1), P("M41 20 Q48 11 55 11 Q49 16 45.5 23 Z", z=-1),
     big_eye(33, 25, 1.1), P("M28 20 Q32.5 18 37 19.5", z=7)],
    ["Draw the neck and the big round body with a striped belly.",
     P("M34 36 Q39 50 45 53 L53 47 Q45 40 44 31 Z", z=-0.5), E(58, 64, 21, 17, z=-1),
     P("M41 55 Q39 74 57 81 Q49 70 50 56 Z", z=-0.4), P("M40.6 61 L49.4 60 M41 67 L50 66.5 M43 73 L52 73.5", z=-0.35)],
    ["Draw the legs and feet with little claws.",
     E(67, 72, 10, 10, z=-0.3), E(63, 84, 8.5, 3.6, z=-0.2), P("M46 64 L45 79 L51 79 L51.5 64 Z", z=-0.3),
     E(47.5, 81, 5, 2.6, z=-0.25), P("M57 82.5 L56 85 M61 83.5 L60.5 86.5 M65 83.5 L65 86.5 M44 80 L43 82.5 M47 81 L46.8 83.5", z=-0.1)],
    ["Draw a big bat wing with bony lines.",
     P("M58 48 Q62 26 80 15 Q85 24 92 22 Q88 32 94 38 Q84 40 83 49 Q74 46 69 54 Z", z=-3),
     P("M60 47 L80 16 M65 50 L91 23 M69 53 L93 38", z=-2.9)],
    ["Add the tail with an arrow tip and spikes down the back, then erase the guidelines.",
     P("M73 71 Q92 74 93 89 Q88 82 79 81 Q71 82 66 79 Z", z=-2), P("M91.5 85 L99 94 L88.5 93 Z", z=-1.9),
     [P(f"M{x - 2} {y - 1} L{x + 3.5} {y - 3.5} L{x + 1} {y + 2} Z", z=-1.5) for x, y in ((45, 33), (48.5, 39), (52, 44.5))],
     [P(f"M{x - 3} {y + 1} L{x} {y - 4} L{x + 3} {y + 1} Z", z=-1.5) for x, y in ((62, 48.5), (70, 50.5), (76, 56))]],
)


def horse(name, horn, wings, flying):
    legs = ([R(42, 60, 6, 15, 3, z=-2.5), R(52, 61, 6, 13, 3, z=-3), R(65, 61, 6, 13, 3, z=-3), R(75, 60, 6, 15, 3, z=-2.5)]
            if flying else
            [R(41, 60, 6, 25, 3, z=-2.5), R(51, 62, 6, 23, 3, z=-3), R(65, 62, 6, 23, 3, z=-3), R(75, 60, 6, 25, 3, z=-2.5),
             R(40.5, 83, 7, 4, 1.5, z=-2.4), R(74.5, 83, 7, 4, 1.5, z=-2.4), R(50.5, 83, 7, 4, 1.5, z=-2.9), R(64.5, 83, 7, 4, 1.5, z=-2.9)])
    extra = []
    if horn:
        extra += [P("M27 18 L22 2 L32 16.5 Z", z=1), P("M24.5 12 L29 10.5 M23.5 7.5 L27 6.5", z=1.1)]
    if wings:
        extra += [P("M60 46 Q50 22 64 7 Q66 16 73 14 Q72 23 81 22 Q77 31 86 34 Q76 41 66 47 Z", z=1),
                  P("M63 44 Q60 30 64 12 M65 45 Q68 30 72 18 M67 46 Q74 36 80 26", z=1.1)]
    draw(name, C_,
        ["Draw a circle for the head, an oval for the body and lines for the legs.",
         G(C(29, 28, 11), E(60, 54, 22, 13), L(44, 60, 44, 86), L(54, 62, 54, 86), L(68, 62, 68, 86), L(78, 60, 78, 86))],
        ["Draw the head and a rounded muzzle.",
         E(30, 27, 11, 10), E(19, 35, 8, 6, rot=-12, z=0.5), DOT(14, 34, 0.8), P("M13 39 Q17 40.5 21 39.5", z=0.6)],
        ["Add a pointy ear, a big sparkly eye" + (" and a spiral horn." if horn else "."),
         P("M34 19 L37 8 L41 19.5 Z", z=-1), big_eye(31, 26.5, 0.95), P("M27.5 22 L26 20.5 M30 21 L29.4 19 M32.6 21 L33 19", z=7), extra[:2] if horn else []],
        ["Draw the neck and the body.", P("M27 35 L37 50 L50 45 L37 26 Z", z=-1), E(60, 54, 22, 13, z=-2)],
        ["Draw the legs" + (" tucked up as it flies." if flying else " and hooves."), legs],
        ["Draw a flowing mane and tail" + (" and a feathery wing." if wings else "."),
         P("M35 17 Q48 15 50 27 Q56 31 52 39 Q58 45 51 49 Q46 44 44 37 Q40 31 37 23 Z", z=-0.8),
         P("M80 50 Q94 48 96 62 Q98 77 87 84 Q91 72 85 64 Q83 60 79 58 Z", z=-3),
         extra[2:] if horn else extra],
        ["Add swirls in the mane, sparkles" + (" and clouds" if flying else "") + ", then erase the guidelines.",
         P("M42 22 Q46 24 45 30 M47 32 Q51 34 50 40 M86 56 Q90 62 88 70", z=-0.7),
         STAR(10, 12, 3, 1.3, z=0), STAR(90, 10, 2.4, 1, z=0), DOT(14, 56, 1),
         [CLOUD(30, 88, 14, 5, 9, 2, z=-4), CLOUD(76, 92, 14, 5, 9, 2, z=-4)] if flying else []],
    )


horse("Unicorn", horn=True, wings=False, flying=False)
horse("Pegasus", horn=False, wings=True, flying=True)

draw("Phoenix", C_,
    ["Draw a centre line, an oval body and two wing lines rising up.",
     G(L(50, 4, 50, 98), E(50, 52, 9, 14), L(44, 44, 14, 12), L(56, 44, 86, 12))],
    ["Draw the body and the round head.", E(50, 53, 9, 14), C(50, 35, 7, z=1)],
    ["Add the beak, eyes and a flaming crest.",
     P("M48 37 L52 37 L50 41.5 Z", z=2), DOT(47.2, 34, 1.2), DOT(52.8, 34, 1.2),
     P("M46 29.5 Q39 19 45 11 Q46 20 50 24 Q50 13 56 6 Q57 18 54.5 29.5 Z", z=0.5)],
    ["Draw two big flame-shaped wings.",
     PM("M43 47 Q25 42 13 21 Q21 25 25 23 Q20 16 21 7 Q31 18 35 16 Q34 25 45 37 Z", z=-1)],
    ["Draw feather lines inside the wings.", PM("M42 44 Q30 36 22 22 M43 41 Q37 30 33 21", z=-0.9)],
    ["Draw three long flaming tail feathers.",
     P("M45 64 Q35 80 27 97 Q39 89 44 78 Q46 90 50 99 Q54 90 56 78 Q61 89 73 97 Q65 80 55 64 Z", z=-1),
     P("M45 70 Q40 80 34 90 M50 70 L50 92 M55 70 Q60 80 66 90", z=-0.9)],
    ["Add swirls and sparks around it, then erase the guidelines.",
     P("M16 50 Q12 46 16 42 Q20 40 21 44 M84 50 Q88 46 84 42 Q80 40 79 44", z=0),
     STAR(14, 64, 2.4, 1, z=0), STAR(86, 64, 2.4, 1, z=0), DOT(30, 86, 1), DOT(70, 86, 1)],
)

kid("Fairy",
    [P("M31.5 28 Q30 8 50 8 Q70 8 68.5 28 Q70 38 64 42 Q66 32 62 28 L38 28 Q34 32 36 42 Q30 38 31.5 28 Z", z=-2),
     P("M33.5 26 Q33 9.5 50 9.5 Q67 9.5 66.5 26 Q63 17 55 16 Q50 22 42 19 Q37 22 33.5 26 Z", z=3),
     C(38, 12, 2.2, z=4), C(42, 10.5, 2.2, z=4), C(46, 9.5, 2.2, z=4)],
    [P("M41 54 Q50 52 59 54 L59 66 L41 66 Z", z=-1), arms_short_sleeve(),
     petal(50, 58, -155, 36, 11, z=-4), petal(50, 58, -25, 36, 11, z=-4),
     petal(50, 60, 165, 28, 7, z=-4), petal(50, 60, 15, 28, 7, z=-4)],
    [P("M41 65 Q36 72 33 78 Q38 76 41 79 Q44 75 47 80 Q50 75 53 80 Q56 75 59 79 Q62 76 67 78 Q64 72 59 65 Z", z=-1.1),
     R(42.5, 78, 4.5, 10, 1.5, z=-1.3), R(53, 78, 4.5, 10, 1.5, z=-1.3),
     E(44.5, 89.5, 3.6, 2, z=-1.2), E(55.5, 89.5, 3.6, 2, z=-1.2)],
    [L(65.5, 72, 74, 58, z=-1.3), STAR(75, 55.5, 4, 1.8, z=-1.2), STAR(84, 48, 1.8, 0.8, z=0), STAR(80, 64, 1.4, 0.6, z=0),
     DOT(88, 58, 0.8), P("M37 32 Q34 36 30 38", z=-4.1)],
    girl=True, category=C_,
    hair_cap="Draw the hair with a little flower crown.",
    top_cap="Draw the top, the arms, and four pointed wings behind.",
    bottom_cap="Draw a petal skirt, legs and tiny shoes.",
    detail_cap="Add a magic wand with sparkles, then erase the guidelines.")

draw("Mermaid", C_,
    ["Draw a circle for the head with cross lines, then a curved line for the body and tail.",
     G(C(50, 28, 17), L(50, 10, 50, 48), L(33, 32, 67, 32), P("M50 48 L50 72 Q52 88 64 96", closed=False))],
    ["Shape the face, ears and neck.", head()],
    ["Add big eyes, eyebrows, nose and a smile.", eyes(True), mouth()],
    ["Draw long wavy hair flowing down both sides.",
     P("M31.5 28 Q29 8 50 7.5 Q71 8 68.5 28 Q72 40 68 50 Q74 58 68 66 Q62 62 63 54 Q66 46 62 40 L38 40 Q34 46 37 54 Q38 62 32 66 Q26 58 32 50 Q28 40 31.5 28 Z", z=-2),
     P("M33.5 27 Q33 9.5 50 9.5 Q67 9.5 66.5 27 Q61 15 50 17 Q44 13 33.5 27 Z", z=3), E(62, 13, 3, 2, rot=30, z=4), C(62, 13, 1, z=4.1)],
    ["Draw the body, a shell top, arms and hands.",
     P("M41 54 Q50 52 59 54 L60 72 L40 72 Z", z=-1),
     P("M42 57 Q45 54 48.5 57 Q48 61 45 61 Q42 61 42 57 Z M51.5 57 Q55 54 58 57 Q58 61 55 61 Q52 61 51.5 57 Z", z=-0.9),
     PM("M41 55 Q36 58 35 66 L33.5 73 L37.5 73.5 L39.5 63 Z", z=-1.5), C(35.4, 75, 2.4, z=-1.4), C(64.6, 75, 2.4, z=-1.4)],
    ["Draw the curvy fish tail and a big fin.",
     P("M40 71 L60 71 Q62 82 58 88 Q56 91 54 92 L46 92 Q40 86 40 71 Z", z=-1.2),
     P("M49 91 Q40 91 33 99 Q42 98 50 95 Q58 98 68 99 Q62 91 53 91 Z", z=-1.3)],
    ["Draw scales on the tail and bubbles, then erase the guidelines.",
     P("M43 76 Q45 78.5 47 76 Q49 78.5 51 76 Q53 78.5 55 76 Q57 78.5 58.5 76 M44 82 Q46 84.5 48 82 Q50 84.5 52 82 Q54 84.5 56 82 M46.5 88 Q48.5 90 50.5 88 Q52.5 90 54 88", z=-1.15),
     C(76, 40, 3, z=0), C(80, 30, 2, z=0), C(74, 22, 1.4, z=0), C(22, 70, 2.4, z=0)],
)

draw("Nine-Tailed Fox", C_,
    ["Draw a circle for the head, an oval for the body and a fan of curves for the tails.",
     G(C(50, 34, 14), E(50, 68, 13, 18), P("M50 84 Q20 70 14 40 M50 84 Q80 70 86 40", closed=False))],
    ["Draw the fox's face with fluffy cheeks.",
     P("M50 22 Q64 22 68 30 Q70 40 64 44 L68 46 L58 50 L50 56 L42 50 L32 46 L36 44 Q30 40 32 30 Q36 22 50 22 Z")],
    ["Add tall ears, eyes and a little nose.",
     PM("M37 25 L33 6 L46 21 Z", z=-1), PM("M38 21 L36 12 L42 20", z=-0.9),
     P("M39 35 Q43 32 46 36 Q42 38 39 35 Z", z=1), P("M54 36 Q57 32 61 35 Q58 38 54 36 Z", z=1),
     BLK("M47.5 46 Q50 44 52.5 46 Q50 49 47.5 46 Z"), P("M50 48.5 L50 50.5 Q48 52 46.5 51 M50 50.5 Q52 52 53.5 51", z=1)],
    ["Draw the sitting body with a fluffy chest.",
     P("M40 52 Q34 74 38 88 L62 88 Q66 74 60 52 Z", z=-2), P("M44 54 L50 66 L56 54", z=-1.9),
     P("M45 88 L45 76 M55 88 L55 76", z=-1.8), E(43, 88, 5.5, 2.6, z=-1.7), E(57, 88, 5.5, 2.6, z=-1.7)],
    ["Draw nine big fluffy tails fanning out behind.",
     [petal(50, 82, a, 42, 7.5, z=-5 - i * 0.01) for i, a in enumerate((-170, -150, -130, -110, -90, -70, -50, -30, -10))]],
    ["Add a white tip to each tail.",
     [petal(50 + 30 * math.cos(math.radians(a)), 82 + 30 * math.sin(math.radians(a)), a, 12, 4.5, z=-4.9 + i * 0.01)
      for i, a in enumerate((-170, -150, -130, -110, -90, -70, -50, -30, -10))]],
    ["Draw markings on the forehead and spirit flames, then erase the guidelines.",
     P("M50 26 Q48 29 50 32 Q52 29 50 26 Z", z=1), P("M43 28 L45 30 M57 28 L55 30", z=1),
     P("M14 88 Q10 82 14 78 Q14 82 17 83 Q17 79 20 77 Q22 84 18 88 Z", z=0),
     P("M82 88 Q80 82 84 78 Q84 82 87 83 Q87 79 90 77 Q92 84 88 88 Z", z=0)],
)

draw("Yeti", C_,
    ["Draw a big oval for the body and a smaller oval for the face.", G(E(50, 54, 30, 36), E(50, 40, 15, 13))],
    ["Draw the furry body outline with zig-zags.", fur(50, 54, 29, 35, n=30, depth=2.5)],
    ["Draw the face patch and two small horns.",
     E(50, 40, 15, 13, z=1), PM("M38 22 Q32 12 34 6 Q38 14 43 18 Z", z=-1)],
    ["Add the eyes, nose and a toothy smile.",
     big_eye(44, 37, 1), big_eye(56, 37, 1), BE(50, 43, 2.2, 1.4),
     P("M43 46 Q50 52 57 46 Z", z=2), R(47, 46.5, 2.6, 2.6, 0.4, z=2.1), R(50.4, 46.5, 2.6, 2.6, 0.4, z=2.1)],
    ["Draw furry arms on each side.",
     P("M23 50 Q12 60 15 76 L19 74 L20 79 L24 75 L27 78 Q26 66 30 58 Z", z=1),
     P("M77 50 Q88 60 85 76 L81 74 L80 79 L76 75 L73 78 Q74 66 70 58 Z", z=1)],
    ["Draw big feet with toes.",
     E(38, 90, 10, 5, z=1), E(62, 90, 10, 5, z=1), P("M33 88 L33 92 M38 87 L38 92 M43 88 L43 92 M57 88 L57 92 M62 87 L62 92 M67 88 L67 92", z=1.1)],
    ["Draw fur marks and snowflakes, then erase the guidelines.",
     P("M44 62 L46 66 L48 62 M52 70 L54 74 L56 70 M42 76 L44 80 L46 76", z=1),
     [P(f"M{x - 3} {y} L{x + 3} {y} M{x - 1.5} {y - 2.6} L{x + 1.5} {y + 2.6} M{x - 1.5} {y + 2.6} L{x + 1.5} {y - 2.6}", z=0)
      for x, y in ((10, 14), (90, 18), (8, 44), (92, 50))]],
)

draw("Sea Serpent", C_,
    ["Draw a wavy water line and an S-curve for the serpent.",
     G(L(2, 70, 98, 70), P("M18 70 Q24 36 34 30 M40 70 Q48 50 56 70 M64 70 Q72 50 80 70", closed=False))],
    ["Draw the long neck rising out of the water.", P("M12 72 Q16 44 26 30 L38 34 Q28 48 26 72 Z")],
    ["Draw the head with a snout and an open smile.",
     P("M22 30 Q22 18 34 17 Q46 17 50 26 Q52 34 44 36 L30 37 Q22 37 22 30 Z", z=1), DOT(47, 25, 0.9),
     P("M36 33.5 Q42 35 48 31", z=1.1)],
    ["Add eyes, horns and a frilly fin.",
     big_eye(34, 25, 0.95), PM("M28 19 Q24 10 28 6 Q29 13 32 17 Z", axis=29, z=-1),
     P("M22 30 Q14 32 12 40 Q16 38 18 42 Q20 38 22 42 Q24 38 24 44 Z", z=-0.5)],
    ["Draw two humps of the body in the water.",
     P("M40 72 Q42 50 50 50 Q58 50 60 72 Z", z=-1), P("M66 72 Q68 54 75 54 Q82 54 84 72 Z", z=-1),
     P("M45 56 L47 52 L49 56 M51 56 L53 52 L55 56 M71 59 L73 55 L75 59 M76 59 L78 55 L80 59", z=-0.9)],
    ["Add the curly tail tip.", P("M90 72 Q90 60 96 58 Q100 62 96 66 Q93 64 94 61", z=-1)],
    ["Draw the waves in front, then erase the guidelines.",
     waves(72, amp=4), P("M10 86 Q15 82 20 86 M40 90 Q45 86 50 90 M70 86 Q75 82 80 86", z=4)],
)

draw("Baby Dragon Egg", C_,
    ["Draw a big egg shape and a circle for the dragon's head.", G(E(50, 64, 28, 32), C(50, 34, 16))],
    ["Draw the dragon's round head.", E(50, 36, 17, 15)],
    ["Add little horns, a frill and big eyes.",
     PM("M40 24 Q34 12 38 8 Q40 16 45 21 Z", z=-1), PM("M34 32 L26 28 L30 36 L24 38 L32 42 Z", z=-0.5),
     big_eye(43.5, 35, 1.1), big_eye(56.5, 35, 1.1)],
    ["Draw the nostrils and a happy open mouth.",
     DOT(47.5, 42, 0.8), DOT(52.5, 42, 0.8), P("M45 46 Q50 52 55 46 Z", z=2)],
    ["Draw the cracked bottom half of the egg.",
     P("M22 58 L30 54 L36 60 L43 53 L50 60 L57 53 L64 60 L70 54 L78 58 Q80 96 50 96 Q20 96 22 58 Z", z=3)],
    ["Draw little arms and tiny wings peeking out.",
     P("M30 56 Q24 50 26 46 Q30 46 33 51 Z", z=3.5), P("M70 56 Q76 50 74 46 Q70 46 67 51 Z", z=3.5),
     P("M34 46 Q22 38 18 26 Q26 30 28 26 Q30 36 38 42 Z", z=-2), P("M66 46 Q78 38 82 26 Q74 30 72 26 Q70 36 62 42 Z", z=-2)],
    ["Add spots on the egg and shell pieces, then erase the guidelines.",
     E(36, 74, 4, 3, z=3.1), E(60, 80, 5, 3.5, z=3.1), E(48, 88, 3, 2, z=3.1), E(66, 68, 2.5, 2, z=3.1),
     P("M10 92 L16 86 L20 92 Z", z=0), P("M84 94 L88 87 L94 93 Z", z=0)],
)

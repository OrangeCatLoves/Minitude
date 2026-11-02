from kit import *

# ------------------------------------------------------------ world 23  ONE ELECTRON  (upper limit on its radius 1e-22 m = 0.59 of the explorer: dashed circle)
@scene(22)
def w23():
    c = C(); rnd = random.Random(1023)
    vgrad(c, 0, 0, W, H, ramp('#04070e', '#08121e', '#0c1c2c', '#10283a'))
    cx, cy = 104, 84
    # trap electrodes: carve a hyperbolic cavity out of a block of metal
    M0 = ramp('#1a1f2c', '#2e3648', '#4a566e', '#7a88a8', '#b8c4dc')
    for y in range(0, 141):
        for x in range(0, W):
            dx = x - cx; dy = y - cy
            top = dy < 0 and abs(dy) > math.sqrt(26 ** 2 + dx * dx * .55)          # top cap
            bot = dy > 0 and abs(dy) > math.sqrt(26 ** 2 + dx * dx * .55)          # bottom cap
            ringp = abs(dx) > math.sqrt(40 ** 2 + dy * dy * .9) and abs(dy) < 30   # ring electrode, left and right
            if top or bot or ringp:
                edge = 0
                v = 1 + (B4[y % 4][x % 4] / 16 - .5) * .9 + (1.4 if (top and dy < -26 and abs(dy) < math.sqrt(26 ** 2 + dx * dx * .55) + 3) or (bot and abs(dy) < math.sqrt(26 ** 2 + dx * dx * .55) + 3) else 0) + (1.2 if ringp and abs(dx) < math.sqrt(40 ** 2 + dy * dy * .9) + 3 else 0)
                c.p(x, y, M0[max(0, min(4, int(round(v + (x / 230) * 0.8))))])
    # the vacuum inside is dark with a faint blue haze
    glow(c, cx, cy, 36, rgb('#14405a'), .6)
    # magnetic field lines (thin, vertical) and the electron's tiny orbit
    for dx in (-18, -9, 0, 9, 18):
        c.line(cx + dx, 44, cx + dx, 124, rgb('#1a5a7a'))
    ring(c, cx, cy, 29, 29, rgb('#ffd062'), 1, 0, 360, 10)          # the biggest it could be: 1e-22 m
    ring(c, cx, cy, 30, 30, rgb('#ffd062'), 1, 5, 365, 10)
    glow(c, cx, cy, 12, rgb('#6ae0ff'), .9); glow(c, cx, cy, 5, rgb('#ffffff'), 1.0)
    c.r(cx - 1, cy - 1, cx + 1, cy + 1, rgb('#ffffff'))
    # a stream of dust-like noise outside
    starfield(c, rnd, 30, [rgb('#7ab0d8'), rgb('#ffffff')], 0, 135, 0)
    ledge(c, 140, '#9ac8e8', '#2a4a6a', '#04080e', 0, W, 9)
    return c.im

# ------------------------------------------------------------ world 24  DEEP SEA EYES  (KM3NeT, 220 PeV neutrino: 5.6e-24 m = 0.33 of the explorer)
@scene(23)
def w24():
    c = C(); rnd = random.Random(1024)
    vgrad(c, 0, 0, W, H, ramp('#010812', '#02121e', '#04202e', '#08303c'))
    glow(c, 160, 20, 160, rgb('#06364a'), .5, 1.8)
    # strings of glass sensors rising from the seabed
    strings = [(30, 120), (86, 132), (150, 126), (260, 136), (302, 128)]
    for (x, h) in strings:
        c.line(x, 140 - h - 10, x, 140, rgb('#2a4a5a'))
        for j in range(0, h // 12 + 1):
            y = 140 - 8 - j * 12
            dot(c, x, y, 4, rgb('#1a3a48'))
            c.circ(x, y, 4, rgb('#2a5a6a')); c.circ(x, y, 3, rgb('#143444')); c.r(x - 1, y - 1, x + 1, y + 1, rgb('#bff4ff')); c.p(x - 2, y - 2, rgb('#8ad8ff'))
    # the neutrino leaves one straight track; blue Cherenkov light fans out from it
    x0, y0, x1, y1 = -6, 150, 330, 16
    L = math.hypot(x1 - x0, y1 - y0)
    for i in range(0, 120):
        t = i / 119; x = x0 + (x1 - x0) * t; y = y0 + (y1 - y0) * t
        glow(c, x, y, 10 + 5 * math.sin(t * 9), rgb('#1a78c8'), .3)
    streak(c, x0, y0, x1, y1, [rgb('#1a5a98'), rgb('#5ac8ff'), rgb('#ffffff')], 1)
    for i in range(0, 14):
        t = (i + .5) / 14; x = x0 + (x1 - x0) * t; y = y0 + (y1 - y0) * t
        a = math.atan2(y1 - y0, x1 - x0) + math.radians(42)
        for s in (-1, 1):
            aa = math.atan2(y1 - y0, x1 - x0) + s * math.radians(42)
            c.line(x, y, x + math.cos(aa) * 26, y + math.sin(aa) * 26, rgb('#3a98e8'))
    # sensors the light has reached flash white
    for (x, h) in strings:
        for j in range(0, h // 12 + 1):
            y = 140 - 8 - j * 12
            d = abs((y1 - y0) * x - (x1 - x0) * y + x1 * y0 - y1 * x0) / L
            if d < 26:
                glow(c, x, y, 10, rgb('#8ae0ff'), .9); c.circ(x, y, 3, rgb('#ffffff'))
    # marine snow
    for _ in range(110): c.p(rnd.randint(0, W - 1), rnd.randint(0, 136), rgb('#7ab8c8') if rnd.random() < .6 else rgb('#d0f0ff'))
    # seabed
    c.r(0, 140, W, H, rgb('#0a1c22')); c.r(0, 140, W, 142, rgb('#5a8a94')); c.r(0, 142, W, 146, rgb('#2a4a54'))
    for k in range(9): wavy(c, 0, 148 + k * 3, W, 148 + k * 3, 1.5, 9 + k, rgb('#143842'), 1, k)
    return c.im

# ------------------------------------------------------------ world 25  TANK FIELD  (Auger, a 1 EeV cosmic ray: 1.2e-24 m = 0.73 of the explorer)
@scene(24)
def w25():
    c = C(); rnd = random.Random(1025)
    vgrad(c, 0, 0, W, 118, ramp('#020410', '#06102a', '#0e2048', '#1c3a6a'))
    starfield(c, rnd, 120, [rgb('#c8d8ff'), rgb('#ffffff'), rgb('#ffe8c0')], 0, 100, 3)
    # distant Andes
    pts = [(0, 116), (30, 92), (52, 104), (88, 76), (118, 100), (160, 88), (200, 108), (240, 82), (280, 100), (320, 90), (320, 118), (0, 118)]
    c.poly(pts, rgb('#0a1230')); 
    for (x, y) in ((88, 76), (240, 82)): c.poly([(x, y), (x - 8, y + 10), (x + 8, y + 10)], rgb('#a8b8e0'))
    # the air shower: a faint blue-violet fan ending on the plain
    base = (150, 126); top = (300, 6)
    for i in range(80):
        t = i / 79; x = top[0] + (base[0] - top[0]) * t; y = top[1] + (base[1] - top[1]) * t
        w_ = 3 + 30 * t
        for j in range(int(w_ * 1.2)):
            u = (rnd.random() - .5) * 2 * w_
            if rnd.random() < .4: c.p(x + u * .7, y + u * .5, rgb('#9a7aff') if rnd.random() < .6 else rgb('#d8ccff'))
        glow(c, x, y, 4 + 14 * t, rgb('#4a3ab8'), .16)
    streak(c, top[0], top[1], base[0], base[1], [rgb('#3a2a98'), rgb('#9a7aff'), rgb('#ffffff')], 1)
    # plain and the field of water tanks in perspective
    vgrad(c, 0, 118, W, 140, ramp('#2a1c28', '#3a2a30', '#4a3834'))
    for row in range(5, -1, -1):
        t = row / 5; y = 124 + t * 14; s = 2.5 + t * 5
        for col in range(-3, 9):
            x = 20 + col * (46 + t * 18) + (row % 2) * 22
            if x < -10 or x > W + 10: continue
            if abs(x - 210) < 20 * (.3 + t) and t > .8: continue
            c.r(x - s, y - s * 1.2, x + s, y, rgb('#e8eef8')); c.r(x - s, y - s * 1.2, x - s * .3, y, rgb('#ffffff')); c.r(x + s * .5, y - s * 1.2, x + s, y, rgb('#a8b4cc'))
            c.ell(x - s, y - s * 1.2 - s * .35, x + s, y - s * 1.2 + s * .35, rgb('#f4f8ff'), rgb('#c8d4ec'), 1)
            c.line(x + s * .4, y - s * 1.2, x + s * .4, y - s * 2.4, rgb('#9aa8c8')); c.r(x - s * .1, y - s * 1.9, x + s * .9, y - s * 1.9 + 2, rgb('#2a4a98'))
    # tanks that got hit flash blue
    for (x, y) in ((140, 128), (162, 124), (120, 132)):
        glow(c, x, y - 4, 9, rgb('#7aa8ff'), .8)
    ledge(c, 140, '#c8a890', '#5a4040', '#0e0a0c', 0, W, 9)
    return c.im

# ------------------------------------------------------------ world 26  BEYOND THE GALAXY  (Auger: above 8 EeV they come from outside; 1.5e-25 m = 0.91 of the explorer)
@scene(25)
def w26():
    c = C(); rnd = random.Random(1026)
    vgrad(c, 0, 0, W, H, ramp('#02010a', '#08041c', '#100a30', '#1a1044'))
    # far galaxies
    for _ in range(46):
        x = rnd.randint(150, 316); y = rnd.randint(6, 134); r = rnd.randint(2, 7)
        a = rnd.uniform(0, 3.14); col = rnd.choice(['#ff8ad0', '#8ad0ff', '#ffe08a', '#c8a0ff'])
        lobe(c, x, y, r * 1.8, r * .8, a, rgb(col), .9)
        c.p(x, y, rgb('#ffffff'))
    starfield(c, rnd, 60, [rgb('#d8d8ff'), rgb('#ffffff')], 0, 136, 2)
    # our galaxy, seen from above, at the left: a spiral disc
    gx, gy = 62, 76
    for arm in range(2):
        for i in range(260):
            t = i / 259; a = arm * math.pi + t * 5.0; rr = 6 + t * 56
            x = gx + math.cos(a) * rr; y = gy + math.sin(a) * rr * .55
            col = rgb('#ffe0a8') if t < .35 else (rgb('#8ab4ff') if i % 3 else rgb('#ffffff'))
            glow(c, x, y, 3 + 3 * (1 - t), col, .55)
    glow(c, gx, gy, 16, rgb('#ffe8b0'), .9); glow(c, gx, gy, 34, rgb('#6a5ab8'), .4, 1.6)
    # cosmic rays stream in from far outside, all from one side (the dipole), as thin bright lines with arrowheads
    for i in range(13):
        y0 = 40 + i * 11 + rnd.randint(-4, 4); y1 = gy + (i - 6) * 5
        x0 = 335; x1 = gx + 44 + rnd.randint(0, 22)
        col = rgb('#6ae8ff') if i % 3 else rgb('#ffffff')
        streak(c, x0, y0, x1, y1, [dim(rgb('#2a78a8'), .8), col], 1)
        ang = math.atan2(y1 - y0, x1 - x0)
        for s_ in (-1, 1): c.line(x1, y1, x1 - math.cos(ang + s_ * .5) * 6, y1 - math.sin(ang + s_ * .5) * 6, col)
    ledge(c, 140, '#d0b8ff', '#4a2a8a', '#06020e', 100, W, 9)
    return c.im

# ------------------------------------------------------------ world 27  THE SKY LIMIT  (GZK cutoff 5e19 eV: 2.5e-26 m = 1.5 of the explorer)
@scene(26)
def w27():
    c = C(); rnd = random.Random(1027)
    vgrad(c, 0, 0, W, H, ramp('#1a0604', '#2e0c06', '#4a1608', '#6a200a'))
    # the glow left over from the Big Bang: a fog of faint microwave photons everywhere
    blobs(c, rnd, 22, 0, 320, 0, 140, 30, 70, [rgb('#7a2a10'), rgb('#9a3a14'), rgb('#5a1a0a')], .4, 1.6)
    for _ in range(900):
        x = rnd.randint(0, W - 1); y = rnd.randint(0, 138)
        c.p(x, y, rgb('#ffb060') if rnd.random() < .5 else rgb('#ff8a40'))
    for _ in range(40):
        x = rnd.randint(0, W - 1); y = rnd.randint(0, 138); c.r(x, y, x + 1, y + 1, rgb('#ffe0b0'))
    # a proton at the speed limit: it starts bright and bluish, and each hit makes a flash and takes some energy
    pts = [(-4, 52), (60, 60), (118, 70), (176, 82), (236, 98), (300, 118)]
    for i in range(len(pts) - 1):
        (xa, ya), (xb, yb) = pts[i], pts[i + 1]
        f = 1 - i / (len(pts) - 1)
        streak(c, xa, ya, xb, yb, [dim(rgb('#3aa0ff'), f * .7 + .2), dim(rgb('#9ad8ff'), f * .8 + .2), dim(rgb('#ffffff'), f * .6 + .4)], 1)
    for (x, y, s) in ((60, 60, 12), (118, 70, 10), (176, 82, 9), (236, 98, 8)):
        glow(c, x, y, s + 6, rgb('#ffd890'), .8)
        for a in range(0, 360, 40):
            c.line(x, y, x + math.cos(math.radians(a)) * s, y + math.sin(math.radians(a)) * s, rgb('#fff0c0'))
    glow(c, 300, 118, 14, rgb('#6ab8ff'), .5); c.circ(300, 118, 3, rgb('#d8f0ff'))
    ledge(c, 140, '#ffc890', '#7a3418', '#100402', 60, W, 9)
    return c.im

# ------------------------------------------------------------ world 28  OH-MY-GOD  (3.2e20 eV: 3.9e-27 m = 2.3 explorers)
@scene(27)
def w28():
    c = C(); rnd = random.Random(1028)
    vgrad(c, 0, 0, W, 120, ramp('#02030c', '#08081c', '#140e2c', '#2a1a3c'))
    starfield(c, rnd, 130, [rgb('#d8d0ff'), rgb('#ffffff'), rgb('#ffe8c8')], 0, 110, 4)
    # desert mesas (Dugway, Utah)
    c.poly([(0, 118), (0, 96), (26, 94), (34, 104), (70, 102), (86, 110), (120, 108), (150, 100), (196, 100), (212, 108), (262, 106), (278, 92), (320, 92), (320, 120), (0, 120)], rgb('#1a1018'))
    c.poly([(0, 120), (0, 108), (40, 112), (110, 114), (190, 112), (260, 114), (320, 110), (320, 124)], rgb('#2a1a20'))
    # the shower: a huge, thick, brilliant streak with branches
    top = (292, -4); base = (40, 112)
    for i in range(100):
        t = i / 99; x = top[0] + (base[0] - top[0]) * t; y = top[1] + (base[1] - top[1]) * t
        glow(c, x, y, 6 + 26 * math.sin(math.pi * min(1, t * 1.15)) , rgb('#ff9a4a'), .2)
    streak(c, top[0], top[1], base[0], base[1], [rgb('#ff6a2a'), rgb('#ffd890'), rgb('#ffffff')], 2)
    for t in (.25, .4, .55, .7, .82):
        x = top[0] + (base[0] - top[0]) * t; y = top[1] + (base[1] - top[1]) * t
        for s in (-1, 1):
            ang = math.atan2(base[1] - top[1], base[0] - top[0]) + s * .5
            L = 14 + 30 * (1 - abs(t - .5))
            streak(c, x, y, x + math.cos(ang) * L, y + math.sin(ang) * L, [rgb('#ff8a3a'), rgb('#ffe0a0')], 1)
    # the Fly's Eye: a cluster of mirror domes with honeycomb faces
    for (x, y, r) in ((60, 134, 10), (96, 136, 9), (24, 132, 8)):
        c.ell(x - r, y - r, x + r, y + r * .6, rgb('#3a3a52'), rgb('#9aa0c8'), 1)
        for a in range(0, 180, 30):
            c.line(x, y - r * .1, x + math.cos(math.radians(a + 180)) * r, y + math.sin(math.radians(a + 180)) * r * .9, rgb('#6a7098'))
        c.r(x - 2, y, x + 3, y + 3, rgb('#1a1a28'))
    ledge(c, 140, '#e8b890', '#5a3828', '#0c0608', 0, W, 9)
    return c.im

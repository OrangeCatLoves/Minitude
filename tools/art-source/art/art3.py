import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
import art
from art import (rgb, mix, ramp, B4, W, H, FX, FY, C, glow, vgrad, sphere, cable, haze,
                 place_player, OUT, PLAYER)

SC = {}


def scene(k):
    def deco(f):
        SC[k] = f
        return f
    return deco


# ---------------------------------------------------------------- helpers
def stars(c, rnd, n, cols, y0=0, y1=H):
    for _ in range(n):
        c.p(rnd.randint(0, W - 1), rnd.randint(y0, y1 - 1), rnd.choice(cols))


def slab(c, y, top, mid, dark, h=10, x0=0, x1=W):
    c.r(x0, y, x1, y + 2, rgb(top)); c.r(x0, y + 2, x1, y + h, rgb(mid)); c.r(x0, y + h, x1, H, rgb(dark))


def facet(c, cx, cy, r, rp, rnd, n=9, jit=.25, sq=1.0, light=(-.6, -.7), edge=None):
    a0 = rnd.uniform(0, 6.28); pts = []
    for i in range(n):
        a = a0 + i * 2 * math.pi / n
        rr = r * (1 + rnd.uniform(-jit, jit))
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr * sq))
    m = len(rp)
    for i in range(n):
        p0 = pts[i]; p1 = pts[(i + 1) % n]
        mx = (p0[0] + p1[0]) / 2 - cx; my = ((p0[1] + p1[1]) / 2 - cy) / max(sq, .2)
        L = math.hypot(mx, my) or 1
        v = max(0, (mx / L) * light[0] + (my / L) * light[1])
        k = int(round(v * (m - 1) + rnd.uniform(-.45, .45)))
        c.poly([(cx, cy), p0, p1], rp[max(0, min(m - 1, k))])
    if edge:
        for i in range(n):
            c.line(pts[i][0], pts[i][1], pts[(i + 1) % n][0], pts[(i + 1) % n][1], edge)
    return pts


def capsule(c, p0, p1, r, rp, light=(-.5, -.6)):
    (x0, y0), (x1, y1) = p0, p1
    n = len(rp); lx, ly = light; lz = math.sqrt(max(.01, 1 - lx * lx - ly * ly))
    dx, dy = x1 - x0, y1 - y0; L2 = dx * dx + dy * dy or 1
    for y in range(int(min(y0, y1) - r) - 1, int(max(y0, y1) + r) + 2):
        for x in range(int(min(x0, x1) - r) - 1, int(max(x0, x1) + r) + 2):
            t = max(0, min(1, ((x - x0) * dx + (y - y0) * dy) / L2))
            qx = x0 + dx * t; qy = y0 + dy * t
            d = math.hypot(x - qx, y - qy)
            if d <= r:
                nx = (x - qx) / r; ny = (y - qy) / r; nz = math.sqrt(max(0, 1 - nx * nx - ny * ny))
                v = max(0, nx * lx + ny * ly + nz * lz)
                tt = v * (n - 1) + (B4[y % 4][x % 4] / 16 - .5) * .9
                c.p(x, y, rp[max(0, min(n - 1, int(round(tt))))])


def wavy(c, x0, y0, x1, y1, amp, cycles, col, w=1, phase=0.0, col2=None):
    L = math.hypot(x1 - x0, y1 - y0) or 1; nx = -(y1 - y0) / L; ny = (x1 - x0) / L
    prev = None; N = int(L)
    for i in range(N + 1):
        t = i / N; s = math.sin(t * math.pi * 2 * cycles + phase) * amp
        p = (x0 + (x1 - x0) * t + nx * s, y0 + (y1 - y0) * t + ny * s)
        if prev:
            cc = col2 if (col2 and (i // 5) % 2) else col
            c.line(prev[0], prev[1], p[0], p[1], cc, w)
        prev = p


def ring(c, cx, cy, rx, ry, col, w=1, a0=0, a1=360, dash=0):
    prev = None
    for a in range(int(a0), int(a1) + 1, 3):
        p = (cx + math.cos(math.radians(a)) * rx, cy + math.sin(math.radians(a)) * ry)
        if prev and (not dash or (a // dash) % 2 == 0):
            c.line(prev[0], prev[1], p[0], p[1], col, w)
        prev = p


def orbit(c, cx, cy, rx, ry, ang, col, w=1, n=120, dash=0):
    pts = []
    for i in range(n + 1):
        t = i * 2 * math.pi / n
        x = math.cos(t) * rx; y = math.sin(t) * ry
        pts.append((cx + x * math.cos(ang) - y * math.sin(ang), cy + x * math.sin(ang) + y * math.cos(ang)))
    for i in range(n):
        if not dash or (i // dash) % 2 == 0:
            c.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], col, w)
    return pts


def lobe(c, cx, cy, rx, ry, ang, col, amt=1.0):
    ca, sa = math.cos(ang), math.sin(ang)
    R = int(max(rx, ry)) + 2
    for y in range(int(cy - R), int(cy + R) + 1):
        for x in range(int(cx - R), int(cx + R) + 1):
            dx = x - cx; dy = y - cy
            u = (dx * ca + dy * sa) / rx; v = (-dx * sa + dy * ca) / ry
            d = math.hypot(u, v)
            if d < 1 and (1 - d) * amt > (B4[y % 4][x % 4] + .5) / 16:
                c.p(x, y, col)


def dim(col, f):
    return tuple(int(v * f) for v in col)


def finish(c):
    return c.im


# ======================================================================= worlds
@scene(1)
def w1():
    c = C(); rnd = random.Random(101)
    vgrad(c, 0, 0, W, H, ramp('#150c1c', '#241426', '#33202c', '#46302e'))
    glow(c, 262, 22, 80, rgb('#5a3a34'), .8, 1.4); glow(c, 262, 22, 34, rgb('#c08a5c'), .8, 1.4)
    bg = rgb('#241426')
    BK = ['#8a2a3a', '#2a4a8a', '#3a7a4a', '#8a6a2a', '#5a3a8a', '#7a3a1a', '#2a6a7a', '#a89880']
    x = -6
    while x < W:
        wd = rnd.randint(11, 24); h = rnd.randint(80, 128); base = rgb(rnd.choice(BK)); top = 140 - h
        lt = mix(base, (255, 255, 255), .22); dk = mix(base, (0, 0, 0), .35)
        lt = mix(lt, bg, .2); base = mix(base, bg, .12)
        c.r(x, top, x + wd, 140, dk); c.r(x + 2, top, x + wd - 1, 140, base); c.r(x + 2, top, x + 4, 140, lt)
        gold = rgb('#e0b860')
        c.r(x + 2, top + 8, x + wd - 1, top + 11, gold); c.r(x + 2, top + h - 14, x + wd - 1, top + h - 11, gold)
        for k in range(rnd.randint(1, 3)):
            ww = rnd.randint(3, wd - 6); yy = top + 20 + k * 5
            c.r(x + 4, yy, x + 4 + ww, yy + 1, mix(lt, (255, 255, 255), .3))
        x += wd
    # bookend and tiny plant on the shelf
    c.r(292, 112, 296, 140, rgb('#9aa6bf')); c.r(284, 136, 304, 140, rgb('#cdd6ee')); c.r(292, 112, 294, 140, rgb('#e6edff'))
    c.r(18, 128, 34, 140, rgb('#c8664a')); c.r(18, 128, 34, 130, rgb('#e8906a'))
    for (lx, ly, lw, lh) in ((20, 110, 3, 20), (25, 104, 3, 26), (30, 112, 3, 18)):
        c.r(lx, ly, lx + lw, ly + lh, rgb('#3fa05a')); c.r(lx, ly, lx + 1, ly + lh, rgb('#7ad88a'))
    slab(c, 140, '#e8b880', '#b8804e', '#2a1810', 20)
    for y in (146, 150, 154):
        for x in range(0, W, 3):
            if rnd.random() < .4:
                c.p(x + rnd.randint(0, 6), y + rnd.randint(-1, 1), rgb('#8a5a38'))
    stars(c, rnd, 26, [rgb('#e8d8b8'), rgb('#c8a888')], 10, 138)
    return c.im


@scene(3)
def w3():
    c = C(); rnd = random.Random(103)
    sky = ramp('#1a1040', '#4a2058', '#a8465a', '#f0905a', '#ffd08a')
    vgrad(c, 0, 0, W, 130, sky)
    glow(c, 76, 100, 60, rgb('#e87a50'), .8, 1.5); glow(c, 76, 100, 30, rgb('#ffd08a'), 1, 1.4)
    c.circ(76, 100, 14, rgb('#fff0c0')); c.circ(76, 100, 11, rgb('#ffffff'))
    stars(c, rnd, 30, [rgb('#ffe8d0')], 0, 60)
    SAND = ramp('#2e1c14', '#6a4630', '#a87a4c', '#dcb880', '#fff0c8')
    horizon = rgb('#e8905a')
    for li, (y0, r0, hz) in enumerate(((116, 7, .62), (126, 10, .4), (136, 14, .2))):
        c.r(0, y0 + 3, W, H, mix(rgb('#3a2418'), horizon, hz * .5))
        rp = [mix(v, horizon, hz) for v in SAND]
        for i in range(60):
            facet(c, rnd.randint(-8, W + 8), y0 + rnd.randint(0, 10), r0 * rnd.uniform(.7, 1.3), rp, rnd, 8, .3, .6)
    c.r(0, 146, W, H, rgb('#4a2c1e'))
    for i in range(34):
        pal = rnd.choice([SAND, SAND, SAND, ramp('#3a3a44', '#6a6a7a', '#a8a8b8', '#e0e0ec', '#ffffff'),
                          ramp('#4a2010', '#8a3a1a', '#c8683a', '#f0a878', '#ffd8b8')])
        x = rnd.randint(-10, W + 10); y = rnd.randint(154, 182); r = rnd.randint(11, 22)
        facet(c, x, y, r, pal, rnd, 9, .25, .55, edge=dim(pal[0], .8))
    facet(c, 214, 153, 26, SAND, rnd, 10, .12, .46, edge=rgb('#4a2c1e'))
    q = ramp('#2a5a78', '#58a0c0', '#a0e0f0', '#e0ffff', '#ffffff')
    facet(c, 66, 160, 18, q, rnd, 8, .2, .6, edge=rgb('#2a5a78')); glow(c, 66, 160, 30, rgb('#58a0c0'), .5)
    # shell fragment
    for t in range(0, 60):
        a = t * .22; rr = 1 + t * .22
        c.p(288 + math.cos(a) * rr, 164 + math.sin(a) * rr * .8, rgb('#fff0e0'))
    return c.im


@scene(6)
def w6():
    c = C(); rnd = random.Random(106)
    vgrad(c, 0, 0, W, H, ramp('#06141c', '#0e2a38', '#1c3a5a', '#2c3a78'))
    for _ in range(8):
        glow(c, rnd.randint(0, W), rnd.randint(0, 130), rnd.randint(20, 50), rnd.choice([rgb('#1a4a5a'), rgb('#3a2a6a'), rgb('#2a5a4a')]), .5)
    PAL = [ramp('#2a1060', '#5a30b8', '#9a68f0', '#d8c0ff'), ramp('#0e4a3a', '#1a8a60', '#46d898', '#b8ffe0'),
           ramp('#5a2a10', '#b8581c', '#f09050', '#ffe0b8'), ramp('#6a1040', '#c02a78', '#ff68b8', '#ffd0ec')]
    for i in range(7):
        x = rnd.randint(-10, W); y = rnd.randint(14, 112); ang = rnd.uniform(-.9, .9); L = rnd.randint(22, 48)
        rp = haze(rnd.choice(PAL), rgb('#1c3a5a'), rnd.uniform(.15, .4))
        x1 = x + math.cos(ang) * L; y1 = y + math.sin(ang) * L
        capsule(c, (x, y), (x1, y1), rnd.randint(6, 10), rp)
        wavy(c, x1, y1, x1 + math.cos(ang) * 40, y1 + math.sin(ang) * 40 + 8, 4, 2.5, mix(rp[2], rgb('#ffffff'), .3))
    # strep chain
    for i in range(9):
        sphere(c, 40 + i * 13, 92 + math.sin(i * .7) * 9, 7, haze(PAL[1], rgb('#1c3a5a'), .25))
    # a spirochete
    wavy(c, 150, 30, 316, 60, 6, 9, rgb('#ffe070'), 3, 0, rgb('#ffb030'))
    # biofilm ground
    c.r(0, 150, W, H, rgb('#0a2230'))
    for row, (cy, rr, f) in enumerate(((176, 11, .55), (162, 10, .3), (150, 9, 0))):
        x = -8 + row * 5
        while x < W + 10:
            r = rr + rnd.randint(-1, 2)
            rp = haze(rnd.choice(PAL[:3] + [PAL[1]]), rgb('#0a2230'), f)
            sphere(c, x, cy + rnd.randint(-1, 2), r, rp)
            x += r * 2 - 2
    for x in range(10, W, 18):
        c.p(x + rnd.randint(0, 6), 141 + rnd.randint(0, 3), rgb('#d8ffe8'))
    stars(c, rnd, 30, [rgb('#a8e8f0')], 0, 140)
    return c.im


@scene(8)
def w8():
    c = C(); rnd = random.Random(108)
    vgrad(c, 0, 0, W, H, ramp('#14061c', '#240a38', '#3c1050', '#561a60'))
    for _ in range(9):
        glow(c, rnd.randint(0, W), rnd.randint(0, 130), rnd.randint(18, 46), rnd.choice([rgb('#5a1a70'), rgb('#1a3a70'), rgb('#701a50')]), .5)
    LIL = ramp('#2a1a58', '#5a3ab0', '#9a78f0', '#d8c8ff')
    TEA = ramp('#0a3a48', '#1a7a88', '#46c0c8', '#c0fcff')
    sphere(c, 276, 76, 26, haze(LIL, rgb('#240a38'), .5)); sphere(c, 272, 40, 17, haze(TEA, rgb('#240a38'), .5))
    # messenger strand
    pts = [(-6, 60 + math.sin(x * .05) * 8) for x in range(0, W + 8, 5)]
    pts = [(x, 62 + math.sin(x * .06) * 9) for x in range(-6, W + 8, 5)]
    for (x, y) in pts:
        sphere(c, x, y, 3, ramp('#6a2a00', '#c8661a', '#ffa850', '#ffe0a8'), spec=False)
    # ribosome: big and small subunit
    sphere(c, 96, 104, 40, LIL); sphere(c, 88, 52, 28, TEA)
    for (x, y, r) in ((70, 92, 8), (112, 118, 9), (104, 88, 6), (80, 120, 6)):
        sphere(c, x, y, r, mix_ramp := ramp('#3a2a80', '#7a58d0', '#b898ff', '#ece0ff'))
    # growing chain of beads
    cols = [ramp('#4a0a20', '#c02a58', '#ff6a98', '#ffd0e0'), ramp('#0a3a1a', '#1a8a3a', '#46d878', '#c0ffd0'), ramp('#4a3a00', '#c0a010', '#ffe050', '#fff8c0')]
    for i in range(20):
        t = i / 19
        x = 128 + t * 80 + math.sin(t * 9) * 6; y = 130 + t * 8 + math.cos(t * 9) * 5
        sphere(c, x, y, 5, cols[i % 3])
    # membrane
    c.r(0, 138, W, H, rgb('#1a0a28'))
    for x in range(-4, W + 8, 9):
        for (yh, up) in ((145, 1), (178, -1)):
            sphere(c, x, yh, 5, ramp('#6a3a00', '#c8801a', '#ffc050', '#fff0b0'), spec=False)
            for sx in (-2, 2):
                c.line(x + sx, yh + 5 * up, x + sx + math.sin(x) * 1.5, yh + 5 * up + 14 * up, rgb('#a85a1a'))
    c.r(0, 164, W, 166, rgb('#2a1038'))
    # channel proteins in the membrane
    for x in (30, 300):
        c.r(x - 9, 118, x + 9, 148, rgb('#3a6a8a')); c.r(x - 9, 118, x - 5, 148, rgb('#7ac0e0')); c.r(x + 5, 118, x + 9, 148, rgb('#1e3a58'))
        c.r(x - 4, 118, x + 4, 130, rgb('#0a1a2a'))
        sphere(c, x - 8, 118, 5, TEA); sphere(c, x + 8, 118, 5, TEA)
    stars(c, rnd, 30, [rgb('#d8b8ff')], 0, 138)
    return c.im


@scene(9)
def w9():
    c = C(); rnd = random.Random(109)
    vgrad(c, 0, 0, W, H, ramp('#020818', '#06143a', '#0c2460', '#14388a'))
    glow(c, 200, 20, 100, rgb('#18408a'), .7, 1.6)
    BASE = [ramp('#4a3a00', '#c0a010', '#ffe050', '#fff8c0'), ramp('#0a3a1a', '#1a8a3a', '#46d878', '#c0ffd0'),
            ramp('#4a0a20', '#c02a58', '#ff6a98', '#ffd0e0'), ramp('#0a3a58', '#1a80b0', '#5ad0ff', '#d0f4ff')]
    SB = ramp('#10206a', '#2a4ac8', '#6a90ff', '#d0e0ff'); SA = ramp('#4a1060', '#9a2ac0', '#e068ff', '#ffd8ff')

    def helix(x, f, r, period, ph):
        h = f
        fade = rgb('#06143a')
        up = lambda rp: haze(rp, fade, 1 - h)
        for y in range(-4, 142, 3):
            a = (y / period) * 2 * math.pi + ph
            xa = x + math.sin(a) * r; xb = x - math.sin(a) * r
            za = math.cos(a)
            if za < 0:
                sphere(c, xa, y, 3 * (.6 + .4 * h), up(SB), spec=False)
            else:
                sphere(c, xb, y, 3 * (.6 + .4 * h), up(SA), spec=False)
        for y in range(0, 140, 6):
            a = (y / period) * 2 * math.pi + ph
            xa = x + math.sin(a) * r; xb = x - math.sin(a) * r
            bp = BASE[(y // 6 + int(x)) % 4]
            c.line(xa, y, x, y, up(bp)[2], 2); c.line(x, y, xb, y, up(bp)[1], 2)
        for y in range(-4, 142, 3):
            a = (y / period) * 2 * math.pi + ph
            xa = x + math.sin(a) * r; xb = x - math.sin(a) * r
            za = math.cos(a)
            if za >= 0:
                sphere(c, xa, y, 3.4 * (.6 + .4 * h), up(SB), spec=False)
            else:
                sphere(c, xb, y, 3.4 * (.6 + .4 * h), up(SA), spec=False)
    for x, f, r, p, ph in ((12, .35, 14, 70, 0), (58, .45, 16, 78, 1.5), (110, .55, 18, 86, 3.1), (276, .6, 18, 84, 2.2), (312, .4, 15, 74, .6),
                           (150, .8, 20, 92, 4.4), (254, .85, 22, 96, 5.5)):
        helix(x, f, r, p, ph)
    c.r(0, 140, W, H, rgb('#04102c')); c.r(0, 140, W, 142, rgb('#5ad0ff')); c.r(0, 142, W, 144, rgb('#1a4a9a'))
    for x in range(0, W, 16):
        c.line(x, 144, x - 20 + (x - 210) // 3, H, rgb('#0c2a6a'))
    stars(c, rnd, 40, [rgb('#9ad0ff'), rgb('#ffffff')], 0, 138)
    return c.im


@scene(11)
def w11():
    c = C(); rnd = random.Random(111)
    vgrad(c, 0, 0, W, H, ramp('#0a0420', '#180a3a', '#2a1058', '#3c1a78'))
    nx, ny = 96, 78
    glow(c, nx, ny, 90, rgb('#2a1068'), .8, 1.3)
    PK = rgb('#ff6ac8'); CY = rgb('#5be0ff'); GD = rgb('#ffd062')
    for ang, d, sc_ in ((0.0, 44, 1.0), (1.05, 38, .85), (2.1, 40, .9)):
        for sgn, col in ((1, PK), (-1, CY)):
            cx = nx + math.cos(ang) * d * sgn; cy = ny + math.sin(ang) * d * sgn
            lobe(c, cx, cy, 40 * sc_, 22 * sc_, ang, dim(col, .35), .9)
            lobe(c, cx, cy, 30 * sc_, 15 * sc_, ang, dim(col, .65), .9)
            lobe(c, cx, cy, 18 * sc_, 8 * sc_, ang, col, 1.0)
    for _ in range(900):
        x = rnd.gauss(nx, 58); y = rnd.gauss(ny, 40)
        if 0 <= y < 138:
            c.p(x, y, rgb('#e8d8ff') if rnd.random() < .5 else rgb('#a888ff'))
    glow(c, nx, ny, 12, rgb('#ffffff'), 1, 1.0); c.circ(nx, ny, 2, rgb('#ffffff'))
    stars(c, rnd, 40, [rgb('#ffffff'), rgb('#c8a8ff')], 0, 138)
    c.r(132, 140, 320, 148, rgb('#6a58c8')); c.r(132, 140, 320, 142, rgb('#c8b8ff'))
    vgrad(c, 132, 148, 320, 176, ramp('#34286e', '#241a58', '#160e3c'))
    for x in range(142, 316, 12):
        c.r(x, 144, x + 3, 146, rgb('#5be0ff'))
    return c.im


@scene(12)
def w12():
    c = C(); rnd = random.Random(112)
    vgrad(c, 0, 0, W, H, ramp('#02060e', '#041428', '#082442', '#0e3a62'))
    glow(c, 160, 70, 120, rgb('#0e3a62'), .8, 2.2)
    cols = [rgb('#5a48ff'), rgb('#3a78ff'), rgb('#3ac0ff'), rgb('#5be0ff'), rgb('#8af0ff'), rgb('#c0f8ff'), rgb('#e8fcff')]
    for i in range(7):
        y0 = 18 + i * 17; lam = 70 - i * 9; amp = 5 + i * .3
        prev = None
        for x in range(-2, W + 3):
            y = y0 + math.sin(x * 2 * math.pi / lam + i) * amp
            if prev:
                c.line(prev[0], prev[1], x, y, dim(cols[i], .5), 3)
                c.line(prev[0], prev[1], x, y, cols[i], 1)
            prev = (x, y)
    for i, x0 in ((2, 70), (4, 250), (5, 140), (6, 290), (3, 30)):
        y0 = 18 + i * 17; lam = 70 - i * 9
        for x in range(x0 - 26, x0 + 27):
            env = math.exp(-((x - x0) / 12) ** 2)
            y = y0 + math.sin(x * 2 * math.pi / lam + i) * (5 + 12 * env)
            c.circ(x, y, 1, rgb('#ffffff')); c.p(x, y - 2, rgb('#c0f8ff'))
    stars(c, rnd, 50, [rgb('#ffffff'), rgb('#8af0ff')], 0, 134)
    c.r(0, 140, W, 143, rgb('#c0f8ff')); c.r(0, 143, W, 147, rgb('#3ac0ff'))
    vgrad(c, 0, 147, W, H, ramp('#0a2a52', '#061a38', '#030c1c'))
    for x in range(0, W, 8):
        c.p(x, 150 + (x // 8) % 3 * 4, rgb('#3ac0ff'))
    return c.im


@scene(13)
def w13():
    c = C(); rnd = random.Random(113)
    vgrad(c, 0, 0, W, H, ramp('#010208', '#04061a', '#080c2c', '#0c1440'))
    nx, ny = 64, 62
    for ang, rx, ry, col in ((0.2, 150, 46, rgb('#1a3a78')), (1.1, 140, 40, rgb('#2a2a78')), (2.2, 160, 50, rgb('#1a4a78')), (-0.5, 130, 36, rgb('#2a3a88'))):
        pts = orbit(c, nx, ny, rx, ry, ang, col, 1, 160, 2)
        for j in (rnd.randint(0, 159),):
            ex, ey = pts[j]
            glow(c, ex, ey, 9, rgb('#3a6aff'), .9); c.circ(ex, ey, 2, rgb('#d8f0ff'))
    glow(c, nx, ny, 22, rgb('#ff9a5a'), .9); glow(c, nx, ny, 9, rgb('#fff0c8'), 1)
    c.r(nx - 1, ny - 1, nx + 2, ny + 2, rgb('#ffffff'))
    stars(c, rnd, 60, [rgb('#ffffff'), rgb('#7a98ff'), rgb('#3a4a98')], 0, 136)
    c.r(0, 140, W, 141, rgb('#2a4a98'))
    for x in range(0, W, 6):
        c.p(x, 144 + (x // 6) % 2 * 3, rgb('#1a2a68'))
    c.r(126, 140, 296, 143, rgb('#5a78e0')); c.r(126, 140, 296, 141, rgb('#c0d0ff'))
    vgrad(c, 126, 143, 296, 160, ramp('#1a2468', '#0e1646', '#060a24'))
    return c.im


@scene(14)
def w14():
    c = C(); rnd = random.Random(114)
    vgrad(c, 0, 0, W, H, ramp('#12041c', '#2a0a3a', '#440e4a', '#5a1858'))
    cx, cy = 106, 70
    glow(c, cx, cy, 96, rgb('#6a1a68'), .8, 1.2); glow(c, cx, cy, 56, rgb('#c0507a'), .6, 1.1)
    RED = ramp('#400a14', '#901a2a', '#e03a4a', '#ff9aa0'); BLU = ramp('#0a1a50', '#1a3aa8', '#3a7aff', '#a8c8ff')
    pts = []
    tries = 0
    while len(pts) < 26 and tries < 4000:
        tries += 1
        x, y, z = rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-1, 1)
        if x * x + y * y + z * z > 1:
            continue
        p = (x * 52, y * 52, z * 52)
        if all(math.dist(p, q) > 25 for q in pts):
            pts.append(p)
    pts.sort(key=lambda p: p[2])
    bg = rgb('#2a0a3a')
    for i, (x, y, z) in enumerate(pts):
        f = (z + 52) / 104
        rp = haze(RED if i % 2 == 0 else BLU, bg, .55 * (1 - f))
        sphere(c, cx + x, cy + y, 14 + f * 3, rp)
    sphere(c, 300, 44, 9, haze(BLU, bg, .5)); sphere(c, 282, 112, 7, haze(RED, bg, .5))
    stars(c, rnd, 50, [rgb('#ffc8ff'), rgb('#ffffff')], 0, 138)
    slab(c, 140, '#f0d0ff', '#7a58c0', '#1a0a38', 12, 120, 320)
    for x in range(130, 316, 14):
        c.r(x, 145, x + 4, 147, rgb('#ff9ad8'))
    return c.im


@scene(16)
def w16():
    c = C(); rnd = random.Random(116)
    vgrad(c, 0, 0, W, H, ramp('#10020c', '#24041a', '#3a0a2e', '#4a1240'))
    for _ in range(12):
        glow(c, rnd.randint(0, W), rnd.randint(0, H), rnd.randint(16, 44), rnd.choice([rgb('#5a1a50'), rgb('#1a2a6a'), rgb('#2a5a3a')]), .45)
    Q = [ramp('#400a14', '#901a2a', '#e03a4a', '#ff9aa0'), ramp('#0a1a50', '#1a3aa8', '#3a7aff', '#a8c8ff'), ramp('#0a3a1a', '#1a8a3a', '#3ae07a', '#b0ffc8')]
    bg = rgb('#24041a')

    def triad(x, y, s, hz):
        offs = [(-s * 1.1, s * .7), (s * 1.1, s * .7), (0, -s * 1.1)]
        for i in range(3):
            for j in range(i + 1, 3):
                wavy(c, x + offs[i][0], y + offs[i][1], x + offs[j][0], y + offs[j][1], max(1, s * .12), 4, mix(rgb('#ffe070'), bg, hz), 2 if s > 14 else 1, 0, mix(rgb('#ff78d8'), bg, hz))
        for i in range(3):
            sphere(c, x + offs[i][0], y + offs[i][1], s * .6, haze(Q[i], bg, hz))
    items = [(rnd.randint(10, W - 10), rnd.randint(10, 150), rnd.uniform(5, 11), rnd.uniform(.4, .75)) for _ in range(14)]
    for x, y, s, hz in sorted(items, key=lambda t: -t[3]):
        triad(x, y, s, hz)
    triad(60, 62, 17, 0.0)
    stars(c, rnd, 50, [rgb('#ffd8f8'), rgb('#ffffff')])
    return c.im


@scene(17)
def w17():
    c = C(); rnd = random.Random(117)
    vgrad(c, 0, 0, W, H, ramp('#021018', '#041c2c', '#08304a', '#0e4a6a'))
    glow(c, 220, 60, 110, rgb('#0e4a6a'), .8, 1.8)
    cols = [rgb('#ff4a5a'), rgb('#3ae07a'), rgb('#4a8aff'), rgb('#ffe070'), rgb('#ff78d8')]
    for i in range(10):
        y0 = 8 + i * 13; amp = rnd.uniform(5, 15); lam = rnd.uniform(90, 200); ph = rnd.uniform(0, 6)
        col = cols[i % 5]; prev = None
        for x in range(-2, W + 3):
            y = y0 + math.sin(x * 2 * math.pi / lam + ph) * amp + math.sin(x * .09 + i) * 2
            if prev:
                c.line(prev[0], prev[1], x, y, dim(col, .35), 6)
                c.line(prev[0], prev[1], x, y, dim(col, .75), 3)
                c.line(prev[0], prev[1], x, y - 1, mix(col, (255, 255, 255), .5), 1)
            prev = (x, y)
    stars(c, rnd, 50, [rgb('#ffffff'), rgb('#8af0ff')], 0, 136)
    slab(c, 140, '#b8ffd8', '#2a8a68', '#04141c', 8, 96, 330)
    for x in range(104, 320, 12):
        c.r(x, 145, x + 4, 146, rgb('#ffe070'))
    return c.im


@scene(18)
def w18():
    c = C(); rnd = random.Random(118)
    vgrad(c, 0, 0, W, 140, ramp('#04021a', '#0c0a3a', '#1a1666', '#2c2490'))
    bx, by = 84, 52
    for k in range(1, 15):
        rr = 10 + k * 22
        ring(c, bx, by, rr, rr * .62, mix(rgb('#8a78ff'), rgb('#0c0a3a'), min(.9, k * .065)), 1, 0, 360, 0 if k % 2 else 4)
    glow(c, bx, by, 34, rgb('#5a48c8'), .9, 1.4)
    for (ox, oy, r) in ((-9, 3, 10), (10, -3, 7)):
        glow(c, bx + ox, by + oy, r * 2.2, rgb('#ff9a4a'), .8)
        c.circ(bx + ox, by + oy, r + 2, rgb('#ffd08a')); c.circ(bx + ox, by + oy, r, rgb('#000000'))
    for arm in (0, math.pi):
        for t in range(0, 80):
            a = arm + t * .13; rr = 6 + t * .85
            c.p(bx + math.cos(a) * rr, by + math.sin(a) * rr * .6, rgb('#ffe8c8') if t % 3 else rgb('#8a78ff'))
    stars(c, rnd, 60, [rgb('#ffffff'), rgb('#a8a0ff')], 0, 138)
    c.r(0, 140, W, H, rgb('#06041c'))
    for k in range(0, 14):
        yy = 140 + k * 3.2 + k * k * .35
        prev = None
        for x in range(-2, W + 3, 2):
            y = yy + math.sin(x * .045 - k * .6) * (1.2 + k * .5)
            if prev:
                c.line(prev[0], prev[1], x, y, rgb('#5be0ff') if k % 2 == 0 else rgb('#2a78b0'), 1)
            prev = (x, y)
    for xx in range(-12, 14):
        pts = [(160 + xx * 6 + (xx * 5.2) * t * t, 140 + 44 * t + math.sin((160 + xx * 6) * .045 - t * 6) * 2 * t) for t in [i / 10 for i in range(11)]]
        for i in range(10):
            c.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], rgb('#2a78b0'), 1)
    c.r(0, 140, W, 142, rgb('#c8f4ff'))
    return c.im


@scene(19)
def w19():
    c = C(); rnd = random.Random(119)
    vgrad(c, 0, 0, W, H, ramp('#020410', '#060a20', '#0a1230', '#101a44'))
    vx, vy = 130, 66
    glow(c, vx, vy, 90, rgb('#1a2a6a'), .8, 1.6)
    for k in range(-9, 10):
        c.line(vx, vy, vx + k * 56, H, rgb('#1a3a78'))
        c.line(vx, vy, vx + k * 56, 0, rgb('#10244e'))
    for i in range(1, 12):
        t = i / 11
        y = vy + (H - vy) * t * t; yt = vy - vy * t * t
        c.line(0, y, W, y, rgb('#1a3a78')); c.line(0, yt, W, yt, rgb('#10244e'))
    ring(c, vx, vy, 28, 28, rgb('#ffd062'), 2); ring(c, vx, vy, 22, 22, rgb('#fff0b0'), 1)
    glow(c, vx, vy, 40, rgb('#ff5a5a'), .9)
    c.line(vx, vy, 300, 176, rgb('#ff2a3a'), 5); c.line(vx, vy, 300, 176, rgb('#ff8a8a'), 3); c.line(vx, vy, 300, 176, rgb('#ffffff'), 1)
    for t in range(0, 40):
        x = vx + (300 - vx) * t / 40; y = vy + (176 - vy) * t / 40
        glow(c, x, y, 8 + t * .3, rgb('#ff2a3a'), .25)
    # near mirror
    ring(c, 36, 78, 22, 50, rgb('#ffd062'), 3); ring(c, 36, 78, 16, 40, rgb('#a8b8e8'), 1)
    for k in range(5):
        c.line(24 + k * 3, 54 + k * 8, 34 + k * 3, 48 + k * 8, rgb('#e8f0ff'))
    stars(c, rnd, 24, [rgb('#ffffff')], 0, 60)
    return c.im


@scene(20)
def w20():
    c = C(); rnd = random.Random(120)
    vgrad(c, 0, 0, W, H, ramp('#020812', '#04182a', '#082a3a', '#0e3c4a'))
    for _ in range(8):
        glow(c, rnd.randint(0, W), rnd.randint(0, 130), rnd.randint(18, 40), rgb('#0e4a5a'), .4)
    for _ in range(46):
        x = rnd.randint(4, W - 4); y = rnd.randint(4, 134); s = rnd.randint(3, 9); a = rnd.uniform(0, 6.28)
        hz = rnd.uniform(.2, .9)
        p1 = (x + math.cos(a) * s, y + math.sin(a) * s); p2 = (x - math.cos(a) * s, y - math.sin(a) * s)
        c.line(p1[0], p1[1], p2[0], p2[1], dim(rgb('#5be0ff'), .35 + hz * .3))
        for (px, py, col) in ((p1[0], p1[1], rgb('#ffe070')), (p2[0], p2[1], rgb('#5be0ff'))):
            col = tuple(int(v * (.4 + hz * .6)) for v in col)
            c.r(px - 1, py - 1, px + 1, py + 1, col)
            c.line(px - 4, py, px + 4, py, dim(col, .55)); c.line(px, py - 4, px, py + 4, dim(col, .55))
    for (x, y) in ((50, 40), (270, 80), (120, 110), (300, 20), (20, 120)):
        for a in range(0, 360, 45):
            c.line(x, y, x + math.cos(math.radians(a)) * 10, y + math.sin(math.radians(a)) * 10, rgb('#ffffff') if a % 90 == 0 else rgb('#8af0ff'))
        c.circ(x, y, 2, rgb('#ffffff'))
    slab(c, 140, '#b8fcff', '#2a7a8a', '#04141c', 8, 100, 320)
    for x in range(108, 316, 10):
        c.r(x, 145, x + 2, 147, rgb('#ffe070'))
    return c.im


@scene(22)
def w22():
    c = C(); rnd = random.Random(122)
    vgrad(c, 0, 0, W, H, ramp('#010104', '#03030c', '#06061a', '#0a0a2a'))
    glow(c, 70, 52, 90, rgb('#0e0e3a'), .7, 1.5)
    for k in range(1, 7):
        ring(c, 70, 52, 18 + k * 24, (18 + k * 24) * .7, mix(rgb('#2a2a78'), rgb('#03030c'), k * .12), 1, 0, 360, 3)
    glow(c, 70, 52, 14, rgb('#8a8aff'), .9); c.r(69, 51, 72, 54, rgb('#ffffff'))
    c.line(70, 44, 70, 60, rgb('#c8c8ff')); c.line(62, 52, 78, 52, rgb('#c8c8ff'))
    stars(c, rnd, 26, [rgb('#3a3a78'), rgb('#5a5aa8')], 0, 136)
    c.r(0, 140, W, 141, rgb('#2a2a68'))
    for x in range(0, W, 5):
        if rnd.random() < .5:
            c.p(x, 143 + rnd.randint(0, 6), rgb('#1a1a48'))
    c.r(150, 140, 280, 142, rgb('#5a5ab8'))
    return c.im


@scene(23)
def w23():
    c = C(); rnd = random.Random(123)
    vgrad(c, 0, 0, W, H, ramp('#0c0618', '#1a0c2c', '#2c1440', '#40205a'))
    ox, oy = 28, 150
    for k in range(1, 26):
        rr = 12 + k * 13
        col = mix(rgb('#ffd488'), rgb('#1a0c2c'), min(.88, k * .036))
        ring(c, ox, oy, rr, rr * .9, col, 2 if k < 8 else 1, 270, 360 + 90, 0 if k % 3 else 3)
    glow(c, ox, oy, 40, rgb('#ffb04a'), .9); glow(c, ox, oy, 16, rgb('#fff0c8'), 1)
    stars(c, rnd, 40, [rgb('#e8c8ff'), rgb('#ffe8a8')], 0, 136)
    slab(c, 140, '#ffe0a0', '#a8682a', '#1c0c10', 8, 108, 320)
    for x in range(116, 316, 12):
        c.r(x, 145, x + 4, 146, rgb('#ffd062'))
    return c.im


@scene(24)
def w24():
    c = C(); rnd = random.Random(124)
    vgrad(c, 0, 0, W, H, ramp('#031208', '#06240e', '#0a3a18', '#10522a'))
    glow(c, 190, 40, 100, rgb('#16602e'), .7, 1.6)
    for x in range(8, W, 14):
        top = rnd.randint(26, 112); n = rnd.choice((1, 2, 3)); ph = rnd.uniform(0, 6.28); A = rnd.uniform(4, 9)
        hz = rnd.uniform(0, .5)
        prev = None
        for i in range(0, 141 - top):
            t = i / (140 - top); y = 140 - i
            xo = math.sin(n * math.pi * t) * math.sin(ph) * A * (1 if t < 1 else 0)
            col = mix(mix(rgb('#1a8a3a'), rgb('#ffe070'), t), rgb('#06240e'), hz)
            if prev:
                c.line(prev[0], prev[1], x + xo, y, dim(col, .5), 4); c.line(prev[0], prev[1], x + xo, y, col, 2)
            prev = (x + xo, y)
        sphere(c, x + xo, top, 4, haze(ramp('#6a4a00', '#c8a010', '#ffe050', '#fff8c0'), rgb('#06240e'), hz), spec=False)
        glow(c, x + xo, top, 10, rgb('#ffe070'), .4)
    for i in range(7):
        x = rnd.randint(14, W - 14); y = rnd.randint(14, 100); rx = rnd.randint(7, 16)
        ring(c, x, y, rx, rx * .5, rgb('#8dffb4'), 1)
        ring(c, x, y + 1, rx, rx * .5, rgb('#3ec878'), 1)
    c.r(0, 140, W, H, rgb('#06140a')); c.r(0, 140, W, 142, rgb('#3ec878'))
    for _ in range(40):
        c.p(rnd.randint(0, W - 1), rnd.randint(144, H - 1), rgb('#16602e'))
    stars(c, rnd, 30, [rgb('#c8ffd8')], 0, 136)
    return c.im


@scene(25)
def w25():
    c = C(); rnd = random.Random(125)
    vgrad(c, 0, 0, W, H, ramp('#02040e', '#060a22', '#0a1238', '#101a52'))
    for _ in range(6):
        glow(c, rnd.randint(0, W), rnd.randint(0, 120), rnd.randint(20, 50), rgb('#14226a'), .5)
    ICE = ramp('#10206a', '#2a58b8', '#68a8f0', '#c0e8ff', '#ffffff')
    bg = rgb('#0a1238')
    for i in range(16):
        r = rnd.randint(7, 24); hz = rnd.uniform(.1, .6)
        facet(c, rnd.randint(10, W - 10), rnd.randint(14, 118), r, haze(ICE, bg, hz), rnd, 7, .28, 1.5, edge=mix(rgb('#c0e8ff'), bg, hz))
    for (x, y) in ((40, 30), (280, 96), (150, 20), (300, 30), (100, 108)):
        c.line(x - 5, y, x + 5, y, rgb('#ffffff')); c.line(x, y - 5, x, y + 5, rgb('#ffffff'))
    top = [(120, 150), (168, 140), (264, 140), (306, 150), (262, 158), (168, 158)]
    c.poly(top, rgb('#c0e8ff'), rgb('#ffffff'))
    c.poly([(120, 150), (168, 158), (178, 182), (116, 182)], rgb('#3a68c8'))
    c.poly([(306, 150), (262, 158), (252, 182), (312, 182)], rgb('#1a3a8a'))
    c.poly([(168, 158), (262, 158), (252, 182), (178, 182)], rgb('#68a8f0'))
    for k in range(5):
        c.line(180 + k * 20, 143, 190 + k * 20, 155, rgb('#ffffff'))
    return c.im


@scene(26)
def w26():
    c = C(); rnd = random.Random(126)
    vgrad(c, 0, 0, W, 140, ramp('#10041c', '#240a38', '#3a1458', '#541c78'))
    pal = [rgb('#e8e8ff'), rgb('#ff6ac8'), rgb('#a8a8d8'), rgb('#9a78ff')]
    cx, cy = 150, 70
    for k in range(0, 15):
        s = 0.8 ** k
        x0 = cx - 330 * s; x1 = cx + 330 * s; y0 = cy - 190 * s; y1 = cy + 190 * s
        fill = rgb('#1a0a30') if k % 2 else rgb('#2a1048')
        c.poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], fill, pal[k % 4])
    glow(c, cx, cy, 24, rgb('#ffffff'), .9)
    for (x, y) in ((40, 30), (270, 40), (80, 110), (300, 100)):
        c.line(x - 5, y, x + 5, y, rgb('#ffffff')); c.line(x, y - 5, x, y + 5, rgb('#ffffff'))
    base = c.im.copy()
    refl = base.crop((0, 60, W, 140)).transpose(Image.FLIP_TOP_BOTTOM)
    from PIL import ImageEnhance
    refl = ImageEnhance.Brightness(refl).enhance(.5)
    c.im.paste(refl, (0, 140))
    c.r(0, 140, W, 142, rgb('#ffffff'))
    for y in range(144, H, 4):
        c.r(0, y, W, y + 1, rgb('#240a38'))
    sp = PLAYER.transpose(Image.FLIP_TOP_BOTTOM)
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); lay.paste(sp, (FX - 13, FY + 1), sp)
    al = lay.split()[3].point(lambda v: int(v * .42)); lay.putalpha(al)
    c.im.alpha_composite(lay)
    return c.im


@scene(27)
def w27():
    c = C(); rnd = random.Random(127)
    vgrad(c, 0, 0, W, 112, ramp('#0a1a3a', '#2a3a78', '#8a5aa8', '#ffa8a8', '#ffe0b8'))
    glow(c, 238, 100, 70, rgb('#ff9aa0'), .8, 1.6); c.circ(238, 106, 16, rgb('#fff0d0'))
    vgrad(c, 0, 108, W, 142, ramp('#18607a', '#2a8a98', '#58c0c0', '#a8f0e8'))
    for y in range(110, 140, 5):
        for x in range(-8, W + 8, 14):
            xx = x + (y % 10) + rnd.randint(-2, 2); r = 3 + (y - 108) // 6
            c.ell(xx - r, y - r // 2, xx + r, y + r // 2, None, outline=rgb('#e8ffff'))
    stars(c, rnd, 30, [rgb('#ffe8f0')], 0, 70)
    for _ in range(30):
        x = rnd.randint(0, W); y = rnd.randint(20, 120); r = rnd.randint(2, 6)
        c.ell(x - r, y - r, x + r, y + r, None, outline=rgb('#d8f8ff')); c.p(x - r // 2, y - r // 2, rgb('#ffffff'))
    c.r(0, 148, W, H, rgb('#7a58a8'))
    F = ramp('#7a58a8', '#c8a0e0', '#ffd0f0', '#fff0fa', '#ffffff')
    for row, (cy, f) in enumerate(((176, 0), (162, 0), (151, 0))):
        x = -10 + row * 7
        while x < W + 12:
            r = rnd.randint(9, 17)
            sphere(c, x, cy + rnd.randint(-2, 2), r, F)
            x += r * 2 - 4
    c.ell(196, 138, 232, 150, rgb('#fff0fa'), outline=rgb('#c8a0e0'))
    return c.im


@scene(28)
def w28():
    c = C(); rnd = random.Random(128)
    vgrad(c, 0, 0, W, H, ramp('#021208', '#04240e', '#0a3a1a', '#124e26'))
    glow(c, 80, 30, 100, rgb('#16602e'), .6, 1.6)
    G = [rgb('#ffd062'), rgb('#ff9a3a'), rgb('#ffe8a0')]
    bg = rgb('#04240e')
    for x in range(10, W, 36):
        h = rnd.randint(60, 124); hz = rnd.uniform(0, .55); w_ = rnd.randint(9, 15)
        y = 140
        i = 0
        while y > 140 - h:
            col = mix(G[i % 3], bg, hz)
            if i % 2 == 0:
                ring(c, x, y, w_, 6, col, 2)
            else:
                ring(c, x, y, 5, w_ * .8, col, 2)
            y -= 9; i += 1
        for k in range(5):
            a = rnd.uniform(0, 6.28); ring(c, x + math.cos(a) * 14, y - 6 + math.sin(a) * 6, 10, 7, mix(rgb('#ffe8a0'), bg, hz), 1)
    c.r(0, 140, W, H, rgb('#06140a')); c.r(0, 140, W, 142, rgb('#ffd062'))
    for x in range(0, W, 7):
        ring(c, x, 150 + (x // 7) % 2 * 8, 4, 2, rgb('#8a6a1a'), 1)
    stars(c, rnd, 30, [rgb('#c8ffd8'), rgb('#ffe8a0')], 0, 136)
    return c.im


@scene(29)
def w29():
    c = C(); rnd = random.Random(129)
    vgrad(c, 0, 0, W, H, ramp('#2a0a48', '#5a1a78', '#a02a98', '#48a8d8', '#a8f0f0'))
    cols = [rgb('#5be0ff'), rgb('#ff9ad8'), rgb('#ffe070'), rgb('#ffffff')]
    for _ in range(34):
        x = rnd.randint(0, W); y = rnd.randint(0, 136); r = rnd.randint(4, 30)
        col = rnd.choice(cols)
        glow(c, x, y, r, dim(col, .35), .3)
        c.ell(x - r, y - r, x + r, y + r, None, outline=col, width=2 if r > 14 else 1)
        c.line(x - r * .55, y - r * .55, x - r * .15, y - r * .8, rgb('#ffffff'), 1)
        c.p(x + r * .5, y + r * .5, rgb('#ffffff'))
    cx, cy, R = 214, 246, 106
    bands = [rgb('#5be0ff'), rgb('#9ad8ff'), rgb('#ff9ad8'), rgb('#ffe070'), rgb('#b8ffe0'), rgb('#c8a0ff')]
    for y in range(cy - R, H):
        for x in range(cx - R, cx + R + 1):
            d = math.hypot(x - cx, y - cy) / R
            if d <= 1:
                k = int((d * 7 + (x - cx) * .01) * 1.0) % 6
                col = mix(bands[k], rgb('#1a0a48'), max(0, (1 - d) * .0 + (d - .85) * -1.5) if d > .85 else .35 + (1 - d) * .1)
                if d > .93:
                    col = rgb('#ffffff') if B4[y % 4][x % 4] < 8 else bands[k]
                c.p(x, y, col)
    for a in range(220, 280):
        c.p(cx + math.cos(math.radians(a)) * R * .88, cy + math.sin(math.radians(a)) * R * .88, rgb('#ffffff'))
    return c.im


@scene(30)
def w30():
    c = C(); rnd = random.Random(130)
    vgrad(c, 0, 0, W, H, ramp('#10061c', '#2a0e3a', '#541a5a', '#a83a6a', '#ff8a6a'))
    glow(c, 80, 118, 80, rgb('#ff8a6a'), .6, 1.8)
    PALS = [ramp('#4a2a00', '#a8661a', '#ffb04a', '#ffe8a0'), ramp('#2a1060', '#5a30b8', '#9a68f0', '#d8c0ff'), ramp('#0a3a48', '#1a7a88', '#46c0c8', '#c0fcff')]
    bgc = rgb('#541a5a')
    x = -4
    while x < W:
        wd = rnd.randint(16, 34); top = rnd.randint(24, 100); hz = rnd.uniform(0, .5)
        cable(c, x, top, x + wd, 140, haze(rnd.choice(PALS), bgc, hz), True, rnd.choice((5, 6, 8)))
        for yy in range(top + 8, 136, 9):
            for xx in range(x + 4, x + wd - 3, 6):
                if rnd.random() < .3:
                    c.r(xx, yy, xx + 2, yy + 2, mix(rgb('#fff0b0'), bgc, hz))
        x += wd + rnd.randint(0, 5)
    pts = []
    for i in range(0, 361, 3):
        t = math.radians(i)
        pts.append((64 + (math.sin(t) + 2 * math.sin(2 * t)) * 11, 54 + (math.cos(t) - 2 * math.cos(2 * t)) * 11))
    for i in range(len(pts) - 1):
        c.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], rgb('#3a1a00'), 7)
    for i in range(len(pts) - 1):
        col = rgb('#ffd062') if (i // 20) % 2 == 0 else rgb('#ff9a3a')
        c.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], col, 4)
        c.line(pts[i][0] - 1, pts[i][1] - 1, pts[i + 1][0] - 1, pts[i + 1][1] - 1, rgb('#fff0b0'), 1)
    glow(c, 64, 54, 40, rgb('#ffb04a'), .35)
    slab(c, 140, '#ffe0b0', '#8a4a6a', '#1a0a28', 8)
    for x in range(0, W, 20):
        c.line(x, 142, x - 30, H, rgb('#5a2a6a'))
    return c.im


@scene(31)
def w31():
    c = C(); rnd = random.Random(131)
    vgrad(c, 0, 0, W, H, ramp('#1a0a38', '#4a1a6a', '#a8409a', '#ff80a0', '#ffc880'))
    glow(c, 250, 120, 90, rgb('#ffc880'), .7, 1.8)
    RB = [ramp('#6a1040', '#c02a78', '#ff68b8', '#ffd0ec'), ramp('#6a4a00', '#d89a10', '#ffd050', '#fff4c0'),
          ramp('#0a3a58', '#1a80b0', '#5ad0ff', '#d0f4ff'), ramp('#401a78', '#7a48d8', '#b898ff', '#f0e8ff')]
    for i in range(7):
        y0 = rnd.randint(10, 120); amp = rnd.uniform(10, 30); lam = rnd.uniform(110, 220); ph = rnd.uniform(0, 6.28)
        rp = RB[i % 4]; th = rnd.randint(8, 16)
        for x in range(-2, W + 2):
            yc = y0 + math.sin(x * 2 * math.pi / lam + ph) * amp
            tw = abs(math.cos(x * 2 * math.pi / (lam * .8) + ph))
            hh = max(2, th * (.3 + .7 * tw))
            slope = math.cos(x * 2 * math.pi / lam + ph)
            for y in range(int(yc - hh / 2), int(yc + hh / 2) + 1):
                t = (y - (yc - hh / 2)) / max(1, hh)
                v = (1 - t) * 3 * (.5 + .5 * slope) + (B4[y % 4][x % 4] / 16 - .5)
                c.p(x, y, rp[max(0, min(3, int(round(v))))])
    stars(c, rnd, 40, [rgb('#ffe8f8'), rgb('#ffffff')], 0, 136)
    slab(c, 140, '#fff0f8', '#d85aa0', '#2a0a38', 9, 100, 320)
    for k in range(6):
        wavy(c, 100, 142 + k * 4, 320, 142 + k * 4, 1.5, 6, rgb('#ff9ad8'), 1, k)
    return c.im


@scene(32)
def w32():
    c = C(); rnd = random.Random(132)
    vgrad(c, 0, 0, W, H, ramp('#020a14', '#041a2c', '#08304a', '#104a6a'))
    glow(c, 160, 100, 140, rgb('#0e4a6a'), .6, 2.2)
    GL = ramp('#0a3a58', '#1a80b0', '#5ad0ff', '#d0f4ff')
    bg = rgb('#08304a')
    hz = 104
    for i in range(18):
        x = rnd.randint(0, W); h = rnd.randint(18, 78); w_ = rnd.randint(8, 18); f = rnd.uniform(0, .5)
        rp = haze(GL, bg, f)
        c.poly([(x - w_, hz), (x, hz - h), (x, hz)], rp[2]); c.poly([(x, hz - h), (x + w_, hz), (x, hz)], rp[1])
        c.line(x, hz - h, x, hz, rp[3])
        c.poly([(x - w_, hz), (x, hz + h * .5), (x, hz)], dim(rp[1], .5)); c.poly([(x, hz + h * .5), (x + w_, hz), (x, hz)], dim(rp[0], .8))
    for k in range(7):
        prev = None
        for x in range(-2, W + 3, 3):
            y = hz + 4 + k * 5 + (3 if (x // 6) % 2 else -3) * (k * .1 + .3)
            if prev:
                c.line(prev[0], prev[1], x, y, rgb('#d0f4ff') if k % 2 == 0 else rgb('#5ad0ff'), 1)
            prev = (x, y)
    stars(c, rnd, 40, [rgb('#d0f4ff'), rgb('#ffffff')], 0, 100)
    c.r(0, 140, W, H, rgb('#04141c')); c.r(0, 140, W, 143, rgb('#d0f4ff')); c.r(0, 143, W, 146, rgb('#5ad0ff'))
    for k in range(10):
        c.line(rnd.randint(0, W), 148, rnd.randint(0, W), H, rgb('#0e4a6a'))
    return c.im


@scene(33)
def w33():
    c = C(); rnd = random.Random(133)
    for y in range(H):
        for x in range(W):
            v = int(30 + rnd.random() * 60 + (14 if B4[y % 4][x % 4] < 6 else 0))
            if y % 2 == 1:
                v = int(v * .72)
            c.p(x, y, (v, v, int(v * 1.08)))
    for _ in range(14):
        y = rnd.randint(0, 136); h = rnd.randint(3, 14); dx = rnd.randint(-30, 30)
        band = c.im.crop((0, y, W, y + h)); c.im.paste(band, (dx, y))
    for _ in range(16):
        x = rnd.randint(4, W - 40); y = rnd.randint(8, 120); w_ = rnd.randint(14, 60); h_ = rnd.randint(4, 24)
        c.r(x - 3, y, x + w_ - 3, y + h_, rgb('#ff2a5a')); c.r(x + 3, y, x + w_ + 3, y + h_, rgb('#2ae0ff'))
        c.r(x, y, x + w_, y + h_, rgb('#f0f0ff') if rnd.random() < .5 else rgb('#ffe070'))
    for y in range(0, 140, 3):
        if rnd.random() < .12:
            c.r(0, y, W, y + 1, rgb('#ffffff'))
    c.r(0, 140, W, H, rgb('#0a0a14'))
    c.r(120, 140, 300, 143, rgb('#ff2a5a')); c.r(124, 140, 304, 143, rgb('#2ae0ff')); c.r(122, 140, 302, 142, rgb('#ffffff'))
    for y in range(146, H, 2):
        if rnd.random() < .5:
            x = rnd.randint(0, W - 30); c.r(x, y, x + rnd.randint(6, 40), y + 1, rgb('#3a3a5a'))
    return c.im


@scene(34)
def w34():
    c = C(); rnd = random.Random(134)
    vgrad(c, 0, 0, W, H, ramp('#030208', '#0c0814', '#1a1226', '#2a1c38'))
    dx, dy = 112, 98
    glow(c, dx, dy, 150, rgb('#5a3a18'), .8, 1.3); glow(c, dx, dy, 90, rgb('#c08a3a'), .8, 1.2); glow(c, dx, dy, 44, rgb('#ffd890'), 1, 1.0)
    for a in range(0, 360, 6):
        L = 300
        col = rgb('#8a6a2a') if a % 12 == 0 else rgb('#4a3a1a')
        c.line(dx, dy, dx + math.cos(math.radians(a)) * L, dy + math.sin(math.radians(a)) * L * .75, col)
    c.r(dx - 26, 66, dx + 27, 141, rgb('#fff0c0')); c.circ(dx, 66, 26, rgb('#fff0c0'))
    vgrad(c, dx - 26, 40, dx + 27, 141, ramp('#ffffff', '#fff8d8', '#ffe8a0', '#ffd062'))
    c.r(dx - 22, 70, dx + 23, 141, rgb('#ffffff')); c.circ(dx, 66, 22, rgb('#ffffff'))
    vgrad(c, dx - 22, 44, dx + 23, 141, ramp('#ffffff', '#ffffff', '#fff4c8'))
    stars(c, rnd, 40, [rgb('#ffe8b8'), rgb('#ffffff')], 0, 136)
    c.r(0, 141, W, H, rgb('#0a0610'))
    for k in range(-8, 9):
        c.line(dx + k * 6, 141, dx + k * 44, H, rgb('#5a4a2a') if k % 2 else rgb('#3a2e1a'))
    y = 141; st = 3
    while y < H:
        c.r(0, y, W, y + 1, rgb('#6a5a2a')); y += st; st += 2
    c.r(dx - 20, 141, dx + 21, 150, rgb('#ffe8a0'))
    c.r(0, 140, W, 142, rgb('#ffd062'))
    return c.im

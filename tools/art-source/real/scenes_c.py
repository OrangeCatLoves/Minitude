from kit import *

def dome(c, ramp_, R=420, cx=210, top=140, light=(-.35, -.8)):
    """The particle itself as a giant smooth ball: its top is the ground the explorer stands on. Returns the surface height function."""
    sphere(c, cx, top + R, R, ramp_, light=light, spec=False)
    return lambda x: top + (R - math.sqrt(max(0.0, R * R - (x - cx) ** 2)))

def ghost_bump(c, xc, h, surf, col=(255, 200, 87), fill=None, wid=None):
    """The biggest bump the measurement still allows, drawn dotted at the true scale (h px tall)."""
    w_ = wid if wid else max(10, h * 1.1)
    pts = []
    for i in range(-int(w_), int(w_) + 1):
        x = xc + i; y = surf(x) - h * math.exp(-(i / (w_ * .62)) ** 2)
        pts.append((x, y))
    if fill is not None:
        for (x, y) in pts:
            for yy in range(int(y), int(surf(x)) + 1):
                if (x + yy) % 2 == 0: c.p(x, yy, fill)
    for i, (x, y) in enumerate(pts):
        if i % 3 != 2: c.p(x, y, col); c.p(x, y - 1, col)
    return pts

# ------------------------------------------------------------ world 29  ROUND NEUTRON  (nEDM at PSI 2020: charge centres differ by < 1.8e-28 m = 1.06 explorers)
@scene(28)
def w29():
    c = C(); rnd = random.Random(1029)
    vgrad(c, 0, 0, W, H, ramp('#05080f', '#0a1420', '#10202e', '#182e40'))
    glow(c, 90, 70, 120, rgb('#16405a'), .5, 1.5)
    # a storage bottle for ultracold neutrons: a copper cylinder in a steel shield
    for (x0, x1, rp) in ((8, 150, ramp('#3a2418', '#7a4a2a', '#c07a42', '#f0b878')),):
        for y in range(34, 120):
            t = (y - 34) / 86; v = 1 - abs(t - .32) * 1.9
            for x in range(x0, x1):
                c.p(x, y, rp[max(0, min(3, int(round(v * 3 + (B4[y % 4][x % 4] / 16 - .5)))))])
    c.ell(2, 28, 22, 126, rgb('#c07a42'), rgb('#f0b878'), 1)
    for x in range(30, 150, 26): c.r(x, 34, x + 2, 120, rgb('#3a2418'))
    c.r(8, 30, 150, 33, rgb('#8a9ab8')); c.r(8, 121, 150, 124, rgb('#3a4a68'))
    for _ in range(26):
        x = rnd.randint(14, 146); y = rnd.randint(40, 114); c.r(x, y, x + 1, y + 1, rgb('#d8f4ff')); glow(c, x, y, 4, rgb('#5ac8ff'), .4)
    starfield(c, rnd, 24, [rgb('#9ac0e0')], 0, 28, 0)
    surf = dome(c, ramp('#0e1c2c', '#1c3650', '#2e5878', '#5a8cb0', '#a8d0e8'))
    ghost_bump(c, 148, 53, surf, fill=rgb('#3a5a78'))
    c.r(205, 139, 216, 141, rgb('#a8d0e8'))
    return c.im

# ------------------------------------------------------------ world 30  THALLIUM BEAM  (Regan 2002, |d_e| < 1.6e-27 e cm -> 1.6e-29 m = 0.94 explorer)
@scene(29)
def w30():
    c = C(); rnd = random.Random(1030)
    vgrad(c, 0, 0, W, H, ramp('#02080a', '#04141a', '#082228', '#0c3238'))
    # a beam of thallium atoms (flame-test green) flies between two charged plates
    for y in range(0, 120): pass
    c.r(0, 22, 188, 34, rgb('#c8a038')); c.r(0, 22, 188, 25, rgb('#ffe890')); c.r(0, 31, 188, 34, rgb('#6a5018'))
    c.r(0, 98, 188, 110, rgb('#c8a038')); c.r(0, 98, 188, 101, rgb('#ffe890')); c.r(0, 107, 188, 110, rgb('#6a5018'))
    for x in range(6, 188, 18): c.r(x, 34, x + 2, 40, rgb('#6a5018')); c.r(x, 92, x + 2, 98, rgb('#6a5018'))
    for i in range(12):
        x = i * 16 + 6; c.line(x, 38, x, 94, dim(rgb('#c8a038'), .45))
    for a in range(0, 340, 3):
        glow(c, a, 66, 6, rgb('#3aff7a'), .3)
    c.r(0, 64, 340, 68, rgb('#8affb0')); c.r(0, 65, 340, 67, rgb('#eaffee'))
    for _ in range(130):
        x = rnd.randint(0, 220); c.r(x, 63 + rnd.randint(0, 5), x + 1, 64 + rnd.randint(0, 5), rgb('#c8ffd8'))
    starfield(c, rnd, 24, [rgb('#7ad8c8')], 0, 20, 0)
    surf = dome(c, ramp('#08202a', '#0f3a46', '#1a6070', '#36a0b0', '#8ae0e8'))
    ghost_bump(c, 150, 47, surf, fill=rgb('#1a5a68'))
    return c.im

# ------------------------------------------------------------ world 31  COLD MOLECULES  (ACME I 2014, |d_e| < 8.7e-29 e cm -> 8.7e-31 m = 0.51 explorer)
@scene(30)
def w31():
    c = C(); rnd = random.Random(1031)
    vgrad(c, 0, 0, W, H, ramp('#02061a', '#06103a', '#0c1c58', '#142a74'))
    # a cryogenic cell puffs a cloud of cold thorium monoxide molecules
    c.r(4, 50, 40, 100, rgb('#6a7ea8')); c.r(4, 50, 40, 54, rgb('#c8d8f8')); c.r(36, 50, 40, 100, rgb('#3a4a78'))
    c.ell(24, 66, 48, 84, rgb('#0a1a48'), rgb('#e8f4ff'), 1)
    for k in range(70):
        t = k / 69; x = 44 + t * 170; sp = 4 + t * 34
        for _ in range(5):
            u = (rnd.random() - .5) * 2 * sp
            c.p(x + rnd.uniform(-5, 5), 75 + u, rgb('#e8f4ff') if rnd.random() < .5 else rgb('#8ab8ff'))
        glow(c, x, 75, 6 + t * 18, rgb('#5a8cf0'), .13)
    # molecules: a big thorium ball and a small oxygen ball
    for (x, y) in ((92, 66), (126, 84), (160, 70), (74, 90)):
        c.circ(x, y, 4, rgb('#9ab0d8')); c.circ(x - 1, y - 1, 2, rgb('#e8f0ff')); c.circ(x + 6, y + 2, 2, rgb('#ff6a7a'))
    # two crossing laser beams, violet
    for (x0, y0, x1, y1) in ((60, 6, 150, 120), (250, 6, 130, 120)):
        streak(c, x0, y0, x1, y1, [rgb('#5a2aa8'), rgb('#b07aff'), rgb('#f0e0ff')], 1)
    glow(c, 140, 100, 10, rgb('#e0c8ff'), .8)
    starfield(c, rnd, 30, [rgb('#9ab0ff')], 0, 40, 0)
    surf = dome(c, ramp('#0a1030', '#142458', '#243c88', '#4a6cc8', '#a8c0f8'))
    ghost_bump(c, 150, 26, surf, fill=rgb('#2a3c78'))
    return c.im

# ------------------------------------------------------------ world 32  INSIDE A MOLECULE  (ACME II 2018, |d_e| < 1.1e-29 e cm -> 1.1e-31 m = 0.65 explorer)
@scene(31)
def w32():
    c = C(); rnd = random.Random(1032)
    vgrad(c, 0, 0, W, H, ramp('#0a0412', '#1a0828', '#2c1038', '#44184a'))
    glow(c, 90, 80, 120, rgb('#6a2a6a'), .4, 1.4)
    # the electron sits inside a molecule's own enormous electric field: golden field lines run between a heavy and a light atom
    th = (46, 80); ox = (148, 80)
    for k in range(-6, 7):
        pts = []
        for i in range(0, 41):
            t = i / 40; x = th[0] + (ox[0] - th[0]) * t; y = 80 + k * 6 * math.sin(math.pi * t)
            pts.append((x, y))
        for i in range(1, len(pts)):
            c.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], rgb('#ffd062') if abs(k) < 4 else rgb('#a8782a'))
    sphere(c, th[0], th[1], 24, ramp('#1a1a30', '#3a3a64', '#6a6aa0', '#aab0e0'), light=(-.4, -.6))
    sphere(c, ox[0], ox[1], 12, ramp('#400a14', '#7a1a2a', '#c8384a', '#ff8a9a'), light=(-.4, -.6))
    glow(c, 96, 80, 14, rgb('#fff0b0'), .9); c.circ(96, 80, 2, rgb('#ffffff'))
    # the shield and lasers around the lab
    for (x0, y0, x1, y1) in ((0, 18, 190, 30), (0, 130, 190, 112)):
        streak(c, x0, y0, x1, y1, [rgb('#5a2aa8'), rgb('#b07aff'), rgb('#f0e0ff')], 1)
    starfield(c, rnd, 30, [rgb('#e8b0ff')], 0, 30, 0)
    surf = dome(c, ramp('#1a0a24', '#34144a', '#5a2478', '#9a48b0', '#e0a0e8'))
    ghost_bump(c, 150, 32, surf, fill=rgb('#4a1a5a'))
    return c.im

# ------------------------------------------------------------ world 33  ION RING  (JILA 2023, |d_e| < 4.1e-30 e cm -> 4.1e-32 m = 2.4 explorers)
@scene(32)
def w33():
    c = C(); rnd = random.Random(1033)
    vgrad(c, 0, 0, W, H, ramp('#02100c', '#04201a', '#083228', '#0e463a'))
    glow(c, 96, 70, 110, rgb('#0e6a50'), .45, 1.4)
    # molecular ions held in a ring by a rotating electric field: beads circle round
    cx, cy = 92, 78
    ring(c, cx, cy, 52, 52, rgb('#2a8a70'), 1); ring(c, cx, cy, 38, 38, rgb('#1a5a48'), 1)
    for i in range(24):
        a = i * 2 * math.pi / 24; x = cx + math.cos(a) * 45; y = cy + math.sin(a) * 45
        col = rgb('#5affc8') if i % 2 else rgb('#ff8ad0')
        glow(c, x, y, 7, col, .5); c.circ(x, y, 3, col); c.p(x - 1, y - 1, rgb('#ffffff'))
        c.line(x, y, x - math.sin(a) * 9, y + math.cos(a) * 9, dim(col, .7))
    # the rotating field: four electrodes with arrows
    for a in (0, 90, 180, 270):
        x = cx + math.cos(math.radians(a)) * 70; y = cy + math.sin(math.radians(a)) * 70
        c.r(x - 5, y - 5, x + 5, y + 5, rgb('#c8d8d0')); c.r(x - 5, y - 5, x + 5, y - 2, rgb('#ffffff'))
    for a in range(0, 360, 60):
        x = cx + math.cos(math.radians(a + 20)) * 62; y = cy + math.sin(math.radians(a + 20)) * 62
        c.line(x, y, x - math.sin(math.radians(a + 20)) * 8, y + math.cos(math.radians(a + 20)) * 8, rgb('#ffd062'))
    starfield(c, rnd, 24, [rgb('#7affc8')], 0, 14, 0)
    surf = dome(c, ramp('#06241c', '#0e4434', '#1a6c54', '#34b090', '#98f0d0'))
    ghost_bump(c, 178, 120, surf, fill=rgb('#1a5a48'), wid=44)
    return c.im

# ------------------------------------------------------------ world 34  LIGHT'S RACE  (H.E.S.S. 2008: scale above 7.2e17 GeV -> 2.7e-34 m = 0.16 explorer)
@scene(33)
def w34():
    c = C(); rnd = random.Random(1034)
    vgrad(c, 0, 0, W, 130, ramp('#08041a', '#1a0a38', '#44184a', '#8a2a50', '#e0603a'))
    starfield(c, rnd, 80, [rgb('#ffe8d8'), rgb('#ffffff')], 0, 70, 2)
    # a blazar far away flares: a bright core with two jets
    bx, by = 24, 70
    glow(c, bx, by, 46, rgb('#c85a8a'), .6, 1.4); glow(c, bx, by, 20, rgb('#ffd8f0'), .9); c.circ(bx, by, 3, rgb('#ffffff'))
    streak(c, bx, by, bx + 40, by - 34, [rgb('#8a3a9a'), rgb('#f0a8ff')], 1); streak(c, bx, by, bx - 10, by + 28, [rgb('#8a3a9a'), rgb('#f0a8ff')], 1)
    # a race: photons of different energy, all level at the line (a dead heat)
    cols = ['#ff4a4a', '#ff9a2a', '#ffe84a', '#4aff8a', '#4ac8ff', '#9a6aff']
    for i, col in enumerate(cols):
        y = 40 + i * 9
        for t in range(0, 24):
            xx = 70 + t * 5; a = 1 - t / 24
            c.r(xx, y, xx + 3, y + 1, dim(rgb(col), .25 + .75 * (1 - a)))
        glow(c, 190, y, 7, rgb(col), .6); c.circ(190, y, 2, rgb('#ffffff'))
    c.line(190, 30, 190, 104, rgb('#ffffff')); c.line(192, 30, 192, 104, rgb('#ffffff'))
    # the telescopes: four big dishes on the Namibian plain
    for (x, y, r) in ((250, 128, 17), (292, 124, 15), (22, 130, 12), (82, 132, 13)):
        c.ell(x - r, y - r * .9, x + r, y + r * .5, rgb('#a8b0c8'), rgb('#e8f0ff'), 1)
        for a in range(0, 180, 30):
            c.line(x, y - r * .2, x + math.cos(math.radians(a + 180)) * r, y + math.sin(math.radians(a + 180)) * r * .7, rgb('#6a748f'))
        c.line(x, y + r * .4, x, 140, rgb('#4a526a')); c.r(x - 2, y + r * .5, x + 2, y + r * .5 + 3, rgb('#2a3042'))
    ledge(c, 140, '#f0a878', '#7a3a38', '#140608', 0, W, 9)
    return c.im

# ------------------------------------------------------------ world 35  DEAD HEAT  (Fermi 2009: 1.36e-35 m = 0.08 explorer)
@scene(34)
def w35():
    c = C(); rnd = random.Random(1035)
    vgrad(c, 0, 0, W, H, ramp('#010208', '#04061a', '#0a0a30', '#14123c'))
    starfield(c, rnd, 120, [rgb('#c8d0ff'), rgb('#ffffff')], 0, 136, 4)
    # a gamma-ray burst, 7 billion light-years away: a giant flash with a shock ring
    bx, by = 52, 62
    glow(c, bx, by, 70, rgb('#3a2a98'), .6, 1.2); glow(c, bx, by, 38, rgb('#9a86ff'), .8); glow(c, bx, by, 18, rgb('#ffffff'), 1.0)
    for a in range(0, 360, 12):
        L = 54 if a % 24 == 0 else 34
        c.line(bx, by, bx + math.cos(math.radians(a)) * L, by + math.sin(math.radians(a)) * L, rgb('#e0d8ff') if a % 24 == 0 else rgb('#7a66d8'))
    ring(c, bx, by, 66, 66, rgb('#6a8cff'), 1); ring(c, bx, by, 72, 72, rgb('#3a4cb8'), 1)
    # the satellite: a body with two solar wings
    sx, sy = 262, 44
    c.r(sx - 7, sy - 6, sx + 8, sy + 8, rgb('#c8cce0')); c.r(sx - 7, sy - 6, sx + 8, sy - 3, rgb('#ffffff')); c.r(sx - 2, sy + 2, sx + 3, sy + 5, rgb('#2a3a78'))
    for sgn in (-1, 1):
        x0 = sx + sgn * 9; x1 = sx + sgn * 44
        c.r(min(x0, x1), sy - 3, max(x0, x1), sy + 5, rgb('#1a2a78'))
        for xx in range(int(min(x0, x1)), int(max(x0, x1)), 7): c.line(xx, sy - 3, xx, sy + 5, rgb('#5a7ad8'))
    # the race: a low-energy photon and a 31 GeV photon cross the line together
    for (y, col) in ((88, '#4aa8ff'), (96, '#ffd84a')):
        for t in range(26):
            xx = 90 + t * 6; a = t / 26
            c.r(xx, y, xx + 4, y + 1, dim(rgb(col), .2 + .8 * a))
        glow(c, 248, y, 8, rgb(col), .7); c.circ(248, y, 2, rgb('#ffffff'))
    c.line(248, 76, 248, 108, rgb('#ffffff')); c.line(250, 76, 250, 108, rgb('#ffffff'))
    ledge(c, 140, '#c0b8ff', '#3a2a88', '#05031a', 0, W, 9)
    return c.im

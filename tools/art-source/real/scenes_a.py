from kit import *

# ------------------------------------------------------------ world 17  FIRST QUARKS  (SLAC 1968, wavelength of a 17 GeV electron = 7.3e-17 m = 0.43 of the explorer)
@scene(16)
def w17():
    c = C(); rnd = random.Random(1017)
    vgrad(c, 0, 0, W, H, ramp('#03041a', '#070a2a', '#0c1240', '#141a58'))
    # the proton: a giant soft sphere filling the left side (it is about ten explorers wide)
    sphere(c, 40, 112, 128, ramp('#1a1540', '#2c2468', '#4a3a92', '#7a64c8', '#b49cf0'), light=(-.2, -.75), spec=False)
    glow(c, 60, 100, 120, rgb('#5a48b8'), .35, 1.2)
    # three hard grains inside it: the quarks
    grains = [(62, 78, '#ff5a6e', '#ffc0c8'), (104, 108, '#5aff9a', '#c8ffe0'), (52, 118, '#5ab4ff', '#c8e8ff')]
    for (x, y, col, hi) in grains:
        glow(c, x, y, 16, rgb(col), .55)
        c.circ(x, y, 4, rgb(col)); c.circ(x, y, 2, rgb(hi))
    # the electron beam comes in from the left as wave packets, one wavelength = 0.43 of the explorer (21 px)
    wave_train(c, 0, 112, 92, 112, 21, 7, rgb('#35c8ff'), rgb('#bff2ff'), 1)
    wave_train(c, 0, 112, 92, 112, 21, 5, rgb('#1a7ab8'), None, 1, phase=1.6)
    glow(c, 100, 110, 10, rgb('#ffffff'), .9)
    # a hard knock: the electron bounces off a grain at a steep angle
    streak(c, 104, 108, 252, 42, [rgb('#1a5a98'), rgb('#6ad4ff'), rgb('#ffffff')], 1, 18, rgb('#35c8ff'))
    streak(c, 104, 108, 250, 150, [rgb('#12406a'), rgb('#3aa0d8'), rgb('#cfeeff')], 1, 14, rgb('#35c8ff'))
    # the rest of the proton's debris
    for a in (-0.3, 0.1, 0.5):
        wavy(c, 106, 110, 106 + math.cos(a) * 80, 110 + math.sin(a) * 80, 1.5, 4, rgb('#b49cf0'), 1)
    starfield(c, rnd, 30, [rgb('#c8d0ff'), rgb('#ffffff')], 0, 70, 2)
    # floor: the end of the accelerator
    ledge(c, 140, '#9ee6ff', '#2a4a8a', '#05071a', 100, W, 9, '#ffd062')
    for x in range(100, W, 20): c.line(x, 150, x - 12, H, rgb('#142060'))
    return c.im

# ------------------------------------------------------------ world 18  SHORT REACH  (weak force: hbar/(m_W c) = 2.5e-18 m = 0.14 of the explorer)
@scene(17)
def w18():
    c = C(); rnd = random.Random(1018)
    vgrad(c, 0, 0, W, H, ramp('#0c0408', '#1c0a12', '#30121c', '#481a26'))
    sphere(c, 10, 150, 150, ramp('#2a1030', '#4a1c4c', '#7a2c66', '#b0488a', '#e078b0'), light=(-.3, -.7), spec=False)
    glow(c, 40, 120, 130, rgb('#a03a78'), .3, 1.3)
    # the reach of the weak force: a bubble 2.5e-18 m wide is only 7 pixels. They pop in and out everywhere.
    def pop(x, y, r, a=1.0):
        glow(c, x, y, r + 6, rgb('#ff8a3a'), .5 * a)
        c.circ(x, y, r, rgb('#2a0a0a')); c.ell(x - r, y - r, x + r, y + r, None, rgb('#ffb04a'), 1)
        c.r(x - 2, y - 1, x - 1, y, rgb('#5ab4ff')); c.r(x + 1, y, x + 2, y + 1, rgb('#ff5a6e'))
        c.p(x, y, rgb('#ffffff'))
    for _ in range(70):
        x = rnd.randint(8, 300); y = rnd.randint(14, 135)
        if abs(x - 210) < 20 and y > 80: continue
        pop(x, y, 3 + (rnd.random() < .25), rnd.uniform(.35, 1))
    pop(150, 118, 4); pop(96, 82, 4); pop(262, 70, 4)
    # one pair in the foreground, just one bubble wide
    for (x, y) in ((150, 118),):
        glow(c, x, y, 20, rgb('#ffb04a'), .5)
    starfield(c, rnd, 40, [rgb('#ffd8c0'), rgb('#ffffff')], 0, 130, 1)
    ledge(c, 140, '#ffc08a', '#7a2c3c', '#12050a', 100, W, 9, '#ff8a3a')
    return c.im

# ------------------------------------------------------------ world 20  COLLISION HALL  (LHC 13.6 TeV: wavelength 9.1e-20 m = 0.54 of the explorer)
@scene(19)
def w20():
    c = C(); rnd = random.Random(1020)
    vgrad(c, 0, 0, W, H, ramp('#02050e', '#050c20', '#0a1632', '#102042'))
    cx, cy = 118, 80
    # detector cross-section: nested rings seen end-on
    layers = [(92, '#c43a4a', '#ffd8dc', 6), (78, '#b88a2a', '#ffe9a8', 8), (60, '#2a8a9a', '#aef2ff', 7), (44, '#3a4a8a', '#b8c8ff', 4), (34, '#1a2a52', '#6a86c8', 2)]
    for (r, col, hi, th) in layers:
        for a in range(0, 360, 2):
            ca, sa = math.cos(math.radians(a)), math.sin(math.radians(a))
            seg = (a // 15) % 2
            for t in range(th):
                rr = r - t
                c.p(cx + ca * rr, cy + sa * rr, rgb(col) if (t > 0 or seg) else rgb(hi))
        ring(c, cx, cy, r + 1, r + 1, rgb(hi), 1)
    glow(c, cx, cy, 60, rgb('#14284a'), .7)
    # tracks from the collision point
    cols = ['#ff5af0', '#5ae8ff', '#ffe05a', '#8dffb4', '#ff9a4a', '#ffffff']
    for i in range(26):
        a = rnd.uniform(0, 2 * math.pi); curv = rnd.uniform(-1.3, 1.3); L = rnd.uniform(26, 78)
        pts = []
        for s in range(0, int(L)):
            ang = a + curv * s / 70
            pts.append((cx + sum(math.cos(a + curv * q / 70) for q in range(s)), cy + sum(math.sin(a + curv * q / 70) for q in range(s))))
        col = rgb(rnd.choice(cols))
        for j in range(1, len(pts)): c.line(pts[j - 1][0], pts[j - 1][1], pts[j][0], pts[j][1], col)
    glow(c, cx, cy, 16, rgb('#ffffff'), 1.0); glow(c, cx, cy, 30, rgb('#8ad0ff'), .6)
    c.circ(cx, cy, 2, rgb('#ffffff'))
    # tiny sparks flying through the hall at the explorer
    for _ in range(26): c.p(rnd.randint(170, 300), rnd.randint(20, 130), rgb('#5ae8ff'))
    # floor: dark metal plate with a cable tray
    c.r(0, 140, W, H, rgb('#04070f')); c.r(0, 140, W, 143, rgb('#9ac8ff')); c.r(0, 143, W, 146, rgb('#2a4a8a'))
    for x in range(-20, W + 60, 28): c.line(x, 146, x - 40, H, rgb('#0e1a36'))
    c.r(0, 153, W, 156, rgb('#1a2a52'))
    for x in range(6, W, 12): c.r(x, 154, x + 3, 155, rgb('#ffd062'))
    return c.im

# ------------------------------------------------------------ world 21  GAMMA SKY  (LHAASO, 100 TeV photon: 1.24e-20 m = 0.73 of the explorer)
@scene(20)
def w21():
    c = C(); rnd = random.Random(1021)
    vgrad(c, 0, 0, W, 112, ramp('#02030c', '#050a22', '#0a1a3c', '#16345c'))
    # the Milky Way, a faint band
    for i in range(120):
        t = i / 119; x = -10 + t * 340; y = 10 + t * 70 + math.sin(t * 6) * 8
        glow(c, x, y, rnd.randint(10, 24), rgb('#3a4a98' if i % 3 else '#6a7ac8'), .25, 1.5)
    starfield(c, rnd, 90, [rgb('#b8c8ff'), rgb('#ffffff'), rgb('#ffe8c0')], 0, 100, 3)
    # distant mountains (a 4,400 m plateau in Tibet), snow-capped
    pts = [(0, 118), (22, 98), (40, 108), (70, 84), (94, 104), (118, 92), (150, 112), (190, 100), (230, 90), (262, 106), (300, 94), (320, 102), (320, 120), (0, 120)]
    c.poly(pts, rgb('#0c1630'))
    for (x, y) in ((70, 84), (230, 90), (118, 92), (300, 94)):
        c.poly([(x, y), (x - 9, y + 12), (x + 9, y + 12)], rgb('#cfe0ff')); c.poly([(x, y), (x + 2, y + 12), (x + 9, y + 12)], rgb('#8aa4d8'))
    c.r(0, 112, W, 140, rgb('#0a1428'))
    # the air shower: one photon makes a cone of light and particles that spreads as it falls
    tip = (268, 8)
    for i in range(60):
        t = i / 59; x = tip[0] - 150 * t; y = tip[1] + 118 * t
        w_ = 2 + 34 * t
        for j in range(int(w_ * 2.4)):
            u = (rnd.random() - .5) * 2 * w_
            if rnd.random() < .6: c.p(x + u * .6, y - u * .35, rgb('#7ad4ff') if rnd.random() < .6 else rgb('#d8f4ff'))
        glow(c, x, y, 6 + 20 * t, rgb('#2a78c8'), .3)
    streak(c, tip[0], tip[1], tip[0] - 150, tip[1] + 118, [rgb('#2a78c8'), rgb('#9ae0ff'), rgb('#ffffff')], 1)
    # the field of detectors on the plain: rows of pale discs in perspective
    for row in range(7):
        t = row / 6; y = 118 + t * 20; s = 2 + t * 3.6
        for col in range(-6, 14):
            x = 14 + col * (22 + t * 14) + (row % 2) * 9
            if 0 < x < W: c.ell(x - s, y - s * .45, x + s, y + s * .45, rgb('#a8c0e8'), rgb('#e8f4ff'), 1)
    ledge(c, 140, '#b8d4ff', '#24408a', '#04081a', 0, W, 9)
    return c.im

# ------------------------------------------------------------ world 22  RECORD LIGHT  (LHAASO 1.4 PeV photon: 8.9e-22 m = 0.52 of the explorer)
@scene(21)
def w22():
    c = C(); rnd = random.Random(1022)
    vgrad(c, 0, 0, W, H, ramp('#06020e', '#14062a', '#2a0c44', '#44125a'))
    # a star-forming region in Cygnus: clouds of pink and violet gas with new blue stars
    blobs(c, rnd, 26, 0, 320, 0, 130, 22, 56, [rgb('#7a2a8a'), rgb('#a03a98'), rgb('#4a1a78'), rgb('#c8508a')], .5, 1.6)
    blobs(c, rnd, 12, 0, 320, 0, 120, 10, 24, [rgb('#ff8ac8'), rgb('#ffb0e0')], .3, 1.4)
    starfield(c, rnd, 90, [rgb('#ffe0f8'), rgb('#ffffff'), rgb('#a8c8ff')], 0, 136, 5)
    for (x, y) in ((58, 36), (112, 64), (252, 30), (284, 96), (30, 100)):
        glow(c, x, y, 12, rgb('#7ab0ff'), .6); c.circ(x, y, 2, rgb('#e8f4ff'))
    # one photon: a golden wave packet racing across, wavelength 0.52 of the explorer (26 px)
    wave_train(c, 6, 118, 312, 98, 26, 13, rgb('#ffb02a'), rgb('#fff0b0'), 2)
    wave_train(c, 6, 118, 312, 98, 26, 13, rgb('#ffe890'), None, 1, phase=.4)
    for t in range(0, 30): glow(c, 6 + 306 * t / 30, 118 - 20 * t / 30, 12, rgb('#ffb02a'), .18)
    glow(c, 160, 108, 30, rgb('#fff0b0'), .6)
    ledge(c, 140, '#ffc0ea', '#6a2a8a', '#0c0418', 80, W, 9, '#ff8ac8')
    return c.im

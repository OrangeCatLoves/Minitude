import math, random, os
from PIL import Image, ImageDraw, ImageFilter

OUT = '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/assets'
os.makedirs(OUT, exist_ok=True)
W, H = 320, 180
FX, FY = 210, 140          # where the player stands in every world
B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def ramp(*hs):
    return [rgb(h) for h in hs]


class C:
    def __init__(s, bg=(0, 0, 0)):
        s.im = Image.new('RGBA', (W, H), tuple(bg) + (255,))
        s.d = ImageDraw.Draw(s.im)

    def p(s, x, y, c):
        x = int(x); y = int(y)
        if 0 <= x < W and 0 <= y < H:
            s.im.putpixel((x, y), tuple(c)[:3] + (255,))

    def r(s, x0, y0, x1, y1, c):
        s.d.rectangle([int(x0), int(y0), int(x1) - 1, int(y1) - 1], fill=tuple(c) + (255,))

    def circ(s, cx, cy, rad, c):
        s.d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=tuple(c) + (255,))

    def ell(s, x0, y0, x1, y1, c, outline=None, width=1):
        s.d.ellipse([x0, y0, x1, y1], fill=(tuple(c) + (255,)) if c else None,
                    outline=(tuple(outline) + (255,)) if outline else None, width=width)

    def line(s, x0, y0, x1, y1, c, w=1):
        s.d.line([x0, y0, x1, y1], fill=tuple(c) + (255,), width=w)

    def poly(s, pts, c, outline=None):
        s.d.polygon(pts, fill=tuple(c) + (255,), outline=(tuple(outline) + (255,)) if outline else None)


def vgrad(c, x0, y0, x1, y1, cols):
    n = len(cols)
    for y in range(y0, y1):
        t = (y - y0) / max(1, (y1 - y0 - 1)) * (n - 1)
        i = min(int(t), n - 2)
        f = t - i
        for x in range(x0, x1):
            c.p(x, y, cols[i + 1] if f > (B4[y % 4][x % 4] + .5) / 16 else cols[i])


def glow(c, cx, cy, rad, col, amt=1.0, ex=1.0):
    for y in range(int(cy - rad), int(cy + rad) + 1):
        for x in range(int(cx - rad * ex), int(cx + rad * ex) + 1):
            d = math.hypot((x - cx) / ex, (y - cy))
            if d < rad and (1 - d / rad) * amt > (B4[y % 4][x % 4] + .5) / 16:
                c.p(x, y, col)


def sphere(c, cx, cy, r, rp, light=(-0.5, -0.6), spec=True):
    n = len(rp)
    lx, ly = light
    lz = math.sqrt(max(0.01, 1 - lx * lx - ly * ly))
    for y in range(int(cy - r), int(cy + r) + 1):
        for x in range(int(cx - r), int(cx + r) + 1):
            dx = (x - cx) / r; dy = (y - cy) / r
            d2 = dx * dx + dy * dy
            if d2 <= 1:
                dz = math.sqrt(1 - d2)
                v = max(0, dx * lx + dy * ly + dz * lz)
                t = v * (n - 1) + (B4[y % 4][x % 4] / 16 - .5) * 0.9
                c.p(x, y, rp[max(0, min(n - 1, int(round(t))))])
    if spec and r >= 5:
        sx = cx + lx * r * 0.5; sy = cy + ly * r * 0.5
        c.r(sx - 1, sy - 1, sx + 1, sy + 1, (255, 255, 255))


def cable(c, x0, y0, x1, y1, rp, vertical=True, twist=6, light=0.35):
    n = len(rp)
    for y in range(max(0, y0), min(H, y1)):
        for x in range(max(0, x0), min(W, x1)):
            if vertical:
                u = (x - x0) / max(1, (x1 - x0 - 1)); diag = (y + 2 * x) // twist
            else:
                u = (y - y0) / max(1, (y1 - y0 - 1)); diag = (x + 2 * y) // twist
            shade = max(0.0, 1 - abs(u - light) * 1.7)
            v = shade * (n - 1) + (0.9 if diag % 2 == 0 else 0) - 0.45
            c.p(x, y, rp[max(0, min(n - 1, int(round(v))))])


def haze(rp, col, t):
    return [mix(a, col, t) for a in rp]


DENIM = ramp('#10224a', '#1d3a78', '#2f5aa8', '#5f8ed8')
RED = ramp('#3a1020', '#6a1f38', '#a8354e', '#e0647a')
CREAM = ramp('#4a4638', '#7a7460', '#b8b094', '#ece2c0')
TEAL = ramp('#0e3038', '#17525e', '#26808a', '#58c0c0')


# ---------------------------------------------------------------- player
def make_player():
    S = Image.new('RGBA', (26, 50), (0, 0, 0, 0))
    d = ImageDraw.Draw(S)

    def R(x0, y0, x1, y1, col):
        d.rectangle([x0 + 1, y0 + 1, x1, y1], fill=tuple(col) + (255,))

    def E(x0, y0, x1, y1, col):
        d.ellipse([x0 + 1, y0 + 1, x1 + 1, y1 + 1], fill=tuple(col) + (255,))

    OUTC = (18, 10, 30)
    SUIT = (255, 122, 69); SL = (255, 170, 110); SD = (196, 78, 48)
    CR = (255, 238, 208); CRD = (214, 190, 160)
    PK = (64, 208, 196); PKD = (30, 128, 140)
    BT = (96, 70, 130); BTD = (60, 42, 92)
    R(2, 18, 8, 34, PKD); R(3, 19, 8, 33, PK); R(4, 23, 7, 29, (214, 255, 250))
    R(9, 34, 14, 45, SD); R(14, 34, 19, 45, SUIT)
    R(8, 44, 15, 48, BTD); R(14, 44, 21, 48, BT)
    R(7, 18, 19, 35, SUIT); R(7, 18, 9, 35, SL); R(17, 18, 19, 35, SD)
    R(7, 30, 19, 32, CR); R(12, 30, 15, 32, (255, 196, 60))
    R(10, 22, 16, 25, CR); R(12, 23, 14, 24, SD)
    R(11, 20, 16, 31, SUIT); R(11, 20, 12, 31, SL); R(15, 20, 16, 31, SD)
    R(11, 30, 16, 34, CR); R(15, 30, 16, 34, CRD)
    R(8, 17, 18, 19, CRD)
    E(5, 1, 20, 16, CRD); E(5, 1, 18, 14, CR)
    R(11, 5, 21, 14, (40, 60, 110)); R(12, 6, 20, 13, (242, 198, 152))
    R(12, 6, 20, 8, (96, 58, 40)); R(18, 9, 19, 11, (30, 20, 34)); R(17, 12, 19, 13, (190, 96, 84))
    for (gx, gy) in [(12, 12), (13, 11), (14, 10)]:
        R(gx, gy, gx + 1, gy + 1, (190, 240, 255))
    a = S.split()[3]
    m = a.filter(ImageFilter.MaxFilter(3))
    px = S.load(); ap = a.load(); mp = m.load()
    for y in range(50):
        for x in range(26):
            if mp[x, y] > 0 and ap[x, y] == 0:
                px[x, y] = OUTC + (255,)
    return S


PLAYER = make_player()


def place_player(img, x=FX, yf=FY, aura=0, spr=None):
    spr = spr or PLAYER
    out = img.copy()
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.paste(spr, (x - 13, yf - 49), spr)
    if aura:
        al = layer.split()[3]
        m1 = al.filter(ImageFilter.MaxFilter(5)); m2 = al.filter(ImageFilter.MaxFilter(9))
        p1 = m1.load(); p2 = m2.load(); p0 = al.load()
        d = ImageDraw.Draw(out)
        for y in range(H):
            for xx in range(W):
                if p0[xx, y] == 0:
                    if p1[xx, y] > 0:
                        d.point((xx, y), fill=(160, 240, 255, 255))
                    elif aura > 1 and p2[xx, y] > 0 and (B4[y % 4][xx % 4] < 8):
                        d.point((xx, y), fill=(90, 200, 255, 255))
    out.alpha_composite(layer)
    return out


# ------------------------------------------------------------- scenes
def room():
    c = C(); rnd = random.Random(1)
    vgrad(c, 0, 0, W, 118, ramp('#171634', '#232050', '#322a68', '#44367c'))
    c.r(0, 0, W, 5, rgb('#0d0c22'))
    for x in range(8, W, 16):
        for y in range(8, 112, 4):
            c.p(x, y, rgb('#4d3f88')); c.p(x + 1, y, rgb('#4d3f88'))
    c.r(0, 112, W, 119, rgb('#1d1738')); c.r(0, 112, W, 113, rgb('#5c4a98'))
    vgrad(c, 0, 119, W, H, ramp('#4a2c3c', '#5e3844', '#7a4a50', '#8c5a58'))
    for i, y in enumerate(range(119, H, 12)):
        c.r(0, y, W, y + 1, rgb('#2e1a2a'))
        for x in range((i * 37) % 64, W, 64):
            c.r(x, y, x + 1, y + 12, rgb('#2e1a2a'))
    # lamp light on wall (drawn before objects)
    glow(c, 42, 86, 46, rgb('#6a4a62'), 0.8)
    glow(c, 42, 86, 28, rgb('#b8805e'), 0.9)
    glow(c, 42, 86, 12, rgb('#ffd890'), 1.0)
    # window
    wx0, wy0, wx1, wy1 = 124, 18, 198, 98
    vgrad(c, wx0, wy0, wx1, wy1, ramp('#0a1030', '#16235a', '#2c3a86', '#5a4c9c'))
    for _ in range(26):
        c.p(rnd.randint(wx0, wx1 - 1), rnd.randint(wy0, wy0 + 40), rgb('#dfe6ff'))
    c.circ(176, 40, 7, rgb('#fff1c2')); c.circ(179, 38, 6, rgb('#1d2c72'))
    for x in range(wx0, wx1, 9):
        h = rnd.randint(14, 38)
        c.r(x, wy1 - h, min(x + 9, wx1), wy1, rgb('#0b0f2a'))
        for wy in range(wy1 - h + 3, wy1 - 3, 5):
            for wxx in (x + 2, x + 5):
                if rnd.random() < 0.38:
                    c.p(wxx, wy, rgb('#ffce64'))
    fr = rgb('#a58468'); fd = rgb('#6e5440')
    c.r(wx0 - 4, wy0 - 4, wx1 + 4, wy0, fr); c.r(wx0 - 4, wy1, wx1 + 4, wy1 + 4, fd)
    c.r(wx0 - 4, wy0, wx0, wy1, fr); c.r(wx1, wy0, wx1 + 4, wy1, fd)
    c.r(160, wy0, 163, wy1, fr); c.r(wx0, 58, wx1, 61, fr)
    c.r(118, 98, 204, 103, rgb('#6b5a8a'))
    # curtains (fabric)
    for x in range(100, 122):
        c.r(x, 12, x + 1, 100, rgb('#8a2f6a') if (x // 3) % 2 == 0 else rgb('#6a2256'))
    for x in range(200, 224):
        c.r(x, 12, x + 1, 100, rgb('#8a2f6a') if (x // 3) % 2 == 0 else rgb('#6a2256'))
    c.r(92, 9, 232, 13, rgb('#d4a64a')); c.r(92, 9, 232, 10, rgb('#f2d27a'))
    # bookshelf
    c.r(240, 24, 314, 119, rgb('#3c2620'))
    for sy in (26, 54, 82, 110):
        c.r(240, sy, 314, sy + 3, rgb('#7a5242'))
    bc = ramp('#c0504a', '#4a7ac0', '#d8b04a', '#4aa070', '#8a5ac0', '#e0e0d0', '#d07a3a')
    for (ya, yb) in ((29, 54), (57, 82), (85, 110)):
        x = 243
        while x < 310:
            wd = rnd.randint(3, 6); h = rnd.randint(14, yb - ya - 2)
            col = bc[rnd.randint(0, len(bc) - 1)]
            c.r(x, yb - h, x + wd, yb, col); c.r(x, yb - h, x + 1, yb, tuple(min(255, v + 40) for v in col))
            x += wd + 1
    # desk
    c.r(10, 98, 106, 104, rgb('#9a6446')); c.r(10, 98, 106, 100, rgb('#c48a62'))
    c.r(12, 104, 17, 138, rgb('#6b4430')); c.r(99, 104, 104, 138, rgb('#6b4430'))
    c.r(24, 104, 52, 126, rgb('#7a4e36')); c.r(26, 106, 50, 124, rgb('#8a5a3e')); c.r(36, 114, 40, 116, rgb('#e8c890'))
    # desk items
    c.r(16, 95, 27, 98, rgb('#2a2236'))
    c.line(21, 95, 30, 76, rgb('#d8c8a0')); c.line(30, 76, 40, 80, rgb('#d8c8a0'))
    c.poly([(36, 72), (50, 79), (45, 88), (32, 81)], rgb('#f2d6a0'), rgb('#a88860'))
    c.circ(42, 84, 2, rgb('#fff4c8'))
    c.r(60, 88, 67, 98, rgb('#f0e6d2')); c.r(65, 88, 67, 98, rgb('#c9bca4')); c.r(60, 88, 67, 89, rgb('#5a3524'))
    c.r(67, 90, 70, 92, rgb('#f0e6d2')); c.r(69, 90, 70, 95, rgb('#f0e6d2')); c.r(67, 94, 70, 95, rgb('#f0e6d2'))
    for (sx, sy) in ((62, 85), (63, 83), (62, 81)):
        c.p(sx, sy, rgb('#9a90b8'))
    c.r(74, 92, 96, 98, rgb('#3f6fb0')); c.r(76, 87, 95, 92, rgb('#b04a4a')); c.r(73, 82, 92, 87, rgb('#4a9a6a'))
    c.r(77, 80, 91, 82, rgb('#ffc83c')); c.r(91, 80, 93, 82, rgb('#f08a96'))
    c.r(98, 90, 105, 98, rgb('#c8664a'))
    for (lx, ly, lw, lh) in ((98, 80, 3, 10), (101, 77, 3, 13), (104, 82, 3, 8)):
        c.r(lx, ly, lx + lw, ly + lh, rgb('#3fa05a'))
    # rug (fabric)
    c.r(126, 128, 306, 172, rgb('#1e5c70')); c.r(129, 131, 303, 169, rgb('#e6d8b8'))
    c.r(131, 133, 301, 167, rgb('#1e5c70'))
    for x in range(131, 301, 8):
        c.r(x, 133, x + 4, 167, rgb('#2a7488'))
    for y in range(128, 172, 3):
        c.p(124, y, rgb('#e6d8b8')); c.p(125, y, rgb('#e6d8b8')); c.p(307, y, rgb('#e6d8b8')); c.p(308, y, rgb('#e6d8b8'))
    return c.im


def desk():
    c = C(); rnd = random.Random(2)
    vgrad(c, 0, 0, W, 112, ramp('#0c0b20', '#191638', '#2b2250', '#45306a'))
    for _ in range(14):
        glow(c, rnd.randint(0, W), rnd.randint(10, 100), rnd.randint(8, 20), rgb('#6a4e82'), 0.5)
    glow(c, 40, 30, 74, rgb('#7a5068'), 0.9); glow(c, 40, 30, 44, rgb('#c08462'), 0.9); glow(c, 40, 30, 20, rgb('#ffd8a0'), 1)
    vgrad(c, 0, 112, W, H, ramp('#7a4a36', '#96603f', '#b07a4c', '#c48d58'))
    c.r(0, 112, W, 114, rgb('#d9a46c')); c.r(0, 114, W, 116, rgb('#5e3626'))
    for _ in range(100):
        y = rnd.randint(118, H - 1); x = rnd.randint(-20, W); l = rnd.randint(12, 70)
        c.r(x, y, x + l, y + 1, rgb('#8c5a3c') if rnd.random() < .5 else rgb('#d0985f'))
    # coffee ring
    c.ell(226, 150, 326, 176, None, outline=rgb('#6e4230'), width=2)
    # giant mug
    mx0, mx1 = 246, 316
    cols = ramp('#fff5e0', '#e8dcc8', '#c8bcae', '#9c92a2', '#6e6688')
    bl = ramp('#6a9af0', '#4a7ad8', '#3a64b8', '#2c4a90', '#1e3468')
    for x in range(mx0, mx1):
        b = min(4, int((x - mx0) / (mx1 - mx0) * 5))
        c.r(x, 0, x + 1, 146, cols[b]); c.r(x, 40, x + 1, 62, bl[b])
    c.r(mx0 - 3, 144, mx1 + 4, 152, rgb('#5a3626')); c.r(mx0, 143, mx1, 146, rgb('#4a4660'))
    # pencil
    for (ya, yb, col) in ((128, 131, '#ffe58a'), (131, 137, '#ffc83c'), (137, 143, '#e09a22'), (143, 146, '#a8681c')):
        c.r(18, ya, 150, yb, rgb(col))
    c.poly([(150, 128), (150, 146), (184, 137)], rgb('#f0c690'))
    c.poly([(150, 128), (150, 133), (184, 137)], rgb('#fbe2bc'))
    c.poly([(174, 134), (174, 140), (186, 137)], rgb('#3a3a46'))
    c.r(0, 128, 8, 146, rgb('#f08a96')); c.r(8, 128, 20, 146, rgb('#b4bccc'))
    for x in (10, 14, 18):
        c.r(x, 128, x + 1, 146, rgb('#7a8298'))
    c.r(0, 146, 186, 150, rgb('#5e3626'))
    # paperclip
    c.d.rounded_rectangle([30, 160, 114, 175], radius=6, outline=rgb('#5e3626') + (255,), width=2)
    c.d.rounded_rectangle([28, 158, 112, 173], radius=6, outline=rgb('#d8e0f0') + (255,), width=2)
    c.d.rounded_rectangle([46, 161, 130, 172], radius=5, outline=rgb('#aab4cc') + (255,), width=2)
    # crumbs + dust
    for _ in range(12):
        x = rnd.randint(8, 190); y = rnd.randint(154, 176)
        w = rnd.randint(2, 5); h = rnd.randint(2, 4)
        c.r(x, y, x + w, y + h, rgb('#5a3022')); c.r(x, y, x + w, y + 1, rgb('#a0663e'))
    for _ in range(36):
        c.p(rnd.randint(0, W - 1), rnd.randint(0, 120), rgb('#e8d8f8'))
    return c.im


def thread():
    c = C(); rnd = random.Random(3)
    vgrad(c, 0, 0, W, H, ramp('#07102a', '#0e1e44', '#17315e', '#234c78'))
    for k in range(4):
        x0 = rnd.randint(-20, W)
        for y in range(0, 140):
            for x in range(x0 + y // 2, x0 + y // 2 + 14):
                if B4[y % 4][x % 4] < 3:
                    c.p(x, y, rgb('#33648f'))
    hz = rgb('#17315e')
    far = [(2, 22, DENIM), (60, 14, TEAL), (96, 20, DENIM), (140, 12, CREAM), (262, 16, RED), (292, 24, DENIM)]
    for x0, wd, rp in far:
        cable(c, x0, 0, x0 + wd, 142, haze(rp, hz, 0.55), True, 7)
    near = [(-8, 40, DENIM), (34, 26, RED), (250, 38, CREAM), (284, 44, DENIM)]
    for x0, wd, rp in near:
        cable(c, x0, 0, x0 + wd, 142, haze(rp, hz, 0.15), True, 6)
    for x0, wd, rp in near + far:
        for _ in range(wd // 2):
            y = rnd.randint(4, 138); side = rnd.random() < .5
            x = x0 if side else x0 + wd
            for k in range(rnd.randint(3, 8)):
                c.p(x + (-k if side else k), y + int(math.sin(k * .9) * 1.4), rgb('#8aa8d8'))
    # foreground rope
    cable(c, 0, 140, W, 178, DENIM, False, 7, 0.12)
    c.r(0, 178, W, H, rgb('#050a1c'))
    for x in range(0, W, 2):
        if rnd.random() < .55:
            h = rnd.randint(2, 7); sway = rnd.choice((-1, 1))
            for k in range(h):
                c.p(x + int(sway * k * .3), 139 - k, rgb('#9ab8e8'))
    for _ in range(10):
        sphere(c, rnd.randint(8, W - 8), rnd.randint(14, 120), rnd.randint(3, 7), ramp('#6a5a30', '#b09040', '#e8d070', '#fff4b0'))
    for _ in range(40):
        c.p(rnd.randint(0, W - 1), rnd.randint(0, 138), rgb('#bcd8f8'))
    return c.im


def droplet():
    c = C(); rnd = random.Random(4)
    vgrad(c, 0, 0, W, H, ramp('#04141c', '#0a2a38', '#124456', '#1c6070'))
    for k in range(3):
        x0 = rnd.randint(0, W)
        for y in range(0, 140):
            for x in range(x0 + y // 3, x0 + y // 3 + 10):
                if B4[y % 4][x % 4] < 2:
                    c.p(x, y, rgb('#2a7a90'))
    cable(c, 0, 140, W, 178, ramp('#0e2c3a', '#1a5266', '#2a8294', '#5ac0c8'), False, 7, 0.12)
    c.r(0, 178, W, H, rgb('#03101a'))
    cx, cy, R = 104, 140, 96
    for y in range(cy - R, cy):
        for x in range(cx - R, cx + R + 1):
            d = math.hypot(x - cx, y - cy) / R
            if d <= 1:
                f = (y - (cy - R)) / R
                inner = mix(rgb('#0c4a5c'), rgb('#2a9ab0'), f ** 1.4)
                col = inner
                if d > .93:
                    col = rgb('#b8f4f8') if B4[y % 4][x % 4] < 9 else rgb('#7adce8')
                elif d > .84:
                    col = rgb('#4ab8c8') if B4[y % 4][x % 4] < 11 else inner
                c.p(x, y, col)
    for a in range(200, 262, 1):
        rr = R * .88
        c.p(cx + math.cos(math.radians(a)) * rr, cy + math.sin(math.radians(a)) * rr, (255, 255, 255))
        c.p(cx + math.cos(math.radians(a)) * (rr - 1), cy + math.sin(math.radians(a)) * (rr - 1), (220, 255, 255))
    glow(c, cx, cy - 6, 34, rgb('#8ae8f0'), .9, 1.8); glow(c, cx, cy - 4, 16, rgb('#e8ffff'), 1, 1.8)
    c.r(cx - R + 2, 138, cx + R - 1, 141, rgb('#8ae8f0'))
    G = ramp('#0a3a1a', '#1a7a34', '#3ac060', '#a8f0a0')
    for (gx, gy) in ((56, 96), (66, 92), (62, 104), (74, 102), (50, 108), (70, 114)):
        sphere(c, gx, gy, 6, G)
    # ciliate
    cx2, cy2 = 128, 78
    c.ell(cx2 - 20, cy2 - 8, cx2 + 20, cy2 + 8, rgb('#d8a860'), outline=rgb('#7a5030'))
    c.ell(cx2 - 18, cy2 - 6, cx2 + 4, cy2 + 2, rgb('#f0cc88'))
    c.circ(cx2 + 8, cy2 + 1, 3, rgb('#e86a30')); c.circ(cx2 - 8, cy2 - 1, 2, rgb('#7a3a20'))
    for a in range(0, 360, 14):
        x0 = cx2 + math.cos(math.radians(a)) * 21; y0 = cy2 + math.sin(math.radians(a)) * 9
        c.line(x0, y0, x0 + math.cos(math.radians(a)) * 4, y0 + math.sin(math.radians(a)) * 4, rgb('#f0d8a0'))
    for _ in range(10):
        bx = rnd.randint(30, 170); by = rnd.randint(50, 130)
        if math.hypot(bx - cx, by - cy) < R - 14:
            c.ell(bx, by, bx + 8, by + 3, rgb('#b8f060'), outline=rgb('#3a7a20'))
    c.poly([(150, 112), (164, 106), (160, 120)], rgb('#e8c060'), rgb('#8a6a20'))
    c.poly([(86, 62), (96, 56), (98, 68)], rgb('#e8c060'), rgb('#8a6a20'))
    for _ in range(12):
        bx = rnd.randint(30, 175); by = rnd.randint(52, 130)
        if math.hypot(bx - cx, by - cy) < R - 12:
            c.ell(bx, by, bx + 4, by + 4, None, outline=rgb('#e8ffff'))
    for _ in range(30):
        c.p(rnd.randint(0, W - 1), rnd.randint(0, 138), rgb('#a8e8f0'))
    return c.im


def germ():
    c = C(); rnd = random.Random(5)
    vgrad(c, 0, 0, W, H, ramp('#0b0a2a', '#1a1048', '#2c1a5e', '#3e2a6e'))
    for _ in range(50):
        c.p(rnd.randint(0, W - 1), rnd.randint(0, H - 1), rgb('#9a78d8'))
    # background rod
    c.d.line([10, 100, 110, 30], fill=rgb('#243a78') + (255,), width=30)
    c.circ(10, 100, 15, rgb('#243a78')); c.circ(110, 30, 15, rgb('#243a78'))
    c.d.line([10, 96, 110, 26], fill=rgb('#34509a') + (255,), width=8)
    for _ in range(18):
        x = rnd.randint(10, 105); y = int(100 - (x - 10) * 0.7) + rnd.randint(-8, 8)
        c.p(x, y, rgb('#5a78c8'))
    # phage
    hx, hy = 58, 40
    c.poly([(hx - 10, hy - 6), (hx, hy - 14), (hx + 10, hy - 6), (hx + 10, hy + 6), (hx, hy + 14), (hx - 10, hy + 6)], rgb('#e060a8'), rgb('#7a2058'))
    c.poly([(hx - 10, hy - 6), (hx, hy - 14), (hx, hy), (hx - 10, hy + 6)], rgb('#f898d0'))
    c.line(hx, hy - 14, hx, hy, rgb('#7a2058')); c.line(hx - 10, hy - 6, hx, hy, rgb('#a0407a')); c.line(hx + 10, hy - 6, hx, hy, rgb('#a0407a'))
    c.r(hx - 4, hy + 14, hx + 4, hy + 18, rgb('#b04888'))
    c.r(hx - 3, hy + 18, hx + 3, hy + 40, rgb('#d070a8'))
    for yy in range(hy + 19, hy + 40, 3):
        c.r(hx - 3, yy, hx + 3, yy + 1, rgb('#8a3a70'))
    c.poly([(hx - 7, hy + 40), (hx + 7, hy + 40), (hx + 5, hy + 45), (hx - 5, hy + 45)], rgb('#e060a8'))
    for dx in (-14, -8, 8, 14):
        c.line(hx + (3 if dx > 0 else -3), hy + 44, hx + dx * 1.6, hy + 62, rgb('#e890c8'))
    # small virus
    sphere(c, 150, 34, 9, ramp('#4a1a50', '#8a2a88', '#d050b8', '#ffb0e8'))
    for a in range(0, 360, 30):
        x0 = 150 + math.cos(math.radians(a)) * 9; y0 = 34 + math.sin(math.radians(a)) * 9
        c.line(x0, y0, x0 + math.cos(math.radians(a)) * 5, y0 + math.sin(math.radians(a)) * 5, rgb('#ffb0e8'))
        c.p(x0 + math.cos(math.radians(a)) * 6, y0 + math.sin(math.radians(a)) * 6, (255, 255, 255))
    # foreground rod
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).rounded_rectangle([110, 140, 340, 240], radius=48, fill=255)
    mp = m.load()
    rp = ramp('#0e4a48', '#17766a', '#2aa488', '#5cd8b0', '#9cf4d4')
    for y in range(H):
        for x in range(W):
            if mp[x, y]:
                t = 1 - min(1, (y - 140) / 40)
                v = t * (len(rp) - 1) + (B4[y % 4][x % 4] / 16 - .5) * 0.9
                c.p(x, y, rp[max(0, min(len(rp) - 1, int(round(v))))])
    for x in range(100, 345):
        for y in range(136, 160):
            if y < H and 0 <= x < W and mp[x, y] and (y == 140 or (y == 141 and x % 2 == 0)):
                c.p(x, y, rgb('#d8fff0'))
    for _ in range(26):
        x = rnd.randint(130, 319); y = rnd.randint(148, 178)
        if mp[min(x, W - 1), y]:
            c.circ(x, y, rnd.randint(1, 2), rgb('#0c3c3a'))
    for x in range(120, 320, 6):
        if mp[min(x, W - 1), 141]:
            h = rnd.randint(5, 12)
            for k in range(h):
                c.p(x + int(math.sin(k * .6) * 1.5), 139 - k, rgb('#b8f4e0'))
    pts = []
    for t in range(0, 100):
        x = 112 - t * 1.1; y = 190 - t * 0.4 + math.sin(t * .35) * 6
        pts.append((x, y))
    for (x, y) in pts:
        c.p(x, y, rgb('#d8fff0')); c.p(x, y + 1, rgb('#5cd8b0'))
    return c.im


def lattice():
    c = C(); rnd = random.Random(6)
    vgrad(c, 0, 0, W, H, ramp('#02030c', '#07102a', '#0c1e4a', '#12306a'))
    for k in range(-6, 14):
        c.line(160, 64, 160 + k * 60, H, rgb('#0f2a5a'))
    BLUE = ramp('#0a2a58', '#1a5aa0', '#3a9ad8', '#9ae0ff')
    AMB = ramp('#4a1a10', '#a03a18', '#e8782c', '#ffd078')
    scales = [0.16, 0.22, 0.3, 0.4, 0.55, 0.75, 1.0]
    rows = []
    for ri, s in enumerate(scales):
        y = 64 + 112 * s; r = 34 * s; sp = 78 * s
        atoms = []
        i0 = -int(260 / sp) - 2
        for i in range(i0, int(380 / sp) + 2):
            x = 210 + (i + 0.5 * (ri % 2)) * sp
            if -r < x < W + r:
                atoms.append((x, y, r, (i + ri) % 2))
        rows.append(atoms)
    for ri, atoms in enumerate(rows):
        for (x, y, r, k) in atoms:
            for (x2, y2, r2, k2) in atoms:
                if 0 < x2 - x < 90 * r / 34 * 1.2:
                    c.line(x, y, x2, y2, rgb('#2a5ab0'), 1 if r < 10 else 2)
            if ri + 1 < len(rows):
                near = sorted(rows[ri + 1], key=lambda a: abs(a[0] - x))[:2]
                for (x2, y2, r2, k2) in near:
                    c.line(x, y, x2, y2, rgb('#1e4488'), 1)
        for (x, y, r, k) in atoms:
            glow(c, x, y, r * 1.5, rgb('#12306a') if k == 0 else rgb('#4a2418'), .7)
            sphere(c, x, y, max(2, r), BLUE if k == 0 else AMB)
    glow(c, 210, 170, 64, rgb('#1a4a88'), .5)
    sphere(c, 210, 176, 36, BLUE)
    return c.im


def proton():
    c = C(); rnd = random.Random(7)
    vgrad(c, 0, 0, W, H, ramp('#0a0418', '#1a0a34', '#2c1050', '#3a1a60'))
    for _ in range(14):
        glow(c, rnd.randint(0, W), rnd.randint(0, H), rnd.randint(18, 50), rnd.choice([rgb('#5a1a70'), rgb('#1a3a78'), rgb('#701a50')]), .5)
    Q = [(70, 64, 26, ramp('#400a14', '#901a2a', '#e03a4a', '#ff9aa0')),
         (262, 54, 22, ramp('#0a1a50', '#1a3aa8', '#3a7aff', '#a8c8ff')),
         (210, 178, 38, ramp('#0a3a1a', '#1a8a3a', '#3ae07a', '#b0ffc8'))]
    pairs = [(0, 1), (0, 2), (1, 2)]
    for (a, b) in pairs:
        x0, y0 = Q[a][0], Q[a][1]; x1, y1 = Q[b][0], Q[b][1]
        L = math.hypot(x1 - x0, y1 - y0); nx = -(y1 - y0) / L; ny = (x1 - x0) / L
        prev = None
        for i in range(0, 121):
            t = i / 120; amp = 5 * math.sin(t * math.pi)
            x = x0 + (x1 - x0) * t + nx * math.sin(t * math.pi * 14) * amp
            y = y0 + (y1 - y0) * t + ny * math.sin(t * math.pi * 14) * amp
            if prev:
                col = rgb('#ffe070') if (i // 6) % 2 == 0 else rgb('#ff78d8')
                c.line(prev[0], prev[1], x, y, col, 2)
            prev = (x, y)
    for (x, y, r, rp) in Q:
        glow(c, x, y, r * 1.9, tuple(int(v * .5) for v in rp[1]), .8)
        sphere(c, x, y, r, rp)
    for _ in range(50):
        c.p(rnd.randint(0, W - 1), rnd.randint(0, H - 1), rgb('#d8b8ff'))
    return c.im


def unknown():
    c = C(); rnd = random.Random(8)
    vgrad(c, 0, 0, W, H, ramp('#06020e', '#10062a', '#1c0e44', '#2a1860'))
    pal = [rgb('#ffd062'), rgb('#5be0ff'), rgb('#ff6fb5'), rgb('#9a7aff')]
    fills = [rgb('#0c0624'), rgb('#160a38')]
    for k in range(13, -1, -1):
        s = 5 * (1.3 ** k); ang = k * 0.2
        pts = [(160 + math.cos(ang + i * math.pi / 2 + math.pi / 4) * s, 66 + math.sin(ang + i * math.pi / 2 + math.pi / 4) * s) for i in range(4)]
        c.poly(pts, fills[k % 2], pal[k % 4])
    for _ in range(70):
        c.p(rnd.randint(0, W - 1), rnd.randint(0, 138), rgb('#ffffff') if rnd.random() < .5 else rgb('#a8c8ff'))
    for _ in range(9):
        x = rnd.randint(10, W - 10); y = rnd.randint(10, 110); s = rnd.randint(3, 8)
        col = rnd.choice(pal)
        c.poly([(x, y - s), (x + s, y + s), (x - s, y + s)], tuple(v // 2 for v in col), col)
    for (x, y) in ((40, 30), (280, 90), (90, 100), (300, 20)):
        c.line(x - 4, y, x + 4, y, rgb('#ffffff')); c.line(x, y - 4, x, y + 4, rgb('#ffffff'))
    glow(c, 215, 176, 70, rgb('#3a2a90'), .7, 1.6)
    c.r(140, 140, 292, 148, rgb('#7a68c8')); c.r(140, 140, 292, 142, rgb('#b8a8ff'))
    vgrad(c, 140, 148, 292, 174, ramp('#3a2e80', '#2c2266', '#201850'))
    for x in range(150, 285, 12):
        c.r(x, 144, x + 3, 146, rgb('#5be0ff'))
    return c.im


def planck():
    c = C(); rnd = random.Random(9)
    vgrad(c, 0, 0, W, H, ramp('#020208', '#0a0a28', '#1c1858', '#3a2a88'))
    glow(c, 160, 90, 110, rgb('#2a2a78'), .9, 1.4); glow(c, 160, 90, 70, rgb('#6a58c8'), .9, 1.4)
    glow(c, 160, 90, 36, rgb('#c8b8ff'), 1, 1.4); glow(c, 160, 90, 16, rgb('#ffffff'), 1, 1.4)
    cols = [rgb('#5be0ff'), rgb('#ff9ad8'), rgb('#ffffff'), rgb('#ffd062')]
    for _ in range(70):
        r = rnd.choice([4, 5, 6, 8, 10, 14, 20])
        x = rnd.randint(0, W); y = rnd.randint(0, 130)
        col = rnd.choice(cols)
        c.ell(x - r, y - r, x + r, y + r, None, outline=col)
        if r > 6 and rnd.random() < .5:
            c.ell(x - r + 3, y - r + 3, x + r - 3, y + r - 3, None, outline=tuple(v // 2 for v in col))
    c.r(0, 140, W, H, rgb('#06061c'))
    for k in range(-10, 11):
        c.line(160 + k * 6, 112, 160 + k * 48, H, rgb('#5be0ff') if k % 2 == 0 else rgb('#2a78b0'))
    y = 140; st = 3
    while y < H:
        c.r(0, y, W, y + 1, rgb('#5be0ff')); y += st; st += 3
    c.r(0, 140, W, 142, rgb('#c8f4ff'))
    for _ in range(40):
        c.p(rnd.randint(0, W - 1), rnd.randint(0, 138), rgb('#ffffff'))
    return c.im


SCENES = [room, desk, thread, droplet, germ, lattice, proton, unknown, planck]


# ---------------------------------------------------------- transitions
def zoom(img, z, fx=FX, fy=FY):
    w = int(W / z); h = int(H / z)
    x0 = int(fx - fx / z); y0 = int(fy - fy / z)
    return img.crop((x0, y0, x0 + w, y0 + h)).resize((W, H), Image.NEAREST)


def speedlines(img, n=60, rmin=48, col=(210, 244, 255), seed=1, cx=FX, cy=FY - 24):
    rnd = random.Random(seed); d = ImageDraw.Draw(img)
    for _ in range(n):
        a = rnd.uniform(0, 2 * math.pi); r0 = rnd.uniform(rmin, rmin + 100); r1 = r0 + rnd.uniform(24, 90)
        d.line([cx + math.cos(a) * r0, cy + math.sin(a) * r0 * .8, cx + math.cos(a) * r1, cy + math.sin(a) * r1 * .8], fill=col + (255,))
    return img


def iris(base, over, r, cx=FX, cy=FY - 24):
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    out = base.copy(); out.paste(over, (0, 0), m)
    d = ImageDraw.Draw(out)
    d.ellipse([cx - r - 2, cy - r - 2, cx + r + 2, cy + r + 2], outline=(120, 230, 255, 255), width=2)
    d.ellipse([cx - r - 4, cy - r - 4, cx + r + 4, cy + r + 4], outline=(255, 255, 255, 255), width=1)
    return out


def save(img, name, scale=1):
    img.save(os.path.join(OUT, name))


# ---------------------------------------------------------------- gems
def fan_gem(pts, ctr, rp, outline=(18, 10, 30), inner=0.55):
    im = Image.new('RGBA', (32, 32), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    n = len(pts)

    def idx(a, b, off=0):
        mx = (a[0] + b[0]) / 2 - ctr[0]; my = (a[1] + b[1]) / 2 - ctr[1]
        ang = math.atan2(my, mx)
        diff = abs(((ang - math.radians(-135) + math.pi) % (2 * math.pi)) - math.pi)
        t = 1 - diff / math.pi
        return max(0, min(len(rp) - 1, int(round(t * (len(rp) - 1))) + off))
    for i in range(n):
        a = pts[i]; b = pts[(i + 1) % n]
        d.polygon([a, b, ctr], fill=rp[idx(a, b)] + (255,))
    ip = [(ctr[0] + (p[0] - ctr[0]) * inner, ctr[1] + (p[1] - ctr[1]) * inner) for p in pts]
    for i in range(n):
        a = ip[i]; b = ip[(i + 1) % n]
        d.polygon([a, b, ctr], fill=rp[idx(a, b, 1)] + (255,))
    d.polygon(pts, outline=outline + (255,))
    return im


def polar(n, rx, ry, cx=16, cy=16, rot=0.0, jit=None):
    out = []
    for i in range(n):
        a = rot + i * 2 * math.pi / n
        j = jit[i % len(jit)] if jit else 1
        out.append((cx + math.cos(a) * rx * j, cy + math.sin(a) * ry * j))
    return out


def make_gems():
    gems = []
    gems.append(fan_gem(polar(9, 12, 9, 16, 18, 0.3, [1, .9, 1, .86, 1, .95, .9, 1, .88]), (15, 17), ramp('#323a50', '#525c78', '#8892ae', '#bcc4da')))
    gems.append(fan_gem(polar(6, 12, 13, 16, 16, math.radians(-90)), (16, 16), ramp('#0e4a26', '#1e8a46', '#46d078', '#b0ffc8')))
    gems.append(fan_gem([(9, 6), (23, 6), (29, 13), (16, 28), (3, 13)], (16, 13), ramp('#0c2a6a', '#1a58c0', '#48a0ff', '#c0e4ff')))
    g = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    rp = ramp('#3a1a70', '#6a38b8', '#a878f0', '#e4ccff')
    g.alpha_composite(fan_gem([(23, 11), (28, 15), (28, 25), (23, 30), (19, 25), (19, 15)], (23, 20), rp))
    g.alpha_composite(fan_gem([(8, 8), (13, 12), (13, 24), (8, 29), (3, 24), (3, 12)], (8, 19), rp))
    g.alpha_composite(fan_gem([(15, 1), (22, 7), (22, 24), (15, 31), (8, 24), (8, 7)], (15, 16), rp))
    gems.append(g)
    star = []
    for i in range(16):
        a = math.radians(-90) + i * math.pi / 8; rr = 15 if i % 2 == 0 else 8
        star.append((16 + math.cos(a) * rr, 16 + math.sin(a) * rr))
    gems.append(fan_gem(star, (16, 16), ramp('#8a3a00', '#d87a10', '#ffb83a', '#fff0a0'), inner=0.5))
    sp = []
    for i in range(8):
        a = math.radians(-90) + i * math.pi / 4; rr = 15 if i % 2 == 0 else 5
        sp.append((16 + math.cos(a) * rr, 16 + math.sin(a) * rr))
    m = fan_gem(sp, (16, 16), ramp('#8a0a5a', '#d82a98', '#ff6ac8', '#ffe0f4'), inner=0.45)
    d = ImageDraw.Draw(m)
    for (x, y) in ((3, 4), (28, 6), (4, 27), (28, 28)):
        d.rectangle([x, y, x + 1, y + 1], fill=(255, 255, 255, 255))
    d.rectangle([15, 15, 16, 16], fill=(255, 255, 255, 255))
    gems.append(m)
    return gems


if __name__ == '__main__':
    scenes = [f() for f in SCENES]
    # worlds with the player standing in them
    for i, s in enumerate(scenes):
        save(place_player(s), 's%d.png' % i)
    room_, desk_, thr_ = scenes[0], scenes[1], scenes[2]
    f1 = place_player(room_, aura=1)
    f2 = place_player(speedlines(zoom(room_, 2), 50, seed=2), aura=2)
    f3 = place_player(speedlines(iris(zoom(room_, 4), desk_, 34), 46, seed=3), aura=2)
    f4 = place_player(speedlines(iris(zoom(desk_, 2), thr_, 46), 40, seed=4), aura=2)
    f5 = place_player(speedlines(zoom(thr_, 2), 18, seed=5, rmin=70), aura=1)
    f6 = place_player(thr_)
    for i, f in enumerate([f1, f2, f3, f4, f5, f6], 1):
        save(f, 'f%d.png' % i)
    save(place_player(speedlines(room_.copy(), 44, seed=7, rmin=60), aura=2), 'reveal.png')
    for i, g in enumerate(make_gems(), 1):
        save(g, 'gem%d.png' % i)
    save(PLAYER, 'player.png')
    heights = [50, 34, 22, 14, 9]
    row = Image.new('RGBA', (96, 50), (0, 0, 0, 0)); x = 0
    for h in heights:
        w = max(1, round(26 * h / 50)); sp = PLAYER.resize((w, h), Image.NEAREST)
        row.paste(sp, (x, 50 - h), sp); x += w + 6
    save(row, 'shrinkrow.png')
    # contact sheet for checking
    sheet = Image.new('RGBA', (W * 3, H * 3), (0, 0, 0, 255))
    for i in range(9):
        sheet.paste(Image.open(os.path.join(OUT, 's%d.png' % i)), ((i % 3) * W, (i // 3) * H))
    sheet.save(os.path.join(OUT, '_sheet_worlds.png'))
    sheet2 = Image.new('RGBA', (W * 3, H * 2), (0, 0, 0, 255))
    for i in range(6):
        sheet2.paste(Image.open(os.path.join(OUT, 'f%d.png' % (i + 1))), ((i % 3) * W, (i // 3) * H))
    sheet2.save(os.path.join(OUT, '_sheet_frames.png'))
    sheet3 = Image.new('RGBA', (32 * 6 * 3 + 200, 150), (24, 30, 52, 255))
    for i in range(6):
        g = Image.open(os.path.join(OUT, 'gem%d.png' % (i + 1))).resize((96, 96), Image.NEAREST)
        sheet3.paste(g, (10 + i * 104, 10), g)
    p = PLAYER.resize((52, 100), Image.NEAREST); sheet3.paste(p, (650, 10), p)
    sheet3.paste(row.resize((192, 100), Image.NEAREST), (720, 10), row.resize((192, 100), Image.NEAREST))
    sheet3.save(os.path.join(OUT, '_sheet_icons.png'))
    print('ok')

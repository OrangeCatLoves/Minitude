import os, math, random, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw, ImageFilter
import art
from art import rgb, mix, ramp, B4, W, H, FX, FY, PLAYER, place_player, C, glow, vgrad, OUT, save

INK = (18, 10, 30)
AMB = (255, 200, 87)


def new(w=32, h=32):
    return Image.new('RGBA', (w, h), (0, 0, 0, 0))


def outline(im, col=INK):
    a = im.split()[3]
    m = a.filter(ImageFilter.MaxFilter(3))
    px = im.load(); ap = a.load(); mp = m.load()
    for y in range(im.height):
        for x in range(im.width):
            if mp[x, y] > 0 and ap[x, y] == 0:
                px[x, y] = col + (255,)
    return im


def P(im, x, y, c):
    if 0 <= x < im.width and 0 <= y < im.height:
        im.putpixel((int(x), int(y)), tuple(c)[:3] + (255,))


def R(im, x0, y0, x1, y1, c):
    ImageDraw.Draw(im).rectangle([x0, y0, x1, y1], fill=tuple(c) + (255,))


def ball(im, cx, cy, r, rp, light=(-0.5, -0.6), spec=True):
    n = len(rp); lx, ly = light
    lz = math.sqrt(max(0.01, 1 - lx * lx - ly * ly))
    for y in range(int(cy - r) - 1, int(cy + r) + 2):
        for x in range(int(cx - r) - 1, int(cx + r) + 2):
            if 0 <= x < im.width and 0 <= y < im.height:
                dx = (x + .5 - cx) / r; dy = (y + .5 - cy) / r; d2 = dx * dx + dy * dy
                if d2 <= 1:
                    dz = math.sqrt(1 - d2)
                    v = max(0, dx * lx + dy * ly + dz * lz)
                    t = v * (n - 1) + (B4[y % 4][x % 4] / 16 - .5) * .9
                    im.putpixel((x, y), rp[max(0, min(n - 1, int(round(t))))] + (255,))
    if spec and r >= 4:
        sx = int(cx + lx * r * .5); sy = int(cy + ly * r * .5)
        R(im, sx - 1, sy - 1, sx, sy, (255, 255, 255))


GLY = {
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '?': ['.###.', '#...#', '...#.', '..#..', '..#..', '.....', '..#..'],
}


def glyph(im, ch, x, y, c):
    for j, row in enumerate(GLY[ch]):
        for i, v in enumerate(row):
            if v == '#':
                P(im, x + i, y + j, c)


# ------------------------------------------------------------ avatars
def recolor(spr, pairs):
    out = spr.copy(); px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            p = px[x, y]
            if p[3] and p[:3] in pairs:
                px[x, y] = pairs[p[:3]] + (255,)
    return out


SUIT = {'o': ((255, 122, 69), (255, 170, 110), (196, 78, 48))}
AV = [
    None,
    ((74, 144, 255), (140, 190, 255), (40, 92, 200)),
    ((70, 200, 110), (130, 240, 160), (36, 140, 70)),
    ((170, 110, 255), (210, 160, 255), (110, 66, 190)),
    ((255, 100, 170), (255, 160, 210), (190, 56, 120)),
]


def avatars():
    out = []
    for a in AV:
        if a is None:
            out.append(PLAYER.copy()); continue
        o = SUIT['o']
        out.append(recolor(PLAYER, {o[0]: a[0], o[1]: a[1], o[2]: a[2]}))
    return out


# ------------------------------------------------------------ icons 32x32
def ic_height():
    im = new(); d = ImageDraw.Draw(im)
    R(im, 2, 2, 8, 29, AMB)
    for i, y in enumerate(range(4, 29, 3)):
        d.line([2, y, 2 + (5 if i % 2 == 0 else 3), y], fill=INK + (255,))
    cr = (236, 226, 192); crd = (190, 176, 140)
    R(im, 15, 2, 19, 6, cr); R(im, 14, 7, 20, 17, cr); R(im, 20, 7, 20, 17, crd)
    R(im, 14, 18, 16, 29, cr); R(im, 18, 18, 20, 29, crd)
    sx = (255, 122, 69)
    R(im, 24, 16, 26, 18, (242, 198, 152)); R(im, 23, 19, 27, 24, sx); R(im, 23, 25, 24, 29, (196, 78, 48)); R(im, 26, 25, 27, 29, sx)
    return outline(im)


def ic_dime():
    im = new()
    ball(im, 16, 16, 12, ramp('#4a5068', '#7a8298', '#b0b8cc', '#e8ecf8'), spec=False)
    for k in range(40):
        a = k * 2 * math.pi / 40
        if k % 2 == 0:
            P(im, 16 + math.cos(a) * 11.4, 16 + math.sin(a) * 11.4, (90, 98, 120))
    glyph(im, '1', 11, 12, (60, 66, 88)); glyph(im, '0', 16, 12, (60, 66, 88))
    return outline(im)


def ic_gromia():
    im = new()
    for x in range(1, 14):
        if x % 2 == 0:
            P(im, x, 20, (200, 170, 110)); P(im, x, 24, (200, 170, 110))
        P(im, x, 22, (150, 120, 80))
    ball(im, 21, 15, 9, ramp('#5a4630', '#8c7048', '#c4a468', '#f0dca0'))
    rnd = random.Random(4)
    for _ in range(14):
        x = 21 + rnd.randint(-6, 6); y = 15 + rnd.randint(-6, 6)
        if math.hypot(x - 21, y - 15) < 7.5:
            P(im, x, y, (110, 84, 52))
    return outline(im)


def ic_egg():
    im = new()
    ImageDraw.Draw(im).ellipse([2, 2, 29, 29], outline=(246, 196, 214, 255), width=1)
    ball(im, 16, 16, 11, ramp('#7a4a5a', '#b8788a', '#e8b0b8', '#fff0e8'), spec=False)
    ball(im, 14, 17, 3.5, ramp('#5a2a4a', '#8a4a72', '#c07aa0', '#e8b0d0'), spec=False)
    R(im, 9, 9, 11, 10, (255, 255, 255))
    return outline(im)


def ic_drop():
    im = new()
    R(im, 15, 3, 16, 4, (86, 190, 255))
    blue = ramp('#0c2a6a', '#1a58c0', '#48a0ff', '#c0e4ff')
    for y in range(4, 18):
        hw = (y - 3) * 0.62
        for x in range(int(16 - hw), int(16 + hw) + 1):
            t = 1.4 - (x - 10) / 12 + (B4[y % 4][x % 4] / 16 - .5) * .9
            P(im, x, y, blue[max(0, min(3, int(round(t))))])
    ball(im, 16, 19, 9, blue)
    R(im, 11, 15, 12, 20, (230, 244, 255))
    # tiny cloud
    for (x0, y0, x1, y1) in ((20, 4, 29, 6), (22, 2, 26, 4), (18, 5, 20, 6)):
        R(im, x0, y0, x1, y1, (232, 238, 255))
    return outline(im)


def ic_scope():
    im = new(); d = ImageDraw.Draw(im)
    st = ramp('#2c3a58', '#4a5f8c', '#7a92c4', '#b8cbf0')
    d.polygon([(9, 3), (14, 2), (21, 15), (16, 17)], fill=st[2] + (255,))
    d.polygon([(9, 3), (11, 3), (18, 16), (16, 17)], fill=st[3] + (255,))
    R(im, 7, 1, 13, 3, st[0])
    R(im, 15, 16, 19, 19, st[1])
    R(im, 7, 22, 20, 23, st[1])
    R(im, 22, 7, 25, 25, st[2]); R(im, 22, 7, 22, 25, st[3])
    R(im, 18, 6, 24, 8, st[2])
    R(im, 3, 26, 28, 29, st[1]); R(im, 3, 26, 28, 26, st[2])
    R(im, 10, 24, 10, 25, (255, 230, 120)); R(im, 9, 19, 12, 21, (150, 220, 255))
    return outline(im)


def ic_dna():
    im = new()
    for y in range(2, 30):
        s = math.sin(y * 0.55)
        x1 = 16 + 9 * s; x2 = 16 - 9 * s
        if y % 3 == 0 and abs(x1 - x2) > 6:
            ImageDraw.Draw(im).line([x1, y, x2, y], fill=(230, 230, 250, 255))
        z = math.cos(y * 0.55)
        a, b = ((255, 110, 170), (80, 220, 255)) if z > 0 else ((80, 220, 255), (255, 110, 170))
        R(im, int(x1) - 1, y, int(x1), y + 1, a); R(im, int(x2) - 1, y, int(x2), y + 1, b)
    return outline(im)


IBM = [
    ['###', '.#.', '.#.', '.#.', '###'],
    ['###.', '#..#', '###.', '#..#', '###.'],
    ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
]


def ic_ibm():
    im = new(); d = ImageDraw.Draw(im)
    d.rectangle([0, 5, 31, 26], fill=(14, 34, 48, 255), outline=(60, 110, 140, 255))
    for y in range(7, 25, 2):
        for x in range(2, 31, 2):
            P(im, x, y, (24, 52, 72))
    n = 0; col = 0
    for gi, g in enumerate(IBM):
        for j, row in enumerate(g):
            for i, v in enumerate(row):
                if v == '#':
                    x = 2 + (col + i) * 2; y = 11 + j * 2
                    P(im, x, y, (214, 204, 255)); P(im, x + 1, y, (120, 104, 200)); n += 1
        col += len(g[0]) + 1
    assert n == 35, n
    return im


def ic_proton():
    im = new(); d = ImageDraw.Draw(im)
    pts = [(16, 9), (8, 22), (24, 22)]
    for i in range(3):
        a = pts[i]; b = pts[(i + 1) % 3]
        d.line([a, b], fill=(255, 255, 255, 255), width=1)
    ball(im, 16, 9, 5.5, ramp('#5a0a20', '#b81e3c', '#ff5a78', '#ffd0d8'))
    ball(im, 8, 22, 5.5, ramp('#0a4a22', '#1e9a46', '#58e888', '#d0ffe0'))
    ball(im, 24, 22, 5.5, ramp('#0c2a6a', '#1a58c0', '#48a0ff', '#c0e4ff'))
    return outline(im)


def ic_radius():
    im = new(); d = ImageDraw.Draw(im)
    ball(im, 13, 19, 8, ramp('#5a3a10', '#b07a20', '#ffc857', '#fff0b0'))
    d.line([5, 6, 21, 6], fill=(91, 224, 255, 255))
    R(im, 5, 4, 5, 8, (91, 224, 255)); R(im, 21, 4, 21, 8, (91, 224, 255))
    P(im, 6, 5, (91, 224, 255)); P(im, 6, 7, (91, 224, 255)); P(im, 20, 5, (91, 224, 255)); P(im, 20, 7, (91, 224, 255))
    glyph(im, '?', 24, 12, (238, 242, 255))
    return outline(im)


def ic_point():
    im = new()
    for y in range(32):
        for x in range(32):
            dd = math.hypot(x + .5 - 16, y + .5 - 16)
            if 2 < dd < 11 and (1 - dd / 11) * 0.9 > (B4[y % 4][x % 4] + .5) / 16:
                P(im, x, y, (40, 120, 190))
    for k in range(24):
        a = k * 2 * math.pi / 24
        if k % 2 == 0:
            P(im, 16 + math.cos(a) * 13, 16 + math.sin(a) * 13, (91, 224, 255))
    for (x0, y0, x1, y1) in ((15, 1, 16, 3), (15, 28, 16, 30), (1, 15, 3, 16), (28, 15, 30, 16)):
        R(im, x0, y0, x1, y1, (238, 242, 255))
    R(im, 15, 15, 16, 16, (255, 255, 255))
    return im


def ic_planck():
    im = new(); d = ImageDraw.Draw(im)
    for k in range(-5, 6):
        d.line([16 + k * 1.2, 15, 16 + k * 6, 30], fill=(91, 224, 255, 255))
    y = 16; st = 2
    while y < 30:
        d.line([2, y, 29, y], fill=(91, 224, 255, 255)); y += st; st += 1
    ball(im, 11, 10, 5.5, ramp('#8a0a5a', '#d82a98', '#ff6ac8', '#ffe0f4'))
    ball(im, 22, 7, 4.5, ramp('#0c4a6a', '#1a8ac0', '#58d0ff', '#e0f8ff'))
    return outline(im)


def ic_rbc():
    im = new()
    ball(im, 16, 16, 12, ramp('#4a0a14', '#9a1428', '#e0384c', '#ff9aa4'), spec=False)
    ball(im, 16, 16, 5.5, ramp('#3a0610', '#6a0e1e', '#a81c34', '#d84860'), light=(0.3, 0.4), spec=False)
    R(im, 8, 8, 10, 9, (255, 200, 206))
    return outline(im)


def ic_virus():
    im = new()
    for k in range(14):
        a = k * 2 * math.pi / 14
        x0 = 16 + math.cos(a) * 8; y0 = 16 + math.sin(a) * 8
        x1 = 16 + math.cos(a) * 12.5; y1 = 16 + math.sin(a) * 12.5
        ImageDraw.Draw(im).line([x0, y0, x1, y1], fill=(255, 106, 138, 255))
        R(im, int(x1) - 1, int(y1) - 1, int(x1) + 1, int(y1) + 1, (255, 106, 138))
    ball(im, 16, 16, 8.5, ramp('#1a3a2a', '#2e7a52', '#58c088', '#c8ffe0'))
    return outline(im)


def ic_atom():
    im = new(); d = ImageDraw.Draw(im)
    for rot in (0, math.pi / 3, 2 * math.pi / 3):
        for k in range(90):
            t = k * 2 * math.pi / 90
            ex = 13 * math.cos(t); ey = 4.6 * math.sin(t)
            x = 16 + ex * math.cos(rot) - ey * math.sin(rot)
            y = 16 + ex * math.sin(rot) + ey * math.cos(rot)
            P(im, round(x), round(y), (91, 224, 255))
    ball(im, 16, 16, 3.5, ramp('#5a3a10', '#b07a20', '#ffc857', '#fff0b0'))
    for (x, y) in ((28, 16), (10, 9), (10, 23)):
        ball(im, x, y, 2, ramp('#808080', '#c0c0c0', '#f0f0f0', '#ffffff'), spec=False)
    return outline(im)


ICONS = [ic_height, ic_dime, ic_gromia, ic_egg, ic_drop, ic_scope, ic_dna, ic_ibm, ic_proton, ic_radius, ic_point, ic_planck, ic_rbc, ic_virus, ic_atom]


# --------------------------------------------------------- category icons 16x16
def cat_racket():
    im = new(16, 16); d = ImageDraw.Draw(im)
    d.ellipse([2, 0, 11, 11], outline=AMB + (255,), width=2)
    for x in range(4, 10, 2):
        d.line([x, 2, x, 9], fill=(238, 242, 255, 255))
    for y in range(3, 10, 2):
        d.line([4, y, 9, y], fill=(238, 242, 255, 255))
    R(im, 6, 12, 7, 15, (190, 120, 70))
    return outline(im)


def cat_bird():
    im = new(16, 16)
    ball(im, 8, 8, 5.5, ramp('#3a2414', '#6a4228', '#a8744a', '#e0b080'), spec=False)
    R(im, 1, 6, 4, 7, (255, 200, 87))
    P(im, 6, 5, (255, 255, 255)); P(im, 6, 6, INK)
    R(im, 6, 13, 6, 15, (255, 160, 80)); R(im, 10, 13, 10, 15, (255, 160, 80))
    return outline(im)


def cat_apple():
    im = new(16, 16)
    ball(im, 8, 9, 6, ramp('#5a0a14', '#b01e30', '#f04a58', '#ffc0c0'))
    R(im, 8, 1, 8, 4, (110, 70, 40)); R(im, 9, 2, 12, 3, (70, 200, 100))
    return outline(im)


def cat_globe():
    im = new(16, 16)
    ball(im, 8, 8, 7, ramp('#0c2a6a', '#1a58c0', '#48a0ff', '#c0e4ff'), spec=False)
    for (x0, y0, x1, y1) in ((4, 4, 7, 6), (3, 6, 5, 8), (9, 8, 12, 11), (10, 5, 12, 6)):
        R(im, x0, y0, x1, y1, (70, 190, 100))
    return outline(im)


def cat_note():
    im = new(16, 16)
    ball(im, 5, 12, 3.2, ramp('#10162a', '#2a3a70', '#5f7ad8', '#c0d0ff'), spec=False)
    R(im, 7, 2, 8, 12, (238, 242, 255)); R(im, 8, 2, 13, 4, (238, 242, 255)); R(im, 12, 4, 13, 7, (238, 242, 255))
    return outline(im)


def cat_flask():
    im = new(16, 16); d = ImageDraw.Draw(im)
    R(im, 6, 1, 9, 6, (200, 230, 255))
    d.polygon([(6, 6), (9, 6), (14, 14), (1, 14)], fill=(200, 230, 255, 255))
    d.polygon([(4, 10), (11, 10), (14, 14), (1, 14)], fill=(70, 220, 130, 255))
    R(im, 5, 11, 6, 11, (200, 255, 220)); R(im, 5, 1, 10, 1, (150, 170, 200))
    return outline(im)


def cat_column():
    im = new(16, 16)
    R(im, 2, 1, 13, 3, (236, 226, 192)); R(im, 4, 4, 11, 12, (236, 226, 192))
    for x in (5, 7, 9):
        R(im, x, 4, x, 12, (190, 176, 140))
    R(im, 3, 12, 12, 14, (214, 200, 164))
    return outline(im)


CATS = [cat_racket, cat_bird, cat_apple, cat_globe, cat_note, cat_flask, cat_column]


# ------------------------------------------------------------ mythic scene
def mythic():
    c = C(); rnd = random.Random(11)
    vgrad(c, 0, 0, W, H, ramp('#14041c', '#2a0a3a', '#3e0c4e', '#5a1262'))
    cx, cy = FX, 96
    for y in range(H):
        for x in range(W):
            ang = math.atan2(y - cy, x - cx)
            band = int((ang + math.pi) / (2 * math.pi) * 28) % 2 == 0
            dd = math.hypot(x - cx, y - cy)
            f = max(0, 1 - dd / 250)
            if band and f * 1.15 > (B4[y % 4][x % 4] + .5) / 16:
                c.p(x, y, mix(rgb('#7a1a80'), rgb('#ff8ad0'), f))
    glow(c, cx, cy, 70, rgb('#ff6ac8'), 0.8)
    glow(c, cx, cy, 36, rgb('#ffc0e8'), 0.9)
    glow(c, cx, FY + 1, 54, rgb('#ffb0e0'), 0.9, ex=2.2)
    c.r(0, FY + 1, W, H, rgb('#1a0626'))
    for y in range(FY + 1, H, 4):
        c.r(0, y, W, y + 1, rgb('#3a0e48'))
    glow(c, cx, FY + 2, 50, rgb('#ff8ad0'), 0.7, ex=2.6)
    cols = [rgb(x) for x in ('#ffc857', '#ff5fb0', '#5be0ff', '#8dffb4', '#ffffff', '#b583ff')]
    for _ in range(90):
        x = rnd.randint(0, W - 3); y = rnd.randint(4, H - 12)
        if abs(x - FX) < 18 and 80 < y < 142:
            continue
        col = cols[rnd.randint(0, 5)]
        c.r(x, y, x + 2, y + 2, col)
    for _ in range(16):
        x = rnd.randint(8, W - 8); y = rnd.randint(8, 120)
        c.r(x - 3, y, x + 4, y + 1, (255, 255, 255)); c.r(x, y - 3, x + 1, y + 4, (255, 255, 255))
    return place_player(c.im, aura=2)


if __name__ == '__main__':
    avs = avatars()
    for i, a in enumerate(avs, 1):
        save(a, 'av%d.png' % i)
    ics = [f() for f in ICONS]
    for i, a in enumerate(ics, 1):
        save(a, 'ic%d.png' % i)
    cts = [f() for f in CATS]
    for i, a in enumerate(cts, 1):
        save(a, 'cat%d.png' % i)
    save(mythic(), 'mythic.png')
    sheet = Image.new('RGBA', (15 * 108 + 20, 260), (24, 30, 52, 255))
    for i, a in enumerate(ics):
        b = a.resize((96, 96), Image.NEAREST); sheet.paste(b, (i * 108 + 6, 6), b)
    for i, a in enumerate(cts):
        b = a.resize((64, 64), Image.NEAREST); sheet.paste(b, (i * 80 + 6, 110), b)
    for i, a in enumerate(avs):
        b = a.resize((52, 100), Image.NEAREST); sheet.paste(b, (700 + i * 70, 150), b)
    sheet.save(os.path.join(OUT, '_sheet_new.png'))
    print('ok')

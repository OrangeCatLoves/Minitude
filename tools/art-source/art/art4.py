import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
from art2 import new, outline, P, R, ball, INK, AMB
from art import rgb, ramp, B4, OUT


def shade_poly(im, pts, rp, light=(-0.6, -0.8)):
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    cx = sum(xs) / len(xs); cy = sum(ys) / len(ys); r = max(max(xs) - min(xs), max(ys) - min(ys)) / 2
    n = len(rp)
    for y in range(im.height):
        for x in range(im.width):
            if m.getpixel((x, y)):
                v = ((x - cx) * light[0] + (y - cy) * light[1]) / (r * 1.1) * .5 + .55
                t = v * (n - 1) + (B4[y % 4][x % 4] / 16 - .5) * .8
                im.putpixel((x, y), rp[max(0, min(n - 1, int(round(t))))] + (255,))


def ic_milly():
    im = new(); T = ramp('#6a4420', '#a8743c', '#d8a868', '#f4d8a0')
    for (x, y) in ((6, 14), (5, 12), (4, 10), (4, 8), (5, 7)):
        R(im, x, y, x + 1, y + 1, T[1])
    ball(im, 14, 18, 7.5, T, spec=False)
    R(im, 8, 22, 9, 28, T[1]); R(im, 12, 23, 13, 28, T[2]); R(im, 17, 23, 18, 28, T[1]); R(im, 21, 22, 22, 28, T[2])
    ball(im, 23, 12, 5.5, T, spec=False)
    R(im, 26, 13, 30, 16, T[2]); R(im, 30, 14, 30, 15, (40, 20, 20))
    shade_poly(im, [(19, 2), (25, 7), (20, 10)], ramp('#7a4a5a', '#b87888', '#e0a0a8'))
    R(im, 25, 10, 26, 11, (20, 10, 20))
    return outline(im)


def ic_sand():
    im = new()
    T = ramp('#6a5030', '#a8844c', '#d8b878', '#f4e0a8')
    def hexa(cx, cy, r, rot):
        return [(cx + r * math.cos(rot + k * math.pi / 3), cy + r * .85 * math.sin(rot + k * math.pi / 3)) for k in range(6)]
    shade_poly(im, hexa(10, 21, 8, .3), T)
    shade_poly(im, hexa(23, 22, 7, 1.1), ramp('#5a4a40', '#9a8470', '#d0bca0', '#f0e4d0'))
    shade_poly(im, hexa(17, 10, 7, .7), ramp('#7a5a3a', '#b8904c', '#e8c47c', '#fff0b8'))
    for (x, y) in ((3, 28), (28, 29), (29, 14), (5, 10), (13, 29)):
        R(im, x, y, x + 1, y + 1, T[2])
    return outline(im)


def ic_ecoli():
    im = new(); T = ramp('#0c3a30', '#1c7a5a', '#46c890', '#c8ffe4')
    cx0, cx1, cy, rr = 12, 26, 16, 5
    for y in range(32):
        for x in range(32):
            px = min(max(x + .5, cx0), cx1)
            d = math.hypot(x + .5 - px, y + .5 - cy)
            if d <= rr:
                dy = (y + .5 - cy) / rr
                v = .62 - dy * .55 + (-.1 if x < 16 else 0)
                t = v * 3 + (B4[y % 4][x % 4] / 16 - .5) * .8
                im.putpixel((x, y), T[max(0, min(3, int(round(t))))] + (255,))
    for k in range(3):
        for i in range(0, 12):
            P(im, 11 - i, 13 + k * 3 + int(round(math.sin(i * .9 + k) * 1.6)), (140, 220, 190))
    for (x, y) in ((16, 10), (20, 22), (24, 10)):
        R(im, x, y, x, y + 1, (200, 255, 230))
    return outline(im)


def ic_ribo():
    im = new()
    ball(im, 13, 19, 9, ramp('#2a1a5a', '#5a3ab8', '#9a78f0', '#d8c8ff'), spec=False)
    ball(im, 21, 9, 6, ramp('#5a2a5a', '#b84a98', '#ff88d0', '#ffe0f4'), spec=False)
    for i in range(7):
        x = 2 + i * 4; y = 29 - i
        ball(im, x, y, 1.6, ramp('#6a4a00', '#c8a010', '#ffe050', '#fff8c0'), spec=False)
    for i in range(4):
        ball(im, 27 + (i % 2), 14 - i * 3 + 1, 1.6, ramp('#0a3a58', '#1a80b0', '#5ad0ff', '#d0f4ff'), spec=False)
    return outline(im)


def ic_bohr():
    im = new(); d = ImageDraw.Draw(im)
    for k in range(120):
        t = k * 2 * math.pi / 120
        P(im, round(15 + 13 * math.cos(t)), round(16 + 13 * math.sin(t)), (91, 224, 255))
    for x in range(18, 28):
        if x % 2 == 0:
            P(im, x, 16, AMB)
    P(im, 17, 15, AMB); P(im, 17, 17, AMB); P(im, 28, 15, AMB); P(im, 28, 17, AMB)
    ball(im, 15, 16, 3, ramp('#5a1020', '#c02a48', '#ff6a88', '#ffd0d8'), spec=False)
    ball(im, 28, 16, 2.2, ramp('#0a3a58', '#1a80b0', '#5ad0ff', '#f0ffff'), spec=False)
    return outline(im)


ICS = [(16, ic_milly), (17, ic_sand), (18, ic_ecoli), (19, ic_ribo), (20, ic_bohr)]
if __name__ == '__main__':
    S = 6
    sheet = Image.new('RGBA', (5 * 32 * S + 6 * 8, 32 * S + 16), (16, 26, 51, 255))
    for i, (n, f) in enumerate(ICS):
        im = f(); im.save(os.path.join(OUT, 'ic%d.png' % n))
        sheet.alpha_composite(im.resize((32 * S, 32 * S), Image.NEAREST), (8 + i * (32 * S + 8), 8))
    sheet.save(os.path.join(OUT, '_sheet_ic2.png'))
    print('ok')

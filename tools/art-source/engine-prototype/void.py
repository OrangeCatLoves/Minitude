"""The unexplored stretch (slots 20..34, between Collision Hall and Planck Foam): 15 variants of one empty dark world.
Variant i = 0..14 (g = i / 14): the dark deepens, the stars thin out, and the glow of Planck Foam grows on the horizon.
At g = 1 it hands over to the Planck Foam picture (slot 35), which is inside the patch at the explorer's feet."""
import sys, math, random
import numpy as np
from PIL import Image, ImageDraw
SP = '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad'
sys.path[:0] = [SP + '/real', SP]
import kit
from kit import *
kit._calm_hud_zone = lambda im: im

NV = 15


def lerp3(a, b, t):
    return tuple(int(round(a[k] + (b[k] - a[k]) * t)) for k in range(3))


def dark(h, k):
    c = rgb(h)
    return tuple(int(v * k) for v in c)


def _posterize(a, step=4.0):
    return np.clip(np.round(a / step) * step, 0, 255)


def void_scene(i):
    """Smooth, banded sky (no ordered dither: the dither turns into a loud checkerboard when the dive magnifies it)."""
    g = i / (NV - 1.0)
    k = 1.0 - 0.55 * g                       # the dark deepens
    tint = np.array(lerp3((0, 0, 0), (26, 12, 60), g ** 1.4), np.float32)
    stops = [dark(h, k) for h in ('#02030a', '#04061a', '#070b26', '#0a1030')]
    ys = np.linspace(0, 3, 140, dtype=np.float32)
    sky = np.zeros((140, W, 3), np.float32)
    for y in range(140):
        t = ys[y]; j = min(int(t), 2); f = t - j
        base = np.array(stops[j], np.float32) * (1 - f) + np.array(stops[j + 1], np.float32) * f
        sky[y, :, :] = base + tint * (0.25 + 0.75 * t / 3.0)
    yy, xx = np.mgrid[0:140, 0:W].astype(np.float32)

    def add_glow(cx, cy, rad, col, amt, ex, p=1.6):
        d = np.hypot((xx - cx) / ex, yy - cy)
        gk = np.clip(1 - d / rad, 0, 1) ** p * amt
        sky[...] += gk[..., None] * np.array(col, np.float32)

    gcol = lerp3((26, 24, 92), (120, 108, 255), g)
    add_glow(160, 139, 12 + 74 * g ** 1.5, gcol, 0.15 + 0.80 * g ** 2.4, 3.0)
    if g > 0.4:
        q = (g - 0.4) / 0.6
        add_glow(160, 138, 6 + 30 * q, lerp3((90, 80, 220), (210, 200, 255), q), 0.12 + 0.9 * q ** 1.6, 2.2)
    img = Image.fromarray(_posterize(sky).astype(np.uint8)).convert('RGBA')
    c = C(); c.im.paste(img, (0, 0)); c.d = ImageDraw.Draw(c.im)
    c.r(0, 140, W, H, rgb('#04061a'))
    # stars: the same positions every time, fewer and dimmer as g grows
    rnd = random.Random(2100)
    pts = [(rnd.randint(0, W - 1), rnd.randint(0, 133), rnd.random()) for _ in range(60)]
    keep = int(round(46 * (1 - 0.8 * g)) + 5)
    for n, (x, y, q) in enumerate(pts[:keep]):
        col = rgb('#4a5690') if q > 0.5 else rgb('#3a4478')
        c.p(x, y, tuple(int(v * (1 - 0.35 * g)) for v in col))
    for n in range(10):
        x = rnd.randint(0, W - 1); y = rnd.randint(0, 99)
        if n < max(1, int(round(10 * (1 - g)))):
            c.p(x, y, tuple(int(v * (1 - 0.4 * g)) for v in rgb('#7a86c0')))
    if g > 0.55:                              # the first dim foam bubbles at the horizon
        q = (g - 0.55) / 0.45
        rs = random.Random(77)
        for n in range(int(2 + 10 * q)):
            cx = 160 + rs.uniform(-120, 120); cy = rs.uniform(96, 134); r_ = rs.uniform(3, 12)
            colr = [(44, 110, 140), (110, 54, 140), (120, 100, 60), (90, 100, 150)][n % 4]
            ring(c, cx, cy, r_, r_, tuple(int(v * (0.35 + 0.5 * q)) for v in colr), 1)
    # floor: a dim ledge that picks up the cyan grid of the foam floor late in the stretch
    top = lerp3(rgb('#3a4a7a'), (60, 150, 180), g * 0.8); mid = lerp3(rgb('#141c3c'), (14, 40, 70), g)
    ledge(c, 140, '#%02x%02x%02x' % top, '#%02x%02x%02x' % mid, '#04061a', 0, W, 9, None)
    for x in range(10, W, 20):
        c.r(x, 150, x + 1, 153, lerp3(rgb('#26305a'), (30, 80, 110), g))
    if g > 0.5:
        q = (g - 0.5) / 0.5
        gl = tuple(int(v * 0.55 * q) for v in (60, 190, 230))
        for n in range(-6, 7):                # faint perspective lines to the vanishing point on the floor
            c.line(160 + n * 3, 141, 160 + n * 60, 179, gl, 1)
    return c.im.convert('RGB')


if __name__ == '__main__':
    from PIL import Image
    ims = [void_scene(i) for i in (0, 4, 8, 11, 13, 14)]
    sheet = Image.new('RGB', (W * 3, H * 2))
    for n, im in enumerate(ims):
        sheet.paste(im, ((n % 3) * W, (n // 3) * H))
    sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).save(SP + '/v21/void_sheet.png')
    print('ok')

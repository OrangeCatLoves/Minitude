import sys, math, random, os
sys.path.insert(0, '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad')
from PIL import Image, ImageDraw
from art import rgb, mix, ramp, B4, W, H, FX, FY, C, glow, vgrad, sphere, cable, haze
from art3 import stars, slab, facet, capsule, wavy, ring, orbit, lobe, dim

def _safe_r(s, x0, y0, x1, y1, col):
    x0, x1 = sorted((int(x0), int(x1))); y0, y1 = sorted((int(y0), int(y1)))
    s.d.rectangle([x0, y0, max(x0, x1 - 1), max(y0, y1 - 1)], fill=tuple(col) + (255,))
C.r = _safe_r

SC = {}
def _calm_hud_zone(im):
    """Darken the strip that sits under the HUD (scene rows 14-34) so score and size stay readable; fade out by row 42."""
    import numpy as np
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    f = np.ones(a.shape[0], np.float32)
    for y in range(a.shape[0]):
        if 14 <= y <= 34: f[y] = 0.55
        elif 34 < y < 42: f[y] = 0.55 + 0.45 * (y - 34) / 8.0
    return Image.fromarray((a * f[:, None, None]).clip(0, 255).astype('uint8'))

def scene(k):
    def deco(f):
        SC[k] = lambda: _calm_hud_zone(f())
        return f
    return deco

def dot(c, x, y, r, col, hi=None):
    c.circ(x, y, r, col)
    if hi is not None and r >= 2:
        c.p(x - r * 0.35, y - r * 0.35, hi)

def sparkle(c, x, y, s, col, core=(255, 255, 255)):
    c.line(x - s, y, x + s, y, col); c.line(x, y - s, x, y + s, col)
    c.r(x - 1, y - 1, x + 1, y + 1, core)

def streak(c, x0, y0, x1, y1, cols, w=1, n_glow=0, gcol=None):
    """A glowing line: cols = (outer, mid, core) drawn with decreasing width."""
    for i, col in enumerate(cols):
        c.line(x0, y0, x1, y1, col, max(1, w + (len(cols) - 1 - i) * 2))
    if n_glow:
        for t in range(n_glow):
            x = x0 + (x1 - x0) * t / n_glow; y = y0 + (y1 - y0) * t / n_glow
            glow(c, x, y, 7, gcol or cols[0], .22)

def wave_train(c, x0, y0, x1, y1, lam, amp, col, col2=None, w=1, env=True, phase=0.0):
    """A sine wave along a line with a smooth amplitude envelope (a wave packet)."""
    L = math.hypot(x1 - x0, y1 - y0) or 1; nx = -(y1 - y0) / L; ny = (x1 - x0) / L
    prev = None; N = int(L * 2)
    for i in range(N + 1):
        t = i / N
        e = math.sin(math.pi * t) ** 1.3 if env else 1.0
        s = math.sin(t * L / lam * 2 * math.pi + phase) * amp * e
        p = (x0 + (x1 - x0) * t + nx * s, y0 + (y1 - y0) * t + ny * s)
        if prev: c.line(prev[0], prev[1], p[0], p[1], col2 if (col2 and e > .75) else col, w)
        prev = p

def ledge(c, y, top, mid, dark, x0=0, x1=W, h=9, dots=None):
    slab(c, y, top, mid, dark, h, x0, x1)
    if dots:
        for x in range(x0 + 8, x1, 10): c.r(x, y + 5, x + 2, y + 7, rgb(dots))

def starfield(c, rnd, n, cols, y0=0, y1=H, big=0):
    stars(c, rnd, n, cols, y0, y1)
    for _ in range(big):
        sparkle(c, rnd.randint(4, W - 4), rnd.randint(y0 + 2, y1 - 2), rnd.randint(2, 4), rnd.choice(cols))

def blobs(c, rnd, n, x0, x1, y0, y1, rmin, rmax, cols, amt=.5, ex=1.4):
    for _ in range(n):
        glow(c, rnd.randint(x0, x1), rnd.randint(y0, y1), rnd.randint(rmin, rmax), rnd.choice(cols), amt, ex)

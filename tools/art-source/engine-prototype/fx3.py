"""Effect primitives for mini3. Everything is a pure function of time (no state between frames)."""
import math, functools
import numpy as np
import cv2
from PIL import Image, ImageDraw
import mini as M

W, H = 1280, 720
VH = 720                       # frame rows used by full-frame effects
ROW0 = 60


def ck(c, k):
    return (int(max(0, min(255, c[0] * k))), int(max(0, min(255, c[1] * k))), int(max(0, min(255, c[2] * k))))


def lerpc(a, b, t):
    t = M.clamp01(t)
    return (int(a[0] + (b[0] - a[0]) * t), int(a[1] + (b[1] - a[1]) * t), int(a[2] + (b[2] - a[2]) * t))


@functools.lru_cache(None)
def rnd(seed, n, m):
    return np.random.RandomState(seed).rand(n, m).astype(np.float32)


# ---------------------------------------------------------------- additive light layer
class Add:
    """Black canvas drawn with PIL; added onto the frame (plus a cheap glow) at the end."""
    def __init__(self):
        self.im = Image.new('RGB', (W, H)); self.d = ImageDraw.Draw(self.im); self.used = False

    def apply(self, frame, glow=0.9, sigma=2.5):
        a = np.asarray(self.im)
        small = cv2.resize(a, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
        g = cv2.GaussianBlur(small, (0, 0), sigma)
        g = cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR)
        out = frame.astype(np.int16) + a + (g * glow).astype(np.int16)
        return np.clip(out, 0, 255).astype(np.uint8)


def ring(ad, cx, cy, r, w, col, a=1.0, ry=None):
    if r < 2 or a <= 0.01: return
    ry = r if ry is None else ry
    ad.ellipse([cx - r, cy - ry, cx + r, cy + ry], outline=ck(col, a), width=max(1, int(w)))


def pxstar(d, x, y, s, c):
    s = max(1, int(s)); x = int(x); y = int(y); h = s // 2
    d.rectangle([x - 3 * s, y - h, x + 3 * s, y - h + s - 1], fill=c)
    d.rectangle([x - h, y - 3 * s, x - h + s - 1, y + 3 * s], fill=c)
    d.rectangle([x - s, y - s, x + s - 1, y + s - 1], fill=c)


def burst(d, t, t0, n, seed, ox, oy, vmin, vmax, life, g=0.0, size=6.0, cols=((255, 255, 255),), a0=0.0, a1=2 * math.pi,
          spread=0.0, drag=0.0, bright=1.6):
    """n particles leaving (ox, oy) at time t0. Position = origin + v * (1-exp(-drag t))/drag + g t^2 / 2."""
    r = rnd(seed, n, 6)
    tau = t - t0 - r[:, 5] * spread
    life_k = life * (0.6 + 0.4 * r[:, 2])
    idx = np.nonzero((tau > 0) & (tau < life_k))[0]
    for k in idx:
        ang = a0 + (a1 - a0) * float(r[k, 0]); v = vmin + (vmax - vmin) * float(r[k, 1]); tt_ = float(tau[k])
        dd = v * tt_ if drag == 0 else v * (1 - math.exp(-drag * tt_)) / drag
        x = ox + math.cos(ang) * dd; y = oy + math.sin(ang) * dd + 0.5 * g * tt_ * tt_
        f = 1 - tt_ / float(life_k[k])
        c = cols[int(r[k, 4] * len(cols)) % len(cols)]
        s = size * (0.6 + 0.8 * float(r[k, 3])) * (0.35 + 0.65 * f)
        s = max(2.0, round(s / 2) * 2)
        d.rectangle([int(x - s / 2), int(y - s / 2), int(x + s / 2) - 1, int(y + s / 2) - 1], fill=ck(c, min(1.0, f * bright)))


def inward(d, t, tc0, tc1, n, seed, ox, oy, rmin, rmax, col, size=6.0):
    """Particles spiralling into (ox, oy) between tc0 and tc1."""
    r = rnd(seed, n, 5)
    for k in range(n):
        cyc = 0.55 + 0.35 * float(r[k, 3])
        q = ((t - tc0) / cyc + float(r[k, 2])) % 1.0
        if not (tc0 <= t <= tc1): continue
        rad = rmin + (rmax - rmin) * float(r[k, 1])
        rr = rad * (1 - q) ** 1.6
        ang = 2 * math.pi * float(r[k, 0]) + 2.2 * q
        x = ox + math.cos(ang) * rr; y = oy + math.sin(ang) * rr * 0.8
        f = q ** 0.7
        s = max(2, int(round(size * (0.5 + 0.7 * float(r[k, 4])) * (0.4 + 0.6 * (1 - q)) / 2) * 2))
        d.rectangle([int(x - s / 2), int(y - s / 2), int(x + s / 2) - 1, int(y + s / 2) - 1], fill=ck(col, f * 1.3))


def lightning(d, t, cx, cy, rate, n, rmin, rmax, col, w=3):
    kk = int(t * rate)
    rs = np.random.RandomState(kk * 7919 + 13)
    for b in range(n):
        ang = rs.rand() * 2 * math.pi
        L = rmin + (rmax - rmin) * rs.rand()
        x, y = cx, cy
        segs = 9
        pts = [(x, y)]
        for s in range(1, segs + 1):
            f = s / segs
            jx = (rs.rand() - 0.5) * 70 * math.sin(math.pi * f) ** 0.6
            jy = (rs.rand() - 0.5) * 70 * math.sin(math.pi * f) ** 0.6
            pts.append((cx + math.cos(ang) * L * f + jx, cy + math.sin(ang) * L * f * 0.85 + jy))
        d.line(pts, fill=col, width=w, joint='curve')
        d.line(pts, fill=ck(col, 0.5), width=w + 4, joint='curve')
        if rs.rand() < 0.6:
            k0 = int(2 + rs.rand() * 4); bx, by = pts[k0]
            a2 = ang + (rs.rand() - 0.5) * 1.8
            pts2 = [(bx, by)]
            for s in range(1, 5):
                pts2.append((bx + math.cos(a2) * 26 * s + (rs.rand() - 0.5) * 20, by + math.sin(a2) * 26 * s + (rs.rand() - 0.5) * 20))
            d.line(pts2, fill=ck(col, 0.8), width=max(1, w - 1))


def confetti(d, t, t0, n, seed, cols, dur, x0, x1, ytop, vy, sway=40.0, size=10):
    r = rnd(seed, n, 7)
    for k in range(n):
        tau = t - t0 - float(r[k, 6]) * dur * 0.5
        if tau <= 0: continue
        x = x0 + (x1 - x0) * float(r[k, 0]) + sway * math.sin(tau * (2 + 3 * float(r[k, 1])) + 6.28 * float(r[k, 2]))
        y = ytop + tau * (vy * (0.7 + 0.6 * float(r[k, 3])))
        if y > VH + 20 or tau > dur: continue
        wv = abs(math.cos(tau * (5 + 6 * float(r[k, 4])) + 6.28 * float(r[k, 2])))
        w_ = max(2, int(size * (0.3 + 0.7 * wv))); h_ = int(size * 1.4)
        c = cols[int(r[k, 5] * len(cols)) % len(cols)]
        if wv < 0.35: c = ck(c, 0.7)
        d.rectangle([int(x), int(y), int(x) + w_, int(y) + h_], fill=c)


# ---------------------------------------------------------------- full-frame helpers
@functools.lru_cache(None)
def _grid():
    yy, xx = np.mgrid[0:VH, 0:W].astype(np.float32)
    return xx, yy


@functools.lru_cache(None)
def vignette_map(power=2.2):
    xx, yy = _grid()
    d = np.hypot((xx - W / 2) / (W / 2), (yy - VH / 2) / (VH / 2)) / 1.2
    return np.clip(d, 0, 1) ** power


def vignette(F, col, k):
    """Darken/tint the edges. F is uint8 (VH.., W, 3)."""
    if k <= 0.01: return F
    h = F.shape[0]
    m = vignette_map()[:h]
    a = (m * k)[..., None]
    out = F.astype(np.float32) * (1 - a) + np.array(col, np.float32) * a
    return out.astype(np.uint8)


def radial_add(F, cx, cy, R, col, k, pw=2.0):
    """Soft light blob added into F (in place)."""
    if k <= 0.01: return
    x0 = int(max(0, cx - R)); x1 = int(min(F.shape[1], cx + R)); y0 = int(max(0, cy - R)); y1 = int(min(F.shape[0], cy + R))
    if x1 <= x0 or y1 <= y0: return
    xx = np.arange(x0, x1, dtype=np.float32)[None, :]; yy = np.arange(y0, y1, dtype=np.float32)[:, None]
    dd = np.clip(1 - np.hypot(xx - cx, yy - cy) / R, 0, 1) ** pw
    add = dd[..., None] * (np.array(col, np.float32) * k)
    F[y0:y1, x0:x1] = np.clip(F[y0:y1, x0:x1].astype(np.float32) + add, 0, 255).astype(np.uint8)


def blit(F, arr, x0, y0, alpha=1.0):
    h, w = arr.shape[:2]
    cx0 = max(0, x0); cy0 = max(0, y0); cx1 = min(F.shape[1], x0 + w); cy1 = min(F.shape[0], y0 + h)
    if cx1 <= cx0 or cy1 <= cy0: return
    sub = arr[cy0 - y0:cy1 - y0, cx0 - x0:cx1 - x0]
    a = sub[..., 3:4].astype(np.float32) * (alpha / 255.0)
    dst = F[cy0:cy1, cx0:cx1].astype(np.float32)
    F[cy0:cy1, cx0:cx1] = (dst * (1 - a) + sub[..., :3].astype(np.float32) * a).astype(np.uint8)


def shade(F, x0, y0, x1, y1, col, a0, a1=None, axis=0):
    """Darken/tint a rectangle with an alpha that ramps from a0 to a1 along rows (axis 0) or columns (axis 1)."""
    x0 = max(0, int(x0)); y0 = max(0, int(y0)); x1 = min(F.shape[1], int(x1)); y1 = min(F.shape[0], int(y1))
    if x1 <= x0 or y1 <= y0: return
    a1 = a0 if a1 is None else a1
    if axis == 0:
        a = np.linspace(a0, a1, y1 - y0, dtype=np.float32)[:, None, None]
    else:
        a = np.linspace(a0, a1, x1 - x0, dtype=np.float32)[None, :, None]
    sub = F[y0:y1, x0:x1].astype(np.float32)
    F[y0:y1, x0:x1] = (sub * (1 - a) + np.array(col, np.float32) * a).astype(np.uint8)


def shift(F, dx, dy):
    """Integer translation with edge replicate (crisp)."""
    dx = int(round(dx)); dy = int(round(dy))
    if dx == 0 and dy == 0: return F
    Mx = np.float32([[1, 0, dx], [0, 1, dy]])
    return cv2.warpAffine(F, Mx, (F.shape[1], F.shape[0]), flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_REPLICATE)


def zoom_blur(F, cx, cy, k, n=5):
    """Radial (zoom) blur: average of n copies scaled around (cx, cy) between 1-k/2 and 1+k/2."""
    if k < 0.002: return F
    h, w = F.shape[:2]
    acc = np.zeros(F.shape, np.uint16)
    for i in range(n):
        sc = 1 + k * (i / (n - 1) - 0.5)
        Mx = np.float32([[sc, 0, (1 - sc) * cx], [0, sc, (1 - sc) * cy]])
        acc += cv2.warpAffine(F, Mx, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return (acc // n).astype(np.uint8)


def aberrate(F, cx, cy, e):
    """Chromatic aberration: red scaled out, blue scaled in around (cx, cy)."""
    if e < 0.0006: return F
    h, w = F.shape[:2]
    out = F.copy()
    for ch, sc in ((0, 1 + e), (2, 1 - e)):
        Mx = np.float32([[sc, 0, (1 - sc) * cx], [0, sc, (1 - sc) * cy]])
        out[..., ch] = cv2.warpAffine(np.ascontiguousarray(F[..., ch]), Mx, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return out


# ---------------------------------------------------------------- sunburst + halftone (Mythic / Legendary)
def sunburst_mask(cx, cy, n, rot, duty=0.5, scale=4):
    """Float mask (VH, W) of n alternating wedges around (cx, cy), soft edges (drawn at 1/4 size)."""
    h, w = VH // scale, W // scale
    m = np.zeros((h, w), np.uint8)
    step = 2 * math.pi / n; R = 900 / scale
    c0 = (cx / scale, cy / scale)
    for k in range(n):
        a0 = rot + k * step; a1 = a0 + step * duty
        pts = np.array([c0, (c0[0] + R * math.cos(a0), c0[1] + R * math.sin(a0)), (c0[0] + R * math.cos((a0 + a1) / 2) * 1.15, c0[1] + R * math.sin((a0 + a1) / 2) * 1.15),
                        (c0[0] + R * math.cos(a1), c0[1] + R * math.sin(a1))], np.float32)
        cv2.fillConvexPoly(m, pts.astype(np.int32), 255)
    m = cv2.GaussianBlur(m, (0, 0), 0.7)
    return cv2.resize(m, (W, VH), interpolation=cv2.INTER_LINEAR).astype(np.float32) / 255.0


@functools.lru_cache(None)
def _halftone_static(cell):
    xx, yy = _grid()
    cxm = (np.floor(xx / cell) + 0.5) * cell; cym = (np.floor(yy / cell) + 0.5) * cell
    d2 = (xx - cxm) ** 2 + (yy - cym) ** 2
    return cxm, cym, d2


def halftone(cx, cy, grow, cell=16, r0=110.0, r1=820.0, cmax=0.72):
    """Boolean mask of halftone dots: larger away from (cx, cy)."""
    cxm, cym, d2 = _halftone_static(cell)
    R = np.hypot(cxm - cx, cym - cy)
    rad = cell * cmax * np.clip((R - r0) / (r1 - r0), 0, 1) ** 0.8 * grow
    return d2 < rad * rad


@functools.lru_cache(None)
def radial_fall(cx, cy, R):
    xx, yy = _grid()
    return np.clip(1 - np.hypot(xx - cx, yy - cy) / R, 0, 1).astype(np.float32)


# ---------------------------------------------------------------- big text
@functools.lru_cache(None)
def smask(s, kind, size, w=500, ls=0, pad=8):
    f = M.PX(size, w) if kind == 'px' else M.SIL(size, w >= 500)
    wid = int(M.tw(f, s, ls)) + 2 * pad; hei = int(size * 1.5) + 2 * pad
    im = Image.new('L', (wid, hei), 0); d = ImageDraw.Draw(im)
    base = pad + int(size * 1.1)
    M.text(d, pad, base, s, f, 255, ls)
    return np.asarray(im).astype(np.float32) / 255.0, pad, base


def put_text(F, s, x, base, kind, size, col, a=1.0, w=500, ls=0, anchor='l', dy=0, grad=None):
    if a <= 0.01: return
    m, px, py = smask(s, kind, size, w, ls)
    f = M.PX(size, w) if kind == 'px' else M.SIL(size, w >= 500)
    wd = M.tw(f, s, ls) - ls
    x0 = x if anchor == 'l' else (x - wd / 2 if anchor == 'c' else x - wd)
    comp_mask(F, m, int(round(x0 - px)), int(round(base - py + dy)), col, a, grad=grad)


def rect_a(F, x, y, w, h, col, a=1.0):
    x0 = max(0, int(x)); y0 = max(0, int(y)); x1 = min(F.shape[1], int(x + w)); y1 = min(F.shape[0], int(y + h))
    if x1 <= x0 or y1 <= y0 or a <= 0.01: return
    sub = F[y0:y1, x0:x1].astype(np.float32)
    F[y0:y1, x0:x1] = (sub * (1 - a) + np.array(col, np.float32) * a).astype(np.uint8)


@functools.lru_cache(None)
def tmask(s, size, w=500, ls=0, pad=18):
    f = M.PX(size, w)
    wid = int(M.tw(f, s, ls)) + 2 * pad; hei = int(size * 1.45) + 2 * pad
    im = Image.new('L', (wid, hei), 0); d = ImageDraw.Draw(im)
    base = pad + int(size * 1.05)
    M.text(d, pad, base, s, f, 255, ls)
    return np.asarray(im).astype(np.float32) / 255.0, pad, base


def comp_mask(F, m, x, y, col, a=1.0, grad=None):
    """Composite colour `col` (or per-row gradient (top, bottom)) through mask m (float h,w) at (x, y)."""
    h, w = m.shape
    cx0 = max(0, x); cy0 = max(0, y); cx1 = min(F.shape[1], x + w); cy1 = min(F.shape[0], y + h)
    if cx1 <= cx0 or cy1 <= cy0: return
    mm = m[cy0 - y:cy1 - y, cx0 - x:cx1 - x][..., None] * a
    if grad is not None:
        top, bot = grad
        gy = np.linspace(0, 1, h, dtype=np.float32)[cy0 - y:cy1 - y][:, None, None]
        colr = np.array(top, np.float32) * (1 - gy) + np.array(bot, np.float32) * gy
    else:
        colr = np.array(col, np.float32)
    dst = F[cy0:cy1, cx0:cx1].astype(np.float32)
    F[cy0:cy1, cx0:cx1] = (dst * (1 - mm) + colr * mm).astype(np.uint8)


def add_mask(F, m, x, y, col, k=1.0):
    h, w = m.shape
    cx0 = max(0, x); cy0 = max(0, y); cx1 = min(F.shape[1], x + w); cy1 = min(F.shape[0], y + h)
    if cx1 <= cx0 or cy1 <= cy0: return
    mm = m[cy0 - y:cy1 - y, cx0 - x:cx1 - x][..., None] * k
    dst = F[cy0:cy1, cx0:cx1].astype(np.float32)
    F[cy0:cy1, cx0:cx1] = np.clip(dst + np.array(col, np.float32) * mm, 0, 255).astype(np.uint8)


def big_title(F, s, size, cx, base_y, scale, col_top, col_bot, outline, glow_col, glow=0.7, shine=None, split=0, ls=2, alpha=1.0, w=500):
    """Outlined, glowing, gradient-filled pixel title centred at cx with its baseline at base_y.
    scale: draw scale (for the pop-in). shine: None or 0..1 position of a diagonal light sweep. split: px of RGB split (glitch)."""
    m0, px, py = tmask(s, size, w, ls)
    if scale <= 0.02: return
    if abs(scale - 1) > 1e-3:
        m = cv2.resize(m0, (max(2, int(m0.shape[1] * scale)), max(2, int(m0.shape[0] * scale))), interpolation=cv2.INTER_LINEAR)
    else:
        m = m0
    h, wd = m.shape
    x = int(cx - (m0.shape[1] / 2) * scale); y = int(base_y - py * scale)
    k = max(3, int(round(4 * scale)))
    dil = cv2.dilate(m, np.ones((k * 2 + 1, k * 2 + 1), np.uint8))
    gl = cv2.GaussianBlur(cv2.dilate(m, np.ones((5, 5), np.uint8)), (0, 0), 9 * scale)
    if glow > 0: add_mask(F, gl, x, y, glow_col, glow * alpha)
    sh = np.zeros_like(dil); sh[int(6 * scale):] = dil[:h - int(6 * scale)]
    comp_mask(F, sh, x, y, (0, 0, 0), 0.5 * alpha)
    comp_mask(F, dil, x, y, outline, alpha)
    if split:
        sp = int(split)
        for dx_, ch in ((-sp, (255, 40, 120)), (sp, (40, 220, 255))):
            comp_mask(F, np.roll(m, dx_, axis=1), x, y, ch, 0.85 * alpha)
    comp_mask(F, m, x, y, None, alpha, grad=(col_top, col_bot))
    if shine is not None and 0 <= shine <= 1:
        yy, xx = np.mgrid[0:h, 0:wd].astype(np.float32)
        pos = -0.3 * wd + shine * 1.6 * wd
        band = np.clip(1 - np.abs((xx + yy * 0.6) - pos) / (0.07 * wd), 0, 1)
        add_mask(F, m * band, x, y, (255, 255, 255), 0.85 * alpha)

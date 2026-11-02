"""The world 21 finale: quiet build, then burst. Everything is a pure function of time.
Timeline of the dive (tau = seconds after the dive starts, D = T.FIN_DUR):
  0-1.4     launch, as in every other dive
  1.4-4     the camera still speeds through the dark worlds; the interface dims, colour and sound drain away
  3-12.4    one point of light appears at the horizon and grows; heartbeats; particles fall into it; thin rings close on it
  12-12.45  a held breath: the light shrinks a little
  12.4-13.4 the window of Planck Foam opens: bloom, rays, zoom blur
  landing   white flash, bloom, rings, bursts, confetti, stars; the title card follows 1.3 s later
"""
import math
import numpy as np
import mini as M
import fx3 as X
import tl3 as T
import tfx3 as TF
from mini import W, H, clamp01, smooth, ease_out, ease_in_out, back_out, PX, SIL, tw

CORE = (628.0, 400.0)                 # bright core of Planck Foam when the world is at rest on screen
FX, FY = float(M.FX), float(M.FY)
LILAC = (190, 176, 255); WHT = (255, 255, 255); GOLD = (255, 200, 87); CYN = (91, 224, 255); PNK = (255, 95, 176); VIO = (181, 131, 255)
FOAM_COLS = (WHT, CYN, PNK, GOLD, VIO, (255, 168, 214), (154, 216, 255))


def _rfall(cx, cy, R):
    xx, yy = X._grid()
    return np.clip(1 - np.hypot(xx - cx, yy - cy) / R, 0, 1).astype(np.float32)


def fin_rec(t):
    """The finale record if t is anywhere from the charge-up of the last dive to the end of its card, else None."""
    r = T.TL[-1]
    if r['fin'] and r['fs'] - 0.2 <= t < r['card'] + r['clen'] + 0.5: return r
    return None


def light_pos(z):
    e = 10 ** (z - 35.0)
    return FX + (CORE[0] - FX) * e, FY + (CORE[1] - FY) * e, e


def beat(tau):
    k = 0.0
    for b in T.FIN_BEATS:
        for off, amp in ((0.0, 1.0), (0.17, 0.6)):
            x = tau - b - off
            if x > 0: k += amp * math.exp(-x / 0.20) * smooth(0, 0.03, x)
    return min(1.4, k)


def intensity(tau):
    """How much of the light has appeared (0 before the dive turns quiet, 1 once it is established)."""
    return smooth(3.0, 5.6, tau)


def ui_dim(t):
    """Multiplier for the interface (top bar, rail, scale bar): it fades back while the world goes quiet."""
    r = fin_rec(t)
    if r is None: return 1.0
    tau = t - r['fs']
    return 1.0 - 0.72 * T.fin_hush(tau)


def dark_k(t):
    """Extra darkening of the picture while the world holds its breath (0..1)."""
    r = fin_rec(t)
    if r is None: return 0.0
    tau = t - r['fs']
    return T.fin_hush(tau) * (1 - 0.8 * smooth(11.0, 13.0, tau))


# ------------------------------------------------------------------ light in picture space (before the explorer is drawn)
def bloom_pre(F, r, t, c):
    if r is None or not r['fin']: return
    tau = t - r['fs']; a = t - r['fe']
    if tau < 3.0: return
    if a < 0:
        px, py, e = light_pos(c['z'])
        I = intensity(tau)
        bt = beat(tau)
        inhale = 1 - 0.18 * smooth(12.0, 12.4, tau) * (1 - smooth(12.4, 12.55, tau))
        R = (24 + 520 * e ** 0.8) * inhale
        u = smooth(12.4, T.FIN_DUR, tau) ** 1.5
        k = (0.20 * I + 0.12 * bt * I) * (1 - u) + 0.62 * u
        X.radial_add(F, px, py, R * (1 + 2.0 * u), X.lerpc(LILAC, WHT, 0.5 * u), k, 2.0)
        if u > 0.02:                                   # rays from the point as the window opens
            m = X.sunburst_mask(px, py, 16, 0.25 * tau, 0.45) * _rfall(px, py, 1200) ** 0.7
            X.add_mask(F, m, 0, 0, X.lerpc(LILAC, WHT, 0.4), 0.38 * u)
    else:
        if a > 5.0: return
        k = math.exp(-a / 0.9)
        X.radial_add(F, CORE[0], CORE[1], 480 + 620 * ease_out(a / 0.6), X.lerpc(LILAC, WHT, 0.6), 0.62 * math.exp(-a / 0.7), 1.8)
        m = X.sunburst_mask(int(CORE[0]), int(CORE[1]), 22, 0.1 + 0.12 * a, 0.42) * X.radial_fall(int(CORE[0]), int(CORE[1]), 1300) ** 0.6
        X.add_mask(F, m, 0, 0, X.lerpc(VIO, WHT, 0.4), 0.34 * math.exp(-a / 1.1) * smooth(0, 0.08, a))


def dim_pre(F, r, t):
    k = dark_k(t)
    if k <= 0.01: return F
    return (F.astype(np.float32) * (1 - 0.45 * k)).astype(np.uint8)


# ------------------------------------------------------------------ additive layer
def add_finale(ad, r, t, c):
    if r is None or not r['fin']: return
    d = ad.d; tau = t - r['fs']; a = t - r['fe']
    col = TF.tc(r['ti'])
    if 0 <= tau < D_ and a < 0:
        q = tau / 0.45
        if q < 1: X.ring(d, TF.OX, TF.OY + 40, 30 + 300 * ease_out(q), 6 - 4 * q, col, 1 - q, ry=(30 + 300 * ease_out(q)) * 0.55)
        # the speed streaks of the first seconds (c['s'] is already reduced while the world goes quiet)
        s = c['s']
        if s > 0.1:
            n = 46; rr = X.rnd(77, n, 4); light = X.lerpc(col, WHT, 0.5)
            for k in range(n):
                ph = (float(rr[k, 1]) + t * (0.9 + 1.5 * s) * (0.7 + 0.6 * float(rr[k, 2]))) % 1.0
                rad = 250 + 700 * ph ** 1.8; ln = (8 + 120 * s) * (0.4 + rad / 600); ang = 2 * math.pi * float(rr[k, 0])
                x0 = TF.FOC[0] + math.cos(ang) * rad; y0 = TF.FOC[1] - 90 + math.sin(ang) * rad * 0.78
                x1 = TF.FOC[0] + math.cos(ang) * (rad + ln); y1 = TF.FOC[1] - 90 + math.sin(ang) * (rad + ln) * 0.78
                al = min(1.0, (rad - 240) / 160) * (0.35 + 0.5 * s) * (1 - ph ** 6)
                d.line([(x0, y0), (x1, y1)], fill=X.ck(light, al), width=2 if float(rr[k, 3]) < 0.7 else 3)
        # slow soft ripples as each dark world is passed
        for tcx, wk in T.cross_times(r):
            q = (t - tcx) / 1.5
            if 0 <= q < 1 and wk < 35:
                R = 60 + 520 * ease_out(q)
                X.ring(d, TF.OX, TF.OY + 20, R, 3, X.lerpc(LILAC, col, 0.3), (1 - q) * 0.30 * (1 - smooth(2.6, 4.2, tau) * 0.4))
        # the point of light
        if tau >= 3.0:
            px, py, e = light_pos(c['z']); I = intensity(tau); bt = beat(tau)
            inhale = 1 - 0.55 * smooth(12.0, 12.4, tau) * (1 - smooth(12.4, 12.6, tau))
            sz = (1 + 6.0 * ease_out((tau - 3.0) / 9.5) + 2.5 * bt) * inhale
            cc = X.lerpc(LILAC, WHT, 0.75)
            X.pxstar(d, px, py, max(1, int(round(sz))), X.ck(cc, I))
            if I > 0.3:
                L = (30 + 150 * ease_out((tau - 3.0) / 9.0) + 80 * bt) * I * inhale
                ang = 0.35 * tau
                for kk in range(4):
                    an = ang + kk * math.pi / 2
                    d.line([(px, py), (px + math.cos(an) * L, py + math.sin(an) * L * 0.9)], fill=X.ck(LILAC, 0.55 * I), width=1)
                    d.line([(px, py), (px - math.cos(an) * L * 0.5, py - math.sin(an) * L * 0.45)], fill=X.ck(LILAC, 0.35 * I), width=1)
            # particles falling into the light, and thin rings closing on it
            if 5.0 <= tau < 12.45:
                X.inward(d, tau, 5.0, 12.45, 36, 1200, px, py, 40, 190 + 120 * e ** 0.5, LILAC, 5)
                cyc = 1.7
                for kk in range(3):
                    q = (((tau - 5.0) / cyc) + kk / 3.0) % 1.0
                    X.ring(d, px, py, (40 + 300 * (1 - q) ** 1.4) * (0.4 + e ** 0.5), 2, LILAC, 0.55 * q * I * smooth(5.0, 6.5, tau))
            if 12.4 <= tau:                           # the opening: rings leave the point
                for kk, dl in enumerate((0.0, 0.16, 0.32)):
                    q = (tau - 12.4 - dl) / 1.0
                    if 0 < q < 1: X.ring(d, px, py, 30 + 600 * ease_out(q), 5 - 3 * q, X.lerpc(WHT, LILAC, 0.3 * kk), (1 - q) * 0.8)
    # ---- landing
    if a >= 0 and a < 6.5:
        cx, cy = CORE
        for k, (dl, colr) in enumerate(((0.0, WHT), (0.10, CYN), (0.22, PNK), (0.36, GOLD), (0.52, VIO), (0.70, WHT))):
            q = (a - dl) / 1.5
            if 0 < q < 1: X.ring(d, cx, cy, 20 + 1350 * ease_out(q), 11 - 8 * q, colr, (1 - q) * 0.95)
        for k, (dl, colr) in enumerate(((0.05, WHT), (0.3, GOLD))):
            q = (a - dl) / 1.1
            if 0 < q < 1: X.ring(d, TF.FEET[0], TF.FEET[1] - 2, 20 + 900 * ease_out(q), 6 - 4 * q, colr, (1 - q) * 0.8, ry=(20 + 900 * ease_out(q)) * 0.16)
        X.burst(d, a, 0.0, 190, 1300, cx, cy, 180, 780, 2.4, 140, 8, FOAM_COLS, drag=1.1, spread=0.25)
        X.burst(d, a, 0.18, 90, 1301, TF.OX, TF.OY, 120, 520, 1.8, 220, 8, ((255, 224, 140), WHT, GOLD), drag=1.3, spread=0.2)
        X.confetti(d, a, 0.35, 150, 1302, (GOLD, WHT, PNK, CYN, VIO, (255, 168, 214), (255, 224, 140)), 5.2, 20, 1260, -40, 210, 44, 11)
        TF.twinkle_stars(d, a, 0.0, 70, 1303, 640, 330, 40, 640, (WHT, (255, 214, 238), (154, 216, 255)), 6.0, 2)
        for k in range(10):
            an = a * 1.7 + k * 2 * math.pi / 10
            X.pxstar(d, TF.OX + math.cos(an) * 120, TF.OY + math.sin(an) * 52, 3, X.ck((255, 236, 170), smooth(0.2, 0.6, a) * (1 - smooth(4.5, 6.2, a))))
    # the card's own light streak and motes come from TF.add_card


D_ = T.FIN_DUR


# ------------------------------------------------------------------ pose
def pose_extra(pose, r, t):
    if r is None or not r['fin']: return pose
    tau = t - r['fs']; a = t - r['fe']
    p = dict(pose)
    if 0 <= tau < D_:
        h = T.fin_hush(tau)
        if h > 0.05:                                  # quiet: the explorer just floats and breathes
            br = math.sin(tau * 1.9)
            p.update(sx=1 - 0.012 * br * h, sy=1 + 0.016 * br * h, dx=0, dy=-3 * math.sin(tau * 1.1) * h, aura=1, glow=0.35 * h)
    if 0.12 <= a < 0.95:                              # a victory hop
        q = (a - 0.12) / 0.83
        p['dy'] = p.get('dy', 0) - 30 * 4 * q * (1 - q)
        p['aura'] = 2; p['glow'] = max(p.get('glow', 0), 0.9)
        p['sy'] = p['sy'] * (1 + 0.07 * math.sin(math.pi * q)); p['sx'] = p['sx'] * (1 - 0.04 * math.sin(math.pi * q))
    return p


# ------------------------------------------------------------------ the card for world 21
def finale_card(F, r, t):
    if r is None or not r['fin']: return
    tau = t - r['card']
    if not (0 <= tau < r['clen']): return
    n = r['clen']
    op = ease_out(tau / 0.4); cl = smooth(n - 0.7, n, tau)
    y0, y1 = 60, 346; nn = y1 - y0
    s = np.clip(np.sin(np.linspace(0, np.pi, nn)) * 1.6, 0, 1)
    al = (s * 0.76 * op * (1 - cl))[:, None, None].astype(np.float32)
    F[y0:y1] = (F[y0:y1].astype(np.float32) * (1 - al) + np.array((6, 5, 20), np.float32) * al).astype(np.uint8)
    # the perfect run: seven mythic squares light up one after another, above the name
    pa = smooth(0.4, 0.8, tau) * (1 - cl)
    X.put_text(F, 'PERFECT RUN \u00b7 7 OF 7 MYTHIC', 640, 120, 'sil', 14, (255, 214, 238), pa, ls=5, anchor='c')
    la = smooth(0.05, 0.35, tau) * (1 - cl)
    X.put_text(F, 'WORLD 21 / 21', 640, 160, 'sil', 18, GOLD, la, ls=7, anchor='c')
    top = (255, 247, 220); bot = GOLD
    TF.letters(F, 'PLANCK FOAM', 100, 600, 8 + 5 * smooth(0, n, tau), 640, 256, tau, 0.15, 0.06, top, bot, (74, 40, 0), GOLD, pop=1.2, glow=0.55 * (1 - cl),
               shine_at=((tau - 1.1) / 1.0 if tau < 3.4 else (tau - 4.6) / 1.0), alpha=1 - cl)
    sa = smooth(1.0, 1.5, tau) * (1 - cl)
    X.put_text(F, M.wworld(35)['desc'], 640, 298, 'px', 22, (226, 233, 252), sa, w=400, anchor='c')
    X.put_text(F, 'THEORY \u00b7 PLANCK LENGTH', 640, 328, 'sil', 12, GOLD, smooth(1.3, 1.8, tau) * (1 - cl), ls=3, anchor='c')
    X.put_text(F, 'TAP TO SKIP', 640, 690, 'sil', 11, (163, 176, 214), smooth(2.6, 3.2, tau) * (1 - cl) * 0.7, ls=3, anchor='c')

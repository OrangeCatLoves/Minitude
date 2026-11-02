"""Celebrations (one per rarity), charge-up, dive juice, landing impact, world title cards, intro title."""
import math, functools
import numpy as np
import cv2
from PIL import Image
import mini as M
import fx3 as X
import tl3 as T
from mini import (W, H, TIERS, FACTORS, PX, SIL, tw, clamp01, smooth, ease_out, ease_in_out, back_out, wworld, scene)

OX, OY = 840, 404            # explorer centre on screen
FOC = (840, 500)             # zoom focus on screen (ground under the explorer's feet)
FEET = (840, 504)
GEM = [64, 80, 92, 104, 116, 124]
HOP = [6, 8, 10, 12, 14, 16]
STOP = [0.0, 0.0, 0.0, 0.04, 0.09, 0.13]
SHAKE = [0.0, 0.0, 2.5, 4.5, 7.0, 10.0]
VIGK = [0.0, 0.0, 0.22, 0.34, 0.42, 0.50]
TITLES = {2: ('RARE!', 72), 3: ('EXOTIC!', 84), 4: ('LEGENDARY!', 90), 5: ('MYTHIC!', 104)}
TITLE_COL = {
    2: ((205, 240, 255), (79, 195, 255), (8, 34, 74), (79, 195, 255)),
    3: ((240, 224, 255), (181, 131, 255), (38, 16, 82), (181, 131, 255)),
    4: ((255, 244, 200), (255, 178, 63), (74, 40, 0), (255, 178, 63)),
    5: ((255, 236, 248), (255, 95, 176), (80, 16, 46), (255, 95, 176)),
}
STAMP = [80, 92, 104, 112, 120, 120]


def tc(ti):
    return TIERS[ti][4]


def gem_cy_rest(ti):
    return 296 - HOP[ti] - 8 - GEM[ti] / 2


def fx_tau(ti, tau):
    s = STOP[ti]
    if tau < 0.03: return tau
    if tau < 0.03 + s: return 0.03
    return tau - s


def tint(F, col, k):
    if k <= 0.01: return F
    return (F.astype(np.float32) * (1 - k) + np.array(col, np.float32) * k).astype(np.uint8)


@functools.lru_cache(512)
def gem_arr(ti, size):
    return np.asarray(M.gem(ti).resize((size, size), Image.NEAREST))


def env_of(ti, tau):
    hold = T.REV_HOLD[ti]
    return smooth(0, 0.10, tau) * (1 - smooth(hold - 0.45, hold + 0.25, tau))


# ------------------------------------------------------------------ explorer pose
def pose(t, c, r):
    sx = sy = 1.0; dy = 0.0; dx = 0.0; aura = 0; glow = 0.0
    ti = r['ti']
    if r['lock'] <= t < r['rev']:
        aura = 1
    tau = t - r['rev']
    if 0 <= tau < r['chg'] - r['rev'] + 0.01:
        q = clamp01(tau / 0.6)
        dy = -HOP[ti] * 4 * q * (1 - q)
        if tau < 0.07:                                  # tiny anticipation squash before the hop
            sy = 1 - 0.07 * math.sin(math.pi * tau / 0.07); sx = 1 + 0.04 * math.sin(math.pi * tau / 0.07)
        elif q < 1:
            sy = 1 + 0.06 * math.sin(math.pi * q); sx = 1 - 0.035 * math.sin(math.pi * q)
        aura = 2; glow = 0.35 + 0.1 * ti
    if r['chg'] <= t < r['fs']:
        q = ease_in_out((t - r['chg']) / T.CHARGE)
        sy = 1 - 0.10 * q; sx = 1 + 0.06 * q
        dx = round(math.sin(t * 90) * 1.2 * q)
        aura = 2; glow = 0.6 + 0.6 * q
    if r['fs'] <= t < r['fe']:
        tau = t - r['fs']
        la = math.exp(-tau * 7) * smooth(0, 0.04, tau)
        sy = 1 + 0.15 * la + 0.05 * c['s']; sx = 1 - 0.08 * la - 0.03 * c['s']
        aura = 2 if int(t * 12) % 2 == 0 else 1; glow = 0.5 + 0.5 * c['s']
    for rr in T.TL:
        if rr['fe'] <= t < rr['fe'] + 0.9:
            tau = t - rr['fe']; e = math.exp(-8 * tau)
            sy *= 1 - 0.17 * e * math.cos(2 * math.pi * 3.0 * tau) * smooth(0, 0.02, tau)
            sx *= 1 + 0.10 * e * math.cos(2 * math.pi * 3.0 * tau) * smooth(0, 0.02, tau)
            glow = max(glow, 0.5 * e)
    return dict(sx=sx, sy=sy, dx=dx, dy=dy, aura=aura, glow=glow)


# ------------------------------------------------------------------ backgrounds (before the explorer is drawn)
def bg_charge(F, r, t):
    if r['chg'] <= t < r['fs'] + 0.3:
        q = ease_in_out((t - r['chg']) / T.CHARGE) * (1 - smooth(r['fs'], r['fs'] + 0.3, t))
        X.radial_add(F, OX, OY + 10, 300, tc(r['ti']), 0.45 * q, 2.0)
    return F


def bg_reveal(F, r, t):
    ti = r['ti']; tau = t - r['rev']
    if tau < 0 or t >= r['chg'] + 0.7 or ti < 2: return F
    tf = fx_tau(ti, tau); k = env_of(ti, tau)
    if k <= 0.01: return F
    if ti == 2:
        F = tint(F, (6, 22, 54), 0.22 * k)
    elif ti == 3:
        F = tint(F, (22, 8, 52), 0.40 * k)
    elif ti == 4:
        F = tint(F, (36, 18, 0), 0.50 * k)
        m = X.sunburst_mask(OX, OY, 14, 0.30 * tf, 0.45) * X.radial_fall(OX, OY, 980) ** 0.7
        X.add_mask(F, m, 0, 0, (255, 190, 70), 0.50 * k)
    else:
        F = tint(F, (58, 8, 40), 0.86 * k)
        grow = ease_out(tf / 0.7)
        hm = X.halftone(OX, OY, grow).astype(np.float32)
        X.add_mask(F, hm, 0, 0, (255, 100, 180), 0.46 * k)
        m = X.sunburst_mask(OX, OY, 18, 0.18 * tf + 0.1, 0.5) * X.radial_fall(OX, OY, 1100) ** 0.55
        X.add_mask(F, m, 0, 0, (255, 95, 176), 0.66 * k)
        m2 = X.sunburst_mask(OX, OY, 18, 0.18 * tf + 0.1 + math.pi / 18, 0.5) * X.radial_fall(OX, OY, 800) ** 0.9
        X.add_mask(F, m2, 0, 0, (150, 40, 170), 0.40 * k)
    return F


# ------------------------------------------------------------------ additive effects
def twinkle_stars(d, t, t0, n, seed, cx, cy, rmin, rmax, cols, dur, size=2, rot=0.0):
    rr = X.rnd(seed, n, 5)
    for k in range(n):
        ph = (t - t0) * (2.2 + 2 * float(rr[k, 3])) + 6.28 * float(rr[k, 2])
        a = max(0.0, math.sin(ph)) ** 1.5
        if t - t0 < 0 or t - t0 > dur: continue
        ang = 2 * math.pi * float(rr[k, 0]) + rot
        rad = rmin + (rmax - rmin) * float(rr[k, 1])
        x = cx + math.cos(ang) * rad; y = cy + math.sin(ang) * rad * 0.9
        s = max(1, int(round(size * (0.6 + a))))
        X.pxstar(d, x, y, s, X.ck(cols[int(rr[k, 4] * len(cols)) % len(cols)], 0.35 + 0.65 * a))


def add_reveal(ad, r, t):
    ti = r['ti']; tau = t - r['rev']
    if tau < 0 or tau > T.REV_HOLD[ti] + 1.0: return
    tf = fx_tau(ti, tau); d = ad.d; i = r['i']
    col = tc(ti); gcy = gem_cy_rest(ti)
    if ti == 0:
        X.burst(d, tf, 0.0, 14, 100 + i, OX, gcy, 90, 210, 0.7, 380, 6, ((205, 214, 238), (154, 166, 191)), drag=2.2)
        q = tf / 0.45; X.ring(d, OX, OY, 14 + 120 * ease_out(q), 3, (154, 166, 191), 1 - q) if q < 1 else None
    elif ti == 1:
        q = tf / 0.55; X.ring(d, OX, OY, 14 + 180 * ease_out(q), 4, col, 1 - q) if q < 1 else None
        X.burst(d, tf, 0.0, 24, 200 + i, OX, gcy, 80, 260, 0.9, 300, 6, ((141, 255, 180), (70, 208, 120), (255, 255, 255)), -math.pi * 0.95, -math.pi * 0.05, drag=1.6)
        twinkle_stars(d, tf, 0.1, 7, 21, OX, gcy, 50, 100, ((141, 255, 180), (255, 255, 255)), 1.3, 2)
    elif ti == 2:
        for k, dl in enumerate((0.0, 0.14)):
            q = (tf - dl) / 0.6
            if 0 < q < 1: X.ring(d, OX, OY, 14 + 280 * ease_out(q), 5 - 2 * q, col, 1 - q)
        X.burst(d, tf, 0.0, 34, 300 + i, OX, gcy, 120, 340, 1.0, 320, 6, ((79, 195, 255), (154, 216, 255), (255, 255, 255)), drag=1.8)
        twinkle_stars(d, tf, 0.05, 9, 31, OX, gcy, 50, 150, ((154, 216, 255), (255, 255, 255)), 1.6, 2)
    elif ti == 3:
        for k, dl in enumerate((0.0, 0.12, 0.24)):
            q = (tf - dl) / 0.7
            if 0 < q < 1: X.ring(d, OX, OY, 14 + 420 * ease_out(q), 6 - 3 * q, col, 1 - q)
        if 0.04 < tf < 1.35:
            fade = 1 - smooth(0.8, 1.35, tf)
            X.lightning(d, tf, OX, OY - 30, 18, 4, 150, 430, X.ck((214, 170, 255), fade), 3)
        X.burst(d, tf, 0.0, 46, 400 + i, OX, gcy, 140, 420, 1.1, 300, 7, ((181, 131, 255), (216, 188, 255), (255, 255, 255)), drag=1.6)
        twinkle_stars(d, tf, 0.05, 12, 41, OX, gcy, 60, 200, ((216, 188, 255), (255, 255, 255)), 1.8, 2)
    elif ti == 4:
        for k, dl in enumerate((0.0, 0.1, 0.2, 0.3)):
            q = (tf - dl) / 0.8
            if 0 < q < 1: X.ring(d, OX, OY, 14 + 520 * ease_out(q), 7 - 4 * q, col, 1 - q)
        X.burst(d, tf, 0.0, 80, 500 + i, OX, gcy, 150, 470, 1.3, 300, 8, ((255, 178, 63), (255, 224, 140), (255, 255, 255)), drag=1.4)
        X.confetti(d, tf, 0.1, 44, 51, ((255, 210, 100), (255, 160, 40), (255, 245, 200)), 3.2, 160, 1120, -30, 230)
        twinkle_stars(d, tf, 0.05, 14, 61, OX, gcy, 70, 260, ((255, 224, 140), (255, 255, 255)), 2.4, 2)
        for k in range(5):
            a = tau * 1.6 + k * 2 * math.pi / 5
            X.pxstar(d, OX + math.cos(a) * 92, gcy + math.sin(a) * 40, 3, (255, 236, 170))
    else:
        for k, dl in enumerate((0.0, 0.22, 0.44)):
            q = (tf - dl) / 0.95
            if 0 < q < 1: X.ring(d, OX, OY, 14 + 1000 * ease_out(q), 9 - 6 * q, (255, 140, 200) if k != 1 else (255, 255, 255), 1 - q)
        X.burst(d, tf, 0.0, 130, 600 + i, OX, gcy, 180, 560, 1.5, 320, 8, ((255, 95, 176), (255, 168, 214), (255, 255, 255), (255, 224, 120)), drag=1.3, spread=0.2)
        X.confetti(d, tf, 0.15, 90, 71, ((255, 95, 176), (255, 168, 214), (255, 255, 255), (255, 224, 120), (190, 110, 255)), 3.9, 40, 1140, -30, 250)
        twinkle_stars(d, tf, 0.0, 40, 81, 640, 340, 40, 560, ((255, 255, 255), (255, 168, 214)), 4.2, 2)
        for k in range(8):
            a = tau * 2.0 + k * 2 * math.pi / 8
            X.pxstar(d, OX + math.cos(a) * 110, gcy + math.sin(a) * 46, 3, (255, 214, 238))


def add_charge(ad, r, t):
    if not (r['chg'] <= t < r['fs'] + 0.15): return
    ti = r['ti']; d = ad.d
    q = clamp01((t - r['chg']) / T.CHARGE)
    X.inward(d, t, r['chg'], r['fs'], 40 + 14 * ti, 900 + r['i'], OX, OY + 10, 80, 420, tc(ti), 7)
    if t >= r['chg'] + 0.45 and t < r['chg'] + 0.45 + 0.35:          # the gem is absorbed
        a = (t - r['chg'] - 0.45) / 0.35
        X.ring(d, OX, OY, 150 * (1 - ease_out(a)) + 20, 4, tc(ti), a)


def add_fall(ad, r, t, c):
    if not (r['fs'] <= t < r['fe'] + 0.05): return
    ti = r['ti']; d = ad.d; s = c['s']; tau = t - r['fs']
    col = tc(ti)
    # launch ring
    q = tau / 0.45
    if 0 <= q < 1: X.ring(d, OX, OY + 40, 30 + 300 * ease_out(q), 6 - 4 * q, col, 1 - q, ry=(30 + 300 * ease_out(q)) * 0.55)
    # speed streaks near the edge of the screen (the worlds stay visible in the middle)
    if s > 0.1:
        n = 46; rr = X.rnd(77, n, 4)
        light = X.lerpc(col, (255, 255, 255), 0.5)
        for k in range(n):
            ph = (float(rr[k, 1]) + t * (0.9 + 1.5 * s) * (0.7 + 0.6 * float(rr[k, 2]))) % 1.0
            rad = 250 + 700 * ph ** 1.8
            ln = (8 + 120 * s) * (0.4 + rad / 600)
            ang = 2 * math.pi * float(rr[k, 0])
            x0 = FOC[0] + math.cos(ang) * rad; y0 = FOC[1] - 90 + math.sin(ang) * rad * 0.78
            x1 = FOC[0] + math.cos(ang) * (rad + ln); y1 = FOC[1] - 90 + math.sin(ang) * (rad + ln) * 0.78
            a = min(1.0, (rad - 240) / 160) * (0.35 + 0.5 * s) * (1 - ph ** 6)
            d.line([(x0, y0), (x1, y1)], fill=X.ck(light, a), width=2 if float(rr[k, 3]) < 0.7 else 3)
    # sparks flying off the explorer (continuous emitter)
    if s > 0.05:
        n = 60; rr = X.rnd(91, n, 6)
        life = 0.55
        rate = 70.0
        # analytic emitter: particle k is reborn every n/rate seconds
        cyc = n / rate
        for k in range(n):
            off = k / rate
            age = (t - off) % cyc
            if age > life: continue
            ang = 2 * math.pi * float(rr[(k * 7) % n, 0])
            v = 160 + 360 * float(rr[k, 1]) * (0.5 + s)
            x = OX + math.cos(ang) * v * age; y = OY + math.sin(ang) * v * age * 0.85
            f = 1 - age / life
            sz = max(2, int(round((3 + 6 * float(rr[k, 3])) * (0.4 + 0.6 * f) / 2) * 2))
            d.rectangle([int(x - sz / 2), int(y - sz / 2), int(x + sz / 2) - 1, int(y + sz / 2) - 1],
                        fill=X.ck(X.lerpc(col, (255, 255, 255), 0.4 * float(rr[k, 4])), min(1.0, f * 1.5) * min(1.0, s * 2)))
    # a ring at every world boundary
    for tcx, wk in T.cross_times(r):
        q = (t - tcx) / 0.55
        if 0 <= q < 1:
            R = 40 + 900 * ease_out(q)
            X.ring(d, OX, OY, R, 8 - 6 * q, X.lerpc((255, 255, 255), col, 0.4), 1 - q)
            X.ring(d, OX, OY, R * 0.7, 4, col, (1 - q) * 0.7)


def add_land(ad, r, t):
    tau = t - r['fe']
    if not (0 <= tau < 1.2): return
    ti = r['ti']; d = ad.d
    q = tau / 0.6
    if q < 1:
        R = 20 + 420 * ease_out(q)
        X.ring(d, FEET[0], FEET[1] - 2, R, 6 - 4 * q, (255, 255, 255), (1 - q) * 0.9, ry=R * 0.16)
        X.ring(d, FEET[0], FEET[1] - 2, R * 0.6, 3, tc(ti), (1 - q) * 0.8, ry=R * 0.10)
    # dust puffs along the ground
    rr = X.rnd(123, 28, 6)
    for k in range(28):
        ang = math.pi * (0.04 + 0.92 * float(rr[k, 0])) + (math.pi if k % 2 else 0)
        v = 90 + 280 * float(rr[k, 1])
        age = tau - 0.03 * float(rr[k, 5])
        if age <= 0 or age > 0.7: continue
        dd = v * (1 - math.exp(-3.5 * age)) / 3.5
        x = FEET[0] + math.cos(ang) * dd * (1 if k % 2 == 0 else -1) * abs(math.cos(ang)) ** 0.3
        y = FEET[1] - 6 - 60 * float(rr[k, 2]) * ease_out(age / 0.5) + 70 * age * age
        f = 1 - age / 0.7
        sz = max(2, int(round((8 + 10 * float(rr[k, 3])) * (0.4 + 0.6 * f) / 2) * 2))
        d.rectangle([int(x - sz / 2), int(y - sz / 2), int(x + sz / 2) - 1, int(y + sz / 2) - 1], fill=X.ck((210, 200, 180), f * 0.55))
    if r['dz'] > 0 and tau < 0.9:
        X.burst(d, tau, 0.0, 26, 140 + r['i'], FEET[0], FEET[1] - 40, 80, 300, 0.8, 360, 6,
                (tc(ti), (255, 255, 255)), -math.pi * 0.95, -math.pi * 0.05, drag=1.8)


# ------------------------------------------------------------------ opaque front elements (gem, titles, stamp, pills, cards)
def chip_np(F, cx, base, label, ti, a):
    name, pts, bg, fg, ed = TIERS[ti]
    f = SIL(20)
    w_ = tw(f, label, 2) + 44; h_ = 42; x = cx - w_ / 2; y = base - 28
    X.rect_a(F, x - 4, y - 4, w_ + 8, h_ + 8, ed, 0.95 * a)
    X.rect_a(F, x, y, w_, h_, bg, 0.96 * a)
    X.rect_a(F, x, y, w_, 4, X.lerpc(ed, (255, 255, 255), 0.45), 0.9 * a)
    X.put_text(F, label, cx, y + 29, 'sil', 20, fg, a, ls=2, anchor='c')


def front_reveal(F, r, t):
    ti = r['ti']; tau = t - r['rev']
    if tau < 0 or t >= r['chg'] + 0.5: return
    name, pts, bg, fg, ed = TIERS[ti]
    hold = T.REV_HOLD[ti]
    gs = GEM[ti] * back_out(tau / 0.34)
    gcy = gem_cy_rest(ti) - 4 * math.sin(2 * math.pi * 0.8 * max(0, tau - 0.3))
    gcx = OX
    size_k = 1.0
    if t >= r['chg']:                          # the gem flies into the explorer
        q = ease_in_out((t - r['chg']) / 0.45)
        gcy = gcy + (OY - 30 - gcy) * q; size_k = 1 - 0.85 * q
    glow_k = (0.5 + 0.15 * ti) * min(1.0, tau / 0.2) * size_k
    X.radial_add(F, gcx, gcy, GEM[ti] * 1.5, ed, glow_k, 2.0)
    sz = max(4, int(gs * size_k))
    if sz >= 6:
        arr = gem_arr(ti, sz)
        X.blit(F, arr, int(gcx - sz / 2), int(gcy - sz / 2))
    ta = 1 - smooth(r['chg'], r['chg'] + 0.25, t)         # title leaves as the charge starts
    top = gem_cy_rest(ti) - GEM[ti] / 2
    if ti in TITLES:
        s_, size = TITLES[ti]
        tc_top, tc_bot, tc_out, tc_glow = TITLE_COL[ti]
        q = tau / 0.30
        scale = 1 + 1.4 * (1 - back_out(q, 1.4)) if q < 1 else 1 + 0.025 * math.sin(2 * math.pi * 1.2 * tau)
        base = top - 14
        shine = None
        if ti >= 4:
            ss = (tau - 0.55) / 0.9
            shine = ss if 0 <= ss <= 1 else None
        split = 0
        if ti == 3: split = int(6 * max(0, 1 - tau / 0.3))
        if ti == 5:
            split = int(10 * max(0, 1 - tau / 0.55)) * (1 if int(tau * 24) % 3 else -1)
        jit = 0
        if ti == 5 and tau < 0.5: jit = int(math.sin(tau * 130) * 6 * (1 - tau / 0.5))
        X.big_title(F, s_, size, OX + jit, base, scale, tc_top, tc_bot, tc_out, tc_glow, glow=0.55 if ti < 4 else 0.8, shine=shine, split=split, ls=3, alpha=ta * smooth(0, 0.06, tau))
    else:
        label = name
        q = clamp01(tau / 0.3)
        a = ease_out(q) * ta
        base = top - 16 + (1 - ease_out(q)) * 22
        chip_np(F, OX, base, label, ti, a)


def front_stamp(F, r, t):
    """The big divide-by stamp during the charge-up."""
    if not (r['chg'] + 0.05 <= t < r['fs'] + 0.45): return
    ti = r['ti']
    lab = FACTORS[ti].replace(' ', '')
    tau = t - (r['chg'] + 0.05)
    q = tau / 0.2
    sc = 1 + 1.6 * (1 - back_out(q, 1.6)) if q < 1 else 1.0
    a = smooth(0, 0.05, tau)
    out = smooth(r['fs'], r['fs'] + 0.4, t)
    sc *= 1 + 0.9 * out
    a *= 1 - out
    top, bot, outl, gl = X.lerpc((255, 255, 255), tc(ti), 0.15), tc(ti), X.ck(tc(ti), 0.18), tc(ti)
    cx = 480
    size = STAMP[ti]
    wd = PX(size, 700).getlength(lab) + 2 * len(lab)
    if wd > 540: size = int(size * 540 / wd)
    X.big_title(F, lab, size, cx, 372, sc, top, bot, outl, gl, glow=0.7, ls=2, alpha=a, w=700)
    X.put_text(F, 'SMALLER', cx, 372 + 40, 'sil', 22, (255, 255, 255), a * smooth(0.1, 0.3, tau), ls=4, anchor='c')


def front_gates(F, r, t):
    """Small pills for every world passed during the dive (the last one is shown as the big title card)."""
    ti = r['ti']; ct = T.cross_times(r)
    for n, (tcx, wk) in enumerate(ct):
        if n == len(ct) - 1: continue
        tau = t - tcx
        if 0 <= tau < 1.0:
            a = smooth(0, 0.10, tau) * (1 - smooth(0.62, 1.0, tau))
            wd = wworld(wk)
            label = '%d  %s' % (wk + 1, wd['name'])
            f = SIL(16); w_ = tw(f, label, 2) + 36
            y = 120 - 60 * ease_out(tau / 0.9)
            col = tc(ti)
            X.rect_a(F, 640 - w_ / 2 - 4, y - 4, w_ + 8, 44, col, 0.9 * a)
            X.rect_a(F, 640 - w_ / 2, y, w_, 36, (8, 12, 28), 0.92 * a)
            X.put_text(F, label, 640, y + 25, 'sil', 16, (255, 255, 255), a, ls=2, anchor='c')


@functools.lru_cache(None)
def accent(k):
    if M.is_void(k): return (160, 172, 255)
    if k == M.LAST_SLOT: return (255, 200, 87)
    im = cv2.resize(scene(k), (80, 45), interpolation=cv2.INTER_AREA)
    hsv = cv2.cvtColor(im, cv2.COLOR_RGB2HSV).astype(np.float32)
    h = hsv[..., 0] * 2 * math.pi / 180.0; wgt = hsv[..., 1] / 255.0 * hsv[..., 2] / 255.0 + 1e-3
    hx = (np.cos(h) * wgt).sum(); hy = (np.sin(h) * wgt).sum()
    hue = (math.atan2(hy, hx) % (2 * math.pi)) * 180 / (2 * math.pi)
    px = np.uint8([[[hue, 150, 255]]])
    rgb = cv2.cvtColor(px, cv2.COLOR_HSV2RGB)[0, 0]
    return tuple(int(v) for v in rgb)


def letters(F, s, size, w, ls, cx, base, tau, d0, step, top, bot, outline, glow_col, pop=1.2, glow=0.7, shine_at=None, depth=0, depth_col=None, alpha=1.0):
    """Letter-by-letter pop-in title. Returns nothing; composites into F."""
    f = PX(size, w)
    advs = [f.getlength(ch) + ls for ch in s]
    total = sum(advs) - ls
    x0 = cx - total / 2
    pad = 40
    cw = int(total + pad * 2); ch_ = int(size * 1.7 + pad)
    A = np.zeros((ch_, cw), np.float32); Hc = np.zeros((ch_, cw), np.float32)
    bx = pad; by = int(size * 1.15 + pad / 2)
    xx = 0.0
    for k, chh in enumerate(s):
        tl = tau - d0 - k * step
        adv = advs[k]
        if tl > 0 and chh != ' ':
            q = clamp01(tl / 0.28)
            sc = 1 + pop * (1 - ease_out(q)) * 1.0
            al = clamp01(tl / 0.07)
            m, px, py = X.tmask(chh, size, w, 0, 14)
            if abs(sc - 1) > 1e-3:
                m = cv2.resize(m, (max(2, int(m.shape[1] * sc)), max(2, int(m.shape[0] * sc))), interpolation=cv2.INTER_LINEAR)
            gw = f.getlength(chh)
            gcx = bx + xx + gw / 2; gcy = by - size * 0.35 + (1 - ease_out(q)) * -14
            ox = int(gcx - (px + gw / 2) * sc); oy = int(gcy - (py - size * 0.35) * sc)
            heat = max(0.0, 1 - tl / 0.45)
            h_, w_ = m.shape
            ax0 = max(0, ox); ay0 = max(0, oy); ax1 = min(cw, ox + w_); ay1 = min(ch_, oy + h_)
            if ax1 > ax0 and ay1 > ay0:
                sub = m[ay0 - oy:ay1 - oy, ax0 - ox:ax1 - ox] * al
                A[ay0:ay1, ax0:ax1] = np.maximum(A[ay0:ay1, ax0:ax1], sub)
                Hc[ay0:ay1, ax0:ax1] = np.maximum(Hc[ay0:ay1, ax0:ax1], sub * heat)
        xx += adv
    if A.max() <= 0.01: return
    X0 = int(x0 - bx); Y0 = int(base - by)
    k_ = max(3, int(size / 22))
    dil = cv2.dilate(A, np.ones((k_ * 2 + 1, k_ * 2 + 1), np.uint8))
    if glow > 0:
        gl = cv2.GaussianBlur(cv2.dilate(A, np.ones((5, 5), np.uint8)), (0, 0), max(6, size / 7))
        X.add_mask(F, gl, X0, Y0, glow_col, glow * alpha)
    if depth:
        sh = np.zeros_like(dil); sh[depth:, depth:] = dil[:-depth, :-depth]
        X.comp_mask(F, sh, X0, Y0, depth_col or (0, 0, 0), 0.9 * alpha)
    X.comp_mask(F, dil, X0, Y0, outline, alpha)
    X.comp_mask(F, A, X0, Y0, None, alpha, grad=(top, bot))
    X.add_mask(F, Hc, X0, Y0, (255, 255, 255), 0.95 * alpha)
    if shine_at is not None and 0 <= shine_at <= 1:
        yy, xx_ = np.mgrid[0:ch_, 0:cw].astype(np.float32)
        pos = -0.2 * cw + shine_at * 1.4 * cw
        band = np.clip(1 - np.abs((xx_ + yy * 0.55) - pos) / (0.06 * cw), 0, 1)
        X.add_mask(F, A * band, X0, Y0, (255, 255, 255), 0.8 * alpha)


def add_card(ad, r, t):
    """Light streak and drifting motes for the world title card."""
    if not r['card_on']: return
    tau = t - r['card']
    if not (0 <= tau < r['clen']): return
    k = r['z1']; acc = accent(k); d = ad.d; cy = 178
    cl = 1 - smooth(r['clen'] - 0.6, r['clen'], tau)
    q = tau / 0.55
    if q < 1:                                   # a bright line shoots out of the centre as the band opens
        ln = 700 * ease_out(q)
        d.rectangle([640 - ln, cy - 2, 640 + ln, cy + 1], fill=X.ck(X.lerpc(acc, (255, 255, 255), 0.6), 1 - q))
    rr = X.rnd(333, 34, 5)
    for n in range(34):
        life = 2.0 + 1.2 * float(rr[n, 2])
        age = (tau * 0.9 + float(rr[n, 3]) * life) % life
        x = 120 + 1040 * float(rr[n, 0]) + 18 * math.sin(age * 2 + n)
        y = cy + 90 - age / life * 190
        f = math.sin(math.pi * age / life) ** 1.5
        s = 2 if float(rr[n, 4]) < 0.7 else 4
        d.rectangle([int(x), int(y), int(x) + s - 1, int(y) + s - 1], fill=X.ck(X.lerpc(acc, (255, 255, 255), 0.4), f * 0.9 * cl * smooth(0.2, 0.6, tau)))


def title_card(F, r, t):
    if r['dz'] == 0: return
    tau = t - r['card']
    if not (0 <= tau < T.CARD_LEN): return
    k = r['z1']; wd = wworld(k)
    op = ease_out(tau / 0.32)
    cl = smooth(T.CARD_LEN - 0.6, T.CARD_LEN, tau)
    cy = 178; h = 196 * op
    acc = accent(k)
    X.shade(F, 0, cy - h / 2, W, cy + h / 2, (4, 7, 18), 0.64 * (1 - cl))
    X.rect_a(F, 0, cy - h / 2, W, 3, acc, 0.9 * (1 - cl)); X.rect_a(F, 0, cy + h / 2 - 3, W, 3, acc, 0.9 * (1 - cl))
    # faint giant numeral behind the name
    X.put_text(F, str(k + 1), 1010, cy + 78, 'px', 230, acc, 0.10 * op * (1 - cl), w=700, anchor='c')
    la = smooth(0.05, 0.3, tau) * (1 - cl)
    lab = 'WORLD %d / 36' % (k + 1)
    X.put_text(F, lab, 640, cy - 56, 'sil', 20, acc, la, ls=6, anchor='c')
    lw = tw(SIL(20), lab, 6) / 2 + 30
    ln = 240 * ease_out((tau - 0.1) / 0.45)
    X.rect_a(F, 640 - lw - ln, cy - 63, ln, 3, acc, 0.8 * la); X.rect_a(F, 640 + lw, cy - 63, ln, 3, acc, 0.8 * la)
    for sx_ in (640 - lw - 8, 640 + lw + 8):
        X.rect_a(F, sx_ - 5, cy - 68, 10, 10, (255, 255, 255), 0.9 * la)
    top = X.lerpc((255, 255, 255), acc, 0.22); bot = acc
    nm = wd['name']
    ls_ = 7 + 5 * smooth(0, T.CARD_LEN, tau)
    letters(F, nm, 84, 500, ls_, 640, cy + 30, tau, 0.12, 0.05, top, bot, X.ck(acc, 0.16), acc, pop=1.1, glow=0.8 * (1 - cl), shine_at=((tau - 0.95) / 0.9 if tau < 3.0 else (tau - 3.9) / 0.9), alpha=1 - cl)
    sub = wd['desc']
    sa = smooth(0.8, 1.2, tau) * (1 - cl)
    X.put_text(F, sub, 640, cy + 66, 'px', 22, (226, 233, 252), sa, w=400, anchor='c')
    if wd['inv']:
        X.put_text(F, 'INVENTED WORLD · ART ONLY', 640, cy + 90, 'sil', 13, (255, 200, 87), sa, ls=3, anchor='c')
    elif k == 35:                                       # the bottom: only a perfect run (7 Mythic answers) gets here
        X.put_text(F, 'PERFECT RUN · 7 × MYTHIC = 700 PTS ENDS HERE', 640, cy + 90, 'sil', 13, (255, 200, 87), sa, ls=3, anchor='c')
    else:
        x0 = 640 - 36 * 5
        ra = smooth(1.0, 1.4, tau) * (1 - cl)
        for j in range(36):
            hh = 12 if j == k else 6
            col = (255, 255, 255) if j == k else (acc if j < k else (60, 78, 130))
            X.rect_a(F, x0 + j * 10, cy + 92 - hh, 4, hh, col, ra * (0.95 if j <= k else 0.55))


def front_intro(F, t):
    """Title lockup over the room (left side) with a soft shade behind it. Chapter 2 swaps the words and the colours."""
    best = M.RUN != 'main'
    a_in = smooth(0.3, 0.9, t); out = smooth(INTRO_EXIT, INTRO_EXIT + 0.6, t)
    X.shade(F, 0, 0, 820, 720, (4, 7, 18), 0.66 * a_in * (1 - out), 0.0, axis=1)
    if t < 0.4: return
    if not best:
        top = (255, 241, 196); bot = (255, 200, 87)
        letters(F, 'MINITUDE', 120, 700, 8, 400 - 20 * out * 0, 262, t - 0.4, 0.0, 0.07, top, bot, (74, 40, 0), (255, 200, 87), pop=1.4, glow=0.55 * (1 - out), depth=6, depth_col=(138, 90, 0), alpha=1 - out)
        lab = 'DAILY EXPEDITION · ' + M.DATE; tag = 'Answer rare. Shrink far.'; lc = (91, 224, 255)
    else:
        top = (255, 236, 248); bot = (255, 95, 176)
        letters(F, 'BEST CASE', 112, 500, 8, 400, 262, t - 0.4, 0.0, 0.07, top, bot, (80, 16, 46), (255, 95, 176), pop=1.4, glow=0.6 * (1 - out), depth=6, depth_col=(120, 24, 70), alpha=1 - out)
        lab = 'SAME QUESTIONS · SEVEN MYTHIC ANSWERS'; tag = 'The last 4 answers reach world 36.'; lc = (255, 168, 214)
    sa = smooth(1.3, 1.8, t) * (1 - out)
    X.put_text(F, lab, 56, 150, 'sil', 16, lc, sa, ls=2)
    X.put_text(F, tag, 56, 330, 'px', 40 if not best else 34, (238, 242, 255), smooth(1.5, 2.1, t) * (1 - out), w=500)


INTRO_EXIT = 5.15

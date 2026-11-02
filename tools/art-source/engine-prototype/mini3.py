"""Minitude walkthrough v3: pure function render(t) -> RGB uint8 frame (720, 1280, 3).

Layout: the world fills the screen (buffer rows 60..719 -> screen rows 0..659). A translucent HUD sits on top, a depth gauge on
the right edge, a field-note caption bottom-left, and the command bar (question / roll / result) slides up from the bottom and
slides away for the dive.
"""
import math, functools
import numpy as np
import cv2
from PIL import Image, ImageDraw
import mini as M
import fx3 as X
import tl3 as T
import ui3 as U
import tfx3 as TF
from mini import (W, H, FX, FY, C, INK, PANEL, DEEP, EDGE, EDGE2, HI, LO, TXT, DIM, DIMMER, AMBER, AMB_D, CYAN, WHITE, GREEN, GREEN_D,
                  TIERS, FACTORS, PR, DATE, PX, SIL, tw, text, rect, notch, panel, button, clamp01, smooth, ease_out, ease_in_out,
                  back_out, fmt, size_of, unit_of, nice_bar, wworld, NOTE_BODY)
from tl3 import TL, INTRO, REPORT, TOTAL
from ui3 import rect

cv2.setNumThreads(1)
ROW0 = 60
FPS = 60


# ------------------------------------------------------------------ world (v2 zoom chain, pulse applied to both layers)
def world_layer3(z, pulse=1.0):
    j, f = M.world_of(z)
    j = min(j, 35)
    Zo = (10 ** f) * pulse
    frame = M.remap(M.scene(j), Zo, 0, W, 0, H).astype(np.float32)
    if f > 1e-4 and j < 35:
        Zi = 10 ** (f - 1) * pulse
        left = FX - Zi * FX; right = FX + Zi * (W - FX); top = FY - Zi * FY; bottom = FY + Zi * (H - FY)
        x0 = int(max(0, math.floor(left))); x1 = int(min(W, math.ceil(right)))
        y0 = int(max(0, math.floor(top))); y1 = int(min(H, math.ceil(bottom)))
        if x1 - x0 > 1 and y1 - y0 > 1:
            patch = M.remap(M.inner_scene(j + 1), Zi, x0, x1, y0, y1).astype(np.float32)
            k_ = smooth(M.HAND_OFF, 1.0, f)
            if k_ > 1e-4:
                patch = patch * (1 - k_) + M.remap(M.scene(j + 1), Zi, x0, x1, y0, y1).astype(np.float32) * k_
            Xs = np.arange(x0, x1, dtype=np.float32)[None, :] + 0.5; Ys = np.arange(y0, y1, dtype=np.float32)[:, None] + 0.5
            fw = M.FEATHER * 4 * Zi
            fl = max(1.0, min(fw, left)); fr = max(1.0, min(fw, W - right)); ft = max(1.0, min(fw, top)); fb = max(1.0, min(fw, H - bottom))
            dist = np.minimum(np.minimum((Xs - left) / fl, (right - Xs) / fr), np.minimum((Ys - top) / ft, (bottom - Ys) / fb))
            a_ = np.clip(dist, 0, 1); a_ = a_ * a_ * (3 - 2 * a_)
            a_ = (a_ * smooth(0.0, M.FADE_IN, f))[..., None]
            bg = frame[y0:y1, x0:x1]
            frame[y0:y1, x0:x1] = bg * (1 - a_) + patch * a_
    return np.clip(frame, 0, 255).astype(np.uint8)


@functools.lru_cache(None)
def exp_arr(aura):
    ex, ox, oy = M.explorer(aura)
    return np.ascontiguousarray(np.asarray(ex)), ox, oy - ROW0


def put_explorer(F, p):
    arr, ox, oy = exp_arr(p['aura'])
    h, w = arr.shape[:2]
    fx = ox + w / 2; fy = oy + h
    sx, sy = p['sx'], p['sy']
    if abs(sx - 1) > 0.002 or abs(sy - 1) > 0.002:
        arr = cv2.resize(arr, (max(2, int(round(w * sx))), max(2, int(round(h * sy)))), interpolation=cv2.INTER_NEAREST)
    x0 = int(round(fx - arr.shape[1] / 2 + p['dx'])); y0 = int(round(fy - arr.shape[0] + p['dy']))
    X.blit(F, arr, x0, y0)


# ------------------------------------------------------------------ global effects: shake, flash, vignette
def shake_amp(t, c):
    a = 0.0
    for r in TL:
        ti = r['ti']; tau = t - r['rev'] - TF.STOP[ti]
        if tau > 0 and TF.SHAKE[ti] > 0 and tau < 2.0:
            a += TF.SHAKE[ti] * math.exp(-tau / (0.18 if ti < 5 else 0.34))
        tau = t - r['fs']
        if 0 < tau < 1.0: a += 3.0 * math.exp(-tau / 0.12)
        if not r['fin']:
            for tcx, _ in T.cross_times(r):
                tau = t - tcx
                if 0 < tau < 0.6: a += 2.6 * math.exp(-tau / 0.10)
        tau = t - r['fe']
        if r['fin']:
            if 0 < tau < 2.2: a += 15.0 * math.exp(-tau / 0.38)
        elif 0 < tau < 1.0: a += (6.5 if r['dz'] > 0 else 2.5) * math.exp(-tau / 0.15)
    if c['fall'] is not None: a += 2.4 * c['s']
    return a


def flash_at(t):
    items = []
    for r in TL:
        ti = r['ti']; tau = t - r['rev']
        if 0 <= tau < 1.2:
            A0 = [0.0, 0.10, 0.17, 0.30, 0.50, 0.95][ti]
            dur = [0.1, 0.12, 0.14, 0.18, 0.22, 0.30][ti]
            colr = X.lerpc((255, 255, 255), TF.tc(ti), [0, 0.5, 0.3, 0.4, 0.45, 0.0][ti])
            items.append((colr, A0 * math.exp(-max(0, tau - TF.STOP[ti]) / dur) * smooth(0, 0.01, tau)))
            if ti == 5:
                tau2 = tau - 0.45
                if 0 < tau2 < 1: items.append(((255, 120, 190), 0.42 * math.exp(-tau2 / 0.2)))
        tau = t - r['fs']
        if 0 <= tau < 0.4: items.append((X.lerpc((255, 255, 255), TF.tc(ti), 0.4), 0.22 * math.exp(-tau / 0.10)))
        if not r['fin']:
            for tcx, _ in T.cross_times(r):
                tau = t - tcx
                if 0 <= tau < 0.4: items.append((X.lerpc((255, 255, 255), TF.tc(ti), 0.25), 0.16 * math.exp(-tau / 0.09)))
        tau = t - r['fe']
        if r['fin']:
            ts_ = t - r['fs']
            if ts_ > T.FIN_DUR - 0.4 and tau < 0: items.append(((240, 232, 255), 0.38 * smooth(T.FIN_DUR - 0.4, T.FIN_DUR, ts_)))
            if 0 <= tau < 1.8: items.append(((250, 246, 255), 0.78 * math.exp(-max(0.0, tau - 0.06) / 0.17)))
        elif 0 <= tau < 0.5: items.append(((255, 255, 255), (0.20 if r['dz'] > 0 else 0.08) * math.exp(-tau / 0.09)))
    if not items: return None
    tot = min(0.95, sum(a for _, a in items))
    if tot < 0.01: return None
    colr = max(items, key=lambda x: x[1])[0]
    return colr, tot


def vignette_at(t, c):
    items = []
    for r in TL:
        ti = r['ti']; tau = t - r['rev']
        if 0 <= tau < T.REV_HOLD[ti] + 0.8 and TF.VIGK[ti] > 0:
            k = TF.VIGK[ti] * TF.env_of(ti, tau)
            items.append((X.ck(TIERS[ti][2], 0.5), k))
        if r['chg'] <= t < r['fs']:
            items.append((INK, 0.35 * ease_in_out((t - r['chg']) / T.CHARGE)))
    if c['fall'] is not None:
        items.append((INK, 0.55 * c['s']))
    rf = T.TL[-1]
    if rf['fin'] and rf['fs'] <= t < rf['fe']:
        items.append(((8, 4, 26), 0.66 * T.fin_hush(t - rf['fs'])))
    if not items: return None
    tot = min(0.85, sum(k for _, k in items))
    colr = max(items, key=lambda x: x[1])[0]
    return colr, tot


# ------------------------------------------------------------------ plans (what is on screen when)
def bar_plan(t):
    """(y_top, [(mode_img_fn, weight)...]) for the command bar, or None."""
    if t < INTRO:
        v = ease_out((t - 1.4) / 0.6) * (1 - ease_in_out((t - 5.25) / 0.45))
        if v <= 0.005: return None
        return 720 - U.BAR_H * v, [(lambda: U.bar_intro(t), 1.0)]
    r = T.cur_rec(t)
    if t >= REPORT:
        v = ease_out((t - REPORT - 0.4) / 0.5)
        if v <= 0.005: return None
        return 720 - U.BAR_H * v, [(lambda: U.bar_report(t - REPORT), 1.0)]
    v = ease_out((t - r['start']) / 0.55) * (1 - ease_in_out((t - (r['chg'] - 0.05)) / 0.35))
    if t > r['chg'] + 0.35 or v <= 0.005: return None
    y = 720 - U.BAR_H * v
    if t < r['roll']:
        return y, [(lambda: U.bar_ask(t, r, t >= r['chk']), 1.0)]
    if t < r['rev']:
        k = clamp01((t - r['roll']) / 0.18)
        if k < 1: return y, [(lambda: U.bar_ask(t, r, True), 1 - k), (lambda: U.bar_roll(t, r), k)]
        return y, [(lambda: U.bar_roll(t, r), 1.0)]
    return y, [(lambda: U.bar_result(t, r), 1.0)]


def slim_plan(t):
    for r in TL:
        a = ease_out((t - (r['chg'] + 0.3)) / 0.3) * (1 - ease_in_out((t - (r['fe'] + 0.15)) / 0.35))
        if r['chg'] + 0.3 <= t < r['fe'] + 0.5 and a > 0.005:
            return r, a
    return None


def caption_plan(t):
    """(world index, body override, alpha) of the field note caption, or None."""
    for r in TL:
        a0, a1 = r['start'] + 0.45, r['rev'] - 0.1
        if a0 <= t < a1 + 0.3:
            a = ease_out((t - a0) / 0.35) * (1 - smooth(a1, a1 + 0.3, t))
            if a > 0.01: return M.world_of(r['z0'])[0], NOTE_BODY.get(r['i']), a
    r = TL[-1]
    a0, a1 = r['card'] + T.CARD_LEN - 0.3, REPORT - 0.15           # after the world card has gone, the note stays up T.FINAL_READ
    if a0 <= t < a1 + 0.3:
        a = ease_out((t - a0) / 0.35) * (1 - smooth(a1, a1 + 0.3, t))
        if a > 0.01: return M.world_of(r['z1'])[0], None, a
    return None


def hud_state(t, c):
    nsq = 0
    for rr in TL:
        if t >= rr['rev'] + 0.4: nsq = rr['i'] + 1
    r = T.cur_rec(t)
    rnd = r['i'] + 1 + (1 if (t >= r['fe'] and r['i'] < 6) else 0)
    cur_open = nsq if nsq < 7 else -1
    return dict(rnd=min(rnd, 7), nsq=nsq, cur_open=cur_open, score=T.score_at(t), size_txt=fmt(size_of(c['u'])))


# ------------------------------------------------------------------ report screen (the world stays visible behind a dimmer)
def draw_report(d, tr):
    a = ease_out(tr / 0.6); x = 40 - (1 - a) * 760
    y0 = 84; h = 496
    panel(d, x, y0, 720, h)
    text(d, x + 28, y0 + 38, 'YOU SHRANK TO', SIL(14, False), DIM, 1)
    best = M.RUN != 'main'
    text(d, x + 28, y0 + 38 + 84, '170 am' if not best else '1.7 × 10⁻³⁵ m', PX(84 if not best else 62, 700), CYAN)
    text(d, x + 28, y0 + 38 + 84 + 34, 'Smaller than a proton.' if not best else 'About one Planck length.', PX(24, 400), TXT)
    sc = int(round((320 if not best else 700) * ease_out((tr - 0.7) / 1.0)))
    text(d, x + 692, y0 + 38 + 62, '%d' % sc, PX(56, 700), WHITE, 0, 'r')
    text(d, x + 692, y0 + 38 + 62 + 26, '/ 700', PX(24, 400), DIM, 0, 'r')
    text(d, x + 692, y0 + 38 + 62 + 56, ('Deepest world: Quark Sea (17 of 36)' if not best else 'Deepest world: Planck Foam (36 of 36)'), PX(20, 500), AMBER, 0, 'r')
    ry0 = y0 + 38 + 84 + 34 + 26
    for i, pr in enumerate(PR):
        ra = ease_out((tr - 1.0 - 0.28 * i) / 0.35)
        if ra <= 0: continue
        ry = ry0 + i * 44 + (1 - ra) * 16
        ti = pr['tier']; name, pts, bg, fg, ed = TIERS[ti]
        rect(d, x + 28, ry, 664, 40, DEEP)
        text(d, x + 28 + 12, ry + 26, str(i + 1), SIL(14), DIM, 0)
        text(d, x + 28 + 12 + 40, ry + 27, pr['cat'].title(), PX(17, 400), DIM)
        text(d, x + 28 + 12 + 40 + 200, ry + 28, pr['ans'], PX(21, 500), WHITE)
        notch(d, x + 28 + 664 - 12 - 48 - 10 - 124, ry + 7, 124, 26, bg, ed, 2)
        text(d, x + 28 + 664 - 12 - 48 - 10 - 62, ry + 25, name, SIL(12), fg, 1, 'c')
        text(d, x + 28 + 664 - 12, ry + 28, str(pts), PX(22, 700), WHITE, 0, 'r')
    sa = ease_out((tr - 0.4) / 0.6); sx = 908 + (1 - sa) * 400
    panel(d, sx, y0, 248, 304)
    text(d, sx + 20, y0 + 36, 'SHARE (NO SPOILERS)', SIL(12), AMBER, 1)
    rect(d, sx + 20 - 2, y0 + 52, 212, 154, EDGE2); rect(d, sx + 20, y0 + 54, 208, 150, INK)
    text(d, sx + 32, y0 + 54 + 32, 'MINITUDE DAILY', PX(17, 700), AMBER, 0)
    for i, pr in enumerate(PR):
        rect(d, sx + 32 + i * 28, y0 + 54 + 52, 24, 24, TIERS[pr['tier']][4])
    text(d, sx + 32, y0 + 54 + 112, '320 pts · 170 am' if not best else '700 pts · world 36', PX(19, 400), TXT)
    button(d, sx + 20, y0 + 54 + 150 + 24, 208, 52, 'COPY RESULT', False, 15)


def draw_hud_daily(d, oy=0):
    stext = U.stext
    stext(d, 32, oy + 40, 'MINITUDE', PX(28, 700), AMBER, 3)
    stext(d, 640, oy + 38, 'DAILY EXPEDITION · ' + DATE, SIL(18), TXT, 1, 'c')
    stext(d, 1252, oy + 38, '7 / 7 DONE', SIL(14, False), DIM, 1, 'r')


# ------------------------------------------------------------------ main render
def render(t):
    t = max(0.0, min(t, TOTAL - 1e-6))
    c = T.cam(t)
    r = T.cur_rec(t)
    intro = t < INTRO; report = t >= REPORT
    # ---- world
    wf = world_layer3(c['z'], c['pulse'])[ROW0:]
    if c['fall'] is not None:
        s = c['s']
        wf = X.zoom_blur(np.ascontiguousarray(wf), TF.FOC[0], TF.FOC[1], 0.05 * s, 5)
        wf = X.aberrate(wf, TF.FOC[0], TF.FOC[1], 0.011 * s)
    F = np.empty((H, W, 3), np.uint8); F[:wf.shape[0]] = wf
    nb = H - wf.shape[0]
    refl = wf[wf.shape[0] - nb - 4:wf.shape[0] - 4][::-1].astype(np.float32)          # the ground carries on as a darkening reflection
    F[wf.shape[0]:] = (refl * np.linspace(0.62, 0.22, nb, dtype=np.float32)[:, None, None]).astype(np.uint8)
    # ---- backgrounds, explorer
    if not intro and not report:
        F = TF.bg_reveal(F, r, t)
        F = TF.bg_charge(F, r, t)
        pose = TF.pose(t, c, r)
        ph = dict(pose)
    else:
        pose = dict(sx=1.0, sy=1.0, dx=0, dy=0, aura=0, glow=0.0)
        if intro and 4.9 < t < 5.6: pose['aura'] = 1
        ph = pose
    if intro or report:
        pass
    put_explorer(F, pose)
    # ---- additive light
    ad = None
    if not intro and not report:
        ad = X.Add()
        TF.add_reveal(ad, r, t); TF.add_charge(ad, r, t); TF.add_fall(ad, r, t, c); TF.add_land(ad, r, t)
        for rr in TL:
            if rr['card'] - 0.01 <= t < rr['card'] + T.CARD_LEN: TF.add_card(ad, rr, t)
        F = ad.apply(F)
    # ---- vignette
    if not intro and not report:
        v = vignette_at(t, c)
        if v: F = X.vignette(F, v[0], v[1])
    # ---- front elements (numpy)
    if intro:
        TF.front_intro(F, t)
    elif not report:
        TF.front_reveal(F, r, t)
        TF.front_stamp(F, r, t)
        TF.front_gates(F, r, t)
        TF.title_card(F, r, t)
        for rr in TL:
            if rr['i'] != r['i'] and rr['card'] <= t < rr['card'] + T.CARD_LEN:
                TF.title_card(F, rr, t)
    else:
        tr = t - REPORT
        X.shade(F, 0, 0, W, H, (4, 7, 18), 0.50 * ease_out(tr / 0.6))
    # ---- translucent panels
    show_ui = t >= INTRO - 0.4
    hud_oy = -76 * (1 - ease_out((t - (INTRO - 0.4)) / 0.6))
    gox = int(160 * (1 - ease_out((t - (INTRO - 0.2)) / 0.7)))
    if show_ui:
        X.shade(F, 0, max(0, 0 + hud_oy), W, 76 + hud_oy, INK, 0.80, 0.0)
        U.gauge_shade(F, gox)
    cap = None
    if not intro and not report or (report and False):
        cp = caption_plan(t)
        if cp:
            k, body, a = cp
            y, h, lines = U.caption_shade(F, k, body, 578, a)
            cap = (k, body, y, h, lines, a)
    sp = None if (intro or report) else slim_plan(t)
    if sp:
        sr, sa = sp
        X.shade(F, 0, 720 - 56 * sa, W, 720, INK, 0.86)
    # ---- PIL drawing
    im = Image.fromarray(F); d = ImageDraw.Draw(im); d._image = im
    if show_ui:
        if report: draw_hud_daily(d, hud_oy)
        else: U.draw_hud(d, t, hud_state(t, c), hud_oy)
        tip = 0.0
        if not intro and not report and r['i'] == 0:
            tip = smooth(INTRO + 1.0, INTRO + 1.5, t) * (1 - smooth(r['lock'] - 0.5, r['lock'], t))
        chip = not (not intro and not report and r['rev'] <= t < r['chg'] + 0.4)
        for rr in TL:
            if rr['dz'] > 0 and rr['card'] - 0.05 <= t < rr['card'] + T.CARD_LEN - 0.2: chip = False
        U.draw_gauge(d, t, c, r, gox, final=report, tip=tip, chip=chip)
    if cap:
        k, body, y, h, lines, a = cap
        U.draw_caption(d, k, body, y, h, lines, a)
    # explorer tag + scale bar (hidden while the reveal stack and title card use that space)
    tag = True
    if not intro and not report:
        if r['roll'] - 0.15 <= t < r['fs'] - 0.05: tag = False
        for rr in TL:
            if rr['dz'] > 0 and rr['card'] - 0.05 <= t < rr['card'] + T.CARD_LEN - 0.2: tag = False
    if report: tag = False
    if intro and t < 0.8: tag = False
    if tag:
        S = size_of(c['u'])
        falling = c['fall'] is not None or (not intro and not report and r['fs'] - 0.0 <= t < r['fe'])
        if falling: U.draw_tag(d, 'YOU: ' + fmt(S), AMBER)
        else: U.draw_tag(d, 'YOU: ' + fmt(S), CYAN)
    if not report and (not intro or t > 1.0):
        L, B, flash = T.bar_state(t)
        sx_end = U.draw_scalebar(d, L, fmt(B), flash)
        for rr in TL:
            if rr['fe'] <= t < rr['fe'] + 2.2:
                S0 = size_of(rr['u0']); S1 = size_of(rr['u1'])
                n0 = unit_of(nice_bar(S0) * 1.0000001)[1]; n1 = unit_of(nice_bar(S1) * 1.0000001)[1]
                if n0 != n1:
                    ca = ease_out((t - rr['fe']) / 0.3) * (1 - smooth(1.8, 2.2, t - rr['fe']))
                    if ca > 0.02: U.new_scale_chip(d, sx_end, 500 + (1 - ca) * 10, n0, n1, ca)
    # command bar
    bp = bar_plan(t)
    if bp:
        y_top, parts = bp
        arr = None
        for fn, wgt in parts:
            a_ = fn().astype(np.float32)
            arr = a_ * wgt if arr is None else arr + a_ * wgt
        arr = arr.astype(np.uint8)
        im.paste(Image.fromarray(arr), (0, int(round(y_top))))
    if sp:
        sr, sa = sp
        y = 720 - 56 * sa
        ti = sr['ti']; col = TF.tc(ti)
        rect(d, 0, int(y), W, 3, X.ck(col, 0.8))
        pul = 0.6 + 0.4 * math.sin(t * 10)
        d.polygon([(34, y + 22), (54, y + 22), (44, y + 40)], fill=X.ck(AMBER, pul))
        text(d, 70, y + 38, 'SHRINKING', SIL(18), AMBER, 2)
        fac = FACTORS[ti]
        text(d, 300, y + 38, fac, PX(30, 700), X.lerpc(WHITE, col, 0.5), 0)
        # progress track with a gate tick per world
        tx0, tx1 = 440, 960
        rect(d, tx0, y + 24, tx1 - tx0, 8, C('#17254a'))
        pp = clamp01((t - sr['fs']) / sr['dur']) if t < sr['fe'] else 1.0
        p_, _ = T.prof((t - sr['fs']) / sr['dur'])
        rect(d, tx0, y + 24, (tx1 - tx0) * p_, 8, col)
        for k in range(1, max(1, sr['dz']) + 1):
            xx = tx0 + (tx1 - tx0) * k / max(1, sr['dz'])
            rect(d, xx - 2, y + 18, 4, 20, WHITE if p_ >= k / max(1, sr['dz']) - 1e-6 else EDGE2)
        st_ = fmt(size_of(c['u'])); fs_ = 34
        while fs_ > 18 and tw(PX(fs_, 700), st_) > 250: fs_ -= 1
        text(d, 1252, y + 42, st_, PX(fs_, 700), CYAN, 0, 'r')
    if report:
        draw_report(d, t - REPORT)
    out = np.asarray(im)
    # ---- shake, flash, fades
    a = shake_amp(t, c)
    if a > 0.4 and not intro:
        dx = a * (math.sin(t * 91.0 + 1.3) * 0.6 + math.sin(t * 53.0) * 0.4); dy = a * (math.sin(t * 77.0 + 4.1) * 0.6 + math.sin(t * 37.0 + 2) * 0.4)
        out = X.shift(out, dx, dy)
    fl = None if intro or report else flash_at(t)
    if fl:
        out = (out.astype(np.float32) * (1 - fl[1]) + np.array(fl[0], np.float32) * fl[1]).astype(np.uint8)
    if t < 0.5:
        out = (np.array(INK, np.float32) * (1 - ease_out(t / 0.5)) + out.astype(np.float32) * ease_out(t / 0.5)).astype(np.uint8)
    if t > TOTAL - 0.8:
        k = clamp01((t - (TOTAL - 0.8)) / 0.8)
        out = (out.astype(np.float32) * (1 - k) + np.array(INK, np.float32) * k).astype(np.uint8)
    return np.ascontiguousarray(out)


if __name__ == '__main__':
    import sys, time
    ts = [float(a) for a in sys.argv[1:]] or [3.0]
    for tt in ts:
        t0 = time.time(); fr = render(tt)
        Image.fromarray(fr).save(M.VD + '/test/v3_%06.2f.png' % tt)
        print(tt, round((time.time() - t0) * 1000), 'ms')

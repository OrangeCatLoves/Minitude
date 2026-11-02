"""Minitude minimal UI ("after"): same world, explorer and celebration effects as the v4 video, with every piece of chrome redrawn.

Rules of the redesign
- No boxes, panels, pills or borders. Text and thin lines only.
- Colour is for rarity only (tier colours). Everything else is off-white or dim blue-grey.
- One thing at a time: question block OR rarity roll OR result. Nothing else sits at the bottom.
- Gone: field notes and fun facts, score in the top bar, wordmark in the top bar, 'ROUND n / 7', depth-gauge box, world chip, explorer tag,
  boxed scale bar, LOCK IN button, shrink strip, gate pills, NEW SCALE chip, intro chips, the title-card rules and ruler, the report's share panel.
"""
import sys, os, math
os.environ.setdefault('MINI_RUN', 'main')
sys.path.insert(0, '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/video')
import numpy as np, cv2
from PIL import Image, ImageDraw
import mini as M
import fx3 as X
import tl3 as T
import ui3 as U
import tfx3 as TF
import mini3 as B
from mini import (W, H, C, INK, TXT, DIM, DIMMER, CYAN, WHITE, GREEN, TIERS, FACTORS, PR, PX, SIL, tw, text, rect, clamp01, smooth,
                  ease_out, ease_in_out, back_out, fmt, size_of, nice_bar, wworld)
from tl3 import TL, INTRO, REPORT, TOTAL

SH = (3, 5, 12)
OFF = (238, 242, 255)          # the one text colour
SOFT = (163, 176, 214)         # the one dim colour
FAINT = (84, 98, 140)          # placeholders, empty slots
LINE = (110, 124, 170)         # resting lines
OKG = (141, 255, 180)          # 'valid' (the only non-tier colour)


# ------------------------------------------------------------------ small helpers
def lerp(a, b, t):
    t = clamp01(t); return tuple(int(a[k] + (b[k] - a[k]) * t) for k in range(3))


def stext(d, x, y, s, font, fill, ls=0, anchor='l'):
    text(d, x + 1, y + 2, s, font, SH, ls, anchor)
    text(d, x, y, s, font, fill, ls, anchor)


def grp(im, alpha, fn, dy=0):
    """Draw a group of elements on a copy of the frame and fade it in by alpha (no boxes means no cut-outs, so this is enough)."""
    if alpha <= 0.004: return im
    c = im.copy(); d = ImageDraw.Draw(c); d._image = c
    fn(d, dy)
    return c if alpha >= 0.999 else Image.blend(im, c, alpha)


def vscrim(F, y0, y1, amax, up=False, col=(4, 7, 18)):
    y0 = max(0, int(y0)); y1 = min(H, int(y1)); n = y1 - y0
    if n <= 0 or amax <= 0.002: return
    s = np.linspace(0, 1, n, dtype=np.float32); s = (s * s * (3 - 2 * s)) ** 0.85
    a = ((1 - s) if up else s)[:, None, None] * amax
    F[y0:y1] = (F[y0:y1].astype(np.float32) * (1 - a) + np.array(col, np.float32) * a).astype(np.uint8)


# ------------------------------------------------------------------ top: round dots, size, world, depth rail
RY0, RY1 = 118, 592
RX = 1254


def ry(u):
    return RY0 + (RY1 - RY0) * max(0.0, min(35.0, u)) / 35.0


def hud(d, S, c, dy=0):
    x0 = 640 - (7 * 14 + 6 * 10) // 2; y = 19 + dy
    for k in range(7):
        xx = x0 + k * 24
        if k < S['nsq']:
            rect(d, xx, y, 14, 14, TIERS[PR[k]['tier']][4])
        elif k == S['cur_open']:
            rect(d, xx, y, 14, 14, OFF); rect(d, xx + 3, y + 3, 8, 8, INK)
        else:
            rect(d, xx, y, 14, 14, (52, 66, 112))
    st = S['size_txt']; fs = 34
    while fs > 18 and tw(PX(fs, 600), st) > 230: fs -= 1
    stext(d, 1232, 52 + dy, st, PX(fs, 600), OFF, 0, 'r')
    j = max(0, min(35, int(math.floor(c['z'] + 1e-6))))
    stext(d, 1232, 78 + dy, '%d  %s' % (j + 1, wworld(j)['name']), SIL(12), SOFT, 2, 'r')


def rail(d, t, c, r, final=False, dy=0):
    u = c['u']
    rect(d, RX - 1, RY0 + dy, 2, RY1 - RY0, (84, 98, 148))
    for rr in TL:
        if t < rr['rev'] and not final: continue
        col = TIERS[rr['ti']][4]
        ya = ry(rr['u0']); yb = ry(rr['u1'])
        yf = yb if (final or not (rr['i'] == r['i'] and t < rr['fe'])) else ry(max(rr['u0'], min(rr['u1'], u)))
        if yf > ya: rect(d, RX - 2, int(ya) + dy, 4, int(yf) - int(ya), col)
    ym = ry(u) + dy
    rect(d, RX - 9, ym - 2, 18, 5, SH); rect(d, RX - 8, ym - 1, 16, 3, OFF)


def scalebar(d, L, label, flash, a=1.0):
    L = max(8, L); x = 788; y = 532
    col = lerp((228, 234, 252), CYAN, flash)
    for (rx, ry_, rw, rh) in [(x - 1, y - 1, L + 2, 5), (x - 1, y - 7, 5, 17), (x + L - 4, y - 7, 5, 17)]: rect(d, rx, ry_, rw, rh, SH)
    rect(d, x, y, L, 3, col); rect(d, x, y - 6, 3, 15, col); rect(d, x + L - 3, y - 6, 3, 15, col)
    stext(d, x + L + 14, y + 8, label, PX(22, 600), col, 0, 'l')


# ------------------------------------------------------------------ bottom: one block at a time
def _timer(d, remain, dy=0):
    hot = remain < 8
    w_ = W * remain / 30.0
    rect(d, W / 2 - w_ / 2, 715 + dy, w_, 3, (255, 122, 90) if hot else (150, 162, 200))


def ask(d, t, r, locked, dy=0):
    pr = PR[r['i']]
    tt = min(t, r['lock']); remain = max(0.0, 30 - (tt - r['start'] - 0.3))
    stext(d, 640, 570 + dy, pr['cat'], SIL(12), (190, 202, 232), 3, 'c')
    stext(d, 640, 614 + dy, pr['q'], PX(34, 500), OFF, 0, 'c')
    n = len(pr['typed']); nch = 0
    if t >= r['ts']: nch = min(n, int(clamp01((t - r['ts']) / max(1e-6, r['te'] - r['ts'])) * n + 1e-6))
    typed = pr['typed'][:nch]
    valid = locked and t >= r['val']
    lc = OKG if valid else (OFF if (nch > 0 or locked) else LINE)
    rect(d, 380, 684 + dy, 520, 2, lc)
    if nch == 0 and not locked:
        stext(d, 640, 674 + dy, 'type your answer', PX(30, 400), (112, 126, 172), 0, 'c')
    else:
        stext(d, 640, 676 + dy, typed if not locked else pr['typed'], PX(38, 500), OFF if not valid else lerp(OFF, OKG, 0.5), 0, 'c')
    if not locked and (int(t * 2.2) % 2 == 0 or r['ts'] <= t < r['te'] + 0.1):
        if typed: rect(d, 640 + tw(PX(38, 500), typed) / 2 + 4, 648 + dy, 3, 32, OFF)
        else: rect(d, 640 - tw(PX(30, 400), 'type your answer') / 2 - 10, 650 + dy, 3, 30, OFF)
    # one quiet status line under the field
    if not locked:
        if nch == 0: stext(d, 640, 706 + dy, 'ENTER', SIL(11), (112, 126, 172), 3, 'c')
    elif t < r['val']:
        lab = 'CHECKING'; w_ = tw(SIL(12, False), lab, 3) - 3
        stext(d, 640 - 14, 706 + dy, lab, SIL(12, False), SOFT, 3, 'c')
        for k in range(3):
            a_ = 0.35 + 0.65 * max(0.0, math.sin(t * 9 - k * 0.9))
            rect(d, 640 - 14 + w_ / 2 + 10 + k * 9, 698 + dy, 5, 5, lerp((20, 28, 52), SOFT, a_))
    else:
        stext(d, 640, 706 + dy, 'VALID', SIL(12), OKG, 3, 'c')
    _timer(d, remain, dy)


def roll(d, t, r, dy=0):
    pr = PR[r['i']]
    stext(d, 640, 570 + dy, 'HOW RARE IS THIS ANSWER?', SIL(12, False), SOFT, 3, 'c')
    stext(d, 640, 622 + dy, pr['ans'], PX(44, 500), OFF, 0, 'c')
    p = T.roll_pos(r, t); idx = int(math.floor(p + 1e-6)) % 6
    done = t >= r['rev'] - 0.001
    for k in range(6):
        cx = 640 + (k - 2.5) * 70; on = (k == idx)
        sz = 46 if on else 30
        g = M.gem(k).resize((sz, sz), Image.NEAREST)
        if not on:
            arr = np.asarray(g).copy(); arr[..., 3] = (arr[..., 3] * 0.4).astype(np.uint8); g = Image.fromarray(arr)
        d._image.paste(g, (int(cx - sz / 2), int(668 + dy - sz / 2)), g)
        if on: rect(d, cx - 26, 668 + dy + 28, 52, 2, TIERS[k][4])
    name, pts = TIERS[idx][0], TIERS[idx][1]
    stext(d, 640, 716 + dy, '%s · %d' % (name, pts), SIL(13), TIERS[idx][3], 3, 'c')


def result(d, t, r, dy=0):
    tau = t - r['rev']; ti = r['ti']; pr = PR[r['i']]
    name, pts, bg, fg, ed = TIERS[ti]
    n = int(round(pts * ease_out((tau - 0.1) / 0.7)))
    lab = '%s   +%d' % (name, n); f = SIL(17)
    w_ = tw(f, lab, 3) - 3
    gs = back_out((tau - 0.05) / 0.35)
    sz = max(4, int(30 * gs)); g = M.gem(ti).resize((sz, sz), Image.NEAREST)
    d._image.paste(g, (int(640 - w_ / 2 - 22 - sz / 2), int(570 + dy - 6 - sz / 2)), g)
    stext(d, 640 + 16, 577 + dy, lab, f, fg, 3, 'c')
    a_ = ease_out(tau / 0.25)
    stext(d, 640, 636 + dy + (1 - a_) * 14, pr['ans'], PX(54, 500), OFF, 0, 'c')
    desc = pr['desc']; fd = PX(19, 400)
    while fd.getlength(desc) > 700 and len(desc) > 10: desc = desc[:-4].rstrip() + '...'
    stext(d, 640, 676 + dy, desc, fd, SOFT, 0, 'c')


def bottom_plan(t):
    """(visibility 0..1, record) for the bottom block, or None. Same timing as the v4 command bar."""
    r = T.cur_rec(t)
    v = ease_out((t - r['start']) / 0.55) * (1 - ease_in_out((t - (r['chg'] - 0.05)) / 0.35))
    if t > r['chg'] + 0.35 or v <= 0.005: return None
    return v, r


# ------------------------------------------------------------------ front elements that stay (celebration text) but lose their boxes
def front_reveal(F, r, t):
    """v4 front_reveal without the boxed tier chip for Common and Uncommon (the bottom block already names the tier)."""
    ti = r['ti']; tau = t - r['rev']
    if tau < 0 or t >= r['chg'] + 0.5: return
    name, pts, bg, fg, ed = TIERS[ti]
    gs = TF.GEM[ti] * back_out(tau / 0.34)
    gcy = TF.gem_cy_rest(ti) - 4 * math.sin(2 * math.pi * 0.8 * max(0, tau - 0.3))
    gcx = TF.OX; size_k = 1.0
    if t >= r['chg']:
        q = ease_in_out((t - r['chg']) / 0.45)
        gcy = gcy + (TF.OY - 30 - gcy) * q; size_k = 1 - 0.85 * q
    glow_k = (0.5 + 0.15 * ti) * min(1.0, tau / 0.2) * size_k
    X.radial_add(F, gcx, gcy, TF.GEM[ti] * 1.5, ed, glow_k, 2.0)
    sz = max(4, int(gs * size_k))
    if sz >= 6: X.blit(F, TF.gem_arr(ti, sz), int(gcx - sz / 2), int(gcy - sz / 2))
    ta = 1 - smooth(r['chg'], r['chg'] + 0.25, t)
    top = TF.gem_cy_rest(ti) - TF.GEM[ti] / 2
    if ti in TF.TITLES:
        s_, size = TF.TITLES[ti]
        tc_top, tc_bot, tc_out, tc_glow = TF.TITLE_COL[ti]
        q = tau / 0.30
        scale = 1 + 1.4 * (1 - back_out(q, 1.4)) if q < 1 else 1 + 0.025 * math.sin(2 * math.pi * 1.2 * tau)
        base = top - 14; shine = None
        if ti >= 4:
            ss = (tau - 0.55) / 0.9; shine = ss if 0 <= ss <= 1 else None
        split = 0
        if ti == 3: split = int(6 * max(0, 1 - tau / 0.3))
        if ti == 5: split = int(10 * max(0, 1 - tau / 0.55)) * (1 if int(tau * 24) % 3 else -1)
        jit = 0
        if ti == 5 and tau < 0.5: jit = int(math.sin(tau * 130) * 6 * (1 - tau / 0.5))
        X.big_title(F, s_, size, TF.OX + jit, base, scale, tc_top, tc_bot, tc_out, tc_glow, glow=0.55 if ti < 4 else 0.8, shine=shine, split=split, ls=3, alpha=ta * smooth(0, 0.06, tau))


def front_stamp(F, r, t):
    """The big divide-by stamp, without the word SMALLER."""
    if not (r['chg'] + 0.05 <= t < r['fs'] + 0.45): return
    ti = r['ti']; lab = FACTORS[ti].replace(' ', '')
    tau = t - (r['chg'] + 0.05); q = tau / 0.2
    sc = 1 + 1.6 * (1 - back_out(q, 1.6)) if q < 1 else 1.0
    a = smooth(0, 0.05, tau)
    out = smooth(r['fs'], r['fs'] + 0.4, t)
    sc *= 1 + 0.9 * out; a *= 1 - out
    top, bot, outl, gl = X.lerpc((255, 255, 255), TF.tc(ti), 0.15), TF.tc(ti), X.ck(TF.tc(ti), 0.18), TF.tc(ti)
    size = TF.STAMP[ti]
    wd = PX(size, 700).getlength(lab) + 2 * len(lab)
    if wd > 540: size = int(size * 540 / wd)
    X.big_title(F, lab, size, 480, 372, sc, top, bot, outl, gl, glow=0.7, ls=2, alpha=a, w=700)


# ------------------------------------------------------------------ world title card: name, one line, nothing else
def title_card(F, r, t):
    if r['dz'] == 0: return
    tau = t - r['card']
    if not (0 <= tau < T.CARD_LEN): return
    k = r['z1']; wd = wworld(k); acc = TF.accent(k)
    cl = smooth(T.CARD_LEN - 0.6, T.CARD_LEN, tau); vis = ease_out(tau / 0.35) * (1 - cl)
    y0, y1 = 66, 318; n = y1 - y0
    s = np.sin(np.linspace(0, np.pi, n)) ** 1.1
    a = (s * 0.62 * vis)[:, None, None].astype(np.float32)
    F[y0:y1] = (F[y0:y1].astype(np.float32) * (1 - a) + np.array((4, 7, 18), np.float32) * a).astype(np.uint8)
    la = smooth(0.05, 0.3, tau) * (1 - cl)
    X.put_text(F, 'WORLD %d' % (k + 1), 640, 146, 'sil', 18, acc, la, ls=7, anchor='c')
    top = X.lerpc((255, 255, 255), acc, 0.22); bot = acc
    ls_ = 7 + 4 * smooth(0, T.CARD_LEN, tau)
    TF.letters(F, wd['name'], 84, 500, ls_, 640, 232, tau, 0.12, 0.05, top, bot, X.ck(acc, 0.16), acc, pop=1.1, glow=0.35 * (1 - cl),
               shine_at=((tau - 0.95) / 0.9 if tau < 3.0 else (tau - 3.9) / 0.9), alpha=1 - cl)
    sa = smooth(0.8, 1.2, tau) * (1 - cl)
    X.put_text(F, wd['desc'], 640, 282, 'px', 22, (226, 233, 252), sa, w=400, anchor='c')
    X.put_text(F, 'TAP TO SKIP', 640, 690, 'sil', 11, SOFT, smooth(1.4, 1.9, tau) * (1 - cl) * 0.7, ls=3, anchor='c')


# ------------------------------------------------------------------ start screen
def front_intro(F, t):
    a_in = smooth(0.3, 0.9, t); out = smooth(TF.INTRO_EXIT, TF.INTRO_EXIT + 0.6, t)
    if t < 0.4: return
    top = (255, 241, 196); bot = (255, 200, 87)
    TF.letters(F, 'MINITUDE', 120, 700, 8, 640, 222, t - 0.4, 0.0, 0.07, top, bot, (74, 40, 0), (255, 200, 87), pop=1.4, glow=0.4 * (1 - out), depth=6, depth_col=(138, 90, 0), alpha=1 - out)
    X.put_text(F, 'Answer rare. Shrink far.', 640, 282, 'px', 34, (238, 242, 255), smooth(1.5, 2.1, t) * (1 - out), w=400, anchor='c')
    X.put_text(F, 'DAILY · 26 OCT', 640, 316, 'sil', 13, SOFT, smooth(1.8, 2.4, t) * (1 - out), ls=5, anchor='c')


def intro_button(d, t, dy=0):
    out = smooth(TF.INTRO_EXIT, TF.INTRO_EXIT + 0.6, t)
    a = smooth(2.4, 3.0, t) * (1 - out)
    if a <= 0.01: return
    pressed = 4.9 < t < 5.1
    pul = 1 + 0.04 * math.sin(t * 7) if t < 4.9 else 1
    w_, h_ = 220 * pul, 56 * pul; x = 640 - w_ / 2; y = 640 - h_ / 2 - 190
    col = lerp((12, 18, 36), OFF, a)
    if pressed: rect(d, x, y, w_, h_, (60, 70, 110))
    rect(d, x, y, w_, 2, col); rect(d, x, y + h_ - 2, w_, 2, col); rect(d, x, y, 2, h_, col); rect(d, x + w_ - 2, y, 2, h_, col)
    text(d, 640, 458, 'PLAY', SIL(20), col, 4, 'c')


# ------------------------------------------------------------------ report: one column, the world stays visible on the right
def report(d, tr, dy=0):
    x = 96
    a0 = ease_out(tr / 0.6)
    stext(d, x, 150, 'YOU SHRANK TO', SIL(13, False), SOFT, 4)
    stext(d, x - (1 - a0) * 40, 246, '170 am', PX(100, 700), OFF)
    stext(d, x, 288, 'Smaller than a proton.', PX(24, 400), SOFT)
    sc = int(round(320 * ease_out((tr - 0.6) / 0.9)))
    stext(d, x, 328, '%d / 700 points · world 17 of 36' % sc, SIL(13, False), SOFT, 2)
    for i, pr in enumerate(PR):
        ra = ease_out((tr - 0.9 - 0.22 * i) / 0.35)
        if ra <= 0: continue
        ry_ = 378 + i * 34 + (1 - ra) * 12
        ti = pr['tier']
        col = lerp((12, 18, 36), TIERS[ti][4], ra)
        rect(d, x, ry_ - 14, 14, 14, col)
        stext(d, x + 30, ry_, pr['ans'], PX(23, 500), lerp((12, 18, 36), OFF, ra))
        stext(d, x + 440, ry_, str(TIERS[ti][1]), PX(21, 600), lerp((12, 18, 36), SOFT, ra), 0, 'r')
    ba = ease_out((tr - 2.6) / 0.5)
    if ba > 0.01:
        c_ = lerp((12, 18, 36), OFF, ba)
        rect(d, x, 650, 170, 2, c_); rect(d, x, 698, 170, 2, c_); rect(d, x, 650, 2, 50, c_); rect(d, x + 168, 650, 2, 50, c_)
        text(d, x + 85, 681, 'SHARE', SIL(16), c_, 4, 'c')
        stext(d, x + 200, 681, 'next dive in 07:41:12', SIL(12, False), lerp((12, 18, 36), SOFT, ba), 2)


# ------------------------------------------------------------------ the frame
def render(t):
    t = max(0.0, min(t, TOTAL - 1e-6))
    c = T.cam(t); r = T.cur_rec(t)
    intro = t < INTRO; rep = t >= REPORT
    wf = B.world_layer3(c['z'], c['pulse'])[B.ROW0:]
    if c['fall'] is not None:
        s = c['s']
        wf = X.zoom_blur(np.ascontiguousarray(wf), TF.FOC[0], TF.FOC[1], 0.05 * s, 5)
        wf = X.aberrate(wf, TF.FOC[0], TF.FOC[1], 0.011 * s)
    F = np.empty((H, W, 3), np.uint8); F[:wf.shape[0]] = wf
    nb = H - wf.shape[0]
    refl = wf[wf.shape[0] - nb - 4:wf.shape[0] - 4][::-1].astype(np.float32)
    F[wf.shape[0]:] = (refl * np.linspace(0.62, 0.22, nb, dtype=np.float32)[:, None, None]).astype(np.uint8)
    if not intro and not rep:
        F = TF.bg_reveal(F, r, t); F = TF.bg_charge(F, r, t)
        pose = dict(TF.pose(t, c, r))
    else:
        pose = dict(sx=1.0, sy=1.0, dx=0, dy=0, aura=0, glow=0.0)
        if intro and 4.9 < t < 5.6: pose['aura'] = 1
    if intro:
        a_in = smooth(0.3, 0.9, t); out_ = smooth(TF.INTRO_EXIT, TF.INTRO_EXIT + 0.6, t)
        X.shade(F, 0, 0, W, H, (4, 7, 18), 0.56 * a_in * (1 - out_), 0.56 * a_in * (1 - out_))
    B.put_explorer(F, pose)
    if not intro and not rep:
        ad = X.Add()
        TF.add_reveal(ad, r, t); TF.add_charge(ad, r, t); TF.add_fall(ad, r, t, c); TF.add_land(ad, r, t)
        F = ad.apply(F)
        v = B.vignette_at(t, c)
        if v: F = X.vignette(F, v[0], v[1])
    # quiet gradients instead of panels: dark at the top for the size, dark at the bottom for the question
    ui_a = ease_out((t - (INTRO - 0.4)) / 0.6) if t >= INTRO - 0.4 else 0.0
    vscrim(F, 0, 120, 0.55 * ui_a, up=True)
    bp = None if (intro or rep) else bottom_plan(t)
    if bp: vscrim(F, 470, 720, 0.84 * bp[0])
    if rep:
        ra_ = ease_out((t - REPORT) / 0.6)
        X.shade(F, 0, 0, W, H, (4, 7, 18), 0.45 * ra_, 0.45 * ra_)
        X.shade(F, 0, 0, 800, H, (4, 7, 18), 0.80 * ra_, 0.0, axis=1)
    # front elements
    if intro: front_intro(F, t)
    elif not rep:
        front_reveal(F, r, t); front_stamp(F, r, t)
        title_card(F, r, t)
        for rr in TL:
            if rr['i'] != r['i'] and rr['card'] <= t < rr['card'] + T.CARD_LEN: title_card(F, rr, t)
    im = Image.fromarray(F)
    # ---- top and right
    S = B.hud_state(t, c)
    if not intro or t >= INTRO - 0.4:
        if rep: S = dict(S, nsq=7, cur_open=-1)
        im = grp(im, ui_a, lambda d, dy: hud(d, S, c, dy) if not rep else hud_dots_only(d, S))
        im = grp(im, ui_a, lambda d, dy: rail(d, t, c, r, final=rep))
    # ---- scale bar (under the explorer; hidden while a result or a title card is on screen)
    if not rep and (not intro or t > 1.0):
        hide = False
        if not intro:
            if r['roll'] - 0.15 <= t < r['fs'] - 0.05: hide = True
            for rr in TL:
                if rr['dz'] > 0 and rr['card'] - 0.05 <= t < rr['card'] + T.CARD_LEN - 0.2: hide = True
        if not hide:
            L, Bv, flash = T.bar_state(t)
            a = ease_out((t - 1.0) / 0.5) if intro else 1.0
            im = grp(im, a, lambda d, dy: scalebar(d, L, fmt(Bv), flash))
    # ---- bottom block
    if bp:
        v, rr = bp; dy = (1 - v) * 18
        if t < rr['roll']:
            im = grp(im, v, lambda d, dy_: ask(d, t, rr, t >= rr['chk'], dy), 0)
        elif t < rr['rev']:
            k = clamp01((t - rr['roll']) / 0.18)
            if k < 1: im = grp(im, v * (1 - k), lambda d, dy_: ask(d, t, rr, True, dy))
            im = grp(im, v * k, lambda d, dy_: roll(d, t, rr, dy))
        else:
            im = grp(im, v, lambda d, dy_: result(d, t, rr, dy))
    if intro: im = grp(im, 1.0, lambda d, dy: intro_button(d, t))
    if rep: im = grp(im, 1.0, lambda d, dy: report(d, t - REPORT))
    out = np.asarray(im)
    a = B.shake_amp(t, c)
    if a > 0.4 and not intro:
        dx = a * (math.sin(t * 91.0 + 1.3) * 0.6 + math.sin(t * 53.0) * 0.4); dy_ = a * (math.sin(t * 77.0 + 4.1) * 0.6 + math.sin(t * 37.0 + 2) * 0.4)
        out = X.shift(out, dx, dy_)
    fl = None if intro or rep else B.flash_at(t)
    if fl: out = (out.astype(np.float32) * (1 - fl[1]) + np.array(fl[0], np.float32) * fl[1]).astype(np.uint8)
    if t < 0.5:
        out = (np.array(INK, np.float32) * (1 - ease_out(t / 0.5)) + out.astype(np.float32) * ease_out(t / 0.5)).astype(np.uint8)
    return np.ascontiguousarray(out)


def hud_dots_only(d, S):
    x0 = 640 - (7 * 14 + 6 * 10) // 2
    for k in range(7):
        rect(d, x0 + k * 24, 19, 14, 14, TIERS[PR[k]['tier']][4])

"""UI pieces for the v3 screen: translucent HUD, depth gauge, bottom command bar, field-note caption, scale bar."""
import math, functools
import numpy as np
from PIL import Image, ImageDraw
import mini as M
import fx3 as X
import tl3 as T
from mini import (W, H, C, INK, PANEL, DEEP, EDGE, EDGE2, HI, LO, TXT, DIM, DIMMER, AMBER, AMB_D, AMB_M, AMB_L, CYAN, WHITE, GREEN, GREEN_D,
                  TIERS, FACTORS, TIER_SUB, CAT, PR, DATE, PX, SIL, tw, text, wrap, rect, notch, button, clamp01, smooth, ease_out,
                  ease_in_out, back_out, fmt, size_of, unit_of, nice_bar, wworld, NOTE_BODY, ICON)

def rect(d, x, y, w, h, fill):
    x0 = int(round(x)); y0 = int(round(y)); x1 = int(round(x + w)) - 1; y1 = int(round(y + h)) - 1
    if x1 < x0 or y1 < y0: return
    d.rectangle([x0, y0, x1, y1], fill=fill)


BAR_Y = 592; BAR_H = 128
BAR_TOP = (15, 23, 48); BAR_BOT = (8, 12, 27)
TRACK = (23, 37, 74)
SH = (3, 5, 12)                       # text shadow


def stext(d, x, y, s, font, fill, ls=0, anchor='l'):
    text(d, x + 2, y + 2, s, font, SH, ls, anchor)
    text(d, x, y, s, font, fill, ls, anchor)


def lerp(a, b, t):
    t = clamp01(t); return tuple(int(a[k] + (b[k] - a[k]) * t) for k in range(3))


# ------------------------------------------------------------------ top HUD (translucent)
def hud_shade(F, oy=0):
    X.shade(F, 0, 0, W, 76, INK, 0.80, 0.0)


def draw_hud(d, t, S, oy=0):
    """S: dict with rnd, nsq, cur_open, score, size_txt."""
    if oy < -70: return
    y = oy
    stext(d, 32, y + 40, 'MINITUDE', PX(28, 700), AMBER, 3)
    stext(d, 470, y + 38, 'ROUND %d / 7' % S['rnd'], SIL(18), TXT, 1)
    x = 470 + tw(SIL(18), 'ROUND 0 / 7', 1) + 20
    for k in range(7):
        xx = x + k * 28
        if k < S['nsq']:
            ti = PR[k]['tier']; e = TIERS[ti][4]
            rect(d, xx - 6, y + 22 - 6 + 4, 32, 32, EDGE2 if ti == 0 else e); rect(d, xx - 4, y + 22 - 4 + 4, 28, 28, INK); rect(d, xx, y + 26, 20, 20, e)
        elif k == S['cur_open']:
            rect(d, xx - 6, y + 20, 32, 32, AMBER); rect(d, xx - 4, y + 22, 28, 28, INK); rect(d, xx - 2, y + 24, 24, 24, AMBER); rect(d, xx, y + 26, 20, 20, INK)
        else:
            rect(d, xx - 6, y + 20, 32, 32, EDGE2); rect(d, xx - 4, y + 22, 28, 28, INK); rect(d, xx, y + 26, 20, 20, C('#17254a'))
    fs_ = 26
    while fs_ > 14 and tw(PX(fs_, 700), S['size_txt']) > 150: fs_ -= 1          # long sizes ("1.7 x 10^-35 m") shrink to fit beside the score
    sxs = min(1090, 1252 - tw(PX(fs_, 700), S['size_txt']) - 36)               # and the score makes room (36 px clear gap)
    stext(d, sxs, y + 24, 'SCORE', SIL(12, False), DIM, 1, 'r'); stext(d, sxs, y + 52, str(int(S['score'])), PX(26, 700), TXT, 0, 'r')
    stext(d, 1252, y + 24, 'YOUR SIZE', SIL(12, False), DIM, 1, 'r')
    stext(d, 1252, y + 52, S['size_txt'], PX(fs_, 700), CYAN, 0, 'r')


# ------------------------------------------------------------------ depth gauge
GT, GB = 124, 556
CX0, CX1, CY0, CY1 = 1164, 1268, 72, 584
RX, RW = 1240, 12
MAJOR = {0: '1.7 m', 6: '1.7 µm', 12: '1.7 pm', 18: '1.7 am', 24: '1.7 ym', 30: '1.7 qm', 35: 'PLANCK'}


def gy(u):
    return GT + (GB - GT) * max(0.0, min(35.0, u)) / 35.0


def gauge_shade(F, ox=0):
    X.shade(F, CX0 + ox, CY0, CX1 + ox, CY1, INK, 0.68)


def reach_end(t, r):
    """Where the 'still reachable' band ends (decades). Shrinks after each answer when the answer was weaker than 100."""
    old = r['u0'] + 5 * (7 - r['i']); new = r['u1'] + 5 * (6 - r['i'])
    k = ease_in_out((t - r['rev']) / 0.7)
    e = old + (new - old) * k
    return min(35.0, e), min(35.0, old), min(35.0, new), k


def draw_gauge(d, t, c, r, ox=0, final=False, tip=0.0, chip=True):
    u = c['u']
    x0 = CX0 + ox
    # frame
    rect(d, x0, CY0, CX1 - CX0, 2, EDGE2); rect(d, x0, CY1 - 2, CX1 - CX0, 2, EDGE2); rect(d, x0, CY0, 2, CY1 - CY0, EDGE2); rect(d, CX1 - 2 + ox, CY0, 2, CY1 - CY0, EDGE2)
    text(d, x0 + 10, CY0 + 24, 'DEPTH', SIL(12), AMBER, 1)
    rx = RX + ox
    rect(d, rx - 2, GT - 8, RW + 4, GB - GT + 16, EDGE2); rect(d, rx, GT - 6, RW, GB - GT + 12, DEEP)
    # still-reachable band + the part that was lost
    if final:
        re_, old, new, k = 35.0, 35.0, 35.0, 1.0; band = False
    else:
        re_, old, new, k = reach_end(t, r); band = True
    if band and re_ > u + 0.02:
        ya, yb = gy(u), gy(re_)
        yy = ya
        while yy < yb:
            rect(d, rx + 1, int(yy), RW - 2, min(3, yb - yy), C('#9a6c1a')); yy += 6
        # end cap
        rect(d, rx - 6, int(yb) - 1, RW + 12, 3, AMBER)
        if t >= r['rev'] - 0.1 or r['i'] > 0 or True:
            lab = 'BEST CASE'
            text(d, rx - 14, int(yb) + 4, lab, SIL(10), AMBER, 1, 'r')
    if band and old > new + 0.02 and r['rev'] <= t < r['rev'] + 1.6:
        # the lost potential flashes red, then is gone
        f = 1 - clamp01((t - r['rev'] - 0.7) / 0.8)
        if f > 0.02:
            ya, yb = gy(new), gy(old)
            yy = ya
            while yy < yb:
                rect(d, rx + 1, int(yy), RW - 2, min(3, yb - yy), lerp(DEEP, C('#ff5a5a'), f)); yy += 6
    # answered segments (solid up to the marker, dim pulsing ghost beyond it while diving)
    for rr in T.TL:
        if t < rr['rev']: continue
        ti = rr['ti']; col = TIERS[ti][4]
        ya = gy(rr['u0']); yb = gy(rr['u1'])
        if rr['i'] == r['i'] and t < rr['fe']:
            yf = gy(max(rr['u0'], min(rr['u1'], u)))
        else:
            yf = yb
        if yf > ya:
            rect(d, rx + 1, int(ya) + 1, RW - 2, int(yf) - int(ya), col)
        if yb > yf:
            pul = 0.55 + 0.35 * math.sin((t - rr['rev']) * 9)
            gc = lerp(DEEP, col, pul)
            yy = yf
            while yy < yb:
                rect(d, rx + 1, int(yy), RW - 2, min(3, yb - yy), gc); yy += 6
        rect(d, rx, int(ya), RW, 2, INK)          # seam between answers
    # world ticks and size labels
    for j in range(36):
        y = int(round(gy(j)))
        passed = j <= u + 1e-6
        if j in MAJOR:
            rect(d, rx - 14, y, 12, 2, AMBER if passed else DIM)
            lab = MAJOR[j]
            skip = False
            if band and abs(gy(re_) - y) < 14: skip = True
            if not skip:
                text(d, rx - 20, y + 5, lab, SIL(11), AMBER if passed else DIM, 0, 'r')
        else:
            rect(d, rx - 8, y, 6, 2, TXT if passed else EDGE2)
    # marker line (sub-pixel smooth): 5 rows with coverage
    ym = gy(u)
    for rr_ in range(int(ym) - 3, int(ym) + 4):
        cov = 1 - abs(rr_ + 0.5 - ym) / 1.8
        if cov <= 0.05: continue
        col = lerp(C('#0b1226'), C('#fff3c4') if cov > 0.7 else AMBER, cov)
        rect(d, x0 + 4, rr_, CX1 - CX0 - 8, 1, col)
    d.polygon([(rx - 30, ym - 9), (rx - 14, ym), (rx - 30, ym + 9)], fill=AMBER, outline=INK)
    d.polygon([(rx + RW + 14, ym - 9), (rx + RW, ym), (rx + RW + 14, ym + 9)], fill=AMBER, outline=INK) if False else None
    # tag chip to the left of the capsule
    j = int(math.floor(c['z'] + 1e-6)); j = max(0, min(35, j))
    wd = wworld(j)
    nm = wd['name']
    f1 = PX(19, 600)
    w_ = max(tw(f1, nm) + 28, 128)
    cx_ = x0 - 12 - w_
    cy_ = int(ym) - 24
    cy_ = max(78, min(CY1 - 52, cy_))
    if chip:
        notch(d, cx_, cy_, w_, 46, INK, AMBER, 3)
        text(d, cx_ + 14, cy_ + 18, 'WORLD %d / 36' % (j + 1), SIL(11), AMBER, 1)
        text(d, cx_ + 14, cy_ + 38, nm, f1, WHITE)
        rect(d, cx_ + w_ + 3, int(ym) - 1, 12 + (0), 2, AMBER)
    # first-time tooltip
    if tip > 0.02:
        tw_ = 292
        tx = cx_ - 16 - tw_; ty = cy_ + 40
        col = lerp(SH, TXT, tip)
        # simple callout box (colours fade in)
        notch(d, tx, ty, tw_, 78, lerp(DEEP, C('#17254a'), tip), lerp(DEEP, CYAN, tip), 3)
        text(d, tx + 14, ty + 26, 'YOUR DEPTH LINE DROPS', SIL(12), lerp(DEEP, CYAN, tip), 1)
        text(d, tx + 14, ty + 50, 'Striped = how far you could', PX(17, 400), col)
        text(d, tx + 14, ty + 70, 'still reach with 100s.', PX(17, 400), col)
        rect(d, tx + tw_ + 3, ty + 30, 1160 - (tx + tw_ + 3), 2, lerp(DEEP, CYAN, tip))


# ------------------------------------------------------------------ explorer tag and scale bar
def draw_tag(d, label, col, dx=0, dy=0, cx=840):
    f = PX(19, 700) if any(ch in label for ch in '\u207b\u2070\u00b9\u00b2\u00b3\u2074\u2075\u2076\u2077\u2078\u2079') else SIL(16)
    w_ = tw(f, label, 1) + 28
    x = cx - w_ / 2 + dx; y = 232 + dy
    notch(d, x, y, w_, 36, INK, col, 4)
    text(d, cx + dx, y + 25, label, f, col, 1, 'c')
    rect(d, cx + dx - 2, y + 40, 4, 28, col)


def draw_scalebar(d, L, label, flash, dx=0, dy=0):
    L = max(8, L); x = 788 + dx; y = 532 + dy
    for (rx, ry, rw, rh) in [(x - 2, y - 2, L + 4, 8), (x - 2, y - 10, 8, 24), (x + L - 6, y - 10, 8, 24)]:
        rect(d, rx, ry, rw, rh, INK)
    rect(d, x, y, L, 4, AMBER); rect(d, x, y - 8, 4, 20, AMBER); rect(d, x + L - 4, y - 8, 4, 20, AMBER)
    w_ = tw(PX(24, 700), label) + 24
    col = AMBER if flash < 0.05 else (255, 240, 190)
    notch(d, x, y + 20, w_, 34, INK, col, 2)
    text(d, x + 12, y + 46, label, PX(24, 700), col)
    return x + L + 16


def new_scale_chip(d, bx, by, n0, n1, ca):
    notch(d, bx, by, 124, 44, AMBER, None)
    c = C('#1b1200')
    text(d, bx + 62, by + 18, 'NEW SCALE', SIL(12), c, 1, 'c')
    yy_ = by + 36
    text(d, bx + 14, yy_, n0, SIL(12), c, 1)
    rect(d, bx + 50, yy_ - 5, 20, 3, c); d.polygon([(bx + 70, yy_ - 9), (bx + 76, yy_ - 4), (bx + 70, yy_ + 1)], fill=c)
    text(d, bx + 124 - 14, yy_, n1, SIL(12), c, 1, 'r')


# ------------------------------------------------------------------ field note caption (translucent, auto-hides)
def note_text(k, body=None):
    wd = wworld(k)
    if body: return body
    if wd['inv']: return wd['invBody']
    return wd['body']


def caption_geom(k, body):
    f = PX(17, 400)
    lines = wrap(f, note_text(k, body), 520)
    h = 20 + 22 + 30 + 22 * len(lines) + 34
    return h, lines


def caption_shade(F, k, body, y_bottom, a):
    h, lines = caption_geom(k, body)
    y = y_bottom - h
    X.shade(F, 32, y, 32 + 640, y + h, INK, 0.70 * a)
    return y, h, lines


def draw_caption(d, k, body, y, h, lines, a):
    wd = wworld(k); x = 32
    ec = lerp(SH, CYAN if not wd['inv'] else AMBER, a)
    rect(d, x, y, 640, 2, ec); rect(d, x, y + h - 2, 640, 2, ec); rect(d, x, y, 4, h, ec); rect(d, x + 636, y, 4, h, ec)
    iy = y + 20
    n = ICON.get(k)
    rect(d, x + 18, iy - 2, 68, 68, lerp(SH, EDGE2, a)); rect(d, x + 20, iy, 64, 64, lerp(SH, DEEP, a))
    if n and not wd['inv']:
        im = M.icon(n).resize((56, 56), Image.NEAREST)
        if a < 0.99:
            arr = np.asarray(im).copy(); arr[..., 3] = (arr[..., 3] * a).astype(np.uint8); im = Image.fromarray(arr)
        d._image.paste(im, (x + 24, iy + 4), im)
    else:
        text(d, x + 52, iy + 48, '?', PX(48, 700), lerp(SH, DIMMER, a), 0, 'c')
    tx = x + 104
    label = ('FIELD NOTE · ' if not wd['inv'] else 'INVENTED WORLD · ') + wd['name']
    text(d, tx, y + 26, label, SIL(12), ec, 1)
    head = wd['headline'] if not wd['inv'] else 'NOBODY HAS SEEN THIS'
    text(d, tx, y + 56, head, PX(23, 700), lerp(SH, WHITE, a))
    yy = y + 56 + 8
    for ln in lines:
        yy += 22; text(d, tx, yy - 3, ln, PX(17, 400), lerp(SH, C('#d7def5'), a))
    src = ('SOURCE: ' + wd['source']) if not wd['inv'] else 'ART ONLY. THIS IS NOT A REAL MEASUREMENT.'
    text(d, tx, yy + 22, src[:66], SIL(10, False), lerp(SH, DIMMER, a), 1)


# ------------------------------------------------------------------ bottom command bar
@functools.lru_cache(None)
def _bar_bg():
    g = np.linspace(0, 1, BAR_H, dtype=np.float32)[:, None, None]
    a = (np.array(BAR_TOP, np.float32) * (1 - g) + np.array(BAR_BOT, np.float32) * g) * np.ones((1, W, 1), np.float32)
    a = a.astype(np.uint8)
    a[0:4] = EDGE2; a[4:6] = HI
    return a


def new_bar():
    im = Image.fromarray(_bar_bg().copy()); d = ImageDraw.Draw(im); d._image = im
    return im, d


def timer(d, remain, hot=False):
    segs = 40; sw = W / segs; filled = remain / 30.0 * segs
    for k in range(segs):
        on = k < filled
        rect(d, k * sw + 2, 9, sw - 4, 6, (AMBER if not (hot and remain < 8) else C('#ff7a5a')) if on else TRACK)


def bar_ask(t, r, locked=False):
    im, d = new_bar(); pr = PR[r['i']]
    tt = min(t, r['lock'])
    remain = max(0.0, 30 - (tt - r['start'] - 0.3))
    timer(d, remain)
    bg, fg, ed = CAT[pr['cat']]
    cw = tw(SIL(14), pr['cat'], 1) + 28 + 22
    notch(d, 32, 26, cw, 32, bg, ed, 2); rect(d, 32 + 14, 26 + 10, 12, 12, ed); text(d, 32 + 36, 26 + 22, pr['cat'], SIL(14), fg, 1)
    text(d, 32 + cw + 24, 54, pr['q'], PX(32, 500), TXT)
    m_, s_ = divmod(int(math.ceil(remain)), 60)
    text(d, 1248, 52, '%d:%02d' % (m_, s_), SIL(18), AMBER, 0, 'r')
    # field
    n = len(pr['typed'])
    nch = 0
    if t >= r['ts']: nch = min(n, int(clamp01((t - r['ts']) / max(1e-6, r['te'] - r['ts'])) * n + 1e-6))
    typed = pr['typed'][:nch]
    ec = CYAN if locked else AMBER
    notch(d, 32, 72, 940, 52, INK if not locked else C('#0a1a30'), ec, 4)
    if nch == 0 and not locked:
        text(d, 32 + 20, 72 + 37, 'Type your answer...', PX(30, 400), C('#4a5a8a'))
    text(d, 32 + 20, 72 + 37, typed, PX(32, 500), WHITE if not locked else C('#b8e6ff'))
    caret = (int(t * 2.2) % 2 == 0) or (r['ts'] <= t < r['te'] + 0.1)
    if caret and not locked and t < r['lock'] + 0.05:
        cx_ = 32 + 20 + PX(32, 500).getlength(typed) + 3
        rect(d, cx_, 72 + 8, 4, 36, AMBER)
    if not locked:
        pressed = r['lock'] <= t < r['lock'] + 0.2
        button(d, 996, 72, 252, 52, 'LOCK IN', pressed, 18)
        text(d, 32 + 940 - 14, 72 + 33, 'ENTER', SIL(11, False), DIMMER, 1, 'r') if nch == 0 else None
    else:
        notch(d, 996, 72, 252, 52, C('#0c2038'), CYAN, 4)
        if t < r['val']:
            lab = 'CHECKING'
            text(d, 996 + 126 + 14, 72 + 33, lab, SIL(18), CYAN, 1, 'c')
            # spinner: 4 squares orbiting
            cx_, cy_ = 996 + 126 - tw(SIL(18), lab, 1) / 2 - 18, 72 + 26
            for k in range(8):
                ang = (t * 7 - k * 0.42)
                a_ = clamp01(1 - k / 8.0)
                x = cx_ + math.cos(ang) * 11; y = cy_ + math.sin(ang) * 11
                rect(d, x - 3, y - 3, 6, 6, lerp(C('#0c2038'), CYAN, a_))
        else:
            vs = back_out((t - r['val']) / 0.25)
            text(d, 996 + 126, 72 + 33, 'ROLLING...', SIL(16), lerp(C('#0c2038'), CYAN, clamp01((t - r['val']) / 0.3)), 1, 'c')
            if vs > 0.05:
                vw = 118 * min(1.0, vs)
                notch(d, 32 + 940 - 14 - 118, 72 + 10, 118, 32, C('#0e3a22'), GREEN_D, 2)
                text(d, 32 + 940 - 14 - 59, 72 + 32, 'VALID', SIL(16), GREEN, 1, 'c')
    return np.asarray(im)


def bar_roll(t, r):
    im, d = new_bar(); pr = PR[r['i']]; ti = r['ti']
    text(d, 32, 40, 'RARITY CHECK', SIL(13), AMBER, 1)
    text(d, 32, 90, pr['ans'].upper() if False else pr['ans'], PX(40, 500), WHITE)
    text(d, 32, 118, 'How rare is this answer?', PX(18, 400), DIM)
    p = T.roll_pos(r, t)
    idx = int(math.floor(p + 1e-6)) % 6
    prev = int(math.floor(p - 1 + 1e-6)) % 6
    sw = 128; gap = 12; x0 = 1248 - (6 * sw + 5 * gap)
    done = t >= r['rev'] - 0.001
    for k in range(6):
        name, pts, bg, fg, ed = TIERS[k]
        x = x0 + k * (sw + gap); y = 30
        on = (k == idx)
        if on:
            y -= 6
            notch(d, x, y, sw, 92, lerp(bg, ed, 0.28), ed, 4)
            rect(d, x, y, sw, 4, lerp(ed, WHITE, 0.5))
        else:
            dim = 0.55 if k == prev and not done else 0.3
            notch(d, x, y, sw, 92, lerp(INK, bg, dim + 0.2), lerp(INK, ed, dim), 2)
        g = M.gem(k).resize((40, 40), Image.NEAREST)
        if not on:
            arr = np.asarray(g).copy(); arr[..., 3] = (arr[..., 3] * 0.45).astype(np.uint8); g = Image.fromarray(arr)
        im.paste(g, (int(x + (sw - 40) / 2), int(y + 10)), g)
        text(d, x + sw / 2, y + 66, name, SIL(12), fg if on else lerp(INK, fg, 0.5), 1, 'c')
        text(d, x + sw / 2, y + 86, str(pts), PX(20, 700), WHITE if on else DIMMER, 0, 'c')
    return np.asarray(im)


def bar_result(t, r):
    tau = t - r['rev']
    im, d = new_bar(); pr = PR[r['i']]; ti = r['ti']
    name, pts, bg, fg, ed = TIERS[ti]
    # tier colour wash on the bar edge
    rect(d, 0, 0, W, 4, ed)
    gs = back_out((tau - 0.05) / 0.35)
    if gs > 0.02:
        sz = max(4, int(72 * gs)); g = M.gem(ti).resize((sz, sz), Image.NEAREST)
        im.paste(g, (int(32 + (72 - sz) / 2), int(30 + (72 - sz) / 2)), g)
    cw = tw(SIL(13), name, 1) + 26
    notch(d, 128, 20, cw, 28, bg, ed, 2); text(d, 128 + cw / 2, 20 + 20, name, SIL(13), fg, 1, 'c')
    vw = tw(SIL(13), 'VALID', 1) + 24
    notch(d, 128 + cw + 16, 20, vw, 28, C('#0e3a22'), GREEN_D, 2); text(d, 128 + cw + 16 + vw / 2, 20 + 20, 'VALID', SIL(13), GREEN, 1, 'c')
    if tau > 0.02:
        a_ = ease_out(tau / 0.25)
        text(d, 128 - (1 - a_) * 30, 96, pr['ans'], PX(46, 500), WHITE)
    desc = pr['desc']
    f = PX(16, 400)
    while f.getlength(desc) > 430 and len(desc) > 10: desc = desc[:-4].rstrip() + '...'
    text(d, 128, 122, desc, f, DIM)
    # points
    if tau > 0.15:
        n = int(round(pts * ease_out((tau - 0.15) / 0.7)))
        pop = 1 + 0.18 * math.exp(-(tau - 0.85) * 9) if tau > 0.85 else 1
        text(d, 600, 82, '+%d' % n, PX(int(62 * pop), 700), WHITE if tau < 0.9 else lerp(WHITE, fg, 0.6 * math.exp(-(tau - 0.9) * 3)), 0)
        text(d, 602, 106, 'POINTS', SIL(11, False), DIM, 1)
    # size shift + factor
    S0 = size_of(r['u0']); S1 = size_of(r['u1'])
    c4 = 780
    if tau > 0.5:
        tiny = min(S0, S1) < 0.99999e-30
        f0 = PX(20, 400) if tiny else PX(24, 400); f1 = PX(26, 700) if tiny else PX(32, 700)
        s0 = fmt(S0, tiny); s1 = fmt(S1, tiny)
        text(d, c4, 56, s0, f0, DIM)
        ax = c4 + tw(f0, s0) + 12
        M.arrow(d, ax, 47, 26, CYAN)
        text(d, ax + 26 + 22, 58, s1, f1, CYAN)
        fac = FACTORS[ti]
        pop = 1 + 0.35 * math.exp(-(tau - 0.9) * 8) if tau > 0.9 else 1.0
        text(d, 1248, 42, 'SMALLER BY', SIL(10, False), DIM, 1, 'r')
        text(d, 1248, 74, fac, PX(int(36 * pop), 700), lerp(WHITE, ed, 0.5), 0, 'r')
    # tier ladder
    bw = (1248 - c4 - 5 * 6) / 6
    for k, tt in enumerate(TIERS):
        on = (k == ti)
        col = tt[4] if on else DEEP
        notch(d, c4 + k * (bw + 6), 90, bw, 30, col, None)
        text(d, c4 + k * (bw + 6) + bw / 2, 90 + 21, str(tt[1]), SIL(13), C('#1b1200') if on else DIM, 0, 'c')
    return np.asarray(im)


def bar_intro(t):
    im, d = new_bar()
    best = M.RUN != 'main'
    chips = ['7 PROMPTS', '6 TIERS: 10 TO 100', '36 WORLDS'] if not best else ['3 ANSWERS DONE', '3 × MYTHIC', 'SCORE 300 · WORLD 16 OF 36']
    cx = 32
    for k, c in enumerate(chips):
        ca = ease_out((t - 1.9 - 0.25 * k) / 0.35)
        if ca <= 0: continue
        w_ = tw(SIL(14), c, 1) + 28
        notch(d, cx, 28 + (1 - ca) * 16, w_, 38, INK, CYAN if not best else C('#ff5fb0'), 2)
        text(d, cx + 14, 28 + (1 - ca) * 16 + 25, c, SIL(14), CYAN if not best else C('#ffa8d6'), 1)
        cx += w_ + 16
    if t > 3.0:
        text(d, 32, 108, 'Every 20 points makes you 10 times smaller.' if not best else 'A Mythic answer is worth 100 points: 5 worlds deeper.', PX(24, 400), DIM)
    pressed = 4.9 < t < 5.1
    pulse = 1 + 0.04 * math.sin(t * 7) if t < 4.9 else 1
    bw = 360 * pulse; bx = 1248 - 360 - (bw - 360) / 2
    button(d, bx, 40, bw, 72, "LET'S PLAY" if not best else 'KEEP GOING', pressed, 22)
    ax = bx + bw - 44
    d.polygon([(ax, 40 + 24), (ax + 14, 40 + 36), (ax, 40 + 48)], fill=C('#1b1200'))
    return np.asarray(im)


def bar_report(t):
    im, d = new_bar()
    text(d, 32, 60, 'DAILY EXPEDITION COMPLETE', SIL(16), AMBER, 1)
    text(d, 32, 100, 'Come back tomorrow for a new set of 7.', PX(24, 400), DIM)
    text(d, 1248, 56, 'NEXT EXPEDITION IN', SIL(12, False), DIM, 1, 'r')
    text(d, 1248, 104, '07:41:12', PX(44, 700), TXT, 0, 'r')
    return np.asarray(im)

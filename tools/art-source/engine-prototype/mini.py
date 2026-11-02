"""Minitude gameplay video: pure function render(t) -> RGB uint8 frame (720, 1280, 3).

Zoom model
  u  = true size position in decades: size = 1.7 m / 10**u  (points / 20)
  z  = visual zoom position: the world index being shown (integer at rest)
  World j is drawn at scale 10**(z - j) around the explorer's feet. World j+1 is already inside it at the
  feet (baked into the picture of world j, see chain.py) and its soft-edged window (scale 10**(z - j - 1))
  just grows until it fills the screen. No ring, no speed lines, no dimming: a plain continuous zoom.
"""
import os, sys, math, functools
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

SP = '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad'
VD = SP + '/v21'
sys.path.insert(0, SP)
sys.path.insert(0, SP + '/gen')
import worlds as WD

# 21 named worlds on 36 size slots (slot k starts at 20*k points). Slots 0..19 = worlds 1..20, slots 20..34 = the unexplored stretch,
# slot 35 = world 21 (Planck Foam). Names, one-line texts and honesty labels live in roster21.json.
import json as _json
_R21 = _json.load(open(SP + '/v21/roster21.json'))
VOID0, VOID1 = 20, 34
N_WORLDS = 21
LAST_SLOT = 35

def dw(k):
    """Display world: slots 20..34 are one place (the unexplored stretch)."""
    return VOID0 if VOID0 <= k <= VOID1 else k

def is_void(k): return VOID0 <= k <= VOID1

def world_no(k):
    """World number 1..21, or None inside the unexplored stretch."""
    if is_void(k): return None
    return k + 1 if k < VOID0 else N_WORLDS

def wworld(k):
    d = dict(WD.world(k))
    if is_void(k):
        d.update(name='UNEXPLORED', desc='No experiment has looked this small. Nothing is known to exist here.', kind='NONE', label='NO DATA · NOTHING MEASURED HERE', n=None)
    else:
        r = _R21[str(k)]
        d.update(name=r['name'], desc=r['desc'], kind=r['kind'], label=r['label'], n=r['n'])
    return d

W, H = 1280, 720
FPS = 60
FX, FY = 840, 560          # zoom focus: the ground under the explorer's feet (row 140 of every world)
EXP_H = 200                # explorer height in px

# ------------------------------------------------------------------ colours
def C(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

INK = C('#070b17'); PANEL = C('#101a33'); DEEP = C('#0b1224'); EDGE = C('#6f86d6'); EDGE2 = C('#3c5190')
HI = C('#1c2d5c'); LO = C('#0a1126'); TXT = C('#eef2ff'); DIM = C('#a3b0d6'); DIMMER = C('#8a98c4')
AMBER = C('#ffc857'); AMB_D = C('#8a5a00'); AMB_M = C('#e09a1f'); AMB_L = C('#ffe39a'); CYAN = C('#5be0ff'); WHITE = (255, 255, 255)
GREEN = C('#8dffb4'); GREEN_D = C('#3ec878')

TIERS = [  # name, points, bg, fg, edge
    ('COMMON', 10, C('#1e2538'), C('#cdd6ee'), C('#9aa6bf')),
    ('UNCOMMON', 20, C('#0e3a22'), C('#8dffb4'), C('#46d078')),
    ('RARE', 40, C('#0c2a52'), C('#9ad8ff'), C('#4fc3ff')),
    ('EXOTIC', 60, C('#2a1850'), C('#d8bcff'), C('#b583ff')),
    ('LEGENDARY', 80, C('#4a2c00'), C('#ffd488'), C('#ffb23f')),
    ('MYTHIC', 100, C('#50102e'), C('#ffa8d6'), C('#ff5fb0')),
]
FACTORS = ['÷ 3', '÷ 10', '÷ 100', '÷ 1,000', '÷ 10,000', '÷ 100,000']
TIER_SUB = ['Almost everyone says this one.', 'Plenty of people know it, fewer say it.', 'Only a few players say this.',
            'Very few players think of this.', 'Far less familiar than kiwi or ostrich.', 'Almost nobody says this.']
CAT = {  # bg, fg, edge
    'FOOD': (C('#3a2008'), C('#ffb98a'), C('#e0802f')),
    'ANIMALS & NATURE': (C('#0e3a22'), C('#8dffb4'), C('#3ec878')),
    'GAMES': (C('#2a1850'), C('#d8bcff'), C('#b583ff')),
    'MUSIC': (C('#50102e'), C('#ffa8d6'), C('#ff5fb0')),
    'SCIENCE & TECHNOLOGY': (C('#0c2a52'), C('#9ad8ff'), C('#4fc3ff')),
    'TRANSPORT & VEHICLES': (C('#3a3408'), C('#ffe58a'), C('#e0c030')),
    'HISTORY & MYTHOLOGY': (C('#4a2c00'), C('#ffd488'), C('#ffb23f')),
}

# ------------------------------------------------------------------ the run
PR = [
    dict(cat='FOOD', q='Name a kind of cheese.', typed='cheddar', ans='Cheddar', tier=0,
         desc='A hard English cheese from the village of Cheddar.'),
    dict(cat='ANIMALS & NATURE', q='Name a living species of flightless bird.', typed='takahe', ans='Takahē', tier=4,
         desc='A flightless rail from New Zealand.'),
    dict(cat='GAMES', q='Name a video game.', typed='katamari damacy', ans='Katamari Damacy', tier=2,
         desc='A 2004 Namco game: roll a ball, pick up everything.'),
    dict(cat='MUSIC', q='Name a percussion instrument.', typed='marimba', ans='Marimba', tier=1,
         desc='A wooden-barred instrument played with mallets.'),
    dict(cat='SCIENCE & TECHNOLOGY', q='Name a chemical element.', typed='ytterbium', ans='Ytterbium', tier=3,
         desc='Element 70 (Yb): a soft, silvery metal.'),
    dict(cat='TRANSPORT & VEHICLES', q='Name a car brand.', typed='toyota', ans='Toyota', tier=0,
         desc='A Japanese car maker, founded in 1937.'),
    dict(cat='HISTORY & MYTHOLOGY', q='Name an ancient Greek deity.', typed='eileithyia', ans='Eileithyia', tier=5,
         desc='Greek goddess of childbirth.'),
]
DATE = '26 OCT'

# Chapter 2 of the walkthrough replays a perfect day: seven Mythic answers (700 points, world 36). Answers 1-3 are only names on the
# share/report screen (invented for the mock-up); the video starts after answer 3, at 300 points, in world 16.
RUN = os.environ.get('MINI_RUN', 'main')
PR_BEST = [
    dict(cat='FOOD', q='Name a kind of cheese.', typed='epoisses', ans='Époisses', tier=5, desc='A soft French cheese from Burgundy.'),
    dict(cat='ANIMALS & NATURE', q='Name a living species of flightless bird.', typed='kakapo', ans='Kakapo', tier=5,
         desc='A flightless parrot from New Zealand.'),
    dict(cat='GAMES', q='Name a video game.', typed='mother 3', ans='Mother 3', tier=5, desc='A 2006 role-playing game for the Game Boy Advance.'),
    dict(cat='MUSIC', q='Name a percussion instrument.', typed='waterphone', ans='Waterphone', tier=5,
         desc='A metal bowl with bronze rods, played with a bow.'),
    dict(cat='SCIENCE & TECHNOLOGY', q='Name a chemical element.', typed='praseodymium', ans='Praseodymium', tier=5,
         desc='Element 59 (Pr): a soft, silvery metal.'),
    dict(cat='TRANSPORT & VEHICLES', q='Name a car brand.', typed='koenigsegg', ans='Koenigsegg', tier=5,
         desc='A Swedish sports car maker, founded in 1994.'),
    dict(cat='HISTORY & MYTHOLOGY', q='Name an ancient Greek deity.', typed='eileithyia', ans='Eileithyia', tier=5, desc='Greek goddess of childbirth.'),
]
SKIP = 0                                  # both walkthroughs start from world 1
if RUN != 'main':
    PR = PR_BEST

# The fact texts in worlds.py are written for a player who is exactly world-sized. In the video the player is at
# 54 cm, 54 um and so on, so the "At X you are ..." sentence is redone for the real size (maths checked below).
NOTE_BODY = {
    1: 'Robert Wadlow, the tallest person ever recorded, stood 2.72 m (8 ft 11 in). At 54 cm, you are about a fifth of his height.',
    2: 'A human egg cell is about 0.1 mm (100 µm) across. At 54 µm, you are about half of that.',
    3: 'E. coli cells are rod-shaped, about 2.0 µm long and 0.25 to 1.0 µm wide. At 540 nm, you are about a quarter of the length of one.',
    4: 'In 1873 Ernst Abbe set a limit: a light microscope could never see detail finer than 0.2 µm (200 nm). At 54 nm, you are about a quarter of that. The 2014 Chemistry Nobel went to methods that beat it.',
    5: 'In 1989, IBM scientists Don Eigler and Erhard Schweizer used a scanning tunnelling microscope to move 35 xenon atoms into the letters IBM. A typical atom is about 100 pm across, so at 54 pm you are about half of one.',
    6: 'The most likely distance between a hydrogen atom\'s electron and its nucleus is called the Bohr radius: 52.9 pm. At 17 pm, you are about a third of that.',
}

if RUN != 'main':
    NOTE_BODY = {}

# icons for each world's fact (local ic files), None = invented
ICON = {0: 1, 1: 16, 2: 2, 3: 17, 4: 4, 5: 5, 6: 18, 7: 6, 8: 19, 9: 7, 10: 8, 11: 20, 15: 9, 30: 21, 35: 10}

# ------------------------------------------------------------------ helpers
def clamp01(x): return 0.0 if x < 0 else 1.0 if x > 1 else x
def smooth(a, b, x):
    x = clamp01((x - a) / (b - a)); return x * x * (3 - 2 * x)
def ease_out(x): x = clamp01(x); return 1 - (1 - x) ** 3
def ease_in_out(x): x = clamp01(x); return x * x * (3 - 2 * x)
def back_out(x, s=1.9):
    x = clamp01(x) - 1; return 1 + x * x * ((s + 1) * x + s)

UNITS = [(1.0, 'm'), (1e-2, 'cm'), (1e-3, 'mm'), (1e-6, 'µm'), (1e-9, 'nm'), (1e-12, 'pm'), (1e-15, 'fm'),
         (1e-18, 'am'), (1e-21, 'zm'), (1e-24, 'ym'), (1e-27, 'rm'), (1e-30, 'qm')]

def unit_of(x):
    for s, n in UNITS:
        if x >= s * (1 - 1e-9):
            return s, n
    return UNITS[-1]

SUPD = '\u2070\u00b9\u00b2\u00b3\u2074\u2075\u2076\u2077\u2078\u2079'
def sup(n):
    return ('\u207b' if n < 0 else '') + ''.join(SUPD[int(c)] for c in str(abs(n)))

def fmt(x, compact=False):
    if x < 0.99999e-30:       # below the last metric prefix (quecto): powers of ten, e.g. 1.7 x 10^-31 m
        e = int(math.floor(math.log10(x * 1.0000001))); m = x / 10 ** e
        if round(m, 1) >= 10: m /= 10; e += 1
        v = '%.1f' % m
        if v.endswith('.0'): v = v[:-2]
        return (v + '\u00d710' + sup(e)) if compact else (v + ' \u00d7 10' + sup(e) + ' m')
    s, n = unit_of(x * 1.0000001)
    m = x / s
    if m < 9.95: v = '%.1f' % m
    elif m < 99.5: v = '%d' % round(m)
    else: v = '%d' % (round(m / 10) * 10)
    if v.endswith('.0'): v = v[:-2]
    return v + ' ' + n

def size_of(u): return 1.7 * 10 ** (-u)

def nice_bar(S):
    x = 1.2 * S; e = math.floor(math.log10(x)); m = x / 10 ** e
    return (5 if m >= 5 else 2 if m >= 2 else 1) * 10 ** e

# ------------------------------------------------------------------ fonts
FD = SP + '/fonts/'
@functools.lru_cache(None)
def PX(size, w=500):
    # patched static instances: a distinct flat-topped 5 (the stock 5 is identical to S) and no fi/fl ligatures (BASIC layout)
    w = min((400, 500, 600, 700), key=lambda x: abs(x - w))
    return ImageFont.truetype(FD + 'PixelifyFix-%d.ttf' % w, size, layout_engine=ImageFont.Layout.BASIC)
@functools.lru_cache(None)
def SIL(size, bold=True):
    return ImageFont.truetype(FD + ('Silkscreen-Bold.ttf' if bold else 'Silkscreen-Regular.ttf'), size)

def tw(font, s, ls=0): return font.getlength(s) + ls * len(s)

def text(d, x, y, s, font, fill, ls=0, anchor='l'):
    """y is the baseline."""
    if anchor != 'l':
        w = tw(font, s, ls) - ls
        x = x - w / 2 if anchor == 'c' else x - w
    if not ls:
        d.text((x, y), s, font=font, fill=fill, anchor='ls'); return
    for ch in s:
        d.text((x, y), ch, font=font, fill=fill, anchor='ls'); x += font.getlength(ch) + ls

def wrap(font, s, maxw):
    words = s.split(' '); lines = []; cur = ''
    for w_ in words:
        t = (cur + ' ' + w_).strip()
        if font.getlength(t) <= maxw or not cur: cur = t
        else: lines.append(cur); cur = w_
    if cur: lines.append(cur)
    return lines

def rect(d, x, y, w, h, fill):
    if w <= 0 or h <= 0: return
    d.rectangle([int(round(x)), int(round(y)), int(round(x + w)) - 1, int(round(y + h)) - 1], fill=fill)

def notch(d, x, y, w, h, fill, edge, e=4):
    if edge is not None:
        rect(d, x + e, y, w, h, edge); rect(d, x - e, y, w, h, edge); rect(d, x, y + e, w, h, edge); rect(d, x, y - e, w, h, edge)
    rect(d, x, y, w, h, fill)

def panel(d, x, y, w, h, edge=EDGE):
    notch(d, x, y, w, h, PANEL, edge)
    rect(d, x, y, w, 4, HI); rect(d, x, y, 4, h, HI)
    rect(d, x, y + h - 4, w, 4, LO); rect(d, x + w - 4, y, 4, h, LO)

def ring2(d, x, y, w, h, fill, edge, e=2):
    notch(d, x, y, w, h, fill, edge, e)

def button(d, x, y, w, h, label, pressed=False, fs=20):
    off = 4 if pressed else 0
    notch(d, x, y, w, h, AMBER, AMB_D)
    if not pressed:
        rect(d, x, y + h - 6, w, 6, AMB_M); rect(d, x, y, w, 4, AMB_L)
    else:
        rect(d, x, y, w, 6, AMB_M)
    text(d, x + w / 2, y + h / 2 + 7 + off, label, SIL(fs), C('#1b1200'), 1, 'c')

def arrow(d, x, y, w, col):
    rect(d, x, y - 2, w, 4, col)
    d.polygon([(x + w, y - 8), (x + w + 10, y), (x + w, y + 8)], fill=col)

# ------------------------------------------------------------------ art
@functools.lru_cache(None)
def scene(k):
    return np.ascontiguousarray(np.array(Image.open('%s/scenes/%d.png' % (VD, k)).convert('RGB')))

@functools.lru_cache(None)
def inner_scene(k):
    return np.ascontiguousarray(np.array(Image.open('%s/inner/%d.png' % (VD, k)).convert('RGB')))

@functools.lru_cache(None)
def icon(n):
    return Image.open('%s/assets/ic%d.png' % (SP, n)).convert('RGBA')

@functools.lru_cache(None)
def gem(i):
    return Image.open('%s/assets/gem%d.png' % (SP, i + 1)).convert('RGBA')

@functools.lru_cache(None)
def explorer(aura):
    import art
    base = Image.new('RGBA', (320, 180), (0, 0, 0, 0))
    im = art.place_player(base, aura=aura)
    im = im.resize((W, H), Image.NEAREST)
    bb = im.getchannel('A').getbbox()
    return im.crop(bb), bb[0], bb[1]

# ------------------------------------------------------------------ timeline
INTRO = 6.4
PTS = [TIERS[p['tier']][1] for p in PR]

def _profile():
    n = 4001; tau = np.linspace(0, 1, n); a = 0.26
    v = np.minimum(np.minimum(tau / a, 1.0), (1 - tau) / a)
    v = np.clip(v, 0, 1); v = v * v * (3 - 2 * v)
    pos = np.concatenate([[0], np.cumsum((v[1:] + v[:-1]) / 2)]); pos /= pos[-1]
    vel = np.gradient(pos, tau)
    return tau, pos, vel
TAU, POS, VEL = _profile()

def prof(x):
    x = clamp01(x); return float(np.interp(x, TAU, POS)), float(np.interp(x, TAU, VEL))

def build():
    L = []; t = INTRO; cum = 0
    for i, pr in enumerate(PR):
        pts = PTS[i]; c0 = cum; cum += pts
        r = dict(i=i, pts=pts, c0=c0, c1=cum, u0=c0 / 20, u1=cum / 20, z0=c0 // 20, z1=cum // 20)
        r['dz'] = r['z1'] - r['z0']
        r['start'] = t
        r['ts'] = t + (2.3 if i == 0 else 2.0)
        r['te'] = r['ts'] + len(pr['typed']) * 0.115
        r['lock'] = r['te'] + 0.6
        r['rev'] = r['lock'] + 0.5
        r['fs'] = r['rev'] + 2.5
        r['dur'] = 1.7 if r['dz'] == 0 else 1.4 + 0.8 * r['dz']   # slower than v1 so every world can be seen opening up inside the last
        r['fe'] = r['fs'] + r['dur']
        t = r['fe'] + (0.9 if i < 6 else 2.8)
        r['next'] = t
        L.append(r)
    return L

TL = build()
REPORT = TL[-1]['next']
REPORT_LEN = 9.6
TOTAL = REPORT + REPORT_LEN

def fall_state(r, t):
    """(p, speed) for a fall; p = progress 0..1 of the eased move."""
    tau = (t - r['fs']) / r['dur']
    p, v = prof(tau)
    return p, v * r['dz'] / r['dur']

def cam(t):
    """Camera: true size position u, visual zoom z, pulse scale, speed (decades/s), index of prompt falling or None."""
    cur = None
    for r in TL:
        if t < r['fs']:
            return dict(u=r['u0'], z=float(r['z0']), pulse=1.0, spd=0.0, fall=None, fi=r['i'], p=0.0)
        if t < r['fe']:
            tau = (t - r['fs']) / r['dur']
            p, v = prof(tau)
            u = r['u0'] + (r['u1'] - r['u0']) * p
            if r['dz'] == 0:
                b = math.sin(math.pi * clamp01(tau)) ** 2
                return dict(u=u, z=float(r['z0']), pulse=10 ** (0.12 * b), spd=0.9 * b, fall=r['i'], fi=r['i'], p=p, dz0=True)
            z = r['z0'] + r['dz'] * p
            return dict(u=u, z=z, pulse=1.0, spd=v * r['dz'] / r['dur'], fall=r['i'], fi=r['i'], p=p)
        cur = r
    r = cur
    return dict(u=r['u1'], z=float(r['z1']), pulse=1.0, spd=0.0, fall=None, fi=r['i'], p=1.0)

def world_of(z):
    j = int(math.floor(z + 1e-9)); f = z - j
    return j, f

# ------------------------------------------------------------------ world layer
def sharp(s, r):
    seam = np.floor(s + 0.5); d = s - seam
    return seam + np.clip(d * r, -0.5, 0.5) - 0.5

def remap(src, Z, x0, x1, y0, y1):
    r = 4.0 * Z
    X = np.arange(x0, x1, dtype=np.float64) + 0.5; Y = np.arange(y0, y1, dtype=np.float64) + 0.5
    sx = (FX + (X - FX) / Z) / 4.0; sy = (FY + (Y - FY) / Z) / 4.0
    if r >= 1:
        mx = sharp(sx, r); my = sharp(sy, r); s = src
    else:
        ws = max(2, int(round(320 * r))); hs = max(2, int(round(180 * r)))
        s = cv2.resize(src, (ws, hs), interpolation=cv2.INTER_AREA)
        mx = sx * ws / 320 - 0.5; my = sy * hs / 180 - 0.5
    MX = np.tile(mx.astype(np.float32)[None, :], (y1 - y0, 1)); MY = np.tile(my.astype(np.float32)[:, None], (1, x1 - x0))
    return cv2.remap(s, MX, MY, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)

FEATHER = 36                 # soft edge of the inner window, in pixels of the inner world's own picture
HAND_OFF = 0.72
FADE_IN = 0.10               # the crisp inner picture fades in over the first 10% of a world step

def world_layer(z, pulse=1.0):
    j, f = world_of(z)
    j = min(j, 16)
    Zo = (10 ** f) * pulse
    frame = remap(scene(j), Zo, 0, W, 0, H).astype(np.float32)
    if f > 1e-4 and j < 16:
        Zi = 10 ** (f - 1)
        left = FX - Zi * FX; right = FX + Zi * (W - FX); top = FY - Zi * FY; bottom = FY + Zi * (H - FY)
        x0 = int(max(0, math.floor(left))); x1 = int(min(W, math.ceil(right)))
        y0 = int(max(0, math.floor(top))); y1 = int(min(H, math.ceil(bottom)))
        if x1 - x0 > 1 and y1 - y0 > 1:
            patch = remap(inner_scene(j + 1), Zi, x0, x1, y0, y1).astype(np.float32)
            k_ = smooth(HAND_OFF, 1.0, f)            # the blended edges relax back into the plain art by the end of the step
            if k_ > 1e-4:
                patch = patch * (1 - k_) + remap(scene(j + 1), Zi, x0, x1, y0, y1).astype(np.float32) * k_
            X = np.arange(x0, x1, dtype=np.float32)[None, :] + 0.5; Y = np.arange(y0, y1, dtype=np.float32)[:, None] + 0.5
            fw = FEATHER * 4 * Zi
            # per-edge feather: never wider than the strip of outer picture that is left on that side, so the soft edge
            # shrinks away as the window reaches the screen border (no pop at the hand-off)
            fl = max(1.0, min(fw, left)); fr = max(1.0, min(fw, W - right)); ft = max(1.0, min(fw, top)); fb = max(1.0, min(fw, H - bottom))
            dist = np.minimum(np.minimum((X - left) / fl, (right - X) / fr), np.minimum((Y - top) / ft, (bottom - Y) / fb))
            a_ = np.clip(dist, 0, 1); a_ = a_ * a_ * (3 - 2 * a_)
            a_ = (a_ * smooth(0.0, FADE_IN, f))[..., None]
            bg = frame[y0:y1, x0:x1]
            frame[y0:y1, x0:x1] = bg * (1 - a_) + patch * a_
    return np.clip(frame, 0, 255).astype(np.uint8)

# ------------------------------------------------------------------ scale bar spring (stateless)
def bar_state(t):
    """Returns (px length, label, flash 0..1, value). Spring toward the nice bar, integrated from t-0.5 s."""
    t0 = t - 0.5; dt = 1 / 240.0
    def tgt(tt):
        S = size_of(cam(tt)['u']); B = nice_bar(S); return B * EXP_H / S, B
    L, B0 = tgt(t0); v = 0.0; lastchg = -9.0; Bc = B0
    n = int(round((t - t0) / dt)); w = 18.0
    for k in range(n + 1):
        tt = t0 + k * dt; Lt, Bt = tgt(tt)
        if abs(Bt - Bc) > Bc * 1e-6: Bc = Bt; lastchg = tt
        a = w * w * (Lt - L) - 2 * w * v
        v += a * dt; L += v * dt
    S = size_of(cam(t)['u']); B = nice_bar(S)
    return L, B, clamp01(1 - (t - lastchg) / 0.25) if lastchg > -1 else 0.0

# ------------------------------------------------------------------ UI pieces
def draw_header(d, t, rnd, score, size_txt, nsq, cur_open, fade=1.0, daily=False, done=False):
    rect(d, 0, 0, W, 64, INK); rect(d, 0, 60, W, 4, EDGE2)
    text(d, 32, 40, 'MINITUDE', PX(28, 700), AMBER, 3)
    if daily:
        text(d, 640, 38, 'DAILY EXPEDITION · ' + DATE, SIL(18), TXT, 1, 'c')
        text(d, 1248, 38, '7 / 7 DONE', SIL(14, False), DIM, 1, 'r')
        return
    text(d, 470, 38, 'ROUND %d / 7' % rnd, SIL(18), TXT, 1)
    x = 470 + tw(SIL(18), 'ROUND 0 / 7', 1) + 20
    for k in range(7):
        xx = x + k * 28
        if k < nsq:
            ti = PR[k]['tier']; e = TIERS[ti][4]
            rect(d, xx - 6, 22 - 6 + 4, 32, 32, EDGE2 if ti == 0 else e); rect(d, xx - 4, 22 - 4 + 4, 28, 28, INK); rect(d, xx, 26, 20, 20, e)
        elif k == cur_open:
            rect(d, xx - 6, 20, 32, 32, AMBER); rect(d, xx - 4, 22, 28, 28, INK); rect(d, xx - 2, 24, 24, 24, AMBER); rect(d, xx, 26, 20, 20, INK)
        else:
            rect(d, xx - 6, 20, 32, 32, EDGE2); rect(d, xx - 4, 22, 28, 28, INK); rect(d, xx, 26, 20, 20, C('#17254a'))
    text(d, 1086, 24, 'SCORE', SIL(12, False), DIM, 1, 'r'); text(d, 1086, 52, str(int(score)), PX(26, 700), TXT, 0, 'r')
    text(d, 1248, 24, 'YOUR SIZE', SIL(12, False), DIM, 1, 'r'); text(d, 1248, 52, size_txt, PX(26, 700), CYAN, 0, 'r')

def draw_footer(d):
    rect(d, 0, 664, W, 56, INK); rect(d, 0, 664, W, 4, EDGE2)
    text(d, 32, 697, 'ENTER = LOCK IN', SIL(14, False), DIM, 1)
    x = 1248
    for lab in ['MOTION: FULL', 'SOUND: ON']:
        w_ = tw(SIL(14), lab, 1) + 32
        x -= w_; notch(d, x, 676, w_, 32, PANEL, EDGE2); text(d, x + 16, 697, lab, SIL(14), TXT, 1); x -= 16

def draw_tag(d, label, col, y_off=0):
    w_ = tw(SIL(16), label, 1) + 28
    cx = 840; x = cx - w_ / 2
    notch(d, x, 292 + y_off, w_, 36, INK, col, 4)
    text(d, cx, 292 + y_off + 25, label, SIL(16), col, 1, 'c')
    rect(d, cx - 2, 328 + y_off + 4, 4, 28 - y_off if y_off < 28 else 0, col)

def draw_bar(d, L, label, flash):
    L = max(8, L); x = 788
    for (rx, ry, rw, rh) in [(x - 2, 598, L + 4, 8), (x - 2, 590, 8, 24), (x + L - 6, 590, 8, 24)]:
        rect(d, rx, ry, rw, rh, INK)
    rect(d, x, 600, L, 4, AMBER); rect(d, x, 592, 4, 20, AMBER); rect(d, x + L - 4, 592, 4, 20, AMBER)
    w_ = tw(PX(24, 700), label) + 24
    col = AMBER if flash < 0.05 else (255, 240, 190)
    notch(d, x, 624, w_, 34, INK, col, 2)
    text(d, x + 12, 650, label, PX(24, 700), col)

def bar_label(B):
    return fmt(B)

def draw_aside(d, x, cur, size_txt_now, flash=0.0, dxs=0):
    x += dxs
    h = 392
    panel(d, x, 104, 184, h)
    text(d, x + 16, 138, 'WORLDS', SIL(13), AMBER, 1); text(d, x + 168, 140, '%d / 36' % (cur + 1), PX(20, 700), WHITE, 0, 'r')
    gx = x + (184 - 140) / 2; gy = 152
    for i in range(36):
        cx_ = gx + (i % 6) * 24; cy_ = gy + (i // 6) * 24
        if i == cur:
            rect(d, cx_ - 2, cy_ - 2, 24, 24, WHITE); rect(d, cx_, cy_, 20, 20, AMBER)
        elif i < cur:
            rect(d, cx_ - 2, cy_ - 2, 24, 24, AMBER); rect(d, cx_, cy_, 20, 20, AMBER)
        else:
            rect(d, cx_ - 2, cy_ - 2, 24, 24, EDGE2); rect(d, cx_, cy_, 20, 20, C('#17254a'))
    wd = wworld(cur)
    y = 310
    rect(d, x + 16 - 2, y - 2, 156 + 4, 76 + 4, AMBER); rect(d, x + 16, y, 156, 76, C('#17254a'))
    text(d, x + 26, y + 20, 'NOW', SIL(12), AMBER, 1)
    nm = wd['name'].title()
    f = PX(20, 600)
    if f.getlength(nm) > 136: f = PX(17, 600)
    text(d, x + 26, y + 44, nm, f, WHITE); text(d, x + 26, y + 66, wd['size'], PX(16, 400), DIM)
    if cur < 35:
        y2 = y + 88
        rect(d, x + 16 - 2, y2 - 2, 156 + 4, 76 + 4, EDGE2); rect(d, x + 16, y2, 156, 76, DEEP)
        text(d, x + 26, y2 + 20, 'NEXT AT %d PTS' % (20 * (cur + 1)), SIL(11), DIM, 0)
        text(d, x + 26, y2 + 44, '???', PX(20, 600), DIMMER); text(d, x + 26, y2 + 66, wworld(cur + 1)['size'], PX(16, 400), DIM)

def draw_qpanel(d, x, r, nchars, caret, pressed, remain):
    pr = PR[r['i']]
    y = 104; w = 704; h = 316
    panel(d, x, y, w, h)
    bg, fg, ed = CAT[pr['cat']]
    cw = tw(SIL(16), pr['cat'], 1) + 28 + 22
    notch(d, x + 28, y + 28, cw, 32, bg, ed, 2)
    rect(d, x + 28 + 14, y + 28 + 10, 12, 12, ed); text(d, x + 28 + 36, y + 28 + 22, pr['cat'], SIL(16), fg, 1)
    lines = wrap(PX(40, 500), pr['q'], w - 56)
    for k, ln in enumerate(lines[:2]):
        text(d, x + 28, y + 28 + 32 + 16 + 36 + k * 46, ln, PX(40, 500), TXT)
    iy = y + 28 + 32 + 16 + 92 + 14
    iw = w - 56 - 188 - 16
    notch(d, x + 28, iy, iw, 72, INK, AMBER)
    typed = pr['typed'][:nchars]
    text(d, x + 28 + 20, iy + 48, typed, PX(34, 500), WHITE)
    if caret:
        cx_ = x + 28 + 20 + PX(34, 500).getlength(typed) + 3
        rect(d, cx_, iy + 18, 4, 36, AMBER)
    elif nchars == 0:
        pass
    button(d, x + 28 + iw + 16, iy, 188, 72, 'LOCK IN', pressed)
    ty = iy + 72 + 16
    m_, s_ = divmod(int(remain), 60)
    text(d, x + 28, ty + 15, '%d:%02d' % (m_, s_), SIL(18), AMBER, 0)
    segs = 25; filled = int(round(remain / 30 * segs))
    for k in range(segs):
        rect(d, x + 28 + 72 + k * 23.04, ty, 20, 16, AMBER if k < filled else C('#17254a'))

def note_body(k, body=None):
    wd = wworld(k)
    if body: return body
    if wd['inv']: return wd['invBody'].replace('Atto means 10⁻¹⁸.', 'Atto means one quintillionth.')
    return wd['body']

def note_height(k, body=None):
    wd = wworld(k)
    body = note_body(k, body)
    lines = wrap(PX(19, 400), body, 532)
    return 28 + 16 + 4 + 30 + 4 + 24 * len(lines) + 6 + 14, lines

def draw_note(d, x, y, k, body=None):
    wd = wworld(k)
    h, lines = note_height(k, body)
    h = max(h, 160)
    notch(d, x, y, 704, h, PANEL, CYAN, 4)
    rect(d, x, y, 704, 4, HI); rect(d, x, y, 4, h, HI); rect(d, x, y + h - 4, 704, 4, LO); rect(d, x + 700, y, 4, h, LO)
    iy = y + (h - 112) / 2
    rect(d, x + 20 - 2, iy - 2, 116, 116, EDGE2); rect(d, x + 20, iy, 112, 112, DEEP)
    n = ICON.get(k)
    if n and not wd['inv']:
        im = icon(n).resize((96, 96), Image.NEAREST)
        d._image.paste(im, (int(x + 20 + 8), int(iy + 8)), im)
    else:
        text(d, x + 20 + 56, iy + 76, '?', PX(72, 700), DIMMER, 0, 'c')
    tx = x + 20 + 112 + 20; ty = y + 14
    label = ('FIELD NOTE · ' if not wd['inv'] else 'INVENTED WORLD · ') + wd['name']
    text(d, tx, ty + 14, label, SIL(14), CYAN if not wd['inv'] else AMBER, 1)
    head = wd['headline'] if not wd['inv'] else 'NOBODY HAS SEEN THIS'
    text(d, tx, ty + 14 + 4 + 28, head, PX(26, 700), WHITE)
    yy = ty + 14 + 4 + 28 + 8
    for ln in lines:
        yy += 24; text(d, tx, yy - 4, ln, PX(19, 400), DIM)
    src = ('SOURCE: ' + wd['source']) if not wd['inv'] else 'ART ONLY. THIS IS NOT A REAL MEASUREMENT.'
    text(d, tx, yy + 18, src[:70], SIL(12, False), DIMMER, 1)
    return h

def draw_reveal(d, x, r, k_anim, score_shown):
    """k_anim: seconds since reveal start."""
    pr = PR[r['i']]; ti = pr['tier']; name, pts, bg, fg, ed = TIERS[ti]
    y = 104; w = 690; h = 424
    panel(d, x, y, w, h)
    text(d, x + 28, y + 44, 'YOUR ANSWER', SIL(14, False), DIM, 1)
    vs = back_out(k_anim / 0.3)
    if vs > 0.05:
        vw = tw(SIL(14), 'VALID', 1) + 24
        notch(d, x + w - 28 - vw, y + 24, vw, 28, C('#0e3a22'), GREEN_D, 2)
        text(d, x + w - 28 - vw / 2, y + 44, 'VALID', SIL(14), GREEN, 1, 'c')
    if k_anim > 0.05:
        text(d, x + 28, y + 24 + 28 + 12 + 52, pr['ans'], PX(60, 500), WHITE)
        text(d, x + 28, y + 24 + 28 + 12 + 52 + 36, pr['desc'][:78], PX(19, 400), DIM)
    gy = y + 168
    gs = back_out((k_anim - 0.25) / 0.4)
    if gs > 0:
        sz = max(4, int(96 * gs)); im = gem(ti).resize((sz, sz), Image.NEAREST)
        d._image.paste(im, (int(x + 28 + (96 - sz) / 2), int(gy + (96 - sz) / 2)), im)
    if k_anim > 0.4:
        sl = ease_out((k_anim - 0.4) / 0.25)
        text(d, x + 28 + 96 + 20 + (1 - sl) * 40, gy + 50, name, PX(44, 500), ed, 2)
        if sl > 0.6:
            text(d, x + 28 + 96 + 20, gy + 84, TIER_SUB[ti], PX(20, 400), DIM)
    if k_anim > 0.5:
        n = int(round(pts * ease_out((k_anim - 0.5) / 0.6)))
        text(d, x + w - 28, gy + 62, '+%d' % n, PX(72, 700), WHITE, 0, 'r')
        text(d, x + w - 28, gy + 90, 'POINTS', SIL(12, False), DIM, 1, 'r')
    sy = y + 280
    bw = (w - 56 - 5 * 6) / 6
    for k, tt in enumerate(TIERS):
        on = (k == ti) and k_anim > 0.55
        col = tt[4] if on else DEEP
        notch(d, x + 28 + k * (bw + 6), sy, bw, 32, col, None)
        text(d, x + 28 + k * (bw + 6) + bw / 2, sy + 22, str(tt[1]), SIL(14), C('#1b1200') if on else DIM, 0, 'c')
    ry = y + 332
    if k_anim > 1.0:
        a = ease_out((k_anim - 1.0) / 0.3)
        S0 = size_of(r['u0']); S1 = size_of(r['u1'])
        rect(d, x + 28 - 2, ry - 2, w - 56 + 4, 64, EDGE2); rect(d, x + 28, ry, w - 56, 60, DEEP)
        text(d, x + 28 + 20, ry + 40, fmt(S0), PX(24, 400), DIM)
        ax = x + 28 + 20 + tw(PX(24, 400), fmt(S0)) + 16
        arrow(d, ax, ry + 30, 40, CYAN)
        text(d, ax + 40 + 26, ry + 42, fmt(S1), PX(32, 700), CYAN)
        text(d, x + w - 28 - 20, ry + 44, FACTORS[ti], PX(36, 700), WHITE, 0, 'r')
        text(d, x + w - 28 - 20 - tw(PX(36, 700), FACTORS[ti]) - 12, ry + 42, 'SMALLER', SIL(12, False), DIM, 1, 'r')

def draw_banner(d, k, a, new_scale=None):
    """New world card, pops in at the right of the question panel."""
    wd = wworld(k)
    s = back_out(a)
    if s <= 0.02: return
    x = 764; y = 112 - (1 - s) * 60
    h = 96 if not wd['inv'] else 120
    notch(d, x, y, 272, h, C('#17254a'), AMBER, 4)
    text(d, x + 16, y + 28, 'NEW WORLD  %d / 36' % (k + 1), SIL(13), AMBER, 1)
    f = PX(28, 700)
    if f.getlength(wd['name']) > 240: f = PX(24, 700)
    text(d, x + 16, y + 60, wd['name'], f, WHITE)
    text(d, x + 16, y + 84, wd['size'], PX(18, 400), DIM)
    if wd['inv']:
        text(d, x + 16, y + 108, 'INVENTED, ART ONLY', SIL(12), AMBER, 1)

# ------------------------------------------------------------------ intro / report
def draw_intro(im, d, t):
    # title block over the room scene
    a = ease_out((t - 0.5) / 0.7)
    x = -700 + 748 * a - 800 * ease_in_out((t - (INTRO - 1.0)) / 0.7)
    # panel
    notch(d, x, 130, 700, 456, PANEL, EDGE, 4)
    rect(d, x, 130, 700, 4, HI); rect(d, x, 130, 4, 456, HI); rect(d, x, 582, 700, 4, LO); rect(d, x + 696, 130, 4, 456, LO)
    text(d, x + 36, 190, 'DAILY EXPEDITION · ' + DATE, SIL(16), CYAN, 1)
    text(d, x + 42, 286, 'MINITUDE', PX(96, 700), AMB_D, 6); text(d, x + 36, 280, 'MINITUDE', PX(96, 700), AMBER, 6)
    text(d, x + 36, 340, 'Answer rare. Shrink far.', PX(36, 500), TXT)
    chips = ['7 PROMPTS', '6 TIERS: 10 TO 100', '36 WORLDS']
    cx = x + 36
    for k, c in enumerate(chips):
        ca = ease_out((t - 1.6 - 0.25 * k) / 0.35)
        if ca <= 0: continue
        w_ = tw(SIL(14), c, 1) + 28
        notch(d, cx, 374 - (1 - ca) * 20, w_, 38, INK, CYAN, 2)
        text(d, cx + 14, 374 - (1 - ca) * 20 + 25, c, SIL(14), CYAN, 1)
        cx += w_ + 16
    if t > 2.8:
        text(d, x + 36, 458, 'Every 20 points makes you 10 times smaller.', PX(22, 400), DIM)
    # start button
    pressed = 4.9 < t < 5.1
    pulse = 1 + 0.04 * math.sin(t * 7) if t < 4.9 else 1
    bw = 320 * pulse; bx = x + 36; by = 484
    button(d, bx, by, bw, 72, "LET'S PLAY", pressed)
    # little arrow in button
    ax = bx + bw - 44
    d.polygon([(ax, by + 24), (ax + 14, by + 36), (ax, by + 48)], fill=C('#1b1200'))
    # explorer tag
    draw_tag(d, 'YOU: 1.7 m', CYAN)

def draw_report(im, d, tr):
    """tr = seconds since report start."""
    # main panel
    a = ease_out(tr / 0.6); x = 48 - (1 - a) * 760
    h = 508
    panel(d, x, 100, 720, h)
    text(d, x + 28, 100 + 24 + 14, 'YOU SHRANK TO', SIL(14, False), DIM, 1)
    S = size_of(16.0)
    big_k = ease_out((tr - 0.5) / 0.7)
    text(d, x + 28, 100 + 24 + 14 + 84, '170 am', PX(84, 700), CYAN)
    text(d, x + 28, 100 + 24 + 14 + 84 + 34, 'Smaller than a proton.', PX(24, 400), TXT)
    sc = int(round(320 * ease_out((tr - 0.7) / 1.0)))
    text(d, x + 692, 100 + 24 + 14 + 62, '%d' % sc, PX(56, 700), WHITE, 0, 'r')
    text(d, x + 692, 100 + 24 + 14 + 62 + 0, '', PX(28, 400), DIM)
    text(d, x + 692 - tw(PX(56, 700), '%d' % sc), 100 + 24 + 14 + 62, '', PX(28, 400), DIM)
    text(d, x + 692, 100 + 24 + 14 + 62 + 26, '/ 700', PX(24, 400), DIM, 0, 'r')
    text(d, x + 692, 100 + 24 + 14 + 62 + 56, 'Deepest world: Quark Sea (17 of 36)', PX(20, 500), AMBER, 0, 'r')
    y0 = 100 + 24 + 14 + 84 + 34 + 24
    for i, pr in enumerate(PR):
        ra = ease_out((tr - 1.0 - 0.28 * i) / 0.35)
        if ra <= 0: continue
        ry = y0 + i * 44 + (1 - ra) * 16
        ti = pr['tier']; name, pts, bg, fg, ed = TIERS[ti]
        rect(d, x + 28, ry, 664, 40, DEEP)
        text(d, x + 28 + 12, ry + 26, str(i + 1), SIL(14), DIM, 0)
        text(d, x + 28 + 12 + 40, ry + 27, pr['cat'].title().replace('&', '&'), PX(17, 400), DIM)
        text(d, x + 28 + 12 + 40 + 200, ry + 28, pr['ans'], PX(21, 500), WHITE)
        notch(d, x + 28 + 664 - 12 - 48 - 10 - 124, ry + 7, 124, 26, bg, ed, 2)
        text(d, x + 28 + 664 - 12 - 48 - 10 - 62, ry + 25, name, SIL(12), fg, 1, 'c')
        text(d, x + 28 + 664 - 12, ry + 28, str(pts), PX(22, 700), WHITE, 0, 'r')
    # share panel
    sa = ease_out((tr - 0.4) / 0.6); sx = 920 + (1 - sa) * 400
    panel(d, sx, 100, 312, 330)
    text(d, sx + 24, 100 + 24 + 12, 'SHARE (NO SPOILERS)', SIL(14), AMBER, 1)
    rect(d, sx + 24 - 2, 100 + 54 - 2, 264 + 4, 170 + 4, EDGE2); rect(d, sx + 24, 100 + 54, 264, 170, INK)
    text(d, sx + 40, 100 + 54 + 36, 'MINITUDE DAILY · ' + DATE, PX(18, 700), AMBER, 0)
    for i, pr in enumerate(PR):
        rect(d, sx + 40 + i * 36, 100 + 54 + 56, 30, 30, TIERS[pr['tier']][4])
    text(d, sx + 40, 100 + 54 + 128, '320 pts · 170 am', PX(22, 400), TXT)
    button(d, sx + 24, 100 + 54 + 170 + 24, 264, 56, 'COPY RESULT', False, 18)
    draw_tag(d, 'YOU: 170 am', CYAN)

# ------------------------------------------------------------------ main render
def score_at(t):
    s = 0
    for r in TL:
        if t >= r['rev'] + 0.8:
            f = clamp01((t - (r['rev'] + 0.8)) / 0.6)
            if t < r['rev'] + 1.4: return int(r['c0'] + r['pts'] * ease_out(f))
            s = r['c1']
    return s

def ui(im, d, t, c, mode):
    zq = c['z']; falling = c['fall'] is not None
    j, f = world_of(zq)
    dom = min(j + (1 if f > 0.5 else 0), 35)
    if mode == 'intro':
        draw_intro(im, d, t)
        draw_header(d, t, 1, 0, '1.7 m', 0, -1) if False else None
        # slim header for the intro
        rect(d, 0, 0, W, 64, INK); rect(d, 0, 60, W, 4, EDGE2); text(d, 32, 40, 'MINITUDE', PX(28, 700), AMBER, 3)
        text(d, 1248, 38, 'DAILY EXPEDITION · ' + DATE, SIL(14, False), DIM, 1, 'r')
        draw_footer(d)
        L = EXP_H * 1.7 and nice_bar(1.7) * EXP_H / 1.7
        draw_bar(d, L, fmt(nice_bar(1.7)), 0)
    elif mode == 'play':
        r = None
        for rr in TL:
            if t >= rr['start'] or rr['i'] == 0: r = rr
        i = r['i']; pr = PR[i]
        S = size_of(c['u'])
        # panels ------------------------------------------------------
        qin = ease_out((t - r['start']) / 0.55) if i > 0 or True else 1
        # question + note panel x offset
        qx = 48 - (1 - qin) * 780
        out = ease_in_out((t - (r['lock'] + 0.15)) / 0.35)
        qx -= out * 780
        # tag + scale bar + header
        shrinking_tag = (r['rev'] <= t) and (t < r['fe'])
        if falling or shrinking_tag:
            draw_tag(d, 'SHRINKING...', AMBER)
        else:
            draw_tag(d, 'YOU: ' + fmt(S), CYAN)
        L, B, flash = bar_state(t)
        draw_bar(d, L, bar_label(B), flash)
        # new scale chip
        for rr in TL:
            if rr['fe'] <= t < rr['fe'] + 2.2:
                S0 = size_of(rr['u0']); S1 = size_of(rr['u1'])
                n0 = unit_of(nice_bar(S0) * 1.0000001)[1]; n1 = unit_of(nice_bar(S1) * 1.0000001)[1]
                if n0 != n1:
                    ca = ease_out((t - rr['fe']) / 0.3) * (1 - smooth(1.8, 2.2, t - rr['fe']))
                    if ca > 0.02:
                        bx = 788 + L + 16
                        notch(d, bx, 592 - (1 - ca) * 10, 124, 44, AMBER, None)
                        text(d, bx + 62, 592 - (1 - ca) * 10 + 18, 'NEW SCALE', SIL(12), C('#1b1200'), 1, 'c')
                        yy_ = 592 - (1 - ca) * 10 + 36
                        text(d, bx + 14, yy_, n0, SIL(12), C('#1b1200'), 1)
                        rect(d, bx + 50, yy_ - 5, 20, 3, C('#1b1200')); d.polygon([(bx + 70, yy_ - 9), (bx + 76, yy_ - 4), (bx + 70, yy_ + 1)], fill=C('#1b1200'))
                        text(d, bx + 124 - 14, yy_, n1, SIL(12), C('#1b1200'), 1, 'r')
        # aside always
        asx = 1048 + 260 * (1 - ease_out((t - INTRO) / 0.6)) if i == 0 else 1048
        draw_aside(d, asx, dom, '')
        # question panel / note
        if qx > -760 and t < r['lock'] + 0.7:
            nchars = int(clamp01((t - r['ts']) / max(1e-6, r['te'] - r['ts'])) * len(pr['typed']) + 1e-6) if t >= r['ts'] else 0
            nchars = min(len(pr['typed']), nchars)
            caret = (int(t * 2.2) % 2 == 0) or (r['ts'] <= t < r['te'] + 0.1)
            pressed = r['lock'] <= t < r['lock'] + 0.2
            if t >= r['lock'] + 0.05: caret = False
            remain = max(0, 30 - (t - r['start'] - 0.3))
            draw_qpanel(d, qx, r, nchars, caret, pressed, remain)
            wk = world_of(r['z0'])[0]
            draw_note(d, qx, 444, wk, NOTE_BODY.get(i))
        # reveal panel
        if r['rev'] <= t < r['fs'] + 0.5:
            rin = ease_out((t - r['rev']) / 0.5); rout = ease_in_out((t - r['fs']) / 0.45)
            rx = 48 - (1 - rin) * 780 - rout * 780
            draw_reveal(d, rx, r, t - r['rev'], 0)
        # new world banner
        for rr in TL:
            if rr['dz'] > 0 and rr['fe'] <= t < rr['fe'] + 2.7:
                ba = (t - rr['fe']) / 0.4
                oa = 1 - smooth(2.2, 2.7, t - rr['fe'])
                if oa > 0.02:
                    draw_banner(d, rr['z1'], ba)
        # the note for the new world slides in with the next prompt (see qx)
        # last prompt: note and report
        if i == 6 and t >= r['fe']:
            na = ease_out((t - r['fe'] - 0.5) / 0.5)
            nout = ease_in_out((t - (REPORT - 0.6)) / 0.5)
            draw_note(d, 48 - (1 - na) * 780 - nout * 780, 444, 16, None)
        # header
        sc = score_at(t)
        nsq = 0
        for rr in TL:
            if t >= rr['rev'] + 0.4: nsq = rr['i'] + 1
        cur_open = i if (i >= nsq) and t < r['rev'] else (i + 1 if i + 1 < 7 and nsq == i + 1 and t >= r['next'] - 0.1 else -1)
        if nsq == i + 1 and i < 6 and t >= r['fe']:
            rnd = i + 2; cur_open = i + 1
        else:
            rnd = i + 1
            cur_open = i if nsq <= i else -1
        hy = ease_out((t - INTRO + 0.3) / 0.5) if i == 0 else 1
        draw_header(d, t, rnd, sc, fmt(size_of(c['u'])), nsq, cur_open)
        draw_footer(d)
    else:
        tr = t - REPORT
        draw_report(im, d, tr)
        draw_header(d, t, 7, 320, '', 7, -1, daily=True)
        draw_footer(d)


def render(t):
    t = max(0.0, min(t, TOTAL - 1e-6))
    c = cam(t)
    zq = c['z']
    frame = world_layer(zq, c['pulse'])
    im = Image.fromarray(frame); d = ImageDraw.Draw(im); d._image = im

    # explorer
    falling = c['fall'] is not None
    aura = 0
    if falling: aura = 2 if int(t * 12) % 2 == 0 else 1
    near_lock = False
    for r in TL:
        if r['lock'] <= t < r['rev'] + 0.3: aura = max(aura, 1)
    ex, ox, oy = explorer(aura)
    im.paste(ex, (ox, oy), ex)

    j, f = world_of(zq)
    dom = j + (1 if f > 0.5 else 0)
    dom = min(dom, 35)

    modes = []
    if t < INTRO - 0.4: out = None; modes = [('intro', 1.0)]
    elif t < INTRO: modes = [('intro', 1 - (t - (INTRO - 0.4)) / 0.4), ('play', (t - (INTRO - 0.4)) / 0.4)]
    elif t < REPORT - 0.4: modes = [('play', 1.0)]
    elif t < REPORT: modes = [('play', 1 - (t - (REPORT - 0.4)) / 0.4), ('report', (t - (REPORT - 0.4)) / 0.4)]
    else: modes = [('report', 1.0)]
    ims = []
    for mode, wgt in modes:
        im2 = im.copy(); d2 = ImageDraw.Draw(im2); d2._image = im2
        ui(im2, d2, t, c, mode); ims.append((im2, wgt))
    im = ims[0][0]
    if len(ims) == 2: im = Image.blend(ims[0][0], ims[1][0], ims[1][1])

    # fades
    out = im
    if t < 0.5:
        out = Image.blend(Image.new('RGB', (W, H), INK), im, ease_out(t / 0.5))
    if t > TOTAL - 0.8:
        out = Image.blend(im, Image.new('RGB', (W, H), INK), clamp01((t - (TOTAL - 0.8)) / 0.8))
    return np.asarray(out)

if __name__ == '__main__':
    import time
    for r in TL: print({k: (round(v, 2) if isinstance(v, float) else v) for k, v in r.items()})
    print('total', TOTAL, 'frames', int(TOTAL * FPS))

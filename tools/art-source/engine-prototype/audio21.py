"""Sound for the v3 walkthrough, built from the same timeline as the picture (tl3)."""
import sys, math, wave
import numpy as np
sys.path.insert(0, '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/v21')
import mini as M
import tl3 as T
import tfx3 as TF

SR = 44100
N = int((T.TOTAL + 1.5) * SR)
L = np.zeros(N, np.float32); R = np.zeros(N, np.float32)
rng = np.random.RandomState(11)


def put(t, x, pan=0.0, gain=1.0):
    i = int(t * SR)
    if i < 0 or i >= N: return
    x = x[:N - i].astype(np.float32) * gain
    lg = math.cos((pan + 1) * math.pi / 4); rg = math.sin((pan + 1) * math.pi / 4)
    L[i:i + len(x)] += x * lg * 1.414; R[i:i + len(x)] += x * rg * 1.414


def tt(dur): return np.arange(int(dur * SR)) / SR


def tone(f, dur, kind='sine', a=0.003, d=0.12, vol=0.3, f2=None, vib=0.0):
    t = tt(dur)
    fr = f if f2 is None else f + (f2 - f) * (t / dur)
    if vib: fr = fr * (1 + vib * np.sin(2 * np.pi * 5.5 * t))
    ph = 2 * np.pi * np.cumsum(fr * np.ones_like(t)) / SR
    if kind == 'sine': w = np.sin(ph)
    elif kind == 'square': w = np.sign(np.sin(ph)) * 0.6
    elif kind == 'tri': w = 2 / np.pi * np.arcsin(np.sin(ph))
    elif kind == 'saw': w = sum(np.sin(ph * k) / k for k in range(1, 7)) * 0.6
    else: w = np.sin(ph)
    env = np.minimum(t / a, 1.0) * np.exp(-t / d)
    return w * env * vol


def bell(f, dur=0.7, vol=0.25, decay=0.28):
    t = tt(dur)
    w = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.15) + 0.3 * np.sin(2 * np.pi * f * 4.1 * t) * np.exp(-t / 0.08)
    return w * np.minimum(t / 0.002, 1) * np.exp(-t / decay) * vol


def band_noise(dur, lo, hi):
    n = int(dur * SR); x = rng.randn(n)
    X = np.fft.rfft(x); fr = np.fft.rfftfreq(n, 1 / SR)
    X[(fr < lo) | (fr > hi)] = 0
    y = np.fft.irfft(X, n); return y / (np.abs(y).max() + 1e-9)


def click(vol=0.35):
    t = tt(0.05)
    return (np.sin(2 * np.pi * 900 * t) * np.exp(-t / 0.012) * 0.7 + band_noise(0.05, 2000, 9000) * np.exp(-t / 0.006) * 0.5) * vol


def tick(f=1900, vol=0.07):
    return tone(f, 0.02, 'square', 0.001, 0.008, vol)


def swish(dur=0.35, vol=0.10):
    t = tt(dur); n = band_noise(dur, 500, 5000)
    return n * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2 * vol


def thump(f1=110, f2=45, dur=0.4, vol=0.6, d=0.12):
    return tone(f1, dur, 'sine', 0.002, d, vol, f2=f2)


def mx(*xs):
    n = max(len(x) for x in xs); out = np.zeros(n)
    for x in xs: out[:len(x)] += x
    return out


def mix_into(out, x, at=0.0, gain=1.0):
    o = int(at * SR)
    if o >= len(out): return
    x = x[:len(out) - o]
    out[o:o + len(x)] += x * gain


def riser(dur, f1=150, f2=1400, vol=0.25, noise=0.2):
    t = tt(dur)
    fr = f1 * (f2 / f1) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    env = (t / dur) ** 1.6
    w = (np.sin(ph) + 0.4 * np.sin(2 * ph)) * env * vol
    n = band_noise(dur, 800, 9000) * env ** 1.4 * noise
    return (w + n) * np.minimum((dur - t) / 0.02, 1)


def pad(freqs, dur, vol=0.12, a=0.35, d=1.6):
    t = tt(dur); out = np.zeros(len(t))
    for k, f in enumerate(freqs):
        vib = 1 + 0.004 * np.sin(2 * np.pi * (4.8 + 0.3 * k) * t + k)
        ph = 2 * np.pi * np.cumsum(f * vib) / SR
        out += np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    env = np.minimum(t / a, 1) * np.exp(-t / d)
    return out * env * vol / max(1, len(freqs)) * 2.2


def sparkle_cascade(dur, n, notes, vol, seed, start=0.0, decay=0.45):
    rs = np.random.RandomState(seed); out = np.zeros(int((dur + 1.2) * SR))
    for k in range(n):
        at = start + rs.rand() * dur
        f = notes[rs.randint(len(notes))]
        mix_into(out, bell(f, 0.9, vol * (1 - 0.6 * at / dur), decay), at)
    return out


def sting(ti):
    out = np.zeros(int(5.2 * SR))
    if ti == 0:
        mix_into(out, tone(500, 0.22, 'sine', 0.003, 0.08, 0.26, f2=820))
        mix_into(out, thump(160, 90, 0.2, 0.3, 0.06))
    elif ti == 1:
        for i, f in enumerate((659.25, 830.6, 987.77)):
            mix_into(out, mx(bell(f, 1.0, 0.22), tone(f * 2, 0.4, 'sine', 0.002, 0.08, 0.05)), 0.085 * i)
        mix_into(out, sparkle_cascade(0.6, 6, [2637, 3136, 3520], 0.05, 4, 0.12))
        mix_into(out, thump(130, 70, 0.25, 0.3, 0.07))
    elif ti == 2:
        for i, f in enumerate((523.25, 659.25, 783.99, 1046.5)):
            mix_into(out, mx(bell(f, 1.1, 0.24), tone(f, 0.5, 'tri', 0.003, 0.14, 0.12)), 0.07 * i)
        mix_into(out, band_noise(0.5, 4500, 11000) * np.exp(-tt(0.5) / 0.2) * 0.10, 0.02)
        mix_into(out, thump(120, 55, 0.4, 0.5, 0.10))
        mix_into(out, sparkle_cascade(1.0, 8, [2093, 2637, 3136, 4186], 0.05, 5, 0.2))
    elif ti == 3:
        mix_into(out, tone(2400, 0.28, 'square', 0.002, 0.10, 0.12, f2=180))
        for k in range(14):
            at = 0.05 + rng.rand() * 1.1
            mix_into(out, band_noise(0.03, 2500, 12000) * np.exp(-tt(0.03) / 0.008) * 0.12, at)
        mix_into(out, pad([220, 329.6, 440, 523.25, 659.25], 2.6, 0.22, 0.18, 1.1), 0.04)
        for i, f in enumerate((440, 523.25, 659.25, 880, 1046.5)):
            mix_into(out, mx(bell(f, 1.2, 0.18), tone(f, 0.4, 'tri', 0.003, 0.10, 0.08)), 0.06 + 0.07 * i)
        mix_into(out, thump(110, 40, 0.7, 0.65, 0.16))
        mix_into(out, sparkle_cascade(1.6, 10, [1760, 2093, 2637, 3520], 0.05, 6, 0.3))
    elif ti == 4:
        mix_into(out, thump(150, 42, 0.9, 0.85, 0.22))
        mix_into(out, band_noise(0.35, 60, 900) * np.exp(-tt(0.35) / 0.10) * 0.5)
        for i, f in enumerate((261.6, 392.0, 523.25, 659.25, 783.99)):
            mix_into(out, tone(f, 2.6, 'saw', 0.04, 1.0, 0.16), 0.02 * i)
        mix_into(out, pad([130.8, 196, 261.6, 392, 523.25], 3.2, 0.2, 0.25, 1.4), 0.05)
        mix_into(out, band_noise(2.2, 3000, 12500) * np.exp(-tt(2.2) / 0.7) * 0.22, 0.02)
        mix_into(out, sparkle_cascade(2.6, 18, [1318.5, 1568, 1976, 2349, 2637, 3136], 0.075, 7, 0.15, 0.55))
        for i, f in enumerate((1046.5, 1318.5, 1568, 2093)):
            mix_into(out, bell(f, 1.5, 0.2, 0.5), 0.22 + 0.09 * i)
    else:
        mix_into(out, tone(95, 3.0, 'sine', 0.004, 1.2, 0.95, f2=36))
        mix_into(out, band_noise(0.25, 60, 1200) * np.exp(-tt(0.25) / 0.08) * 0.6)
        mix_into(out, band_noise(3.0, 1200, 14000) * np.exp(-tt(3.0) / 0.9) * 0.36)
        mix_into(out, pad([130.8, 196, 261.6, 329.6, 392, 523.25, 784], 4.6, 0.34, 0.5, 2.0), 0.0)
        mix_into(out, pad([65.4, 98, 130.8], 4.0, 0.3, 0.3, 1.8), 0.0)
        mix_into(out, sparkle_cascade(3.3, 40, [1046.5, 1174.7, 1318.5, 1568, 1760, 2093, 2349, 2637], 0.14, 8, 0.12, 0.8))
        for i, f in enumerate((523.25, 659.25, 783.99, 1046.5, 1318.5, 1568)):
            mix_into(out, bell(f, 1.8, 0.22, 0.6), 0.14 + 0.08 * i)
    return out


def whoosh(r):
    dur = r['dur'] + 0.5
    n = int(dur * SR); t = np.arange(n) / SR
    tau = np.clip(t / r['dur'], 0, 1)
    v = np.interp(tau, T.TAU, T.VEL) / T.VEL.max()
    if r['dz'] == 0:
        v = 0.6 * np.sin(np.pi * tau) ** 2
    v = v * (t <= r['dur']) + v * np.exp(-(t - r['dur']).clip(0) / 0.14) * (t > r['dur'])
    lo = band_noise(dur, 60, 500); mid = band_noise(dur, 400, 2500); hi = band_noise(dur, 2500, 10000)
    sig = lo * 0.55 * v ** 0.7 + mid * 0.5 * v ** 1.3 + hi * 0.38 * v ** 2.2
    fr = 120 + 700 * v ** 1.3
    ph = 2 * np.pi * np.cumsum(fr) / SR
    sig += 0.24 * np.sin(ph) * v ** 1.1 + 0.10 * np.sin(2 * ph) * v ** 1.5
    # shepard-ish shimmer rising with speed
    ph2 = 2 * np.pi * np.cumsum(900 + 2600 * v ** 1.6) / SR
    sig += 0.07 * np.sin(ph2) * v ** 2
    return sig * np.minimum(t / 0.03, 1) * 0.5


# ---------------------------------------------------------------- world 21 finale: quiet build, then burst
FL = np.zeros(N, np.float32); FR = np.zeros(N, np.float32)       # finale stems: not ducked, not compressed
FIN_WINDOWS = []                                                 # (fs, fe) of every finale: the main mix is ducked inside


def fput(t, x, pan=0.0, gain=1.0):
    i = int(t * SR)
    if i < 0 or i >= N: return
    x = x[:N - i].astype(np.float32) * gain
    lg = math.cos((pan + 1) * math.pi / 4); rg = math.sin((pan + 1) * math.pi / 4)
    FL[i:i + len(x)] += x * lg * 1.414; FR[i:i + len(x)] += x * rg * 1.414


def glide(f0, f1, dur, vol, a, hold_end=1.0, vib=0.0, harm=0.35):
    """Exponential glide from f0 to f1 with a slow swell: the rising 'light' tone."""
    t = tt(dur); fr = f0 * (f1 / f0) ** (t / dur)
    if vib: fr = fr * (1 + vib * np.sin(2 * np.pi * 4.2 * t))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    w = np.sin(ph) + harm * np.sin(2 * ph)
    env = (t / dur) ** 1.7 * np.minimum(t / a, 1.0)
    return w * env * vol


def finale(r):
    fs = r['fs']; fe = r['fe']; D = T.FIN_DUR; FIN_WINDOWS.append((fs, fe))
    # launch: a short drop-out of the world, then the sound drains away
    fput(fs, thump(120, 45, 0.5, 0.34, 0.14), 0)
    fput(fs, band_noise(2.6, 150, 3200) * (np.sin(np.pi * np.clip(tt(2.6) / 2.6, 0, 1)) ** 1.5) * 0.16, 0)
    fput(fs + 0.1, tone(760, 3.2, 'sine', 0.05, 1.5, 0.12, f2=70), 0)               # the slow-down: a long falling tone
    # the dark: a sub bed that fades in while the interface dims, and drops out for the held breath
    bed = pad([55.0, 82.4, 110.0, 164.8], D - 1.0, 0.055, 2.4, 60.0)
    bed *= np.minimum(tt(D - 1.0) / 2.6, 1.0) * (1 - np.clip((tt(D - 1.0) - (12.0 - 1.0)) / 0.5, 0, 1))
    bed *= np.clip((tt(D - 1.0) - 0.6) / 2.0, 0, 1)
    fput(fs + 0.6, bed[:int((12.2 - 0.6) * SR)] * np.concatenate([np.ones(int((12.2 - 0.6) * SR) - 4410), np.linspace(1, 0, 4410)])[:int((12.2 - 0.6) * SR)], 0)
    # heartbeats, getting a little stronger
    for n, b in enumerate(T.FIN_BEATS):
        v = 0.13 + 0.22 * (n / max(1, len(T.FIN_BEATS) - 1)) ** 1.5
        fput(fs + b, thump(72, 38, 0.30, v, 0.10), 0)
        fput(fs + b + 0.17, thump(64, 34, 0.26, v * 0.72, 0.09), 0)
    # the light: a tone that climbs very slowly, a faint high shimmer, a few single bells
    g1 = glide(196.0, 784.0, 8.4, 0.06, 2.0, vib=0.003)
    fput(fs + 4.0, g1[:int(8.0 * SR)] * np.concatenate([np.ones(int(8.0 * SR) - 4410), np.linspace(1, 0, 4410)])[:int(8.0 * SR)], 0)
    g2 = glide(1175.0, 2349.0, 8.4, 0.016, 2.5, harm=0.1)
    fput(fs + 4.2, g2[:int(7.8 * SR)] * np.concatenate([np.ones(int(7.8 * SR) - 4410), np.linspace(1, 0, 4410)])[:int(7.8 * SR)], 0.2)
    rs = np.random.RandomState(321)
    for k in range(16):
        at = 3.8 + 8.2 * (k / 16.0) ** 0.85
        f = float(rs.choice([1174.7, 1568.0, 1760.0, 2349.0, 2637.0, 3136.0]))
        fput(fs + at, bell(f, 1.8, 0.016 + 0.030 * k / 16.0, 0.8), float(rs.uniform(-0.6, 0.6)))
    # the held breath: one soft pure tone and nothing else
    fput(fs + 11.9, tone(1318.5, 0.9, 'sine', 0.25, 0.5, 0.04), 0)
    # the burst: a rising swell, then the whole sky opens
    fput(fs + 12.4, riser(1.0, 220, 3200, 0.30, 0.32), 0)
    fput(fs + 12.3, pad([146.83, 220.0, 293.66, 369.99, 440.0, 587.33, 739.99, 880.0], 8.2, 0.36, 1.15, 3.4), 0)
    fput(fs + 12.3, pad([73.42, 110.0, 146.83], 6.0, 0.30, 1.0, 2.6), 0)
    # impact
    fput(fe, thump(95, 30, 1.6, 1.05, 0.30), 0)
    fput(fe, band_noise(0.6, 50, 1500) * np.exp(-tt(0.6) / 0.14) * 0.85, 0)
    fput(fe, band_noise(3.6, 1500, 14000) * np.exp(-tt(3.6) / 1.0) * 0.42, 0)
    for k, f in enumerate((587.33, 739.99, 880.0, 1174.66, 1479.98, 1760.0, 2349.3, 2959.96)):
        fput(fe + 0.03 + 0.09 * k, bell(f, 2.0, 0.24, 0.8), -0.5 + 0.14 * k)
    fput(fe + 0.1, sparkle_cascade(4.2, 56, [1174.7, 1480.0, 1760.0, 2349.0, 2960.0, 3520.0], 0.12, 77, 0.0, 0.6), 0)
    fput(fe + 0.1, pad([293.66, 440.0, 587.33, 739.99, 880.0], 6.5, 0.20, 0.4, 3.0), 0)
    # under the card: a slow bell line in D major
    for k, f in enumerate((587.33, 739.99, 880.0, 1108.73, 880.0, 739.99, 987.77, 1174.66, 880.0)):
        fput(fe + 2.0 + 0.8 * k, bell(f, 1.8, 0.10, 0.8), -0.3 + 0.07 * k)
    # card sounds (the letters, the shine) come from the normal mix
    nm = M.wworld(r['z1'])['name']
    put(r['card'], swish(0.6, 0.10), 0.2)
    for k, ch in enumerate(nm):
        if ch != ' ': put(r['card'] + 0.15 + 0.06 * k, tick(2000 + 25 * (k % 7), 0.06), 0.4 - 0.08 * (k % 10))
    put(r['card'] + 1.1, sparkle_cascade(0.8, 5, [2093, 2637, 3136], 0.07, 90), 0)
    put(r['card'] + 4.6, sparkle_cascade(0.8, 3, [2093, 2637, 3136], 0.05, 91), 0)
    put(r['card'] + r['clen'] - 0.55, swish(0.5, 0.07), -0.2)


def build():
    # ---- intro
    put(0.55, swish(0.7, 0.12), 0)
    for k in range(8):
        put(0.45 + 0.05 * k, tick(1500 + 140 * k, 0.07), -0.4 + 0.1 * k)
    put(0.45 + 0.05 * 8, bell(1318.5, 0.9, 0.12), 0)
    put(1.5, swish(0.5, 0.10), 0.3)
    for k in range(3): put(1.95 + 0.25 * k, tone(880 * 1.25 ** k, 0.08, 'square', 0.002, 0.04, 0.09), 0)
    put(4.9, click(0.5), 0.3)
    put(4.95, bell(1046.5, 0.8, 0.18), 0); put(4.95, bell(1568, 0.9, 0.12), 0.2)
    put(5.25, swish(0.5, 0.11), -0.3)
    put(INTRO_T - 0.4, swish(0.5, 0.10), 0.4)
    for r in T.TL[T.SKIP:]:
        i = r['i']; ti = r['ti']; pr = M.PR[i]
        # question bar slides up
        put(r['start'], swish(0.5, 0.12), -0.3)
        put(r['start'] + 0.1, tone(440, 0.12, 'sine', 0.003, 0.05, 0.08), -0.2)
        # typing
        n = len(pr['typed'])
        for k in range(1, n + 1):
            tk = r['ts'] + k * (r['te'] - r['ts']) / n
            put(tk, tick(1700 + rng.randint(0, 700), 0.09), rng.uniform(-0.3, 0.3))
        # lock in, checking, valid
        put(r['lock'], click(0.55), 0.2)
        put(r['lock'] + 0.02, thump(150, 90, 0.15, 0.25, 0.05), 0)
        for k in range(6):
            put(r['chk'] + 0.08 * k, tick(1100 + 140 * k, 0.07), 0.3)
        put(r['val'], bell(1318.5, 0.5, 0.14), 0.2); put(r['val'] + 0.07, bell(1760, 0.6, 0.12), 0.25)
        # rarity roll
        steps = T.roll_step_times(r)
        for k, ts_ in enumerate(steps):
            last = k >= len(steps) - 3
            put(ts_, tick(1250 + 40 * (k % 6), 0.10), -0.2 + 0.08 * (k % 6))
            if last: put(ts_, tone(220, 0.05, 'sine', 0.001, 0.02, 0.12), 0)
        if ti == 5:
            put(r['rev'] - 1.2, riser(1.2, 120, 1800, 0.22, 0.25), 0)
            for k in range(3):                                   # heartbeat in the last crawl
                put(r['rev'] - 1.0 + 0.4 * k, thump(90, 50, 0.2, 0.35, 0.06), 0)
                put(r['rev'] - 1.0 + 0.4 * k + 0.17, thump(80, 45, 0.2, 0.28, 0.06), 0)
        elif ti == 4:
            put(r['rev'] - 0.7, riser(0.7, 180, 1500, 0.15, 0.15), 0)
        # reveal sting at the moment the cursor lands (after the hit-stop)
        put(r['rev'] + TF.STOP[ti], sting(ti), 0, 0.9)
        # point count-up
        for k in range(10):
            put(r['rev'] + 0.2 + k * 0.07, tick(1300 + 70 * k, 0.07), 0.3)
        put(r['rev'] + 0.95, tone(220, 0.16, 'sine', 0.003, 0.06, 0.20, f2=150), 0)
        put(r['rev'] + 0.5, swish(0.4, 0.07), -0.3)
        # charge-up
        put(r['chg'] - 0.02, swish(0.35, 0.07), -0.4)
        put(r['chg'], riser(T.CHARGE, 120, 1300 + 120 * ti, 0.22, 0.25), 0)
        put(r['chg'] + 0.05, thump(130, 40, 0.5, 0.62, 0.14), 0)                # the stamp
        put(r['chg'] + 0.05, band_noise(0.12, 800, 6000) * np.exp(-tt(0.12) / 0.03) * 0.25, 0)
        put(r['chg'] + 0.45, bell(1568 + 100 * ti, 0.6, 0.15), 0.1)             # the gem is absorbed
        put(r['chg'] + 0.45, tone(300, 0.2, 'sine', 0.002, 0.07, 0.15, f2=900), 0)
        # dive
        if r['fin']:
            finale(r)
            continue
        put(r['fs'], whoosh(r), 0, 0.95)
        put(r['fs'], thump(180, 60, 0.35, 0.4, 0.09), 0)
        for tcx, wk in T.cross_times(r):
            k = wk - r['z0']
            put(tcx, mx(tone(700 + 95 * k, 0.14, 'sine', 0.002, 0.05, 0.20), tone(1400 + 190 * k, 0.14, 'sine', 0.002, 0.03, 0.08)), 0.3 if k % 2 else -0.3)
            put(tcx, bell(1046.5 * 1.06 ** k, 0.5, 0.10), 0.0)
            put(tcx, thump(100, 60, 0.15, 0.18, 0.05), 0)
        # landing
        put(r['fe'], thump(95, 35, 0.6, 0.85 if r['dz'] > 0 else 0.5, 0.15), 0)
        put(r['fe'], band_noise(0.25, 100, 2500) * np.exp(-tt(0.25) / 0.07) * (0.35 if r['dz'] > 0 else 0.2), 0)
        put(r['fe'] + 0.02, bell(880, 0.8, 0.18), 0); put(r['fe'] + 0.12, bell(1320, 0.8, 0.14), 0.2)
        if r['card_on']:
            nm = M.wworld(r['z1'])['name']
            put(r['card'], swish(0.6, 0.10), 0.2)
            put(r['card'], pad([220, 329.6, 440, 554.4], r['clen'] - 1.0, 0.12, 0.3, 2.4), 0)
            for k, ch in enumerate(nm):
                if ch != ' ': put(r['card'] + 0.12 + 0.05 * k, tick(2000 + 25 * (k % 7), 0.06), 0.4 - 0.08 * (k % 10))
            put(r['card'] + 0.12 + 0.05 * len(nm) + 0.1, sparkle_cascade(0.8, 5, [2093, 2637, 3136], 0.07, 20 + i), 0)
            put(r['card'] + 3.9, sparkle_cascade(0.8, 3, [2093, 2637, 3136], 0.05, 40 + i), 0)        # the second shine across the name
            put(r['card'] + r['clen'] - 0.55, swish(0.5, 0.07), -0.2)
    # ---- report
    R0 = T.REPORT
    put(R0, swish(0.6, 0.13), 0)
    put(R0 + 0.4, swish(0.5, 0.1), 0.4)
    for i in range(7):
        put(R0 + 1.0 + 0.28 * i, tick(1300 + 120 * i, 0.10), -0.3 + 0.1 * i)
        put(R0 + 1.0 + 0.28 * i, bell(1046.5 * (1.12 ** i), 0.25, 0.05), -0.3 + 0.1 * i)
    for k in range(14): put(R0 + 0.7 + k * 0.07, tick(1100 + 70 * k, 0.06), 0.3)
    for i, f in enumerate([523.25, 659.25, 783.99, 1046.5]): put(R0 + 3.4 + 0.09 * i, bell(f, 1.8, 0.22), 0)
    put(R0 + 3.4, tone(130.8, 1.4, 'tri', 0.01, 0.5, 0.3), 0)


INTRO_T = T.INTRO


def drone():
    # a quiet bed that sinks in pitch as the explorer shrinks (follows the depth u of the camera)
    ts_ = np.arange(0, T.TOTAL + 1.5, 0.02)
    u = np.array([T.cam(min(t_, T.TOTAL - 1e-3))['u'] for t_ in ts_])
    sp = np.array([T.cam(min(t_, T.TOTAL - 1e-3))['s'] for t_ in ts_])
    tt_ = np.arange(N) / SR
    uu = np.interp(tt_, ts_, u); ss = np.interp(tt_, ts_, sp)
    f0 = np.maximum(30.0, 82.4 * 2 ** (-uu / 9.0))            # sinks as you shrink, but never below an audible 30 Hz
    out = np.zeros(N)
    for k, (m, a) in enumerate(((1.0, 1.0), (1.5, 0.55), (2.0, 0.4), (3.01, 0.18))):
        ph = 2 * np.pi * np.cumsum(f0 * m * (1 + 0.003 * np.sin(2 * np.pi * (0.13 + 0.04 * k) * tt_ + k)) ) / SR
        out += a * np.sin(ph)
    out *= 0.5 + 0.5 * np.sin(2 * np.pi * 0.08 * tt_ + 1.0) ** 2
    air = np.resize(band_noise(N / SR, 300, 3000), N) * (0.25 + 0.75 * ss)
    out = out * 0.030 + air * 0.010
    fade_in = np.minimum(tt_ / 2.0, 1.0)
    return (out * fade_in).astype(np.float32)


build()
_d = drone(); L += _d; R += _d


def reverb(x, wet=0.16, rt=0.9):
    from scipy.signal import fftconvolve
    n = int(rt * SR); t = np.arange(n) / SR
    ir = np.random.RandomState(5).randn(n) * np.exp(-t / 0.28)
    ir[:int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    ir /= np.abs(ir).sum() * 0.12
    return x + wet * fftconvolve(x, ir)[:len(x)].astype(np.float32)


L = reverb(L); R = reverb(R * 0.98)
peak = max(np.abs(L).max(), np.abs(R).max())
# gentle compressor: lift the quiet UI sounds relative to the big hits
from scipy.signal import lfilter
a_ = math.exp(-1 / (0.30 * SR))
env = lfilter([1 - a_], [1, -a_], np.maximum(np.abs(L), np.abs(R)).astype(np.float64))
gain = np.clip((0.11 / (env + 0.012)) ** 0.42, 0.55, 2.6).astype(np.float32)
gain = lfilter([1 - 0.9995], [1, -0.9995], gain)         # smooth
gain = np.minimum(gain, 2.6)
L = L * gain; R = R * gain
# soft limiter: keep dynamics, never clip
g = 1.0 / np.percentile(np.abs(np.concatenate([L[::7], R[::7]])), 99.9)
L = np.tanh(L * g * 0.9) ; R = np.tanh(R * g * 0.9)
pk2 = max(np.abs(L).max(), np.abs(R).max())
L *= 0.80 / pk2; R *= 0.80 / pk2
# the world 21 dive: the whole interface mix drops away (the finale stems carry the sound)
duck = np.ones(N, np.float32)
tn = np.arange(N) / SR
for fs_, fe_ in FIN_WINDOWS:
    d_ = np.ones(N, np.float32)
    down = np.clip((tn - (fs_ + 0.5)) / 1.9, 0, 1); up = np.clip((tn - (fe_ + 0.5)) / 1.2, 0, 1)
    sm = lambda x: x * x * (3 - 2 * x)
    d_ = 1 - 0.97 * sm(down) * (1 - sm(up))
    duck = np.minimum(duck, d_.astype(np.float32))
L *= duck; R *= duck
if FIN_WINDOWS:
    FLr = reverb(FL, 0.30, 1.8); FRr = reverb(FR * 0.98, 0.30, 1.8)
    L = L + FLr; R = R + FRr
    L = np.tanh(L * 1.05) * 0.93; R = np.tanh(R * 1.05) * 0.93
pk3 = max(np.abs(L).max(), np.abs(R).max())
f0 = int((T.TOTAL - 0.8) * SR)
fade = np.ones(N, np.float32); fade[f0:] = np.linspace(1, 0, N - f0)
L *= min(1.0, 0.92 / pk3) * fade; R *= min(1.0, 0.92 / pk3) * fade
st = np.stack([L, R], 1)
pcm = (np.clip(st, -1, 1) * 32767).astype('<i2')
with wave.open('/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/v21/audio21_%s.wav' % M.RUN, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('raw peak', round(float(peak), 2), 'seconds', round(N / SR, 1), 'rms', round(float(np.sqrt((st ** 2).mean())), 3))

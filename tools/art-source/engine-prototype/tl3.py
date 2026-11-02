"""Timeline and camera for the v3 walkthrough (pure data + functions of t)."""
import math
import numpy as np
import mini as M
from mini import clamp01, smooth, ease_out, ease_in_out, size_of, nice_bar, PR, TIERS, EXP_H

INTRO = 6.4
ROLL_DUR = [1.3, 1.45, 1.6, 1.8, 2.1, 2.5]      # how long the rarity slot cursor runs (longer for the rarer results)
REV_HOLD = [1.5, 1.8, 2.1, 2.6, 3.1, 3.9]      # how long the celebration plays before the dive starts
CHARGE = 0.7                                    # crouch / charge-up before the dive
CARD_LEN = 7.0                                  # world title card: the SAME length for every world. Description is fully visible for
                                                # 5.4 s (1.0 s to 6.4 s), enough to read the longest one (18 words) at 200 words per minute.
CARD_GAP = 0.4                                  # pause after the card before the next question slides up
FINAL_READ = 1.2                                # last landing: pause after the card before the report (the field note is gone)
VOID_HOLD = 1.7                                 # a landing inside the unexplored stretch (no card): time on the result before the next question
FIN_DUR = 13.4                                  # the world 21 dive
FIN_CARD_AT = 1.3                               # the finale card starts this long after the landing
FIN_CARD_LEN = 9.0
SKIP = M.SKIP                                   # answers already played before this chapter starts (chapter 2 only)
REPORT_LEN = 10.5


def _profile():
    n = 8001; tau = np.linspace(0, 1, n); a = 0.15; b = 0.36
    sm = lambda x: x * x * (3 - 2 * x)
    v = sm(np.clip(tau / a, 0, 1)) * sm(np.clip((1 - tau) / b, 0, 1))
    pos = np.concatenate([[0], np.cumsum((v[1:] + v[:-1]) / 2)]); pos /= pos[-1]
    vel = np.gradient(pos, tau)
    return tau, pos, vel


TAU, POS, VEL = _profile()

# ---- the world 21 dive: a quiet build. z offset (worlds travelled, 0..5) against seconds from the start of the dive.
# Fast launch, then the camera slows to a drift through the dark, holds its breath, and opens into Planck Foam in the last second.
from scipy.interpolate import PchipInterpolator
FIN_PTS = [(0.0, 0.0), (1.2, 0.42), (2.4, 1.42), (4.2, 3.05), (6.4, 3.95), (8.4, 4.35), (10.4, 4.57), (12.4, 4.69), (12.9, 4.76), (13.4, 5.0)]
_fz = PchipInterpolator([a for a, b in FIN_PTS], [b for a, b in FIN_PTS])
_fv = _fz.derivative()
_FT = np.linspace(0, FIN_DUR, 6701)
_FZ = _fz(_FT)


FIN_BEATS = [4.3, 5.55, 6.75, 7.85, 8.85, 9.75, 10.55, 11.25, 11.85]      # heartbeats during the drift (seconds after the dive starts); the second beat follows 0.17 s later


def fin_z(tau):
    return float(_fz(min(max(tau, 0.0), FIN_DUR)))


def fin_v(tau):
    return float(_fv(min(max(tau, 0.0), FIN_DUR)))


def fin_hush(tau):
    """0 at the launch, 1 through the drift, 0 again at the burst. Drives the dimming of the interface and the sound."""
    return smooth(0.9, 2.8, tau) * (1 - smooth(FIN_DUR - 1.0, FIN_DUR - 0.15, tau))


def prof(x):
    x = clamp01(x); return float(np.interp(x, TAU, POS)), float(np.interp(x, TAU, VEL))


def build():
    L = []; t = INTRO; cum = 0
    for i, pr in enumerate(PR):
        ti = pr['tier']; pts = TIERS[ti][1]; c0 = cum; cum += pts
        r = dict(i=i, ti=ti, pts=pts, c0=c0, c1=cum, u0=c0 / 20, u1=cum / 20, z0=c0 // 20, z1=cum // 20)
        r['dz'] = r['z1'] - r['z0']
        if i < SKIP:                       # played before the chapter starts: every event is long past
            for k in ('start', 'ts', 'te', 'lock', 'chk', 'val', 'roll', 'rev', 'chg', 'fs', 'fe', 'card', 'next'): r[k] = -100.0
            r['fin'] = False; r['card_on'] = False; r['clen'] = CARD_LEN
            r['dur'] = 1.5 + 0.8 * r['dz']
            L.append(r); continue
        r['start'] = t
        r['ts'] = t + (2.5 if i == SKIP else 2.2)
        r['te'] = r['ts'] + len(pr['typed']) * 0.1
        r['lock'] = r['te'] + 0.5
        r['chk'] = r['lock'] + 0.2
        r['val'] = r['chk'] + 0.65
        r['roll'] = r['val'] + 0.4
        r['rev'] = r['roll'] + ROLL_DUR[ti]
        r['chg'] = r['rev'] + REV_HOLD[ti]
        r['fs'] = r['chg'] + CHARGE
        r['fin'] = (r['z1'] == M.LAST_SLOT and r['dz'] > 0)
        r['card_on'] = r['dz'] > 0 and M.dw(r['z1']) != M.dw(r['z0'])
        r['dur'] = FIN_DUR if r['fin'] else (1.9 if r['dz'] == 0 else 1.5 + 0.8 * r['dz'])
        r['fe'] = r['fs'] + r['dur']
        r['card'] = r['fe'] + (FIN_CARD_AT if r['fin'] else 0.15)
        clen = FIN_CARD_LEN if r['fin'] else CARD_LEN
        r['clen'] = clen
        if i == len(PR) - 1: t = r['card'] + (clen if r['card_on'] else 0.0) + FINAL_READ          # last landing: card, a short pause, then the report
        elif r['card_on']: t = r['card'] + clen + CARD_GAP
        elif r['dz'] > 0: t = r['fe'] + VOID_HOLD
        else: t = r['fe'] + 1.1
        r['next'] = t
        L.append(r)
    return L


TL = build()
REPORT = TL[-1]['next']
TOTAL = REPORT + REPORT_LEN


def cross_times(r):
    """[(time, world index entered)] for each world boundary passed during the dive."""
    out = []
    for k in range(1, r['dz'] + 1):
        if r['fin']:
            j = min(int(np.searchsorted(_FZ, k - 1e-9)), len(_FT) - 1)
            out.append((r['fs'] + float(_FT[j]), r['z0'] + k)); continue
        j = min(int(np.searchsorted(POS, k / r['dz'])), len(TAU) - 1)
        out.append((r['fs'] + float(TAU[j]) * r['dur'], r['z0'] + k))
    return out


def roll_pos(r, t):
    ti = r['ti']; S = 12 + ti
    tau = clamp01((t - r['roll']) / ROLL_DUR[ti])
    return S * (1 - (1 - tau) ** 2.8)


def roll_step_times(r):
    ti = r['ti']; S = 12 + ti; T = ROLL_DUR[ti]
    return [r['roll'] + T * (1 - (1 - k / S) ** (1 / 2.8)) for k in range(1, S + 1)]


def cur_rec(t):
    r = TL[SKIP]
    for rr in TL[SKIP:]:
        if t >= rr['start']: r = rr
    return r


def prev_rec(r):
    return TL[r['i'] - 1] if r['i'] > 0 else None


def cam(t):
    """Camera: u (true size position, decades), z (visual zoom), pulse, spd (decades/s), s (0..1 speed), fall (index or None), p."""
    base = None
    for r in TL:
        if t < r['fs']:
            pulse = 1.0
            if t >= r['chg']:
                q = clamp01((t - r['chg']) / CHARGE); pulse = 1 + 0.035 * q * q
            base = dict(u=r['u0'], z=float(r['z0']), pulse=pulse, spd=0.0, s=0.0, fall=None, fi=r['i'], p=0.0)
            break
        if t < r['fe'] and r['fin']:
            ts_ = t - r['fs']
            zz = fin_z(ts_); p = zz / r['dz']
            spd = fin_v(ts_)
            hk = 1 - 0.9 * smooth(1.6, 3.0, ts_)
            base = dict(u=r['u0'] + (r['u1'] - r['u0']) * p, z=r['z0'] + zz, pulse=1 + 0.035 * (1 - smooth(0, 0.35, ts_)), spd=spd,
                        s=max(clamp01(spd / 1.15) ** 0.8 * hk, 0.85 * smooth(FIN_DUR - 1.0, FIN_DUR - 0.1, ts_)), fall=r['i'], fi=r['i'], p=p)
            break
        if t < r['fe']:
            tau = (t - r['fs']) / r['dur']
            p, v = prof(tau)
            u = r['u0'] + (r['u1'] - r['u0']) * p
            if r['dz'] == 0:
                b = math.sin(math.pi * clamp01(tau)) ** 2
                base = dict(u=u, z=float(r['z0']), pulse=10 ** (0.14 * b) * (1 + 0.035 * (1 - smooth(0, 0.35, t - r['fs']))), spd=0.9 * b, s=0.8 * b, fall=r['i'], fi=r['i'], p=p)
                break
            spd = v * r['dz'] / r['dur']
            base = dict(u=u, z=r['z0'] + r['dz'] * p, pulse=1 + 0.035 * (1 - smooth(0, 0.35, t - r['fs'])), spd=spd,
                        s=clamp01(spd / 1.15) ** 0.8, fall=r['i'], fi=r['i'], p=p)
            break
    if base is None:
        r = TL[-1]
        base = dict(u=r['u1'], z=float(r['z1']), pulse=1.0, spd=0.0, s=0.0, fall=None, fi=r['i'], p=1.0)
    # landing punch: instant small zoom-in that eases away
    for r in TL:
        if r['fe'] <= t < r['fe'] + 1.0:
            tau = t - r['fe']
            base['pulse'] *= 1 + (0.11 if r['fin'] else 0.05 if r['dz'] > 0 else 0.02) * smooth(0, 0.04, tau) * math.exp(-(5.0 if r['fin'] else 7.5) * tau)
    return base


def bar_state(t):
    """Scale bar: (px length, label value, flash 0..1). Spring toward the nice bar value."""
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


def score_at(t):
    s = 0
    for r in TL:
        if t >= r['rev'] + 0.5:
            f = clamp01((t - (r['rev'] + 0.5)) / 0.7)
            if t < r['rev'] + 1.2: return int(r['c0'] + r['pts'] * ease_out(f))
            s = r['c1']
    return s


if __name__ == '__main__':
    for r in TL:
        print({k: (round(v, 2) if isinstance(v, float) else v) for k, v in r.items()})
    print('REPORT', round(REPORT, 2), 'TOTAL', round(TOTAL, 2), 'frames', int(TOTAL * 60))
    print('cross', [(round(a, 2), b) for r in TL for a, b in cross_times(r)])

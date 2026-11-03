/**
 * Timeline and camera. In the design tool every record was known in advance; in the game a record is created when its question
 * appears, and the rest of its schedule (roll, reveal, charge, dive, card, next question) is filled in when the answer is judged.
 * Times that are not known yet are Infinity, so every "is it time yet?" test simply says no.
 */
import {
  CARD_GAP, CARD_LEN, CHARGE, FIN_CARD_AT, FIN_CARD_LEN, FIN_DUR, FIN_PTS, FINAL_READ, HINT_HOLD, LAND_HOLD, POST_HOLD, REV_HOLD, ROLL_DUR, VOID_HOLD,
} from './config'
import { clamp01, smooth } from './util'
import { diveSeconds, displaySlot, factorLabel, niceBar, RUN_LENGTH, sizeOfU, TIERS, type RunRecord } from '@minitude/core'

export interface Rec {
  i: number
  miss: boolean
  /** the answer has been judged and the schedule below is real */
  known: boolean
  ti: number
  pts: number
  c0: number; c1: number
  u0: number; u1: number
  z0: number; z1: number
  dz: number
  fin: boolean
  cardOn: boolean
  /** the question appears */
  start: number
  /** Enter pressed */
  lock: number
  chk: number
  val: number
  roll: number
  rev: number
  chg: number
  fs: number
  fe: number
  card: number
  clen: number
  dur: number
  next: number
  /** when the round square on the top bar fills in */
  dotAt: number
  /** a miss: when the time ran out */
  missAt: number
  /** the divide-by stamp of the dive, or null when the size does not change */
  stamp: string | null
  typed: string
  answer: string
  desc: string
  hintLevel: 0 | 1 | 2
  post: 0 | 1 | 2
  postVariant: number
  core: RunRecord | null
}

const INF = Infinity

export function newRec(i: number, start: number, c0: number, u0: number, z0: number): Rec {
  return {
    i, miss: false, known: false, ti: 0, pts: 0, c0, c1: c0, u0, u1: u0, z0, z1: z0, dz: 0, fin: false, cardOn: false,
    start, lock: INF, chk: INF, val: INF, roll: INF, rev: INF, chg: INF, fs: INF, fe: INF, card: INF, clen: CARD_LEN, dur: 0, next: INF,
    dotAt: INF, missAt: INF, stamp: null, typed: '', answer: '', desc: '', hintLevel: 0, post: 0, postVariant: 0, core: null,
  }
}

// ------------------------------------------------------------------ the dive velocity profile
const N_PROF = 8001
const TAU = new Float64Array(N_PROF), POS = new Float64Array(N_PROF), VEL = new Float64Array(N_PROF)
;(() => {
  const a = 0.15, b = 0.36
  const sm = (x: number) => x * x * (3 - 2 * x)
  const v = new Float64Array(N_PROF)
  for (let k = 0; k < N_PROF; k++) {
    const tau = k / (N_PROF - 1)
    TAU[k] = tau
    v[k] = sm(clamp01(tau / a)) * sm(clamp01((1 - tau) / b))
  }
  POS[0] = 0
  for (let k = 1; k < N_PROF; k++) POS[k] = POS[k - 1] + (v[k] + v[k - 1]) / 2
  const tot = POS[N_PROF - 1]
  for (let k = 0; k < N_PROF; k++) POS[k] /= tot
  const h = 1 / (N_PROF - 1)
  for (let k = 0; k < N_PROF; k++) {
    if (k === 0) VEL[k] = (POS[1] - POS[0]) / h
    else if (k === N_PROF - 1) VEL[k] = (POS[k] - POS[k - 1]) / h
    else VEL[k] = (POS[k + 1] - POS[k - 1]) / (2 * h)
  }
})()
function interp(x: number, xs: Float64Array, ys: Float64Array): number {
  if (x <= xs[0]) return ys[0]
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1]
  let lo = 0, hi = xs.length - 1
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m }
  const f = (x - xs[lo]) / (xs[hi] - xs[lo])
  return ys[lo] + (ys[hi] - ys[lo]) * f
}
/** first index with arr[idx] >= v (like numpy searchsorted, side left) */
function lowerBound(arr: Float64Array, v: number): number {
  let lo = 0, hi = arr.length
  while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] < v) lo = m + 1; else hi = m }
  return lo
}
export function prof(x: number): [number, number] {
  const u = clamp01(x)
  return [interp(u, TAU, POS), interp(u, TAU, VEL)]
}

// ------------------------------------------------------------------ the world 21 dive: a monotone cubic through FIN_PTS (same as scipy's PCHIP)
function pchip(pts: [number, number][]): { f: (x: number) => number; d: (x: number) => number } {
  const n = pts.length
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  const h: number[] = [], del: number[] = []
  for (let i = 0; i < n - 1; i++) { h.push(xs[i + 1] - xs[i]); del.push((ys[i + 1] - ys[i]) / h[i]) }
  const m: number[] = new Array(n).fill(0)
  for (let i = 1; i < n - 1; i++) {
    if (del[i - 1] * del[i] > 0) {
      const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]
      m[i] = (w1 + w2) / (w1 / del[i - 1] + w2 / del[i])
    }
  }
  const edge = (h0: number, h1: number, d0: number, d1: number) => {
    let d = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1)
    if (Math.sign(d) !== Math.sign(d0)) d = 0
    else if (Math.sign(d0) !== Math.sign(d1) && Math.abs(d) > 3 * Math.abs(d0)) d = 3 * d0
    return d
  }
  m[0] = edge(h[0], h[1], del[0], del[1])
  m[n - 1] = edge(h[n - 2], h[n - 3], del[n - 2], del[n - 3])
  const seg = (x: number) => { let i = 0; while (i < n - 2 && x > xs[i + 1]) i++; return i }
  return {
    f: (x) => {
      const i = seg(x), t = (x - xs[i]) / h[i], t2 = t * t, t3 = t2 * t
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h[i] * m[i + 1]
    },
    d: (x) => {
      const i = seg(x), t = (x - xs[i]) / h[i], t2 = t * t
      return ((6 * t2 - 6 * t) * ys[i] + (3 * t2 - 4 * t + 1) * h[i] * m[i] + (-6 * t2 + 6 * t) * ys[i + 1] + (3 * t2 - 2 * t) * h[i] * m[i + 1]) / h[i]
    },
  }
}
const FZ = pchip(FIN_PTS)
const N_FT = 6701
const FT = new Float64Array(N_FT)
for (let k = 0; k < N_FT; k++) FT[k] = (k / (N_FT - 1)) * FIN_DUR

/** worlds travelled (0..dz) after tau seconds of the finale dive. The shape is fixed; a longer dive just travels the extra worlds early. */
export function finZ(tau: number, dz: number): number {
  const t = Math.min(Math.max(tau, 0), FIN_DUR)
  if (dz >= 5) return FZ.f(t) + (dz - 5) * smooth(0, 3.2, t)
  return (dz * FZ.f(t)) / 5
}
export function finV(tau: number, dz: number): number {
  const t = Math.min(Math.max(tau, 0), FIN_DUR)
  if (dz >= 5) {
    const x = clamp01(t / 3.2)
    return FZ.d(t) + (dz - 5) * (6 * x * (1 - x)) / 3.2 * (t < 3.2 ? 1 : 0)
  }
  return (dz * FZ.d(t)) / 5
}
/** 0 at the launch, 1 through the drift, 0 again at the burst. Drives the dimming of the interface and the sound. */
export function finHush(tau: number): number {
  return smooth(0.9, 2.8, tau) * (1 - smooth(FIN_DUR - 1.0, FIN_DUR - 0.15, tau))
}

// ------------------------------------------------------------------ the schedule of one record
export interface PhaseInput {
  /** time the Enter key was pressed */
  lock: number
  /** time the judge's answer arrived */
  respondedAt: number
}
/** fill in everything after the answer was judged */
export function schedule(r: Rec, core: RunRecord, inp: PhaseInput, hold?: { hint?: boolean }): void {
  r.core = core
  r.known = true
  r.miss = false
  r.ti = core.tier
  r.pts = core.points
  r.c0 = core.c0; r.c1 = core.c1; r.u0 = core.u0; r.u1 = core.u1; r.z0 = core.z0; r.z1 = core.z1; r.dz = core.dz
  r.fin = core.finale
  r.hintLevel = core.hintLevel
  r.post = core.post
  r.lock = inp.lock
  r.chk = r.lock + 0.2
  r.val = Math.max(r.chk + 0.65, inp.respondedAt)
  r.roll = r.val + 0.4
  r.rev = r.roll + ROLL_DUR[r.ti]
  r.chg = r.rev + REV_HOLD[r.ti]
  r.fs = r.chg + CHARGE
  r.dur = r.fin ? FIN_DUR : r.dz === 0 ? 1.9 : diveSeconds(r.z0, r.z1)
  r.fe = r.fs + r.dur
  r.cardOn = r.dz > 0 && displaySlot(r.z1) !== displaySlot(r.z0)
  r.card = r.fe + (r.fin ? FIN_CARD_AT : 0.15)
  r.clen = r.fin ? FIN_CARD_LEN : CARD_LEN
  r.dotAt = r.rev + 0.4
  r.stamp = factorLabel(TIERS[r.ti].factor, r.pts, r.u0, r.u1)
  computeNext(r)
}
export function computeNext(r: Rec): void {
  const last = r.i === RUN_LENGTH - 1
  const lines = r.hintLevel > 0 || r.post > 0
  if (r.miss) { r.next = r.missAt + (last ? 1.2 : 1.7); return }
  if (last) {
    const base = r.cardOn ? r.card + r.clen : r.fe + 0.15
    r.next = base + (lines && !r.cardOn ? 2.9 : FINAL_READ)
  } else if (r.cardOn) r.next = r.card + r.clen + CARD_GAP
  else if (r.dz > 0) r.next = r.fe + (r.hintLevel > 0 ? HINT_HOLD : VOID_HOLD)
  else r.next = r.fe + (r.post > 0 ? POST_HOLD : LAND_HOLD)
}
export function makeMiss(r: Rec, at: number, core: RunRecord): void {
  r.core = core
  r.miss = true
  r.known = true
  r.missAt = at
  r.dotAt = at
  r.c1 = r.c0; r.u1 = r.u0; r.z1 = r.z0; r.dz = 0
  computeNext(r)
}
/** the player tapped the title card away: it fades over 0.6 s and the next question follows */
export function skipCard(r: Rec, t: number): void {
  const tau = t - r.card
  if (!r.cardOn || tau < 0.4 || tau > r.clen - 0.7) return
  r.clen = tau + 0.6
  computeNext(r)
}

// ------------------------------------------------------------------ camera, as a function of time over the records so far
export interface Cam {
  u: number
  z: number
  pulse: number
  spd: number
  /** speed 0..1 for the effects */
  s: number
  fall: number | null
  fi: number
  p: number
}

export class Timeline {
  recs: Rec[] = []

  last(): Rec | undefined { return this.recs[this.recs.length - 1] }

  /** [time, slot entered] for each world boundary passed during the dive */
  crossTimes(r: Rec): [number, number][] {
    const out: [number, number][] = []
    if (!r.known || r.miss) return out
    for (let k = 1; k <= r.dz; k++) {
      if (r.fin) {
        // first time the travelled distance reaches k
        let lo = 0, hi = N_FT - 1
        while (lo < hi) { const m = (lo + hi) >> 1; if (finZ(FT[m], r.dz) < k - 1e-9) lo = m + 1; else hi = m }
        out.push([r.fs + FT[Math.min(lo, N_FT - 1)], r.z0 + k])
        continue
      }
      const j = Math.min(lowerBound(POS, k / r.dz), N_PROF - 1)
      out.push([r.fs + TAU[j] * r.dur, r.z0 + k])
    }
    return out
  }

  rollPos(r: Rec, t: number): number {
    const S = 12 + r.ti
    const tau = clamp01((t - r.roll) / ROLL_DUR[r.ti])
    return S * (1 - (1 - tau) ** 2.8)
  }
  rollStepTimes(r: Rec): number[] {
    const S = 12 + r.ti, T = ROLL_DUR[r.ti]
    const out: number[] = []
    for (let k = 1; k <= S; k++) out.push(r.roll + T * (1 - (1 - k / S) ** (1 / 2.8)))
    return out
  }

  /** the record whose question is on screen (the latest started) */
  curRec(t: number): Rec {
    let r = this.recs[0]
    for (const rr of this.recs) if (t >= rr.start) r = rr
    return r
  }

  cam(t: number): Cam {
    let base: Cam | null = null
    for (const r of this.recs) {
      // A time-out has no dive, so its fs is Infinity and "t < r.fs" would stay true for the rest of the run: the camera would be
      // held at that question's start for ever and every later dive would be skipped. Once the next question has begun, move on.
      if (r.miss && t >= r.next) continue
      if (t < r.fs) {
        let pulse = 1.0
        if (t >= r.chg) { const q = clamp01((t - r.chg) / CHARGE); pulse = 1 + 0.035 * q * q }
        base = { u: r.u0, z: r.z0, pulse, spd: 0, s: 0, fall: null, fi: r.i, p: 0 }
        break
      }
      if (t < r.fe && r.fin) {
        const ts = t - r.fs
        const zz = finZ(ts, r.dz), p = zz / r.dz
        const spd = finV(ts, r.dz)
        const hk = 1 - 0.9 * smooth(1.6, 3.0, ts)
        base = {
          u: r.u0 + (r.u1 - r.u0) * p, z: r.z0 + zz, pulse: 1 + 0.035 * (1 - smooth(0, 0.35, ts)), spd,
          s: Math.max(clamp01(spd / 1.15) ** 0.8 * hk, 0.85 * smooth(FIN_DUR - 1.0, FIN_DUR - 0.1, ts)), fall: r.i, fi: r.i, p,
        }
        break
      }
      if (t < r.fe) {
        const tau = (t - r.fs) / r.dur
        const [p, v] = prof(tau)
        const u = r.u0 + (r.u1 - r.u0) * p
        if (r.dz === 0) {
          const b = Math.sin(Math.PI * clamp01(tau)) ** 2
          base = { u, z: r.z0, pulse: 10 ** (0.14 * b) * (1 + 0.035 * (1 - smooth(0, 0.35, t - r.fs))), spd: 0.9 * b, s: 0.8 * b, fall: r.i, fi: r.i, p }
          break
        }
        const spd = (v * r.dz) / r.dur
        base = { u, z: r.z0 + r.dz * p, pulse: 1 + 0.035 * (1 - smooth(0, 0.35, t - r.fs)), spd, s: clamp01(spd / 1.15) ** 0.8, fall: r.i, fi: r.i, p }
        break
      }
    }
    if (!base) {
      const r = this.recs[this.recs.length - 1]
      base = r ? { u: r.u1, z: r.z1, pulse: 1, spd: 0, s: 0, fall: null, fi: r.i, p: 1 } : { u: 0, z: 0, pulse: 1, spd: 0, s: 0, fall: null, fi: 0, p: 0 }
    }
    for (const r of this.recs) {
      if (r.fe <= t && t < r.fe + 1.0) {
        const tau = t - r.fe
        base.pulse *= 1 + (r.fin ? 0.11 : r.dz > 0 ? 0.05 : 0.02) * smooth(0, 0.04, tau) * Math.exp(-(r.fin ? 5.0 : 7.5) * tau)
      }
    }
    return base
  }

  /** scale bar: (px length, label value, flash 0..1). A spring toward the nice bar value, integrated from 0.5 s before t. */
  barState(t: number): [number, number, number] {
    const t0 = t - 0.5, dt = 1 / 240
    const tgt = (tt: number): [number, number] => {
      const S = sizeOfU(this.cam(tt).u)
      const B = niceBar(S)
      return [(B * 200) / S, B]
    }
    let [L, Bc] = tgt(t0)
    let v = 0, lastchg = -9
    const n = Math.round((t - t0) / dt), w = 18
    for (let k = 0; k <= n; k++) {
      const tt = t0 + k * dt
      const [Lt, Bt] = tgt(tt)
      if (Math.abs(Bt - Bc) > Bc * 1e-6) { Bc = Bt; lastchg = tt }
      const a = w * w * (Lt - L) - 2 * w * v
      v += a * dt
      L += v * dt
    }
    const B = niceBar(sizeOfU(this.cam(t).u))
    return [L, B, lastchg > -1 ? clamp01(1 - (t - lastchg) / 0.25) : 0]
  }
}


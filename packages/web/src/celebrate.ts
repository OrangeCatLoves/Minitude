/** Rarity celebrations, charge-up, dive juice, landing impact, world title cards, intro title (port of the design tool's tfx3 / minui21 pieces). */
import { CARD_LEN, CHARGE, FEET, FOC, GEM, HOP, INTRO_EXIT, OX, OY, REV_HOLD, SHAKE_K, STAMP, STOP, TITLE_COL, TITLES, W, H, SCRIM, OFF, SOFT } from './config'
import { backOut, ck, clamp01, easeInOut, easeOut, lerpc, rnd, smooth, type RGB } from './util'
import { addMask, bigTitle, ctxOf, letters, putText, rect, shade, vignette, radialAdd, tint, PXF, SILF, textWidth, type Ctx } from './draw'
import { AddLayer, burst, confetti, halftoneAdd, inward, lightning, pxstar, ring, sunburstAdd, twinkleStars } from './fx'
import type { Cam, Rec, Timeline } from './timeline'
import { TIERS, displaySlot, isVoidSlot, worldOfSlot } from '@minitude/core'

export const tc = (ti: number): RGB => TIERS[ti].edge
export const gemCy = (ti: number): number => 296 - HOP[ti] - 8 - GEM[ti] / 2

/** hit-stop: the effect clock freezes for a moment at the reveal of the rarer tiers */
export function fxTau(ti: number, tau: number): number {
  const s = STOP[ti]
  if (tau < 0.03) return tau
  if (tau < 0.03 + s) return 0.03
  return tau - s
}
export function envOf(ti: number, tau: number): number {
  const hold = REV_HOLD[ti]
  return smooth(0, 0.10, tau) * (1 - smooth(hold - 0.45, hold + 0.25, tau))
}

export interface Pose { sx: number; sy: number; dx: number; dy: number; aura: number; glow: number }

export function pose(tl: Timeline, t: number, c: Cam, r: Rec): Pose {
  let sx = 1, sy = 1, dy = 0, dx = 0, aura = 0, glow = 0
  const ti = r.ti
  if (r.lock <= t && t < r.rev) aura = 1
  const tau = t - r.rev
  if (r.known && !r.miss && tau >= 0 && tau < r.chg - r.rev + 0.01) {
    const q = clamp01(tau / 0.6)
    dy = -HOP[ti] * 4 * q * (1 - q)
    if (tau < 0.07) { sy = 1 - 0.07 * Math.sin((Math.PI * tau) / 0.07); sx = 1 + 0.04 * Math.sin((Math.PI * tau) / 0.07) }
    else if (q < 1) { sy = 1 + 0.06 * Math.sin(Math.PI * q); sx = 1 - 0.035 * Math.sin(Math.PI * q) }
    aura = 2; glow = 0.35 + 0.1 * ti
  }
  if (r.chg <= t && t < r.fs) {
    const q = easeInOut((t - r.chg) / CHARGE)
    sy = 1 - 0.10 * q; sx = 1 + 0.06 * q
    dx = Math.round(Math.sin(t * 90) * 1.2 * q)
    aura = 2; glow = 0.6 + 0.6 * q
  }
  if (r.fs <= t && t < r.fe) {
    const tt = t - r.fs
    const la = Math.exp(-tt * 7) * smooth(0, 0.04, tt)
    sy = 1 + 0.15 * la + 0.05 * c.s; sx = 1 - 0.08 * la - 0.03 * c.s
    aura = Math.trunc(t * 12) % 2 === 0 ? 2 : 1; glow = 0.5 + 0.5 * c.s
  }
  for (const rr of tl.recs) {
    if (rr.fe <= t && t < rr.fe + 0.9) {
      const tt = t - rr.fe, e = Math.exp(-8 * tt)
      sy *= 1 - 0.17 * e * Math.cos(2 * Math.PI * 3.0 * tt) * smooth(0, 0.02, tt)
      sx *= 1 + 0.10 * e * Math.cos(2 * Math.PI * 3.0 * tt) * smooth(0, 0.02, tt)
      glow = Math.max(glow, 0.5 * e)
    }
  }
  return { sx, sy, dx, dy, aura, glow }
}

// ------------------------------------------------------------------ backgrounds (before the explorer is drawn)
export function bgCharge(c: Ctx, r: Rec, t: number): void {
  if (r.chg <= t && t < r.fs + 0.3) {
    const q = easeInOut((t - r.chg) / CHARGE) * (1 - smooth(r.fs, r.fs + 0.3, t))
    radialAdd(c, OX, OY + 10, 300, tc(r.ti), 0.45 * q, 2.0)
  }
}
export function bgReveal(c: Ctx, r: Rec, t: number): void {
  const ti = r.ti, tau = t - r.rev
  if (!r.known || r.miss || tau < 0 || t >= r.chg + 0.7 || ti < 2) return
  const tf = fxTau(ti, tau), k = envOf(ti, tau)
  if (k <= 0.01) return
  if (ti === 2) tint(c, [6, 22, 54], 0.22 * k)
  else if (ti === 3) tint(c, [22, 8, 52], 0.40 * k)
  else if (ti === 4) {
    tint(c, [36, 18, 0], 0.50 * k)
    sunburstAdd(c, OX, OY, 14, 0.30 * tf, 0.45, 980, 0.7, [255, 190, 70], 0.50 * k)
  } else {
    tint(c, [58, 8, 40], 0.86 * k)
    const grow = easeOut(tf / 0.7)
    halftoneAdd(c, OX, OY, grow, [255, 100, 180], 0.46 * k)
    sunburstAdd(c, OX, OY, 18, 0.18 * tf + 0.1, 0.5, 1100, 0.55, [255, 95, 176], 0.66 * k)
    sunburstAdd(c, OX, OY, 18, 0.18 * tf + 0.1 + Math.PI / 18, 0.5, 800, 0.9, [150, 40, 170], 0.40 * k)
  }
}

// ------------------------------------------------------------------ additive effects
export function addReveal(a: AddLayer, r: Rec, t: number): void {
  const ti = r.ti, tau = t - r.rev
  if (!r.known || r.miss || tau < 0 || tau > REV_HOLD[ti] + 1.0) return
  const tf = fxTau(ti, tau), i = r.i
  const col = tc(ti), gcy = gemCy(ti)
  if (ti === 0) {
    burst(a, tf, 0, 14, 100 + i, OX, gcy, 90, 210, 0.7, 380, 6, [[205, 214, 238], [154, 166, 191]], { drag: 2.2 })
    const q = tf / 0.45
    if (q < 1) ring(a, OX, OY, 14 + 120 * easeOut(q), 3, [154, 166, 191], 1 - q)
  } else if (ti === 1) {
    const q = tf / 0.55
    if (q < 1) ring(a, OX, OY, 14 + 180 * easeOut(q), 4, col, 1 - q)
    burst(a, tf, 0, 24, 200 + i, OX, gcy, 80, 260, 0.9, 300, 6, [[141, 255, 180], [70, 208, 120], [255, 255, 255]], { a0: -Math.PI * 0.95, a1: -Math.PI * 0.05, drag: 1.6 })
    twinkleStars(a, tf, 0.1, 7, 21, OX, gcy, 50, 100, [[141, 255, 180], [255, 255, 255]], 1.3, 2)
  } else if (ti === 2) {
    for (const dl of [0.0, 0.14]) {
      const q = (tf - dl) / 0.6
      if (q > 0 && q < 1) ring(a, OX, OY, 14 + 280 * easeOut(q), 5 - 2 * q, col, 1 - q)
    }
    burst(a, tf, 0, 34, 300 + i, OX, gcy, 120, 340, 1.0, 320, 6, [[79, 195, 255], [154, 216, 255], [255, 255, 255]], { drag: 1.8 })
    twinkleStars(a, tf, 0.05, 9, 31, OX, gcy, 50, 150, [[154, 216, 255], [255, 255, 255]], 1.6, 2)
  } else if (ti === 3) {
    for (const dl of [0.0, 0.12, 0.24]) {
      const q = (tf - dl) / 0.7
      if (q > 0 && q < 1) ring(a, OX, OY, 14 + 420 * easeOut(q), 6 - 3 * q, col, 1 - q)
    }
    if (tf > 0.04 && tf < 1.35) {
      const fade = 1 - smooth(0.8, 1.35, tf)
      lightning(a, tf, OX, OY - 30, 18, 4, 150, 430, ck([214, 170, 255], fade), 3)
    }
    burst(a, tf, 0, 46, 400 + i, OX, gcy, 140, 420, 1.1, 300, 7, [[181, 131, 255], [216, 188, 255], [255, 255, 255]], { drag: 1.6 })
    twinkleStars(a, tf, 0.05, 12, 41, OX, gcy, 60, 200, [[216, 188, 255], [255, 255, 255]], 1.8, 2)
  } else if (ti === 4) {
    for (const dl of [0.0, 0.1, 0.2, 0.3]) {
      const q = (tf - dl) / 0.8
      if (q > 0 && q < 1) ring(a, OX, OY, 14 + 520 * easeOut(q), 7 - 4 * q, col, 1 - q)
    }
    burst(a, tf, 0, 80, 500 + i, OX, gcy, 150, 470, 1.3, 300, 8, [[255, 178, 63], [255, 224, 140], [255, 255, 255]], { drag: 1.4 })
    confetti(a, tf, 0.1, 44, 51, [[255, 210, 100], [255, 160, 40], [255, 245, 200]], 3.2, 160, 1120, -30, 230)
    twinkleStars(a, tf, 0.05, 14, 61, OX, gcy, 70, 260, [[255, 224, 140], [255, 255, 255]], 2.4, 2)
    for (let k = 0; k < 5; k++) {
      const an = tau * 1.6 + (k * 2 * Math.PI) / 5
      pxstar(a.ctx(), OX + Math.cos(an) * 92, gcy + Math.sin(an) * 40, 3, [255, 236, 170])
    }
  } else {
    ;[0.0, 0.22, 0.44].forEach((dl, k) => {
      const q = (tf - dl) / 0.95
      if (q > 0 && q < 1) ring(a, OX, OY, 14 + 1000 * easeOut(q), 9 - 6 * q, k !== 1 ? [255, 140, 200] : [255, 255, 255], 1 - q)
    })
    burst(a, tf, 0, 130, 600 + i, OX, gcy, 180, 560, 1.5, 320, 8, [[255, 95, 176], [255, 168, 214], [255, 255, 255], [255, 224, 120]], { drag: 1.3, spread: 0.2 })
    confetti(a, tf, 0.15, 90, 71, [[255, 95, 176], [255, 168, 214], [255, 255, 255], [255, 224, 120], [190, 110, 255]], 3.9, 40, 1140, -30, 250)
    twinkleStars(a, tf, 0.0, 40, 81, 640, 340, 40, 560, [[255, 255, 255], [255, 168, 214]], 4.2, 2)
    for (let k = 0; k < 8; k++) {
      const an = tau * 2.0 + (k * 2 * Math.PI) / 8
      pxstar(a.ctx(), OX + Math.cos(an) * 110, gcy + Math.sin(an) * 46, 3, [255, 214, 238])
    }
  }
}

export function addCharge(a: AddLayer, r: Rec, t: number): void {
  if (!(r.chg <= t && t < r.fs + 0.15)) return
  const ti = r.ti
  inward(a, t, r.chg, r.fs, 40 + 14 * ti, 900 + r.i, OX, OY + 10, 80, 420, tc(ti), 7)
  if (t >= r.chg + 0.45 && t < r.chg + 0.45 + 0.35) {
    const al = (t - r.chg - 0.45) / 0.35
    ring(a, OX, OY, 150 * (1 - easeOut(al)) + 20, 4, tc(ti), al)
  }
}

export function addFall(a: AddLayer, tl: Timeline, r: Rec, t: number, c: Cam): void {
  if (!(r.fs <= t && t < r.fe + 0.05)) return
  const ti = r.ti, s = c.s, tau = t - r.fs, col = tc(ti)
  const q = tau / 0.45
  if (q >= 0 && q < 1) ring(a, OX, OY + 40, 30 + 300 * easeOut(q), 6 - 4 * q, col, 1 - q, (30 + 300 * easeOut(q)) * 0.55)
  if (s > 0.1) speedStreaks(a, t, s, col)
  if (s > 0.05) {
    const n = 60, rr = rnd(91, n, 6), life = 0.55, rate = 70.0, cyc = n / rate
    const ctx = a.ctx()
    for (let k = 0; k < n; k++) {
      const off = k / rate
      const age = ((t - off) % cyc + cyc) % cyc
      if (age > life) continue
      const ang = 2 * Math.PI * rr.get((k * 7) % n, 0)
      const v = 160 + 360 * rr.get(k, 1) * (0.5 + s)
      const x = OX + Math.cos(ang) * v * age, y = OY + Math.sin(ang) * v * age * 0.85
      const f = 1 - age / life
      const sz = Math.max(2, Math.round(((3 + 6 * rr.get(k, 3)) * (0.4 + 0.6 * f)) / 2) * 2)
      const cc = ck(lerpc(col, [255, 255, 255], 0.4 * rr.get(k, 4)), Math.min(1, f * 1.5) * Math.min(1, s * 2))
      ctx.fillStyle = `rgb(${cc[0]},${cc[1]},${cc[2]})`
      ctx.fillRect(Math.trunc(x - sz / 2), Math.trunc(y - sz / 2), sz, sz)
    }
  }
  for (const [tcx] of tl.crossTimes(r)) {
    const qq = (t - tcx) / 0.55
    if (qq >= 0 && qq < 1) {
      const R = 40 + 900 * easeOut(qq)
      ring(a, OX, OY, R, 8 - 6 * qq, lerpc([255, 255, 255], col, 0.4), 1 - qq)
      ring(a, OX, OY, R * 0.7, 4, col, (1 - qq) * 0.7)
    }
  }
}
/** speed streaks near the edge of the screen (the worlds stay visible in the middle) */
export function speedStreaks(a: AddLayer, t: number, s: number, col: RGB): void {
  const n = 46, rr = rnd(77, n, 4)
  const light = lerpc(col, [255, 255, 255], 0.5)
  const c = a.ctx()
  for (let k = 0; k < n; k++) {
    const ph = (((rr.get(k, 1) + t * (0.9 + 1.5 * s) * (0.7 + 0.6 * rr.get(k, 2))) % 1) + 1) % 1
    const rad = 250 + 700 * ph ** 1.8
    const ln = (8 + 120 * s) * (0.4 + rad / 600)
    const ang = 2 * Math.PI * rr.get(k, 0)
    const x0 = FOC[0] + Math.cos(ang) * rad, y0 = FOC[1] - 90 + Math.sin(ang) * rad * 0.78
    const x1 = FOC[0] + Math.cos(ang) * (rad + ln), y1 = FOC[1] - 90 + Math.sin(ang) * (rad + ln) * 0.78
    const al = Math.min(1, (rad - 240) / 160) * (0.35 + 0.5 * s) * (1 - ph ** 6)
    if (al <= 0.01) continue
    c.strokeStyle = `rgb(${ck(light, al).join(',')})`
    c.lineWidth = rr.get(k, 3) < 0.7 ? 2 : 3
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke()
  }
}

export function addLand(a: AddLayer, r: Rec, t: number): void {
  const tau = t - r.fe
  if (!(tau >= 0 && tau < 1.2)) return
  const ti = r.ti
  const q = tau / 0.6
  if (q < 1) {
    const R = 20 + 420 * easeOut(q)
    ring(a, FEET[0], FEET[1] - 2, R, 6 - 4 * q, [255, 255, 255], (1 - q) * 0.9, R * 0.16)
    ring(a, FEET[0], FEET[1] - 2, R * 0.6, 3, tc(ti), (1 - q) * 0.8, R * 0.10)
  }
  const rr = rnd(123, 28, 6)
  const c = a.ctx()
  for (let k = 0; k < 28; k++) {
    const ang = Math.PI * (0.04 + 0.92 * rr.get(k, 0)) + (k % 2 ? Math.PI : 0)
    const v = 90 + 280 * rr.get(k, 1)
    const age = tau - 0.03 * rr.get(k, 5)
    if (age <= 0 || age > 0.7) continue
    const dd = (v * (1 - Math.exp(-3.5 * age))) / 3.5
    const x = FEET[0] + Math.cos(ang) * dd * (k % 2 === 0 ? 1 : -1) * Math.abs(Math.cos(ang)) ** 0.3
    const y = FEET[1] - 6 - 60 * rr.get(k, 2) * easeOut(age / 0.5) + 70 * age * age
    const f = 1 - age / 0.7
    const sz = Math.max(2, Math.round(((8 + 10 * rr.get(k, 3)) * (0.4 + 0.6 * f)) / 2) * 2)
    const cc = ck([210, 200, 180], f * 0.55)
    c.fillStyle = `rgb(${cc[0]},${cc[1]},${cc[2]})`
    c.fillRect(Math.trunc(x - sz / 2), Math.trunc(y - sz / 2), sz, sz)
  }
  if (r.dz > 0 && tau < 0.9) burst(a, tau, 0, 26, 140 + r.i, FEET[0], FEET[1] - 40, 80, 300, 0.8, 360, 6, [tc(ti), [255, 255, 255]], { a0: -Math.PI * 0.95, a1: -Math.PI * 0.05, drag: 1.8 })
}

// ------------------------------------------------------------------ opaque front elements
export interface Gems { canvas(ti: number, size: number): HTMLCanvasElement }
export function makeGems(images: HTMLImageElement[]): Gems {
  const cache = new Map<string, HTMLCanvasElement>()
  return {
    canvas(ti, size) {
      const k = ti + ':' + size
      let cv = cache.get(k)
      if (!cv) {
        cv = document.createElement('canvas')
        cv.width = cv.height = size
        const c = ctxOf(cv)
        c.imageSmoothingEnabled = false
        c.drawImage(images[ti], 0, 0, size, size)
        if (cache.size > 300) cache.clear()
        cache.set(k, cv)
      }
      return cv
    },
  }
}

export function frontReveal(c: Ctx, gems: Gems, r: Rec, t: number): void {
  if (!r.known || r.miss) return
  const ti = r.ti, tau = t - r.rev
  if (tau < 0 || t >= r.chg + 0.5) return
  const ed = TIERS[ti].edge
  const gs = GEM[ti] * backOut(tau / 0.34)
  let gcy = gemCy(ti) - 4 * Math.sin(2 * Math.PI * 0.8 * Math.max(0, tau - 0.3))
  const gcx = OX
  let sizeK = 1
  if (t >= r.chg) {
    const q = easeInOut((t - r.chg) / 0.45)
    gcy = gcy + (OY - 30 - gcy) * q
    sizeK = 1 - 0.85 * q
  }
  const glowK = (0.5 + 0.15 * ti) * Math.min(1, tau / 0.2) * sizeK
  radialAdd(c, gcx, gcy, GEM[ti] * 1.5, ed, glowK, 2.0)
  const sz = Math.max(4, Math.trunc(gs * sizeK))
  if (sz >= 6) c.drawImage(gems.canvas(ti, sz), Math.trunc(gcx - sz / 2), Math.trunc(gcy - sz / 2))
  const ta = 1 - smooth(r.chg, r.chg + 0.25, t)
  const top = gemCy(ti) - GEM[ti] / 2
  if (ti in TITLES) {
    const [s, size] = TITLES[ti]
    const [ctop, cbot, cout, cglow] = TITLE_COL[ti]
    const q = tau / 0.30
    const scale = q < 1 ? 1 + 1.4 * (1 - backOut(q, 1.4)) : 1 + 0.025 * Math.sin(2 * Math.PI * 1.2 * tau)
    const base = top - 14
    let shine: number | null = null
    if (ti >= 4) { const ss = (tau - 0.55) / 0.9; shine = ss >= 0 && ss <= 1 ? ss : null }
    let split = 0
    if (ti === 3) split = Math.trunc(6 * Math.max(0, 1 - tau / 0.3))
    if (ti === 5) split = Math.trunc(10 * Math.max(0, 1 - tau / 0.55)) * (Math.trunc(tau * 24) % 3 ? 1 : -1)
    let jit = 0
    if (ti === 5 && tau < 0.5) jit = Math.trunc(Math.sin(tau * 130) * 6 * (1 - tau / 0.5))
    bigTitle(c, s, size, OX + jit, base, scale, ctop, cbot, cout, cglow, { glow: ti < 4 ? 0.55 : 0.8, shine, split, ls: 3, alpha: ta * smooth(0, 0.06, tau) })
  }
}

export function frontStamp(c: Ctx, r: Rec, t: number): void {
  if (!r.known || r.miss || !r.stamp) return
  if (!(r.chg + 0.05 <= t && t < r.fs + 0.45)) return
  const ti = r.ti
  const lab = r.stamp.replace(/ /g, '')
  const tau = t - (r.chg + 0.05), q = tau / 0.2
  let sc = q < 1 ? 1 + 1.6 * (1 - backOut(q, 1.6)) : 1
  let a = smooth(0, 0.05, tau)
  const out = smooth(r.fs, r.fs + 0.4, t)
  sc *= 1 + 0.9 * out
  a *= 1 - out
  const col = tc(ti)
  const top = lerpc([255, 255, 255], col, 0.15), outl = ck(col, 0.18)
  let size = STAMP[ti]
  const wd = textWidth(PXF(size, 700), lab) + 2 * lab.length
  if (wd > 540) size = Math.trunc((size * 540) / wd)
  bigTitle(c, lab, size, 480, 372, sc, top, col, outl, col, { glow: 0.7, ls: 2, alpha: a, w: 700 })
}

// ------------------------------------------------------------------ world title cards
export const accentOf = (accents: Record<string, RGB>, k: number): RGB => {
  if (isVoidSlot(k)) return [160, 172, 255]
  if (k === 35) return [255, 200, 87]
  return accents[String(k)] ?? [200, 200, 255]
}
export const KIND_COL: Record<string, RGB> = { SEEN: [238, 242, 255], MEASURED: [141, 255, 180], LIMIT: [91, 224, 255], THEORY: [255, 200, 87], NONE: [163, 176, 214] }

export function addCard(a: AddLayer, accents: Record<string, RGB>, r: Rec, t: number): void {
  if (!r.cardOn) return
  const tau = t - r.card
  if (!(tau >= 0 && tau < r.clen)) return
  const acc = accentOf(accents, r.z1)
  const cy = 178
  const cl = 1 - smooth(r.clen - 0.6, r.clen, tau)
  const q = tau / 0.55
  const c = a.ctx()
  if (q < 1) {
    const ln = 700 * easeOut(q)
    c.fillStyle = `rgb(${ck(lerpc(acc, [255, 255, 255], 0.6), 1 - q).join(',')})`
    c.fillRect(640 - ln, cy - 2, ln * 2, 4)
  }
  const rr = rnd(333, 34, 5)
  for (let n = 0; n < 34; n++) {
    const life = 2.0 + 1.2 * rr.get(n, 2)
    const age = (((tau * 0.9 + rr.get(n, 3) * life) % life) + life) % life
    const x = 120 + 1040 * rr.get(n, 0) + 18 * Math.sin(age * 2 + n)
    const y = cy + 90 - (age / life) * 190
    const f = Math.sin((Math.PI * age) / life) ** 1.5
    const s = rr.get(n, 4) < 0.7 ? 2 : 4
    const cc = ck(lerpc(acc, [255, 255, 255], 0.4), f * 0.9 * cl * smooth(0.2, 0.6, tau))
    c.fillStyle = `rgb(${cc[0]},${cc[1]},${cc[2]})`
    c.fillRect(Math.trunc(x), Math.trunc(y), s, s)
  }
}

export function titleCard(c: Ctx, accents: Record<string, RGB>, r: Rec, t: number): void {
  if (!r.cardOn || r.fin) return
  const tau = t - r.card
  const n = r.clen
  if (!(tau >= 0 && tau < n)) return
  const k = r.z1
  const wd = worldOfSlot(k)
  const acc = accentOf(accents, k)
  const cl = smooth(n - 0.6, n, tau)
  const vis = easeOut(tau / 0.35) * (1 - cl)
  const y0 = 66, y1 = 336
  // a dark band that is thickest in the middle
  const g = c.createLinearGradient(0, y0, 0, y1)
  const N = 16
  for (let i = 0; i <= N; i++) {
    const s = Math.min(1, Math.sin((Math.PI * i) / N) * 1.7)
    g.addColorStop(i / N, `rgba(4,7,18,${s * 0.66 * vis})`)
  }
  c.fillStyle = g
  c.fillRect(0, y0, W, y1 - y0)
  const la = smooth(0.05, 0.3, tau) * (1 - cl)
  const head = wd.n ? `WORLD ${wd.n} / 21` : 'BETWEEN WORLD 20 AND WORLD 21'
  putText(c, head, 640, 146, 'sil', 18, acc, la, { ls: 7, anchor: 'c' })
  const top = lerpc([255, 255, 255], acc, 0.22)
  const ls = 7 + 4 * smooth(0, n, tau)
  letters(c, wd.name, 84, 500, ls, 640, 232, tau, 0.12, 0.05, top, acc, ck(acc, 0.16), acc, {
    pop: 1.1, glow: 0.35 * (1 - cl), shineAt: tau < 3.0 ? (tau - 0.95) / 0.9 : (tau - 3.9) / 0.9, alpha: 1 - cl,
  })
  const sa = smooth(0.8, 1.2, tau) * (1 - cl)
  putText(c, wd.desc, 640, 282, 'px', 22, [226, 233, 252], sa, { w: 400, anchor: 'c' })
  const kc = KIND_COL[wd.kind]
  const lab = wd.kind === 'NONE' ? wd.label : `${wd.kind} · ${wd.label}`
  putText(c, lab, 640, 316, 'sil', 12, kc, smooth(1.1, 1.6, tau) * (1 - cl), { ls: 3, anchor: 'c' })
  putText(c, 'TAP TO SKIP', 640, 690, 'sil', 11, SOFT, smooth(1.4, 1.9, tau) * (1 - cl) * 0.7, { ls: 3, anchor: 'c' })
}

/** a world passed during a dive: its number and name for about a second, text only */
export function gates(c: Ctx, accents: Record<string, RGB>, tl: Timeline, r: Rec, t: number): void {
  if (r.fin || !r.known || r.miss) return
  const ct = tl.crossTimes(r)
  ct.forEach(([tcx, wk], n) => {
    if (isVoidSlot(wk)) return
    if (n === ct.length - 1 && r.cardOn) return
    const tau = t - tcx
    if (tau >= 0 && tau < 1.15) {
      const a = smooth(0, 0.10, tau) * (1 - smooth(0.7, 1.15, tau))
      const wd = worldOfSlot(wk)
      const y = 150 - 18 * easeOut(tau / 1.0)
      const col = accentOf(accents, wk)
      putText(c, `WORLD ${wd.n}`, 640, y - 40, 'sil', 13, lerpc(col, [255, 255, 255], 0.3), a * 0.9, { ls: 6, anchor: 'c' })
      putText(c, wd.name, 640, y, 'px', 42, OFF, a, { w: 600, ls: 3, anchor: 'c' })
    }
  })
}

// ------------------------------------------------------------------ the title screen
export function frontIntro(c: Ctx, t: number, exitT: number, label = 'SOLO RUN'): void {
  const out = smooth(INTRO_EXIT, INTRO_EXIT + 0.6, exitT)
  if (t < 0.4) return
  const top: RGB = [255, 241, 196], bot: RGB = [255, 200, 87]
  letters(c, 'MINITUDE', 120, 700, 8, 640, 222, t - 0.4, 0.0, 0.07, top, bot, [74, 40, 0], [255, 200, 87], { pop: 1.4, glow: 0.4 * (1 - out), depth: 6, depthCol: [138, 90, 0], alpha: 1 - out })
  putText(c, 'Answer rare. Shrink far.', 640, 282, 'px', 34, OFF, smooth(1.5, 2.1, t) * (1 - out), { w: 400, anchor: 'c' })
  putText(c, label, 640, 316, 'sil', 13, SOFT, smooth(1.8, 2.4, t) * (1 - out), { ls: 5, anchor: 'c' })
}

export { SCRIM, SHAKE_K, H, vignette, rect, shade, addMask, displaySlot }

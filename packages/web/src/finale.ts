/**
 * The World 21 finale: quiet build, then burst. Everything is a function of time.
 * Timeline of the dive (tau = seconds after the dive starts, D = FIN_DUR):
 *   0-1.4     launch, as in every other dive
 *   1.4-4     the camera still speeds through the dark worlds; the interface dims, colour and sound drain away
 *   3-12.4    one point of light appears at the horizon and grows; heartbeats; particles fall into it; thin rings close on it
 *   12-12.45  a held breath: the light shrinks a little
 *   12.4-13.4 the window of Planck Foam opens: bloom, rays, zoom blur
 *   landing   white flash, bloom, rings, bursts, confetti, stars; the title card follows 1.3 s later
 */
import { CORE, FEET, FIN_BEATS, FIN_DUR, FOC, FX, FY, OX, OY, SOFT, W, H } from './config'
import { ck, easeOut, lerpc, smooth, type RGB } from './util'
import { putText, bigTitle, letters, radialAdd, type Ctx } from './draw'
import { AddLayer, burst, confetti, pxstar, ring, twinkleStars, inward, sunburstAdd as sunburstAddCompat } from './fx'
import { finHush, type Cam, type Rec, type Timeline } from './timeline'
import { speedStreaks, tc } from './celebrate'
import { worldOfSlot } from '@minitude/core'

const LILAC: RGB = [190, 176, 255], WHT: RGB = [255, 255, 255], GOLD: RGB = [255, 200, 87], CYN: RGB = [91, 224, 255], PNK: RGB = [255, 95, 176], VIO: RGB = [181, 131, 255]
const FOAM_COLS: RGB[] = [WHT, CYN, PNK, GOLD, VIO, [255, 168, 214], [154, 216, 255]]

/** the finale record while it is on screen: from the charge-up of the last dive to the end of its card */
export function finRec(tl: Timeline, t: number): Rec | null {
  for (const r of tl.recs) if (r.fin && r.known && r.fs - 0.2 <= t && t < r.card + r.clen + 0.5) return r
  return null
}
export function lightPos(z: number): [number, number, number] {
  const e = 10 ** (z - 35)
  return [FX + (CORE[0] - FX) * e, FY + (CORE[1] - FY) * e, e]
}
export function beat(tau: number): number {
  let k = 0
  for (const b of FIN_BEATS) for (const [off, amp] of [[0, 1], [0.17, 0.6]]) {
    const x = tau - b - off
    if (x > 0) k += amp * Math.exp(-x / 0.2) * smooth(0, 0.03, x)
  }
  return Math.min(1.4, k)
}
export const intensity = (tau: number): number => smooth(3.0, 5.6, tau)

/** multiplier for the interface (top bar, rail, scale bar): it fades back while the world goes quiet */
export function uiDim(tl: Timeline, t: number): number {
  const r = finRec(tl, t)
  if (!r) return 1
  return 1 - 0.72 * finHush(t - r.fs)
}
/** extra darkening of the picture while the world holds its breath (0..1) */
export function darkK(tl: Timeline, t: number): number {
  const r = finRec(tl, t)
  if (!r) return 0
  const tau = t - r.fs
  return finHush(tau) * (1 - 0.8 * smooth(11.0, 13.0, tau))
}
export function dimPre(c: Ctx, tl: Timeline, t: number): void {
  const k = darkK(tl, t)
  if (k <= 0.01) return
  c.fillStyle = `rgba(0,0,0,${0.45 * k})`
  c.fillRect(0, 0, W, H)
}

/** light in picture space (before the explorer is drawn) */
export function bloomPre(c: Ctx, r: Rec, t: number, cam: Cam): void {
  const tau = t - r.fs, a = t - r.fe
  if (tau < 3.0) return
  if (a < 0) {
    const [px, py, e] = lightPos(cam.z)
    const I = intensity(tau), bt = beat(tau)
    const inhale = 1 - 0.18 * smooth(12.0, 12.4, tau) * (1 - smooth(12.4, 12.55, tau))
    const R = (24 + 520 * e ** 0.8) * inhale
    const u = smooth(12.4, FIN_DUR, tau) ** 1.5
    const k = (0.20 * I + 0.12 * bt * I) * (1 - u) + 0.62 * u
    radialAdd(c, px, py, R * (1 + 2.0 * u), lerpc(LILAC, WHT, 0.5 * u), k, 2.0)
    if (u > 0.02) sunburstAddCompat(c, px, py, 16, 0.25 * tau, 0.45, 1200, 0.7, lerpc(LILAC, WHT, 0.4), 0.38 * u)
  } else {
    if (a > 5.0) return
    radialAdd(c, CORE[0], CORE[1], 480 + 620 * easeOut(a / 0.6), lerpc(LILAC, WHT, 0.6), 0.62 * Math.exp(-a / 0.7), 1.8)
    sunburstAddCompat(c, CORE[0], CORE[1], 22, 0.1 + 0.12 * a, 0.42, 1300, 0.6, lerpc(VIO, WHT, 0.4), 0.34 * Math.exp(-a / 1.1) * smooth(0, 0.08, a))
  }
}

export function addFinale(add: AddLayer, tl: Timeline, r: Rec, t: number, cam: Cam): void {
  const tau = t - r.fs, a = t - r.fe
  const col = tc(r.ti)
  if (tau >= 0 && tau < FIN_DUR && a < 0) {
    const q = tau / 0.45
    if (q < 1) ring(add, OX, OY + 40, 30 + 300 * easeOut(q), 6 - 4 * q, col, 1 - q, (30 + 300 * easeOut(q)) * 0.55)
    if (cam.s > 0.1) speedStreaks(add, t, cam.s, col)
    // slow soft ripples as each dark world is passed
    for (const [tcx, wk] of tl.crossTimes(r)) {
      const qq = (t - tcx) / 1.5
      if (qq >= 0 && qq < 1 && wk < 20) {
        const R = 60 + 520 * easeOut(qq)
        ring(add, OX, OY + 20, R, 3, lerpc(LILAC, col, 0.3), (1 - qq) * 0.30 * (1 - smooth(2.6, 4.2, tau) * 0.4))
      }
    }
    // the point of light
    if (tau >= 3.0) {
      const [px, py, e] = lightPos(cam.z)
      const I = intensity(tau), bt = beat(tau)
      const inhale = 1 - 0.55 * smooth(12.0, 12.4, tau) * (1 - smooth(12.4, 12.6, tau))
      const sz = (1 + 6.0 * easeOut((tau - 3.0) / 9.5) + 2.5 * bt) * inhale
      const cc = lerpc(LILAC, WHT, 0.75)
      const c = add.ctx()
      pxstar(c, px, py, Math.max(1, Math.round(sz)), ck(cc, I))
      if (I > 0.3) {
        const L = (30 + 150 * easeOut((tau - 3.0) / 9.0) + 80 * bt) * I * inhale
        const ang = 0.35 * tau
        c.lineWidth = 1
        for (let kk = 0; kk < 4; kk++) {
          const an = ang + (kk * Math.PI) / 2
          c.strokeStyle = `rgb(${ck(LILAC, 0.55 * I).join(',')})`
          c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(an) * L, py + Math.sin(an) * L * 0.9); c.stroke()
          c.strokeStyle = `rgb(${ck(LILAC, 0.35 * I).join(',')})`
          c.beginPath(); c.moveTo(px, py); c.lineTo(px - Math.cos(an) * L * 0.5, py - Math.sin(an) * L * 0.45); c.stroke()
        }
      }
      // particles falling into the light, and thin rings closing on it
      if (tau >= 5.0 && tau < 12.45) {
        inward(add, tau, 5.0, 12.45, 36, 1200, px, py, 40, 190 + 120 * e ** 0.5, LILAC, 5)
        const cyc = 1.7
        for (let kk = 0; kk < 3; kk++) {
          const q2 = ((((tau - 5.0) / cyc + kk / 3) % 1) + 1) % 1
          ring(add, px, py, (40 + 300 * (1 - q2) ** 1.4) * (0.4 + e ** 0.5), 2, LILAC, 0.55 * q2 * I * smooth(5.0, 6.5, tau))
        }
      }
      if (tau >= 12.4) {
        ;[0.0, 0.16, 0.32].forEach((dl, kk) => {
          const q3 = (tau - 12.4 - dl) / 1.0
          if (q3 > 0 && q3 < 1) ring(add, px, py, 30 + 600 * easeOut(q3), 5 - 3 * q3, lerpc(WHT, LILAC, 0.3 * kk), (1 - q3) * 0.8)
        })
      }
    }
  }
  // landing
  if (a >= 0 && a < 6.5) {
    const [cx, cy] = CORE
    ;([[0.0, WHT], [0.10, CYN], [0.22, PNK], [0.36, GOLD], [0.52, VIO], [0.70, WHT]] as [number, RGB][]).forEach(([dl, colr]) => {
      const q = (a - dl) / 1.5
      if (q > 0 && q < 1) ring(add, cx, cy, 20 + 1350 * easeOut(q), 11 - 8 * q, colr, (1 - q) * 0.95)
    })
    ;([[0.05, WHT], [0.3, GOLD]] as [number, RGB][]).forEach(([dl, colr]) => {
      const q = (a - dl) / 1.1
      if (q > 0 && q < 1) ring(add, FEET[0], FEET[1] - 2, 20 + 900 * easeOut(q), 6 - 4 * q, colr, (1 - q) * 0.8, (20 + 900 * easeOut(q)) * 0.16)
    })
    burst(add, a, 0, 190, 1300, cx, cy, 180, 780, 2.4, 140, 8, FOAM_COLS, { drag: 1.1, spread: 0.25 })
    burst(add, a, 0.18, 90, 1301, OX, OY, 120, 520, 1.8, 220, 8, [[255, 224, 140], WHT, GOLD], { drag: 1.3, spread: 0.2 })
    confetti(add, a, 0.35, 150, 1302, [GOLD, WHT, PNK, CYN, VIO, [255, 168, 214], [255, 224, 140]], 5.2, 20, 1260, -40, 210, 44, 11)
    twinkleStars(add, a, 0, 70, 1303, 640, 330, 40, 640, [WHT, [255, 214, 238], [154, 216, 255]], 6.0, 2)
    const c = add.ctx()
    for (let k = 0; k < 10; k++) {
      const an = a * 1.7 + (k * 2 * Math.PI) / 10
      pxstar(c, OX + Math.cos(an) * 120, OY + Math.sin(an) * 52, 3, ck([255, 236, 170], smooth(0.2, 0.6, a) * (1 - smooth(4.5, 6.2, a))))
    }
  }
}

export function poseExtra(p: { sx: number; sy: number; dx: number; dy: number; aura: number; glow: number }, r: Rec, t: number) {
  const tau = t - r.fs, a = t - r.fe
  const out = { ...p }
  if (tau >= 0 && tau < FIN_DUR) {
    const h = finHush(tau)
    if (h > 0.05) {
      const br = Math.sin(tau * 1.9)
      Object.assign(out, { sx: 1 - 0.012 * br * h, sy: 1 + 0.016 * br * h, dx: 0, dy: -3 * Math.sin(tau * 1.1) * h, aura: 1, glow: 0.35 * h })
    }
  }
  if (a >= 0.12 && a < 0.95) {
    const q = (a - 0.12) / 0.83
    out.dy = (out.dy || 0) - 30 * 4 * q * (1 - q)
    out.aura = 2
    out.glow = Math.max(out.glow || 0, 0.9)
    out.sy = out.sy * (1 + 0.07 * Math.sin(Math.PI * q))
    out.sx = out.sx * (1 - 0.04 * Math.sin(Math.PI * q))
  }
  return out
}

/** the card for world 21 */
export function finaleCard(c: Ctx, r: Rec, t: number): void {
  const tau = t - r.card
  if (!(tau >= 0 && tau < r.clen)) return
  const n = r.clen
  const op = easeOut(tau / 0.4), cl = smooth(n - 0.7, n, tau)
  const y0 = 60, y1 = 346
  const g = c.createLinearGradient(0, y0, 0, y1)
  for (let i = 0; i <= 16; i++) {
    const s = Math.min(1, Math.sin((Math.PI * i) / 16) * 1.6)
    g.addColorStop(i / 16, `rgba(6,5,20,${s * 0.76 * op * (1 - cl)})`)
  }
  c.fillStyle = g
  c.fillRect(0, y0, W, y1 - y0)
  const pa = smooth(0.4, 0.8, tau) * (1 - cl)
  const w = worldOfSlot(35)
  putText(c, `${r.c1} POINTS · ANSWER ${r.i + 1} OF 7`, 640, 120, 'sil', 14, [255, 214, 238], pa, { ls: 5, anchor: 'c' })
  const la = smooth(0.05, 0.35, tau) * (1 - cl)
  putText(c, 'WORLD 21 / 21', 640, 160, 'sil', 18, GOLD, la, { ls: 7, anchor: 'c' })
  letters(c, 'PLANCK FOAM', 100, 600, 8 + 5 * smooth(0, n, tau), 640, 256, tau, 0.15, 0.06, [255, 247, 220], GOLD, [74, 40, 0], GOLD, {
    pop: 1.2, glow: 0.55 * (1 - cl), shineAt: tau < 3.4 ? (tau - 1.1) / 1.0 : (tau - 4.6) / 1.0, alpha: 1 - cl,
  })
  const sa = smooth(1.0, 1.5, tau) * (1 - cl)
  putText(c, w.desc, 640, 298, 'px', 22, [226, 233, 252], sa, { w: 400, anchor: 'c' })
  putText(c, 'THEORY · PLANCK LENGTH', 640, 328, 'sil', 12, GOLD, smooth(1.3, 1.8, tau) * (1 - cl), { ls: 3, anchor: 'c' })
  putText(c, 'TAP TO SKIP', 640, 690, 'sil', 11, SOFT, smooth(2.6, 3.2, tau) * (1 - cl) * 0.7, { ls: 3, anchor: 'c' })
}

void FOC; void bigTitle

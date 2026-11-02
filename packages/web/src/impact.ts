/** Whole-frame effects driven by the records: screen shake, colour flash, vignette (port of shake_amp / flash_at / vignette_at). */
import { INK, REV_HOLD, SHAKE_K, STOP, VIG_K, CHARGE, FIN_DUR } from './config'
import { ck, easeInOut, lerpc, smooth, type RGB } from './util'
import { finHush, type Cam, type Timeline } from './timeline'
import { envOf, tc } from './celebrate'
import { TIERS } from '@minitude/core'

export function shakeAmp(tl: Timeline, t: number, c: Cam): number {
  let a = 0
  for (const r of tl.recs) {
    if (!r.known) continue
    const ti = r.ti
    let tau = t - r.rev - STOP[ti]
    if (!r.miss && tau > 0 && SHAKE_K[ti] > 0 && tau < 2.0) a += SHAKE_K[ti] * Math.exp(-tau / (ti < 5 ? 0.18 : 0.34))
    if (r.miss) continue
    tau = t - r.fs
    if (tau > 0 && tau < 1.0) a += 3.0 * Math.exp(-tau / 0.12)
    if (!r.fin) {
      for (const [tcx] of tl.crossTimes(r)) {
        tau = t - tcx
        if (tau > 0 && tau < 0.6) a += 2.6 * Math.exp(-tau / 0.10)
      }
    }
    tau = t - r.fe
    if (r.fin) {
      if (tau > 0 && tau < 2.2) a += 15.0 * Math.exp(-tau / 0.38)
    } else if (tau > 0 && tau < 1.0) a += (r.dz > 0 ? 6.5 : 2.5) * Math.exp(-tau / 0.15)
  }
  if (c.fall !== null) a += 2.4 * c.s
  return a
}

const FLASH_A0 = [0.0, 0.10, 0.17, 0.30, 0.50, 0.95]
const FLASH_DUR = [0.1, 0.12, 0.14, 0.18, 0.22, 0.30]
const FLASH_MIX = [0, 0.5, 0.3, 0.4, 0.45, 0.0]

export function flashAt(tl: Timeline, t: number): [RGB, number] | null {
  const items: [RGB, number][] = []
  for (const r of tl.recs) {
    if (!r.known || r.miss) continue
    const ti = r.ti
    let tau = t - r.rev
    if (tau >= 0 && tau < 1.2) {
      items.push([lerpc([255, 255, 255], tc(ti), FLASH_MIX[ti]), FLASH_A0[ti] * Math.exp(-Math.max(0, tau - STOP[ti]) / FLASH_DUR[ti]) * smooth(0, 0.01, tau)])
      if (ti === 5) {
        const tau2 = tau - 0.45
        if (tau2 > 0 && tau2 < 1) items.push([[255, 120, 190], 0.42 * Math.exp(-tau2 / 0.2)])
      }
    }
    tau = t - r.fs
    if (tau >= 0 && tau < 0.4) items.push([lerpc([255, 255, 255], tc(ti), 0.4), 0.22 * Math.exp(-tau / 0.10)])
    if (!r.fin) {
      for (const [tcx] of tl.crossTimes(r)) {
        tau = t - tcx
        if (tau >= 0 && tau < 0.4) items.push([lerpc([255, 255, 255], tc(ti), 0.25), 0.16 * Math.exp(-tau / 0.09)])
      }
    }
    tau = t - r.fe
    if (r.fin) {
      const ts = t - r.fs
      if (ts > FIN_DUR - 0.4 && tau < 0) items.push([[240, 232, 255], 0.38 * smooth(FIN_DUR - 0.4, FIN_DUR, ts)])
      if (tau >= 0 && tau < 1.8) items.push([[250, 246, 255], 0.78 * Math.exp(-Math.max(0, tau - 0.06) / 0.17)])
    } else if (tau >= 0 && tau < 0.5) items.push([[255, 255, 255], (r.dz > 0 ? 0.20 : 0.08) * Math.exp(-tau / 0.09)])
  }
  if (!items.length) return null
  const tot = Math.min(0.95, items.reduce((s, it) => s + it[1], 0))
  if (tot < 0.01) return null
  let best = items[0]
  for (const it of items) if (it[1] > best[1]) best = it
  return [best[0], tot]
}

export function vignetteAt(tl: Timeline, t: number, c: Cam): [RGB, number] | null {
  const items: [RGB, number][] = []
  for (const r of tl.recs) {
    if (!r.known || r.miss) continue
    const ti = r.ti
    const tau = t - r.rev
    if (tau >= 0 && tau < REV_HOLD[ti] + 0.8 && VIG_K[ti] > 0) items.push([ck(TIERS[ti].bg, 0.5), VIG_K[ti] * envOf(ti, tau)])
    if (r.chg <= t && t < r.fs) items.push([INK, 0.35 * easeInOut((t - r.chg) / CHARGE)])
  }
  if (c.fall !== null) items.push([INK, 0.55 * c.s])
  const rf = tl.recs.find((r) => r.fin && r.known)
  if (rf && rf.fs <= t && t < rf.fe) items.push([[8, 4, 26], 0.66 * finHush(t - rf.fs)])
  if (!items.length) return null
  const tot = Math.min(0.85, items.reduce((s, it) => s + it[1], 0))
  let best = items[0]
  for (const it of items) if (it[1] > best[1]) best = it
  return [best[0], tot]
}

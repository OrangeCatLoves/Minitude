/** The interface: top bar, depth rail, scale bar, the question / roll / result block, landing lines, title screen and report. */
import { CYAN, FAINT, H, LINE, OFF, OKG, SOFT, W, AMBER } from './config'
import { backOut, clamp01, easeInOut, easeOut, lerp, lerpc, rgb, smooth, ck, type RGB } from './util'
import { ctxOf, drawText, mkCanvas, PXF, radialAdd, rect, SILF, stext, textWidth, type Ctx } from './draw'
import type { Rec, Timeline, Cam } from './timeline'
import { N_WORLDS, TIERS, MAX_POINTS_DISPLAY, stageOfPoints, worldOfSlot, worldNoOfSlot, type ReportData, type RunRecord } from '@minitude/core'
import type { Gems } from './celebrate'

export const WARN: RGB = [255, 130, 100]

/** draw a group of elements and fade the whole group in by alpha (no boxes means no cut-outs, so this is enough) */
export class Groups {
  private cv = mkCanvas(W, H)
  private c = ctxOf(this.cv)
  draw(main: Ctx, alpha: number, fn: (c: Ctx) => void): void {
    if (alpha <= 0.004) return
    if (alpha >= 0.999) { fn(main); return }
    this.c.clearRect(0, 0, W, H)
    fn(this.c)
    main.save()
    main.globalAlpha = alpha
    main.drawImage(this.cv, 0, 0)
    main.restore()
  }
}

// ------------------------------------------------------------------ top: round dots, size, world, depth rail
export const RY0 = 118, RY1 = 592, RX = 1254
const ry = (u: number) => RY0 + ((RY1 - RY0) * Math.max(0, Math.min(35, u))) / 35

export interface HudState { nsq: number; curOpen: number; sizeTxt: string; dots: (RGB | null)[] }

export function hud(c: Ctx, S: HudState, cam: Cam, dy = 0): void {
  const x0 = 640 - Math.trunc((7 * 14 + 6 * 10) / 2), y = 19 + dy
  for (let k = 0; k < 7; k++) {
    const xx = x0 + k * 24
    if (k < S.nsq) rect(c, xx, y, 14, 14, S.dots[k] ?? FAINT)
    else if (k === S.curOpen) { rect(c, xx, y, 14, 14, OFF); rect(c, xx + 3, y + 3, 8, 8, [7, 11, 23]) }
    else rect(c, xx, y, 14, 14, [52, 66, 112])
  }
  let fs = 34
  while (fs > 18 && textWidth(PXF(fs, 600), S.sizeTxt) > 230) fs--
  stext(c, S.sizeTxt, 1232, 52 + dy, PXF(fs, 600), OFF, 0, 'r')
  const j = Math.max(0, Math.min(35, Math.floor(cam.z + 1e-6)))
  const n = worldNoOfSlot(j)
  const name = worldOfSlot(j).name
  stext(c, n ? `${n}  ${name}` : name, 1232, 78 + dy, SILF(12), SOFT, 2, 'r')
}
export function hudDotsOnly(c: Ctx, dots: (RGB | null)[]): void {
  const x0 = 640 - Math.trunc((7 * 14 + 6 * 10) / 2)
  for (let k = 0; k < 7; k++) rect(c, x0 + k * 24, 19, 14, 14, dots[k] ?? FAINT)
}

export function rail(c: Ctx, tl: Timeline, t: number, cam: Cam, cur: Rec, final = false, dy = 0): void {
  const u = cam.u
  rect(c, RX - 1, RY0 + dy, 2, RY1 - RY0, [84, 98, 148])
  const ya_ = ry(20), yb_ = ry(35)
  for (let yy = Math.trunc(ya_); yy < Math.trunc(yb_); yy += 6) rect(c, RX - 1, yy + dy, 2, 3, [14, 20, 44])
  for (const rr of tl.recs) {
    if (!rr.known || rr.miss) continue
    if (t < rr.rev && !final) continue
    const col = TIERS[rr.ti].edge
    const ya = ry(rr.u0), yb = ry(rr.u1)
    const yf = final || !(rr.i === cur.i && t < rr.fe) ? yb : ry(Math.max(rr.u0, Math.min(rr.u1, u)))
    if (yf > ya) rect(c, RX - 2, Math.trunc(ya) + dy, 4, Math.trunc(yf) - Math.trunc(ya), col)
  }
  const ym = ry(u) + dy
  rect(c, RX - 9, ym - 2, 18, 5, [3, 5, 12])
  rect(c, RX - 8, ym - 1, 16, 3, OFF)
}

export function scalebar(c: Ctx, L: number, label: string, flash: number): void {
  L = Math.max(8, L)
  const x = 788, y = 532
  const col = lerpc([228, 234, 252], CYAN, flash)
  for (const [rx, ry_, rw, rh] of [[x - 1, y - 1, L + 2, 5], [x - 1, y - 7, 5, 17], [x + L - 4, y - 7, 5, 17]]) rect(c, rx, ry_, rw, rh, [3, 5, 12])
  rect(c, x, y, L, 3, col)
  rect(c, x, y - 6, 3, 15, col)
  rect(c, x + L - 3, y - 6, 3, 15, col)
  stext(c, label, x + L + 14, y + 8, PXF(22, 600), col, 0, 'l')
}

// ------------------------------------------------------------------ bottom: one block at a time
function timerBar(c: Ctx, remain: number, total: number, dy = 0): void {
  const hot = remain < 8
  const w = (W * remain) / total
  rect(c, W / 2 - w / 2, 715 + dy, w, 3, hot ? [255, 122, 90] : [150, 162, 200])
}

export interface AskView {
  category: string
  prompt: string
  typed: string
  /** the answer was sent and the judge has not answered yet */
  checking: boolean
  /** the judge said valid */
  valid: boolean
  /** a line under the field, e.g. why the answer was not accepted */
  message: string
  remain: number
  total: number
  /** caret shows (blinks while idle) */
  caret: boolean
  /** 0..1 the field shakes after a rejected answer */
  shake: number
}
export function ask(c: Ctx, t: number, v: AskView, dy = 0): void {
  stext(c, v.category.toUpperCase(), 640, 570 + dy, SILF(12), [190, 202, 232], 3, 'c')
  stext(c, v.prompt, 640, 614 + dy, PXF(34, 500), OFF, 0, 'c')
  const sh = v.shake > 0 ? Math.round(Math.sin(v.shake * 40) * 6 * v.shake) : 0
  const has = v.typed.length > 0
  const lc: RGB = v.valid ? OKG : v.message && !v.checking ? WARN : has || v.checking ? OFF : LINE
  rect(c, 380, 684 + dy, 520, 2, lc)
  if (!has) {
    stext(c, 'type your answer', 640, 674 + dy, PXF(30, 400), [112, 126, 172], 0, 'c')
    if (v.caret && !v.checking) rect(c, 640 - textWidth(PXF(30, 400), 'type your answer') / 2 - 10, 650 + dy, 3, 30, OFF)
  } else {
    let fs = 38
    while (fs > 22 && textWidth(PXF(fs, 500), v.typed) > 500) fs -= 2
    const col = v.valid ? lerpc(OFF, OKG, 0.5) : OFF
    stext(c, v.typed, 640 + sh, 676 + dy, PXF(fs, 500), col, 0, 'c')
    if (v.caret && !v.checking && !v.valid) rect(c, 640 + sh + textWidth(PXF(fs, 500), v.typed) / 2 + 4, 648 + dy, 3, 32, OFF)
  }
  if (v.checking) {
    const lab = 'CHECKING'
    const w = textWidth(SILF(12, false), lab, 3)
    stext(c, lab, 640 - 14, 706 + dy, SILF(12, false), SOFT, 3, 'c')
    for (let k = 0; k < 3; k++) {
      const a = 0.35 + 0.65 * Math.max(0, Math.sin(t * 9 - k * 0.9))
      rect(c, 640 - 14 + w / 2 + 10 + k * 9, 698 + dy, 5, 5, lerpc([20, 28, 52], SOFT, a))
    }
  } else if (v.valid) stext(c, 'VALID', 640, 706 + dy, SILF(12), OKG, 3, 'c')
  else if (v.message) stext(c, v.message, 640, 706 + dy, SILF(11, false), WARN, 2, 'c')
  else if (!has) stext(c, 'ENTER', 640, 706 + dy, SILF(11), [112, 126, 172], 3, 'c')
  timerBar(c, v.remain, v.total, dy)
}

export function timeUp(c: Ctx, v: AskView, dy = 0): void {
  stext(c, v.category.toUpperCase(), 640, 570 + dy, SILF(12), [190, 202, 232], 3, 'c')
  stext(c, v.prompt, 640, 614 + dy, PXF(34, 500), OFF, 0, 'c')
  stext(c, 'TIME UP', 640, 676 + dy, PXF(38, 500), WARN, 0, 'c')
  stext(c, 'NO POINTS, NO SHRINK', 640, 706 + dy, SILF(12, false), SOFT, 3, 'c')
}

export function roll(c: Ctx, tl: Timeline, gems: Gems, t: number, r: Rec, dy = 0): void {
  stext(c, 'HOW RARE IS THIS ANSWER?', 640, 570 + dy, SILF(12, false), SOFT, 3, 'c')
  stext(c, r.answer, 640, 622 + dy, PXF(44, 500), OFF, 0, 'c')
  const p = tl.rollPos(r, t)
  const idx = Math.floor(p + 1e-6) % 6
  for (let k = 0; k < 6; k++) {
    const cx = 640 + (k - 2.5) * 70
    const on = k === idx
    const sz = on ? 46 : 30
    c.save()
    c.globalAlpha = on ? 1 : 0.4
    c.drawImage(gems.canvas(k, sz), Math.trunc(cx - sz / 2), Math.trunc(668 + dy - sz / 2))
    c.restore()
    if (on) rect(c, cx - 26, 668 + dy + 28, 52, 2, TIERS[k].edge)
  }
  stext(c, `${TIERS[idx].name} · ${TIERS[idx].points}`, 640, 716 + dy, SILF(13), TIERS[idx].fg, 3, 'c')
}

export function result(c: Ctx, gems: Gems, t: number, r: Rec, dy = 0): void {
  const tau = t - r.rev, ti = r.ti
  const tier = TIERS[ti]
  const n = Math.round(tier.points * easeOut((tau - 0.1) / 0.7))
  const lab = `${tier.name}   +${n}`
  const f = SILF(17)
  const w = textWidth(f, lab, 3)
  const gs = backOut((tau - 0.05) / 0.35)
  const sz = Math.max(4, Math.trunc(30 * gs))
  c.drawImage(gems.canvas(ti, sz), Math.trunc(640 - w / 2 - 22 - sz / 2), Math.trunc(570 + dy - 6 - sz / 2))
  stext(c, lab, 640 + 16, 577 + dy, f, tier.fg, 3, 'c')
  const a = easeOut(tau / 0.25)
  stext(c, r.answer, 640, 636 + dy + (1 - a) * 14, PXF(54, 500), OFF, 0, 'c')
  let desc = r.desc
  const fd = PXF(19, 400)
  while (textWidth(fd, desc) > 700 && desc.length > 10) desc = desc.slice(0, -4).trimEnd() + '...'
  stext(c, desc, 640, 676 + dy, fd, SOFT, 0, 'c')
}

// ------------------------------------------------------------------ lines after a landing: the "something is close" hint and the post-finale words
export interface LandingLine { main: string; small?: string; glow: number; rgb: RGB }

export function landingLines(c: Ctx, r: Rec, t: number, line: LandingLine): void {
  const t0 = r.fe + (r.post > 0 ? 0.35 : 0.25)
  const tau = t - t0
  const end = r.next - (r.i === 6 ? 0.2 : 0.3)
  if (tau < 0 || t > end) return
  const a = smooth(0, 0.5, tau) * (1 - smooth(end - 0.5, end, t))
  const pulse = Math.sin(Math.PI * clamp01(tau / 1.5)) * line.glow
  radialAdd(c, 640, 240, 520, line.rgb, 0.32 * pulse, 2)
  c.save()
  c.globalAlpha = a
  stext(c, line.main, 640, 236, PXF(r.post > 0 ? 36 : 40, 500), lerpc(OFF, line.rgb, 0.18), 0, 'c')
  if (line.small) stext(c, line.small, 640, 276, SILF(14, false), SOFT, 4, 'c')
  c.restore()
}

// ------------------------------------------------------------------ title screen
export interface PlayBox { x: number; y: number; w: number; h: number }

/** what the title screen says, decided by the game from what the server told it about today's daily */
export interface TitleView {
  /** the small line under the tagline: 'DAILY #12' or 'SOLO RUN' */
  label: string
  /** the big button */
  primary: string
  /** false = drawn dim (the daily is open somewhere else); pressing it only checks again */
  enabled: boolean
  /** the small button under it, or null */
  secondary: string | null
  /** one quiet line (streak, time to the next daily) */
  line: string | null
  /** one quieter line (the rule of the daily) */
  note: string | null
}
export const TITLE_BOXES: { primary: PlayBox; secondary: PlayBox } = {
  primary: { x: 490, y: 422, w: 300, h: 56 },
  secondary: { x: 540, y: 526, w: 200, h: 40 },
}
export function introButtons(c: Ctx, t: number, exitT: number, pressedAt: number | null, now: number, wobble: number, v: TitleView): void {
  const out = smooth(5.15, 5.75, exitT)
  const a = smooth(2.4, 3.0, t) * (1 - out)
  if (a <= 0.01) return
  const dark: RGB = [12, 18, 36]
  const pressed = pressedAt !== null && now - pressedAt < 0.2
  const pul = pressedAt === null && v.enabled ? 1 + 0.04 * Math.sin(wobble * 7) : 1
  const b = TITLE_BOXES.primary
  const w = b.w * pul, h = b.h * pul
  const x = 640 - w / 2, y = b.y + b.h / 2 - h / 2
  const col = lerpc(dark, v.enabled ? OFF : FAINT, a)
  if (pressed) rect(c, x, y, w, h, [60, 70, 110])
  rect(c, x, y, w, 2, col); rect(c, x, y + h - 2, w, 2, col); rect(c, x, y, 2, h, col); rect(c, x + w - 2, y, 2, h, col)
  let fs = 20
  while (fs > 12 && textWidth(SILF(fs), v.primary, 4) > b.w - 40) fs--
  drawText(c, v.primary, 640, 458, SILF(fs), col, 4, 'c')
  if (pressedAt === null && v.enabled) drawText(c, 'PRESS ENTER', 640, 506, SILF(11), lerpc(dark, [112, 126, 172], a), 3, 'c')
  if (v.secondary) {
    const s = TITLE_BOXES.secondary
    const sc = lerpc(dark, SOFT, a * (pressedAt === null ? 1 : 0.5))
    rect(c, s.x, s.y, s.w, 2, sc); rect(c, s.x, s.y + s.h - 2, s.w, 2, sc); rect(c, s.x, s.y, 2, s.h, sc); rect(c, s.x + s.w - 2, s.y, 2, s.h, sc)
    drawText(c, v.secondary, 640, s.y + 26, SILF(14), sc, 3, 'c')
  }
  if (pressedAt === null && v.line) drawText(c, v.line, 640, 604, SILF(12, false), lerpc(dark, SOFT, a), 3, 'c')
  if (pressedAt === null && v.note) drawText(c, v.note, 640, 632, SILF(11, false), lerpc(dark, [112, 126, 172], a), 2, 'c')
}

// ------------------------------------------------------------------ report
export interface ReportButtons { share: PlayBox; again: PlayBox }
export const REPORT_BUTTONS: ReportButtons = { share: { x: 96, y: 650, w: 170, h: 50 }, again: { x: 286, y: 650, w: 170, h: 50 } }

/** what the report shows besides the run itself */
export interface ReportExtras {
  /** the second button: 'PLAY AGAIN' after a solo run, 'SOLO RUN' after the daily */
  againLabel: string
  /** daily runs only. `lines` is empty until the server has answered. */
  daily: null | { number: number; lines: string[]; streak: number; countdown: string; newReady: boolean }
}

export function report(c: Ctx, tr: number, recs: Rec[], data: ReportData, toast: number, extras: ReportExtras): void {
  const x = 96
  const a0 = easeOut(tr / 0.6)
  const dark: RGB = [12, 18, 36]
  const gold: RGB = [255, 200, 87]
  if (data.perfect) drawText(c, 'PERFECT RUN', x, 118, SILF(14), lerpc(dark, gold, a0), 6)
  stext(c, 'YOU SHRANK TO', x, 150, SILF(13, false), SOFT, 4)
  let fs = 100
  while (fs > 40 && textWidth(PXF(fs, 700), data.bigSize) > 640) fs -= 2
  stext(c, data.bigSize, x - (1 - a0) * 40, 246, PXF(fs, 700), OFF)
  stext(c, data.compare, x, 288, PXF(24, 400), SOFT)
  const sc = Math.round(data.total * easeOut((tr - 0.6) / 0.9))
  const stage = stageOfPoints(data.total)
  const place = stage.worldNo ? `world ${stage.worldNo} of ${N_WORLDS}` : 'unexplored'
  stext(c, `${sc} / ${MAX_POINTS_DISPLAY} points · ${place}`, x, 328, SILF(13, false), SOFT, 2)
  let top = 378
  if (data.extraLine) {
    const ea = easeOut((tr - 1.1) / 0.4)
    stext(c, data.extraLine, x, 354, SILF(13), lerpc(dark, AMBER, ea), 2)
    top = 394
  }
  recs.forEach((r, i) => {
    const ra = easeOut((tr - 0.9 - 0.22 * i) / 0.35)
    if (ra <= 0) return
    const ry_ = top + i * 34 + (1 - ra) * 12
    if (r.miss) {
      rect(c, x, ry_ - 14, 14, 14, lerpc(dark, [84, 98, 140], ra))
      stext(c, 'time ran out', x + 30, ry_, PXF(23, 500), lerpc(dark, FAINT, ra))
      stext(c, '0', x + 440, ry_, PXF(21, 600), lerpc(dark, FAINT, ra), 0, 'r')
      return
    }
    rect(c, x, ry_ - 14, 14, 14, lerpc(dark, TIERS[r.ti].edge, ra))
    stext(c, r.answer, x + 30, ry_, PXF(23, 500), lerpc(dark, OFF, ra))
    stext(c, String(TIERS[r.ti].points), x + 440, ry_, PXF(21, 600), lerpc(dark, SOFT, ra), 0, 'r')
  })
  const ba = easeOut((tr - 2.6) / 0.5)
  if (ba > 0.01) {
    const col = lerpc(dark, OFF, ba)
    for (const [b, label] of [[REPORT_BUTTONS.share, toast > 0 ? 'COPIED' : 'SHARE'], [REPORT_BUTTONS.again, extras.againLabel]] as [PlayBox, string][]) {
      rect(c, b.x, b.y, b.w, 2, col); rect(c, b.x, b.y + b.h - 2, b.w, 2, col); rect(c, b.x, b.y, 2, b.h, col); rect(c, b.x + b.w - 2, b.y, 2, b.h, col)
      drawText(c, label, b.x + b.w / 2, b.y + 31, SILF(label.length > 9 ? 14 : 16), col, 4, 'c')
    }
  }
  if (extras.daily) dailyPanel(c, tr, extras.daily)
}

/** the daily's standing, bottom right: where this run ranks, the streak, and the time to the next daily */
function dailyPanel(c: Ctx, tr: number, d: NonNullable<ReportExtras['daily']>): void {
  const a = easeOut((tr - 1.4) / 0.6)
  if (a <= 0.01) return
  const dark: RGB = [12, 18, 36]
  const xr = 1190
  stext(c, `DAILY #${d.number}`, xr, 590, SILF(13), lerpc(dark, SOFT, a), 4, 'r')
  if (d.lines.length) {
    stext(c, d.lines[0], xr, 630, PXF(30, 600), lerpc(dark, OFF, a), 0, 'r')
    if (d.lines[1]) stext(c, d.lines[1], xr, 658, SILF(12, false), lerpc(dark, SOFT, a), 3, 'r')
  } else {
    stext(c, 'SAVING YOUR RESULT', xr, 630, SILF(13, false), lerpc(dark, SOFT, a), 3, 'r')
  }
  const tail = d.newReady ? 'A NEW DAILY IS READY. RELOAD TO PLAY' : `NEXT DAILY IN ${d.countdown}${d.streak > 0 ? `  ·  STREAK ${d.streak}` : ''}`
  stext(c, tail, xr, 690, SILF(12, false), lerpc(dark, d.newReady ? AMBER : SOFT, a), 3, 'r')
}

export const lerpN = lerp
void backOut; void easeInOut; void ck; void rgb; void H
export type { RunRecord }

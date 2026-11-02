/** Light and particle effects. Everything here is a pure function of time (no state between frames). */
import { H, W } from './config'
import { ck, clamp01, rgb, rnd, seededRand, type RGB } from './util'
import { ctxOf, mkCanvas, type Ctx } from './draw'

/** Black canvas the effects are drawn on; added onto the frame (plus a soft glow) at the end. */
export class AddLayer {
  readonly cv = mkCanvas(W, H)
  readonly c: Ctx = ctxOf(this.cv)
  private dirty = false
  private s4 = mkCanvas(W / 4, H / 4)
  private s8 = mkCanvas(W / 8, H / 8)
  private s16 = mkCanvas(W / 16, H / 16)

  /** get the drawing context, clearing the canvas on first use each frame */
  ctx(): Ctx {
    if (!this.dirty) {
      this.c.fillStyle = '#000'
      this.c.fillRect(0, 0, W, H)
      this.dirty = true
    }
    return this.c
  }
  apply(dst: Ctx, glow = 0.9): void {
    if (!this.dirty) return
    dst.save()
    dst.globalCompositeOperation = 'lighter'
    dst.drawImage(this.cv, 0, 0)
    const a = ctxOf(this.s4); a.imageSmoothingEnabled = true; a.drawImage(this.cv, 0, 0, W / 4, H / 4)
    const b = ctxOf(this.s8); b.imageSmoothingEnabled = true; b.drawImage(this.s4, 0, 0, W / 8, H / 8)
    const c = ctxOf(this.s16); c.imageSmoothingEnabled = true; c.drawImage(this.s8, 0, 0, W / 16, H / 16)
    dst.imageSmoothingEnabled = true
    dst.globalAlpha = glow * 0.6
    dst.drawImage(this.s8, 0, 0, W, H)
    dst.globalAlpha = glow * 0.55
    dst.drawImage(this.s16, 0, 0, W, H)
    dst.restore()
    this.dirty = false
  }
}

export function ring(a: AddLayer, cx: number, cy: number, r: number, w: number, col: RGB, alpha = 1, ry?: number): void {
  if (r < 2 || alpha <= 0.01) return
  const c = a.ctx()
  const lw = Math.max(1, Math.trunc(w))
  c.strokeStyle = rgb(ck(col, alpha))
  c.lineWidth = lw
  c.beginPath()
  c.ellipse(cx, cy, Math.max(1, r - lw / 2), Math.max(1, (ry ?? r) - lw / 2), 0, 0, Math.PI * 2)
  c.stroke()
}

export function pxstar(c: Ctx, x: number, y: number, s: number, col: RGB): void {
  s = Math.max(1, Math.trunc(s)); x = Math.trunc(x); y = Math.trunc(y)
  const h = s >> 1
  c.fillStyle = rgb(col)
  c.fillRect(x - 3 * s, y - h, 6 * s + 1, s)
  c.fillRect(x - h, y - 3 * s, s, 6 * s + 1)
  c.fillRect(x - s, y - s, 2 * s, 2 * s)
}
export function square(c: Ctx, x: number, y: number, s: number, col: RGB): void {
  c.fillStyle = rgb(col)
  c.fillRect(Math.trunc(x - s / 2), Math.trunc(y - s / 2), Math.trunc(s), Math.trunc(s))
}

/** n particles leaving (ox, oy) at time t0. Position = origin + v * (1 - exp(-drag t)) / drag + g t^2 / 2. */
export function burst(a: AddLayer, t: number, t0: number, n: number, seed: number, ox: number, oy: number, vmin: number, vmax: number, life: number, g = 0,
  size = 6, cols: RGB[] = [[255, 255, 255]], opts: { a0?: number; a1?: number; spread?: number; drag?: number; bright?: number } = {}): void {
  const { a0 = 0, a1 = Math.PI * 2, spread = 0, drag = 0, bright = 1.6 } = opts
  const r = rnd(seed, n, 6)
  let c: Ctx | null = null
  for (let k = 0; k < n; k++) {
    const tau = t - t0 - r.get(k, 5) * spread
    const lifeK = life * (0.6 + 0.4 * r.get(k, 2))
    if (!(tau > 0 && tau < lifeK)) continue
    const ang = a0 + (a1 - a0) * r.get(k, 0)
    const v = vmin + (vmax - vmin) * r.get(k, 1)
    const dd = drag === 0 ? v * tau : (v * (1 - Math.exp(-drag * tau))) / drag
    const x = ox + Math.cos(ang) * dd
    const y = oy + Math.sin(ang) * dd + 0.5 * g * tau * tau
    const f = 1 - tau / lifeK
    const col = cols[Math.trunc(r.get(k, 4) * cols.length) % cols.length]
    let s = size * (0.6 + 0.8 * r.get(k, 3)) * (0.35 + 0.65 * f)
    s = Math.max(2, Math.round(s / 2) * 2)
    c = c ?? a.ctx()
    c.fillStyle = rgb(ck(col, Math.min(1, f * bright)))
    c.fillRect(Math.trunc(x - s / 2), Math.trunc(y - s / 2), s, s)
  }
}

/** particles spiralling into (ox, oy) between tc0 and tc1 */
export function inward(a: AddLayer, t: number, tc0: number, tc1: number, n: number, seed: number, ox: number, oy: number, rmin: number, rmax: number, col: RGB, size = 6): void {
  if (!(t >= tc0 && t <= tc1)) return
  const r = rnd(seed, n, 5)
  const c = a.ctx()
  for (let k = 0; k < n; k++) {
    const cyc = 0.55 + 0.35 * r.get(k, 3)
    const q = (((t - tc0) / cyc + r.get(k, 2)) % 1 + 1) % 1
    const rad = rmin + (rmax - rmin) * r.get(k, 1)
    const rr = rad * (1 - q) ** 1.6
    const ang = 2 * Math.PI * r.get(k, 0) + 2.2 * q
    const x = ox + Math.cos(ang) * rr
    const y = oy + Math.sin(ang) * rr * 0.8
    const f = q ** 0.7
    const s = Math.max(2, Math.round((size * (0.5 + 0.7 * r.get(k, 4)) * (0.4 + 0.6 * (1 - q))) / 2) * 2)
    c.fillStyle = rgb(ck(col, f * 1.3))
    c.fillRect(Math.trunc(x - s / 2), Math.trunc(y - s / 2), s, s)
  }
}

export function lightning(a: AddLayer, t: number, cx: number, cy: number, rate: number, n: number, rmin: number, rmax: number, col: RGB, w = 3): void {
  const kk = Math.trunc(t * rate)
  const rs = seededRand(kk * 7919 + 13)
  const c = a.ctx()
  c.lineJoin = 'round'
  for (let b = 0; b < n; b++) {
    const ang = rs() * 2 * Math.PI
    const L = rmin + (rmax - rmin) * rs()
    const segs = 9
    const pts: [number, number][] = [[cx, cy]]
    for (let s = 1; s <= segs; s++) {
      const f = s / segs
      const jx = (rs() - 0.5) * 70 * Math.sin(Math.PI * f) ** 0.6
      const jy = (rs() - 0.5) * 70 * Math.sin(Math.PI * f) ** 0.6
      pts.push([cx + Math.cos(ang) * L * f + jx, cy + Math.sin(ang) * L * f * 0.85 + jy])
    }
    const line = (p: [number, number][], colr: RGB, lw: number) => {
      c.strokeStyle = rgb(colr); c.lineWidth = lw; c.beginPath(); c.moveTo(p[0][0], p[0][1])
      for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1])
      c.stroke()
    }
    line(pts, col, w)
    line(pts, ck(col, 0.5), w + 4)
    if (rs() < 0.6) {
      const k0 = Math.trunc(2 + rs() * 4)
      const [bx, by] = pts[k0]
      const a2 = ang + (rs() - 0.5) * 1.8
      const pts2: [number, number][] = [[bx, by]]
      for (let s = 1; s < 5; s++) pts2.push([bx + Math.cos(a2) * 26 * s + (rs() - 0.5) * 20, by + Math.sin(a2) * 26 * s + (rs() - 0.5) * 20])
      line(pts2, ck(col, 0.8), Math.max(1, w - 1))
    }
  }
}

export function confetti(a: AddLayer, t: number, t0: number, n: number, seed: number, cols: RGB[], dur: number, x0: number, x1: number, ytop: number, vy: number, sway = 40, size = 10): void {
  const r = rnd(seed, n, 7)
  const c = a.ctx()
  for (let k = 0; k < n; k++) {
    const tau = t - t0 - r.get(k, 6) * dur * 0.5
    if (tau <= 0 || tau > dur) continue
    const x = x0 + (x1 - x0) * r.get(k, 0) + sway * Math.sin(tau * (2 + 3 * r.get(k, 1)) + 6.28 * r.get(k, 2))
    const y = ytop + tau * (vy * (0.7 + 0.6 * r.get(k, 3)))
    if (y > H + 20) continue
    const wv = Math.abs(Math.cos(tau * (5 + 6 * r.get(k, 4)) + 6.28 * r.get(k, 2)))
    const w_ = Math.max(2, Math.trunc(size * (0.3 + 0.7 * wv)))
    const h_ = Math.trunc(size * 1.4)
    let col = cols[Math.trunc(r.get(k, 5) * cols.length) % cols.length]
    if (wv < 0.35) col = ck(col, 0.7)
    c.fillStyle = rgb(col)
    c.fillRect(Math.trunc(x), Math.trunc(y), w_ + 1, h_ + 1)
  }
}

export function twinkleStars(a: AddLayer, t: number, t0: number, n: number, seed: number, cx: number, cy: number, rmin: number, rmax: number, cols: RGB[], dur: number, size = 2, rot = 0): void {
  if (t - t0 < 0 || t - t0 > dur) return
  const rr = rnd(seed, n, 5)
  const c = a.ctx()
  for (let k = 0; k < n; k++) {
    const ph = (t - t0) * (2.2 + 2 * rr.get(k, 3)) + 6.28 * rr.get(k, 2)
    const al = Math.max(0, Math.sin(ph)) ** 1.5
    const ang = 2 * Math.PI * rr.get(k, 0) + rot
    const rad = rmin + (rmax - rmin) * rr.get(k, 1)
    const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad * 0.9
    const s = Math.max(1, Math.round(size * (0.6 + al)))
    pxstar(c, x, y, s, ck(cols[Math.trunc(rr.get(k, 4) * cols.length) % cols.length], 0.35 + 0.65 * al))
  }
}

// ------------------------------------------------------------------ sunburst and halftone (added onto the picture)
const sbSmall = mkCanvas(W / 4, H / 4)
const sbMask = mkCanvas(W, H)
/** n alternating wedges around (cx, cy), fading out to radius R at power pw, tinted col * k and added to the picture */
export function sunburstAdd(c: Ctx, cx: number, cy: number, n: number, rot: number, duty: number, R: number, pw: number, col: RGB, k: number): void {
  if (k <= 0.01) return
  const s = ctxOf(sbSmall)
  s.clearRect(0, 0, W / 4, H / 4)
  s.fillStyle = '#fff'
  const step = (2 * Math.PI) / n
  const RR = 900 / 4
  const c0x = cx / 4, c0y = cy / 4
  for (let i = 0; i < n; i++) {
    const a0 = rot + i * step, a1 = a0 + step * duty, am = (a0 + a1) / 2
    s.beginPath()
    s.moveTo(c0x, c0y)
    s.lineTo(c0x + RR * Math.cos(a0), c0y + RR * Math.sin(a0))
    s.lineTo(c0x + RR * 1.15 * Math.cos(am), c0y + RR * 1.15 * Math.sin(am))
    s.lineTo(c0x + RR * Math.cos(a1), c0y + RR * Math.sin(a1))
    s.closePath()
    s.fill()
  }
  const m = ctxOf(sbMask)
  m.globalCompositeOperation = 'source-over'
  m.clearRect(0, 0, W, H)
  m.imageSmoothingEnabled = true
  m.drawImage(sbSmall, 0, 0, W, H)
  const g = m.createRadialGradient(cx, cy, 0, cx, cy, R)
  const N = 14
  for (let i = 0; i <= N; i++) g.addColorStop(i / N, `rgba(255,255,255,${(1 - i / N) ** pw})`)
  m.globalCompositeOperation = 'destination-in'
  m.fillStyle = g
  m.fillRect(0, 0, W, H)
  m.globalCompositeOperation = 'source-in'
  m.fillStyle = rgb(col)
  m.fillRect(0, 0, W, H)
  c.save()
  c.globalCompositeOperation = 'lighter'
  c.globalAlpha = clamp01(k)
  c.drawImage(sbMask, 0, 0)
  c.restore()
}

/** dots that grow away from (cx, cy), added to the picture */
export function halftoneAdd(c: Ctx, cx: number, cy: number, grow: number, col: RGB, k: number, cell = 16, r0 = 110, r1 = 820, cmax = 0.72): void {
  if (k <= 0.01 || grow <= 0.01) return
  c.save()
  c.globalCompositeOperation = 'lighter'
  c.fillStyle = rgb(ck(col, k))
  c.beginPath()
  for (let gy = 0; gy < H / cell; gy++) {
    for (let gx = 0; gx < W / cell; gx++) {
      const mx = (gx + 0.5) * cell, my = (gy + 0.5) * cell
      const R = Math.hypot(mx - cx, my - cy)
      const rad = cell * cmax * clamp01((R - r0) / (r1 - r0)) ** 0.8 * grow
      if (rad < 0.5) continue
      if (rad <= cell / 2) { c.moveTo(mx + rad, my); c.arc(mx, my, rad, 0, Math.PI * 2) }
      else {
        const cr = Math.max(0, (cell / 2) * (1 - (rad - cell / 2) / (cell * 0.2)))
        c.roundRect(gx * cell, gy * cell, cell, cell, cr)
      }
    }
  }
  c.fill()
  c.restore()
}

/** Canvas 2D helpers: crisp pixel text, rectangles, gradients, and the glowing / outlined / gradient titles. */
import { H, W } from './config'
import { clamp01, rgb, rgba, type RGB } from './util'

export type Ctx = CanvasRenderingContext2D

export function mkCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.ceil(w))
  c.height = Math.max(1, Math.ceil(h))
  return c
}
export function ctxOf(c: HTMLCanvasElement): Ctx {
  return c.getContext('2d', { alpha: true })!
}

// ------------------------------------------------------------------ text
export type FontKind = 'px' | 'sil'
const PX_WEIGHTS = [400, 500, 600, 700]
export function fontStr(kind: FontKind, size: number, w = 500): string {
  if (kind === 'px') {
    const ww = PX_WEIGHTS.reduce((a, b) => (Math.abs(b - w) < Math.abs(a - w) ? b : a))
    return `${ww} ${size}px PixelifyFix`
  }
  return `${w >= 500 ? 700 : 400} ${size}px Silkscreen`
}
export const PXF = (size: number, w = 500): string => fontStr('px', size, w)
/** Silkscreen: bold by default, regular when bold = false */
export const SILF = (size: number, bold = true): string => fontStr('sil', size, bold ? 700 : 400)

const mctx = ctxOf(mkCanvas(8, 8))
const advCache = new Map<string, number>()
function adv(font: string, ch: string): number {
  const k = font + '|' + ch
  let v = advCache.get(k)
  if (v === undefined) {
    mctx.font = font
    v = mctx.measureText(ch).width
    advCache.set(k, v)
  }
  return v
}
/** width of the text with letter spacing ls between characters (not after the last one) */
export function textWidth(font: string, s: string, ls = 0): number {
  let w = 0
  for (const ch of s) w += adv(font, ch) + ls
  return Math.max(0, w - ls)
}
export type Anchor = 'l' | 'c' | 'r'
/** y is the baseline. Characters are placed one by one, so there are no ligatures and no kerning. */
export function drawText(c: Ctx, s: string, x: number, y: number, font: string, fill: string | RGB, ls = 0, anchor: Anchor = 'l'): void {
  const w = textWidth(font, s, ls)
  let px = anchor === 'l' ? x : anchor === 'c' ? x - w / 2 : x - w
  c.font = font
  c.textBaseline = 'alphabetic'
  c.textAlign = 'left'
  c.fillStyle = typeof fill === 'string' ? fill : rgb(fill)
  for (const ch of s) {
    c.fillText(ch, Math.round(px), Math.round(y))
    px += adv(font, ch) + ls
  }
}
const SHADOW = 'rgb(3,5,12)'
/** text with the soft 1 px drop shadow every line of the interface has */
export function stext(c: Ctx, s: string, x: number, y: number, font: string, fill: string | RGB, ls = 0, anchor: Anchor = 'l'): void {
  drawText(c, s, x + 1, y + 2, font, SHADOW, ls, anchor)
  drawText(c, s, x, y, font, fill, ls, anchor)
}
export function wrapText(font: string, s: string, maxw: number): string[] {
  const words = s.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const t = (cur + ' ' + w).trim()
    if (textWidth(font, t) <= maxw || !cur) cur = t
    else { lines.push(cur); cur = w }
  }
  if (cur) lines.push(cur)
  return lines
}

// ------------------------------------------------------------------ rectangles and gradients
export function rect(c: Ctx, x: number, y: number, w: number, h: number, fill: string | RGB): void {
  if (w <= 0 || h <= 0) return
  c.fillStyle = typeof fill === 'string' ? fill : rgb(fill)
  const x0 = Math.round(x), y0 = Math.round(y)
  c.fillRect(x0, y0, Math.round(x + w) - x0, Math.round(y + h) - y0)
}
/** darken / tint a rectangle with an alpha that ramps from a0 to a1 along rows (axis 0) or columns (axis 1) */
export function shade(c: Ctx, x0: number, y0: number, x1: number, y1: number, col: RGB, a0: number, a1?: number, axis: 0 | 1 = 0): void {
  x0 = Math.max(0, Math.trunc(x0)); y0 = Math.max(0, Math.trunc(y0)); x1 = Math.min(W, Math.trunc(x1)); y1 = Math.min(H, Math.trunc(y1))
  if (x1 <= x0 || y1 <= y0) return
  const e = a1 ?? a0
  if (a0 <= 0.002 && e <= 0.002) return
  if (e === a0) c.fillStyle = rgba(col, a0)
  else {
    const g = axis === 0 ? c.createLinearGradient(0, y0, 0, y1) : c.createLinearGradient(x0, 0, x1, 0)
    g.addColorStop(0, rgba(col, a0))
    g.addColorStop(1, rgba(col, e))
    c.fillStyle = g
  }
  c.fillRect(x0, y0, x1 - x0, y1 - y0)
}
/** a quiet gradient instead of a panel: smooth ramp 0 -> amax over [y0, y1] (reversed when up) */
export function vscrim(c: Ctx, y0: number, y1: number, amax: number, up = false, col: RGB = [4, 7, 18]): void {
  y0 = Math.max(0, Math.trunc(y0)); y1 = Math.min(H, Math.trunc(y1))
  if (y1 <= y0 || amax <= 0.002) return
  const g = c.createLinearGradient(0, y0, 0, y1)
  const N = 12
  for (let i = 0; i <= N; i++) {
    const s = i / N
    const v = (s * s * (3 - 2 * s)) ** 0.85
    g.addColorStop(s, rgba(col, (up ? 1 - v : v) * amax))
  }
  c.fillStyle = g
  c.fillRect(0, y0, W, y1 - y0)
}
/** elliptical edge darkening / tinting, same falloff as the design tool: (distance / 1.2) ^ 2.2 */
export function vignette(c: Ctx, col: RGB, k: number): void {
  if (k <= 0.01) return
  c.save()
  c.translate(W / 2, H / 2)
  c.scale(W / 2, H / 2)
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 1.2)
  const N = 12
  for (let i = 0; i <= N; i++) g.addColorStop(i / N, rgba(col, k * (i / N) ** 2.2))
  c.fillStyle = g
  c.fillRect(-1.5, -1.5, 3, 3)
  c.restore()
}
/** a soft light blob added to the picture: colour * k * (1 - d/R)^pw */
export function radialAdd(c: Ctx, cx: number, cy: number, R: number, col: RGB, k: number, pw = 2): void {
  if (k <= 0.01 || R < 1) return
  const g = c.createRadialGradient(cx, cy, 0, cx, cy, R)
  const N = 12
  for (let i = 0; i <= N; i++) {
    const f = (1 - i / N) ** pw * k
    g.addColorStop(i / N, `rgb(${Math.min(255, Math.round(col[0] * f))},${Math.min(255, Math.round(col[1] * f))},${Math.min(255, Math.round(col[2] * f))})`)
  }
  c.save()
  c.globalCompositeOperation = 'lighter'
  c.fillStyle = g
  c.fillRect(cx - R, cy - R, 2 * R, 2 * R)
  c.restore()
}
export function tint(c: Ctx, col: RGB, k: number): void {
  if (k <= 0.01) return
  c.fillStyle = rgba(col, clamp01(k))
  c.fillRect(0, 0, W, H)
}

// ------------------------------------------------------------------ blur (used for glows)
const filterOk = ctxOf(mkCanvas(2, 2)).filter !== undefined
export function blurInto(dst: Ctx, src: HTMLCanvasElement, sigma: number, x = 0, y = 0): void {
  if (filterOk) {
    dst.save()
    dst.filter = `blur(${sigma}px)`
    dst.drawImage(src, x, y)
    dst.restore()
    return
  }
  // no canvas filters (older Safari): shrink and enlarge, which blurs about as much
  const f = Math.max(2, Math.round(sigma * 1.2))
  const small = mkCanvas(src.width / f, src.height / f)
  const sc = ctxOf(small)
  sc.imageSmoothingEnabled = true
  sc.drawImage(src, 0, 0, small.width, small.height)
  dst.save()
  dst.imageSmoothingEnabled = true
  dst.drawImage(small, x, y, src.width, src.height)
  dst.restore()
}

// ------------------------------------------------------------------ mask helpers
/** a canvas holding `s` in white with transparent surroundings; returns the drawing offsets (px, py = padding, baseline) */
export interface TextMask { canvas: HTMLCanvasElement; px: number; py: number; w: number; h: number }
const maskCache = new Map<string, TextMask>()
export function textMask(s: string, font: string, size: number, ls: number, pad: number): TextMask {
  const key = `${s}|${font}|${ls}|${pad}`
  let m = maskCache.get(key)
  if (m) return m
  const w = Math.ceil(textWidth(font, s, ls)) + 2 * pad
  const h = Math.ceil(size * 1.5) + 2 * pad
  const cv = mkCanvas(w, h)
  const c = ctxOf(cv)
  const py = pad + Math.round(size * 1.1)
  drawText(c, s, pad, py, font, '#fff', ls, 'l')
  m = { canvas: cv, px: pad, py, w, h }
  if (maskCache.size > 400) maskCache.clear()
  maskCache.set(key, m)
  return m
}
/** fill the shape of `mask` with a colour or a top-to-bottom gradient */
function colouredMask(mask: HTMLCanvasElement, fill: RGB | [RGB, RGB]): HTMLCanvasElement {
  const cv = mkCanvas(mask.width, mask.height)
  const c = ctxOf(cv)
  c.drawImage(mask, 0, 0)
  c.globalCompositeOperation = 'source-in'
  if (Array.isArray(fill[0])) {
    const g = c.createLinearGradient(0, 0, 0, mask.height)
    g.addColorStop(0, rgb(fill[0] as RGB))
    g.addColorStop(1, rgb(fill[1] as RGB))
    c.fillStyle = g
  } else c.fillStyle = rgb(fill as RGB)
  c.fillRect(0, 0, mask.width, mask.height)
  return cv
}
/** square dilation: the mask grown by k pixels in every direction */
function dilate(mask: HTMLCanvasElement, k: number): HTMLCanvasElement {
  const a = mkCanvas(mask.width, mask.height)
  const ac = ctxOf(a)
  for (let dx = -k; dx <= k; dx++) ac.drawImage(mask, dx, 0)
  const b = mkCanvas(mask.width, mask.height)
  const bc = ctxOf(b)
  for (let dy = -k; dy <= k; dy++) bc.drawImage(a, 0, dy)
  return b
}
/** a tinted copy of `mask` drawn with 'lighter' (additive light) */
export function addMask(c: Ctx, mask: HTMLCanvasElement, x: number, y: number, col: RGB, k = 1, scale = 1): void {
  if (k <= 0.01) return
  const t = colouredMask(mask, col)
  c.save()
  c.globalCompositeOperation = 'lighter'
  c.globalAlpha = clamp01(k)
  c.imageSmoothingEnabled = true
  c.drawImage(t, x, y, mask.width * scale, mask.height * scale)
  c.restore()
}

// ------------------------------------------------------------------ outlined, glowing, gradient titles
interface TitleSprite { body: HTMLCanvasElement; glow: HTMLCanvasElement; mask: HTMLCanvasElement; px: number; py: number; w: number; h: number; pad: number }
const titleCache = new Map<string, TitleSprite>()
function titleSprite(s: string, size: number, w: number, ls: number, top: RGB, bot: RGB, outline: RGB, glowCol: RGB): TitleSprite {
  const key = [s, size, w, ls, top, bot, outline, glowCol].join('|')
  let sp = titleCache.get(key)
  if (sp) return sp
  const font = PXF(size, w)
  const pad = 18
  const m = textMask(s, font, size, ls, pad)
  const k = Math.max(3, Math.round(4))
  const dil = dilate(m.canvas, k)
  const body = mkCanvas(m.w, m.h)
  const bc = ctxOf(body)
  // drop shadow 6 px down, outline, then the gradient fill
  bc.globalAlpha = 0.5
  bc.drawImage(colouredMask(dil, [0, 0, 0]), 0, 6)
  bc.globalAlpha = 1
  bc.drawImage(colouredMask(dil, outline), 0, 0)
  bc.drawImage(colouredMask(m.canvas, [top, bot]), 0, 0)
  const glow = mkCanvas(m.w, m.h)
  blurInto(ctxOf(glow), colouredMask(dilate(m.canvas, 2), glowCol), 9)
  sp = { body, glow, mask: m.canvas, px: m.px, py: m.py, w: m.w, h: m.h, pad }
  if (titleCache.size > 60) titleCache.clear()
  titleCache.set(key, sp)
  return sp
}
function drawShine(c: Ctx, mask: HTMLCanvasElement, x: number, y: number, scale: number, shine: number, alpha: number): void {
  const wd = mask.width, h = mask.height
  const pos = -0.3 * wd + shine * 1.6 * wd
  const hw = 0.07 * wd
  const t = mkCanvas(wd, h)
  const tc = ctxOf(t)
  const m = (2 * hw) / (1 + 0.36)
  const g = tc.createLinearGradient(pos - hw, 0, pos - hw + m, m * 0.6)
  g.addColorStop(0, 'rgba(255,255,255,0)')
  g.addColorStop(0.5, 'rgba(255,255,255,1)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  tc.fillStyle = g
  tc.fillRect(0, 0, wd, h)
  tc.globalCompositeOperation = 'destination-in'
  tc.drawImage(mask, 0, 0)
  c.save()
  c.globalCompositeOperation = 'lighter'
  c.globalAlpha = 0.85 * alpha
  c.imageSmoothingEnabled = true
  c.drawImage(t, x, y, wd * scale, h * scale)
  c.restore()
}
/**
 * Outlined, glowing, gradient-filled title centred at cx with its baseline at baseY.
 * scale: pop-in scale. shine: null or 0..1 position of a diagonal light sweep. split: px of colour split (glitch).
 */
export function bigTitle(c: Ctx, s: string, size: number, cx: number, baseY: number, scale: number, top: RGB, bot: RGB, outline: RGB, glowCol: RGB,
  opts: { glow?: number; shine?: number | null; split?: number; ls?: number; alpha?: number; w?: number } = {}): void {
  const { glow = 0.7, shine = null, split = 0, ls = 2, alpha = 1, w = 500 } = opts
  if (scale <= 0.02 || alpha <= 0.01) return
  const sp = titleSprite(s, size, w, ls, top, bot, outline, glowCol)
  const x = cx - (sp.w / 2) * scale
  const y = baseY - sp.py * scale
  c.save()
  c.imageSmoothingEnabled = true
  if (glow > 0) {
    c.globalCompositeOperation = 'lighter'
    c.globalAlpha = clamp01(glow * alpha) * 0.9
    c.drawImage(sp.glow, x, y, sp.w * scale, sp.h * scale)
    c.globalCompositeOperation = 'source-over'
  }
  c.globalAlpha = clamp01(alpha)
  c.drawImage(sp.body, x, y, sp.w * scale, sp.h * scale)
  if (split) {
    const sx = Math.trunc(split)
    for (const [dx, col] of [[-sx, [255, 40, 120]], [sx, [40, 220, 255]]] as [number, RGB][]) {
      c.globalAlpha = 0.85 * alpha
      c.drawImage(colouredMask(sp.mask, col), x + dx * scale, y, sp.w * scale, sp.h * scale)
    }
  }
  c.restore()
  if (shine !== null && shine >= 0 && shine <= 1) drawShine(c, sp.mask, x, y, scale, shine, alpha)
}

/** a line of text with alpha, used for the quiet labels and descriptions */
export function putText(c: Ctx, s: string, x: number, base: number, kind: FontKind, size: number, col: RGB, a = 1, opts: { w?: number; ls?: number; anchor?: Anchor; bold?: boolean } = {}): void {
  if (a <= 0.01) return
  const { w = 500, ls = 0, anchor = 'l' } = opts
  c.save()
  c.globalAlpha = clamp01(a)
  drawText(c, s, x, base, kind === 'px' ? PXF(size, w) : SILF(size, opts.bold ?? w >= 500), col, ls, anchor)
  c.restore()
}

/**
 * Letter-by-letter pop-in title (world names, MINITUDE). Each letter springs in with a white-hot flash;
 * the whole word has an outline, a glow, and an optional light sweep.
 */
const letterCache = new Map<string, { body: HTMLCanvasElement; glow: HTMLCanvasElement; mask: HTMLCanvasElement; x0: number; y0: number }>()
export function letters(c: Ctx, s: string, size: number, w: number, ls: number, cx: number, base: number, tau: number, d0: number, step: number,
  top: RGB, bot: RGB, outline: RGB, glowCol: RGB, opts: { pop?: number; glow?: number; shineAt?: number | null; depth?: number; depthCol?: RGB | null; alpha?: number } = {}): void {
  const { pop = 1.2, glow = 0.7, shineAt = null, depth = 0, depthCol = null, alpha = 1 } = opts
  if (alpha <= 0.01) return
  const font = PXF(size, w)
  const advs = [...s].map((ch) => adv(font, ch) + ls)
  const total = advs.reduce((a, b) => a + b, 0) - ls
  const x0 = cx - total / 2
  const pad = 40
  const cw = Math.ceil(total + pad * 2), chh = Math.ceil(size * 1.7 + pad)
  const bx = pad, by = Math.round(size * 1.15 + pad / 2)
  const chars = [...s]
  const settled = tau - d0 - (chars.length - 1) * step > 0.5
  const qls = Math.round(ls * 2) / 2
  const key = [s, size, w, qls, top, bot, outline, glowCol, depth, depthCol].join('|')
  let cached = settled ? letterCache.get(key) : undefined
  let bodyCv: HTMLCanvasElement, glowCv: HTMLCanvasElement, maskCv: HTMLCanvasElement
  let heatCv: HTMLCanvasElement | null = null
  if (cached) {
    bodyCv = cached.body; glowCv = cached.glow; maskCv = cached.mask
  } else {
    const A = mkCanvas(cw, chh), Hc = mkCanvas(cw, chh)
    const ac = ctxOf(A), hc = ctxOf(Hc)
    let xx = 0
    let anyHeat = false
    chars.forEach((chh_, k) => {
      const tl = tau - d0 - k * step
      const a = advs[k]
      if (tl > 0 && chh_ !== ' ') {
        const q = clamp01(tl / 0.28)
        const eo = 1 - (1 - q) ** 3
        const sc = 1 + pop * (1 - eo)
        const al = clamp01(tl / 0.07)
        const gw = adv(font, chh_)
        const gcx = bx + xx + gw / 2
        const gcy = by - size * 0.35 + (1 - eo) * -14
        const heat = Math.max(0, 1 - tl / 0.45)
        for (const [cc, amt] of [[ac, al], [hc, al * heat]] as [Ctx, number][]) {
          if (amt <= 0.003) continue
          cc.save()
          cc.globalAlpha = clamp01(amt)
          cc.translate(gcx, gcy + size * 0.35)
          cc.scale(sc, sc)
          cc.font = font
          cc.textBaseline = 'alphabetic'
          cc.fillStyle = '#fff'
          cc.fillText(chh_, -gw / 2, 0)
          cc.restore()
          if (cc === hc && amt > 0.02) anyHeat = true
        }
      }
      xx += a
    })
    maskCv = A
    if (!anyHeat) heatCv = null
    else heatCv = Hc
    const kk = Math.max(3, Math.trunc(size / 22))
    const dil = dilate(A, kk)
    bodyCv = mkCanvas(cw, chh)
    const bc = ctxOf(bodyCv)
    if (depth) {
      bc.globalAlpha = 0.9
      bc.drawImage(colouredMask(dil, depthCol ?? [0, 0, 0]), depth, depth)
      bc.globalAlpha = 1
    }
    bc.drawImage(colouredMask(dil, outline), 0, 0)
    bc.drawImage(colouredMask(A, [top, bot]), 0, 0)
    glowCv = mkCanvas(cw, chh)
    if (glow > 0) blurInto(ctxOf(glowCv), colouredMask(dilate(A, 2), glowCol), Math.max(6, size / 7))
    if (settled) {
      if (letterCache.size > 40) letterCache.clear()
      letterCache.set(key, { body: bodyCv, glow: glowCv, mask: maskCv, x0, y0: base - by })
    }
  }
  const X0 = Math.trunc(x0 - bx), Y0 = Math.trunc(base - by)
  c.save()
  c.imageSmoothingEnabled = true
  if (glow > 0) {
    c.globalCompositeOperation = 'lighter'
    c.globalAlpha = clamp01(glow * alpha) * 0.9
    c.drawImage(glowCv, X0, Y0)
    c.globalCompositeOperation = 'source-over'
  }
  c.globalAlpha = clamp01(alpha)
  c.drawImage(bodyCv, X0, Y0)
  if (heatCv) {
    c.globalCompositeOperation = 'lighter'
    c.globalAlpha = 0.95 * alpha
    c.drawImage(heatCv, X0, Y0)
  }
  c.restore()
  if (shineAt !== null && shineAt >= 0 && shineAt <= 1) {
    const wd = maskCv.width
    const pos = -0.2 * wd + shineAt * 1.4 * wd
    const hw = 0.06 * wd
    const t = mkCanvas(wd, maskCv.height)
    const tc = ctxOf(t)
    const m = (2 * hw) / (1 + 0.3025)
    const g = tc.createLinearGradient(pos - hw, 0, pos - hw + m, m * 0.55)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(0.5, 'rgba(255,255,255,1)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    tc.fillStyle = g
    tc.fillRect(0, 0, wd, maskCv.height)
    tc.globalCompositeOperation = 'destination-in'
    tc.drawImage(maskCv, 0, 0)
    c.save()
    c.globalCompositeOperation = 'lighter'
    c.globalAlpha = 0.8 * alpha
    c.drawImage(t, X0, Y0)
    c.restore()
  }
}

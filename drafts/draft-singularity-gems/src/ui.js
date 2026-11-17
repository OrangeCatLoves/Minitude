/* Drawing toolkit for the prototype: the game's own pixel fonts, glowing and gradient text, light rays, stars.
 * It imitates the look of packages/web/src/draw.ts + ui.ts (same fonts, same off-white / soft-blue text colours). */
(function () {
  'use strict'
  const W = 1280, H = 720
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
  const clamp01 = (v) => clamp(v, 0, 1)
  const lerp = (a, b, t) => a + (b - a) * t
  const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t) }
  const easeOut = (t) => 1 - Math.pow(1 - clamp01(t), 3)
  const easeInOut = (t) => { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }
  const backOut = (t, s = 1.7) => { t = clamp01(t) - 1; return t * t * ((s + 1) * t + s) + 1 }
  const rgb = (c, a = 1) => (a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`)
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
  const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

  // the game's palette (packages/web/src/config.ts)
  const COL = { INK: [7, 11, 23], OFF: [238, 242, 255], SOFT: [163, 176, 214], FAINT: [84, 98, 140], LINE: [110, 124, 170], OKG: [141, 255, 180], CYAN: [91, 224, 255], AMBER: [255, 200, 87] }

  // ------------------------------------------------------------------ fonts
  async function loadFonts() {
    const A = window.ASSETS.fonts, fams = [['Silkscreen', '400'], ['Silkscreen', '700'], ['PixelifyFix', '400'], ['PixelifyFix', '500'], ['PixelifyFix', '600'], ['PixelifyFix', '700']]
    for (const [fam, w] of fams) {
      const bin = atob(A[fam + '-' + w]), buf = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
      const f = new FontFace(fam, buf.buffer, { weight: w }); await f.load(); document.fonts.add(f)
    }
  }
  const PX = (size, w = 500) => `${w} ${size}px PixelifyFix, monospace`
  const SIL = (size, bold = true) => `${bold ? 700 : 400} ${size}px Silkscreen, monospace`

  // ------------------------------------------------------------------ text
  function stext(c, txt, x, y, font, color, shadow = 2, align = 'left', alpha = 1) {
    c.save(); c.font = font; c.textAlign = align; c.textBaseline = 'alphabetic'; c.globalAlpha *= alpha
    if (shadow) { c.fillStyle = 'rgba(3,5,12,0.85)'; c.fillText(txt, x + shadow, y + shadow) }
    c.fillStyle = rgb(color); c.fillText(txt, x, y); c.restore()
  }
  const textWidth = (c, font, txt, ls = 0) => { c.save(); c.font = font; const w = c.measureText(txt).width + ls * Math.max(0, txt.length - 1); c.restore(); return w }
  function wrap(c, font, txt, maxW) {
    c.save(); c.font = font; const words = txt.split(' '), lines = []; let cur = ''
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w } else cur = t }
    if (cur) lines.push(cur); c.restore(); return lines
  }
  /** the big gradient title with outline and glow, like the game's MYTHIC! card. top/bottom are the gradient colours (or functions of x). */
  function bigTitle(c, txt, size, cx, baseY, scale, top, bottom, outline, glow, o = {}) {
    const ls = o.ls ?? 3, w = o.w ?? 700, font = PX(size, w)
    c.save(); c.font = font; c.textBaseline = 'alphabetic'; c.textAlign = 'left'
    const widths = [...txt].map((ch) => c.measureText(ch).width + ls), total = widths.reduce((a, b) => a + b, 0) - ls
    c.translate(cx, baseY); c.scale(scale, scale); c.globalAlpha *= o.alpha ?? 1
    const x0 = -total / 2, draw = (dx, fill, stroke, blur, glowCol) => {
      let x = x0 + dx
      ;[...txt].forEach((ch, i) => {
        const gx = x + widths[i] / 2, col = typeof fill === 'function' ? fill(gx, i) : fill
        if (stroke) { c.lineJoin = 'round'; c.lineWidth = Math.max(4, size * 0.13); c.strokeStyle = rgb(typeof stroke === 'function' ? stroke(gx, i) : stroke); c.strokeText(ch, x, 0) }
        if (blur) { c.shadowColor = rgb(glowCol, 0.9); c.shadowBlur = blur } else { c.shadowBlur = 0 }
        const g = c.createLinearGradient(0, -size * 0.8, 0, size * 0.1)
        g.addColorStop(0, rgb(col[0])); g.addColorStop(1, rgb(col[1])); c.fillStyle = g; c.fillText(ch, x, 0); c.shadowBlur = 0
        x += widths[i]
      })
    }
    const pair = (t, b) => (typeof t === 'function' ? (gx, i) => [t(gx, i), b(gx, i)] : [t, b])
    const fillFn = typeof top === 'function' ? (gx, i) => [top(gx, i), bottom(gx, i)] : [top, bottom]
    if (o.split) { c.globalAlpha *= 0.7; draw(-o.split, () => [[80, 240, 255], [60, 200, 255]], null, 0); draw(o.split, () => [[255, 80, 200], [220, 60, 170]], null, 0); c.globalAlpha /= 0.7 }
    draw(0, fillFn, outline, (o.glow ?? 0.7) * 38, glow)
    if (o.shine != null) {
      // a white band sweeps across the letters
      const sx = lerp(-total * 0.7, total * 0.7, o.shine)
      c.globalCompositeOperation = 'source-atop'
      const g = c.createLinearGradient(sx - 40, -size, sx + 40, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)')
      c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(-total, -size, total * 2, size * 1.2)
    }
    c.restore()
  }

  // ------------------------------------------------------------------ light
  function radialAdd(c, x, y, r, col, a, pow = 1.6) {
    if (a <= 0.003 || r <= 1) return
    c.save(); c.globalCompositeOperation = 'lighter'
    const g = c.createRadialGradient(x, y, 0, x, y, r)
    const n = 8; for (let i = 0; i <= n; i++) { const t = i / n; g.addColorStop(t, rgb(col, a * Math.pow(1 - t, pow))) }
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore()
  }
  function rays(c, cx, cy, n, len, rot, colFn, a) {
    if (a <= 0.003) return
    c.save(); c.globalCompositeOperation = 'lighter'; c.translate(cx, cy); c.rotate(rot)
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2, w = (Math.PI * 2 / n) * 0.22
      const g = c.createRadialGradient(0, 0, 10, 0, 0, len); g.addColorStop(0, rgb(colFn(i), a)); g.addColorStop(1, rgb(colFn(i), 0))
      c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, len, ang - w, ang + w); c.closePath(); c.fill()
    }
    c.restore()
  }
  function sparkle(c, x, y, size, col, a) {
    if (a <= 0.01 || size < 1) return
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.fillStyle = rgb(col)
    const px = Math.max(1, Math.round(size / 8)), L = Math.round(size)
    c.fillRect(Math.round(x - L), Math.round(y - px / 2), L * 2, px); c.fillRect(Math.round(x - px / 2), Math.round(y - L), px, L * 2)
    c.fillStyle = 'rgb(255,255,255)'; c.fillRect(Math.round(x - L / 2), Math.round(y - px / 2), L, px); c.fillRect(Math.round(x - px / 2), Math.round(y - L / 2), px, L)
    c.restore()
  }
  function vignette(c, k, col = [2, 3, 10]) {
    if (k <= 0.004) return
    const g = c.createRadialGradient(W / 2, H * 0.46, H * 0.18, W / 2, H * 0.46, H * 0.95)
    g.addColorStop(0, rgb(col, 0)); g.addColorStop(1, rgb(col, clamp01(k))); c.fillStyle = g; c.fillRect(0, 0, W, H)
  }
  /** the iridescent colour used for SINGULARITY: a slow oil-slick cycle between violet, cyan, pink and gold */
  const prism = (t, phase = 0, l = 70) => { const h = ((t * 42 + phase) % 360 + 360) % 360; return window.Gem.hsl(h, 88, l) }
  const rect = (c, x, y, w, h, col, a = 1) => { c.save(); c.globalAlpha *= a; c.fillStyle = rgb(col); c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); c.restore() }

  // ------------------------------------------------------------------ the starfield that sits behind everything
  const stars = (() => { const r = mulberry(5); return Array.from({ length: 140 }, () => ({ x: r() * W, y: r() * H, z: 0.3 + r() * 0.7, s: r() < 0.08 ? 2 : 1, p: r() * 6.28 })) })()
  function backdrop(c, t, dim = 0) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#070b17'); g.addColorStop(1, '#0c1431'); c.fillStyle = g; c.fillRect(0, 0, W, H)
    c.save()
    for (const s of stars) { const a = (0.25 + 0.35 * Math.sin(t * 0.8 + s.p)) * s.z * (1 - dim); c.fillStyle = `rgba(190,205,255,${clamp01(a)})`; c.fillRect(Math.round((s.x + t * 4 * s.z) % W), Math.round(s.y), s.s, s.s) }
    c.restore()
  }

  window.UI = { W, H, clamp, clamp01, lerp, smooth, easeOut, easeInOut, backOut, rgb, mix, mulberry, COL, loadFonts, PX, SIL, stext, textWidth, wrap, bigTitle, radialAdd, rays, sparkle, vignette, prism, rect, backdrop }
})()

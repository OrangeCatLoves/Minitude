/* SINGULARITY GEMS, version 4: RAINBOW. 12 designs x 3 rainbow tones, in the hand of the game's six agreed tier icons (Common to Mythic).
 *
 * What stays the same as those icons (measured from packages/web/public/assets/gem0..5.png):
 *   32 x 32 pixels, no anti-aliasing, ONE shared near-black outline (18,10,30), flat blocks with hard stair-stepped edges,
 *   light from the top left, no gloss, no gradient, no glow.
 * What changes: the agreed icons are one hue in four shades. A rainbow needs several hues, so every design is built from a SLOT (one of
 * seven spectrum hues: red, orange, yellow, green, cyan, blue, violet) and a TONE (0 lightest .. 3 deepest). A "rainbow tone" (palette)
 * just says which actual colours the seven slots are, so one drawing comes in several rainbows.
 *
 * Versions 1 to 3 (pie slices, glossy jewels, one-hue pixel gems) were scrapped by the owner.
 */
(function () {
  'use strict'
  const N = 32
  const OUT = [18, 10, 30], WHITE = [255, 255, 255]
  const O = 100, W = 101                 // grid values: 0..27 = slot*4 + tone, O = outline, W = white spark, -1 = empty
  const C = (s, t) => s * 4 + t

  function hsl(h, s, l) { h = ((h % 360) + 360) % 360; s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)] }

  // ------------------------------------------------------------------ the rainbow tones (seven hues x four tones each)
  const PALETTES = [
    { id: 'spectrum', name: 'Spectrum', hues: [355, 26, 52, 128, 184, 222, 282], tones: [[84, 100], [58, 92], [38, 80], [22, 70]], base: [96, 206, 255], light: [255, 238, 160] },
    { id: 'opal', name: 'Opal', hues: [350, 24, 48, 140, 188, 226, 288], tones: [[92, 85], [78, 75], [62, 55], [46, 45]], base: [206, 226, 255], light: [255, 255, 255] },
    { id: 'twilight', name: 'Twilight', hues: [342, 16, 42, 152, 192, 240, 294], tones: [[76, 90], [52, 82], [34, 74], [20, 64]], base: [150, 124, 255], light: [214, 200, 255] },
  ].map((p) => ({ ...p, ramps: p.hues.map((h) => p.tones.map(([l, s]) => hsl(h, s, l))) }))
  const LOCK = [[56, 66, 110], [44, 54, 94], [34, 42, 78], [24, 30, 58]]   // the dark silhouette of a gem not found yet

  // ------------------------------------------------------------------ drawing into the grid
  const mk = () => new Int8Array(N * N).fill(-1)
  function inPoly(p, x, y) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c }
  const poly = (g, v, pts) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (inPoly(pts, x + 0.5, y + 0.5)) g[y * N + x] = v }
  const each = (g, fn) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const v = fn(x + 0.5, y + 0.5, x, y); if (v != null && v >= 0) g[y * N + x] = v } }
  const set = (g, x, y, v) => { if (x >= 0 && y >= 0 && x < N && y < N) g[y * N + x] = v }
  function line(g, x0, y0, x1, y1, v) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (;;) { set(g, x0, y0, v); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx } if (e2 <= dx) { e += dx; y0 += sy } } }
  const stroke = (g, pts, v) => pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; line(g, p[0], p[1], q[0], q[1], v) })
  const toward = (c, p, k) => [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]
  const LIGHT = [-0.62, -0.78]
  const lit = (dx, dy) => { const l = Math.hypot(dx, dy) || 1; return (dx / l) * LIGHT[0] + (dy / l) * LIGHT[1] }   // 1 = facing the light, -1 = away

  // ------------------------------------------------------------------ the 12 designs
  const DESIGNS = [
    { name: 'Prism', vibe: 'a glass prism splitting a ray of light', build(g) {
      const A = [13, 3], B = [3, 25], Cc = [23, 25], G0 = [13, 17.5]
      poly(g, C(4, 0), [A, B, G0]); poly(g, C(4, 1), [A, Cc, G0]); poly(g, C(4, 2), [B, Cc, G0])
      const S = [18.5, 14]; for (let i = 0; i < 7; i++) poly(g, C(i, 1), [S, [31, 2 + 3.7 * i], [31, 2 + 3.7 * (i + 1)]])
      line(g, 0, 19, 8, 16, W); line(g, 0, 20, 8, 17, W)
      stroke(g, [A, B, Cc], O) } },
    { name: 'Opal', vibe: 'a milky stone with patches of every colour', build(g) {
      const cx = 16, cy = 16.5, rx = 13.5, ry = 10
      each(g, (x, y) => { const u = (x - cx) / rx, v = (y - cy) / ry, d = u * u + v * v; if (d > 1) return -1; return C(4, d > 0.6 && u * 0.6 + v * 0.8 > 0.1 ? 2 : 0) })
      const blobs = [[9, 14, 3.4, 2.4, 0], [14, 11.5, 3.2, 2.2, 1], [19.5, 13, 3.6, 2.5, 2], [24.5, 15.5, 2.8, 2.2, 3], [12, 19.5, 3.6, 2.4, 5], [18.5, 19.5, 3.4, 2.2, 6], [23.5, 20.5, 2.5, 1.8, 4], [7, 18.5, 2.2, 1.8, 6], [16, 15.5, 2.6, 1.8, 3]]
      blobs.forEach(([bx, by, brx, bry, s]) => each(g, (x, y) => { const d = ((x - bx) / (brx * 1.25)) ** 2 + ((y - by) / (bry * 1.25)) ** 2; if (d > 1) return -1; const u = (x - cx) / rx, v = (y - cy) / ry; if (u * u + v * v > 0.86) return -1; return C(s, u * 0.6 + v * 0.8 > 0.25 ? 2 : 1) }))
      blobs.forEach(([bx, by, brx, bry, s]) => each(g, (x, y) => (((x - (bx - 0.8)) / (brx * 0.5)) ** 2 + ((y - (by - 0.7)) / (bry * 0.5)) ** 2 <= 1 ? C(s, 0) : -1)))
      set(g, 7, 10, W); set(g, 8, 9, W); set(g, 10, 8, W); set(g, 9, 9, W) } },
    { name: 'Spectrum Wheel', vibe: 'a round cut with a wedge for every colour', build(g) {
      const cx = 15.5, cy = 15.5, R = 13.4
      each(g, (x, y) => { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy); if (d > R) return -1; if (d < 3.6) return C(2, 0); const a = (Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2), s = Math.floor(a * 7) % 7; const t = d < 8.8 ? 0 : d < R - 2.4 ? 1 : 2; return C(s, Math.min(3, t + (lit(dx, dy) < -0.4 ? 1 : 0))) })
      for (let k = 0; k < 7; k++) { const a = -Math.PI + (k * Math.PI * 2) / 7; line(g, cx + Math.cos(a) * 3.6, cy + Math.sin(a) * 3.6, cx + Math.cos(a) * R, cy + Math.sin(a) * R, O) }
      set(g, 14, 14, W); set(g, 15, 13, W) } },
    { name: 'Banded Kite', vibe: 'a tall stone striped in every colour', build(g) {
      const pts = [[16, 2], [26, 15], [16, 30], [6, 15]]
      each(g, (x, y) => { if (!inPoly(pts, x, y)) return -1; const s = Math.min(6, Math.floor((y - 2) / 4)); return C(s, x < 16 ? 0 : x < 20 ? 1 : 2) })
      line(g, 16, 3, 16, 29, O); set(g, 11, 9, W); set(g, 12, 8, W) } },
    { name: 'Fan', vibe: 'seven shards fanned out like a peacock', build(g) {
      const P0 = [16, 28.5]
      const order = [0, 6, 1, 5, 2, 4, 3]   // draw the outer shards first so the middle ones lie on top
      order.forEach((i) => {
        const a = ((-72 + i * 24) * Math.PI) / 180, dir = [Math.sin(a), -Math.cos(a)], perp = [Math.cos(a), Math.sin(a)], len = 24.5, wd = 3.2
        const mid = [P0[0] + dir[0] * len * 0.55, P0[1] + dir[1] * len * 0.55], tip = [P0[0] + dir[0] * len, P0[1] + dir[1] * len]
        poly(g, C(i, 0), [P0, [mid[0] - perp[0] * wd, mid[1] - perp[1] * wd], tip])
        poly(g, C(i, 2), [P0, [mid[0] + perp[0] * wd, mid[1] + perp[1] * wd], tip]) })
      each(g, (x, y) => (Math.hypot(x - 16, y - 29) <= 3.4 ? C(2, 2) : -1)); set(g, 15, 27, W) } },
    { name: 'Bubble', vibe: 'a soap bubble with slow colour bands', build(g) {
      const cx = 15.5, cy = 15.5, R = 12.6
      each(g, (x, y) => { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy); if (d > R) return -1; const s = ((Math.floor((dx - dy + 60) / 4.4) % 7) + 7) % 7; return C(s, d > R - 2.2 ? (lit(dx, dy) > 0 ? 1 : 3) : d > R - 5 ? (lit(dx, dy) > 0 ? 0 : 2) : 0) })
      ;[[9, 7], [10, 6], [11, 5], [8, 8], [7, 10], [7, 11]].forEach(([x, y]) => set(g, x, y, W)); set(g, 12, 10, W); set(g, 13, 9, W) } },
    { name: 'Cube', vibe: 'an isometric block, each face a different colour', build(g) {
      const T = [16, 3], R = [28, 10], B = [16, 30], L = [4, 10], M = [16, 16.5]
      poly(g, C(2, 0), [T, L, M]); poly(g, C(3, 0), [T, R, M])
      poly(g, C(0, 1), [L, M, [16, 23.3], [4, 16.5]]); poly(g, C(1, 1), [[4, 16.5], [16, 23.3], [16, 30], [4, 23]])
      poly(g, C(4, 2), [R, M, [16, 23.3], [28, 16.5]]); poly(g, C(5, 2), [[28, 16.5], [16, 23.3], [16, 30], [28, 23]])
      stroke(g, [L, M, R], O); line(g, 16, 17, 16, 29, O); set(g, 9, 7, W); set(g, 8, 8, W) } },
    { name: 'Arch', vibe: 'a faceted rainbow, cut like a half-moon', build(g) {
      const cx = 15.5, cy = 24.5, R = 15.4, r0 = 4.8, slots = [0, 1, 2, 3, 5, 6]
      each(g, (x, y) => { if (y > cy + 0.5) return -1; const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy); if (d > R || d < r0) return -1; const band = Math.min(5, Math.floor((R - d) / ((R - r0) / 6))), a = Math.atan2(dy, dx) + Math.PI, f = Math.min(2, Math.floor(a / (Math.PI / 3))); return C(slots[band], f) })
      for (let k = 1; k < 3; k++) { const a = Math.PI + (k * Math.PI) / 3; line(g, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * R, cy + Math.sin(a) * R, O) }
      set(g, 6, 14, W); set(g, 8, 11, W) } },
    { name: 'Kaleidoscope', vibe: 'a square cut that turns like a pinwheel', build(g) {
      const T = [16, 2], R = [29, 15.5], B = [16, 29], L = [3, 15.5], c = [16, 15.5], i = [T, R, B, L].map((p) => toward(c, p, 0.46))
      poly(g, C(2, 1), [T, R, i[1], i[0]]); poly(g, C(4, 1), [R, B, i[2], i[1]]); poly(g, C(6, 2), [B, L, i[3], i[2]]); poly(g, C(0, 1), [L, T, i[0], i[3]])
      poly(g, C(1, 0), [i[0], i[1], c]); poly(g, C(3, 0), [i[1], i[2], c]); poly(g, C(5, 1), [i[2], i[3], c]); poly(g, C(0, 0), [i[3], i[0], c])
      stroke(g, i, O); line(g, 16, 2, 16, 8, O); line(g, 29, 15, 23, 15, O); line(g, 16, 29, 16, 23, O); line(g, 3, 15, 9, 15, O) } },
    { name: 'Marquise', vibe: 'a leaf-shaped stone, one colour after another', build(g) {
      each(g, (x, y) => { const u = (x - 16) / 14.2; if (Math.abs(u) > 1) return -1; const h = 10 * (1 - Math.pow(Math.abs(u), 1.7)); if (Math.abs(y - 16) > h) return -1; const s = Math.min(6, Math.floor((x - 2) / 4)); return C(s, y < 16 ? 0 : 2) })
      line(g, 3, 16, 29, 16, O); set(g, 9, 11, W); set(g, 10, 10, W) } },
    { name: 'Halo', vibe: 'a pale heart with a ring of colour round it', build(g) {
      const cx = 15.5, cy = 15.5
      each(g, (x, y) => { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy); if (d > 13.4 || d < 9.2) return -1; const a = (Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2), s = Math.floor(a * 7) % 7; return C(s, d < 10.6 ? 0 : d > 11.8 ? 2 : 1) })
      poly(g, C(2, 0), [[15.5, 8.6], [22.4, 15.5], [15.5, 22.4], [8.6, 15.5]]); poly(g, C(1, 1), [[15.5, 15.5], [22.4, 15.5], [15.5, 22.4]]); poly(g, C(2, 0), [[15.5, 8.6], [15.5, 15.5], [8.6, 15.5]])
      set(g, 13, 13, W); set(g, 14, 12, W) } },
    { name: 'Hexagon', vibe: 'a six-sided cut with a colour on every face', build(g) {
      const V = [[8, 4], [24, 4], [30, 16], [24, 28], [8, 28], [2, 16]], c = [16, 16], slots = [0, 1, 2, 3, 5, 6], tones = [0, 1, 2, 2, 2, 1]
      V.forEach((p, i) => poly(g, C(slots[i], tones[i]), [c, p, V[(i + 1) % 6]]))
      poly(g, C(2, 0), V.map((p) => toward(c, p, 0.4)))
      V.forEach((p) => line(g, c[0] + (p[0] - c[0]) * 0.4, c[1] + (p[1] - c[1]) * 0.4, p[0], p[1], O)); stroke(g, V.map((p) => toward(c, p, 0.4)), O); set(g, 14, 14, W) } },
  ]

  // ------------------------------------------------------------------ rendering a design in a rainbow tone
  const GRID = new Map(), SPR = new Map()
  function gridOf(d) {
    if (GRID.has(d)) return GRID.get(d)
    const g = mk(), opt = DESIGNS[d].build(g) || {}, o = Array.from(g)
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (g[y * N + x] >= 0) continue; for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) if (nx >= 0 && ny >= 0 && nx < N && ny < N && g[ny * N + nx] >= 0 && g[ny * N + nx] !== W) { o[y * N + x] = O; break } }
    GRID.set(d, o); return o
  }
  function sprite(d, c, dim) {
    if (!DESIGNS[d]) d = 0
    const key = d + ':' + c + ':' + (dim ? 1 : 0)
    if (SPR.has(key)) return SPR.get(key)
    const g = gridOf(d), pal = PALETTES[c], cv = document.createElement('canvas'); cv.width = cv.height = N
    const ctx = cv.getContext('2d'), img = ctx.createImageData(N, N)
    for (let i = 0; i < N * N; i++) {
      const v = g[i]; if (v < 0) continue; if (dim && v === W) continue
      const col = v === O ? OUT : v === W ? WHITE : dim ? LOCK[v % 4] : pal.ramps[Math.floor(v / 4)][v % 4]
      img.data[i * 4] = col[0]; img.data[i * 4 + 1] = col[1]; img.data[i * 4 + 2] = col[2]; img.data[i * 4 + 3] = 255
    }
    ctx.putImageData(img, 0, 0); SPR.set(key, cv); return cv
  }

  // ------------------------------------------------------------------ the owner's choice (kept in this browser only)
  const KEY = 'singularity-gem-choice-v5'
  const CHOSEN = { d: 22, c: 2 }   // the owner's choice, 14 Nov 2026: 23 Crescent, tone Twilight, for all 200 questions
  const sel = { d: CHOSEN.d, c: CHOSEN.c }
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.d >= 0 && s.d < 500 && s.c >= 0 && s.c < PALETTES.length) { sel.d = s.d; sel.c = s.c } } catch (e) { /* none */ }
  const select = (d, c) => { sel.d = d; sel.c = c; try { localStorage.setItem(KEY, JSON.stringify(sel)) } catch (e) { /* ignore */ } }

  /** draw the chosen gem (or opts.design / opts.colour) scaled up with smoothing off, like the game's own icons */
  function draw(c, _cat, x, y, size, opts) {
    const o = opts || {}, cv = sprite(o.design ?? sel.d, o.colour ?? sel.c, !!o.dim)
    c.save(); c.imageSmoothingEnabled = false; c.drawImage(cv, Math.round(x - size / 2), Math.round(y - size / 2), Math.round(size), Math.round(size)); c.restore()
  }
  const CATEGORIES = ['Animals & Nature', 'Food', 'Games', 'History & Mythology', 'Places', 'Science & Technology', 'Movies & TV', 'Music', 'Sports', 'Transport & Vehicles', 'Miscellaneous'].map((name, i) => ({ name, i }))
  const kit = { N, C, O, W, mk, poly, each, set, line, stroke, toward, lit, inPoly }   // the drawing tools, so more designs can live in src/designs2.js
  window.Gem = { kit,
    CATEGORIES, byCategory: (name) => CATEGORIES.find((c) => c.name === name) || CATEGORIES[10], DESIGNS, COLOURS: PALETTES, sel, select, sprite, draw, hsl, N,
    baseRgb: (c) => PALETTES[c ?? sel.c].base, lightRgb: (c) => PALETTES[c ?? sel.c].light, outline: OUT,
    describe: (d, c) => { d = d ?? sel.d; if (!DESIGNS[d]) d = 0; c = c ?? sel.c; return `Design ${d + 1} · ${DESIGNS[d].name} · ${PALETTES[c].name}` },
  }
})()

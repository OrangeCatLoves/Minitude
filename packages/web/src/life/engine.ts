// @ts-nocheck
/* The motion engine of the living worlds: carried over as it was reviewed (plain JavaScript, so it is not type-checked; test/life.test.ts
 * compares every world's frames with the reviewed ones).
 *
 * Everything works on the world picture at its own size, 320 x 180 pixels, with whole-pixel moves only, so the pixel art stays crisp and the
 * living picture can be used as a texture and zoom like the still one.
 *
 * A picture is a World: `base` (the original, never changed), `cur` (the working background, where lifted objects have been cut out)
 * and `out` (the frame being drawn). Every frame is a pure function of the time t:  begin() copies cur to out, then the effects draw on out.
 *
 * The tools:  lift / liftAll / liftGroups + drawSprite...   cut an object out of the picture and draw it somewhere else (drift, bob, wave)
 *             warp / warpRows / warpCols                    move a region's pixels by an amount that depends on the place
 *             add / mul / blend / wash / glow / plus / ring light: brightening, soft glows, sparkles
 * (rotate, radialMap and the scroll functions are kept but no world uses them: resampling fine pixel patterns makes them crawl.)
 */
const W = 320, H = 180
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)
const mod = (a, n) => ((a % n) + n) % n
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b
/** small deterministic random numbers */
function rngf(seed) {
  let a = seed | 0
  return function () { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16)

class World {
  /** slot: which picture; data: its pixels (RGBA, 320 x 180); out: the buffer frames are drawn into (may be shared between pictures) */
  constructor(slot, data, out) {
    this.slot = slot
    this.base = new Uint8ClampedArray(data)
    this.cur = new Uint8ClampedArray(data)
    this.out = out || new Uint8ClampedArray(data)
    this.taken = new Uint8Array(W * H)   // pixels already cut out by an earlier lift (a later lift must not pick them up again)
    this.v = { x: 0, y: 0 }
  }
  begin() { this.out.set(this.cur) }
  /** the colour of the working background (not the frame) at x, y */
  c(x, y) { x = clamp(x | 0, 0, W - 1); y = clamp(y | 0, 0, H - 1); const i = (y * W + x) * 4; return [this.cur[i], this.cur[i + 1], this.cur[i + 2]] }
  px(x, y, r, g, b) { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; this.out[i] = r; this.out[i + 1] = g; this.out[i + 2] = b }
  /** mix a colour over the frame pixel (a = 0..1) */
  blend(x, y, r, g, b, a) {
    if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return
    const i = (y * W + x) * 4, o = this.out
    o[i] += (r - o[i]) * a; o[i + 1] += (g - o[i + 1]) * a; o[i + 2] += (b - o[i + 2]) * a
  }
  /** light: add a colour times k to the frame pixel */
  add(x, y, r, g, b, k) {
    if (x < 0 || y < 0 || x >= W || y >= H || k <= 0) return
    const i = (y * W + x) * 4, o = this.out
    o[i] += r * k; o[i + 1] += g * k; o[i + 2] += b * k
  }
  /** multiply the frame pixel's brightness */
  mul(x, y, k) { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4, o = this.out; o[i] *= k; o[i + 1] *= k; o[i + 2] *= k }

  // ---------------------------------------------------------------- moving the pixels of a region
  /** each row of the region is shifted sideways by f(y) pixels (rounded) */
  warpRows(x0, y0, x1, y1, f) {
    const cur = this.cur, out = this.out
    for (let y = y0; y <= y1; y++) {
      const dx = Math.round(f(y)); if (!dx) continue
      for (let x = x0; x <= x1; x++) { const sx = clamp(x - dx, x0, x1), i = (y * W + x) * 4, j = (y * W + sx) * 4; out[i] = cur[j]; out[i + 1] = cur[j + 1]; out[i + 2] = cur[j + 2] }
    }
  }
  /** each column of the region is shifted up or down by f(x) pixels */
  warpCols(x0, y0, x1, y1, f) {
    const cur = this.cur, out = this.out
    for (let x = x0; x <= x1; x++) {
      const dy = Math.round(f(x)); if (!dy) continue
      for (let y = y0; y <= y1; y++) { const sy = clamp(y - dy, y0, y1), i = (y * W + x) * 4, j = (sy * W + x) * 4; out[i] = cur[j]; out[i + 1] = cur[j + 1]; out[i + 2] = cur[j + 2] }
    }
  }
  /** every pixel of the region takes its colour from (x - dx, y - dy), where f(x, y, v) sets v.x and v.y */
  warp(x0, y0, x1, y1, f) {
    const cur = this.cur, out = this.out, v = this.v
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      v.x = 0; v.y = 0; f(x, y, v)
      const dx = Math.round(v.x), dy = Math.round(v.y); if (!dx && !dy) continue
      const sx = clamp(x - dx, x0, x1), sy = clamp(y - dy, y0, y1), i = (y * W + x) * 4, j = (sy * W + sx) * 4
      out[i] = cur[j]; out[i + 1] = cur[j + 1]; out[i + 2] = cur[j + 2]
    }
  }
  /** slide a pattern that repeats every `period` pixels along x (the first `period` columns of the region are the tile) */
  scrollX(x0, y0, x1, y1, period, s) {
    const cur = this.cur, out = this.out, sh = Math.round(s)
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const sx = x0 + mod(x - x0 - sh, period), i = (y * W + x) * 4, j = (y * W + sx) * 4; out[i] = cur[j]; out[i + 1] = cur[j + 1]; out[i + 2] = cur[j + 2] }
  }
  scrollY(x0, y0, x1, y1, period, s) {
    const cur = this.cur, out = this.out, sh = Math.round(s)
    for (let y = y0; y <= y1; y++) { const sy = y0 + mod(y - y0 - sh, period); for (let x = x0; x <= x1; x++) { const i = (y * W + x) * 4, j = (sy * W + x) * 4; out[i] = cur[j]; out[i + 1] = cur[j + 1]; out[i + 2] = cur[j + 2] } }
  }
  /** turn the ring between radius r0 and r1 (squashed vertically by ry) by an angle, about (cx, cy) */
  rotate(cx, cy, r0, r1, ang, ry = 1, yMax = H - 1) {
    const cur = this.cur, out = this.out, ca = Math.cos(ang), sa = Math.sin(ang)
    const x0 = Math.max(0, Math.floor(cx - r1)), x1 = Math.min(W - 1, Math.ceil(cx + r1)), y0 = Math.max(0, Math.floor(cy - r1 * ry)), y1 = Math.min(yMax, Math.ceil(cy + r1 * ry))
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x - cx, dy = (y - cy) / ry, rho = Math.sqrt(dx * dx + dy * dy)
      if (rho < r0 || rho > r1) continue
      const sx = Math.round(cx + dx * ca + dy * sa), sy = Math.round(cy + (-dx * sa + dy * ca) * ry)
      if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue
      const i = (y * W + x) * 4, j = (sy * W + sx) * 4; out[i] = cur[j]; out[i + 1] = cur[j + 1]; out[i + 2] = cur[j + 2]
    }
  }
  /** every pixel at distance rho from (cx, cy) (vertical distances divided by ry) takes its colour from the distance f(rho) */
  radialMap(cx, cy, ry, rMax, f) {
    const cur = this.cur, out = this.out
    const x0 = Math.max(0, Math.floor(cx - rMax)), x1 = Math.min(W - 1, Math.ceil(cx + rMax)), y0 = Math.max(0, Math.floor(cy - rMax * ry)), y1 = Math.min(H - 1, Math.ceil(cy + rMax * ry))
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x - cx, dy = y - cy, rho = Math.sqrt(dx * dx + (dy / ry) * (dy / ry))
      if (rho < 1 || rho > rMax) continue
      const k = f(rho) / rho
      const sx = Math.round(cx + dx * k), sy = Math.round(cy + dy * k)
      if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue
      const i = (y * W + x) * 4, j = (sy * W + sx) * 4; out[i] = cur[j]; out[i + 1] = cur[j + 1]; out[i + 2] = cur[j + 2]
    }
  }

  // ---------------------------------------------------------------- objects: cut out, and draw somewhere else
  /**
   * Finds objects (groups of touching pixels for which pred(r, g, b, x, y) is true) inside the rectangle, cuts them out of the working
   * background (the hole is filled from the nearest background pixel on the same row) and returns them as sprites.
   * opts: rect [x0, y0, x1, y1], pred, minArea, maxArea, grow (extra pixels around each object, default 0)
   */
  lift(opts, noFill = false) {
    const [x0, y0, x1, y1] = opts.rect, pred = opts.pred, minA = opts.minArea ?? 1, maxA = opts.maxArea ?? 1e9, grow = opts.grow ?? 0
    const cur = this.base, taken = this.taken, seen = new Uint8Array(W * H), hole = new Uint8Array(W * H), sprites = []   // objects are found in, and take their colours from, the ORIGINAL picture
    const stack = []
    for (let sy = y0; sy <= y1; sy++) for (let sx = x0; sx <= x1; sx++) {
      const s = sy * W + sx
      if (seen[s] || taken[s]) continue
      const i = s * 4
      if (!pred(cur[i], cur[i + 1], cur[i + 2], sx, sy)) continue
      let pts = []
      stack.push(s); seen[s] = 1
      while (stack.length) {
        const p = stack.pop(), px = p % W, py = (p / W) | 0
        pts.push(px, py)
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx, ny = py + dy
          if (nx < x0 || nx > x1 || ny < y0 || ny > y1) continue
          const q = ny * W + nx
          if (seen[q] || taken[q]) continue
          const j = q * 4
          if (pred(cur[j], cur[j + 1], cur[j + 2], nx, ny)) { seen[q] = 1; stack.push(q) }
        }
      }
      const area = pts.length / 2
      if (area < minA || area > maxA) continue
      if (opts.keep) {
        let bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1
        for (let k = 0; k < pts.length; k += 2) { if (pts[k] < bx0) bx0 = pts[k]; if (pts[k] > bx1) bx1 = pts[k]; if (pts[k + 1] < by0) by0 = pts[k + 1]; if (pts[k + 1] > by1) by1 = pts[k + 1] }
        if (!opts.keep({ area, w: bx1 - bx0 + 1, h: by1 - by0 + 1 })) continue
      }
      // opts.fill: also take every pixel that is completely enclosed by the object (its highlight, its dark shading), so a ball moves as ONE piece
      if (opts.fill) {
        let fx0 = 1e9, fy0 = 1e9, fx1 = -1, fy1 = -1
        for (let k = 0; k < pts.length; k += 2) { if (pts[k] < fx0) fx0 = pts[k]; if (pts[k] > fx1) fx1 = pts[k]; if (pts[k + 1] < fy0) fy0 = pts[k + 1]; if (pts[k + 1] > fy1) fy1 = pts[k + 1] }
        const bw = fx1 - fx0 + 3, bh = fy1 - fy0 + 3, mem = new Uint8Array(bw * bh), reach = new Uint8Array(bw * bh), st = []
        for (let k = 0; k < pts.length; k += 2) mem[(pts[k + 1] - fy0 + 1) * bw + (pts[k] - fx0 + 1)] = 1
        const push = (cx, cy) => { if (cx < 0 || cy < 0 || cx >= bw || cy >= bh) return; const q = cy * bw + cx; if (mem[q] || reach[q]) return; reach[q] = 1; st.push(q) }
        for (let cx = 0; cx < bw; cx++) { push(cx, 0); push(cx, bh - 1) }
        for (let cy = 0; cy < bh; cy++) { push(0, cy); push(bw - 1, cy) }
        while (st.length) { const q = st.pop(), cx = q % bw, cy = (q / bw) | 0; push(cx + 1, cy); push(cx - 1, cy); push(cx, cy + 1); push(cx, cy - 1) }
        const add = []
        for (let cy = 1; cy < bh - 1; cy++) for (let cx = 1; cx < bw - 1; cx++) { const q = cy * bw + cx; if (!mem[q] && !reach[q]) { const px = cx - 1 + fx0, py = cy - 1 + fy0; if (!taken[py * W + px]) add.push(px, py) } }
        if (add.length) pts = pts.concat(add)
      }
      // grow the object a little (its soft edge) before cutting
      let all = pts
      if (grow > 0) {
        const set = new Set(); for (let k = 0; k < pts.length; k += 2) set.add(pts[k + 1] * W + pts[k])
        const extra = []
        for (let g = 0; g < grow; g++) {
          const keys = [...set]
          for (const p of keys) { const px = p % W, py = (p / W) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = px + dx, ny = py + dy, q = ny * W + nx; if (nx >= 0 && ny >= 0 && nx < W && ny < H && !set.has(q) && !taken[q]) { set.add(q); extra.push(nx, ny) } } }
        }
        all = pts.concat(extra)
      }
      const n = all.length / 2, xs = new Int16Array(n), ys = new Int16Array(n), cols = new Uint8Array(n * 3)
      let sxm = 0, sym = 0, bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1
      for (let k = 0; k < n; k++) {
        const px = all[k * 2], py = all[k * 2 + 1], i = (py * W + px) * 4
        xs[k] = px; ys[k] = py; cols[k * 3] = cur[i]; cols[k * 3 + 1] = cur[i + 1]; cols[k * 3 + 2] = cur[i + 2]
        hole[py * W + px] = 1; taken[py * W + px] = 1; sxm += px; sym += py
        if (px < bx0) bx0 = px; if (py < by0) by0 = py; if (px > bx1) bx1 = px; if (py > by1) by1 = py
      }
      sprites.push({ xs, ys, cols, n, cx: sxm / n, cy: sym / n, bbox: [bx0, by0, bx1, by1] })
    }
    if (!noFill) this.fillHoles(sprites)
    return sprites
  }
  /** fill the holes the given sprites left from the nearest background pixels on the same row (all of them together, so the neighbours really are background) */
  fillHoles(sprites) {
    if (!sprites.length) return
    const hole = new Uint8Array(W * H)
    for (const sp of sprites) for (let k = 0; k < sp.n; k++) hole[sp.ys[k] * W + sp.xs[k]] = 1

        const wcur = this.cur, src = new Uint8ClampedArray(wcur)
        for (const sp of sprites) for (let k = 0; k < sp.n; k++) {
          const px = sp.xs[k], py = sp.ys[k]
          let l = px, r = px
          while (l >= 0 && hole[py * W + l]) l--
          while (r < W && hole[py * W + r]) r++
          let from = -1
          const dl = px - l, dr = r - px
          if (l >= 0 && (r >= W || dl <= dr)) from = py * W + l
          else if (r < W) from = py * W + r
          if (from < 0 || Math.min(dl, dr) > 14) { let u = py, d = py; while (u >= 0 && hole[u * W + px]) u--; while (d < H && hole[d * W + px]) d++; from = (u >= 0 && (d >= H || py - u <= d - py)) ? u * W + px : (d < H ? d * W + px : py * W + px) }
          const i = (py * W + px) * 4, j = from * 4
          let er, eg, eb
          if (l >= 0 && r < W && dl <= 14 && dr <= 14) {   // background on both sides: blend by distance (a smooth estimate)
            const jl = (py * W + l) * 4, jr = (py * W + r) * 4, wl = dr / (dl + dr), wr = dl / (dl + dr)
            er = src[jl] * wl + src[jr] * wr; eg = src[jl + 1] * wl + src[jr + 1] * wr; eb = src[jl + 2] * wl + src[jr + 2] * wr
          } else { er = src[j]; eg = src[j + 1]; eb = src[j + 2] }
          // the ordered-dither patterns of the pictures repeat every 4 pixels: copy from 4, 8, 12 ... pixels sideways (same row) when that looks like the estimate, so the dither is kept
          let done = false
          const cand = []
        for (let m = 1; m <= 14; m++) { const xl = px - 4 * m; if (xl < 0) break; if (!hole[py * W + xl]) { cand.push(xl); break } }
        for (let m = 1; m <= 14; m++) { const xr = px + 4 * m; if (xr >= W) break; if (!hole[py * W + xr]) { cand.push(xr); break } }
        cand.sort((p, q) => Math.abs(p - px) - Math.abs(q - px))
        const haveEst = l >= 0 && r < W && dl <= 14 && dr <= 14
        for (const xx of cand) {
          const jv = (py * W + xx) * 4
          if (!haveEst || Math.abs(src[jv] - er) + Math.abs(src[jv + 1] - eg) + Math.abs(src[jv + 2] - eb) < 175) { wcur[i] = src[jv]; wcur[i + 1] = src[jv + 1]; wcur[i + 2] = src[jv + 2]; done = true; break }
        }
        if (!done) { wcur[i] = er; wcur[i + 1] = eg; wcur[i + 2] = eb }
        }
      
  }
  /** lift several groups at once (each is an options object for lift); the holes are filled together. Returns one list of sprites per group. */
  liftGroups(groups) {
    const all = groups.map((o) => this.lift(o, true))
    this.fillHoles(all.flat())
    return all
  }
  /** draw a lifted sprite moved by (dx, dy); `k` brightens (1 = as it was); `tint` mixes toward a colour */
  drawSprite(sp, dx, dy, k = 1, tint = null, mix = 0) {
    const o = this.out
    for (let n = 0; n < sp.n; n++) {
      const x = sp.xs[n] + dx, y = sp.ys[n] + dy
      if (x < 0 || y < 0 || x >= W || y >= H) continue
      let r = sp.cols[n * 3] * k, g = sp.cols[n * 3 + 1] * k, b = sp.cols[n * 3 + 2] * k
      if (tint && mix > 0) { r += (tint[0] - r) * mix; g += (tint[1] - g) * mix; b += (tint[2] - b) * mix }
      const i = (y * W + x) * 4; o[i] = r; o[i + 1] = g; o[i + 2] = b
    }
  }
  /** draw a sprite turned about its own centre by `ang` (nearest pixel: the shape stays pixel-crisp, small sprites only) */
  drawSpriteRot(sp, dx, dy, ang) {
    const ca = Math.cos(ang), sa = Math.sin(ang), o = this.out
    for (let n = 0; n < sp.n; n++) {
      const ox = sp.xs[n] - sp.cx, oy = sp.ys[n] - sp.cy
      const x = Math.round(sp.cx + ox * ca - oy * sa) + dx, y = Math.round(sp.cy + ox * sa + oy * ca) + dy
      if (x < 0 || y < 0 || x >= W || y >= H) continue
      const i = (y * W + x) * 4; o[i] = sp.cols[n * 3]; o[i + 1] = sp.cols[n * 3 + 1]; o[i + 2] = sp.cols[n * 3 + 2]
    }
  }

  /** every pixel in the rectangle for which pred is true, cut out as ONE sprite (hole filled like lift) */
  liftAll(opts) {
    const parts = this.lift(Object.assign({}, opts, { minArea: 1, maxArea: 1e9 }))
    return this.merge(parts)
  }
  merge(parts) {
    let n = 0; for (const p of parts) n += p.n
    const xs = new Int16Array(n), ys = new Int16Array(n), cols = new Uint8Array(n * 3)
    let k = 0, sx = 0, sy = 0
    for (const p of parts) for (let i = 0; i < p.n; i++, k++) { xs[k] = p.xs[i]; ys[k] = p.ys[i]; cols[k * 3] = p.cols[i * 3]; cols[k * 3 + 1] = p.cols[i * 3 + 1]; cols[k * 3 + 2] = p.cols[i * 3 + 2]; sx += p.xs[i]; sy += p.ys[i] }
    return { xs, ys, cols, n, cx: n ? sx / n : 0, cy: n ? sy / n : 0, bbox: [0, 0, W - 1, H - 1] }
  }
  /** draw a sprite whose pixels each move by f(x, y, v) (v.x, v.y set by f), e.g. a bend that grows toward the tip */
  drawSpriteWarp(sp, f, k = 1) {
    const o = this.out, v = this.v
    for (let n = 0; n < sp.n; n++) {
      const px = sp.xs[n], py = sp.ys[n]
      v.x = 0; v.y = 0; f(px, py, v)
      const x = px + Math.round(v.x), y = py + Math.round(v.y)
      if (x < 0 || y < 0 || x >= W || y >= H) continue
      const i = (y * W + x) * 4; o[i] = sp.cols[n * 3] * k; o[i + 1] = sp.cols[n * 3 + 1] * k; o[i + 2] = sp.cols[n * 3 + 2] * k
    }
  }
  /** draw one sprite pixel at a time, with the pixel's colour changed by f(r, g, b, x, y, out) (writes out[0..2]); used for flicker and shimmer */
  drawSpriteMap(sp, dx, dy, f) {
    const o = this.out, c = [0, 0, 0]
    for (let n = 0; n < sp.n; n++) {
      const x = sp.xs[n] + dx, y = sp.ys[n] + dy
      if (x < 0 || y < 0 || x >= W || y >= H) continue
      c[0] = sp.cols[n * 3]; c[1] = sp.cols[n * 3 + 1]; c[2] = sp.cols[n * 3 + 2]
      if (f(c[0], c[1], c[2], x, y, c) === false) continue   // f returns false: leave this pixel out
      const i = (y * W + x) * 4; o[i] = c[0]; o[i + 1] = c[1]; o[i + 2] = c[2]
    }
  }

  // ---------------------------------------------------------------- light
  /** a dithered glow: pixels inside radius r are lit with colour*strength where the (k * falloff) beats the dither pattern */
  glow(cx, cy, r, rgb, k, strength = 0.5, ry = 1) {
    if (k <= 0) return
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(W - 1, Math.ceil(cx + r)), y0 = Math.max(0, Math.floor(cy - r * ry)), y1 = Math.min(H - 1, Math.ceil(cy + r * ry))
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const d = Math.sqrt((x - cx) * (x - cx) + ((y - cy) / ry) * ((y - cy) / ry)) / r
      if (d >= 1) continue
      const p = k * (1 - d) * (1 - d)
      if (p > BAYER[(y & 3) * 4 + (x & 3)]) this.add(x, y, rgb[0], rgb[1], rgb[2], strength)
    }
  }
  /** a smooth wash of light: adds rgb * k * (1 - distance / r)^2 (a gentle colour shift, no dither pattern) */
  wash(cx, cy, r, rgb, k, ry = 1) {
    if (k <= 0) return
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(W - 1, Math.ceil(cx + r)), y0 = Math.max(0, Math.floor(cy - r * ry)), y1 = Math.min(H - 1, Math.ceil(cy + r * ry)), o = this.out
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const d = Math.sqrt((x - cx) * (x - cx) + ((y - cy) / ry) * ((y - cy) / ry)) / r
      if (d >= 1) continue
      const f = k * (1 - d) * (1 - d), i = (y * W + x) * 4
      o[i] += rgb[0] * f; o[i + 1] += rgb[1] * f; o[i + 2] += rgb[2] * f
    }
  }
  /** a small four-armed sparkle */
  plus(x, y, rgb, k = 1) {
    this.add(x, y, rgb[0], rgb[1], rgb[2], k); this.add(x - 1, y, rgb[0], rgb[1], rgb[2], k * 0.6); this.add(x + 1, y, rgb[0], rgb[1], rgb[2], k * 0.6); this.add(x, y - 1, rgb[0], rgb[1], rgb[2], k * 0.6); this.add(x, y + 1, rgb[0], rgb[1], rgb[2], k * 0.6)
  }
  /** a one-pixel circle outline */
  ring(cx, cy, r, rgb, a = 1) {
    let x = r, y = 0, e = 1 - r
    while (x >= y) {
      for (const [px, py] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) this.blend(Math.round(cx) + px, Math.round(cy) + py, rgb[0], rgb[1], rgb[2], a)
      y++
      if (e < 0) e += 2 * y + 1; else { x--; e += 2 * (y - x) + 1 }
    }
  }
  /** brightness of the working background at a pixel */
  lumAt(x, y) { const i = (clamp(y | 0, 0, H - 1) * W + clamp(x | 0, 0, W - 1)) * 4; return lum(this.cur[i], this.cur[i + 1], this.cur[i + 2]) }
}

export { W, H, World, clamp, mod, lum, rngf, BAYER }

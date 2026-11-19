/*
 * gfx.js: a tiny pixel-art toolkit for the draft worlds (320 x 180, drawn fresh every frame as a pure function of time).
 * Colours are [r, g, b] (0..255). Everything is drawn into a float buffer, then `present` quantises it with an ordered (Bayer) dither,
 * so glows and gradients band like the game's own pictures and the pattern never shimmers (the dither is fixed to the pixel grid).
 */
(function (root) {
  const W = 320, H = 180
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map((r) => r.map((v) => (v + 0.5) / 16))
  const LEVELS = 13

  function hash(n) { n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n = Math.imul(n ^ (n >>> 12), 0x297a2d39); return ((n ^ (n >>> 15)) >>> 0) / 4294967296 }
  const rnd = (seed, i) => hash(seed * 7919 + i * 104729 + 12345)
  function vnoise(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
    const h = (a, b) => hash(Math.imul(a, 374761393) + Math.imul(b, 668265263) + seed * 1013)
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
  }
  function fbm(x, y, seed, oct = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f, seed + i * 17); a *= 0.5; f *= 2 } return s }
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
  const sc = (c, k) => [c[0] * k, c[1] * k, c[2] * k]
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

  class Gfx {
    constructor() { this.w = W; this.h = H; this.f = new Float32Array(W * H * 3); this.img = new ImageData(W, H) }
    clear(c) { const f = this.f; for (let i = 0; i < W * H; i++) { f[i * 3] = c[0]; f[i * 3 + 1] = c[1]; f[i * 3 + 2] = c[2] } }
    /** blend colour c over the pixel with opacity a */
    set(x, y, c, a = 1) {
      x = Math.round(x); y = Math.round(y)
      if (x < 0 || y < 0 || x >= W || y >= H) return
      const i = (y * W + x) * 3, f = this.f
      if (a >= 1) { f[i] = c[0]; f[i + 1] = c[1]; f[i + 2] = c[2] } else { f[i] += (c[0] - f[i]) * a; f[i + 1] += (c[1] - f[i + 1]) * a; f[i + 2] += (c[2] - f[i + 2]) * a }
    }
    /** add light */
    add(x, y, c, k = 1) {
      x = Math.round(x); y = Math.round(y)
      if (x < 0 || y < 0 || x >= W || y >= H) return
      const i = (y * W + x) * 3, f = this.f
      f[i] += c[0] * k; f[i + 1] += c[1] * k; f[i + 2] += c[2] * k
    }
    get(x, y) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return [0, 0, 0]; const i = (y * W + x) * 3; return [this.f[i], this.f[i + 1], this.f[i + 2]] }
    rect(x, y, w, h, c, a = 1) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c, a) }
    vgrad(y0, y1, c0, c1, curve = 1) { for (let y = y0; y <= y1; y++) { const t = Math.pow((y - y0) / Math.max(1, y1 - y0), curve), c = mix(c0, c1, t); for (let x = 0; x < W; x++) this.set(x, y, c) } }
    line(x0, y0, x1, y1, c, a = 1, th = 1) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1)
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
      let err = dx + dy, guard = 4000
      for (;;) {
        if (th <= 1) this.set(x0, y0, c, a); else this.disc(x0, y0, th / 2, c, a)
        if ((x0 === x1 && y0 === y1) || guard-- < 0) break
        const e2 = 2 * err
        if (e2 >= dy) { err += dy; x0 += sx }
        if (e2 <= dx) { err += dx; y0 += sy }
      }
    }
    /** a line that adds light (for beams) */
    beam(x0, y0, x1, y1, c, k = 1, th = 1) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
      for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; if (th <= 1) this.add(x, y, c, k); else this.discAdd(x, y, th / 2, c, k) }
    }
    disc(cx, cy, r, c, a = 1) {
      const r2 = r * r
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy <= r2 + 0.25) this.set(x, y, c, a) }
    }
    discAdd(cx, cy, r, c, k) {
      const r2 = r * r
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy <= r2 + 0.25) this.add(x, y, c, k) }
    }
    ring(cx, cy, r, c, a = 1, th = 1) {
      const o = r + th / 2, i2 = Math.max(0, r - th / 2) ** 2, o2 = o * o
      for (let y = Math.floor(cy - o); y <= Math.ceil(cy + o); y++) for (let x = Math.floor(cx - o); x <= Math.ceil(cx + o); x++) { const dx = x - cx, dy = y - cy, d = dx * dx + dy * dy; if (d <= o2 && d >= i2) this.set(x, y, c, a) }
    }
    ellipse(cx, cy, rx, ry, c, a = 1) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy <= 1) this.set(x, y, c, a) }
    }
    /** an ellipse outline, optionally dashed (dash = on-length in radians; gap the same) and rotated slowly by `phase` */
    ellipseRing(cx, cy, rx, ry, c, a = 1, dash = 0, phase = 0, glowK = 0) {
      const n = Math.ceil(Math.PI * 2 * Math.max(rx, ry) * 1.6)
      for (let i = 0; i < n; i++) {
        const th = (i / n) * Math.PI * 2
        if (dash > 0 && Math.floor((th + phase) / dash) % 2 === 1) continue
        const x = cx + Math.cos(th) * rx, y = cy + Math.sin(th) * ry
        this.set(x, y, c, a); if (glowK) this.add(x, y, c, glowK)
      }
    }
    poly(pts, c, a = 1) {
      let y0 = Infinity, y1 = -Infinity
      for (const p of pts) { if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1] }
      for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(H - 1, Math.ceil(y1)); y++) {
        const xs = []
        for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; if ((p[1] <= y && q[1] > y) || (q[1] <= y && p[1] > y)) xs.push(p[0] + ((y - p[1]) / (q[1] - p[1])) * (q[0] - p[0])) }
        xs.sort((a, b) => a - b)
        for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) this.set(x, y, c, a)
      }
    }
    /** soft light: (1 - d/r)^pow, added */
    glow(cx, cy, r, c, k = 1, pow = 2) {
      const r2 = r * r
      for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(H - 1, Math.ceil(cy + r)); y++) for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(W - 1, Math.ceil(cx + r)); x++) {
        const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy
        if (d2 >= r2) continue
        const f = Math.pow(1 - Math.sqrt(d2) / r, pow) * k, i = (y * W + x) * 3
        this.f[i] += c[0] * f; this.f[i + 1] += c[1] * f; this.f[i + 2] += c[2] * f
      }
    }
    /** a stretched soft light (an ellipse of light) */
    glowE(cx, cy, rx, ry, c, k = 1, pow = 2) {
      for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(H - 1, Math.ceil(cy + ry)); y++) for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(W - 1, Math.ceil(cx + rx)); x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry, d2 = dx * dx + dy * dy
        if (d2 >= 1) continue
        const f = Math.pow(1 - Math.sqrt(d2), pow) * k, i = (y * W + x) * 3
        this.f[i] += c[0] * f; this.f[i + 1] += c[1] * f; this.f[i + 2] += c[2] * f
      }
    }
    /** a shaded ball: base colour c, light from the upper left, a dark rim and a small highlight */
    sphere(cx, cy, r, c, a = 1) {
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const dx = (x - cx) / r, dy = (y - cy) / r, d2 = dx * dx + dy * dy
        if (d2 > 1) continue
        const nz = Math.sqrt(1 - d2), l = clamp01(-0.45 * dx - 0.55 * dy + 0.7 * nz)
        const k = 0.28 + 0.9 * Math.pow(l, 1.3)
        this.set(x, y, [c[0] * k + (l > 0.93 ? 70 : 0), c[1] * k + (l > 0.93 ? 70 : 0), c[2] * k + (l > 0.93 ? 70 : 0)], a)
      }
    }
    stars(seed, n, y0, y1, t, c = [255, 255, 255], twinkle = 0.35, dim = 1) {
      for (let i = 0; i < n; i++) {
        const x = Math.floor(rnd(seed, i * 3) * W), y = y0 + Math.floor(rnd(seed, i * 3 + 1) * (y1 - y0)), b = 0.35 + 0.65 * rnd(seed, i * 3 + 2)
        let k = b
        if (rnd(seed, i * 3 + 7) < twinkle) k *= 0.55 + 0.45 * Math.sin(t * (0.9 + 2.2 * rnd(seed, i * 3 + 9)) + rnd(seed, i * 3 + 11) * 6.283)
        k *= dim
        this.add(x, y, c, k * 0.9)
        if (b > 0.93) { this.add(x - 1, y, c, k * 0.35); this.add(x + 1, y, c, k * 0.35); this.add(x, y - 1, c, k * 0.35); this.add(x, y + 1, c, k * 0.35) }
      }
    }
    /** quantise with a Bayer dither into the ImageData, then paint it on the canvas */
    present(ctx) {
      const d = this.img.data, f = this.f
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 3, o = (y * W + x) * 4, th = BAYER[y & 3][x & 3]
        for (let k = 0; k < 3; k++) {
          const v = clamp01(f[i + k] / 255) * (LEVELS - 1)
          d[o + k] = (Math.floor(v + th) / (LEVELS - 1)) * 255
        }
        d[o + 3] = 255
      }
      ctx.putImageData(this.img, 0, 0)
    }
  }

  /** a skyline from layered noise: returns the top y of the silhouette at every x */
  function ridge(base, amp, scale, seed, oct = 4) { const out = new Float32Array(W); for (let x = 0; x < W; x++) out[x] = base - amp * fbm(x * scale, seed * 3.7, seed, oct); return out }
  function fillRidge(g, top, bottomY, c, a = 1) { for (let x = 0; x < W; x++) for (let y = Math.max(0, Math.floor(top[x])); y <= bottomY; y++) g.set(x, y, c, a) }

  const api = { Gfx, W, H, hash, rnd, vnoise, fbm, mix, sc, clamp01, ridge, fillRidge }
  if (typeof module !== 'undefined') module.exports = api
  root.Gfx = api
})(typeof window !== 'undefined' ? window : globalThis)

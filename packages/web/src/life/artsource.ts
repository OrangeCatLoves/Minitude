// @ts-nocheck
/* The world pictures were made by code (tools/art-source/art/art.py and art3.py). This is a port of the rules two worlds need: vgrad, glow, sphere,
 * haze, Pillow's two-pixel line, and the DNA Forest scene (w9). With them the helices can be drawn at ANY turning angle and a sphere can be
 * painted whole where something hides part of it. At angle 0 the port gives the original picture pixel for pixel (test/life.test.ts checks it). */
const W = 320, H = 180
const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const ramp = (...hs) => hs.map(rgb)
const mix = (a, b, t) => [Math.trunc(a[0] + (b[0] - a[0]) * t), Math.trunc(a[1] + (b[1] - a[1]) * t), Math.trunc(a[2] + (b[2] - a[2]) * t)]
const haze = (rp, col, t) => rp.map((a) => mix(a, col, t))
const pmod = (a, n) => ((a % n) + n) % n
/** Python's round(): halves go to the even number */
const pyround = (v) => { const f = Math.floor(v), d = v - f; return d > 0.5 ? f + 1 : d < 0.5 ? f : (f % 2 === 0 ? f : f + 1) }

const BASE = [ramp('#4a3a00', '#c0a010', '#ffe050', '#fff8c0'), ramp('#0a3a1a', '#1a8a3a', '#46d878', '#c0ffd0'), ramp('#4a0a20', '#c02a58', '#ff6a98', '#ffd0e0'), ramp('#0a3a58', '#1a80b0', '#5ad0ff', '#d0f4ff')]
const SB = ramp('#10206a', '#2a4ac8', '#6a90ff', '#d0e0ff'), SA = ramp('#4a1060', '#9a2ac0', '#e068ff', '#ffd8ff')
const FADE = rgb('#06143a')
/** x, nearness (0 far to 1 near), radius, period, phase: in the order they are painted (far ones first) */
const HELICES = [[12, 0.35, 14, 70, 0], [58, 0.45, 16, 78, 1.5], [110, 0.55, 18, 86, 3.1], [276, 0.6, 18, 84, 2.2], [312, 0.4, 15, 74, 0.6], [150, 0.8, 20, 92, 4.4], [254, 0.85, 22, 96, 5.5]]
const LX = -0.5, LY = -0.6, LZ = Math.sqrt(Math.max(0.01, 1 - LX * LX - LY * LY))

function put(o, x, y, c) { if (x >= 0 && x < W && y >= 0 && y < H) { const i = (y * W + x) * 4; o[i] = c[0]; o[i + 1] = c[1]; o[i + 2] = c[2]; o[i + 3] = 255 } }
function sphere(o, cx, cy, r, rp, spec = false) {
  const n = rp.length
  for (let y = Math.trunc(cy - r); y <= Math.trunc(cy + r); y++) for (let x = Math.trunc(cx - r); x <= Math.trunc(cx + r); x++) {
    const dx = (x - cx) / r, dy = (y - cy) / r, d2 = dx * dx + dy * dy
    if (d2 > 1) continue
    const dz = Math.sqrt(1 - d2), v = Math.max(0, dx * LX + dy * LY + dz * LZ)
    const t = v * (n - 1) + (B4[pmod(y, 4)][pmod(x, 4)] / 16 - 0.5) * 0.9
    put(o, x, y, rp[Math.max(0, Math.min(n - 1, pyround(t)))])
  }
  if (spec && r >= 5) {   // the white glint: a 2 x 2 square
    const sx = cx + LX * r * 0.5, sy = cy + LY * r * 0.5
    for (let y = Math.trunc(sy - 1); y <= Math.trunc(sy + 1) - 1; y++) for (let x = Math.trunc(sx - 1); x <= Math.trunc(sx + 1) - 1; x++) put(o, x, y, [255, 255, 255])
  }
}
/** Pillow's line of width 2 between two points on one row (the coordinates are cut to whole numbers first) */
function line2(o, xa, y, xb, c) {
  const x0 = Math.trunc(xa), x1 = Math.trunc(xb), dx = x1 - x0
  if (dx === 0) { put(o, x0, y, c); return }
  const ya = dx > 0 ? y : y - 1, lo = Math.min(x0, x1), hi = Math.max(x0, x1)
  for (let yy = ya; yy <= ya + 1; yy++) for (let x = lo; x <= hi; x++) put(o, x, yy, c)
}
function helix(o, x, f, r, period, ph) {
  const up = (rp) => haze(rp, FADE, 1 - f), sb = up(SB), sa = up(SA), bases = BASE.map(up)
  const r1 = 3 * (0.6 + 0.4 * f), r2 = 3.4 * (0.6 + 0.4 * f)
  for (let y = -4; y < 142; y += 3) { const a = (y / period) * 2 * Math.PI + ph, s = Math.sin(a) * r; if (Math.cos(a) < 0) sphere(o, x + s, y, r1, sb); else sphere(o, x - s, y, r1, sa) }
  for (let y = 0; y < 140; y += 6) { const a = (y / period) * 2 * Math.PI + ph, s = Math.sin(a) * r, bp = bases[(Math.floor(y / 6) + Math.trunc(x)) % 4]; line2(o, x + s, y, x, bp[2]); line2(o, x, y, x - s, bp[1]) }
  for (let y = -4; y < 142; y += 3) { const a = (y / period) * 2 * Math.PI + ph, s = Math.sin(a) * r; if (Math.cos(a) >= 0) sphere(o, x + s, y, r2, sb); else sphere(o, x - s, y, r2, sa) }
}
/** the sky behind the helices (rows 0 to 179), as the art source paints it */
function background() {
  const o = new Uint8ClampedArray(W * H * 4), cols = ramp('#020818', '#06143a', '#0c2460', '#14388a'), n = cols.length
  for (let y = 0; y < H; y++) { const t = y / (H - 1) * (n - 1), i = Math.min(Math.trunc(t), n - 2), f = t - i; for (let x = 0; x < W; x++) { put(o, x, y, f > (B4[y % 4][x % 4] + 0.5) / 16 ? cols[i + 1] : cols[i]); o[(y * W + x) * 4 + 3] = 255 } }
  const cx = 200, cy = 20, rad = 100, ex = 1.6, col = rgb('#18408a'), amt = 0.7
  for (let y = Math.trunc(cy - rad); y <= Math.trunc(cy + rad); y++) for (let x = Math.trunc(cx - rad * ex); x <= Math.trunc(cx + rad * ex); x++) {
    const d = Math.hypot((x - cx) / ex, y - cy)
    if (d < rad && (1 - d / rad) * amt > (B4[pmod(y, 4)][pmod(x, 4)] + 0.5) / 16) put(o, x, y, col)
  }
  return o
}
/** paint the seven helices onto o; turn[i] is how far helix i has turned (radians) */
function helices(o, turn) { HELICES.forEach(([x, f, r, p, ph], i) => helix(o, x, f, r, p, ph + (turn ? turn[i] || 0 : 0))) }
export const Dna = { background, helices, HELICES }
/** the drawing rules of the art source, for other worlds */
export const Art = { sphere, ramp, haze, rgb, mix, blank: () => new Uint8ClampedArray(W * H * 4) }

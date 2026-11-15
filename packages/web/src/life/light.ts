// @ts-nocheck
/* Small drawing helpers for light effects (all additive or blended on the frame, nothing is resampled): lines, dots, stars, soft glows. */
const round = Math.round
const hash = (x, y, s = 0) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }
const Fx = {
  hash,
  /** a one-pixel line, blended over the frame with strength a */
  line(L, x0, y0, x1, y1, rgb, a) {
    x0 = round(x0); y0 = round(y0); x1 = round(x1); y1 = round(y1)
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
    let err = dx + dy
    for (let n = 0; n < 600; n++) {
      L.blend(x0, y0, rgb[0], rgb[1], rgb[2], a)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 >= dy) { err += dy; x0 += sx }
      if (e2 <= dx) { err += dx; y0 += sy }
    }
  },
  /** one pixel, blended */
  dot(L, x, y, rgb, a) { L.blend(round(x), round(y), rgb[0], rgb[1], rgb[2], a) },
  /** a small four-armed star */
  star(L, x, y, rgb, a) {
    x = round(x); y = round(y)
    L.blend(x, y, rgb[0], rgb[1], rgb[2], a)
    L.blend(x + 1, y, rgb[0], rgb[1], rgb[2], a * 0.5); L.blend(x - 1, y, rgb[0], rgb[1], rgb[2], a * 0.5)
    L.blend(x, y + 1, rgb[0], rgb[1], rgb[2], a * 0.5); L.blend(x, y - 1, rgb[0], rgb[1], rgb[2], a * 0.5)
  },
  /** a soft round glow, added to the frame */
  orb(L, x, y, r, rgb, a) {
    const cx = round(x), cy = round(y)
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy); if (d > r) continue
      const f = 1 - d / r
      L.add(cx + dx, cy + dy, rgb[0], rgb[1], rgb[2], a * f * f)
    }
  },
}
export { Fx }

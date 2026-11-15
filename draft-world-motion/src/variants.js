/* Three designs per world (A, B, C) for the owner to pick from. Design A is the definition already registered for the slot unless a new A is given here. */
(function () {
  'use strict'
  const V = {}, pick = {}
  const orig = Motion.forSlot
  const keyOf = (slot) => (slot >= 20 && slot <= 34 ? 'void' : slot)
  /** register design i (0 = A, 1 = B, 2 = C) of a slot; name and desc come from the slot's first definition when left out */
  Motion.variant = (slot, i, o) => { const base = Motion.all[slot] || {}; if (!o.name) o.name = base.name; if (!o.desc) o.desc = base.desc; (V[slot] || (V[slot] = []))[i] = o }
  /** replace all the designs of a slot */
  Motion.setVariants = (slot, list) => { V[slot] = list.slice() }
  Motion.variantsOf = (slot) => { const l = V[keyOf(slot)]; if (!l) return [orig(slot)]; const out = []; for (let i = 0; i < 3; i++) { const d = l[i] || (i === 0 ? orig(slot) : null); if (d) out.push(d) } return out }
  Motion.pickOf = (slot) => pick[keyOf(slot)] || 0
  Motion.setPick = (slot, i) => { pick[keyOf(slot)] = i }
  Motion.forSlot = (slot) => { const l = Motion.variantsOf(slot); return l[Math.min(Motion.pickOf(slot), l.length - 1)] }

  // ---------------------------------------------------------------- helpers shared by the designs
  const { clamp } = Engine, { hash } = Motion.helpers
  const TAU = Math.PI * 2, sin = Math.sin
  const h = {
    lumOf: (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b,
    smooth: (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u) },
    frac: (v) => v - Math.floor(v),
    angDiff: (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d },
    bounds(s) { let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (let k = 0; k < s.n; k++) { if (s.xs[k] < x0) x0 = s.xs[k]; if (s.xs[k] > x1) x1 = s.xs[k]; if (s.ys[k] < y0) y0 = s.ys[k]; if (s.ys[k] > y1) y1 = s.ys[k] } s.minx = x0; s.maxx = x1; s.miny = y0; s.maxy = y1; return s },
    twSetup: (L, rect, pred, maxArea = 2) => L.lift({ rect, pred, minArea: 1, maxArea }),
    twDraw(L, list, t, K, deep = 0.6) { for (const s of list) L.drawSpriteMap(s, 0, 0, (r, g, b, x, y, c) => { const f = 1 - deep * Math.min(1, K) * Math.pow(Math.max(0, sin(t * (0.3 + hash(x, y, 1) * 0.7) + hash(x, y, 2) * TAU)), 2); c[0] = r * f; c[1] = g * f; c[2] = b * f }) },
    /** draw a lifted piece in its own place, see-through by (1 - a) */
    blendSprite(L, sp, a) { if (a >= 1) { L.drawSprite(sp, 0, 0); return } L.drawSpriteMap(sp, 0, 0, (r, g, b, x, y, c) => { const i = (y * 320 + x) * 4; c[0] = L.cur[i] + (r - L.cur[i]) * a; c[1] = L.cur[i + 1] + (g - L.cur[i + 1]) * a; c[2] = L.cur[i + 2] + (b - L.cur[i + 2]) * a }) },
    /** multiply the brightness of the bright pixels of a region by f(x, y) (the dark background is left alone) */
    light(L, x0, y0, x1, y1, minLum, f) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y * 320 + x) * 4; if (0.299 * L.cur[i] + 0.587 * L.cur[i + 1] + 0.114 * L.cur[i + 2] < minLum) continue; const v = f(x, y); if (v !== 1) L.mul(x, y, v) } },
  }
  Motion.vh = h
})()

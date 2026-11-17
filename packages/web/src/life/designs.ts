// @ts-nocheck
/* What moves in each world. Carried over as the owner reviewed and chose it in drafts/draft-world-motion/ (16 Nov 2026): plain JavaScript, so it is
 * not type-checked; test/life.test.ts compares every world's frames with the reviewed ones.
 *
 * Each world has setup(L) (cut objects out of the picture, once) and draw(L, t, K) (draw one frame at time t seconds; K is the amount of
 * life: 0 gives the original picture exactly, 1 is the reviewed amount). Positions are in the picture's own pixels (320 x 180); the game does
 * not show the top 15 rows. Each block below is one file of the draft, with its own helpers.
 *
 * Rules that came out of the review: nothing resamples a fine pixel pattern (no rotating, no stretching); an object moves as ONE whole piece;
 * things that hang together move together; light changes are smooth and slow. */
import { W as EW, H as EH, World, clamp as eclamp, mod as emod, lum as elum, rngf as erngf, BAYER as EBAYER } from './engine'
import { Fx } from './light'
import { Dna, Art } from './artsource'

const Engine = { W: EW, H: EH, World, clamp: eclamp, mod: emod, lum: elum, rngf: erngf, BAYER: EBAYER }
const Motion: any = {}
/** the designs chosen from three (they replace the first design of their slot) */
const chosen: any = {}

// ======================================================================================================================
// Worlds 1 to 5, and the pieces the others share
{
  const E = Engine, { clamp, mod, rngf } = E
  const TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, abs = Math.abs, round = Math.round, floor = Math.floor, hypot = Math.hypot
  /** a pixel of exactly this colour (0xRRGGBB) */
  const eq = (h) => { const R = (h >> 16) & 255, G = (h >> 8) & 255, B = h & 255; return (r, g, b) => r === R && g === G && b === B }
  /** any of these exact colours */
  const anyOf = (list) => { const fs = list.map(eq); return (r, g, b) => fs.some((f) => f(r, g, b)) }
  /** a steady pseudo-random number from 0 to 1 for a place (and a seed) */
  const hash = (x, y, s = 0) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }
  const rgb = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255]

  // ---------------------------------------------------------------- shared pieces
  /** grass-like floor fibres of the first worlds: they lean a little, more toward the tip */
  function fibresSetup(L, y0 = 129, y1 = 139) { L.fibre = L.liftAll({ rect: [0, y0, 319, y1], pred: eq(0x9ab8e8) }) }
  function fibresDraw(L, t, K, amp = 1.25) { L.drawSpriteWarp(L.fibre, (x, y, v) => { v.x = K * amp * ((140 - y) / 5) * sin(t * 1.3 + x * 0.08) }) }
  /** specks drifting upward and fading in and out (dust, steam, plankton...) */
  function motes(L, t, K, c) {
    const [x0, y0, x1, y1] = c.rect, n = c.n, col = c.color, h = y1 - y0
    for (let i = 0; i < n; i++) {
      const ph = mod(t * (c.rise / h) * (0.7 + hash(i, 3, c.seed) * 0.6) + hash(i, 1, c.seed), 1)
      const y = y1 - ph * h, x = x0 + hash(i, 2, c.seed) * (x1 - x0) + sin(t * (c.sway || 0.5) + i * 2.1) * (c.amp || 3)
      const a = sin(Math.PI * ph) * (c.alpha ?? 0.7) * Math.min(1, K)
      L.blend(round(x), round(y), col[0], col[1], col[2], a)
      if (c.big && i % c.big === 0) { L.blend(round(x) + 1, round(y), col[0], col[1], col[2], a * 0.6); L.blend(round(x), round(y) + 1, col[0], col[1], col[2], a * 0.6) }
    }
  }
  /** a pulse that travels along a line of dots (lights on a platform) */
  function chase(L, t, K, x0, x1, y, step, col, speed = 10, len = 4) {
    for (let x = x0, i = 0; x <= x1; x += step, i++) {
      const u = mod(t * speed - i, 24) // a bright run of `len` dots that moves along
      const k = u < len ? 1 - u / len : 0
      if (k > 0) L.add(x, y, col[0], col[1], col[2], 0.7 * k * Math.min(1, K))
    }
  }

  const M = {}
  const def = (slot, o) => { M[slot] = o }

  // ================================================================ 0 THE ROOM
  def(0, {
    setup(L) {
      L.stars = L.liftAll({ rect: [100, 18, 153, 76], pred: eq(0xdfe6ff) })
      L.city = L.liftAll({ rect: [100, 79, 153, 94], pred: eq(0xffce64) })
      L.halo = L.liftAll({ rect: [0, 38, 94, 125], pred: eq(0xffd890) })
      fibresSetup(L)
    },
    draw(L, t, K) {
      L.drawSpriteMap(L.stars, 0, 0, (r, g, b, x, y, c) => { const f = 1 - 0.7 * Math.min(1, K) * Math.pow(Math.max(0, sin(t * (0.6 + hash(x, y, 1) * 1.6) + hash(x, y, 2) * TAU)), 5); c[0] = r * f; c[1] = g * f; c[2] = b * f })
      L.drawSpriteMap(L.city, 0, 0, (r, g, b, x, y, c) => { if (sin(t * 0.22 + hash(x, y, 3) * TAU) > 0.86 && K > 0.3) return false })
      const R = 40 + 4 * K * sin(t * 0.8) + 1.5 * K * sin(t * 2.3 + 1)
      L.drawSpriteMap(L.halo, 0, 0, (r, g, b, x, y, c) => { if (hypot(x - 41, y - 86) > R + (hash(x, y, 4) - 0.5) * 7) return false })
      motes(L, t, K, { n: 9, rect: [14, 52, 78, 112], rise: 3.2, sway: 0.5, amp: 3, color: [255, 236, 190], alpha: 0.75, seed: 1 })
      motes(L, t, K, { n: 5, rect: [58, 68, 66, 92], rise: 7, sway: 1.1, amp: 2.4, color: [240, 240, 255], alpha: 0.6, seed: 2, big: 2 })
      fibresDraw(L, t, K)
    },
  })

  // ================================================================ 1 THE BOOKSHELF
  def(1, {
    setup(L) {
      L.gold = L.liftAll({ rect: [0, 14, 319, 131], pred: (r, g, b) => r >= 0xd6 && r <= 0xe4 && g >= 0xae && g <= 0xbe && b >= 0x54 && b <= 0x6a })
      fibresSetup(L)
    },
    draw(L, t, K) {
      L.drawSpriteMap(L.gold, 0, 0, (r, g, b, x, y, c) => {
        const u = mod(x * 0.8 + y * 0.45 - t * 24, 560), s = Math.exp(-(((u - 40) / 20) ** 2)) * Math.min(1, K)
        c[0] = r + (255 - r) * s * 0.9; c[1] = g + (246 - g) * s * 0.9; c[2] = b + (176 - b) * s * 0.9
      })
      L.wash(60 + 22 * sin(t * 0.21), 36 + 5 * sin(t * 0.3), 60, [150, 100, 220], 0.14 * K * (0.6 + 0.4 * sin(t * 0.5)))
      L.wash(178 + 26 * sin(t * 0.17 + 1), 30 + 5 * sin(t * 0.26), 62, [70, 190, 190], 0.14 * K * (0.6 + 0.4 * sin(t * 0.43 + 2)))
      L.wash(262 + 18 * sin(t * 0.19 + 2), 40 + 4 * sin(t * 0.33), 54, [240, 160, 90], 0.14 * K * (0.6 + 0.4 * sin(t * 0.37 + 4)))
      motes(L, t, K, { n: 10, rect: [10, 20, 310, 120], rise: 3, sway: 0.4, amp: 4, color: [255, 240, 200], alpha: 0.8, seed: 3, big: 2 })
      fibresDraw(L, t, K)
    },
  })

  // ================================================================ 2 THE PILE
  def(2, {
    setup(L) { fibresSetup(L) },
    draw(L, t, K) {
      L.warp(0, 40, 319, 78, (x, y, v) => { v.x = K * 1.6 * ((78 - y) / 38) * sin(t * 0.9 + x * 0.045 + sin(x * 0.3) * 0.6) })
      const k = 1 + 0.06 * K * sin(t * 0.7)
      for (let y = 15; y < 52; y++) for (let x = 0; x < 320; x++) L.mul(x, y, k)
      motes(L, t, K, { n: 8, rect: [10, 40, 310, 130], rise: 3.5, sway: 0.5, amp: 5, color: [255, 235, 200], alpha: 0.7, seed: 4, big: 2 })
      fibresDraw(L, t, K, 1.0)
    },
  })

  // ================================================================ 3 YARN ROPES
  const gold = (r, g, b) => r > 190 && g > 140 && b < 135 && r - b > 85
  /** the whole golden speck: body, highlight, shaded edge and dark rim (the four colours it is painted with) */
  const moon = anyOf([0xe8d070, 0xfff4b0, 0xb09040, 0x6a5a30])
  def(3, {
    setup(L) {
      L.specks = L.lift({ rect: [0, 8, 319, 136], pred: moon, minArea: 4, grow: 1, fill: true })
      L.curls = L.liftAll({ rect: [40, 8, 250, 136], pred: eq(0x8aa8d8) })
      fibresSetup(L)
    },
    draw(L, t, K) {
      L.specks.forEach((s, i) => L.drawSprite(s, round(K * 2 * sin(t * 0.35 + i * 1.7)), round(K * 2.4 * sin(t * 0.5 + i * 2.3))))
      L.drawSpriteWarp(L.curls, (x, y, v) => { v.x = K * 1.6 * sin(t * 1.4 + y * 0.35 + x * 0.1); v.y = K * 0.8 * sin(t * 1.1 + x * 0.2) })
      fibresDraw(L, t, K)
    },
  })

  // ================================================================ 4 THREAD FOREST
  def(4, {
    setup(L) {
      L.specks = L.lift({ rect: [32, 4, 250, 138], pred: moon, minArea: 3, grow: 1, fill: true })
      L.curls = L.liftAll({ rect: [0, 3, 319, 136], pred: eq(0x8aa8d8) })
      fibresSetup(L)
    },
    draw(L, t, K) {
      L.specks.forEach((s, i) => L.drawSprite(s, round(K * 3 * sin(t * 0.22 + i * 1.9)), round(K * 3.2 * sin(t * 0.3 + i * 2.7))))
      L.drawSpriteWarp(L.curls, (x, y, v) => { v.x = K * 1.5 * sin(t * 1.3 + y * 0.3 + x * 0.1) })
      const g = Math.max(0, sin(t * 0.8)) ** 6
      L.plus(197, 133, [255, 255, 255], 0.9 * g * Math.min(1, K))
      fibresDraw(L, t, K)
    },
  })

  Object.assign(Motion, { all: M, def, helpers: { eq, anyOf, hash, rgb, fibresSetup, fibresDraw, motes, chase, gold, isGreen: (r, g, b) => g > 150 && r < 140 && b < 150 && g - r > 50, isOrange: (r, g, b) => r > 200 && g > 100 && g < 190 && b < 110, isWhite: (r, g, b) => r > 215 && g > 215 && b > 215, sat: (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) } })
}

// ======================================================================================================================
// World 6 (the droplet), and tails and twinkles
{
  const { def, helpers: H } = Motion
  const { eq, hash, isWhite, isOrange, isGreen, sat } = H
  const E = Engine, { clamp, mod } = E
  const TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, round = Math.round, abs = Math.abs
  const goldish = (r, g, b) => r > 190 && g > 120 && b < 140 && r - b > 70
  /** a tail or tendril: the pixels in a box move up and down in a wave that grows away from the anchor (x = ax) */
  function tail(L, t, K, box, ax, amp = 1.3, speed = 3, k = 0.3) {  // (kept for places where a box is the right tool)
    const [x0, y0, x1, y1] = box, span = Math.max(8, abs(x1 - x0))
    L.warp(x0, y0, x1, y1, (x, y, v) => { const w = clamp(abs(x - ax) / span, 0, 1); v.y = K * amp * w * sin((x - ax) * k - t * speed) })
  }
  /** thin line-like pieces (tails, tendrils) inside a box, lifted out so only they move */
  const lineLike = (c) => c.area >= 8 && c.area <= 110 && (c.w >= 9 || c.h >= 9) && c.area / (c.w * c.h) < 0.5
  /** a bright pixel with few bright pixels around it in a 5 x 5 window: a thin line, not part of a body */
  function thinPred(L, bright, maxN = 8) {
    return (r, g, b, x, y) => {
      if (!bright(r, g, b)) return false
      let n = 0
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const c = L.c(x + dx, y + dy); if (bright(c[0], c[1], c[2])) n++ }
      return n <= maxN
    }
  }
  function tailsSetup(L, rect, bright, maxN) { return L.lift({ rect, pred: thinPred(L, bright, maxN), keep: (c) => c.area >= 6 && c.area <= 160 && (c.w >= 8 || c.h >= 8), grow: 0 }) }
  function tailsDraw(L, list, t, K, amp = 1.4, speed = 3) {
    list.forEach((s, i) => {
      const w = s.bbox[2] - s.bbox[0] + 1, cx = (s.bbox[0] + s.bbox[2]) / 2
      L.drawSpriteWarp(s, (x, y, v) => { const f = 0.35 + 0.65 * abs(x - cx) / (w / 2 + 0.01); v.y = K * amp * f * sin(x * 0.3 - t * speed + i) })
    })
  }
  Motion.helpers.thinPred = thinPred
  /** single bright pixels that twinkle */
  function twinkleSetup(L, rect, pred, maxArea = 2) { return L.lift({ rect, pred, minArea: 1, maxArea }) }
  function twinkleDraw(L, list, t, K, deep = 0.65) {
    for (const s of list) L.drawSpriteMap(s, 0, 0, (r, g, b, x, y, c) => { const f = 1 - deep * Math.min(1, K) * Math.pow(Math.max(0, sin(t * (0.3 + hash(x, y, 1) * 0.7) + hash(x, y, 2) * TAU)), 2); c[0] = r * f; c[1] = g * f; c[2] = b * f })
  }

  // ================================================================ 6 DROPLET WORLD
  def(5, {
    setup(L) {
      L.bubbles = L.lift({ rect: [46, 56, 180, 128], pred: (r, g, b) => r > 215 && g > 235 && b > 235, minArea: 6, maxArea: 40 })
      L.param = L.liftAll({ rect: [104, 62, 156, 92], pred: (r, g, b) => r > g + 8 && r > b + 20, grow: 1, fill: true })
      L.tri = [...L.lift({ rect: [82, 50, 104, 72], pred: (r, g, b) => r > g + 8 && r > b + 20, minArea: 6, grow: 1, fill: true }), ...L.lift({ rect: [146, 100, 170, 124], pred: (r, g, b) => r > g + 8 && r > b + 20, minArea: 6, grow: 1, fill: true })]
      L.green = L.lift({ rect: [40, 80, 90, 126], pred: (r, g, b) => g > b + 15 && g > r + 35, minArea: 8, grow: 1, fill: true })
      L.rods = L.lift({ rect: [50, 70, 182, 130], pred: (r, g, b) => g > 200 && r > 110 && r < 210 && b < 130, minArea: 3, maxArea: 40, grow: 1 })
    },
    draw(L, t, K) {
      L.bubbles.forEach((s, i) => L.drawSprite(s, round(K * 1.6 * sin(t * 0.6 + i * 2.1)), round(K * 2.6 * sin(t * 0.8 + i * 1.3))))
      L.drawSprite(L.param, round(K * 7 * sin(t * 0.3)), round(K * 2 * sin(t * 0.55)))
      L.tri.forEach((s, i) => L.drawSprite(s, round(K * 3 * sin(t * 0.3 + i * 2)), round(K * 2 * sin(t * 0.4 + i))))
      L.green.forEach((s, i) => L.drawSprite(s, round(K * 1.1 * sin(t * 0.5 + i * 1.9)), round(K * 1.1 * sin(t * 0.6 + i * 2.4))))
      L.rods.forEach((s, i) => L.drawSprite(s, round(K * 3 * sin(t * 0.5 + i * 1.7)), round(K * 2 * sin(t * 0.6 + i * 2.2))))
      L.wash(105, 134, 30, [160, 255, 255], 0.14 * K * (0.7 + 0.3 * sin(t * 0.9)))
    },
  })

  // ================================================================ 7 BACTERIA GARDEN

  // ================================================================ 8 GERM REEF

  // ================================================================ 9 PROTEIN FACTORY

  // ================================================================ 10 DNA FOREST
  /** the four kinds of rung colour, as (yellow, green, cyan, red) */
  const RUNG = [[226, 202, 60], [60, 202, 122], [60, 192, 232], [232, 72, 96]]
  const kind = (r, g, b) => (r > 170 && g > 140 && b < 120 ? 0 : g > 140 && r < 150 && b < 160 && g > b - 10 && g > r + 40 ? 1 : r < 120 && g > 150 && b > 170 ? 2 : r > 180 && g < 120 && b < 140 ? 3 : -1)
  const floor = Math.floor
}

// ======================================================================================================================
// Worlds 16 to 18 (the proton, first quarks, short reach)
{
  const { def, helpers: H } = Motion
  const { hash, sat, chase } = H
  const E = Engine, { clamp, mod } = E
  const TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, round = Math.round, abs = Math.abs, floor = Math.floor, exp = Math.exp
  const lumOf = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b
  function twinkle(L, list, t, K, deep = 0.65) {
    for (const s of list) L.drawSpriteMap(s, 0, 0, (r, g, b, x, y, c) => { const f = 1 - deep * Math.min(1, K) * Math.pow(Math.max(0, sin(t * (0.3 + hash(x, y, 1) * 0.7) + hash(x, y, 2) * TAU)), 2); c[0] = r * f; c[1] = g * f; c[2] = b * f })
  }

  // ================================================================ 16 INSIDE THE PROTON
  def(15, {
    setup(L) {
      L.strings = L.liftAll({ rect: [88, 40, 250, 176], pred: (r, g, b) => (r > 225 && g < 150 && b > 130 && b < 205) || (r > 235 && g > 200 && b < 130) })
      L.red = L.lift({ rect: [28, 0, 112, 100], pred: (r, g, b) => r > g + 14 && r > b + 6 && r > 55, minArea: 200, grow: 1, fill: true })
      L.blue = L.lift({ rect: [220, 0, 300, 100], pred: (r, g, b) => b > r + 70 && b > g + 40 && b > 90, minArea: 200, grow: 1, fill: true })
      L.green = L.lift({ rect: [160, 120, 262, 180], pred: (r, g, b) => g > r + 40 && g > b + 10, minArea: 200, grow: 1, fill: true })
    },
    draw(L, t, K) {
      L.drawSpriteWarp(L.strings, (x, y, v) => { v.x = K * 1.1 * sin(y * 0.22 - t * 2.0); v.y = K * 1.1 * sin(x * 0.2 - t * 1.7) })
      L.red.forEach((s) => L.drawSprite(s, round(K * 1.2 * sin(t * 0.5)), round(K * 1.4 * sin(t * 0.6 + 1))))
      L.blue.forEach((s) => L.drawSprite(s, round(K * 1.2 * sin(t * 0.55 + 2)), round(K * 1.4 * sin(t * 0.65 + 3))))
      L.green.forEach((s) => L.drawSprite(s, round(K * 1.2 * sin(t * 0.45 + 4)), round(K * 1.4 * sin(t * 0.6 + 5))))
    },
  })

  // ================================================================ 17 FIRST QUARKS
  def(16, {
    setup(L) {
      L.beam = L.liftAll({ rect: [96, 36, 262, 142], pred: (r, g, b) => r < 150 && g > 190 && b > 225 })
      L.wave = L.liftAll({ rect: [0, 98, 96, 128], pred: (r, g, b) => r < 110 && g > 150 && b > 220 })
      L.cross = [L.liftAll({ rect: [225, 0, 300, 30], pred: (r, g, b) => r > 190 && g > 190 && b > 190 })]
    },
    draw(L, t, K) {
      L.drawSpriteMap(L.beam, 0, 0, (r, g, b, x, y, c) => { const s = exp(-(((mod(x - t * 70, 80) - 10) / 8) ** 2)) * Math.min(1, K); c[0] = r + (255 - r) * s; c[1] = g + (255 - g) * s; c[2] = b + (255 - b) * s })
      L.drawSpriteWarp(L.wave, (x, y, v) => { v.y = K * 1.7 * sin(x * 0.22 - t * 4) })
      L.wash(62, 78, 18, [255, 90, 90], 0.5 * K * (0.6 + 0.4 * sin(t * 1.7)))
      L.wash(52, 117, 14, [120, 200, 255], 0.55 * K * (0.6 + 0.4 * sin(t * 2.1 + 1)))
      twinkle(L, L.cross, t, K, 0.9)
    },
  })

  // ================================================================ 18 SHORT REACH
  def(17, {
    setup(L) { L.rings = L.lift({ rect: [0, 15, 320, 136], pred: (r, g, b) => r > 220 && g > 110 && b < 150 && r - b > 85, minArea: 6, maxArea: 200, grow: 1, fill: true }) },
    draw(L, t, K) {
      L.rings.forEach((s, i) => L.drawSprite(s, round(K * 2.2 * sin(t * 0.3 + i * 1.7)), round(K * 2.2 * sin(t * 0.37 + i * 2.3)), 1 + 0.12 * sin(t * 0.7 + i * 0.9) * Math.min(1, K)))
      chase(L, t, K, 132, 318, 145, 14, [255, 190, 150], 4, 3)
    },
  })

  // ================================================================ 19 RIPPLE SEA

  // ================================================================ 20 COLLISION HALL
}

// ======================================================================================================================
// The unexplored stretch (slots 20 to 34: one look that grows from dark to a glowing horizon)
{
  const { def, helpers: H } = Motion
  const { hash, sat } = H
  const E = Engine, { clamp, mod } = E
  const TAU = Math.PI * 2, sin = Math.sin, round = Math.round, exp = Math.exp
  const lumOf = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b
  function twinkle(L, list, t, K, deep = 0.65) {
    for (const s of list) L.drawSpriteMap(s, 0, 0, (r, g, b, x, y, c) => { const f = 1 - deep * Math.min(1, K) * Math.pow(Math.max(0, sin(t * (0.3 + hash(x, y, 1) * 0.7) + hash(x, y, 2) * TAU)), 2); c[0] = r * f; c[1] = g * f; c[2] = b * f })
  }

  // ================================================================ UNEXPLORED
  def('void', {
    setup(L) {
      L.p = (L.slot - 20) / 14
      L.tw = [L.liftAll({ rect: [0, 15, 320, 100 - Math.round(35 * L.p)], pred: Motion.helpers.thinPred(L, (r, g, b) => lumOf(r, g, b) > 60 && b > r - 10, 3) })]
      L.rings = L.slot >= 26 ? L.lift({ rect: [0, 60, 320, 140], pred: (r, g, b) => sat(r, g, b) > 22 && lumOf(r, g, b) > 28 && lumOf(r, g, b) < 130, minArea: 8, maxArea: 260, keep: (c) => c.w >= 7 && c.h >= 7 }) : []
      L.grid = L.slot >= 28 ? L.liftAll({ rect: [0, 144, 319, 179], pred: (r, g, b) => g > 45 && b > 55 && r < 80 }) : null
    },
    draw(L, t, K) {
      const p = L.p
      twinkle(L, L.tw, t, K, 0.7)
      L.wash(160, 140, 52 + 60 * p, [110, 90, 255], K * (0.05 + 0.2 * p) * (0.75 + 0.25 * sin(t * 0.5)))
      L.rings.forEach((s, i) => L.drawSprite(s, round(K * 2 * sin(t * 0.3 + i * 2.1)), round(K * 2 * sin(t * 0.4 + i * 1.3)), 1 + 0.3 * sin(t * 0.9 + i) * Math.min(1, K)))
      if (L.grid) L.drawSpriteMap(L.grid, 0, 0, (r, g, b, x, y, c) => { const s = exp(-(((mod(y - t * 12, 34) - 4) / 5) ** 2)) * Math.min(1, K) * (0.5 + p); c[0] = r + (110 - r) * s; c[1] = g + (255 - g) * s; c[2] = b + (255 - b) * s })
    },
  })

  // ================================================================ 21 PLANCK FOAM
}

// ======================================================================================================================
// Worlds 7, 13 (its waves), 19, 20 and Planck Foam
{
  const { def, helpers: H } = Motion
  const { hash, sat, chase, anyOf, motes } = H
  const { clamp, mod } = Engine
  const W = 320, TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, abs = Math.abs, round = Math.round, floor = Math.floor, hypot = Math.hypot, exp = Math.exp, atan2 = Math.atan2
  const lumOf = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b
  const smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u) }
  const inDisc = (cx, cy, r) => (x, y) => (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d }
  /** the box a merged sprite fills */
  function bounds(s) { let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (let k = 0; k < s.n; k++) { if (s.xs[k] < x0) x0 = s.xs[k]; if (s.xs[k] > x1) x1 = s.xs[k]; if (s.ys[k] < y0) y0 = s.ys[k]; if (s.ys[k] > y1) y1 = s.ys[k] } s.minx = x0; s.maxx = x1; s.miny = y0; s.maxy = y1; return s }
  const twSetup = (L, rect, pred, maxArea = 2) => L.lift({ rect, pred, minArea: 1, maxArea })
  const twDraw = (L, list, t, K, deep = 0.6) => { for (const s of list) L.drawSpriteMap(s, 0, 0, (r, g, b, x, y, c) => { const f = 1 - deep * Math.min(1, K) * Math.pow(Math.max(0, sin(t * (0.3 + hash(x, y, 1) * 0.7) + hash(x, y, 2) * TAU)), 2); c[0] = r * f; c[1] = g * f; c[2] = b * f }) }

  // ================================================================ 7 BACTERIA GARDEN
  def(6, {
    setup(L) {
      L.flag = L.liftAll({ rect: [146, 15, 320, 72], pred: (r, g, b) => r > 235 && g > 150 && g < 205 && b < 100 })
      const wr = [[131, 12, 166, 30], [183, 2, 214, 18], [271, 6, 299, 26], [301, 30, 320, 46], [88, 64, 114, 82], [187, 63, 218, 80], [236, 124, 268, 147]]
      L.whips = wr.map((rc) => bounds(L.liftAll({ rect: rc, pred: (r, g, b) => (r + g + b) / 3 > 95 && sat(r, g, b) > 25 && !(r > 235 && g > 150 && g < 205 && b < 100) }))).filter((s) => s.n > 4)
      L.sparks = []
      for (let y = 80; y <= 102; y++) for (let x = 28; x <= 155; x++) { const i = (y * W + x) * 4; if (L.base[i] >= 235 && L.base[i + 1] >= 235 && L.base[i + 2] >= 235 && !L.sparks.some((p) => abs(p[0] - x) < 6 && abs(p[1] - y) < 6)) L.sparks.push([x, y]) }
      L.sparks.sort((a, b) => a[0] - b[0])
      L.tw = twSetup(L, [0, 15, 320, 138], (r, g, b) => r > 200 && g > 220 && b > 220)
    },
    draw(L, t, K) {
      L.drawSpriteWarp(L.flag, (x, y, v) => { v.y = K * 2.2 * sin(x * 0.17 - t * 2.8) })
      L.whips.forEach((s, i) => { const span = Math.max(10, s.maxx - s.minx); L.drawSpriteWarp(s, (x, y, v) => { v.y = K * (0.4 + 1.6 * clamp((x - s.minx) / span, 0, 1)) * sin((x - s.minx) * 0.3 - t * 2.2 + i * 1.3) }) })
      L.sparks.forEach((p, i) => { const ph = mod(t - i * 0.28, 4.2) / 0.8; if (ph < 1) Fx.star(L, p[0], p[1], [255, 255, 255], 0.9 * Math.pow(sin(Math.PI * ph), 2) * Math.min(1, K)) })
      twDraw(L, L.tw, t, K)
    },
  })

  // ================================================================ 9 PROTEIN FACTORY

  // ================================================================ 10 DNA FOREST
  const kind = (r, g, b) => (r > 170 && g > 140 && b < 120 ? 0 : g > 140 && r < 150 && b < 160 && g > b - 10 && g > r + 40 ? 1 : r < 120 && g > 150 && b > 170 ? 2 : r > 180 && g < 120 && b < 140 ? 3 : -1)

  // ================================================================ 12 ELECTRON CLOUDS

  // ================================================================ 13 GAMMA SEA
  const HINT = [70, 61, 52, 43, 34, 25, 16]   // the seven waves are 9 pixels apart in wavelength
  const PAIRS = [[0x2d247f, 0x5a48ff], [0x1d3c7f, 0x3a78ff], [0x1d607f, 0x3ac0ff], [0x2d707f, 0x5be0ff], [0x45787f, 0x8af0ff], [0x607c7f, 0xc0f8ff], [0x747e7f, 0xe8fcff]]
  /** the best sine through (x, y) points: scan the wavelength, solve the rest by least squares */
  function fitSine(X, Y, lo = 10, hi = 170) {
    let best = null
    const solve = (k) => {
      let s0 = 0, s1 = 0, s2 = 0, s11 = 0, s12 = 0, s22 = 0, y0 = 0, y1 = 0, y2 = 0
      for (let i = 0; i < X.length; i++) { const a = sin(k * X[i]), b = cos(k * X[i]); s0++; s1 += a; s2 += b; s11 += a * a; s12 += a * b; s22 += b * b; y0 += Y[i]; y1 += Y[i] * a; y2 += Y[i] * b }
      const M = [[s0, s1, s2, y0], [s1, s11, s12, y1], [s2, s12, s22, y2]]
      for (let c = 0; c < 3; c++) { let p = c; for (let r = c + 1; r < 3; r++) if (abs(M[r][c]) > abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; if (abs(M[c][c]) < 1e-9) return null; for (let r = 0; r < 3; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let q = c; q < 4; q++) M[r][q] -= f * M[c][q] } }
      const c0 = M[0][3] / M[0][0], a = M[1][3] / M[1][1], b = M[2][3] / M[2][2]
      let e = 0; for (let i = 0; i < X.length; i++) { const d = Y[i] - (c0 + a * sin(k * X[i]) + b * cos(k * X[i])); e += d * d }
      return { c0, a, b, k, e }
    }
    for (let lam = lo; lam <= hi; lam += 0.1) { const r = solve(TAU / lam); if (r && (!best || r.e < best.e)) best = r }
    for (let lam = TAU / best.k - 0.4; lam <= TAU / best.k + 0.4; lam += 0.02) { const r = solve(TAU / lam); if (r && r.e < best.e) best = r }
    best.lam = TAU / best.k; best.rms = Math.sqrt(best.e / X.length)
    return best
  }
  def(12, {
    setup(L) {
      // the packets and the waves are cut out together, so the background that fills the holes really is background
      const res = L.liftGroups([{ rect: [0, 0, 320, 141], pred: (r, g, b) => r >= 250 && g >= 250 && b >= 250, minArea: 25, grow: 2 }, ...PAIRS.map(([c1, c2]) => ({ rect: [0, 15, 320, 134], pred: anyOf([c1, c2]) }))])
      L.packets = res[0].map(bounds)
      L.curves = PAIRS.map(([c1, c2], ci) => {
        const sp = bounds(L.merge(res[ci + 1]))
        const cols = Array.from({ length: W }, () => []), sums = new Float64Array(W), cnt = new Int16Array(W)
        let n1 = 0, n2 = 0; for (let k = 0; k < sp.n; k++) { const v = (sp.cols[k * 3] << 16) | (sp.cols[k * 3 + 1] << 8) | sp.cols[k * 3 + 2]; if (v === c1) n1++; else if (v === c2) n2++ }
        const cm = n1 > n2 ? c1 : c2, R = (cm >> 16) & 255, G = (cm >> 8) & 255, B = cm & 255
        for (let k = 0; k < sp.n; k++) { cols[sp.xs[k]].push(k); if (sp.cols[k * 3] === R && sp.cols[k * 3 + 1] === G && sp.cols[k * 3 + 2] === B) { sums[sp.xs[k]] += sp.ys[k]; cnt[sp.xs[k]]++ } }
        let X = [], Y = []
        for (let x = 0; x < W; x++) if (cnt[x]) { X.push(x); Y.push(sums[x] / cnt[x]) }
        let f = fitSine(X, Y, HINT[ci] - 3, HINT[ci] + 3)
        const X2 = [], Y2 = []
        for (let i = 0; i < X.length; i++) if (abs(Y[i] - (f.c0 + f.a * sin(f.k * X[i]) + f.b * cos(f.k * X[i]))) < 2.5) { X2.push(X[i]); Y2.push(Y[i]) }
        if (X2.length > 40) f = fitSine(X2, Y2, HINT[ci] - 3, HINT[ci] + 3)
        const fit = (x) => f.c0 + f.a * sin(f.k * x) + f.b * cos(f.k * x)
        for (let x = 0; x < W; x++) cols[x] = cols[x].filter((kk) => abs(sp.ys[kk] - fit(x)) <= 3.6)   // stray pixels of other things are not part of the wave
        const ok = new Uint8Array(W)
        for (let x = 0; x < W; x++) ok[x] = cnt[x] > 0 && abs(sums[x] / cnt[x] - fit(x)) <= 1.7 && cols[x].length < 9 ? 1 : 0
        return { sp, cols, fit, ok, P: Math.max(8, round(f.lam)), lam: f.lam, rms: f.rms }
      })
    },
    draw(L, t, K) {
      const s = floor(K * 12 * t)
      for (const cv of L.curves) {
        if (s === 0) { L.drawSprite(cv.sp, 0, 0); continue }
        const { sp, cols, fit, ok, P } = cv
        for (let X = 0; X < W; X++) {
          const raw = X - s, b = ((raw % P) + P) % P, j = Math.round((raw - b) / P), mMax = floor((W - 1 - b) / P)
          let x0 = -1
          for (let d = 0; d <= mMax + 2 && x0 < 0; d++) for (const sg of d ? [-1, 1] : [1]) { const m = clamp(j, 0, mMax) + sg * d; if (m < 0 || m > mMax) continue; const xx = b + m * P; if (xx < W && ok[xx]) { x0 = xx; break } }
          if (x0 < 0) continue
          const dy = round(fit(raw) - fit(x0))
          for (const kk of cols[x0]) L.px(X, sp.ys[kk] + dy, sp.cols[kk * 3], sp.cols[kk * 3 + 1], sp.cols[kk * 3 + 2])
        }
      }
      for (const p of L.packets) { const w = p.maxx - p.minx + 1; L.drawSprite(p, mod(p.minx + s + w, W + w) - w - p.minx, 0) }
      chase(L, t, K, 4, 316, 158, 8, [140, 230, 255], 8, 5)
    },
  })

  // ================================================================ 14 THE GREAT EMPTY

  // ================================================================ 15 NUCLEUS CITY

  // ================================================================ 19 RIPPLE SEA
  def(18, {
    setup(L) {
      const CX = 83, CY = 52, RY = 0.56
      L.rho = (x, y) => Math.sqrt((x - CX) * (x - CX) + ((y - CY) / RY) * ((y - CY) / RY))
      L.rings = L.liftAll({ rect: [0, 15, 320, 136], pred: (r, g, b, x, y) => lumOf(r, g, b) > 62 && L.rho(x, y) >= 40 })
      L.on = new Uint8Array(W * 180); L.rc = new Uint8Array(W * 180 * 3)
      for (let k = 0; k < L.rings.n; k++) { const p = L.rings.ys[k] * W + L.rings.xs[k]; L.on[p] = 1; L.rc[p * 3] = L.rings.cols[k * 3]; L.rc[p * 3 + 1] = L.rings.cols[k * 3 + 1]; L.rc[p * 3 + 2] = L.rings.cols[k * 3 + 2] }
    },
    draw(L, t, K) {
      const G = 22, T = 11, s = G * mod(K * t / T, 1)
      if (s === 0) { L.drawSprite(L.rings, 0, 0); return }
      const a = s / G, CX = 83, CY = 52, o = L.out
      const at = (x, y, rho, rr) => { const f = rr / rho, sx = round(CX + (x - CX) * f), sy = round(CY + (y - CY) * f); if (sx < 0 || sy < 15 || sx >= W || sy > 136) return -1; const p = sy * W + sx; return L.on[p] ? p : -1 }
      for (let y = 15; y <= 136; y++) for (let x = 0; x < W; x++) {
        const rho = L.rho(x, y); if (rho < 40) continue
        const i = (y * W + x) * 4
        if (rho < 62) { const p = y * W + x; if (L.on[p]) { o[i] = L.rc[p * 3]; o[i + 1] = L.rc[p * 3 + 1]; o[i + 2] = L.rc[p * 3 + 2] } continue }   // the black holes and the first ring stay as they are
        const fade = smooth((rho - 62) / 6), pa = at(x, y, rho, rho - s), pb = at(x, y, rho, rho + (G - s)), wa = (1 - a) * fade, wb = a * fade   // new rings fade in as they leave the first ring
        if (pa < 0 && pb < 0) continue
        if (pa >= 0) { o[i] += (L.rc[pa * 3] - o[i]) * wa; o[i + 1] += (L.rc[pa * 3 + 1] - o[i + 1]) * wa; o[i + 2] += (L.rc[pa * 3 + 2] - o[i + 2]) * wa }
        if (pb >= 0) { o[i] += (L.rc[pb * 3] - o[i]) * wb; o[i + 1] += (L.rc[pb * 3 + 1] - o[i + 1]) * wb; o[i + 2] += (L.rc[pb * 3 + 2] - o[i + 2]) * wb }
      }
    },
  })

  // ================================================================ 20 COLLISION HALL
  def(19, {
    setup(L) { L.tracks = L.liftAll({ rect: [78, 42, 160, 124], pred: (r, g, b) => sat(r, g, b) > 100 && lumOf(r, g, b) > 120 }) },
    draw(L, t, K) {
      const k = Math.min(1, K), CX = 118, CY = 80, p = mod(t, 7)
      const R = clamp(p * 75, 0, 130), fade = p < 4.6 ? 1 : p < 5.8 ? 1 - 0.85 * smooth((p - 4.6) / 1.2) : 0.15 + 0.85 * 0
      const reveal = k > 0 ? R : 1e9
      L.drawSpriteMap(L.tracks, 0, 0, (r, g, b, x, y, c) => { const rho = hypot(x - CX, y - CY); if (rho > reveal) return false; const a = k > 0 ? Math.max(0.15, 1 - (1 - fade) * k) : 1; c[0] = r * a; c[1] = g * a; c[2] = b * a })
      for (let y = 38; y <= 139; y++) for (let x = 14; x <= 222; x++) {
        const dx = x - CX, dy = y - CY, rho = Math.sqrt(dx * dx + dy * dy)
        if (rho < 28 || rho > 100) continue
        const i = (y * W + x) * 4; if (lumOf(L.out[i], L.out[i + 1], L.out[i + 2]) < 70) continue
        const dir = rho < 52 ? 1 : rho < 70 ? -1 : rho < 86 ? 1 : -1
        let f = 1 + 0.15 * k * sin(8 * atan2(dy, dx) + dir * t * 0.6)
        if (R < 120) f += 0.7 * k * exp(-(((rho - R) / 7) ** 2))
        L.mul(x, y, f)
      }
      L.wash(CX, CY, 34, [230, 248, 255], 0.5 * k * exp(-p * 3.5))
      chase(L, t, K, 4, 316, 155, 12, [255, 220, 90], 5, 4)
    },
  })

  // ================================================================ 21 PLANCK FOAM (the special one)
  def(35, {
    setup(L) {
      L.bub = L.lift({ rect: [0, 15, 320, 141], pred: (r, g, b) => sat(r, g, b) > 60 && lumOf(r, g, b) > 90, minArea: 6, keep: (c) => c.w <= 100 && c.h <= 100 })
      L.grid = L.liftAll({ rect: [0, 112, 319, 179], pred: (r, g, b) => g > 120 && b > 170 && r < 140 })
    },
    draw(L, t, K) {
      const k = Math.min(1, K), CX = 167, CY = 92
      L.bub.forEach((s, i) => {
        const w = 0.4 + hash(i, 1, 3) * 0.5, ph = hash(i, 2, 3) * TAU
        const mix = 0.55 * k * (1 - sin(t * w + ph)) / 2
        L.drawSprite(s, round(K * 2.2 * sin(t * 0.33 + ph)), round(K * 2.2 * sin(t * 0.27 + ph * 1.7)), 1, [110, 90, 190], mix)
      })
      L.drawSpriteMap(L.grid, 0, 0, (r, g, b, x, y, c) => { const s = exp(-(((mod(y + t * 16, 40) - 4) / 5) ** 2)) * k; c[0] = r + (230 - r) * s * 0.5; c[1] = g + (255 - g) * s * 0.5; c[2] = b + (255 - b) * s * 0.5 })
      const Rw = mod(t * 38, 300)
      for (let y = 15; y <= 140; y++) for (let x = 0; x < W; x++) {
        const dx = x - CX, dy = (y - CY) * 1.15, rho = Math.sqrt(dx * dx + dy * dy)
        const s = exp(-(((rho - Rw) / 18) ** 2)) * (1 - Rw / 300)
        if (s > 0.02) L.mul(x, y, 1 + 0.4 * k * s)
        if (rho < 120) { const r2 = 0.06 * k * (0.5 + 0.5 * sin(7 * atan2(dy, dx) + t * 0.35)) * exp(-rho / 50); if (r2 > 0.004) L.add(x, y, 210, 200, 255, r2) }
      }
      L.wash(CX, CY, 34, [255, 245, 255], 0.35 * k * (0.7 + 0.3 * sin(t * 1.2)))
      const pal = [[120, 235, 255], [255, 150, 210], [255, 255, 255], [255, 215, 120]]
      // pairs of tiny particles pop into being, drift apart and vanish
      const per = 0.45, base = floor(t / per)
      for (let idx = base - 5; idx <= base; idx++) {
        const u = (t - idx * per) / (5 * per); if (u < 0 || u > 1) continue
        const ox = 14 + hash(idx, 1, 31) * 292, oy = 18 + hash(idx, 2, 31) * 112, ha = hash(idx, 3, 31) * TAU, sep = 2 + 10 * smooth(u)
        const col = pal[floor(hash(idx, 4, 31) * 4)], a = Math.pow(sin(Math.PI * u), 1.5) * k
        for (const sg of [1, -1]) { const px = ox + sg * cos(ha) * sep, py = oy + sg * sin(ha) * sep; Fx.orb(L, px, py, 4, col, 0.45 * a); Fx.star(L, px, py, col, 0.95 * a) }
      }
      // new bubbles are born: a small ring grows, thins out and fades
      const bper = 0.8, bb = floor(t / bper)
      for (let idx = bb - 4; idx <= bb; idx++) {
        const u = (t - idx * bper) / (5 * bper); if (u < 0 || u > 1) continue
        const ox = 20 + hash(idx, 5, 41) * 280, oy = 24 + hash(idx, 6, 41) * 100, r = 2 + 15 * (1 - (1 - u) * (1 - u)), a = sin(Math.PI * u) * 0.9 * k, col = pal[floor(hash(idx, 7, 41) * 4)]
        L.ring(ox, oy, round(r), col, a)
        if (r > 7) L.ring(ox, oy, round(r * 0.6), col, a * 0.5)
      }
    },
  })
}

// ======================================================================================================================
// Helpers of the chosen designs
{
  const variant = (slot, o) => { chosen[slot] = o }
  Motion.variant = variant
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
}

// ======================================================================================================================
// Worlds 8, 11 and 12 (the designs chosen from three)
{
  const { helpers: H, vh, variant, all } = Motion
  const { hash, sat, chase, motes } = H
  const { lumOf, smooth, frac, bounds, twSetup, twDraw, light } = vh
  const { clamp, mod } = Engine
  const W = 320, TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, abs = Math.abs, round = Math.round, floor = Math.floor, exp = Math.exp, atan2 = Math.atan2
  const disc = (cx, cy, rr) => (r, g, b, x, y) => (x - cx) * (x - cx) + (y - cy) * (y - cy) <= rr * rr

  // ================================================================ 7 BACTERIA GARDEN
  const RODS = [[88, 12, 132, 38], [150, 18, 186, 42], [230, 14, 272, 48], [255, 36, 302, 68], [28, 68, 88, 108], [138, 68, 188, 98], [183, 103, 238, 130]]

  // ================================================================ 8 GERM REEF
  variant(7, {
    setup(L) {
      L.virus = L.liftAll({ rect: [128, 14, 172, 56], pred: disc(150, 34.5, 18.5) })
      L.tail = bounds(L.liftAll({ rect: [0, 146, 112, 180], pred: (r, g, b) => (r + g + b) / 3 > 150 && sat(r, g, b) > 20 }))
      L.hairs = L.liftAll({ rect: [140, 122, 304, 141], pred: (r, g, b) => r > 190 && g > 200 && b > 190 })
      L.tw = twSetup(L, [0, 15, 320, 135], (r, g, b) => r > 190 && g > 170 && b > 210)
    },
    draw(L, t, K) {
      L.drawSprite(L.virus, round(K * 1.6 * sin(t * 0.3)), round(K * 1.4 * sin(t * 0.23 + 1)))
      L.drawSpriteWarp(L.tail, (x, y, v) => { v.y = K * 1.6 * sin(x * 0.12 - t * 1.8) })
      L.drawSpriteWarp(L.hairs, (x, y, v) => { v.x = K * 1.0 * ((141 - y) / 18) * sin(t * 0.9 + x * 0.12) })
      twDraw(L, L.tw, t, K)
    },
  })

  // ================================================================ 9 PROTEIN FACTORY
  const orange = (r, g, b) => r > 150 && r > g + 30 && g > b + 25 && b < 130

  // ================================================================ 10 DNA FOREST
  const kind = (r, g, b) => (r > 170 && g > 140 && b < 120 ? 0 : g > 140 && r < 150 && b < 160 && g > b - 10 && g > r + 40 ? 1 : r < 120 && g > 150 && b > 170 ? 2 : r > 180 && g < 120 && b < 140 ? 3 : -1)

  // ================================================================ 11 CRYSTAL LATTICE
  const hiSetup = (L) => { L.hi = [L.liftAll({ rect: [0, 70, 320, 180], pred: (r, g, b) => r > 245 && g > 245 && b > 245 })] }
  variant(10, {
    setup() {},
    draw(L, t, K) {
      const k = Math.min(1, K), rows = [[84, 0.4], [96, 0.55], [112, 0.75], [133, 1], [160, 1.3]]
      rows.forEach(([y, sc], ri) => {
        for (let i = 0; i < 5; i++) {
          const dir = ri % 2 ? -1 : 1, x = mod(hash(i, ri, 27) * 340 + dir * t * 34 * sc, 340) - 10, yy = y + 1.5 * sin(t * 2 + i + ri)
          Fx.orb(L, x, yy, round(2 + 2.5 * sc), [255, 250, 190], 0.55 * k); Fx.star(L, x, yy, [255, 255, 255], 0.95 * k)
        }
      })
    },
  })

  // ================================================================ 12 ELECTRON CLOUDS
  const CX = 96, CY = 77
  const petalW = (L, x, y) => { const i = (y * W + x) * 4; return smooth((lumOf(L.cur[i], L.cur[i + 1], L.cur[i + 2]) - 42) / 40) }
  const eachPetalPixel = (L, f) => { for (let y = 18; y <= 126; y++) for (let x = 20; x <= 172; x++) { const dx = x - CX, dy = y - CY, rho = Math.sqrt(dx * dx + dy * dy); if (rho < 9 || rho > 78) continue; const w = petalW(L, x, y); if (w > 0) f(x, y, rho, dx, dy, w) } }
  variant(11, {
    setup(L) {
      L.pts = []
      for (let y = 18; y <= 126; y++) for (let x = 20; x <= 172; x++) { const i = (y * W + x) * 4, d = Math.hypot(x - CX, y - CY); if (d > 10 && d < 76 && lumOf(L.base[i], L.base[i + 1], L.base[i + 2]) > 85) L.pts.push(x, y) }
    },
    draw(L, t, K) {
      const k = Math.min(1, K), n = L.pts.length / 2
      eachPetalPixel(L, (x, y, rho, dx, dy, w) => L.mul(x, y, 1 + 0.25 * k * w * sin(t * 1.0 - atan2(dy, dx))))
      for (let i = 0; i < 80 && n; i++) {
        const per = 1.1 + hash(i, 1, 7) * 1.6, q = (t + hash(i, 2, 7) * per) / per, cyc = floor(q), a = Math.pow(sin(Math.PI * (q - cyc)), 2) * k, j = floor(hash(i, cyc, 8) * n) * 2
        if (i % 3 === 0) Fx.star(L, L.pts[j], L.pts[j + 1], [255, 255, 255], 0.95 * a); else Fx.dot(L, L.pts[j], L.pts[j + 1], [255, 255, 255], 0.95 * a)
      }
      L.wash(CX, CY, 16, [255, 255, 255], 0.4 * K * (0.6 + 0.4 * sin(t * 1.1)))
      chase(L, t, K, 143, 312, 144, 12, [150, 255, 255], 4, 3)
    },
  })
}

// ======================================================================================================================
// Worlds 13 to 15, 18 and 19 (the designs chosen from three)
{
  const { helpers: H, vh, variant, all } = Motion
  const { hash, sat, chase } = H
  const { lumOf, smooth, frac, angDiff, bounds, twSetup, twDraw, blendSprite, light } = vh
  const { clamp, mod } = Engine
  const W = 320, TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, abs = Math.abs, round = Math.round, floor = Math.floor, exp = Math.exp, atan2 = Math.atan2, hypot = Math.hypot
  const toWhite = (c, r, g, b, s) => { c[0] = r + (255 - r) * s; c[1] = g + (255 - g) * s; c[2] = b + (255 - b) * s }

  // ================================================================ 13 GAMMA SEA
  /** one wave drawn s pixels further along (the same method as design A) */
  function scrollCurve(L, cv, s) {
    if (s === 0) { L.drawSprite(cv.sp, 0, 0); return }
    const { sp, cols, fit, ok, P } = cv
    for (let X = 0; X < W; X++) {
      const raw = X - s, b = ((raw % P) + P) % P, j = Math.round((raw - b) / P), mMax = floor((W - 1 - b) / P)
      let x0 = -1
      for (let d = 0; d <= mMax + 2 && x0 < 0; d++) for (const sg of d ? [-1, 1] : [1]) { const m = clamp(j, 0, mMax) + sg * d; if (m < 0 || m > mMax) continue; const xx = b + m * P; if (xx < W && ok[xx]) { x0 = xx; break } }
      if (x0 < 0) continue
      const dy = round(fit(raw) - fit(x0))
      for (const kk of cols[x0]) L.px(X, sp.ys[kk] + dy, sp.cols[kk * 3], sp.cols[kk * 3 + 1], sp.cols[kk * 3 + 2])
    }
  }
  const packetGlow = (L, t, K) => L.packets.forEach((p, i) => L.drawSprite(p, 0, 0, 1, [120, 220, 255], 0.35 * Math.min(1, K) * (0.5 - 0.5 * sin(t * 1.5 + i * 1.1))))
  variant(12, {
    setup(L) { all[12].setup(L) },
    draw(L, t, K) {
      const s = floor(K * 9 * t)
      L.curves.forEach((cv, ci) => scrollCurve(L, cv, ci % 2 ? -s : s))
      packetGlow(L, t, K)
      chase(L, t, K, 4, 316, 158, 8, [140, 230, 255], 8, 5)
    },
  })

  // ================================================================ 14 THE GREAT EMPTY
  const sunBreath = (L, t, K) => { const k = Math.min(1, K); for (let y = 38; y <= 88; y++) for (let x = 38; x <= 92; x++) if ((x - 65) ** 2 + (y - 62.5) ** 2 <= 484) L.mul(x, y, 1 + 0.14 * k * sin(t * 1.0)); L.wash(65, 62.5, 20, [255, 200, 120], 0.22 * K * (0.6 + 0.4 * sin(t * 1.0))) }
  const lightsPulse = (L, t, K) => { L.wash(57, 25.5, 11, [120, 170, 255], 0.35 * K * (0.5 + 0.5 * sin(t * 1.4))); L.wash(204, 103, 11, [120, 170, 255], 0.35 * K * (0.5 + 0.5 * sin(t * 1.4 + 2))) }
  const starPred = (r, g, b) => r > 200 && g > 200 && b > 220
  variant(13, {
    setup(L) { L.stars = L.liftAll({ rect: [0, 15, 320, 135], pred: (r, g, b, x, y) => starPred(r, g, b) && (x - 57) ** 2 + (y - 25.5) ** 2 > 196 && (x - 204) ** 2 + (y - 103) ** 2 > 196 && (x - 65) ** 2 + (y - 62.5) ** 2 > 676 }) },
    draw(L, t, K) {
      sunBreath(L, t, K); lightsPulse(L, t, K)
      const dx = floor(K * t * 3) % W
      L.drawSprite(L.stars, dx, 0); if (dx) L.drawSprite(L.stars, dx - W, 0)
    },
  })

  // ================================================================ 15 NUCLEUS CITY
  const GL = [[84, 21], [122, 24], [105, 35], [77, 40], [58, 54], [82, 60], [135, 59], [115, 68], [63, 78], [142, 91], [118, 95], [69, 104], [88, 103]]
  variant(14, {
    setup(L) {
      L.pairs = []
      for (let i = 0; i < GL.length; i++) for (let j = i + 1; j < GL.length; j++) if (hypot(GL[i][0] - GL[j][0], GL[i][1] - GL[j][1]) < 36) L.pairs.push([i, j])
      L.hi = [L.liftAll({ rect: [176, 15, 320, 138], pred: (r, g, b) => r > 245 && g > 245 && b > 245 })]
    },
    draw(L, t, K) {
      const k = Math.min(1, K)
      light(L, 30, 8, 175, 138, 50, (x, y) => ((x - 103) ** 2 + (y - 73) ** 2 < 5500 ? 1 + 0.12 * k * sin(0.06 * (x + 0.6 * y) - t * 0.9) : 1))
      L.pairs.forEach(([i, j], n) => {
        const per = 2.6 + hash(n, 1, 35) * 3.2, u = frac((t + hash(n, 2, 35) * per) / per) / 0.14; if (u >= 1) return
        const a = sin(Math.PI * u) * k, p = GL[i], q = GL[j]
        Fx.line(L, p[0] + 5, p[1] + 6, q[0] + 5, q[1] + 6, [255, 255, 215], 0.85 * a); Fx.star(L, p[0] + 5, p[1] + 6, [255, 255, 255], a); Fx.star(L, q[0] + 5, q[1] + 6, [255, 255, 255], a)
      })
      twDraw(L, L.hi, t, K, 0.7)
      chase(L, t, K, 132, 312, 146, 14, [255, 210, 255], 4, 3)
    },
  })

  // ================================================================ 16 INSIDE THE PROTON
  const stringPred = (r, g, b) => (r > 225 && g < 150 && b > 130 && b < 205) || (r > 235 && g > 200 && b < 130)
  const QUARKS = [[67, 60, [255, 90, 90]], [262, 53, [110, 150, 255]], [212, 168, [110, 255, 150]]]

  // ================================================================ 17 FIRST QUARKS
  const beamPred = (r, g, b) => r < 150 && g > 190 && b > 225
  /** where the beams meet (the leftmost beam pixel) and where the two beams end */
  function beamPoints(L) {
    let ap = [999, 0], e1 = [0, 999], e2 = [0, -1]
    for (let y = 36; y <= 142; y++) for (let x = 96; x <= 262; x++) { const i = (y * W + x) * 4; if (!beamPred(L.base[i], L.base[i + 1], L.base[i + 2])) continue; if (x < ap[0]) ap = [x, y]; if (y < e1[1]) e1 = [x, y]; if (x > 180 && y > e2[1]) e2 = [x, y] }
    L.ap = ap; L.e1 = e1; L.e2 = e2[1] < 0 ? e1 : e2
  }

  // ================================================================ 18 SHORT REACH
  variant(17, {
    setup(L) { all[17].setup(L) },
    draw(L, t, K) {
      const k = Math.min(1, K)
      L.rings.forEach((s, i) => {
        L.drawSprite(s, 0, 0)
        const per = 4 + hash(i, 1, 45) * 7, q = (t + hash(i, 2, 45) * per) / per, cyc = floor(q), u = (q - cyc) / 0.2; if (u >= 1) return
        const ang = hash(i, cyc, 46) * TAU, d = 3 + 14 * u, a = (1 - u) * k
        Fx.star(L, s.cx + cos(ang) * d, s.cy + sin(ang) * d, [160, 225, 255], a); Fx.star(L, s.cx - cos(ang) * d, s.cy - sin(ang) * d, [255, 240, 150], a)
      })
      chase(L, t, K, 132, 318, 145, 14, [255, 190, 150], 4, 3)
    },
  })

  // ================================================================ 19 RIPPLE SEA
  variant(18, {
    setup(L) { L.grid = L.liftAll({ rect: [0, 143, 319, 179], pred: (r, g, b) => g > 120 && b > 160 && r < 130 }); all[18].setup(L) },
    draw(L, t, K) {
      const k = Math.min(1, K)
      all[18].draw(L, t, K)
      L.drawSpriteMap(L.grid, 0, 0, (r, g, b, x, y, c) => toWhite(c, r, g, b, 0.5 * k * exp(-(((mod(y - t * 10, 30) - 3) / 4) ** 2))))
    },
  })

  // ================================================================ 20 COLLISION HALL

  // ================================================================ 21 PLANCK FOAM
  const PAL = [[120, 235, 255], [255, 150, 210], [255, 255, 255], [255, 215, 120]]
}

// ======================================================================================================================
// World 9 (whole floating spheres) and world 10 (the helices turn)
{
  const { helpers: H, vh, variant, all } = Motion
  const { sat, motes } = H
  const { lumOf, smooth, twSetup, twDraw } = vh
  const { clamp, mod } = Engine
  const W = 320, sin = Math.sin, cos = Math.cos, round = Math.round, floor = Math.floor

  // ================================================================ 9 PROTEIN FACTORY, design C: whole spheres
  /* The spheres are painted again with the rules of the art source (art3.py, w8), so each one is a complete ball even where the chain of beads
   * crosses it or the membrane hides it. Painting order of the original: far pair, chain of beads, near pair (the ribosome), then the membrane. */
  const LIL = Art.ramp('#2a1a58', '#5a3ab0', '#9a78f0', '#d8c8ff'), TEA = Art.ramp('#0a3a48', '#1a7a88', '#46c0c8', '#c0fcff'), CRATER = Art.ramp('#3a2a80', '#7a58d0', '#b898ff', '#ece0ff')
  /** the painted pixels of a buffer as a sprite */
  function spriteOf(buf, y1 = 179) { const xs = [], ys = [], cols = []; for (let y = 0; y <= y1; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (buf[i + 3]) { xs.push(x); ys.push(y); cols.push(buf[i], buf[i + 1], buf[i + 2]) } } return { xs: Int16Array.from(xs), ys: Int16Array.from(ys), cols: Uint8Array.from(cols), n: xs.length } }
  variant(8, {
    setup(L) {
      const far = Art.blank(), near = Art.blank(), beads = Art.blank(), dusk = Art.rgb('#240a38')
      Art.sphere(far, 276, 76, 26, Art.haze(LIL, dusk, 0.5), true); Art.sphere(far, 272, 40, 17, Art.haze(TEA, dusk, 0.5), true)
      for (let x = -6; x < W + 8; x += 5) Art.sphere(beads, x, 62 + Math.sin(x * 0.06) * 9, 3, Art.ramp('#6a2a00', '#c8661a', '#ffa850', '#ffe0a8'))
      Art.sphere(near, 96, 104, 40, LIL, true); Art.sphere(near, 88, 52, 28, TEA, true)
      for (const [x, y, r] of [[70, 92, 8], [112, 118, 9], [104, 88, 6], [80, 120, 6]]) Art.sphere(near, x, y, r, CRATER, true)
      const FLOOR = 138   // the membrane starts here and hides what is below
      const inNear = (p) => near[p * 4 + 3] && ((p / W) | 0) < FLOOR, inAny = (p) => far[p * 4 + 3] || beads[p * 4 + 3] || inNear(p)
      // cut all three out of the background at once, so the gaps are filled with real background
      L.liftGroups([{ rect: [0, 0, 319, FLOOR - 1], pred: (r, g, b, x, y) => inAny(y * W + x) }])
      L.far = spriteOf(far); L.near = spriteOf(near)
      // the beads: as the picture shows them where they can be seen, as painted where the near pair hides them
      for (let p = 0; p < W * FLOOR; p++) if (beads[p * 4 + 3] && !inNear(p)) { beads[p * 4] = L.base[p * 4]; beads[p * 4 + 1] = L.base[p * 4 + 1]; beads[p * 4 + 2] = L.base[p * 4 + 2] }
      L.beads = spriteOf(beads, FLOOR - 1)
      // whatever the picture has in front of a sphere (stars, the beads over the far pair, the worm) stays in front
      const front = (buf, ok) => { const out = []; for (let p = 0; p < W * FLOOR; p++) if (buf[p * 4 + 3] && ok(p) && (buf[p * 4] !== L.base[p * 4] || buf[p * 4 + 1] !== L.base[p * 4 + 1] || buf[p * 4 + 2] !== L.base[p * 4 + 2])) out.push(p * 4); return Int32Array.from(out) }
      L.frontFar = front(far, (p) => !inNear(p)); L.frontNear = front(near, () => true)
      L.FLOOR = FLOOR
      L.tw = twSetup(L, [0, 15, 320, 135], (r, g, b) => r > 235 && g > 235 && b > 235)
    },
    draw(L, t, K) {
      const o = L.out, keep = (list) => { for (let n = 0; n < list.length; n++) { const i = list[n]; o[i] = L.base[i]; o[i + 1] = L.base[i + 1]; o[i + 2] = L.base[i + 2] } }
      L.drawSprite(L.far, 0, round(K * 2 * sin(t * 0.45 + 3)))
      L.drawSprite(L.beads, 0, 0); keep(L.frontFar)
      L.drawSpriteMap(L.near, 0, round(K * 2 * sin(t * 0.5)), (r, g, b, x, y) => y < L.FLOOR)
      keep(L.frontNear)
      motes(L, t, K, { n: 18, rect: [0, 18, 320, 132], rise: 5, sway: 0.5, amp: 4, color: [255, 215, 240], alpha: 0.65, seed: 9, big: 3 })
      twDraw(L, L.tw, t, K)
    },
  })

  // ================================================================ 10 DNA FOREST: the helices spiral
  /* The picture was made by code (tools/art-source/art/art3.py, w9). src/dna.js is a port of it that reproduces the original pixel for pixel, so each
   * helix can simply be drawn again turned by an angle: a true rotation (the beads swing round, the rungs shorten, cross and lengthen), not a trick.
   * The stars and the small object by the player are not part of the helices: they are kept from the original, on top. */
  const TAU = Math.PI * 2
  function dnaSetup(L) {
    L.sky = Dna.background()
    const o = new Uint8ClampedArray(L.sky); Dna.helices(o, null)
    const keep = []
    for (let y = 0; y < 140; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (o[i] !== L.base[i] || o[i + 1] !== L.base[i + 1] || o[i + 2] !== L.base[i + 2]) keep.push(i) }
    L.keep = Int32Array.from(keep)
    L.turn = new Float64Array(7)
  }
  /** periods[i]: seconds for one full turn of helix i (negative turns the other way, 0 keeps it still) */
  function dnaDraw(L, t, K, periods) {
    let any = false
    for (let i = 0; i < 7; i++) { L.turn[i] = periods[i] ? K * t * TAU / periods[i] : 0; if (L.turn[i]) any = true }
    if (!any) return
    const o = L.out
    o.set(L.sky.subarray(0, 140 * W * 4))
    Dna.helices(o, L.turn)
    for (let n = 0; n < L.keep.length; n++) { const i = L.keep[n]; o[i] = L.base[i]; o[i + 1] = L.base[i + 1]; o[i + 2] = L.base[i + 2] }
    // the floor starts at row 140: the helices never paint below it
    o.set(L.base.subarray(140 * W * 4), 140 * W * 4)
  }
  // the helices in painting order: x = 12, 58, 110, 276, 312 (far ones), 150 and 254 (the two near ones). Neighbours turn in opposite directions.
  variant(9, { setup: dnaSetup, draw(L, t, K) { dnaDraw(L, t, K, [16, -15, 14, -14, 16, -11, 12]) } })
}

/** the design of a picture slot (0 to 35), if it has one */
export function designFor(slot: number): { setup(L: any): void; draw(L: any, t: number, K: number): void } | undefined {
  if (slot >= 20 && slot <= 34) return Motion.all.void
  return chosen[slot] || Motion.all[slot]
}

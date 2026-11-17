/* The motion of every world (draft). Each entry has setup(L) (cut objects out of the picture once) and draw(L, t, K) (draw one frame at time t seconds;
 * K is the LIFE amount, 1 = the draft). Positions are in the picture's own pixels (320 x 180); the game cuts off the top 15 rows. */
(function () {
  'use strict'
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
    name: 'THE ROOM', desc: 'Start here. A quiet evening room, and you at normal size.',
    moves: ['The stars in the window twinkle, and a few city windows blink off and on.', 'The lamp breathes: its warm halo swells and shrinks a little, and dust drifts through its light.', 'Steam curls up from the mug.', 'The carpet fibres lean in a slow draught.'],
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
    name: 'THE BOOKSHELF', desc: 'Book spines stand like tall walls, with gold lettering on every one.',
    moves: ['A slow shimmer of light sweeps across the gold lettering.', 'The coloured haze above the books drifts and breathes.', 'Dust floats in the light.', 'The carpet fibres lean.'],
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
    name: 'THE PILE', desc: 'Each carpet tuft is a tower, and a crumb lies like a fallen log.',
    moves: ['The tips of the tufts lean and sway softly, each on its own beat.', 'The warm light above breathes.', 'A few dust specks float up through the haze.'],
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
    name: 'YARN ROPES', desc: 'Strands of yarn rise as thick twisted ropes. A dust ball rolls past.',
    moves: ['The golden specks of dust drift and bob between the ropes.', 'The little curls of loose fibre wiggle.', 'The ropes shimmer as if they were slowly twisting.'],
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
    name: 'THREAD FOREST', desc: 'Fabric fibres rise like cables. Specks of dust drift by like moons.',
    moves: ['The golden dust "moons" drift slowly, each on its own path.', 'Loose fibres wave.', 'The small drop on the floor catches a glint of light.'],
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

  // ---------------------------------------------------------------- the registry
  const DEFAULT = { name: '?', desc: '', moves: ['(not drafted yet)'], setup() {}, draw() {} }
  const NAMES = ['THE ROOM', 'THE BOOKSHELF', 'THE PILE', 'YARN ROPES', 'THREAD FOREST', 'DROPLET WORLD', 'BACTERIA GARDEN', 'GERM REEF', 'PROTEIN FACTORY', 'DNA FOREST', 'CRYSTAL LATTICE', 'ELECTRON CLOUDS', 'GAMMA SEA', 'THE GREAT EMPTY', 'NUCLEUS CITY', 'INSIDE THE PROTON', 'FIRST QUARKS', 'SHORT REACH', 'RIPPLE SEA', 'COLLISION HALL']
  window.Motion = {
    forSlot(slot) {
      if (slot >= 20 && slot <= 34) return M.void || Object.assign({}, DEFAULT, { name: 'UNEXPLORED' })
      return M[slot] || Object.assign({}, DEFAULT, { name: NAMES[slot] || (slot === 35 ? 'PLANCK FOAM' : '?') })
    },
    all: M,
    def,
    helpers: { eq, anyOf, hash, rgb, fibresSetup, fibresDraw, motes, chase, gold, isWhite: (r, g, b) => r > 215 && g > 215 && b > 215, isOrange: (r, g, b) => r > 200 && g > 100 && g < 190 && b < 110,
      isCyan: (r, g, b) => r < 130 && g > 180 && b > 200, isPink: (r, g, b) => r > 200 && g < 150 && b > 110 && b < 215 && r - g > 70, isGreen: (r, g, b) => g > 150 && r < 140 && b < 150 && g - r > 50,
      isBlue: (r, g, b) => b > 180 && r < 110 && g < 190 && b - r > 90, isRed: (r, g, b) => r > 150 && g < 100 && b < 110, sat: (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) },
  }
})()

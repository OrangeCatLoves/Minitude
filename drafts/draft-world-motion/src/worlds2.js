/* Worlds 6 to 10: the droplet, bacteria, germs, the protein factory and DNA. */
(function () {
  'use strict'
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
    name: 'DROPLET WORLD', desc: 'One drop of water, as big as a hill, with tiny life swimming inside.',
    moves: ['The bubbles inside the drop bob and drift.', 'The one-celled creatures swim slowly: the orange oval glides, the gold triangles drift, the cluster of green cells sways as one piece.', 'Light shimmers at the bottom of the drop.'],
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
  def(6, {
    name: 'BACTERIA GARDEN', desc: 'Rod-shaped cells lie like logs, and whip-like tails wave through the water.',
    moves: ['Every whip-like tail waves, and the big golden one ripples along its whole length.', 'The chain of green beads wobbles.', 'Specks in the water twinkle.'],
    setup(L) {
      L.flag = L.liftAll({ rect: [146, 15, 320, 72], pred: (r, g, b) => r > 235 && g > 150 && g < 205 && b < 100 })
      L.beads = L.lift({ rect: [30, 96, 150, 128], pred: (r, g, b) => g > 90 && b > 70 && r < 110 && g - r > 40, minArea: 6, grow: 1, fill: true })
      L.tw = twinkleSetup(L, [0, 15, 320, 138], (r, g, b) => r > 200 && g > 220 && b > 220)
      L.tails = tailsSetup(L, [0, 8, 320, 170], (r, g, b) => (r + g + b) / 3 > 100 && sat(r, g, b) > 25 && !(r > 235 && g > 150 && g < 205 && b < 100))
    },
    draw(L, t, K) {
      L.drawSpriteWarp(L.flag, (x, y, v) => { v.y = K * 2.2 * sin(x * 0.17 - t * 2.8) })
      L.beads.forEach((s, i) => L.drawSprite(s, 0, round(K * 1.4 * sin(t * 1.2 + i * 0.8))))
      tailsDraw(L, L.tails, t, K)
      twinkleDraw(L, L.tw, t, K)
    },
  })

  // ================================================================ 8 GERM REEF
  def(7, {
    name: 'GERM REEF', desc: 'Bacteria loom like islands. Viruses drift past like landers.',
    moves: ['The spiky virus drifts gently, as one piece (it no longer turns).', 'The legs of the bacteriophage sway a little.', 'The tiny hairs on the green bacterium sway a little.', 'The wavy tail at the bottom left ripples.', 'Stars twinkle softly.'],
    setup(L) {
      L.virus = L.lift({ rect: [120, 4, 194, 72], pred: (r, g, b) => r - g > 55 && b - g > 20, minArea: 80, grow: 1, fill: true })
      L.legs = L.liftAll({ rect: [36, 84, 82, 106], pred: (r, g, b) => r - g > 50 })
      L.hairs = L.liftAll({ rect: [140, 122, 304, 141], pred: (r, g, b) => r > 190 && g > 200 && b > 190 })
      L.tw = twinkleSetup(L, [0, 15, 320, 135], (r, g, b) => r > 190 && g > 170 && b > 210); L.tail = tailsSetup(L, [0, 146, 112, 180], (r, g, b) => (r + g + b) / 3 > 150 && sat(r, g, b) > 20, 9)
    },
    draw(L, t, K) {
      L.virus.forEach((s) => L.drawSprite(s, round(K * 1.4 * sin(t * 0.3)), round(K * 1.4 * sin(t * 0.23 + 1))))
      L.drawSpriteWarp(L.legs, (x, y, v) => { v.x = K * 1.0 * ((y - 84) / 22) * sin(t * 1.0 + y * 0.3) })
      L.drawSpriteWarp(L.hairs, (x, y, v) => { v.x = K * 1.0 * ((141 - y) / 18) * sin(t * 0.9 + x * 0.12) })
      tailsDraw(L, L.tail, t, K, 2.2, 2.4)
      twinkleDraw(L, L.tw, t, K)
    },
  })

  // ================================================================ 9 PROTEIN FACTORY
  def(8, {
    name: 'PROTEIN FACTORY', desc: 'Ribosomes bob along a chain of beads, building proteins.',
    moves: ['A wave runs along the chain of orange beads.', 'The membrane below breathes: its golden heads rise and fall in a ripple.', 'The little coloured beads of the new protein wiggle.', 'The big teal sphere floats a little, as one whole piece.'],
    setup(L) {
      L.ball = L.lift({ rect: [48, 14, 124, 90], pred: (r, g, b) => g > r + 30 && b > r + 25 && g > 60, minArea: 250, grow: 1, fill: true })   // the big teal sphere, first, as one whole disc
      const orange = (r, g, b) => r > 150 && r > g + 30 && g > b + 25 && b < 130
      L.chain = L.liftAll({ rect: [0, 44, 320, 82], pred: orange, grow: 1 })
      L.heads = L.liftAll({ rect: [0, 136, 320, 152], pred: orange, grow: 1 })
      L.heads2 = L.liftAll({ rect: [0, 166, 320, 180], pred: orange, grow: 1 })
      L.protein = L.lift({ rect: [122, 120, 170, 141], pred: (r, g, b) => sat(r, g, b) > 110, minArea: 4, grow: 1, fill: true })
      L.tw = twinkleSetup(L, [0, 15, 320, 135], (r, g, b) => r > 235 && g > 235 && b > 235)
    },
    draw(L, t, K) {
      L.drawSpriteWarp(L.chain, (x, y, v) => { v.y = K * 2.0 * sin(x * 0.045 - t * 0.9); v.x = K * 0.7 * sin(x * 0.045 - t * 0.9 + 1.4) })
      L.drawSpriteWarp(L.heads, (x, y, v) => { v.y = K * 1.2 * sin(x * 0.16 - t * 1.1) })
      L.drawSpriteWarp(L.heads2, (x, y, v) => { v.y = K * 1.2 * sin(x * 0.16 - t * 1.1 + 2.4) })
      L.protein.forEach((s, i) => L.drawSprite(s, round(K * 1.0 * sin(t * 1.0 + i * 1.1)), round(K * 1.0 * sin(t * 1.2 + i * 1.7))))
      L.ball.forEach((s) => L.drawSprite(s, round(K * 1.0 * sin(t * 0.4)), round(K * 1.4 * sin(t * 0.5 + 1))))
      twinkleDraw(L, L.tw, t, K)
    },
  })

  // ================================================================ 10 DNA FOREST
  /** the four kinds of rung colour, as (yellow, green, cyan, red) */
  const RUNG = [[226, 202, 60], [60, 202, 122], [60, 192, 232], [232, 72, 96]]
  const kind = (r, g, b) => (r > 170 && g > 140 && b < 120 ? 0 : g > 140 && r < 150 && b < 160 && g > b - 10 && g > r + 40 ? 1 : r < 120 && g > 150 && b > 170 ? 2 : r > 180 && g < 120 && b < 140 ? 3 : -1)
  def(9, {
    name: 'DNA FOREST', desc: 'Spiral towers with coloured rungs fill the horizon.',
    moves: ['Colour runs down the rungs of the helices, like information flowing along DNA.', 'A glint of light travels up the spiral strands.'],
    setup(L) {
      L.rungs = L.liftAll({ rect: [0, 15, 320, 139], pred: (r, g, b) => kind(r, g, b) >= 0 && sat(r, g, b) > 70 })
      L.strands = L.liftAll({ rect: [0, 15, 320, 139], pred: (r, g, b) => sat(r, g, b) > 55 && b > 120 && r > 70 && b >= g + 30 })
    },
    draw(L, t, K) {
      L.drawSpriteMap(L.strands, 0, 0, (r, g, b, x, y, c) => { const s = Math.max(0, sin(y * 0.1 + x * 0.02 - t * 2.4)) ** 6 * Math.min(1, K); c[0] = Math.min(255, r + 90 * s); c[1] = Math.min(255, g + 80 * s); c[2] = Math.min(255, b + 70 * s) })
      L.drawSpriteMap(L.rungs, 0, 0, (r, g, b, x, y, c) => {
        const k = kind(r, g, b); if (k < 0) return
        const shift = floor(Math.min(1, K) * (t * 0.9 + y / 26 + x / 90)) & 3
        if (shift === 0) return
        const p = RUNG[(k + shift) & 3]
        const f = Math.min(1.25, (0.299 * r + 0.587 * g + 0.114 * b) / (0.299 * RUNG[k][0] + 0.587 * RUNG[k][1] + 0.114 * RUNG[k][2]))
        c[0] = p[0] * f; c[1] = p[1] * f; c[2] = p[2] * f
      })
    },
  })
  const floor = Math.floor
})()

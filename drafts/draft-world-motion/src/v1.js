/* Designs A, B, C for worlds 7 to 12 (slots 6 to 11). */
(function () {
  'use strict'
  const { helpers: H, vh, variant, all } = Motion
  const { hash, sat, chase, motes } = H
  const { lumOf, smooth, frac, bounds, twSetup, twDraw, light } = vh
  const { clamp, mod } = Engine
  const Fx = window.Fx
  const W = 320, TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, abs = Math.abs, round = Math.round, floor = Math.floor, exp = Math.exp, atan2 = Math.atan2
  const disc = (cx, cy, rr) => (r, g, b, x, y) => (x - cx) * (x - cx) + (y - cy) * (y - cy) <= rr * rr

  // ================================================================ 7 BACTERIA GARDEN
  all[6].title = 'Waving whips'
  variant(6, 1, {
    title: 'Rising bubbles',
    moves: ['Small bubbles rise from the bottom and wobble on their way up.', 'The whips sway slowly.', 'Specks twinkle softly.'],
    setup(L) { all[6].setup(L) },
    draw(L, t, K) {
      const k = Math.min(1, K)
      L.drawSpriteWarp(L.flag, (x, y, v) => { v.y = K * 1.6 * sin(x * 0.17 - t * 1.5) })
      L.whips.forEach((s, i) => { const span = Math.max(10, s.maxx - s.minx); L.drawSpriteWarp(s, (x, y, v) => { v.y = K * (0.2 + 0.9 * clamp((x - s.minx) / span, 0, 1)) * sin((x - s.minx) * 0.3 - t * 1.2 + i * 1.3) }) })
      for (let i = 0; i < 16; i++) {
        const per = 6 + hash(i, 1, 21) * 5, u = frac((t + hash(i, 2, 21) * per) / per)
        const x = hash(i, 3, 21) * 320 + 3 * sin(t * 1.3 + i), y = 134 - u * 120, a = sin(Math.PI * u) * 0.8 * k
        L.ring(x, y, hash(i, 4, 21) < 0.4 ? 2 : 1, [190, 240, 255], a); Fx.dot(L, x - 1, y - 1, [255, 255, 255], a * 0.8)
      }
      twDraw(L, L.tw, t, K)
    },
  })
  const RODS = [[88, 12, 132, 38], [150, 18, 186, 42], [230, 14, 272, 48], [255, 36, 302, 68], [28, 68, 88, 108], [138, 68, 188, 98], [183, 103, 238, 130]]
  variant(6, 2, {
    title: 'Living glow',
    moves: ['A wave of light rolls through the carpet of cells at the bottom.', 'The rod-shaped cells glow one after another.', 'Nothing changes place.'],
    setup(L) { L.tw = twSetup(L, [0, 15, 320, 132], (r, g, b) => r > 200 && g > 220 && b > 220) },
    draw(L, t, K) {
      const k = Math.min(1, K)
      light(L, 0, 134, 319, 179, 30, (x, y) => 1 + 0.22 * k * sin(x * 0.06 + y * 0.05 - t * 1.3))
      RODS.forEach((rc, i) => { const f = 1 + 0.3 * k * Math.pow(Math.max(0, sin(t * 0.9 - i * 0.9)), 2); if (f > 1.005) for (let y = rc[1]; y <= rc[3]; y++) for (let x = rc[0]; x <= rc[2]; x++) { const j = (y * W + x) * 4, w = smooth((lumOf(L.cur[j], L.cur[j + 1], L.cur[j + 2]) - 62) / 45); if (w > 0) L.mul(x, y, 1 + (f - 1) * w) } })
      twDraw(L, L.tw, t, K)
    },
  })

  // ================================================================ 8 GERM REEF
  variant(7, 0, {
    title: 'Drifters',
    moves: ['The spiky virus drifts slowly, spikes and all, as one piece.', 'The wavy tail at the bottom left ripples as one unbroken line.', 'The tiny hairs on the green bacterium sway.', 'Stars twinkle softly.'],
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
  variant(7, 1, {
    title: 'Infection',
    moves: ['A pulse of light runs down the bacteriophage, from its head to its legs.', 'Light then travels along the big blue cell it stands on.', 'The spiky virus glows softly. Nothing changes place.'],
    setup(L) { L.tw = twSetup(L, [0, 15, 320, 135], (r, g, b) => r > 190 && g > 170 && b > 210) },
    draw(L, t, K) {
      const k = Math.min(1, K)
      for (let y = 15; y <= 114; y++) for (let x = 0; x <= 140; x++) {
        const i = (y * W + x) * 4, r = L.cur[i], g = L.cur[i + 1], b = L.cur[i + 2]
        if (r - g > 50 && x >= 36 && x <= 84) L.mul(x, y, 1 + 0.55 * k * exp(-(((mod(y - t * 30, 150) - 12) / 9) ** 2)))
        else if (g > r + 10 && b > g + 30) L.mul(x, y, 1 + 0.6 * k * exp(-(((mod(x - y - t * 36 + 400, 230) - 20) / 14) ** 2)))
      }
      L.wash(150, 34.5, 16, [255, 150, 230], 0.25 * K * (0.5 + 0.5 * sin(t * 1.3)))
      twDraw(L, L.tw, t, K)
    },
  })
  variant(7, 2, {
    title: 'Drifting spores',
    moves: ['Tiny glowing virus particles drift across the water, bobbing as they go.', 'The green bacterium breathes with light.', 'Stars twinkle softly.'],
    setup(L) { L.tw = twSetup(L, [0, 15, 320, 135], (r, g, b) => r > 190 && g > 170 && b > 210) },
    draw(L, t, K) {
      const k = Math.min(1, K)
      for (let y = 120; y <= 172; y++) for (let x = 100; x < W; x++) { const i = (y * W + x) * 4; if (L.cur[i + 1] > L.cur[i] + 40 && L.cur[i + 1] > L.cur[i + 2]) L.mul(x, y, 1 + 0.1 * k * sin(t * 0.8 + x * 0.02)) }
      for (let i = 0; i < 8; i++) {
        const sp = 4 + hash(i, 1, 23) * 5, x = mod(hash(i, 2, 23) * 360 + t * sp, 360) - 20, y = 22 + hash(i, 3, 23) * 92 + 3 * sin(t * 0.6 + i * 1.7)
        Fx.orb(L, x, y, 5, [255, 120, 220], 0.7 * k); Fx.star(L, x, y, [255, 215, 245], k); for (const [ax, ay] of [[2, 2], [-2, 2], [2, -2], [-2, -2], [3, 0], [-3, 0], [0, 3], [0, -3]]) Fx.dot(L, x + ax, y + ay, [255, 170, 230], 0.75 * k)
      }
      twDraw(L, L.tw, t, K)
    },
  })

  // ================================================================ 9 PROTEIN FACTORY
  const orange = (r, g, b) => r > 150 && r > g + 30 && g > b + 25 && b < 130
  variant(8, 0, {
    title: 'Assembly line',
    moves: ['Pulses of light run along the chain of beads, as if the beads were being fed through.', 'The teal sphere (the ribosome) glows each time a pulse reaches it.', 'A glint runs along the golden heads of the membrane. Nothing changes place.'],
    setup(L) {
      L.chain = L.liftAll({ rect: [0, 44, 320, 82], pred: orange })
      L.heads = L.liftAll({ rect: [0, 136, 320, 152], pred: (r, g, b) => r > 215 && g > 150 && b < 130 })
      L.tw = twSetup(L, [0, 15, 320, 135], (r, g, b) => r > 235 && g > 235 && b > 235)
    },
    draw(L, t, K) {
      const k = Math.min(1, K), pulse = (x) => exp(-(((mod(x - t * 45, 110) - 15) / 12) ** 2))
      L.drawSpriteMap(L.chain, 0, 0, (r, g, b, x, y, c) => { const s = 0.65 * pulse(x) * k; c[0] = r + (255 - r) * s; c[1] = g + (255 - g) * s; c[2] = b + (255 - b) * s })
      L.drawSpriteMap(L.heads, 0, 0, (r, g, b, x, y, c) => { const s = 0.7 * exp(-(((mod(x + t * 30, 160) - 10) / 10) ** 2)) * k; c[0] = r + (255 - r) * s; c[1] = g + (255 - g) * s; c[2] = b + (255 - b) * s })
      L.wash(88.5, 52.5, 30, [150, 255, 255], 0.22 * K * exp(-(((mod(88 - t * 45, 110) - 15) / 20) ** 2)))
      twDraw(L, L.tw, t, K)
    },
  })
  const rolling = all[8]; rolling.title = 'Rolling membrane'
  variant(8, 1, rolling)
  variant(8, 2, {
    title: 'Floating',
    moves: ['The spheres float up and down, each pair as one piece.', 'Soft specks of light drift upward.', 'The chain and the membrane stay still.'],
    setup(L) { rolling.setup(L) },
    draw(L, t, K) {
      L.drawSprite(L.pairA, round(K * 1.2 * sin(t * 0.4)), round(K * 2.2 * sin(t * 0.5 + 1)))
      L.drawSprite(L.pairB, round(K * 1.2 * sin(t * 0.35 + 2)), round(K * 2.0 * sin(t * 0.45 + 3)))
      L.drawSprite(L.chain, 0, 0)
      L.worm.forEach((s) => L.drawSprite(s, 0, 0))
      motes(L, t, K, { n: 18, rect: [0, 18, 320, 132], rise: 5, sway: 0.5, amp: 4, color: [255, 215, 240], alpha: 0.65, seed: 9, big: 3 })
      twDraw(L, L.tw, t, K)
    },
  })

  // ================================================================ 10 DNA FOREST
  const kind = (r, g, b) => (r > 170 && g > 140 && b < 120 ? 0 : g > 140 && r < 150 && b < 160 && g > b - 10 && g > r + 40 ? 1 : r < 120 && g > 150 && b > 170 ? 2 : r > 180 && g < 120 && b < 140 ? 3 : -1)
  variant(9, 0, {
    title: 'Base pairs light up',
    moves: ['Single rungs glow and fade, here and there, each at its own moment. No band crosses the picture.', 'Tiny points of light drift upward between the towers.'],
    setup(L) { L.rungs = L.lift({ rect: [0, 15, 320, 139], pred: (r, g, b) => kind(r, g, b) >= 0 && sat(r, g, b) > 70, minArea: 3 }) },
    draw(L, t, K) {
      const k = Math.min(1, K)
      L.rungs.forEach((s, i) => { const per = 3 + hash(i, 1, 5) * 4, u = frac((t + hash(i, 2, 5) * per) / per); L.drawSprite(s, 0, 0, 1 + (u < 0.35 ? 0.9 * k * Math.pow(sin(Math.PI * u / 0.35), 2) : 0)) })
      motes(L, t, K, { n: 14, rect: [0, 20, 320, 136], rise: 7, sway: 0.6, amp: 3, color: [170, 225, 255], alpha: 0.6, seed: 5, big: 3 })
    },
  })
  variant(9, 1, {
    title: 'Climbing sparks',
    moves: ['Small sparks of light climb the spirals, following their strands.', 'The rungs and everything else stay as they are.'],
    setup(L) { L.strands = L.liftAll({ rect: [0, 15, 320, 139], pred: (r, g, b) => sat(r, g, b) > 40 && b > 90 && r > 50 && b >= g + 20 }) },
    draw(L, t, K) {
      const k = Math.min(1, K)
      L.drawSpriteMap(L.strands, 0, 0, (r, g, b, x, y, c) => {
        const col = floor(x / 40), y0 = 12 + mod(130 - t * 22 * (0.8 + 0.4 * hash(col, 1, 3)) + hash(col, 2, 3) * 130, 132), y1 = 12 + mod(y0 - 12 + 66, 132), s = 0.95 * Math.max(exp(-(((y - y0) / 3.4) ** 2)), exp(-(((y - y1) / 3.4) ** 2))) * k
        c[0] = r + (255 - r) * s; c[1] = g + (255 - g) * s; c[2] = b + (255 - b) * s
      })
    },
  })
  variant(9, 2, {
    title: 'Towers breathe',
    moves: ['The towers slowly brighten and dim, one after another, in a wide soft wave.', 'Stars twinkle softly. Nothing changes place.'],
    setup(L) { L.tw = twSetup(L, [0, 15, 320, 139], (r, g, b) => r > 225 && g > 225 && b > 225) },
    draw(L, t, K) {
      const k = Math.min(1, K)
      light(L, 0, 15, 319, 139, 42, (x) => 1 + 0.2 * k * sin(t * 0.9 - x * 0.03))
      twDraw(L, L.tw, t, K, 0.7)
    },
  })

  // ================================================================ 11 CRYSTAL LATTICE
  all[10].title = 'Glints and a hopping spark'
  const hiSetup = (L) => { L.hi = [L.liftAll({ rect: [0, 70, 320, 180], pred: (r, g, b) => r > 245 && g > 245 && b > 245 })] }
  variant(10, 1, {
    title: 'Wave through the crystal',
    moves: ['A slow wave of light rolls through the rows of atoms, front to back.', 'The glints on the atoms twinkle softly. Nothing changes place.'],
    setup: hiSetup,
    draw(L, t, K) {
      const k = Math.min(1, K)
      light(L, 0, 70, 319, 179, 60, (x, y) => 1 + 0.16 * k * sin(x * 0.07 + y * 0.11 - t * 1.4))
      twDraw(L, L.hi, t, K, 0.8)
    },
  })
  variant(10, 2, {
    title: 'Current',
    moves: ['Glowing electrons stream between the rows of atoms, faster in front and slower far away, like a current through the crystal.'],
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
  variant(11, 0, {
    title: 'Probability storm',
    moves: ['The petals sparkle all over: dozens of points flash and fade inside them, wherever the electron might be.', 'A pulse of light travels around the six petals.', 'The nucleus glows. Lights run slowly along the platform.'],
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
  variant(11, 1, {
    title: 'Breathing orbitals',
    moves: ['The blue petals glow while the pink ones dim, then the other way round, like slow breathing.', 'A ring of light spreads out from the nucleus with every breath.', 'Lights run slowly along the platform.'],
    setup() {},
    draw(L, t, K) {
      const k = Math.min(1, K), ph = sin(t * 1.1), R = mod(t * 1.1 / TAU, 1) * 95
      eachPetalPixel(L, (x, y, rho, dx, dy, w) => { const i = (y * W + x) * 4, pink = L.cur[i] > L.cur[i + 1]; L.mul(x, y, 1 + k * w * (0.42 * (pink ? ph : -ph) + 0.5 * exp(-(((rho - R) / 6) ** 2)) * (1 - R / 95))) })
      L.wash(CX, CY, 16, [255, 255, 255], 0.4 * K * (0.6 + 0.4 * ph))
      chase(L, t, K, 143, 312, 144, 12, [150, 255, 255], 4, 3)
    },
  })
  variant(11, 2, {
    title: 'Waves flowing out',
    moves: ['Ripples of light flow outward from the nucleus through every petal, one after another.', 'The nucleus pulses with them. Lights run slowly along the platform.'],
    setup() {},
    draw(L, t, K) {
      const k = Math.min(1, K)
      eachPetalPixel(L, (x, y, rho, dx, dy, w) => L.mul(x, y, 1 + 0.42 * k * w * sin(rho * 0.28 - t * 2.2)))
      L.wash(CX, CY, 16, [255, 255, 255], 0.45 * K * (0.6 + 0.4 * sin(t * 2.2)))
      chase(L, t, K, 143, 312, 144, 12, [150, 255, 255], 4, 3)
    },
  })
})()

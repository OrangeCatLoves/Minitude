/* Worlds 11 to 15: the crystal lattice, electron clouds, the gamma sea, the great empty and nucleus city. */
(function () {
  'use strict'
  const { def, helpers: H } = Motion
  const { hash, isWhite, isOrange, sat, chase } = H
  const E = Engine, { clamp, mod } = E
  const TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, round = Math.round, abs = Math.abs, floor = Math.floor, hypot = Math.hypot, exp = Math.exp
  const lumOf = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b
  function twinkle(L, list, t, K, deep = 0.65) {
    for (const s of list) L.drawSpriteMap(s, 0, 0, (r, g, b, x, y, c) => { const f = 1 - deep * Math.min(1, K) * Math.pow(Math.max(0, sin(t * (0.3 + hash(x, y, 1) * 0.7) + hash(x, y, 2) * TAU)), 2); c[0] = r * f; c[1] = g * f; c[2] = b * f })
  }

  // ================================================================ 11 CRYSTAL LATTICE
  def(10, {
    name: 'CRYSTAL LATTICE', desc: 'As small as an atom. You stand on one, in a glowing grid.',
    moves: ['The white glints on the atoms twinkle.', 'A soft sheen of light sweeps slowly across the atoms.', 'A spark of energy hops from atom to atom.'],
    setup(L) { L.hi = [L.liftAll({ rect: [0, 70, 320, 180], pred: (r, g, b) => r > 245 && g > 245 && b > 245 })] },
    draw(L, t, K) {
      twinkle(L, L.hi, t, K, 0.85)
      for (let y = 76; y < 180; y++) for (let x = 0; x < 320; x++) {
        const u = mod(x * 0.9 + y * 0.45 - t * 26, 760), s = exp(-(((u - 30) / 26) ** 2))
        if (s < 0.06) continue
        const c = L.c(x, y)
        if (lumOf(c[0], c[1], c[2]) > 70) L.add(x, y, 255, 255, 255, 0.15 * s * Math.min(1, K))
      }
      const pts = [[40, 124], [112, 140], [196, 122], [280, 136], [226, 160]]
      const u = mod(t * 0.35, pts.length), i = floor(u), f = u - i, a = pts[i], b = pts[(i + 1) % pts.length]
      const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f - 6 * sin(Math.PI * f)
      L.wash(x, y, 9, [255, 255, 255], 0.9 * Math.min(1, K))
      L.plus(round(x), round(y), [255, 255, 255], Math.min(1, K))
    },
  })

  // ================================================================ 12 ELECTRON CLOUDS
  def(11, {
    name: 'ELECTRON CLOUDS', desc: 'Glowing lobes of probability float over a flat platform.',
    moves: ['A slow wave of light travels around the petals of the cloud. No pixel moves, so it is smooth.', 'The nucleus glows softly and slowly.', 'Lights run slowly along the platform.'],
    setup() {},
    draw(L, t, K) {
      const k = Math.min(1, K)
      for (let y = 18; y <= 124; y++) for (let x = 60; x <= 222; x++) {
        const dx = x - 140, dy = y - 84, rho = Math.sqrt(dx * dx + dy * dy)
        if (rho > 68 || rho < 6) continue
        L.mul(x, y, 1 + 0.16 * k * Math.sin(5 * Math.atan2(dy, dx) - t * 0.5) * Math.min(1, (rho - 6) / 14))
      }
      L.wash(140, 84, 14, [255, 255, 255], 0.4 * K * (0.65 + 0.35 * sin(t * 1.0)))
      chase(L, t, K, 143, 312, 144, 12, [150, 255, 255], 4, 3)
    },
  })

  // ================================================================ 13 GAMMA SEA
  def(12, {
    name: 'GAMMA SEA', desc: 'Gamma rays from radioactive atoms have waves about as long as you are tall.',
    moves: ['The coloured waves ripple sideways, each row at its own pace.', 'The bright wave packets drift and pulse.', 'Lights run along the floor.'],
    setup(L) { L.packets = L.lift({ rect: [0, 15, 320, 138], pred: (r, g, b) => r > 235 && g > 235 && b > 235, minArea: 3, grow: 0 }) },
    draw(L, t, K) {
      L.warpRows(0, 6, 319, 136, (y) => K * 2.3 * sin(t * 0.45 + y * 0.08))
      L.packets.forEach((s, i) => L.drawSprite(s, round(K * 5 * sin(t * 0.5 + i * 1.6)), round(K * 1.3 * sin(t * 0.9 + i * 2.3)), 1 - 0.18 * Math.min(1, K) * (1 - sin(t * 2 + i))))
      chase(L, t, K, 4, 316, 158, 8, [140, 230, 255], 14, 5)
    },
  })

  // ================================================================ 14 THE GREAT EMPTY
  def(13, {
    name: 'THE GREAT EMPTY', desc: 'Faint orbits sweep around a speck of a nucleus, far away.',
    moves: ['The two blue lights travel slowly along their orbits.', 'The orange glow breathes.', 'Stars twinkle.'],
    setup(L) {
      L.orbs = [...L.lift({ rect: [28, 8, 62, 44], pred: (r, g, b) => b > 150 && lumOf(r, g, b) > 90, minArea: 3, grow: 1 }), ...L.lift({ rect: [176, 86, 208, 118], pred: (r, g, b) => b > 150 && lumOf(r, g, b) > 90, minArea: 3, grow: 1 })]
      L.sun = L.liftAll({ rect: [76, 38, 128, 86], pred: (r, g, b) => r > 200 && g > 90 && b < 140 && r - b > 80 })
      L.sunR = 0; for (let k = 0; k < L.sun.n; k++) L.sunR = Math.max(L.sunR, hypot(L.sun.xs[k] - 100, L.sun.ys[k] - 62))
      L.tw = [L.liftAll({ rect: [0, 15, 320, 138], pred: (r, g, b) => r > 200 && g > 200 && b > 220 })]
    },
    draw(L, t, K) {
      L.orbs.forEach((s, i) => L.drawSprite(s, round(K * 6 * sin(t * 0.35 + i * 2)), round(K * 4 * cos(t * 0.35 + i * 2))))
      const R = L.sunR + 0.5 - Math.min(1, K) * (2.5 + 2.5 * sin(t * 0.9))
      L.drawSpriteMap(L.sun, 0, 0, (r, g, b, x, y, c) => { if (hypot(x - 100, y - 62) > R + (hash(x, y, 4) - 0.5) * 6 * Math.min(1, K)) return false })
      twinkle(L, L.tw, t, K, 0.7)
    },
  })

  // ================================================================ 15 NUCLEUS CITY
  def(14, {
    name: 'NUCLEUS CITY', desc: 'A tight cluster of particles packs together like a city block.',
    moves: ['A slow wave of light passes over the cluster of particles. Nothing in the cluster is moved.', 'The glints on the particles twinkle softly.', 'The two loose particles drift, each as one whole ball.', 'Lights run slowly along the platform.'],
    setup(L) {
      const disc = (cx, cy, r) => (rr, g, bb, x, y) => (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r   // a ball is lifted as a whole disc (its shading, highlight and rim all included)
      L.far = [...L.lift({ rect: [284, 26, 316, 72], pred: disc(300, 44, 10.5), minArea: 12 }), ...L.lift({ rect: [262, 98, 300, 132], pred: disc(282, 112, 8.5), minArea: 12 })]
      L.hi = [L.liftAll({ rect: [0, 15, 320, 140], pred: (r, g, b) => r > 245 && g > 245 && b > 245 })]
    },
    draw(L, t, K) {
      for (let y = 14; y <= 128; y++) for (let x = 38; x <= 168; x++) L.mul(x, y, 1 + 0.1 * Math.min(1, K) * sin(0.06 * (x + 0.6 * y) - t * 0.7))
      L.far.forEach((s, i) => L.drawSprite(s, round(K * 2.5 * sin(t * 0.25 + i * 2.5)), round(K * 2.5 * cos(t * 0.3 + i * 1.5))))
      twinkle(L, L.hi, t, K, 0.9)
      chase(L, t, K, 132, 312, 146, 14, [255, 210, 255], 4, 3)
    },
  })
})()

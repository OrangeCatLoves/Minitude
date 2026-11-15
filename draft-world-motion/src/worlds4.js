/* Worlds 16 to 20: inside the proton, first quarks, short reach, the ripple sea and the collision hall. */
(function () {
  'use strict'
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
    name: 'INSIDE THE PROTON', desc: 'Three quarks, tied together by glowing strings.',
    moves: ['The glowing strings between the quarks wave and shimmer.', 'The three quarks bob gently and slowly, each as one whole ball and on its own beat.'],
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
    name: 'FIRST QUARKS', desc: 'Fast electrons bounce off tiny hard points inside a proton.',
    moves: ['Pulses of light race along the electron beams.', 'The incoming electron wave ripples.', 'The two glowing points pulse.', 'The little crosses twinkle.'],
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
    name: 'SHORT REACH', desc: 'The weak force reaches only about 1/700th of a proton.',
    moves: ['The little rings (W bosons) drift about, each on its own path.', 'They pulse softly.', 'Lights run along the platform.'],
    setup(L) { L.rings = L.lift({ rect: [0, 15, 320, 136], pred: (r, g, b) => r > 220 && g > 110 && b < 150 && r - b > 85, minArea: 6, maxArea: 200, grow: 1, fill: true }) },
    draw(L, t, K) {
      L.rings.forEach((s, i) => L.drawSprite(s, round(K * 2.2 * sin(t * 0.3 + i * 1.7)), round(K * 2.2 * sin(t * 0.37 + i * 2.3)), 1 + 0.12 * sin(t * 0.7 + i * 0.9) * Math.min(1, K)))
      chase(L, t, K, 132, 318, 145, 14, [255, 190, 150], 4, 3)
    },
  })

  // ================================================================ 19 RIPPLE SEA
  def(18, {
    name: 'RIPPLE SEA', desc: "A passing gravitational wave stretched LIGO's arms by about two of you.",
    moves: ['Ripples come out slowly from the two black holes: a soft wave of light travels outward through the rings, one after another.', 'Nothing is stretched or turned, so it stays calm.'],
    setup() {},
    draw(L, t, K) {
      const k = Math.min(1, K), speed = 12, spacing = 80, R0 = 44
      for (let y = 15; y <= 142; y++) for (let x = 0; x < 320; x++) {
        const dx = x - 83, dy = (y - 52) / 0.56, rho = Math.sqrt(dx * dx + dy * dy)
        if (rho < R0) continue
        let s = 0
        for (let n = 0; n < 4; n++) {
          const r = R0 + mod(t * speed + n * spacing, 4 * spacing), d = (rho - r) / 13
          if (d > 2.5 || d < -2.5) continue
          const born = clamp((r - R0) / 24, 0, 1), fade = 1 - clamp((r - 130) / 130, 0, 1)
          s += Math.exp(-d * d) * born * born * fade
        }
        if (s > 0.02) L.mul(x, y, 1 + 0.55 * k * s)
      }
    },
  })

  // ================================================================ 20 COLLISION HALL
  def(19, {
    name: 'COLLISION HALL', desc: 'The LHC reaches this small. Quarks still show no parts inside.',
    moves: ['A soft light turns slowly around the rings of the detector. Nothing is rotated, so it stays calm.', 'Every seven seconds a collision glows gently in the middle and the tracks brighten and fade.', 'Lights run slowly along the floor.'],
    setup(L) { L.tracks = L.liftAll({ rect: [78, 42, 160, 124], pred: (r, g, b) => sat(r, g, b) > 100 && lumOf(r, g, b) > 120 }) },
    draw(L, t, K) {
      const k = Math.min(1, K)
      for (let y = 40; y <= 139; y++) for (let x = 70; x <= 166; x++) {
        const dx = x - 118, dy = y - 81, rho = Math.sqrt(dx * dx + dy * dy)
        if (rho < 29 || rho > 99) continue
        L.mul(x, y, 1 + 0.16 * k * Math.sin(3 * Math.atan2(dy, dx) - t * 0.45))
      }
      const p = mod(t, 7) / 3.5, env = p < 1 ? Math.pow(Math.sin(Math.PI * p), 2) * k : 0
      L.drawSpriteMap(L.tracks, 0, 0, (r, g, b, x, y, c) => { const f = 1 + 0.45 * env; c[0] = Math.min(255, r * f); c[1] = Math.min(255, g * f); c[2] = Math.min(255, b * f) })
      L.wash(118, 81, 34, [220, 245, 255], 0.22 * env)
      chase(L, t, K, 4, 316, 155, 12, [255, 220, 90], 5, 4)
    },
  })
})()

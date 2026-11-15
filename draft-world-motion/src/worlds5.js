/* The unexplored stretch (slots 20 to 34: one look that grows from dark to a glowing horizon) and Planck Foam. */
(function () {
  'use strict'
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
    name: 'UNEXPLORED', desc: 'No experiment has looked this small. Nothing is known to exist here.',
    moves: ['The few faint stars flicker.', 'The glow on the horizon breathes (stronger the deeper you are).', 'The faint rings that appear later drift and pulse.', 'Light runs along the grid on the ground, toward the horizon.'],
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
  // the registry looks up slots 20 to 34 under "void"
  Motion.all.void = Motion.all.void

  // ================================================================ 21 PLANCK FOAM
  def(35, {
    name: 'PLANCK FOAM', desc: "About the Planck length, where physicists expect today's theories to stop working.",
    moves: ['A slow wave of brightness drifts through the foam and its rings (nothing is moved, so it stays calm).', 'The glow at the heart breathes slowly.', 'Light runs along the grid, toward the horizon.'],
    setup(L) {
      L.rings = L.liftAll({ rect: [0, 15, 320, 138], pred: (r, g, b) => sat(r, g, b) > 70 && lumOf(r, g, b) > 100 })
      L.grid = L.liftAll({ rect: [0, 143, 319, 179], pred: (r, g, b) => g > 150 && b > 180 && r < 140 })
    },
    draw(L, t, K) {
      L.wash(160, 92, 56, [200, 190, 255], 0.2 * K * (0.65 + 0.35 * sin(t * 0.8)))
      L.drawSpriteMap(L.rings, 0, 0, (r, g, b, x, y, c) => { const f = 1 + 0.15 * Math.min(1, K) * sin(t * 0.8 + x * 0.03 + y * 0.04); c[0] = Math.min(255, r * f); c[1] = Math.min(255, g * f); c[2] = Math.min(255, b * f) })
      L.drawSpriteMap(L.grid, 0, 0, (r, g, b, x, y, c) => { const s = exp(-(((mod(y - t * 14, 36) - 4) / 5) ** 2)) * Math.min(1, K); c[0] = r + (255 - r) * s; c[1] = g + (255 - g) * s; c[2] = b + (255 - b) * s })
    },
  })
})()

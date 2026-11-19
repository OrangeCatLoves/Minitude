/* Worlds 28B, 29 (A and B) and 30 (A and B). */
(function (root) {
  const { W, H, fbm, vnoise, rnd, hash, mix, sc, clamp01, ridge, fillRidge } = root.Gfx
  const { def, milkyWay, mountains, aurora, tankField, ground, tree, mist, hut, peaks, pulse, cyc, ease, seg } = root.Scene
  const TAU = Math.PI * 2

  // ============================================================================================================== 28 B  THE SOLAR-SYSTEM COLLIDER
  def({
    id: '28B', world: 28, name: 'A RING AS WIDE AS EARTH’S ORBIT',
    desc: 'With the LHC’s magnets, a collider reaching this energy would need a ring as wide as the Earth’s path round the Sun.',
    kind: 'THEORY', label: 'LHC MAGNETS · RING ≈ 1 AU',
    scale: { energy: '≈ 3 × 10¹¹ GeV', length: '≈ 7 × 10⁻²⁸ m' },
    real: [
      'A proton’s energy in a ring grows with the ring’s radius and the magnets’ strength. The LHC bends 7 TeV protons with magnets of 8.3 tesla in a ring of radius about 4.3 km.',
      'Keeping those magnets, 3 × 10¹¹ GeV would need a radius near 1.5 × 10⁸ km: Earth’s orbit. It is a back-of-the-envelope estimate, not a plan. The dot in the corner is the LHC at this scale.',
    ],
    source: 'Scaling from the LHC design report (CERN-2004-003): E ∝ B × radius.',
    draw(g, t) {
      g.vgrad(0, H - 1, [1, 1, 10], [8, 6, 26], 1)
      g.stars(131, 230, 0, H - 1, t, [225, 225, 255], 0.3, 0.75)
      const cx = 160, cy = 92, tilt = 0.34
      const orbit = (r, c, a, n = 260) => { for (let i = 0; i < n; i++) { const th = (i / n) * TAU; g.add(cx + Math.cos(th) * r, cy + Math.sin(th) * r * tilt, c, a) } }
      orbit(36, [110, 120, 170], 0.22); orbit(66, [110, 120, 170], 0.2); orbit(150, [110, 120, 170], 0.16)
      // the sun
      g.glow(cx, cy, 70, [255, 150, 60], 0.22 + 0.03 * pulse(t, 3), 2); g.glow(cx, cy, 24, [255, 200, 100], 0.65, 2); g.disc(cx, cy, 8, [255, 240, 190]); g.disc(cx, cy, 8, [255, 220, 150], 0.35)
      for (let i = 0; i < 8; i++) { const a = i * 0.8 + t * 0.15, l = 14 + 6 * Math.sin(t * 1.3 + i * 2); g.beam(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9, cx + Math.cos(a) * (9 + l), cy + Math.sin(a) * (9 + l), [255, 180, 90], 0.25) }
      // the collider ring on Earth's orbit
      const R = 98
      for (let i = 0; i < 720; i++) { const th = (i / 720) * TAU, near = (Math.sin(th) + 1) / 2, x = cx + Math.cos(th) * R, y = cy + Math.sin(th) * R * tilt; g.add(x, y, [60, 200, 240], 0.3 + 0.5 * near); if (near > 0.4) g.add(x, y + 1, [60, 200, 240], 0.35 * near); g.glow(x, y, 3, [60, 190, 240], 0.05 + 0.07 * near, 2) }
      for (const dir of [1, -1]) for (let b = 0; b < 3; b++) { const th0 = dir * 1.6 * t + b * 2.1 + (dir === -1 ? 1 : 0); for (let k = 0; k < 20; k++) { const th = th0 - dir * k * 0.035, x = cx + Math.cos(th) * R, y = cy + Math.sin(th) * R * tilt, near = (Math.sin(th) + 1) / 2; g.add(x, y, [200, 255, 255], (1 - k / 20) * (0.6 + 0.6 * near)); if (k < 3) g.glow(x, y, 6, [200, 255, 255], 0.5 * (1 - k / 3), 2) } }
      for (const th of [1.9, 5.0]) { const f = Math.max(0, Math.sin(t * 1.1 + th * 3)) ** 10, x = cx + Math.cos(th) * R, y = cy + Math.sin(th) * R * tilt; g.glow(x, y, 14, [255, 255, 255], 0.9 * f, 2); g.rect(Math.round(x) - 2, Math.round(y) - 1, 5, 3, [255, 220, 120], 0.8) }
      // the planets
      const planet = (r, per, ph, rad, col, ring) => { const th = (t / per) * TAU + ph, x = cx + Math.cos(th) * r, y = cy + Math.sin(th) * r * tilt; g.glow(x, y, rad * 3, col, 0.3, 2); g.sphere(x, y, rad, col); return [x, y] }
      planet(36, 11, 0.3, 2.2, [200, 170, 140]); planet(66, 18, 2.2, 3.2, [240, 220, 170])
      const e = planet(R, 40, 4.0, 3.6, [80, 150, 255]); g.add(e[0] + 7 * Math.cos(t * 1.4), e[1] + 4 * Math.sin(t * 1.4), [230, 230, 230], 0.9)
      planet(150, 70, 1.1, 2.8, [230, 110, 80])
      // the LHC, to scale, in the corner: a dot
      g.disc(36, 162, 1.2, [255, 220, 140]); g.glow(36, 162, 9, [255, 200, 100], 0.6, 2); g.ring(36, 162, 7 + 1.2 * pulse(t, 2.2), [255, 220, 150], 0.4, 1); g.line(42, 158, 56, 148, [255, 220, 150], 0.5)
    },
  })

  // ============================================================================================================== 29 A  THE AXION HUNT (ADMX)
  def({
    id: '29A', world: 29, name: 'THE AXION LISTENERS',
    desc: 'A copper cavity near absolute zero listens for a faint hum from dark matter. So far it has heard nothing.',
    kind: 'LIMIT', label: 'ADMX · NO SIGNAL YET',
    scale: { energy: '≈ 10¹² GeV', length: '≈ 10⁻²⁸ m' },
    real: [
      'ADMX, at the University of Washington, holds a tunable microwave cavity inside a strong magnet, cooled to a tenth of a degree above absolute zero. An axion from the dark-matter halo could turn into a tiny microwave signal there.',
      'Between 2018 and 2021 it scanned the masses from about 2.7 to 4.2 µeV with no signal. An axion in that range would have an energy scale of roughly 10¹² GeV.',
    ],
    source: 'ADMX Collaboration, Phys. Rev. Lett. 120, 151301 (2018); 124, 101303 (2020); 127, 261803 (2021).',
    draw(g, t) {
      // lab: dark room, tiled floor
      g.vgrad(0, H - 1, [8, 10, 18], [18, 20, 30], 1)
      for (let x = 0; x < W; x += 20) g.line(x, 0, x, 140, [20, 24, 38], 0.6)
      g.vgrad(142, H - 1, [26, 28, 40], [8, 9, 14], 1)
      for (let y = 142; y < H; y += 6) g.line(0, y, W, y, [38, 42, 58], 0.5)
      for (let i = -10; i < 12; i++) g.line(160 + i * 14, 142, 160 + i * 36, H, [38, 42, 58], 0.5)
      // the cryostat
      const X0 = 114, X1 = 206
      for (let y = 8; y < 146; y++) for (let x = X0; x <= X1; x++) { const u = (x - X0) / (X1 - X0), k = 0.35 + 0.65 * Math.pow(Math.sin(u * Math.PI), 0.7), band = (Math.floor(y / 9) % 2) ? 0.9 : 1.05; g.set(x, y, [70 * k * band, 78 * k * band, 96 * k * band]) }
      for (const yy of [8, 26, 56, 94, 146]) { g.rect(X0 - 4, yy, X1 - X0 + 9, 4, [128, 136, 156]); g.rect(X0 - 4, yy, X1 - X0 + 9, 1, [210, 218, 235]) }
      for (const [x, y] of [[X0 - 2, 12], [X1 + 2, 12], [X0 - 2, 60], [X1 + 2, 60]]) g.disc(x, y, 2, [200, 206, 220])
      // the window into the cold: magnet windings, the cavity and its tuning rod
      const WX0 = 126, WX1 = 194, WY0 = 40, WY1 = 128
      g.rect(WX0 - 2, WY0 - 2, WX1 - WX0 + 4, WY1 - WY0 + 4, [28, 32, 44])
      for (let y = WY0; y < WY1; y++) for (let x = WX0; x < WX1; x++) g.set(x, y, [6, 8, 16])
      for (let y = WY0 + 2; y < WY1 - 2; y += 2) { const l = 0.7 + 0.3 * Math.sin(y * 0.9); g.rect(WX0 + 2, y, WX1 - WX0 - 4, 1, [180 * l, 96 * l, 50 * l]) }
      for (let y = WY0 + 14; y < WY1 - 14; y++) for (let x = 142; x < 178; x++) { const u = (x - 142) / 36, k = 0.35 + 0.8 * Math.pow(Math.sin(u * Math.PI), 0.8); g.set(x, y, [255 * k * 0.9, 190 * k * 0.85, 80 * k * 0.8]) }
      const wave = pulse(t, 3.4)
      for (let y = WY0 + 16; y < WY1 - 16; y++) { const k = 0.5 + 0.5 * Math.sin((y - WY0) * 0.34 - t * 4); g.add(160, y, [255, 240, 200], 0.2 + 0.5 * k * wave); g.add(150, y, [255, 220, 160], 0.1 * k); g.add(170, y, [255, 220, 160], 0.1 * k) }
      const rodY = WY0 + 24 + (0.5 + 0.5 * Math.sin(t * 0.35)) * 50
      g.rect(158, WY0 + 14, 4, Math.round(rodY - WY0 - 14), [220, 224, 236]); g.rect(152, Math.round(rodY), 16, 3, [240, 244, 255]); g.glow(160, rodY + 1, 20, [255, 230, 160], 0.35, 2)
      g.glow(160, 84, 50, [255, 160, 70], 0.18 * wave + 0.08, 2)
      // cold mist along the floor
      for (let y = 124; y < 152; y++) for (let x = 60; x < 260; x++) { const n = fbm(x * 0.03 + t * 0.05, y * 0.12, 5, 3); g.add(x, y, [150, 200, 255], Math.max(0, n - 0.42) * 0.6 * (1 - Math.abs(y - 140) / 26)) }
      // pipes and cables
      g.line(X1 + 4, 20, 250, 20, [130, 138, 156]); g.line(250, 20, 250, 140, [130, 138, 156]); for (let i = 0; i < 6; i++) g.add(236 + i * 2, 22, [220, 235, 255], 0.5)
      for (let k = 0; k < 4; k++) g.line(X0 - 4, 16 + k * 3, 70 - k * 4, 16 + k * 3, [60, 70, 96])
      // the read-out screen: a long flat line of noise
      g.rect(228, 40, 80, 52, [10, 14, 22]); g.rect(228, 40, 80, 1, [90, 100, 120]); g.rect(228, 91, 80, 1, [90, 100, 120]); g.rect(228, 40, 1, 52, [90, 100, 120]); g.rect(307, 40, 1, 52, [90, 100, 120])
      for (let k = 1; k < 4; k++) g.line(228, 40 + k * 13, 307, 40 + k * 13, [30, 60, 70], 0.7)
      for (let x = 229; x < 307; x++) { const y = 72 + (vnoise(x * 0.4 + t * 5, 3, 9) - 0.5) * 9 + (vnoise(x * 0.12 - t * 1.6, 7, 4) - 0.5) * 3; g.add(x, y, [90, 255, 150], 0.9); g.add(x, y + 1, [90, 255, 150], 0.3) }
      g.add(236, 46, [255, 90, 80], 0.5 + 0.5 * pulse(t, 1.2)); g.rect(228, 100, 80, 18, [16, 20, 32]); for (let k = 0; k < 8; k++) g.rect(232 + k * 9, 104, 6, 3, mix([30, 40, 60], [90, 255, 150], (Math.sin(t * 1.7 + k * 1.9) > 0.55) ? 1 : 0))
      // a rack on the left
      g.rect(22, 70, 50, 70, [24, 28, 42]); for (let k = 0; k < 6; k++) { g.rect(26, 74 + k * 11, 42, 8, [38, 42, 60]); g.add(30, 78 + k * 11, [100, 255, 160], 0.4 + 0.5 * Math.max(0, Math.sin(t * 2.1 + k * 1.3))); g.add(34, 78 + k * 11, [255, 170, 90], 0.3 + 0.4 * Math.max(0, Math.sin(t * 1.4 + k * 2.1))) }
    },
  })

  // ============================================================================================================== 29 B  THE EXCLUSION PLOT
  def({
    id: '29B', world: 29, name: 'THE EMPTY BAND',
    desc: 'The real axion search is a chart. The cavity tunes through one mass at a time, and each one it clears turns green.',
    kind: 'LIMIT', label: 'ADMX 2018–2021 · 2.7–4.2 µEV',
    scale: { energy: '≈ 10¹² GeV', length: '≈ 10⁻²⁸ m' },
    real: [
      'Axion searches are drawn as an exclusion plot: the strength of an axion’s coupling to light against its mass. The yellow band is where popular axion models sit. ADMX closes it off a slice at a time by tuning its cavity.',
      'Everything it has cleared so far is empty. The rest of the band, at other masses, is still open.',
    ],
    source: 'ADMX Collaboration, Phys. Rev. Lett. 120, 151301 (2018); 124, 101303 (2020); 127, 261803 (2021).',
    draw(g, t) {
      g.vgrad(0, H - 1, [3, 4, 18], [10, 8, 30], 1)
      g.stars(141, 80, 0, H - 1, t, [200, 210, 255], 0.3, 0.45)
      const X0 = 30, X1 = 300, Y0 = 18, Y1 = 158
      // grid
      for (let k = 0; k <= 8; k++) { const x = X0 + (k / 8) * (X1 - X0); g.line(x, Y0, x, Y1, [50, 120, 150], 0.35) }
      for (let k = 0; k <= 6; k++) { const y = Y0 + (k / 6) * (Y1 - Y0); g.line(X0, y, X1, y, [50, 120, 150], 0.35) }
      g.line(X0, Y1, X1, Y1, [130, 230, 240], 0.9); g.line(X0, Y0, X0, Y1, [130, 230, 240], 0.9)
      // excluded by other experiments above the band: a dotted red shade
      for (let y = Y0 + 1; y < Y1; y++) for (let x = X0 + 1; x < X1; x++) { const edge = Y1 - 70 - (x - X0) * 0.42; if (y < edge - 22 && ((x + y) % 4 === 0)) g.add(x, y, [255, 70, 90], 0.22) }
      // the band of the popular models: two slanted lines and the fill between them
      const lo = (x) => Y1 - 40 - (x - X0) * 0.42, hi = (x) => Y1 - 64 - (x - X0) * 0.42
      for (let x = X0 + 1; x < X1; x++) { for (let y = Math.round(hi(x)); y <= Math.round(lo(x)); y++) g.add(x, y, [255, 200, 70], 0.32 + 0.06 * Math.sin(x * 0.2 + t)); g.add(x, hi(x), [255, 230, 120], 0.9); g.add(x, lo(x), [255, 230, 120], 0.9) }
      // the cavity's cursor tunes slowly to the right; what it has cleared turns green
      const per = 22, ph = cyc(t, per), sx = X0 + 100 + ph * 120
      for (let x = X0 + 100; x < sx; x += 3) { for (let y = Math.round(hi(x)) - 3; y <= Math.round(lo(x)) + 3; y++) { g.add(x, y, [80, 255, 150], 0.35); g.add(x + 1, y, [80, 255, 150], 0.35) } g.add(x, hi(x) - 3, [160, 255, 190], 0.7); g.add(x, lo(x) + 3, [160, 255, 190], 0.7) }
      for (let k = 0; k < 4; k++) { const x0 = X0 + 40 + k * 24; if (x0 < X0 + 100) for (let x = x0; x < x0 + 10; x++) for (let y = Math.round(hi(x)) - 3; y <= Math.round(lo(x)) + 3; y++) g.add(x, y, [80, 255, 150], 0.22) }
      g.line(sx, Y0, sx, Y1, [255, 255, 255], 0.55); g.glowE(sx, (Y0 + Y1) / 2, 8, 80, [160, 255, 200], 0.3, 2); g.glow(sx, (hi(sx) + lo(sx)) / 2, 14, [200, 255, 220], 0.9, 2)
      // tick marks
      for (let k = 0; k <= 8; k++) { const x = X0 + (k / 8) * (X1 - X0); g.line(x, Y1, x, Y1 + 4, [130, 230, 240], 0.9) }
      for (let k = 0; k <= 6; k++) { const y = Y0 + (k / 6) * (Y1 - Y0); g.line(X0 - 4, y, X0, y, [130, 230, 240], 0.9) }
    },
  })

  // ============================================================================================================== 30 A  THE SEESAW
  def({
    id: '30A', world: 30, name: 'THE SEESAW',
    desc: 'Neutrinos weigh almost nothing. A very heavy partner, near 10¹⁴ GeV, would explain why: the heavier it is, the lighter they are.',
    kind: 'THEORY', label: 'SEESAW MECHANISM · ~10¹⁴ GEV',
    scale: { energy: '≈ 10¹⁴ GeV', length: '≈ 2 × 10⁻³⁰ m' },
    real: [
      'Neutrino oscillations, measured and honoured with the 2015 Nobel Prize, prove that neutrinos have mass, yet less than a millionth of an electron’s. The seesaw idea of 1977 pairs each with a very heavy partner.',
      'As the partner gets heavier, the neutrino gets lighter. A neutrino mass of about 0.05 eV points to partners near 10¹⁴ GeV or above. No heavy partner has been seen.',
    ],
    source: 'P. Minkowski (1977); M. Gell-Mann, P. Ramond, R. Slansky (1979); T. Yanagida (1979); Nobel Prize in Physics 2015.',
    draw(g, t) {
      g.vgrad(0, H - 1, [4, 2, 18], [24, 8, 40], 1)
      g.stars(151, 160, 0, 120, t, [225, 215, 255], 0.35, 0.8)
      g.glowE(160, 150, 220, 50, [130, 60, 190], 0.28, 1.8)
      // a floor grid
      const FY = 140
      for (let k = 0; k < 10; k++) { const z = Math.pow(k / 9, 1.8), y = FY + z * (H - FY); g.line(0, y, W, y, [100, 80, 200], 0.2 + 0.25 * z) }
      for (let i = -20; i <= 20; i++) g.line(160 + i * 6, FY, 160 + i * 30, H, [100, 80, 200], 0.22)
      // the seesaw: it tips a little, heavy end down
      const tip = -0.2 + 0.015 * Math.sin(t * 0.8), PX = 160, PY = 122, L = 110
      const ex = Math.cos(tip), ey = Math.sin(tip), A = [PX - ex * L, PY - ey * L], B = [PX + ex * L, PY + ey * L]
      g.poly([[PX - 9, FY], [PX + 9, FY], [PX, PY + 2]], [90, 70, 130]); g.line(PX - 9, FY, PX, PY + 2, [160, 140, 220], 0.9); g.line(PX + 9, FY, PX, PY + 2, [160, 140, 220], 0.9)
      g.line(A[0], A[1], B[0], B[1], [230, 200, 255], 1, 3); g.line(A[0], A[1] - 2, B[0], B[1] - 2, [255, 255, 255], 0.5)
      g.disc(PX, PY, 3, [255, 255, 255])
      // the heavy partner
      const hx = A[0] + 14, hy = A[1] - 30, hr = 28 + 1.2 * Math.sin(t * 1.3)
      g.glow(hx, hy, hr * 2.8, [255, 90, 60], 0.4, 2); g.sphere(hx, hy, hr, [255, 120, 80]); for (let k = 0; k < 3; k++) g.ring(hx, hy, hr + 6 + k * 7 + 3 * pulse(t, 3.2, k), [255, 150, 100], 0.22 - k * 0.05, 1)
      // the neutrino: tiny, high up
      const nx = B[0] - 6, ny = B[1] - 6 + Math.sin(t * 1.9) * 1.2
      g.glow(nx, ny, 16, [120, 230, 255], 0.65, 2); g.disc(nx, ny, 2, [210, 250, 255])
      for (let k = 1; k < 16; k++) g.add(nx - k * 2.2 * (1 + 0.5 * ex), ny + k * 0.7 + Math.sin(t * 3 - k * 0.7) * 1.2, [150, 240, 255], 0.5 * (1 - k / 16))
      // two rows of faint bars: the light one is almost zero, the heavy one is huge
      for (let k = 0; k < 10; k++) { g.add(40 + k * 4, 168, [255, 150, 100], 0.2 + 0.65 * (k / 9)); g.add(250 + k * 3, 168, [150, 240, 255], 0.9 * (1 - k / 9) ** 2) }
    },
  })

  // ============================================================================================================== 30 B  COSMIC STRINGS
  def({
    id: '30B', world: 30, name: 'COSMIC STRINGS',
    desc: 'If the forces split in the early universe, they could have left cracks: lines of energy longer than galaxies. None has been seen.',
    kind: 'THEORY', label: 'COSMIC STRINGS · ~10¹⁴ GEV',
    scale: { energy: '≈ 4 × 10¹³ GeV', length: '≈ 5 × 10⁻³⁰ m' },
    real: [
      'When a symmetry breaks as the universe cools, theory says thin lines of trapped energy can form, as cracks do in freezing ice. A string would bend light, giving a galaxy behind it a twin image, and its wiggling loops would give off gravitational waves.',
      'Searches so far have found none. In 2023 pulsar timing hinted at a background of gravitational waves, and cosmic strings are one of several proposed sources.',
    ],
    source: 'T. Kibble (1976); NANOGrav Collaboration, Astrophys. J. Lett. 951, L11 (2023).',
    draw(g, t) {
      g.vgrad(0, H - 1, [2, 2, 14], [14, 6, 34], 1)
      g.glowE(260, 40, 120, 60, [120, 60, 190], 0.2, 1.8); g.glowE(40, 150, 120, 50, [60, 100, 210], 0.2, 1.8)
      g.stars(161, 200, 0, H - 1, t, [225, 225, 255], 0.35, 0.7)
      // the long string, with small kinks that travel along it
      const S = (u) => { const x = -10 + u * 340, y = 30 + u * 130 + Math.sin(u * 9 + t * 0.6) * 5 + Math.sin(u * 23 - t * 1.4) * 1.6; return [x, y] }
      const nrm = (u) => { const a = S(u - 0.01), b = S(u + 0.01), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l] }
      // galaxies come in pairs on either side of the string: the same galaxy, lensed
      const gal = (x, y, r, rot, c) => { for (let i = 0; i < 70; i++) { const a = (i / 70) * TAU * 2.2, rr = r * (0.3 + 1.2 * (i / 70)), px = x + Math.cos(a + rot) * rr * 1.7, py = y + Math.sin(a + rot) * rr * 0.65; g.add(px, py, c, 0.75) } g.glowE(x, y, r * 3.2, r * 1.5, c, 0.5, 2); g.glow(x, y, r * 1.4, [255, 245, 255], 0.9, 2) }
      for (let k = 0; k < 5; k++) {
        const u = 0.14 + k * 0.17, p = S(u), n = nrm(u), off = 17 + 6 * (k % 3), rot = k * 0.7 + 0.2, c = k % 2 ? [160, 200, 255] : [255, 190, 170], r = 4 + (k % 2) * 1.5
        gal(p[0] + n[0] * off, p[1] + n[1] * off, r, rot, c); gal(p[0] - n[0] * off, p[1] - n[1] * off, r, -rot, c)
      }
      for (let i = 0; i < 700; i++) { const u = i / 700, p = S(u); g.add(p[0], p[1], [255, 245, 210], 1.2); g.add(p[0], p[1] + 1, [255, 200, 140], 0.6); g.add(p[0], p[1] - 1, [255, 200, 140], 0.3); g.glow(p[0], p[1], 8, [255, 110, 200], 0.2, 2) }
      for (let k = 0; k < 4; k++) { const u = (t * 0.05 + k * 0.25) % 1, p = S(u); g.glow(p[0], p[1], 9, [255, 220, 255], 0.5, 2) }
      // oscillating loops that shed ripples of space
      const loops = [[84, 50, 1.7, 0], [236, 138, 2.0, 2.1], [270, 40, 1.4, 4.0]]
      for (const [lx, ly, sz, ph] of loops) {
        const per = 5, q = cyc(t, per, ph), w = TAU * (t / 2.6 + ph)
        for (let i = 0; i < 160; i++) { const th = (i / 160) * TAU, rx = (13 + 8 * Math.sin(w)) * sz, ry = (6 + 4 * Math.cos(w)) * sz, x = lx + Math.cos(th) * rx + Math.sin(th * 3 + w) * 1.2, y = ly + Math.sin(th) * ry; g.add(x, y, [255, 245, 210], 1.1); g.add(x, y + 1, [255, 200, 140], 0.5); g.glow(x, y, 5, [255, 110, 200], 0.18, 2) }
        const cusp = Math.max(0, Math.sin(w * 2)) ** 14; g.glow(lx + 13 * sz, ly, 12, [255, 255, 255], 0.9 * cusp, 2); g.glow(lx - 13 * sz, ly, 12, [255, 255, 255], 0.9 * cusp, 2)
        for (let k = 0; k < 3; k++) { const z = (q + k / 3) % 1; g.ellipseRing(lx, ly, 18 * sz + z * 70, 9 * sz + z * 34, [200, 170, 255], 0.5 * (1 - z) ** 1.5, 0.22, w * 0.1) }
      }
    },
  })
})(typeof window !== 'undefined' ? window : globalThis)

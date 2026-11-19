/* Worlds 23B, 24 (A and B) and 25 (A and B). */
(function (root) {
  const { W, H, fbm, vnoise, rnd, hash, mix, sc, clamp01, ridge, fillRidge } = root.Gfx
  const { def, milkyWay, mountains, aurora, tankField, ground, tree, mist, hut, peaks, pulse, cyc, ease, seg } = root.Scene
  const TAU = Math.PI * 2

  // ============================================================================================================== 23 B  PEVATRON SKY
  def({
    id: '23B', world: 23, name: 'PEVATRON SKY',
    desc: 'Light from our own Galaxy carries a thousand trillion times the energy of what your eyes see.',
    kind: 'MEASURED', label: 'LHAASO · 2021 · 1.4 PEV',
    scale: { energy: '1.4 PeV (one photon)', length: '≈ 1.4 × 10⁻²² m' },
    real: [
      'In 2021 LHAASO, an array of detectors high on the Tibetan plateau, found twelve sources in our Galaxy that send out photons above 100 TeV. The top one was 1.4 PeV, about 10¹⁵ times a visible photon.',
      'A photon’s shower contains few muons, so the muon detectors stay dark while the surface ones light up. That is how it is told from a proton.',
    ],
    source: 'LHAASO Collaboration, Nature 594, 33 (2021).',
    draw(g, t) {
      const HZ = 112
      g.vgrad(0, HZ, [2, 4, 18], [20, 26, 62], 1.4)
      // the Milky Way as an arch over the plateau
      for (let y = 0; y < HZ; y++) for (let x = 0; x < W; x++) {
        const cl = 118 - 96 * Math.sin((x / W) * Math.PI) ** 0.9, d = (y - cl) / 20
        if (Math.abs(d) > 1.6) continue
        const n = fbm(x * 0.03 + t * 0.004, y * 0.06, 8, 4); g.add(x, y, [175, 170, 225], Math.exp(-d * d * 2) * (0.2 + 1.3 * n * n) * 0.75)
      }
      g.stars(61, 260, 0, 104, t, [255, 255, 255], 0.4)
      const top = peaks(HZ - 6, 38, 0.015, 17)
      for (let x = 0; x < W; x++) for (let y = Math.floor(top[x]); y < HZ + 6; y++) { const d = y - top[x], snow = clamp01(1 - d / 8) * clamp01((HZ - top[x] - 10) / 18); g.set(x, y, mix([16, 18, 38], [150, 170, 215], snow * 0.8)) }
      ground(g, HZ + 6, H - 1, [46, 52, 70], [12, 14, 22], 3, 0.7)
      // pools of water for the Cherenkov detectors, in perspective
      for (const [x0, y0, w, h] of [[34, 128, 76, 26], [200, 124, 84, 24]]) {
        g.poly([[x0 + 8, y0], [x0 + w - 8, y0], [x0 + w, y0 + h], [x0, y0 + h]], [10, 34, 70])
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const sh = vnoise(x * 0.2 + t * 0.7, y * 0.5 + t * 0.2, 4); if (sh > 0.62) g.add(x0 + 8 * (1 - y / h) + x * (1 - 16 * (1 - y / h) / w), y0 + y, [90, 190, 255], (sh - 0.62) * 0.9) }
        g.line(x0 + 8, y0, x0 + w - 8, y0, [150, 200, 240], 0.7); g.line(x0, y0 + h, x0 + w, y0 + h, [90, 130, 180], 0.7)
      }
      // the array of surface detectors and, between them, the muon detectors
      const p = cyc(t, 7), C = [168, 144], flash = seg(p, 0.35, 0.5), dec = Math.exp(-Math.max(0, p - 0.5) * 5)
      for (let r = 0; r < 16; r++) {
        const z = r / 15, y = HZ + 10 + Math.pow(z, 1.5) * 56, s = 0.6 + z * 2.4, step = 7 * s
        for (let x = ((r * 3) % 2) * step * 0.5 - step; x < W + step; x += step) {
          const d = Math.hypot((x - C[0]) / 58, (y - C[1]) / 12), lit = p > 0.35 && d < 1 ? (1 - d) * dec * (d < flash * 1.1 ? 1 : 0) : 0
          g.rect(Math.round(x), Math.round(y), Math.max(1, Math.round(s)), Math.max(1, Math.round(s * 0.7)), [96, 106, 124])
          if (lit > 0) { g.add(x, y, [110, 230, 255], lit * 1.4); g.glow(x, y, 3 + s * 2, [70, 190, 255], lit * 0.9, 2) }
        }
      }
      for (let k = 0; k < 8; k++) { const x = 20 + k * 40 + ((k * 17) % 9), y = 160 + (k % 3) * 6; g.rect(x, y, 3, 2, [40, 44, 56]) }
      // telescopes and a cabin
      for (let k = 0; k < 4; k++) { const x = 118 + k * 16; g.rect(x, 116, 7, 5, [168, 172, 190]); g.rect(x, 116, 7, 1, [230, 232, 245]); g.rect(x + 1, 118, 5, 3, [20, 26, 46]) }
      hut(g, 300, 128, 14, 7, [58, 52, 66], [255, 200, 110])
      // the photon coming down
      if (p < 0.38) { const k = ease(seg(p, 0.05, 0.38)); for (let i = 0; i < 30; i++) { const kk = Math.max(0, k - i * 0.014); g.add(206 + (C[0] - 206) * kk, -10 + (C[1] + 10) * kk, [190, 150, 255], (1 - i / 30) * 0.9) } g.glow(206 + (C[0] - 206) * k, -10 + (C[1] + 10) * k, 7, [220, 190, 255], 0.9, 2) }
      if (p > 0.3) { const q = clamp01((p - 0.3) / 0.15); g.glowE(C[0], C[1], 44 * q + 4, 10 * q + 2, [140, 220, 255], 0.35 * dec, 2) }
    },
  })

  // ============================================================================================================== 24 A  THE IRON KNEE
  def({
    id: '24A', world: 24, name: 'THE IRON KNEE',
    desc: 'The heavy atoms in cosmic rays stop reaching us above about 80 PeV. Our Galaxy cannot hold them any longer.',
    kind: 'MEASURED', label: 'KASCADE-GRANDE · 80 PEV',
    scale: { energy: '≈ 80 PeV', length: '≈ 2.5 × 10⁻²⁴ m' },
    real: [
      'Cosmic rays of each kind of atom thin out at an energy that grows with its electric charge. For protons the “knee” is near 3 PeV. In 2011 KASCADE-Grande saw the same bend for the heaviest atoms, at about 80 PeV, 26 times higher, as iron’s charge predicts.',
      'It fits the idea that our Galaxy’s magnetic field stops holding the particles beyond that.',
    ],
    source: 'KASCADE-Grande Collaboration, Phys. Rev. Lett. 107, 171104 (2011).',
    draw(g, t) {
      g.vgrad(0, H - 1, [2, 3, 14], [10, 8, 34], 1.1)
      g.stars(71, 200, 0, H - 1, t, [225, 225, 255], 0.35, 0.85)
      // far galaxies outside
      for (let i = 0; i < 16; i++) { const x = rnd(3, i) * W, y = rnd(3, i + 40) * H; if (Math.abs(y - 90) < 30) continue; g.glowE(x, y, 4, 2, [170, 160, 230], 0.5, 2) }
      // the Milky Way edge-on with its field
      g.glowE(160, 90, 170, 40, [70, 60, 160], 0.35, 1.6); g.glowE(160, 90, 150, 14, [200, 180, 220], 0.45, 1.5); g.glowE(160, 90, 44, 22, [255, 220, 170], 0.7, 1.5)
      for (let i = 0; i < 380; i++) { const x = 14 + rnd(4, i) * 292, d = Math.abs(x - 160) / 150, y = 90 + (rnd(4, i + 400) - 0.5) * (4 + 14 * Math.exp(-d * 2.2)); g.add(x, y, [255, 235, 210], 0.25 + 0.5 * rnd(4, i + 900)) }
      for (let x = 20; x < 300; x++) g.add(x, 90 + Math.round(Math.sin(x * 0.2) * 0.6), [10, 4, 20], 0.55 * Math.exp(-Math.pow((x - 160) / 110, 2)))
      for (let k = -3; k <= 3; k++) { g.ellipseRing(160, 90, 56 + Math.abs(k) * 22, 34 + Math.abs(k) * 4, [60, 210, 200], 0.14, 0.12, t * 0.04 * (k % 2 ? 1 : -1)); }
      // the sun
      g.add(212, 90, [255, 235, 140], 1.2); g.glow(212, 90, 5, [255, 220, 110], 0.8, 2)
      // protons leave in spirals, iron nuclei stay and circle
      for (let k = 0; k < 6; k++) {
        const per = 7, ph = cyc(t, per, k * 1.17), x0 = 120 + (k * 29) % 90, dir = k % 2 ? 1 : -1
        for (let i = 0; i < 24; i++) {
          const s = Math.max(0, ph - i * 0.004), r = 10 + s * 12, ang = s * per * 4.6 * dir, x = x0 + dir * s * 120 + Math.cos(ang) * 4, y = 90 - s * s * 110 * (k % 3 === 0 ? 1 : -1) * 0.9 + Math.sin(ang) * r * 0.3
          if (s <= 0) break; const fade = (1 - i / 24) * (1 - clamp01((s - 0.7) / 0.3)); g.add(x, y, [255, 150, 70], fade * 0.9); if (i === 0) g.glow(x, y, 6, [255, 170, 90], 0.8 * (1 - clamp01((s - 0.7) / 0.3)), 2)
        }
      }
      for (let k = 0; k < 5; k++) {
        const w = t * (0.5 + 0.12 * k) + k * 2.1, cx = 160 + Math.cos(k * 1.3 + t * 0.05) * (30 + 18 * k), cy = 90 + Math.sin(k * 2.1) * 8
        for (let i = 0; i < 26; i++) { const a = w - i * 0.16, x = cx + Math.cos(a * 0.45) * (40 + 10 * k) + Math.cos(a * 4) * 3, y = cy + Math.sin(a * 4) * 7 + Math.sin(a * 0.45 + k) * 6; g.add(x, y, [120, 180, 255], (1 - i / 26) * 0.9); if (i === 0) { g.disc(x, y, 1.6, [200, 225, 255]); g.glow(x, y, 7, [110, 170, 255], 0.8, 2) } }
      }
    },
  })

  // ============================================================================================================== 24 B  THE FIELD OF HUTS (KASCADE-Grande)
  def({
    id: '24B', world: 24, name: 'THE MEADOW ARRAY',
    desc: 'A field of small huts in Germany counted cosmic-ray showers for a decade, and found the iron knee.',
    kind: 'MEASURED', label: 'KASCADE-GRANDE · KARLSRUHE',
    scale: { energy: '≈ 80 PeV', length: '≈ 2.5 × 10⁻²⁴ m' },
    real: [
      'KASCADE-Grande stood on the grounds of a research centre near Karlsruhe, Germany. It had 252 detector stations spread over a field, and later 37 larger ones across 0.5 km².',
      'Each shower spreads over hundreds of metres. Counting the particles in each hut gave the energy and what kind of atom started it.',
    ],
    source: 'KASCADE-Grande Collaboration, Phys. Rev. Lett. 107, 171104 (2011).',
    draw(g, t) {
      const HZ = 92
      g.vgrad(0, HZ, [32, 40, 100], [250, 150, 110], 1.8)
      g.glowE(110, HZ, 140, 60, [255, 190, 120], 0.6, 2)
      for (let c = 0; c < 4; c++) for (let x = 0; x < W; x++) { const y = 20 + c * 15 + Math.sin(x * 0.02 + c) * 3, n = fbm(x * 0.012 + t * 0.01 * (c + 1), c * 3, 9, 3); if (n > 0.52) g.add(x, y + n * 6, [255, 170, 140], (n - 0.52) * (0.3 + 0.12 * c)) }
      g.add(244, 70, [255, 245, 200], 0.9); g.glow(244, 70, 26, [255, 200, 130], 0.5, 2)
      for (let x = 0; x < W; x++) { const top = 86 + 3 * Math.sin(x * 0.04) + 3 * fbm(x * 0.05, 1, 6, 3); for (let y = Math.floor(top); y <= HZ + 4; y++) g.set(x, y, [24, 34, 38]) }
      for (let i = 0; i < 90; i++) tree(g, Math.round(rnd(6, i) * W), 92, 5 + Math.round(rnd(6, i + 90) * 7), [16, 28, 26])
      // the meadow
      for (let y = HZ + 3; y < H; y++) for (let x = 0; x < W; x++) { const z = (y - HZ) / (H - HZ), n = fbm(x * (0.05 - 0.03 * z), y * 0.16, 8, 3), l = 0.6 + 0.6 * n; g.set(x, y, mix([54 * l, 88 * l, 52 * l], [26 * l, 52 * l, 28 * l], z)); if (n > 0.6) g.add(x, y, [255, 190, 120], 0.05) }
      // the huts: a grid, with the big central ones
      const p = cyc(t, 7), C = [150, 142], grow = seg(p, 0.3, 0.55), dec = Math.exp(-Math.max(0, p - 0.55) * 5)
      const huts = []
      for (let r = 0; r < 11; r++) { const z = r / 10, y = HZ + 8 + Math.pow(z, 1.5) * 70, s = 0.55 + z * 2.7, step = 15 * s; for (let x = ((r % 2) * 0.5 - 1) * step; x < W + step; x += step) huts.push({ x, y, s }) }
      for (const h of huts) {
        const w = Math.max(2, Math.round(h.s * 3)), hh = Math.max(2, Math.round(h.s * 2)), d = Math.hypot((h.x - C[0]) / 78, (h.y - C[1]) / 15), lit = p > 0.3 && d < 1 ? (1 - d) * dec * (d < grow * 1.1 ? 1 : 0) : 0
        g.rect(Math.round(h.x - w / 2 + h.s), Math.round(h.y), w, 1, [14, 24, 18], 0.7)
        g.rect(Math.round(h.x - w / 2), Math.round(h.y - hh), w, hh, [150, 152, 160]); g.rect(Math.round(h.x - w / 2), Math.round(h.y - hh), w, 1, [226, 226, 232])
        if (lit > 0) { g.glow(h.x, h.y - hh / 2, 3 + h.s * 2.6, [90, 220, 255], lit * 0.95, 2); g.ring(h.x, h.y - hh / 2, 2 + h.s * 2, [150, 235, 255], lit * 0.6, 1) }
      }
      if (p < 0.34) { const k = ease(seg(p, 0.05, 0.34)); for (let i = 0; i < 24; i++) { const kk = Math.max(0, k - i * 0.016); g.add(200 + (C[0] - 200) * kk, -10 + (C[1] + 10) * kk, [190, 230, 255], (1 - i / 24) * 0.8) } }
    },
  })

  // ============================================================================================================== 25 A  THE DEEP-SEA FLASH (KM3NeT)
  def({
    id: '25A', world: 25, name: 'THE DEEP-SEA FLASH',
    desc: 'In 2023 a neutrino of about 220 PeV crossed a detector under the Mediterranean. Nothing more energetic has been seen.',
    kind: 'MEASURED', label: 'KM3NET · 2023 · 220 PEV',
    scale: { energy: '≈ 220 PeV', length: '≈ 9 × 10⁻²⁵ m' },
    real: [
      'On 13 February 2023 KM3NeT, still being built 3.5 km down off Sicily, recorded a muon from a neutrino of roughly 220 PeV, about thirty times the best IceCube had seen. It was reported in Nature in 2025.',
      'The muon lit up thousands of sensors as it crossed the detector, in nearly a straight line. Where it came from is not yet known.',
    ],
    source: 'KM3NeT Collaboration, Nature 638, 376 (2025).',
    draw(g, t) {
      g.vgrad(0, H - 1, [8, 34, 70], [0, 3, 12], 0.7)
      for (let k = 0; k < 5; k++) { const x0 = 40 + k * 70 + Math.sin(t * 0.2 + k) * 10; for (let y = 0; y < 90; y++) g.add(x0 + y * 0.45, y, [60, 130, 200], 0.05 * (1 - y / 90)) }
      // the sea floor
      for (let y = 154; y < H; y++) for (let x = 0; x < W; x++) { const n = fbm(x * 0.05, y * 0.2, 4, 3); g.set(x, y, mix([28, 30, 40], [8, 10, 16], (y - 154) / 26)); g.add(x, y, [90, 110, 140], 0.07 * n) }
      for (let x = 0; x < W; x++) g.add(x, 154 + Math.round(2 * fbm(x * 0.03, 8, 3, 3)), [80, 120, 170], 0.25)
      // the track: a nearly horizontal muon crossing the detector
      const p = cyc(t, 7.5), A = [-30, 128], B = [350, 40], head = clamp01((p - 0.1) / 0.28), dec = Math.exp(-Math.max(0, p - 0.38) * 4)
      const along = (x, y) => { const dx = B[0] - A[0], dy = B[1] - A[1], s = ((x - A[0]) * dx + (y - A[1]) * dy) / (dx * dx + dy * dy), px = A[0] + dx * s, py = A[1] + dy * s; return { s, d: Math.hypot(x - px, y - py) } }
      // strings of glass spheres, in three depths
      const strings = [[34, 0.55], [92, 0.8], [150, 1], [208, 0.8], [264, 0.6], [306, 0.45], [64, 0.5]].sort((a, b) => a[1] - b[1])
      for (const [x, dim] of strings) {
        g.line(x, 30, x, 156, mix([10, 24, 50], [40, 80, 130], dim), 0.8); g.rect(x - 2, 154, 5, 3, [60, 60, 70])
        g.rect(x - 1, 26, 3, 5, [200, 120, 40], 0.8)
        for (let y = 44; y < 150; y += 14) {
          const r = 2.6 + 2.4 * dim, a = along(x, y), lit = a.s >= 0 && a.s <= head ? Math.exp(-a.d * 0.04) * dec * clamp01(1 - (head - a.s) * 3) : 0
          g.disc(x, y, r, mix([14, 30, 54], [60, 110, 160], dim), 0.9); g.ring(x, y, r, [140, 200, 240], 0.5 * dim, 1); g.add(x - r * 0.35, y - r * 0.4, [230, 245, 255], 0.5 * dim)
          for (let k = 0; k < 5; k++) { const th = k * 1.25 + 0.3; g.add(x + Math.cos(th) * r * 0.55, y + Math.sin(th) * r * 0.55, [20, 40, 70], 0.9) }
          if (lit > 0.02) { g.glow(x, y, 8 + 12 * dim, [120, 200, 255], lit * 1.1, 2); g.add(x, y, [220, 240, 255], lit) }
        }
      }
      // the Cherenkov light along the track
      if (p > 0.1) for (let i = 0; i < 300; i++) { const s = i / 300; if (s > head) break; const x = A[0] + (B[0] - A[0]) * s, y = A[1] + (B[1] - A[1]) * s, tail = clamp01(1 - (head - s) * 3.2) * (p < 0.38 ? 1 : dec); g.add(x, y, [190, 235, 255], 0.9 * tail); g.glow(x, y, 4, [100, 190, 255], 0.35 * tail, 2) }
      // marine snow and a little bioluminescence
      for (let i = 0; i < 150; i++) { const x = (rnd(3, i) * W + Math.sin(t * 0.3 + i) * 5) % W, y = ((rnd(3, i + 200) * H - t * (3 + 5 * rnd(3, i + 500))) % H + H) % H; g.add(x, y, [170, 200, 230], 0.18 + 0.2 * rnd(3, i + 700)) }
      for (let i = 0; i < 14; i++) { const x = rnd(5, i) * W, y = 20 + rnd(5, i + 30) * 130, f = Math.max(0, Math.sin(t * 0.7 + i * 2.3)) ** 6; g.glow(x, y, 6, [90, 255, 220], 0.5 * f, 2) }
    },
  })

  // ============================================================================================================== 25 B  SN 1987A
  def({
    id: '25B', world: 25, name: 'THE QUIET STAR',
    desc: 'A star exploded in 1987. How quietly it cooled rules out a whole family of light particles.',
    kind: 'LIMIT', label: 'SN 1987A · AXION LIMIT',
    scale: { energy: '> 4 × 10⁸ GeV', length: '< 5 × 10⁻²⁵ m' },
    real: [
      'Supernova 1987A, in a small galaxy next to ours, sent about two dozen neutrinos to Earth over some ten seconds. If axions lighter than a certain mass existed, they would have drained its heat faster and shortened that burst.',
      'The burst’s length sets a limit: the axion’s energy scale must be above about 4 × 10⁸ GeV. The rings in the picture are the real glow of gas the star lit up.',
    ],
    source: 'G. Raffelt, Lect. Notes Phys. 741, 51 (2008); Hubble images of SN 1987A.',
    draw(g, t) {
      g.vgrad(0, H - 1, [1, 1, 8], [8, 4, 20], 1)
      g.glowE(40, 150, 130, 50, [130, 90, 200], 0.28, 1.6); g.glowE(300, 18, 60, 28, [255, 110, 150], 0.22, 1.6)
      for (let i = 0; i < 130; i++) { const a = rnd(8, i) * TAU, r = Math.sqrt(rnd(8, i + 70)) * 60; g.add(40 + Math.cos(a) * r * 2.1, 150 + Math.sin(a) * r * 0.8, [255, 220, 240], 0.3 * rnd(8, i + 300)) }
      for (let i = 0; i < 240; i++) { const x = rnd(9, i) * W, y = rnd(9, i + 300) * H, tw = 0.6 + 0.4 * Math.sin(t * (1 + rnd(9, i + 9) * 2) + i); const c = rnd(9, i + 55) < 0.3 ? [255, 190, 150] : rnd(9, i + 55) < 0.6 ? [170, 200, 255] : [255, 255, 255]; g.add(x, y, c, (0.25 + 0.6 * rnd(9, i + 700)) * tw) }
      for (let i = 0; i < 5; i++) { const x = 20 + rnd(10, i) * 280, y = 15 + rnd(10, i + 9) * 150; if (Math.hypot(x - 160, y - 88) < 80) continue; g.glow(x, y, 6, [255, 240, 220], 0.9, 2); for (let k = 1; k < 14; k++) { const a = 0.9 * (1 - k / 14); g.add(x + k, y, [255, 240, 220], a * 0.7); g.add(x - k, y, [255, 240, 220], a * 0.7); g.add(x, y + k, [255, 240, 220], a * 0.7); g.add(x, y - k, [255, 240, 220], a * 0.7) } }
      // the two outer rings and the inner ring of the real picture
      const cx = 160, cy = 90
      const outer = (ox, oy, rx, ry, c, k) => { for (let i = 0; i < 360; i++) { const th = (i / 360) * TAU, x = ox + Math.cos(th) * rx, y = oy + Math.sin(th) * ry; g.add(x, y, c, 0.35 * k * (0.6 + 0.4 * Math.sin(th * 3 + t * 0.4))); g.glow(x, y, 4, c, 0.05 * k, 2) } }
      outer(cx - 4, cy - 40, 62, 28, [150, 170, 255], 1); outer(cx + 6, cy + 36, 70, 30, [255, 150, 190], 1)
      g.glowE(cx, cy, 52, 26, [230, 120, 90], 0.22, 1.8)
      const rx = 27, ry = 13, tilt = -0.14
      for (let i = 0; i < 480; i++) { const th = (i / 480) * TAU, x = cx + Math.cos(th) * rx, y = cy + Math.sin(th) * ry + Math.cos(th) * rx * tilt; g.add(x, y, [255, 170, 90], 0.45); g.glow(x, y, 3.5, [255, 130, 70], 0.07, 2) }
      for (let k = 0; k < 34; k++) { const th = (k / 34) * TAU + 0.2, x = cx + Math.cos(th) * rx, y = cy + Math.sin(th) * ry + Math.cos(th) * rx * tilt, w = 0.5 + 0.5 * Math.sin(t * 1.6 + k * 2.7) * Math.sin(t * 0.7 + k * 1.1); g.disc(x, y, 1.2, [255, 220, 170], 0.8); g.glow(x, y, 6, [255, 190, 120], 0.35 + 0.6 * w * w, 2) }
      g.glow(cx, cy, 16, [255, 120, 80], 0.7 + 0.15 * pulse(t, 3.2), 2); g.glow(cx, cy, 7, [255, 200, 150], 0.8, 2)
    },
  })
})(typeof window !== 'undefined' ? window : globalThis)

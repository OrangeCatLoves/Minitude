/* Worlds 21 and 22 (design A and B of each) and 23A. */
(function (root) {
  const { W, H, fbm, vnoise, rnd, hash, mix, sc, clamp01, ridge, fillRidge } = root.Gfx
  const { def, milkyWay, mountains, aurora, tankField, ground, tree, mist, hut, peaks, pulse, cyc, ease, seg } = root.Scene
  const TAU = Math.PI * 2

  // ============================================================================================================== 21 A  THE NEXT RING
  def({
    id: '21A', world: 21, name: 'THE NEXT RING',
    desc: 'A tunnel three times the length of the LHC is proposed to reach this small. It has not been built.',
    kind: 'PLAN', label: 'FCC · 85–100 TEV · NOT BUILT',
    scale: { energy: '85–100 TeV', length: '≈ 2 × 10⁻²¹ m' },
    real: [
      'The Future Circular Collider is a real CERN proposal: a ring about 91 km round under the Geneva basin, more than three times the LHC’s 27 km.',
      'Its proton stage would collide at roughly 85 to 100 TeV, which probes about 2 × 10⁻²¹ m. Nothing has been decided or built.',
    ],
    source: 'CERN FCC Feasibility Study Report (2025).',
    draw(g, t) {
      const HZ = 64
      g.vgrad(0, HZ, [3, 5, 22], [92, 64, 120], 1.7)
      g.glowE(190, HZ, 230, 30, [255, 140, 100], 0.4, 2)
      g.stars(11, 130, 0, 52, t, [255, 255, 255], 0.4, 0.9)
      // far ranges: the Jura to the left, the Alps to the right with snow on the high tops
      const jura = peaks(62, 18, 0.018, 4), alps = peaks(60, 46, 0.011, 9)
      for (let x = 0; x < W; x++) {
        const k = clamp01((x - 120) / 90), top = jura[x] * (1 - k) + alps[x] * k
        for (let y = Math.max(0, Math.floor(top)); y <= HZ + 4; y++) {
          const depth = y - top, snow = top < 44 ? clamp01((44 - top) / 12) * clamp01(1 - depth / (5 + (44 - top) * 0.7)) : 0
          const lit = 0.5 + 0.5 * vnoise(x * 0.2, y * 0.4, 5)
          const base = mix([20, 22, 52], [44, 40, 84], clamp01(depth / 26)); g.set(x, y, mix(base, [214, 220, 250], snow * (0.55 + 0.45 * lit)))
        }
        g.add(x, Math.floor(top), [255, 180, 160], 0.25)
      }
      // ground, fields, lake
      ground(g, HZ + 5, H - 1, [26, 44, 52], [8, 16, 20], 7, 0.9, 0.06)
      for (let y = HZ + 5; y < H; y += 3) for (let x = 0; x < W; x++) { const f = fbm(x * 0.02, y * 0.06, 12, 3); if (f > 0.58) g.add(x, y, [36, 70, 40], 0.1) }
      const crescent = (x, y) => { const a1 = ((x - 236) / 104) ** 2 + ((y - 98) / 20) ** 2, a2 = ((x - 252) / 98) ** 2 + ((y - 90) / 18) ** 2; return a1 < 1 && a2 > 1 }
      for (let y = 70; y <= 120; y++) for (let x = 120; x <= 345; x++) {
        if (!crescent(x, y)) continue
        const sh = vnoise(x * 0.09 + t * 0.4, y * 0.9, 2), refl = mix([120, 84, 130], [12, 24, 58], clamp01((y - 76) / 40))
        g.set(x, y, refl); g.add(x, y, [170, 200, 255], 0.04 + 0.2 * sh * sh)
      }
      mist(g, t, HZ - 2, HZ + 12, [170, 150, 200], 0.3)
      // Geneva and the villages
      for (let i = 0; i < 150; i++) { const cl = i % 3, cx = [150, 112, 188][cl], cyy = [100, 118, 120][cl], sp = [20, 26, 16][cl], x = cx + (rnd(3, i) - 0.5) * 2 * sp, y = cyy + (rnd(3, i + 500) - 0.5) * 8; g.add(x, y, [255, 196, 110], 0.4 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.1 + i * 1.7))) }
      for (let k = 0; k < 7; k++) { const a = [90, 100], b = [260, 104 + k * 7]; for (let i = 0; i < 60; i++) { const s = i / 60; g.add(a[0] + (b[0] - a[0]) * s + Math.sin(s * 9 + k) * 6, 112 + k * 6 + s * 8, [255, 200, 120], 0.12) } }
      // the rings
      const ring = (cx, cy, rx, ry, col, bright, n, speed, tube) => {
        for (let i = 0; i < n; i++) {
          const th = (i / n) * TAU, near = (Math.sin(th) + 1) / 2, x = cx + Math.cos(th) * rx, y = cy + Math.sin(th) * ry
          g.add(x, y, col, 0.35 + 0.5 * near); if (tube && near > 0.4) g.add(x, y + 1, col, 0.4 * near); g.glow(x, y, 3.2, col, 0.05 + 0.08 * near, 2)
        }
        for (const dir of [1, -1]) {
          const th0 = dir * speed * t + (dir === -1 ? 2.1 : 0)
          for (let k = 0; k < 18; k++) { const th = th0 - dir * k * 0.04, x = cx + Math.cos(th) * rx, y = cy + Math.sin(th) * ry, near = (Math.sin(th) + 1) / 2; g.add(x, y, bright, (1 - k / 18) * (0.6 + 0.6 * near)); if (k < 3) g.glow(x, y, 6, bright, 0.55 * (1 - k / 3), 2) }
        }
      }
      ring(172, 124, 150, 38, [50, 170, 220], [190, 255, 255], 520, 0.5, true)
      ring(120, 113, 41, 10.5, [210, 120, 40], [255, 225, 150], 190, 1.45, false)
      // the eight surface sites of the big ring send up a pale light
      for (let k = 0; k < 8; k++) { const th = (k / 8) * TAU + 0.4, x = 172 + Math.cos(th) * 150, y = 124 + Math.sin(th) * 38, bl = 0.5 + 0.5 * Math.sin(t * 1.2 + k * 1.3); g.rect(Math.round(x) - 1, Math.round(y) - 1, 3, 2, [200, 250, 255]); for (let h = 1; h < 12; h++) g.add(x, y - h, [150, 230, 255], 0.5 * (1 - h / 12) * (0.4 + 0.6 * bl)); g.glow(x, y, 8, [90, 200, 255], 0.35 * bl, 2) }
      // dark conifers frame the bottom
      for (let i = 0; i < 40; i++) { const x = rnd(8, i) * W, h = 9 + rnd(8, i + 100) * 24; tree(g, Math.round(x), H + 1, Math.round(h * (0.7 + 0.5 * (i % 2))), [3, 7, 10]) }
    },
  })

  // ============================================================================================================== 21 B  NATURE'S COLLIDER
  def({
    id: '21B', world: 21, name: 'NATURE’S COLLIDER',
    desc: 'Cosmic rays hit the air harder than the LHC ever does. One experiment measured it at 57 TeV.',
    kind: 'MEASURED', label: 'PIERRE AUGER · 57 TEV',
    scale: { energy: '57 TeV', length: '≈ 3.5 × 10⁻²¹ m' },
    real: [
      'In 2012 the Pierre Auger Observatory measured how likely a cosmic-ray proton is to hit an air nucleus, at a collision energy of 57 TeV. That was four times what the LHC reached then.',
      'The shower of particles that follows is what the tanks on the ground catch.',
    ],
    source: 'Pierre Auger Collaboration, Phys. Rev. Lett. 109, 062002 (2012).',
    draw(g, t) {
      const HZ = 116
      g.vgrad(0, HZ, [4, 2, 26], [96, 44, 112], 1.7)
      g.glowE(160, HZ, 250, 40, [255, 140, 110], 0.38, 2)
      g.stars(21, 170, 0, 96, t, [255, 255, 255], 0.4, 0.9)
      for (const [y, a] of [[44, 0.05], [70, 0.06], [92, 0.07]]) for (let x = 0; x < W; x++) g.add(x, y, [140, 120, 230], a)
      mountains(g, HZ - 2, 16, 0.014, 15, [26, 12, 40], [190, 100, 130], HZ + 2)
      ground(g, HZ + 1, H - 1, [64, 40, 56], [18, 12, 26], 9, 0.45)
      const p = cyc(t, 8), P = [150, 12], G = [150, 138]
      // the proton comes in from far away
      if (p < 0.3) {
        const k = ease(seg(p, 0, 0.3)), x = 330 + (P[0] - 330) * k, y = -34 + (P[1] + 34) * k
        for (let i = 0; i < 46; i++) { const kk = Math.max(0, k - i * 0.01), xx = 330 + (P[0] - 330) * kk, yy = -34 + (P[1] + 34) * kk; g.add(xx, yy, [255, 215, 120], (1 - i / 46) * 0.85) }
        g.glow(x, y, 8, [255, 235, 160], 1, 2)
      }
      // the collision, then the shower in lines and sparks
      if (p >= 0.28) {
        const q = p - 0.28, flash = Math.exp(-q * 12), prog = clamp01(q / 0.3), life = Math.exp(-Math.max(0, p - 0.62) * 6)
        g.glow(P[0], P[1], 28, [255, 240, 200], 1.2 * flash, 2); g.ring(P[0], P[1], 4 + q * 80, [255, 220, 160], 0.6 * flash, 1)
        for (let i = 0; i < 70; i++) {
          const spread = (rnd(5, i) - 0.5) * 2, ex = G[0] + spread * (18 + 60 * rnd(5, i + 90)), ey = G[1] + (rnd(5, i + 40) - 0.5) * 8
          const sp = 0.7 + 0.5 * rnd(5, i + 200), len = clamp01(prog * sp)
          const col = i % 3 === 0 ? [255, 255, 255] : i % 3 === 1 ? [110, 215, 255] : [190, 140, 255]
          for (let s = Math.max(0, len - 0.32); s < len; s += 0.012) { const x = P[0] + (ex - P[0]) * s, y = P[1] + (ey - P[1]) * s; g.add(x, y, col, life * (0.3 + 0.6 * (s - (len - 0.32)) / 0.32) * 0.5) }
        }
        for (let i = 0; i < 700; i++) {
          const s = rnd(6, i * 2); if (s > prog) continue
          const lat = (rnd(6, i * 2 + 1) - 0.5) * 2 * (3 + s * 64) * (0.3 + 0.7 * rnd(6, i + 900)), x = P[0] + (G[0] - P[0]) * s + lat, y = P[1] + (G[1] - P[1]) * s
          g.add(x, y, rnd(6, i + 300) < 0.4 ? [255, 255, 255] : [130, 200, 255], life * (0.3 + 0.7 * Math.sin(s * 3.14)) * (0.4 + 0.6 * rnd(6, i + 600)))
        }
        for (let s = 0; s < prog; s += 0.03) { const x = P[0] + (G[0] - P[0]) * s, y = P[1] + (G[1] - P[1]) * s; g.glow(x, y, 10 + s * 40, [110, 150, 255], 0.09 * life, 2) }
      }
      // the tanks
      const front = seg(p, 0.5, 0.74), dec = Math.exp(-Math.max(0, p - 0.74) * 6)
      tankField(g, HZ + 1, 160, 15, 11, [150, 158, 176], (k) => { const dx = (k.x - G[0]) / 96, dy = (k.y - G[1]) / 16, d = Math.hypot(dx, dy); return front > 0 && d < 1 ? (1 - d) * dec * (d < front * 1.1 ? 1 : 0) : 0 })
      for (let i = 0; i < 30; i++) { const x = rnd(9, i) * W, y = HZ + 6 + rnd(9, i + 60) * 60; g.rect(Math.round(x), Math.round(y), 2, 1, [10, 6, 14]) }
    },
  })

  // ============================================================================================================== 22 A  THE RECORD HIT
  def({
    id: '22A', world: 22, name: 'THE RECORD HIT',
    desc: 'In 1991 a cosmic ray hit the air with about sixty times the LHC’s collision energy. No harder hit has been recorded.',
    kind: 'MEASURED', label: 'FLY’S EYE · 1991 · 3×10²⁰ EV',
    scale: { energy: '≈ 770 TeV (collision)', length: '≈ 2.6 × 10⁻²² m' },
    real: [
      'On 15 October 1991 the Fly’s Eye detector in Utah recorded a cosmic ray of 3.2 × 10²⁰ eV, the “Oh-My-God particle”. It was probably a proton.',
      'Hitting a nucleus in the air, it collided at about 770 TeV, around 57 times the LHC’s 13.6 TeV. No harder collision has been recorded.',
    ],
    source: 'D. J. Bird et al., Astrophys. J. 441, 144 (1995).',
    draw(g, t) {
      const HZ = 120
      g.vgrad(0, HZ, [2, 4, 16], [34, 26, 70], 1.6)
      milkyWay(g, t, 4, 0.26, 24, [170, 150, 215], 0.7, 8)
      g.stars(31, 230, 0, 112, t, [255, 255, 255], 0.35)
      g.glowE(160, HZ, 240, 26, [200, 110, 140], 0.28, 2)
      mountains(g, HZ - 2, 14, 0.016, 12, [10, 8, 20], [110, 60, 110], HZ + 3)
      ground(g, HZ + 2, H - 1, [58, 42, 62], [14, 10, 20], 5, 0.7)
      for (let k = 0; k < 2; k++) for (let i = 0; i < 80; i++) { const s = i / 80, x = 120 + s * (k ? 240 : 110) + Math.sin(s * 6 + k) * 6, y = HZ + 6 + s * s * 50; g.add(x, y, [160, 130, 170], 0.1) }
      // far station
      hut(g, 262, HZ + 4, 8, 4, [16, 14, 26], [255, 190, 110]); g.line(268, HZ, 268, HZ - 8, [30, 28, 44]); g.add(268, HZ - 9, [255, 70, 60], 0.5 + 0.5 * pulse(t, 1.7))
      // the near station: a dome of round mirrors, like an insect's eye
      const cx = 78, cy = 168, R = 50
      for (let y = -R; y <= 0; y++) for (let x = -R; x <= R; x++) { const d = Math.hypot(x, y); if (d > R) continue; const nz = Math.sqrt(1 - (d / R) ** 2), l = clamp01(0.38 - 0.5 * (x / R) + 0.5 * (y / R) + 0.45 * nz); g.set(cx + x, cy + y, [10 + 26 * l, 12 + 28 * l, 22 + 40 * l]) }
      const N = 140
      for (let i = 0; i < N; i++) {
        const ph = i * 2.399963, z = 1 - (i + 0.5) / N, rr = Math.sqrt(1 - z * z), nx = Math.cos(ph) * rr, ny = -Math.abs(Math.sin(ph) * rr) * 0.0 - z, nz = Math.sin(ph) * rr
        if (nz < 0.12) continue
        const px = cx + nx * R, py = cy + ny * R * 0.0 + (-z) * R * 0.98 + 0 * 0
        const rad = 3.2 + 3.8 * nz, shine = clamp01(0.5 - 0.5 * nx + 0.3 * z), k = 0.35 + 0.8 * shine
        g.disc(px, py, rad, [18 + 60 * k, 22 + 66 * k, 40 + 110 * k]); g.ring(px, py, rad, [8, 8, 16], 0.9, 1)
        g.add(px - rad * 0.3, py - rad * 0.3, [230, 235, 255], 0.5 * shine)
      }
      for (let x = -R - 4; x <= R + 4; x++) { g.set(cx + x, cy, [12, 12, 22]); g.set(cx + x, cy + 1, [12, 12, 22]) }
      g.line(cx, cy - R, cx, cy - R - 10, [60, 60, 80]); g.add(cx, cy - R - 11, [255, 70, 60], 0.5 + 0.5 * pulse(t, 1.4)); g.glow(cx, cy - R - 11, 6, [255, 60, 50], 0.45 * pulse(t, 1.4), 2)
      hut(g, 150, 170, 40, 14, [20, 18, 30], [255, 200, 120]); hut(g, 196, 172, 22, 10, [16, 14, 24], null)
      // sagebrush
      for (let i = 0; i < 70; i++) { const x = rnd(4, i) * W, y = HZ + 8 + Math.pow(rnd(4, i + 70), 1.4) * 56, s = 1 + Math.floor((y - HZ) / 22); g.rect(Math.round(x), Math.round(y), s + 1, s, [20, 20, 28]); g.add(x, y, [150, 140, 190], 0.1) }
      // the shower track
      const p = cyc(t, 8), A = [318, 0], B = [136, 112]
      const head = ease(seg(p, 0.1, 0.36)), fade = Math.exp(-Math.max(0, p - 0.36) * 4.2)
      if (p > 0.1) {
        for (let i = 0; i < 120; i++) {
          const s = i / 120; if (s > head) break
          const x = A[0] + (B[0] - A[0]) * s, y = A[1] + (B[1] - A[1]) * s
          const body = Math.exp(-Math.pow((s - 0.6) / 0.28, 2)), tail = 1 - clamp01((head - s) * 2.6), k = body * (p < 0.36 ? tail : fade)
          g.add(x, y, [160, 160, 255], 0.95 * k); g.glow(x, y, 5, [110, 120, 255], 0.4 * k, 2)
        }
        if (p < 0.36) { const x = A[0] + (B[0] - A[0]) * head, y = A[1] + (B[1] - A[1]) * head; g.glow(x, y, 10, [230, 230, 255], 0.9, 2) }
        const seen = seg(p, 0.22, 0.36) * fade
        for (let i = 0; i < 40; i++) { const th = rnd(2, i) * 3.14 + 3.14, r = rnd(2, i + 50) * R * 0.9; g.glow(cx + Math.cos(th) * r, cy + Math.sin(th) * r * 0.9, 5, [130, 140, 255], 0.5 * seen * rnd(2, i + 99), 2) }
      }
    },
  })

  // ============================================================================================================== 22 B  THE WIMP LIMIT
  def({
    id: '22B', world: 22, name: 'THE WIMP LIMIT',
    desc: 'Theory says a relic dark-matter particle cannot weigh more than about 340 TeV. None has been found at any weight.',
    kind: 'THEORY', label: 'UNITARITY BOUND · 340 TEV',
    scale: { energy: '340 TeV', length: '≈ 6 × 10⁻²² m' },
    real: [
      'Dark matter may be a heavy particle left over from the early universe. In 1990 Griest and Kamionkowski showed such a relic cannot be heavier than about 340 TeV, or the sums stop working.',
      'No dark-matter particle has been detected, at this weight or any other.',
    ],
    source: 'K. Griest & M. Kamionkowski, Phys. Rev. Lett. 64, 615 (1990).',
    draw(g, t) {
      g.vgrad(0, H - 1, [6, 3, 22], [34, 14, 60], 1.1)
      g.stars(41, 140, 0, 130, t, [215, 205, 255], 0.35, 0.8)
      // the halo: dotted ellipses that turn slowly, and the invisible mass as drifting specks
      for (let k = 0; k < 4; k++) g.ellipseRing(160, 150, 90 + k * 44, 24 + k * 22, [120, 90, 220], 0.28 - k * 0.04, 0.09, t * (0.05 + k * 0.02) * (k % 2 ? -1 : 1))
      g.glowE(160, 150, 220, 90, [80, 50, 170], 0.42, 1.8)
      for (let i = 0; i < 220; i++) { const a = rnd(6, i) * TAU + t * 0.03, r = 20 + rnd(6, i + 300) * 150, x = 160 + Math.cos(a) * r * 1.5, y = 150 + Math.sin(a) * r * 0.62; g.add(x, y, [190, 160, 255], 0.22 + 0.2 * rnd(6, i + 600)) }
      // the galaxy edge-on
      g.glowE(160, 152, 130, 12, [255, 214, 160], 0.62, 1.3); g.glowE(160, 152, 34, 22, [255, 232, 190], 0.8, 1.6)
      for (let i = 0; i < 360; i++) { const x = 34 + rnd(2, i) * 252, d = Math.abs(x - 160), y = 152 + (rnd(2, i + 400) - 0.5) * (3 + 7 * Math.exp(-d / 40)); g.add(x, y, [255, 235, 205], 0.3 + 0.4 * rnd(2, i + 900)) }
      for (let x = 40; x < 280; x++) g.add(x, 152 + Math.round(Math.sin(x * 0.3) * 0.5), [14, 6, 24], 0.55 * Math.exp(-Math.pow((x - 160) / 95, 2)))
      // the wall: a pane of light that no relic may pass
      const wall = [[212, 4], [244, 16], [244, 132], [212, 146]]
      g.poly(wall, [255, 90, 190], 0.16 + 0.05 * pulse(t, 2.6))
      for (let k = 0; k <= 8; k++) { const f = k / 8, y0 = 4 + f * 142, y1 = 16 + f * 116; g.line(212, y0, 244, y1, [255, 130, 210], 0.28 + 0.2 * Math.sin(t * 2.4 - k * 0.7)) }
      for (let k = 0; k <= 4; k++) { const x = 212 + k * 8, ya = 4 + k * 3, yb = 146 - k * 3.5; g.line(x, ya, x, yb, [255, 130, 210], 0.22) }
      g.line(212, 4, 212, 146, [255, 190, 235], 0.95); g.line(244, 16, 244, 132, [255, 150, 215], 0.8); g.glowE(228, 75, 30, 80, [255, 70, 180], 0.3, 2)
      // the ladder of heavier and heavier relics
      for (let k = 0; k < 6; k++) {
        const r = 5 + k * 3.3, x = 28 + k * 30, y = 124 - k * 14 + Math.sin(t * 0.9 + k * 1.3) * 2.4, col = [90 + 22 * k, 205 - 11 * k, 255 - 13 * k]
        g.glow(x, y, r * 3, col, 0.28, 2); g.sphere(x, y, r, col)
        const sw = pulse(t, 3.6, k * 0.7); g.ring(x, y, r + 3 + 3 * sw, col, 0.3 * (1 - sw), 1)
      }
      // beyond the wall: weights that cannot be
      for (let k = 0; k < 2; k++) {
        const r = 24 + k * 8, x = 276 + k * 4 - k * 6, y = 50 + k * 54, f = 0.35 + 0.35 * Math.sin(t * 1.1 + k * 2.2)
        for (let i = 0; i < 60; i++) { if (i % 2) continue; const th = (i / 60) * TAU + t * 0.12; g.add(x + Math.cos(th) * r, y + Math.sin(th) * r, [255, 150, 215], 0.95 * f) }
        g.glow(x, y, r * 1.5, [255, 90, 190], 0.1 * f, 2)
      }
    },
  })

  // ============================================================================================================== 23 A  GLASHOW'S FLASH
  def({
    id: '23A', world: 23, name: 'GLASHOW’S FLASH',
    desc: 'A neutrino with 6.3 PeV turned into a W boson inside a cubic kilometre of ice, just as predicted in 1960.',
    kind: 'MEASURED', label: 'ICECUBE · 2021 · 6.3 PEV',
    scale: { energy: '6.3 PeV', length: '≈ 3 × 10⁻²³ m' },
    real: [
      'In 1960 Sheldon Glashow predicted that an antineutrino of exactly 6.3 PeV hitting an electron would make a W boson. IceCube, a cubic kilometre of Antarctic ice with 5,160 light sensors, saw one in 2016 and reported it in 2021.',
      'In event pictures the colours show timing: red lights first, blue last. The flash drawn here follows that code.',
    ],
    source: 'IceCube Collaboration, Nature 591, 220 (2021).',
    draw(g, t) {
      g.vgrad(0, 50, [2, 6, 16], [8, 30, 44], 1.2)
      milkyWay(g, t, 2, 0.04, 12, [120, 150, 200], 0.28, 14)
      g.stars(51, 100, 0, 44, t, [220, 240, 255], 0.35, 0.9)
      aurora(g, t, 46, 44, [90, 255, 170], [30, 120, 170], 0.7)
      aurora(g, t * 0.8 + 9, 40, 26, [140, 255, 200], [50, 150, 190], 0.4, 33)
      // the surface: snow, the laboratory on its stilts, a mast, drifts
      for (let y = 47; y < 60; y++) for (let x = 0; x < W; x++) { const n = fbm(x * 0.03, y * 0.4, 6, 3), k = 0.4 + 0.6 * n, f = 1 - (y - 47) / 13; g.set(x, y, mix([30, 50, 74], [168, 204, 226], k * (0.4 + 0.6 * f))); g.add(x, y, [70, 255, 170], 0.03 * Math.sin(x * 0.02 + t * 0.4) + 0.03) }
      g.rect(112, 38, 40, 9, [52, 58, 76]); g.rect(112, 38, 40, 1, [150, 158, 190]); g.rect(116, 42, 5, 3, [255, 210, 130]); g.glow(118, 43, 8, [255, 200, 110], 0.35, 2); g.rect(110, 47, 2, 3, [40, 44, 58]); g.rect(152, 47, 2, 3, [40, 44, 58])
      g.line(138, 38, 138, 14, [180, 184, 200]); g.line(133, 20, 143, 20, [180, 184, 200]); g.add(138, 13, [255, 70, 60], 0.45 + 0.55 * pulse(t, 1.6)); g.glow(138, 13, 7, [255, 60, 50], 0.5 * pulse(t, 1.6), 2)
      for (let i = 0; i < 6; i++) { const x = 190 + i * 16; g.line(x, 47, x, 41, [120, 120, 140]); g.rect(x, 41, 4, 2, [255, 120, 70], 0.7) }
      // the ice below: layers, bubbles, a cold glow
      for (let y = 60; y < H; y++) for (let x = 0; x < W; x++) { const lay = 0.5 + 0.5 * Math.sin(y * 0.33 + Math.sin(x * 0.02) * 2.1 + vnoise(x * 0.01, y * 0.2, 4) * 3); const d = (y - 60) / 120; g.set(x, y, mix([8, 52, 104], [2, 8, 28], Math.pow(d, 0.7))); g.add(x, y, [40, 110, 190], 0.05 * lay * (1 - d)) }
      for (let i = 0; i < 200; i++) g.add(rnd(7, i) * W, 62 + rnd(7, i + 300) * 116, [150, 210, 255], 0.1 * (0.5 + 0.5 * Math.sin(t * 0.6 + i)))
      for (let k = 0; k < 4; k++) { const x0 = 40 + k * 90; for (let y = 60; y < H; y++) g.add(x0 + (y - 60) * 0.25, y, [60, 130, 220], 0.05 * (1 - (y - 60) / 120)) }
      // strings of sensors: three depths, plus the dense core
      const C = [170, 116], cyc8 = cyc(t, 9), tau = cyc8 * 9 / 1.2, R = tau * 80
      const hue = (h) => (h < 0.25 ? mix([255, 64, 48], [255, 190, 40], h / 0.25) : h < 0.5 ? mix([255, 190, 40], [90, 255, 120], (h - 0.25) / 0.25) : mix([90, 255, 120], [60, 130, 255], clamp01((h - 0.5) / 0.5)))
      const strings = []
      for (let s = 0; s < 14; s++) strings.push({ x: 18 + s * 22 + (s % 2) * 7, near: 0.45 + 0.55 * (((s * 5) % 7) / 6), gap: 9 })
      for (let s = 0; s < 6; s++) strings.push({ x: C[0] - 30 + s * 12, near: 1, gap: 4, core: true })
      strings.sort((a, b) => a.near - b.near)
      for (const st of strings) {
        const dim = st.near
        g.line(st.x, 58, st.x, H - 1, mix([12, 26, 56], [40, 70, 124], dim), 0.9)
        for (let y = 68; y < H - 3; y += st.gap) {
          const d = Math.hypot(st.x - C[0], y - C[1]), hit = d / 80, age = tau - hit
          const spark = 0.28 + 0.2 * Math.sin(t * 1.4 + st.x * 0.7 + y * 0.4)
          g.rect(st.x - 1, y - 1, 3, 3, mix([20, 30, 56], [90, 130, 190], dim * 0.8)); g.add(st.x, y - 1, [200, 230, 255], 0.18 * dim); g.add(st.x, y, [90, 150, 230], spark * dim * 0.7)
          if (age >= 0) { const lit = Math.exp(-age * 1.2) * Math.min(1, 150 / (d + 30)), col = hue(clamp01(hit / 1.8)); g.add(st.x, y, col, 1.5 * lit); g.glow(st.x, y, 5 + 8 * lit, col, 0.9 * lit, 2) }
        }
      }
      if (tau < 3.4) { g.glow(C[0], C[1], 10 + R * 0.5, [215, 238, 255], 1 * Math.exp(-tau * 0.85), 2.2); g.ring(C[0], C[1], R, [200, 230, 255], 0.4 * Math.exp(-tau * 0.8), 1) }
    },
  })
})(typeof window !== 'undefined' ? window : globalThis)

/* Worlds 26 (A and B), 27 (A and B) and 28A. */
(function (root) {
  const { W, H, fbm, vnoise, rnd, hash, mix, sc, clamp01, ridge, fillRidge } = root.Gfx
  const { def, milkyWay, mountains, aurora, tankField, ground, tree, mist, hut, peaks, pulse, cyc, ease, seg } = root.Scene
  const TAU = Math.PI * 2

  // ============================================================================================================== 26 A  THE ANKLE (Auger)
  def({
    id: '26A', world: 26, name: 'THE ANKLE',
    desc: 'Above about 5 EeV the cosmic rays change character: the ones from far outside our Galaxy take over.',
    kind: 'MEASURED', label: 'PIERRE AUGER · 5 EEV',
    scale: { energy: '≈ 5 EeV', length: '≈ 4 × 10⁻²⁶ m' },
    real: [
      'The Pierre Auger Observatory in Argentina covers 3,000 km² of pampa with 1,660 water tanks, watched at night by telescopes for the faint blue light of each shower.',
      'Its spectrum of cosmic rays flattens at about 5 EeV. This is the “ankle”, and it is where particles from beyond our Galaxy are thought to take over.',
    ],
    source: 'Pierre Auger Collaboration, Phys. Rev. D 102, 062005 (2020).',
    draw(g, t) {
      const HZ = 96
      g.vgrad(0, HZ, [3, 4, 26], [120, 70, 104], 1.8)
      g.glowE(90, HZ, 220, 40, [255, 150, 90], 0.45, 2)
      g.stars(81, 170, 0, 80, t, [255, 255, 255], 0.4, 0.95)
      // the Southern Cross and the Magellanic Clouds
      for (const [x, y, b] of [[224, 20, 1], [224, 44, 0.8], [210, 33, 0.7], [238, 32, 0.6], [236, 40, 0.3]]) { g.add(x, y, [255, 255, 255], b); g.glow(x, y, 4, [200, 220, 255], 0.5 * b, 2) }
      g.glowE(268, 64, 14, 8, [190, 200, 255], 0.35, 2); g.glowE(300, 52, 7, 5, [190, 200, 255], 0.3, 2)
      // the Andes in the last of the light
      const top = peaks(HZ + 2, 62, 0.012, 22)
      for (let x = 0; x < W; x++) { const sd = Math.max(0, (HZ - top[x] - 30) * 0.5); for (let y = Math.floor(top[x]); y <= HZ + 4; y++) { const d = y - top[x], snow = sd > 0 && d < sd ? 1 - d / sd : 0, lit = 0.5 + 0.5 * vnoise(x * 0.3, y * 0.5, 4); g.set(x, y, mix(mix([22, 16, 42], [56, 36, 70], clamp01(d / 34)), [255, 190, 180], snow * (0.55 + 0.4 * lit))) } }
      ground(g, HZ + 5, H - 1, [58, 40, 48], [18, 12, 22], 5, 0.5)
      // a telescope building on a low rise, left
      g.poly([[0, 118], [34, 108], [78, 112], [110, 122], [110, 136], [0, 136]], [24, 18, 32]); g.rect(30, 94, 36, 14, [150, 150, 170]); g.rect(30, 94, 36, 2, [230, 230, 240]); for (let k = 0; k < 4; k++) { g.rect(33 + k * 8, 99, 5, 6, [12, 14, 30]); g.add(35 + k * 8, 101, [110, 150, 255], 0.35) }
      // the carpet of tanks to the horizon
      const p = cyc(t, 8), C = [210, 148], wave = seg(p, 0.42, 0.72), dec = Math.exp(-Math.max(0, p - 0.72) * 6)
      tankField(g, HZ + 6, 160, 13, 10, [190, 194, 206], (k) => { const dx = (k.x - C[0]) / 140, dy = (k.y - C[1]) / 24, d = Math.hypot(dx, dy); return p > 0.42 && d < 1.1 ? Math.max(0, 1 - Math.abs(d - wave * 1.0) * 3.2) * dec : 0 })
      // the track of fluorescence light
      const head = ease(seg(p, 0.12, 0.44)), fade = Math.exp(-Math.max(0, p - 0.44) * 5), A = [150, 2], B = [200, 132]
      if (p > 0.12) for (let i = 0; i < 80; i++) { const s = i / 80; if (s > head) break; g.add(A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s, [150, 170, 255], 0.8 * clamp01(1 - (head - s) * 2.2) * (p < 0.44 ? 1 : fade)) }
      for (let k = 0; k < 18; k++) { const x = rnd(7, k) * W, y = HZ + 8 + rnd(7, k + 40) * 70; g.rect(Math.round(x), Math.round(y), 2, 1, [14, 8, 20]) }
    },
  })

  // ============================================================================================================== 26 B  THE LOPSIDED SKY
  def({
    id: '26B', world: 26, name: 'THE LOPSIDED SKY',
    desc: 'The highest-energy cosmic rays come from one side of the sky a little more often: about 6.5 % more.',
    kind: 'MEASURED', label: 'AUGER · 2017 · >8 EEV',
    scale: { energy: '> 8 EeV', length: '≈ 2.5 × 10⁻²⁶ m' },
    real: [
      'In 2017 the Auger Collaboration mapped about 30,000 cosmic rays above 8 EeV and found a gentle dipole: 6.5 % more arrive from one half of the sky. The direction points away from our Galactic centre, so these rays come from outside the Galaxy.',
      'The glow in the picture is exaggerated so that you can see it. The real difference is small.',
    ],
    source: 'Pierre Auger Collaboration, Science 357, 1266 (2017).',
    draw(g, t) {
      g.vgrad(0, H - 1, [2, 3, 14], [8, 10, 34], 1)
      g.stars(91, 90, 0, H - 1, t, [200, 210, 255], 0.3, 0.5)
      const cx = 160, cy = 92, RX = 148, RY = 74
      const inside = (x, y) => ((x - cx) / RX) ** 2 + ((y - cy) / RY) ** 2 < 1
      // the sky map: a faint disc with the dipole glow
      for (let y = cy - RY; y <= cy + RY; y++) for (let x = cx - RX; x <= cx + RX; x++) {
        if (!inside(x, y)) continue
        const dx = (x - (cx + 52)) / 110, dy = (y - (cy - 8)) / 80, d = Math.hypot(dx, dy), gl = Math.exp(-d * d * 1.5)
        g.set(x, y, mix([6, 8, 26], [28, 20, 56], 0.5)); g.add(x, y, [255, 170, 90], 0.36 * gl * (0.85 + 0.15 * Math.sin(t * 0.5))); g.add(x, y, [90, 120, 255], 0.14 * (1 - gl))
      }
      // the graticule
      for (let k = -4; k <= 4; k++) { const yy = k * 17; for (let i = 0; i < 300; i++) { const th = (i / 300) * Math.PI, x = cx + Math.cos(th) * RX * Math.sqrt(Math.max(0, 1 - (yy / RY) ** 2)), y = cy + yy; if (inside(x, y)) g.add(x, y, [60, 190, 190], 0.16) } }
      for (let k = -4; k <= 4; k++) { const f = k / 4; for (let i = 0; i < 120; i++) { const v = (i / 120) * 2 - 1, y = cy + v * RY, x = cx + f * RX * Math.sqrt(Math.max(0, 1 - v * v)); g.add(x, y, [60, 190, 190], 0.15) } }
      for (let i = 0; i < 500; i++) { const th = (i / 500) * TAU, x = cx + Math.cos(th) * RX, y = cy + Math.sin(th) * RY; g.set(x, y, [110, 230, 240], 0.8); g.add(x, y, [110, 230, 240], 0.2) }
      // the plane of our Galaxy as a wave of stars
      for (let i = 0; i < 600; i++) { const u = (i / 600) * 2 - 1, x = cx + u * RX * 0.98, y = cy + Math.sin(u * 4.2 + 0.7) * 20 * Math.cos(u * 1.2) + (rnd(3, i) - 0.5) * 7; if (inside(x, y)) g.add(x, y, [190, 180, 255], 0.35 * rnd(3, i + 600)) }
      // the events arrive one at a time and stay: a long exposure
      const N = 260, n = Math.floor(((t % 24) / 24) * N * 1.4)
      let placed = 0
      for (let i = 0; i < N * 3 && placed < N; i++) {
        const x = cx + (rnd(5, i * 2) * 2 - 1) * RX, y = cy + (rnd(5, i * 2 + 1) * 2 - 1) * RY; if (!inside(x, y)) continue
        const dx = (x - (cx + 52)) / 110, dy = (y - (cy - 8)) / 80, keep = 0.4 + 0.6 * Math.exp(-(dx * dx + dy * dy) * 1.5)
        if (rnd(5, i + 3000) > keep) continue
        placed++
        if (placed > n) break
        const age = n - placed, fresh = Math.exp(-age * 0.4)
        g.set(x, y, [255, 240, 190]); g.add(x, y, [255, 220, 140], 0.5 + 1.2 * fresh); if (fresh > 0.1) g.glow(x, y, 5, [255, 220, 150], fresh, 2)
      }
      // the Galactic centre and the dipole direction
      g.ring(cx, cy + 2, 4, [255, 255, 255], 0.9, 1); g.line(cx - 7, cy + 2, cx + 7, cy + 2, [255, 255, 255], 0.5); g.line(cx, cy - 5, cx, cy + 9, [255, 255, 255], 0.5)
      const dxm = cx + 74, dym = cy - 12
      g.ring(dxm, dym, 7 + 1.5 * pulse(t, 2.4), [255, 190, 110], 0.9, 1); g.line(dxm - 12, dym, dxm - 8, dym, [255, 190, 110], 0.8); g.line(dxm + 8, dym, dxm + 12, dym, [255, 190, 110], 0.8)
    },
  })

  // ============================================================================================================== 27 A  THE GZK WALL
  def({
    id: '27A', world: 27, name: 'THE GZK WALL',
    desc: 'Past about 50 EeV, cosmic rays bump into the faint light left over from the Big Bang and lose their energy.',
    kind: 'MEASURED', label: 'HIRES · AUGER 2008 · 50 EEV',
    scale: { energy: '≈ 50 EeV', length: '≈ 4 × 10⁻²⁷ m' },
    real: [
      'In 1966 Greisen, Zatsepin and Kuzmin predicted that a proton above about 5 × 10¹⁹ eV would hit photons of the cosmic microwave background and bleed energy, so very energetic ones could only come from nearby: a horizon of a few hundred million light-years.',
      'In 2008 two experiments, HiRes and Auger, saw the number of cosmic rays fall off just where it was predicted.',
    ],
    source: 'HiRes, Phys. Rev. Lett. 100, 101101 (2008); Auger, Phys. Rev. Lett. 101, 061101 (2008).',
    draw(g, t) {
      g.vgrad(0, H - 1, [2, 2, 12], [12, 6, 32], 1)
      g.stars(101, 130, 0, H - 1, t, [225, 225, 255], 0.35, 0.55)
      const E = [30, 142], HR = 150
      // the horizon: a great dashed arc of orange light around the Earth
      g.glow(E[0], E[1], HR + 22, [255, 120, 60], 0.0, 2)
      for (let i = 0; i < 900; i++) { const th = -1.6 + (i / 900) * 3.2, x = E[0] + Math.cos(th) * HR, y = E[1] + Math.sin(th) * HR; if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue; if (Math.floor(i / 6) % 2) continue; g.add(x, y, [255, 170, 90], 0.9); g.glow(x, y, 6, [255, 120, 60], 0.18, 2) }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - E[0], y - E[1]), f = Math.exp(-Math.pow((d - HR) / 18, 2)) * (0.4 + 0.8 * fbm(x * 0.05, y * 0.05 + t * 0.04, 6, 3)); if (f > 0.02) g.add(x, y, [255, 120, 70], f * 0.2) }
      // sources: bright inside the horizon, only dim beyond
      for (let i = 0; i < 70; i++) { const x = 20 + rnd(3, i) * 300, y = 6 + rnd(3, i + 90) * 168, d = Math.hypot(x - E[0], y - E[1]), r = 1.2 + 2 * rnd(3, i + 190), inn = d < HR; g.glowE(x, y, r * 2, r, inn ? [140, 190, 255] : [120, 100, 170], inn ? 0.6 : 0.3, 2); g.add(x, y, inn ? [220, 240, 255] : [170, 150, 200], inn ? 0.9 : 0.4) }
      // the Earth
      g.glow(E[0], E[1], 22, [90, 160, 255], 0.4, 2); g.sphere(E[0], E[1], 9, [70, 130, 230])
      // protons: the low-energy ones arrive, the gold ones are stopped at the horizon
      for (let k = 0; k < 8; k++) {
        const per = 6 + (k % 3) * 0.7, ph = cyc(t, per, k * 0.83), big = k % 2 === 1
        const sx = big ? 316 : 150 + (k * 37) % 70, sy = 14 + ((k * 43) % 150), hx = big ? E[0] + Math.cos(Math.atan2(sy - E[1], sx - E[0])) * HR : E[0], hy = big ? E[1] + Math.sin(Math.atan2(sy - E[1], sx - E[0])) * HR : E[1]
        const tx = big ? hx : E[0] + 9, ty = big ? hy : E[1], dx = tx - sx, dy = ty - sy, stop = big ? 0.72 : 1, q = Math.min(ph, stop), x = sx + dx * (q / stop) , y = sy + dy * (q / stop)
        const col = big ? [255, 214, 120] : [190, 230, 255], life = big ? 1 - clamp01((ph - 0.72) * 6) : 1
        if (ph > stop && big) { const z = (ph - stop) / (1 - stop); g.ring(hx, hy, 3 + z * 16, [255, 170, 110], 0.8 * (1 - z), 1); g.glow(hx, hy, 14, [255, 210, 140], 0.9 * (1 - z), 2); g.add(hx + z * 18, hy - z * 12, [120, 230, 255], 0.9 * (1 - z)); g.add(hx + z * 18, hy + z * 12, [120, 230, 255], 0.9 * (1 - z)); g.add(hx - z * 14, hy - z * 4, [255, 200, 140], 0.6 * (1 - z)); continue }
        for (let i = 0; i < 36; i++) { const s = Math.max(0, q / stop - i * 0.012); g.add(sx + dx * s, sy + dy * s, col, (1 - i / 36) * 0.75 * life) }
        g.glow(x, y, 6, col, 0.95 * life, 2)
        if (!big && ph > 0.97) g.glow(E[0], E[1], 18, [255, 255, 255], 0.9 * (1 - (ph - 0.97) / 0.03), 2)
      }
    },
  })

  // ============================================================================================================== 27 B  THE SECOND VALLEY (Higgs)
  def({
    id: '27B', world: 27, name: 'THE SECOND VALLEY',
    desc: 'With the Higgs and top masses measured, the Standard Model says the Higgs field’s energy dips again near 10¹¹ GeV.',
    kind: 'THEORY', label: 'HIGGS POTENTIAL · ~10¹¹ GEV',
    scale: { energy: '≈ 10¹⁰ – 10¹¹ GeV', length: '≈ 2 × 10⁻²⁷ m' },
    real: [
      'The Higgs field has an energy landscape. The measured masses of the Higgs boson and the top quark put us in a shallow valley, with a deeper one beyond a ridge around 10¹⁰ to 10¹¹ GeV.',
      'Calculations suggest the vacuum is “metastable”: it could in principle tunnel to the deeper valley, but the wait is far longer than the age of the universe. It is a prediction of theory, with big uncertainties.',
    ],
    source: 'G. Degrassi et al., JHEP 08 (2012) 098; D. Buttazzo et al., JHEP 12 (2013) 089.',
    draw(g, t) {
      g.vgrad(0, H - 1, [6, 2, 20], [22, 8, 46], 1)
      g.stars(111, 100, 0, 90, t, [215, 200, 255], 0.35, 0.8)
      g.glowE(160, 40, 210, 70, [120, 60, 200], 0.25, 1.8)
      // the floor grid in perspective
      const FY = 112
      for (let k = 0; k < 14; k++) { const z = Math.pow(k / 13, 1.8), y = FY + z * (H - FY); g.line(0, y, W, y, [40, 170, 200], 0.25 + 0.35 * z) }
      for (let i = -20; i <= 20; i++) g.line(160 + i * 6, FY, 160 + i * 30, H, [40, 170, 200], 0.28)
      // the energy landscape as a ribbon
      const V = (x) => { const u = (x - 20) / 280; return 0.1 + 0.42 * Math.exp(-Math.pow((u - 0.1) / 0.1, 2) * -0) * 0 + 0.0 - 0.0 + (u < 0.18 ? -0.05 : 0) + 0.52 * Math.exp(-Math.pow((u - 0.42) / 0.14, 2)) - 0.14 * Math.exp(-Math.pow((u - 0.1) / 0.075, 2)) - 0.95 * clamp01((u - 0.6) / 0.4) ** 1.4 + 0.22 * Math.pow(Math.max(0, 0.16 - u) / 0.16, 2) }
      const Y = (x) => 86 - V(x) * 78
      for (let x = 10; x < 312; x++) {
        const y = Y(x), y2 = Y(x + 1), under = Math.min(H - 1, 150)
        for (let yy = Math.round(y); yy < 150; yy++) g.add(x, yy, [90, 40, 190], 0.05 + 0.16 * (1 - (yy - y) / 70) * (yy - y < 70 ? 1 : 0))
        g.add(x, y, [90, 250, 255], 1.0); g.add(x, y - 1, [90, 250, 255], 0.5); g.add(x, y + 1, [90, 250, 255], 0.5); g.glow(x, y, 4, [70, 220, 255], 0.14, 2)
        g.add(x, y + 1, [255, 255, 255], 0.35 * Math.max(0, Math.sin(x * 0.07 - t * 3)) ** 8)
      }
      // we are here, in the shallow valley
      const bx = 62 + Math.sin(t * 1.1) * 1.5, by = Y(62) - 5
      g.sphere(bx, by, 4.5, [255, 210, 90]); g.glow(bx, by, 14, [255, 200, 100], 0.55, 2); g.ring(bx, by, 9 + 3 * pulse(t, 2.4), [255, 220, 130], 0.4, 1)
      // the deep valley and the ghost that might one day tunnel there
      const f = Math.max(0, Math.sin(t * 0.5 - 1.2)) ** 3, gx = 270, gy = Y(270) - 5
      g.glow(gx, gy, 16, [255, 90, 190], 0.35 * (0.4 + f), 2); g.ring(gx, gy, 4.5, [255, 130, 210], 0.9 * f, 1); g.disc(gx, gy, 3.5, [255, 150, 215], 0.45 * f)
      const rx = Y(150) - 14
      for (let i = 0; i < 18; i++) { const th = (i / 18) * TAU; g.add(150 + Math.cos(th) * 7, rx + Math.sin(th) * 3, [255, 120, 200], 0.18 + 0.2 * f) }
    },
  })

  // ============================================================================================================== 28 A  AMATERASU
  def({
    id: '28A', world: 28, name: 'FROM THE VOID',
    desc: 'In 2021 a cosmic ray of 244 EeV arrived from the direction of the Local Void, a region with almost no galaxies.',
    kind: 'MEASURED', label: 'TELESCOPE ARRAY · 2021 · 244 EEV',
    scale: { energy: '≈ 244 EeV', length: '≈ 8 × 10⁻²⁸ m' },
    real: [
      'On 27 May 2021 the Telescope Array in Utah, 507 detectors over 700 km² of desert, recorded a cosmic ray of 2.4 × 10²⁰ eV, the second most energetic ever. It was named Amaterasu.',
      'It seemed to come from the direction of the Local Void, empty of galaxies. A particle of this energy should not survive a long trip, so its origin is a puzzle.',
    ],
    source: 'Telescope Array Collaboration, Science 382, 903 (2023).',
    draw(g, t) {
      const HZ = 118
      g.vgrad(0, HZ, [1, 3, 14], [28, 22, 62], 1.6)
      milkyWay(g, t, 20, 0.12, 22, [150, 140, 210], 0.5, 6)
      g.stars(121, 150, 0, 100, t, [255, 255, 255], 0.35, 0.8)
      g.glowE(160, 118, 240, 24, [200, 110, 140], 0.25, 2)
      // faint galaxies everywhere but one empty patch
      const VX = 238, VY = 48
      for (let i = 0; i < 90; i++) { const x = rnd(2, i) * W, y = rnd(2, i + 100) * 108; if (Math.hypot(x - VX, y - VY) < 36) continue; const r = 1 + 2 * rnd(2, i + 300); g.glowE(x, y, r * 1.8, r, [170, 160, 255], 0.35 + 0.15 * Math.sin(t * 0.8 + i), 2); g.add(x, y, [255, 240, 255], 0.5) }
      g.ellipseRing(VX, VY, 38, 36, [120, 100, 220], 0.28, 0.16, t * 0.02)
      mountains(g, HZ - 2, 10, 0.02, 31, [8, 6, 16], [90, 60, 100], HZ + 3)
      ground(g, HZ + 2, H - 1, [56, 40, 52], [16, 12, 20], 5, 0.6)
      for (let i = 0; i < 60; i++) { const x = rnd(4, i) * W, y = HZ + 8 + Math.pow(rnd(4, i + 70), 1.5) * 52; g.rect(Math.round(x), Math.round(y), 2, 1, [22, 18, 30]) }
      // the station and the field of scintillator boxes
      g.rect(24, 108, 34, 14, [30, 28, 44]); g.rect(24, 108, 34, 2, [120, 120, 150]); for (let k = 0; k < 3; k++) { g.rect(28 + k * 10, 112, 6, 6, [10, 14, 34]); g.add(31 + k * 10, 115, [120, 160, 255], 0.3) } g.line(52, 108, 52, 98, [90, 90, 110]); g.add(52, 97, [255, 70, 60], 0.5 + 0.5 * pulse(t, 1.5))
      const p = cyc(t, 8), C = [184, 148], A = [VX, VY], dec = Math.exp(-Math.max(0, p - 0.55) * 6), front = seg(p, 0.46, 0.7)
      for (let r = 0; r < 12; r++) {
        const z = r / 11, y = HZ + 8 + Math.pow(z, 1.6) * 54, s = 0.8 + z * 2.8, step = 20 * s
        for (let x = ((r % 2) * 0.5 - 1) * step; x < W + step; x += step) {
          const d = Math.hypot((x - C[0]) / 70, (y - C[1]) / 13), lit = p > 0.46 && d < 1 ? (1 - d) * dec * (d < front * 1.1 ? 1 : 0) : 0, w = Math.max(2, Math.round(s * 2.6)), h = Math.max(1, Math.round(s * 1.1))
          g.rect(Math.round(x), Math.round(y - h), w, h, [78, 80, 96]); g.rect(Math.round(x), Math.round(y - h), w, 1, [130, 132, 150])
          if (lit > 0) { g.glow(x + w / 2, y - h / 2, 3 + s * 2.6, [255, 190, 110], lit * 0.95, 2); g.add(x + w / 2, y - h / 2, [255, 230, 170], lit) }
        }
      }
      // two big boxes in the foreground, each with a solar panel and an aerial
      for (const [fx, fy] of [[60, 172], [262, 176]]) { g.rect(fx, fy - 9, 20, 9, [96, 98, 116]); g.rect(fx, fy - 9, 20, 2, [160, 162, 182]); g.poly([[fx - 4, fy - 12], [fx + 24, fy - 12], [fx + 20, fy - 20], [fx, fy - 20]], [26, 40, 90]); g.line(fx + 2, fy - 18, fx + 22, fy - 18, [90, 130, 210], 0.5); g.line(fx + 10, fy - 20, fx + 10, fy - 32, [120, 122, 140]); g.add(fx + 10, fy - 33, [255, 80, 70], 0.4 + 0.5 * pulse(t, 1.8, fx)) }
      const head = ease(seg(p, 0.1, 0.46)), fade = Math.exp(-Math.max(0, p - 0.46) * 5), B = [C[0] - 2, 138]
      if (p > 0.1) for (let i = 0; i < 100; i++) { const s = i / 100; if (s > head) break; g.add(A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s, [230, 190, 255], 0.9 * clamp01(1 - (head - s) * 2.2) * (p < 0.46 ? 1 : fade)) }
      if (p > 0.1 && p < 0.46) g.glow(A[0] + (B[0] - A[0]) * head, A[1] + (B[1] - A[1]) * head, 9, [250, 220, 255], 0.9, 2)
    },
  })
})(typeof window !== 'undefined' ? window : globalThis)

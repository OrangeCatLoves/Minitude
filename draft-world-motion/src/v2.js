/* Designs A, B, C for worlds 13 to 20 (slots 12 to 19) and Planck Foam (slot 35). */
(function () {
  'use strict'
  const { helpers: H, vh, variant, all } = Motion
  const { hash, sat, chase } = H
  const { lumOf, smooth, frac, angDiff, bounds, twSetup, twDraw, blendSprite, light } = vh
  const { clamp, mod } = Engine
  const Fx = window.Fx
  const W = 320, TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, abs = Math.abs, round = Math.round, floor = Math.floor, exp = Math.exp, atan2 = Math.atan2, hypot = Math.hypot
  const toWhite = (c, r, g, b, s) => { c[0] = r + (255 - r) * s; c[1] = g + (255 - g) * s; c[2] = b + (255 - b) * s }

  // ================================================================ 13 GAMMA SEA
  all[12].title = 'Waves roll to the right'
  /** one wave drawn s pixels further along (the same method as design A) */
  function scrollCurve(L, cv, s) {
    if (s === 0) { L.drawSprite(cv.sp, 0, 0); return }
    const { sp, cols, fit, ok, P } = cv
    for (let X = 0; X < W; X++) {
      const raw = X - s, b = ((raw % P) + P) % P, j = Math.round((raw - b) / P), mMax = floor((W - 1 - b) / P)
      let x0 = -1
      for (let d = 0; d <= mMax + 2 && x0 < 0; d++) for (const sg of d ? [-1, 1] : [1]) { const m = clamp(j, 0, mMax) + sg * d; if (m < 0 || m > mMax) continue; const xx = b + m * P; if (xx < W && ok[xx]) { x0 = xx; break } }
      if (x0 < 0) continue
      const dy = round(fit(raw) - fit(x0))
      for (const kk of cols[x0]) L.px(X, sp.ys[kk] + dy, sp.cols[kk * 3], sp.cols[kk * 3 + 1], sp.cols[kk * 3 + 2])
    }
  }
  const packetGlow = (L, t, K) => L.packets.forEach((p, i) => L.drawSprite(p, 0, 0, 1, [120, 220, 255], 0.35 * Math.min(1, K) * (0.5 - 0.5 * sin(t * 1.5 + i * 1.1))))
  variant(12, 1, {
    title: 'Light along the waves',
    moves: ['The waves stay where they are. A pulse of light runs along each one, each at its own speed.', 'The bright wave packets glow softly.', 'Lights run along the floor.'],
    setup(L) { all[12].setup(L) },
    draw(L, t, K) {
      const k = Math.min(1, K)
      L.curves.forEach((cv, ci) => L.drawSpriteMap(cv.sp, 0, 0, (r, g, b, x, y, c) => toWhite(c, r, g, b, 0.75 * k * exp(-(((mod(x - t * (28 + ci * 7) + ci * 37, 130) - 12) / 10) ** 2)))))
      packetGlow(L, t, K)
      chase(L, t, K, 4, 316, 158, 8, [140, 230, 255], 8, 5)
    },
  })
  variant(12, 2, {
    title: 'Two-way tide',
    moves: ['Every other wave rolls to the right and the ones between roll to the left, slowly.', 'The bright wave packets stay in place and glow softly.', 'Lights run along the floor.'],
    setup(L) { all[12].setup(L) },
    draw(L, t, K) {
      const s = floor(K * 9 * t)
      L.curves.forEach((cv, ci) => scrollCurve(L, cv, ci % 2 ? -s : s))
      packetGlow(L, t, K)
      chase(L, t, K, 4, 316, 158, 8, [140, 230, 255], 8, 5)
    },
  })

  // ================================================================ 14 THE GREAT EMPTY
  all[13].title = 'Orbits'
  const sunBreath = (L, t, K) => { const k = Math.min(1, K); for (let y = 38; y <= 88; y++) for (let x = 38; x <= 92; x++) if ((x - 65) ** 2 + (y - 62.5) ** 2 <= 484) L.mul(x, y, 1 + 0.14 * k * sin(t * 1.0)); L.wash(65, 62.5, 20, [255, 200, 120], 0.22 * K * (0.6 + 0.4 * sin(t * 1.0))) }
  const lightsPulse = (L, t, K) => { L.wash(57, 25.5, 11, [120, 170, 255], 0.35 * K * (0.5 + 0.5 * sin(t * 1.4))); L.wash(204, 103, 11, [120, 170, 255], 0.35 * K * (0.5 + 0.5 * sin(t * 1.4 + 2))) }
  const starPred = (r, g, b) => r > 200 && g > 200 && b > 220
  variant(13, 1, {
    title: 'Shooting stars',
    moves: ['Every few seconds a shooting star crosses the emptiness and fades.', 'The two blue lights pulse and the orange glow breathes.', 'Stars twinkle softly.'],
    setup(L) { L.tw = [L.liftAll({ rect: [0, 15, 320, 138], pred: starPred })] },
    draw(L, t, K) {
      const k = Math.min(1, K)
      sunBreath(L, t, K); lightsPulse(L, t, K)
      const per = 4.2, idx = floor(t / per), u = (t - idx * per) / 1.0
      if (u < 1) {
        const x0 = 20 + hash(idx, 1, 33) * 250, y0 = 18 + hash(idx, 2, 33) * 45, ang = 0.3 + hash(idx, 3, 33) * 0.5, dir = hash(idx, 4, 33) < 0.5 ? 1 : -1
        const hx = x0 + dir * cos(ang) * 95 * u, hy = y0 + sin(ang) * 95 * u, a = sin(Math.PI * u) * k
        if (hy < 136) { Fx.line(L, hx - dir * cos(ang) * 16, hy - sin(ang) * 16, hx, hy, [190, 220, 255], 0.6 * a); Fx.orb(L, hx, hy, 3, [200, 230, 255], 0.7 * a); Fx.star(L, hx, hy, [255, 255, 255], a) }
      }
      twDraw(L, L.tw, t, K, 0.6)
    },
  })
  variant(13, 2, {
    title: 'Drifting through',
    moves: ['The stars drift slowly sideways, as if you were floating through the emptiness.', 'The two blue lights pulse and the orange glow breathes.'],
    setup(L) { L.stars = L.liftAll({ rect: [0, 15, 320, 135], pred: (r, g, b, x, y) => starPred(r, g, b) && (x - 57) ** 2 + (y - 25.5) ** 2 > 196 && (x - 204) ** 2 + (y - 103) ** 2 > 196 && (x - 65) ** 2 + (y - 62.5) ** 2 > 676 }) },
    draw(L, t, K) {
      sunBreath(L, t, K); lightsPulse(L, t, K)
      const dx = floor(K * t * 3) % W
      L.drawSprite(L.stars, dx, 0); if (dx) L.drawSprite(L.stars, dx - W, 0)
    },
  })

  // ================================================================ 15 NUCLEUS CITY
  all[14].title = 'Shivering cluster'
  const GL = [[84, 21], [122, 24], [105, 35], [77, 40], [58, 54], [82, 60], [135, 59], [115, 68], [63, 78], [142, 91], [118, 95], [69, 104], [88, 103]]
  variant(14, 1, {
    title: 'Strong force',
    moves: ['Sparks jump between neighbouring particles, here and there: the force that holds them together.', 'A slow wave of light passes over the cluster.', 'Nothing changes place. Lights run slowly along the platform.'],
    setup(L) {
      L.pairs = []
      for (let i = 0; i < GL.length; i++) for (let j = i + 1; j < GL.length; j++) if (hypot(GL[i][0] - GL[j][0], GL[i][1] - GL[j][1]) < 36) L.pairs.push([i, j])
      L.hi = [L.liftAll({ rect: [176, 15, 320, 138], pred: (r, g, b) => r > 245 && g > 245 && b > 245 })]
    },
    draw(L, t, K) {
      const k = Math.min(1, K)
      light(L, 30, 8, 175, 138, 50, (x, y) => ((x - 103) ** 2 + (y - 73) ** 2 < 5500 ? 1 + 0.12 * k * sin(0.06 * (x + 0.6 * y) - t * 0.9) : 1))
      L.pairs.forEach(([i, j], n) => {
        const per = 2.6 + hash(n, 1, 35) * 3.2, u = frac((t + hash(n, 2, 35) * per) / per) / 0.14; if (u >= 1) return
        const a = sin(Math.PI * u) * k, p = GL[i], q = GL[j]
        Fx.line(L, p[0] + 5, p[1] + 6, q[0] + 5, q[1] + 6, [255, 255, 215], 0.85 * a); Fx.star(L, p[0] + 5, p[1] + 6, [255, 255, 255], a); Fx.star(L, q[0] + 5, q[1] + 6, [255, 255, 255], a)
      })
      twDraw(L, L.hi, t, K, 0.7)
      chase(L, t, K, 132, 312, 146, 14, [255, 210, 255], 4, 3)
    },
  })
  variant(14, 2, {
    title: 'Heartbeat',
    moves: ['The cluster beats like a heart: two quick pulses of light, then a rest.', 'A ring of light spreads out from it with every beat.', 'The two loose particles bob gently.'],
    setup(L) { all[14].setup(L) },
    draw(L, t, K) {
      const k = Math.min(1, K), ph = frac(t / 1.7), env = exp(-ph * 10) + (ph > 0.25 ? 0.6 * exp(-(ph - 0.25) * 10) : 0)
      L.drawSpriteMap(L.cluster, 0, 0, (r, g, b, x, y, c) => { const f = 1 + 0.25 * k * env; c[0] = Math.min(255, r * f); c[1] = Math.min(255, g * f); c[2] = Math.min(255, b * f) })
      const R = round(72 + ph * 62); L.ring(103, 73, R, [255, 190, 250], 0.4 * k * (1 - ph)); L.ring(103, 73, R + 1, [255, 190, 250], 0.2 * k * (1 - ph))
      L.far.forEach((s, i) => L.drawSprite(s, 0, round(K * 2 * sin(t * 0.7 + i * 2))))
      twDraw(L, L.hi, t, K, 0.7)
      chase(L, t, K, 132, 312, 146, 14, [255, 210, 255], 4, 3)
    },
  })

  // ================================================================ 16 INSIDE THE PROTON
  all[15].title = 'Waving strings'
  const stringPred = (r, g, b) => (r > 225 && g < 150 && b > 130 && b < 205) || (r > 235 && g > 200 && b < 130)
  const QUARKS = [[67, 60, [255, 90, 90]], [262, 53, [110, 150, 255]], [212, 168, [110, 255, 150]]]
  variant(15, 1, {
    title: 'Colour exchange',
    moves: ['Pulses of light run along the three strings, from quark to quark.', 'Each quark glows in turn as the pulses arrive.', 'Nothing changes place.'],
    setup(L) { L.strings = L.liftAll({ rect: [88, 40, 250, 176], pred: stringPred }) },
    draw(L, t, K) {
      const k = Math.min(1, K)
      L.drawSpriteMap(L.strings, 0, 0, (r, g, b, x, y, c) => { const p = y < 76 ? x : x < 170 ? 300 + y * 1.5 : 700 - y * 1.5; toWhite(c, r, g, b, 0.85 * k * exp(-(((mod(p - t * 48, 150) - 12) / 9) ** 2))) })
      QUARKS.forEach(([x, y, col], i) => L.wash(x, y, 30, col, 0.22 * K * Math.pow(Math.max(0, sin(t * 1.0 - i * 2.1)), 2)))
    },
  })
  variant(15, 2, {
    title: 'Glue field',
    moves: ['Sparks pop up and fade all along the strings and around them: the glue that ties the quarks together.', 'The three quarks glow softly, each on its own beat.', 'Nothing changes place.'],
    setup(L) { L.strings = L.liftAll({ rect: [88, 40, 250, 176], pred: stringPred }) },
    draw(L, t, K) {
      const k = Math.min(1, K), sp = L.strings
      L.drawSprite(sp, 0, 0)
      for (let i = 0; i < 30 && sp.n; i++) {
        const per = 1.0 + hash(i, 1, 37) * 1.5, q = (t + hash(i, 2, 37) * per) / per, cyc = floor(q), a = Math.pow(sin(Math.PI * (q - cyc)), 2) * k, j = floor(hash(i, cyc, 38) * sp.n)
        const x = sp.xs[j] + round((hash(i, cyc, 39) - 0.5) * 9), y = sp.ys[j] + round((hash(i, cyc, 40) - 0.5) * 9)
        Fx.star(L, x, y, i % 2 ? [255, 235, 140] : [255, 150, 220], 0.95 * a)
      }
      QUARKS.forEach(([x, y, col], i) => L.wash(x, y, 30, col, 0.16 * K * (0.5 + 0.5 * sin(t * 1.1 + i * 2.1))))
    },
  })

  // ================================================================ 17 FIRST QUARKS
  all[16].title = 'Racing pulses'
  const beamPred = (r, g, b) => r < 150 && g > 190 && b > 225
  /** where the beams meet (the leftmost beam pixel) and where the two beams end */
  function beamPoints(L) {
    let ap = [999, 0], e1 = [0, 999], e2 = [0, -1]
    for (let y = 36; y <= 142; y++) for (let x = 96; x <= 262; x++) { const i = (y * W + x) * 4; if (!beamPred(L.base[i], L.base[i + 1], L.base[i + 2])) continue; if (x < ap[0]) ap = [x, y]; if (y < e1[1]) e1 = [x, y]; if (x > 180 && y > e2[1]) e2 = [x, y] }
    L.ap = ap; L.e1 = e1; L.e2 = e2[1] < 0 ? e1 : e2
  }
  variant(16, 1, {
    title: 'Scattering',
    moves: ['Electrons fly in from the left, hit a point inside the proton with a flash, and bounce away along one of the two beams.', 'The two glowing points pulse.'],
    setup(L) { beamPoints(L) },
    draw(L, t, K) {
      const k = Math.min(1, K), ap = L.ap
      for (let i = 0; i < 4; i++) {
        const u = frac(t / 2.6 - i / 4)
        let x, y
        if (u < 0.4) { x = ap[0] * (u / 0.4); y = ap[1] + 3 * sin(x * 0.22) * (1 - u / 0.4) } else { const v = (u - 0.4) / 0.6, e = i % 2 ? L.e1 : L.e2; x = ap[0] + (e[0] - ap[0]) * v; y = ap[1] + (e[1] - ap[1]) * v }
        const a = k * Math.min(1, u * 8, (1 - u) * 6)
        Fx.orb(L, x, y, 4, [150, 230, 255], 0.7 * a); Fx.star(L, x, y, [255, 255, 255], a)
        L.wash(ap[0], ap[1], 12, [220, 245, 255], 0.6 * k * exp(-(((u - 0.4) / 0.05) ** 2)))
      }
      L.wash(62, 78, 18, [255, 90, 90], 0.4 * K * (0.6 + 0.4 * sin(t * 1.7)))
      L.wash(52, 117, 14, [120, 200, 255], 0.4 * K * (0.6 + 0.4 * sin(t * 2.1 + 1)))
    },
  })
  variant(16, 2, {
    title: 'Impact rings',
    moves: ['Rings of light spread from the point where the electron hits, one after another.', 'The two glowing points flare in turn.', 'Nothing changes place.'],
    setup(L) { beamPoints(L) },
    draw(L, t, K) {
      const k = Math.min(1, K), ap = L.ap
      for (let j = 0; j < 3; j++) { const u = frac(t / 2.7 - j / 3); L.ring(ap[0], ap[1], round(3 + 30 * u), [150, 230, 255], 0.75 * k * (1 - u) * Math.min(1, u * 8)) }
      L.wash(ap[0], ap[1], 9, [220, 245, 255], 0.3 * K * (0.6 + 0.4 * sin(t * 2.3)))
      L.wash(62, 78, 18, [255, 90, 90], 0.55 * K * Math.pow(Math.max(0, sin(t * 1.3)), 2))
      L.wash(52, 117, 14, [120, 200, 255], 0.6 * K * Math.pow(Math.max(0, -sin(t * 1.3)), 2))
    },
  })

  // ================================================================ 18 SHORT REACH
  all[17].title = 'Drifting rings'
  variant(17, 1, {
    title: 'Blink in, blink out',
    moves: ['The little rings (W bosons) live only for a moment: each one fades almost away and comes back, at its own time.', 'They stay where they are. Lights run slowly along the platform.'],
    setup(L) { all[17].setup(L) },
    draw(L, t, K) {
      const k = Math.min(1, K)
      L.rings.forEach((s, i) => { const per = 4 + hash(i, 1, 43) * 5, u = frac((t + hash(i, 2, 43) * per) / per); blendSprite(L, s, u < 0.3 ? 1 - 0.8 * k * Math.pow(sin(Math.PI * u / 0.3), 2) : 1) })
      chase(L, t, K, 132, 318, 145, 14, [255, 190, 150], 4, 3)
    },
  })
  variant(17, 2, {
    title: 'Decay sparks',
    moves: ['Now and then one of the little rings throws out two sparks that fly apart and fade, as a W boson decays.', 'The rings stay where they are. Lights run slowly along the platform.'],
    setup(L) { all[17].setup(L) },
    draw(L, t, K) {
      const k = Math.min(1, K)
      L.rings.forEach((s, i) => {
        L.drawSprite(s, 0, 0)
        const per = 4 + hash(i, 1, 45) * 7, q = (t + hash(i, 2, 45) * per) / per, cyc = floor(q), u = (q - cyc) / 0.2; if (u >= 1) return
        const ang = hash(i, cyc, 46) * TAU, d = 3 + 14 * u, a = (1 - u) * k
        Fx.star(L, s.cx + cos(ang) * d, s.cy + sin(ang) * d, [160, 225, 255], a); Fx.star(L, s.cx - cos(ang) * d, s.cy - sin(ang) * d, [255, 240, 150], a)
      })
      chase(L, t, K, 132, 318, 145, 14, [255, 190, 150], 4, 3)
    },
  })

  // ================================================================ 19 RIPPLE SEA
  all[18].title = 'Rings grow steadily'
  variant(18, 1, {
    title: 'Rings grow in bursts',
    moves: ['The rings grow outward in bursts: a push, then a rest, then the next push.', 'The two black holes flash softly at every push.'],
    setup(L) { all[18].setup(L) },
    draw(L, t, K) {
      const T = 11, n = floor(t / T), ph = t / T - n
      all[18].draw(L, (n + smooth(ph / 0.55)) * T, K)
      L.wash(71, 47, 30, [255, 215, 160], 0.4 * Math.min(1, K) * exp(-ph * T * 0.9))
    },
  })
  variant(18, 2, {
    title: 'Rings and the floor',
    moves: ['The rings grow outward slowly, as in design A.', 'The floor answers: pulses of light run across the grid toward you.'],
    setup(L) { L.grid = L.liftAll({ rect: [0, 143, 319, 179], pred: (r, g, b) => g > 120 && b > 160 && r < 130 }); all[18].setup(L) },
    draw(L, t, K) {
      const k = Math.min(1, K)
      all[18].draw(L, t, K)
      L.drawSpriteMap(L.grid, 0, 0, (r, g, b, x, y, c) => toWhite(c, r, g, b, 0.5 * k * exp(-(((mod(y - t * 10, 30) - 3) / 4) ** 2))))
    },
  })

  // ================================================================ 20 COLLISION HALL
  all[19].title = 'Collision events'
  variant(19, 1, {
    title: 'Head-on',
    moves: ['Two bunches of particles race in from the left and the right and meet in the middle.', 'They collide with a soft flash and the rings of the detector light up, then it starts again.', 'Lights run slowly along the floor.'],
    setup() {},
    draw(L, t, K) {
      const k = Math.min(1, K), u = frac(t / 4), CX = 118, CY = 80
      if (u < 0.5) {
        const v = u / 0.5, e = v * v
        for (const [x0, dir] of [[8, 1], [228, -1]]) { const x = x0 + (CX - x0) * e; Fx.line(L, x - dir * 12, CY, x, CY, [170, 220, 255], 0.5 * k); Fx.orb(L, x, CY, 4, [200, 240, 255], 0.8 * k); Fx.star(L, x, CY, [255, 255, 255], k) }
      } else {
        const e = exp(-(u - 0.5) * 9) * k
        light(L, 14, 38, 222, 139, 70, (x, y) => { const rho = hypot(x - CX, y - CY); return rho > 28 && rho < 100 ? 1 + 0.6 * e : 1 })
        L.wash(CX, CY, 40, [230, 248, 255], 0.6 * e)
      }
      chase(L, t, K, 4, 316, 155, 12, [255, 220, 90], 5, 4)
    },
  })
  variant(19, 2, {
    title: 'Scanner',
    moves: ['A beam of light sweeps slowly around the detector like a radar, lighting the rings and the tracks as it passes.', 'Nothing changes place. Lights run slowly along the floor.'],
    setup() {},
    draw(L, t, K) {
      const k = Math.min(1, K), CX = 118, CY = 80, phi = t * 0.9
      light(L, 14, 15, 222, 139, 60, (x, y) => { const dx = x - CX, dy = y - CY; if (dx * dx + dy * dy > 10000) return 1; const d = angDiff(atan2(dy, dx), phi); return 1 + k * (0.9 * exp(-((d / 0.2) ** 2)) + (d < 0 ? 0.3 * exp(d / 0.8) : 0)) })
      chase(L, t, K, 4, 316, 155, 12, [255, 220, 90], 5, 4)
    },
  })

  // ================================================================ 21 PLANCK FOAM
  all[35].title = 'Everything alive'
  const PAL = [[120, 235, 255], [255, 150, 210], [255, 255, 255], [255, 215, 120]]
  variant(35, 1, {
    title: 'Calm foam',
    moves: ['The bubbles slowly fade and glow again, each at its own pace. They do not move.', 'The glowing heart breathes. Nothing else happens.'],
    setup(L) { all[35].setup(L) },
    draw(L, t, K) {
      const k = Math.min(1, K)
      L.bub.forEach((s, i) => L.drawSprite(s, 0, 0, 1, [110, 90, 190], 0.6 * k * (1 - sin(t * (0.25 + hash(i, 1, 3) * 0.3) + hash(i, 2, 3) * TAU)) / 2))
      L.drawSprite(L.grid, 0, 0)
      L.wash(167, 92, 36, [255, 245, 255], 0.35 * k * (0.6 + 0.4 * sin(t * 0.9)))
    },
  })
  variant(35, 2, {
    title: 'Fizz',
    moves: ['Small bubbles keep rising from the grid like fizz in a glass, growing a little and fading near the top.', 'The big bubbles bob gently up and down.', 'The glowing heart breathes.'],
    setup(L) { all[35].setup(L) },
    draw(L, t, K) {
      const k = Math.min(1, K)
      L.bub.forEach((s, i) => L.drawSprite(s, 0, round(K * 2.5 * sin(t * 0.4 + hash(i, 2, 3) * TAU))))
      L.drawSprite(L.grid, 0, 0)
      for (let i = 0; i < 30; i++) {
        const per = 5 + hash(i, 1, 47) * 4, u = frac((t + hash(i, 2, 47) * per) / per)
        const x = hash(i, 3, 47) * 320 + 2.5 * sin(t * 1.1 + i), y = 138 - u * 126
        L.ring(x, y, round(1 + hash(i, 4, 47) * 2 + u * 1.5), PAL[i % 4], 0.8 * k * sin(Math.PI * u))
      }
      L.wash(167, 92, 36, [255, 245, 255], 0.35 * k * (0.6 + 0.4 * sin(t * 0.9)))
    },
  })
})()

/* Round 3 (15 Nov 2026): the worlds the owner asked to be reworked. These definitions replace the earlier ones of the same slots (the registry keeps the last).
 * Rules that came out of the feedback: nothing resamples a fine pixel pattern (no rotating, no stretching); objects move as ONE whole piece;
 * things that hang together move together; light and colour changes are smooth; there is always something to see, but it is slow. */
(function () {
  'use strict'
  const { def, helpers: H } = Motion
  const { hash, sat, chase, anyOf, motes } = H
  const { clamp, mod } = Engine
  const Fx = window.Fx
  const W = 320, TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, abs = Math.abs, round = Math.round, floor = Math.floor, hypot = Math.hypot, exp = Math.exp, atan2 = Math.atan2
  const lumOf = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b
  const smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u) }
  const inDisc = (cx, cy, r) => (x, y) => (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d }
  /** the box a merged sprite fills */
  function bounds(s) { let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (let k = 0; k < s.n; k++) { if (s.xs[k] < x0) x0 = s.xs[k]; if (s.xs[k] > x1) x1 = s.xs[k]; if (s.ys[k] < y0) y0 = s.ys[k]; if (s.ys[k] > y1) y1 = s.ys[k] } s.minx = x0; s.maxx = x1; s.miny = y0; s.maxy = y1; return s }
  const twSetup = (L, rect, pred, maxArea = 2) => L.lift({ rect, pred, minArea: 1, maxArea })
  const twDraw = (L, list, t, K, deep = 0.6) => { for (const s of list) L.drawSpriteMap(s, 0, 0, (r, g, b, x, y, c) => { const f = 1 - deep * Math.min(1, K) * Math.pow(Math.max(0, sin(t * (0.3 + hash(x, y, 1) * 0.7) + hash(x, y, 2) * TAU)), 2); c[0] = r * f; c[1] = g * f; c[2] = b * f }) }

  // ================================================================ 7 BACTERIA GARDEN
  def(6, {
    name: 'BACTERIA GARDEN', desc: 'Rod-shaped cells lie like logs, and whip-like tails wave through the water.',
    moves: ['Every whip-like tail waves, and the big golden one ripples along its whole length.', 'A glint runs along the chain of green beads, one bead after the next. The beads themselves stay put.', 'Specks in the water twinkle softly.'],
    setup(L) {
      L.flag = L.liftAll({ rect: [146, 15, 320, 72], pred: (r, g, b) => r > 235 && g > 150 && g < 205 && b < 100 })
      const wr = [[131, 12, 166, 30], [183, 2, 214, 18], [271, 6, 299, 26], [301, 30, 320, 46], [88, 64, 114, 82], [187, 63, 218, 80], [236, 124, 268, 147]]
      L.whips = wr.map((rc) => bounds(L.liftAll({ rect: rc, pred: (r, g, b) => (r + g + b) / 3 > 95 && sat(r, g, b) > 25 && !(r > 235 && g > 150 && g < 205 && b < 100) }))).filter((s) => s.n > 4)
      L.sparks = []
      for (let y = 80; y <= 102; y++) for (let x = 28; x <= 155; x++) { const i = (y * W + x) * 4; if (L.base[i] >= 235 && L.base[i + 1] >= 235 && L.base[i + 2] >= 235 && !L.sparks.some((p) => abs(p[0] - x) < 6 && abs(p[1] - y) < 6)) L.sparks.push([x, y]) }
      L.sparks.sort((a, b) => a[0] - b[0])
      L.tw = twSetup(L, [0, 15, 320, 138], (r, g, b) => r > 200 && g > 220 && b > 220)
    },
    draw(L, t, K) {
      L.drawSpriteWarp(L.flag, (x, y, v) => { v.y = K * 2.2 * sin(x * 0.17 - t * 2.8) })
      L.whips.forEach((s, i) => { const span = Math.max(10, s.maxx - s.minx); L.drawSpriteWarp(s, (x, y, v) => { v.y = K * (0.4 + 1.6 * clamp((x - s.minx) / span, 0, 1)) * sin((x - s.minx) * 0.3 - t * 2.2 + i * 1.3) }) })
      L.sparks.forEach((p, i) => { const ph = mod(t - i * 0.28, 4.2) / 0.8; if (ph < 1) Fx.star(L, p[0], p[1], [255, 255, 255], 0.9 * Math.pow(sin(Math.PI * ph), 2) * Math.min(1, K)) })
      twDraw(L, L.tw, t, K)
    },
  })

  // ================================================================ 9 PROTEIN FACTORY
  def(8, {
    name: 'PROTEIN FACTORY', desc: 'Ribosomes bob along a chain of beads, building proteins.',
    moves: ['The whole membrane (golden heads, the tails under them and the little worm on top) rolls up and down together in one slow wave.', 'The chain of orange beads flows in a long, slow wave. The big spheres float a little, each pair as one piece.', 'Specks twinkle softly.'],
    setup(L) {
      const orange = (r, g, b) => r > 150 && r > g + 30 && g > b + 25 && b < 130
      L.chain = L.liftAll({ rect: [0, 44, 320, 82], pred: orange, grow: 1 })   // first: the chain is in front of the spheres
      const a1 = inDisc(88.5, 52.5, 28.5), a2 = inDisc(97, 102, 41)
      L.pairA = L.liftAll({ rect: [48, 14, 140, 139], pred: (r, g, b, x, y) => a1(x, y) || a2(x, y) })
      const b1 = inDisc(272.5, 39.5, 17.5), b2 = inDisc(274, 76, 23.5)
      L.pairB = L.liftAll({ rect: [248, 18, 302, 100], pred: (r, g, b, x, y) => b1(x, y) || b2(x, y) })
      L.worm = L.lift({ rect: [122, 118, 200, 142], pred: (r, g, b) => sat(r, g, b) > 110, minArea: 4, grow: 1, fill: true })
      L.tw = twSetup(L, [0, 15, 320, 135], (r, g, b) => r > 235 && g > 235 && b > 235)
    },
    draw(L, t, K) {
      const mem = (x) => K * 1.3 * sin(x * 0.035 - t * 0.8)
      L.warp(0, 134, 319, 179, (x, y, v) => { v.y = mem(x) * smooth((y - 134) / 10) })
      L.drawSprite(L.pairA, round(K * 1.0 * sin(t * 0.4)), round(K * 1.4 * sin(t * 0.5 + 1)))
      L.drawSprite(L.pairB, round(K * 1.0 * sin(t * 0.35 + 2)), round(K * 1.2 * sin(t * 0.45 + 3)))
      L.drawSpriteWarp(L.chain, (x, y, v) => { v.y = K * 1.5 * sin(x * 0.03 - t * 0.7) })
      L.worm.forEach((s) => L.drawSprite(s, 0, round(mem(160))))
      twDraw(L, L.tw, t, K)
    },
  })

  // ================================================================ 10 DNA FOREST
  const kind = (r, g, b) => (r > 170 && g > 140 && b < 120 ? 0 : g > 140 && r < 150 && b < 160 && g > b - 10 && g > r + 40 ? 1 : r < 120 && g > 150 && b > 170 ? 2 : r > 180 && g < 120 && b < 140 ? 3 : -1)
  def(9, {
    name: 'DNA FOREST', desc: 'Spiral towers with coloured rungs fill the horizon.',
    moves: ['A band of light climbs the towers, lighting each rung and each strand as it passes, like a code being read. The colours never change.', 'Tiny points of light drift upward between the towers.'],
    setup(L) {
      L.rungs = L.liftAll({ rect: [0, 15, 320, 139], pred: (r, g, b) => kind(r, g, b) >= 0 && sat(r, g, b) > 70 })
      L.strands = L.liftAll({ rect: [0, 15, 320, 139], pred: (r, g, b) => sat(r, g, b) > 55 && b > 120 && r > 70 && b >= g + 30 })
    },
    draw(L, t, K) {
      const k = Math.min(1, K)
      const band = (x, y) => { const u = mod(y + 20 * t * k + x * 0.55, 90); return exp(-(((u - 12) / 9) ** 2)) * k }
      L.drawSpriteMap(L.strands, 0, 0, (r, g, b, x, y, c) => { const s = band(x, y) * 0.5; c[0] = r + (255 - r) * s; c[1] = g + (255 - g) * s; c[2] = b + (255 - b) * s })
      L.drawSpriteMap(L.rungs, 0, 0, (r, g, b, x, y, c) => { const s = band(x, y), f = 1 + 0.6 * s; c[0] = Math.min(255, r * f + 30 * s); c[1] = Math.min(255, g * f + 30 * s); c[2] = Math.min(255, b * f + 30 * s) })
      motes(L, t, K, { n: 16, rect: [0, 20, 320, 136], rise: 7, sway: 0.6, amp: 3, color: [170, 225, 255], alpha: 0.6, seed: 5, big: 3 })
    },
  })

  // ================================================================ 12 ELECTRON CLOUDS
  def(11, {
    name: 'ELECTRON CLOUDS', desc: 'Glowing lobes of probability float over a flat platform.',
    moves: ['Three electrons circle the nucleus on tilted orbits, each with a fading trail.', 'A pulse of light travels around the six petals, one after another.', 'Points of light appear and fade across the cloud: places where an electron might be.', 'The nucleus glows and pulses. Lights run slowly along the platform.'],
    setup() {},
    draw(L, t, K) {
      const k = Math.min(1, K), CX = 96, CY = 77
      for (let y = 18; y <= 126; y++) for (let x = 20; x <= 172; x++) {
        const dx = x - CX, dy = y - CY, rho = Math.sqrt(dx * dx + dy * dy)
        if (rho < 9 || rho > 78) continue
        const i = (y * W + x) * 4, wgt = smooth((lumOf(L.cur[i], L.cur[i + 1], L.cur[i + 2]) - 42) / 40)   // only the glowing petals, not the sky around them
        if (wgt > 0) L.mul(x, y, 1 + 0.4 * k * wgt * sin(t * 1.0 - atan2(dy, dx)) * Math.min(1, (rho - 9) / 12))
      }
      for (let i = 0; i < 22; i++) {
        const per = 1.8 + hash(i, 1, 7) * 1.4, q = (t + hash(i, 2, 7) * per) / per, cyc = floor(q), u = q - cyc
        const ang = hash(i, cyc, 8) * TAU, rho = 14 + hash(i, cyc, 9) * 56
        Fx.dot(L, CX + rho * cos(ang), CY + rho * sin(ang) * 0.92, [255, 255, 255], 0.85 * Math.pow(sin(Math.PI * u), 2) * k)
      }
      L.wash(CX, CY, 16, [255, 255, 255], 0.45 * K * (0.6 + 0.4 * sin(t * 1.1)))
      const orbits = [[62, 24, 0, 7.0, [170, 255, 255]], [62, 24, Math.PI / 3, 8.6, [255, 170, 230]], [62, 24, 2 * Math.PI / 3, 10.2, [255, 240, 170]]]
      orbits.forEach(([a, b, tilt, T, col], i) => {
        const ct = cos(tilt), st = sin(tilt)
        const pos = (tt) => { const u = TAU * tt / T + i * 2.1, ex = a * cos(u), ey = b * sin(u); return [CX + ex * ct - ey * st, CY + ex * st + ey * ct] }
        for (let j = 26; j >= 1; j--) { const p = pos(t - j * 0.05); Fx.orb(L, p[0], p[1], 2, col, 0.7 * k * (1 - j / 27)) }
        const p = pos(t); Fx.orb(L, p[0], p[1], 7, col, 1.0 * k); Fx.star(L, p[0], p[1], [255, 255, 255], 1.0 * k)
      })
      chase(L, t, K, 143, 312, 144, 12, [150, 255, 255], 4, 3)
    },
  })

  // ================================================================ 13 GAMMA SEA
  const HINT = [70, 61, 52, 43, 34, 25, 16]   // the seven waves are 9 pixels apart in wavelength
  const PAIRS = [[0x2d247f, 0x5a48ff], [0x1d3c7f, 0x3a78ff], [0x1d607f, 0x3ac0ff], [0x2d707f, 0x5be0ff], [0x45787f, 0x8af0ff], [0x607c7f, 0xc0f8ff], [0x747e7f, 0xe8fcff]]
  /** the best sine through (x, y) points: scan the wavelength, solve the rest by least squares */
  function fitSine(X, Y, lo = 10, hi = 170) {
    let best = null
    const solve = (k) => {
      let s0 = 0, s1 = 0, s2 = 0, s11 = 0, s12 = 0, s22 = 0, y0 = 0, y1 = 0, y2 = 0
      for (let i = 0; i < X.length; i++) { const a = sin(k * X[i]), b = cos(k * X[i]); s0++; s1 += a; s2 += b; s11 += a * a; s12 += a * b; s22 += b * b; y0 += Y[i]; y1 += Y[i] * a; y2 += Y[i] * b }
      const M = [[s0, s1, s2, y0], [s1, s11, s12, y1], [s2, s12, s22, y2]]
      for (let c = 0; c < 3; c++) { let p = c; for (let r = c + 1; r < 3; r++) if (abs(M[r][c]) > abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; if (abs(M[c][c]) < 1e-9) return null; for (let r = 0; r < 3; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let q = c; q < 4; q++) M[r][q] -= f * M[c][q] } }
      const c0 = M[0][3] / M[0][0], a = M[1][3] / M[1][1], b = M[2][3] / M[2][2]
      let e = 0; for (let i = 0; i < X.length; i++) { const d = Y[i] - (c0 + a * sin(k * X[i]) + b * cos(k * X[i])); e += d * d }
      return { c0, a, b, k, e }
    }
    for (let lam = lo; lam <= hi; lam += 0.1) { const r = solve(TAU / lam); if (r && (!best || r.e < best.e)) best = r }
    for (let lam = TAU / best.k - 0.4; lam <= TAU / best.k + 0.4; lam += 0.02) { const r = solve(TAU / lam); if (r && r.e < best.e) best = r }
    best.lam = TAU / best.k; best.rms = Math.sqrt(best.e / X.length)
    return best
  }
  def(12, {
    name: 'GAMMA SEA', desc: 'Gamma rays from radioactive atoms have waves about as long as you are tall.',
    moves: ['Every wave rolls sideways to the right at the same speed, the way a wave travels.', 'The bright wave packets ride along with them.', 'Lights run along the floor.'],
    setup(L) {
      // the packets and the waves are cut out together, so the background that fills the holes really is background
      const res = L.liftGroups([{ rect: [0, 0, 320, 141], pred: (r, g, b) => r >= 250 && g >= 250 && b >= 250, minArea: 25, grow: 2 }, ...PAIRS.map(([c1, c2]) => ({ rect: [0, 15, 320, 134], pred: anyOf([c1, c2]) }))])
      L.packets = res[0].map(bounds)
      L.curves = PAIRS.map(([c1, c2], ci) => {
        const sp = bounds(L.merge(res[ci + 1]))
        const cols = Array.from({ length: W }, () => []), sums = new Float64Array(W), cnt = new Int16Array(W)
        let n1 = 0, n2 = 0; for (let k = 0; k < sp.n; k++) { const v = (sp.cols[k * 3] << 16) | (sp.cols[k * 3 + 1] << 8) | sp.cols[k * 3 + 2]; if (v === c1) n1++; else if (v === c2) n2++ }
        const cm = n1 > n2 ? c1 : c2, R = (cm >> 16) & 255, G = (cm >> 8) & 255, B = cm & 255
        for (let k = 0; k < sp.n; k++) { cols[sp.xs[k]].push(k); if (sp.cols[k * 3] === R && sp.cols[k * 3 + 1] === G && sp.cols[k * 3 + 2] === B) { sums[sp.xs[k]] += sp.ys[k]; cnt[sp.xs[k]]++ } }
        let X = [], Y = []
        for (let x = 0; x < W; x++) if (cnt[x]) { X.push(x); Y.push(sums[x] / cnt[x]) }
        let f = fitSine(X, Y, HINT[ci] - 3, HINT[ci] + 3)
        const X2 = [], Y2 = []
        for (let i = 0; i < X.length; i++) if (abs(Y[i] - (f.c0 + f.a * sin(f.k * X[i]) + f.b * cos(f.k * X[i]))) < 2.5) { X2.push(X[i]); Y2.push(Y[i]) }
        if (X2.length > 40) f = fitSine(X2, Y2, HINT[ci] - 3, HINT[ci] + 3)
        const fit = (x) => f.c0 + f.a * sin(f.k * x) + f.b * cos(f.k * x)
        for (let x = 0; x < W; x++) cols[x] = cols[x].filter((kk) => abs(sp.ys[kk] - fit(x)) <= 3.6)   // stray pixels of other things are not part of the wave
        const ok = new Uint8Array(W)
        for (let x = 0; x < W; x++) ok[x] = cnt[x] > 0 && abs(sums[x] / cnt[x] - fit(x)) <= 1.7 && cols[x].length < 9 ? 1 : 0
        return { sp, cols, fit, ok, P: Math.max(8, round(f.lam)), lam: f.lam, rms: f.rms }
      })
    },
    draw(L, t, K) {
      const s = floor(K * 12 * t)
      for (const cv of L.curves) {
        if (s === 0) { L.drawSprite(cv.sp, 0, 0); continue }
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
      for (const p of L.packets) { const w = p.maxx - p.minx + 1; L.drawSprite(p, mod(p.minx + s + w, W + w) - w - p.minx, 0) }
      chase(L, t, K, 4, 316, 158, 8, [140, 230, 255], 8, 5)
    },
  })

  // ================================================================ 14 THE GREAT EMPTY
  def(13, {
    name: 'THE GREAT EMPTY', desc: 'Faint orbits sweep around a speck of a nucleus, far away.',
    moves: ['The two blue lights travel around the orange nucleus on their orbits, each with a fading trail.', 'A sweep of light turns around the nucleus and lights up the faint orbit marks as it passes.', 'The orange glow breathes. Stars twinkle softly.'],
    setup(L) {
      L.l1 = L.liftAll({ rect: [44, 12, 72, 40], pred: (r, g, b, x, y) => (x - 57) ** 2 + (y - 25.5) ** 2 <= 90 })
      L.l2 = L.liftAll({ rect: [190, 90, 218, 116], pred: (r, g, b, x, y) => (x - 204) ** 2 + (y - 103) ** 2 <= 90 })
      L.tw = [L.liftAll({ rect: [0, 15, 320, 138], pred: (r, g, b) => r > 200 && g > 200 && b > 220 })]
    },
    draw(L, t, K) {
      const k = Math.min(1, K), SX = 65, SY = 62.5, SQ = 0.55
      for (let y = 15; y <= 138; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4, r = L.cur[i], g = L.cur[i + 1], b = L.cur[i + 2]
        if (b > r + 40 && b > g + 20 && b > 70) { const d = angDiff(atan2(y - SY, x - SX), TAU * t / 12 - Math.PI); L.mul(x, y, 1 + 0.9 * k * exp(-((d / 0.3) ** 2))) }
      }
      for (let y = 38; y <= 88; y++) for (let x = 38; x <= 92; x++) if ((x - SX) ** 2 + (y - SY) ** 2 <= 484) L.mul(x, y, 1 + 0.14 * k * sin(t * 1.0))
      L.wash(SX, SY, 20, [255, 200, 120], 0.22 * K * (0.6 + 0.4 * sin(t * 1.0)))
      for (const [sp, cx, cy, T] of [[L.l1, 57, 25.5, -14], [L.l2, 204, 103, -40]]) {
        const rx = cx - SX, ry = (cy - SY) / SQ, rho = hypot(rx, ry), th0 = atan2(ry, rx)
        const pos = (tt) => { const u = th0 + TAU * tt / T; return [SX + rho * cos(u), SY + SQ * rho * sin(u)] }
        const p0 = pos(0), p = pos(K * t), ox = round(p[0] - p0[0]), oy = round(p[1] - p0[1])
        L.drawSpriteMap(sp, ox, oy, (r, g, b, x, y) => y < 139)
        for (let j = 10; j >= 1; j--) { const q = pos(K * t - j * T / 220); if (q[1] < 138) Fx.dot(L, q[0], q[1], [150, 200, 255], 0.5 * k * (1 - j / 11)) }
      }
      twDraw(L, L.tw, t, K, 0.5)
    },
  })

  // ================================================================ 15 NUCLEUS CITY
  def(14, {
    name: 'NUCLEUS CITY', desc: 'A tight cluster of particles packs together like a city block.',
    moves: ['The whole cluster of particles shivers gently, as one piece.', 'A slow wave of light passes over it, and glints flash on the particles one after another.', 'The two loose particles circle around their places.', 'Lights run slowly along the platform.'],
    setup(L) {
      const cl = inDisc(103, 73, 74)
      L.cluster = L.liftAll({ rect: [30, 8, 175, 140], pred: (r, g, b, x, y) => ((r > g + 35 && r > b + 20) || (b > r + 45 && b > g + 25)) && cl(x, y), grow: 1, fill: true })
      const dsc = (cx, cy, rr) => (r, g, b, x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= rr * rr
      L.far = [L.liftAll({ rect: [284, 26, 316, 72], pred: dsc(300, 44, 10.5) }), L.liftAll({ rect: [262, 98, 300, 132], pred: dsc(282, 112, 8.5) })]
      L.glints = [[84, 21], [122, 24], [105, 35], [77, 40], [58, 54], [82, 60], [135, 59], [115, 68], [63, 78], [142, 91], [118, 95], [69, 104], [88, 103]]
      L.hi = [L.liftAll({ rect: [0, 15, 320, 140], pred: (r, g, b) => r > 245 && g > 245 && b > 245 })]
    },
    draw(L, t, K) {
      const k = Math.min(1, K), bx = round(K * 1.0 * sin(t * 0.9)), by = round(K * 1.5 * sin(t * 1.1 + 1))
      L.drawSpriteMap(L.cluster, bx, by, (r, g, b, x, y, c) => { const f = 1 + 0.13 * k * sin(0.06 * (x + 0.6 * y) - t * 0.9); c[0] = Math.min(255, r * f); c[1] = Math.min(255, g * f); c[2] = Math.min(255, b * f) })
      L.glints.forEach((p, i) => { const ph = mod(t * 0.8 - i * 0.37, 3.2) / 0.7; if (ph < 1) Fx.star(L, p[0] + bx, p[1] + by, [255, 255, 255], 0.95 * Math.pow(sin(Math.PI * ph), 2) * k) })
      const loops = [[8, 9, 1], [6, 7, -1]]
      L.far.forEach((s, i) => { const [R, T, dir] = loops[i], u = TAU * K * t / T * dir; L.drawSprite(s, round(R * sin(u)), round(R * (1 - cos(u)))) })
      twDraw(L, L.hi, t, K, 0.7)
      chase(L, t, K, 132, 312, 146, 14, [255, 210, 255], 4, 3)
    },
  })

  // ================================================================ 19 RIPPLE SEA
  def(18, {
    name: 'RIPPLE SEA', desc: "A passing gravitational wave stretched LIGO's arms by about two of you.",
    moves: ['The ripples grow outward slowly from the two black holes. New rings are born just outside the first ring and fade in as they leave it.', 'The black holes and the first ring stay still.'],
    setup(L) {
      const CX = 83, CY = 52, RY = 0.56
      L.rho = (x, y) => Math.sqrt((x - CX) * (x - CX) + ((y - CY) / RY) * ((y - CY) / RY))
      L.rings = L.liftAll({ rect: [0, 15, 320, 136], pred: (r, g, b, x, y) => lumOf(r, g, b) > 62 && L.rho(x, y) >= 40 })
      L.on = new Uint8Array(W * 180); L.rc = new Uint8Array(W * 180 * 3)
      for (let k = 0; k < L.rings.n; k++) { const p = L.rings.ys[k] * W + L.rings.xs[k]; L.on[p] = 1; L.rc[p * 3] = L.rings.cols[k * 3]; L.rc[p * 3 + 1] = L.rings.cols[k * 3 + 1]; L.rc[p * 3 + 2] = L.rings.cols[k * 3 + 2] }
    },
    draw(L, t, K) {
      const G = 22, T = 11, s = G * mod(K * t / T, 1)
      if (s === 0) { L.drawSprite(L.rings, 0, 0); return }
      const a = s / G, CX = 83, CY = 52, o = L.out
      const at = (x, y, rho, rr) => { const f = rr / rho, sx = round(CX + (x - CX) * f), sy = round(CY + (y - CY) * f); if (sx < 0 || sy < 15 || sx >= W || sy > 136) return -1; const p = sy * W + sx; return L.on[p] ? p : -1 }
      for (let y = 15; y <= 136; y++) for (let x = 0; x < W; x++) {
        const rho = L.rho(x, y); if (rho < 40) continue
        const i = (y * W + x) * 4
        if (rho < 62) { const p = y * W + x; if (L.on[p]) { o[i] = L.rc[p * 3]; o[i + 1] = L.rc[p * 3 + 1]; o[i + 2] = L.rc[p * 3 + 2] } continue }   // the black holes and the first ring stay as they are
        const fade = smooth((rho - 62) / 6), pa = at(x, y, rho, rho - s), pb = at(x, y, rho, rho + (G - s)), wa = (1 - a) * fade, wb = a * fade   // new rings fade in as they leave the first ring
        if (pa < 0 && pb < 0) continue
        if (pa >= 0) { o[i] += (L.rc[pa * 3] - o[i]) * wa; o[i + 1] += (L.rc[pa * 3 + 1] - o[i + 1]) * wa; o[i + 2] += (L.rc[pa * 3 + 2] - o[i + 2]) * wa }
        if (pb >= 0) { o[i] += (L.rc[pb * 3] - o[i]) * wb; o[i + 1] += (L.rc[pb * 3 + 1] - o[i + 1]) * wb; o[i + 2] += (L.rc[pb * 3 + 2] - o[i + 2]) * wb }
      }
    },
  })

  // ================================================================ 20 COLLISION HALL
  def(19, {
    name: 'COLLISION HALL', desc: 'The LHC reaches this small. Quarks still show no parts inside.',
    moves: ['Every seven seconds a collision flashes in the middle: the tracks shoot out from it, and the rings of the detector light up one after another as they are reached. Then the tracks fade, and it starts again.', 'In between, soft light slowly turns around each ring, the rings in opposite directions.', 'Lights run slowly along the floor.'],
    setup(L) { L.tracks = L.liftAll({ rect: [78, 42, 160, 124], pred: (r, g, b) => sat(r, g, b) > 100 && lumOf(r, g, b) > 120 }) },
    draw(L, t, K) {
      const k = Math.min(1, K), CX = 118, CY = 80, p = mod(t, 7)
      const R = clamp(p * 75, 0, 130), fade = p < 4.6 ? 1 : p < 5.8 ? 1 - 0.85 * smooth((p - 4.6) / 1.2) : 0.15 + 0.85 * 0
      const reveal = k > 0 ? R : 1e9
      L.drawSpriteMap(L.tracks, 0, 0, (r, g, b, x, y, c) => { const rho = hypot(x - CX, y - CY); if (rho > reveal) return false; const a = k > 0 ? Math.max(0.15, 1 - (1 - fade) * k) : 1; c[0] = r * a; c[1] = g * a; c[2] = b * a })
      for (let y = 38; y <= 139; y++) for (let x = 14; x <= 222; x++) {
        const dx = x - CX, dy = y - CY, rho = Math.sqrt(dx * dx + dy * dy)
        if (rho < 28 || rho > 100) continue
        const i = (y * W + x) * 4; if (lumOf(L.out[i], L.out[i + 1], L.out[i + 2]) < 70) continue
        const dir = rho < 52 ? 1 : rho < 70 ? -1 : rho < 86 ? 1 : -1
        let f = 1 + 0.15 * k * sin(8 * atan2(dy, dx) + dir * t * 0.6)
        if (R < 120) f += 0.7 * k * exp(-(((rho - R) / 7) ** 2))
        L.mul(x, y, f)
      }
      L.wash(CX, CY, 34, [230, 248, 255], 0.5 * k * exp(-p * 3.5))
      chase(L, t, K, 4, 316, 155, 12, [255, 220, 90], 5, 4)
    },
  })

  // ================================================================ 21 PLANCK FOAM (the special one)
  def(35, {
    name: 'PLANCK FOAM', desc: "About the Planck length, where physicists expect today's theories to stop working.",
    moves: ['The foam is alive: every bubble slowly drifts, fades and glows again at its own pace.', 'A wave of light leaves the glowing heart every few seconds and sweeps through the whole foam.', 'Soft rays turn slowly around the heart.', 'Pairs of tiny particles pop into being, drift apart and vanish, and new bubbles are born, grow and fade: the quantum foam.', 'Light runs along the grid, toward the horizon.'],
    setup(L) {
      L.bub = L.lift({ rect: [0, 15, 320, 141], pred: (r, g, b) => sat(r, g, b) > 60 && lumOf(r, g, b) > 90, minArea: 6, keep: (c) => c.w <= 100 && c.h <= 100 })
      L.grid = L.liftAll({ rect: [0, 112, 319, 179], pred: (r, g, b) => g > 120 && b > 170 && r < 140 })
    },
    draw(L, t, K) {
      const k = Math.min(1, K), CX = 167, CY = 92
      L.bub.forEach((s, i) => {
        const w = 0.4 + hash(i, 1, 3) * 0.5, ph = hash(i, 2, 3) * TAU
        const mix = 0.55 * k * (1 - sin(t * w + ph)) / 2
        L.drawSprite(s, round(K * 2.2 * sin(t * 0.33 + ph)), round(K * 2.2 * sin(t * 0.27 + ph * 1.7)), 1, [110, 90, 190], mix)
      })
      L.drawSpriteMap(L.grid, 0, 0, (r, g, b, x, y, c) => { const s = exp(-(((mod(y + t * 16, 40) - 4) / 5) ** 2)) * k; c[0] = r + (230 - r) * s * 0.5; c[1] = g + (255 - g) * s * 0.5; c[2] = b + (255 - b) * s * 0.5 })
      const Rw = mod(t * 38, 300)
      for (let y = 15; y <= 140; y++) for (let x = 0; x < W; x++) {
        const dx = x - CX, dy = (y - CY) * 1.15, rho = Math.sqrt(dx * dx + dy * dy)
        const s = exp(-(((rho - Rw) / 18) ** 2)) * (1 - Rw / 300)
        if (s > 0.02) L.mul(x, y, 1 + 0.4 * k * s)
        if (rho < 120) { const r2 = 0.06 * k * (0.5 + 0.5 * sin(7 * atan2(dy, dx) + t * 0.35)) * exp(-rho / 50); if (r2 > 0.004) L.add(x, y, 210, 200, 255, r2) }
      }
      L.wash(CX, CY, 34, [255, 245, 255], 0.35 * k * (0.7 + 0.3 * sin(t * 1.2)))
      const pal = [[120, 235, 255], [255, 150, 210], [255, 255, 255], [255, 215, 120]]
      // pairs of tiny particles pop into being, drift apart and vanish
      const per = 0.45, base = floor(t / per)
      for (let idx = base - 5; idx <= base; idx++) {
        const u = (t - idx * per) / (5 * per); if (u < 0 || u > 1) continue
        const ox = 14 + hash(idx, 1, 31) * 292, oy = 18 + hash(idx, 2, 31) * 112, ha = hash(idx, 3, 31) * TAU, sep = 2 + 10 * smooth(u)
        const col = pal[floor(hash(idx, 4, 31) * 4)], a = Math.pow(sin(Math.PI * u), 1.5) * k
        for (const sg of [1, -1]) { const px = ox + sg * cos(ha) * sep, py = oy + sg * sin(ha) * sep; Fx.orb(L, px, py, 4, col, 0.45 * a); Fx.star(L, px, py, col, 0.95 * a) }
      }
      // new bubbles are born: a small ring grows, thins out and fades
      const bper = 0.8, bb = floor(t / bper)
      for (let idx = bb - 4; idx <= bb; idx++) {
        const u = (t - idx * bper) / (5 * bper); if (u < 0 || u > 1) continue
        const ox = 20 + hash(idx, 5, 41) * 280, oy = 24 + hash(idx, 6, 41) * 100, r = 2 + 15 * (1 - (1 - u) * (1 - u)), a = sin(Math.PI * u) * 0.9 * k, col = pal[floor(hash(idx, 7, 41) * 4)]
        L.ring(ox, oy, round(r), col, a)
        if (r > 7) L.ring(ox, oy, round(r * 0.6), col, a * 0.5)
      }
    },
  })
})()

/* 50 more rainbow designs (numbers 13 to 62), drawn with the same tools and the same rules as the first 12 in gem.js:
 * 32 x 32, one shared dark outline, flat blocks, hard edges, light from the top left. Every cell is a SLOT (a spectrum hue 0 red .. 6 violet) and a TONE (0 light .. 3 deep). */
(function () {
  'use strict'
  const { N, C, O, W, poly, each, set, line, stroke, toward, lit, inPoly } = window.Gem.kit
  const P = (g, s, t, pts) => poly(g, C(s, t), pts)
  const tone = (dx, dy) => { const v = lit(dx, dy); return v > 0.55 ? 0 : v > 0 ? 1 : v > -0.55 ? 2 : 3 }
  const reg = (n, cx, cy, r, a0) => Array.from({ length: n }, (_, i) => { const a = a0 + (i * 2 * Math.PI) / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)] })
  const rot = (p, c, a) => { const dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)] }
  const bar = (g, v, p0, p1, w) => { const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1, nx = (-dy / l) * (w / 2), ny = (dx / l) * (w / 2); poly(g, v, [[p0[0] + nx, p0[1] + ny], [p1[0] + nx, p1[1] + ny], [p1[0] - nx, p1[1] - ny], [p0[0] - nx, p0[1] - ny]]) }
  const disc = (g, cx, cy, r, fn) => each(g, (x, y) => { const dx = x - cx, dy = y - cy; return dx * dx + dy * dy <= r * r ? fn(dx, dy, x, y) : -1 })
  const rect = (g, v, x0, y0, x1, y1) => poly(g, v, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]])
  const cl = (v, a, b) => Math.max(a, Math.min(b, v))
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

  const D = [
    // ---------------------------------------------------------------- cut gems
    { name: 'Octagon Rings', vibe: 'four nested frames, red to blue', build(g) {
      const V = reg(8, 16, 16, 14.6, Math.PI / 8), c = [16, 16], sl = [0, 2, 3, 5], rings = [1, 0.72, 0.46, 0.22].map((k) => V.map((p) => toward(c, p, k)))
      for (let r = 0; r < 4; r++) for (let i = 0; i < 8; i++) { const a = rings[r][i], b = rings[r][(i + 1) % 8], t = tone((a[0] + b[0]) / 2 - 16, (a[1] + b[1]) / 2 - 16); if (r < 3) P(g, sl[r], t, [a, b, rings[r + 1][(i + 1) % 8], rings[r + 1][i]]); else P(g, 6, Math.min(2, t), [a, b, c]) }
      rings.forEach((r) => stroke(g, r, O)) } },
    { name: 'Pentagon', vibe: 'five wedges round a pale centre', build(g) {
      const V = reg(5, 16, 17.4, 15.2, -Math.PI / 2), c = [16, 17.4], sl = [0, 1, 2, 3, 5], inner = V.map((p) => toward(c, p, 0.38))
      V.forEach((p, i) => { const q = V[(i + 1) % 5]; P(g, sl[i], tone((p[0] + q[0]) / 2 - c[0], (p[1] + q[1]) / 2 - c[1]), [c, p, q]) })
      P(g, 6, 0, inner); V.forEach((p, i) => line(g, inner[i][0], inner[i][1], p[0], p[1], O)); stroke(g, inner, O); set(g, 15, 16, W) } },
    { name: 'Heptagon', vibe: 'seven wedges, one for every colour', build(g) {
      const V = reg(7, 16, 16.4, 15, -Math.PI / 2), c = [16, 16.4], inner = V.map((p) => toward(c, p, 0.36))
      V.forEach((p, i) => { const q = V[(i + 1) % 7]; P(g, i, tone((p[0] + q[0]) / 2 - c[0], (p[1] + q[1]) / 2 - c[1]), [c, p, q]) })
      P(g, 2, 0, inner); V.forEach((p, i) => line(g, inner[i][0], inner[i][1], p[0], p[1], O)); stroke(g, inner, O) } },
    { name: 'Cushion Quad', vibe: 'a soft square split in four colours', build(g) {
      each(g, (x, y) => { const u = (x - 16) / 14, v = (y - 16) / 14; if (Math.pow(Math.abs(u), 3.4) + Math.pow(Math.abs(v), 3.4) > 1) return -1; return C(x < 16 ? (y < 16 ? 0 : 5) : (y < 16 ? 2 : 3), x < 16 ? (y < 16 ? 0 : 1) : (y < 16 ? 1 : 2)) })
      line(g, 3, 16, 29, 16, O); line(g, 16, 3, 16, 29, O); disc(g, 16, 16, 3.4, (dx, dy) => C(6, dx + dy < 0 ? 0 : 1)); set(g, 15, 15, W) } },
    { name: 'Oval Rings', vibe: 'an oval cut with rings from red to violet', build(g) {
      each(g, (x, y) => { const u = (x - 16) / 14, v = (y - 16) / 10.4, e = Math.hypot(u, v); if (e > 1) return -1; return C(cl(Math.floor((1 - e) * 7.4), 0, 6), lit(x - 16, y - 16) > 0.3 ? 0 : lit(x - 16, y - 16) > -0.3 ? 1 : 2) })
      set(g, 8, 11, W); set(g, 9, 10, W); set(g, 7, 12, W) } },
    { name: 'Emerald Bands', vibe: 'a clipped rectangle with a stripe for every colour', build(g) {
      const pts = [[8, 3], [24, 3], [29, 8], [29, 24], [24, 29], [8, 29], [3, 24], [3, 8]]
      each(g, (x, y) => (inPoly(pts, x, y) ? C(cl(Math.floor((y - 3) / 3.75), 0, 6), x < 10 ? 0 : x > 22 ? 2 : 1) : -1)); stroke(g, [[8, 8], [24, 8], [24, 24], [8, 24]], O) } },
    { name: 'Lozenge', vibe: 'a wide diamond striped on the diagonal', build(g) {
      const pts = [[1, 16], [16, 5], [31, 16], [16, 27]]
      each(g, (x, y) => (inPoly(pts, x, y) ? C(cl(Math.floor((x + y - 17) / 4.4), 0, 6), y < 16 ? 1 : 2) : -1)); line(g, 2, 16, 30, 16, O); set(g, 11, 11, W); set(g, 12, 10, W) } },
    { name: 'Cut Diamond', vibe: 'the classic diamond, a colour on every facet', build(g) {
      const f = ([x, y]) => [16 + x * 14.6, 16 + (y - 0.1) * 14.6], A = f([-0.52, -0.8]), B = f([0.52, -0.8]), E = f([-1, -0.2]), Cc = f([1, -0.2]), g1 = f([-0.5, -0.2]), g2 = f([0, -0.2]), g3 = f([0.5, -0.2]), p1 = f([-0.26, -0.8]), p2 = f([0.26, -0.8]), Dd = f([0, 1])
      const cr = [[A, p1, g1, 0, 0], [p1, g2, g1, 1, 1], [p1, p2, g2, 2, 0], [p2, g3, g2, 3, 1], [p2, B, g3, 4, 0], [A, g1, E, 6, 1], [B, Cc, g3, 5, 1]]
      cr.forEach(([a, b, c, s, t]) => P(g, s, t, [a, b, c])); P(g, 0, 2, [E, g1, Dd]); P(g, 1, 2, [g1, g2, Dd]); P(g, 3, 3, [g2, g3, Dd]); P(g, 5, 3, [g3, Cc, Dd]); line(g, E[0], E[1], Cc[0], Cc[1], O) } },
    { name: 'Octahedron', vibe: 'a double pyramid, four faces four colours', build(g) {
      const T = [16, 1.5], R = [29, 16], B = [16, 30.5], L = [3, 16], F = [16, 19]
      P(g, 0, 0, [T, L, F]); P(g, 2, 1, [T, R, F]); P(g, 5, 1, [B, L, F]); P(g, 3, 2, [B, R, F]); line(g, 16, 2, 16, 19, O); line(g, 4, 16, 28, 16, O) } },
    { name: 'Pyramid', vibe: 'a striped pyramid with a lit face and a dark face', build(g) {
      const left = [[16, 2], [2, 29], [19, 29]], right = [[16, 2], [19, 29], [30, 29]]
      each(g, (x, y) => (inPoly(left, x, y) ? C(cl(Math.floor((y - 2) / 3.9), 0, 6), 0) : inPoly(right, x, y) ? C(cl(Math.floor((y - 2) / 3.9), 0, 6), 2) : -1)); line(g, 16, 3, 19, 28, O) } },
    // ---------------------------------------------------------------- sky and nature
    { name: 'Crescent', vibe: 'a moon with a band of colour on every curve', build(g) {
      each(g, (x, y) => { if (Math.hypot(x - 16, y - 16) > 13.6 || Math.hypot(x - 21.5, y - 12.5) <= 11) return -1; const l = lit(x - 14, y - 16); return C(cl(Math.floor((x - y + 18) / 4.6), 0, 6), l > 0.35 ? 0 : l > -0.2 ? 1 : 2) })
      set(g, 24, 7, W); set(g, 26, 10, W); set(g, 25, 8, W) } },
    { name: 'Sun', vibe: 'a golden core with a ray of every colour', build(g) {
      for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4, c = [16, 16]; const base = [[16 - 3.3, 16 - 6], [16 + 3.3, 16 - 6], [16, 16 - 15.4]].map((p) => rot(p, c, a)); P(g, [0, 1, 2, 3, 4, 5, 6, 0][k], tone(Math.sin(a), -Math.cos(a)), base) }
      disc(g, 16, 16, 6.6, (dx, dy) => C(2, lit(dx, dy) > 0.2 ? 0 : 1)); set(g, 13, 13, W) } },
    { name: 'Blossom', vibe: 'five petals, five colours, a golden heart', build(g) {
      const sl = [0, 1, 3, 5, 6]
      for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5, cx = 16 + 8.8 * Math.cos(a), cy = 16 + 8.8 * Math.sin(a), ca = Math.cos(-a), sa = Math.sin(-a)
        each(g, (x, y) => { const dx = x - cx, dy = y - cy, u = dx * ca - dy * sa, v = dx * sa + dy * ca; if ((u / 6.4) ** 2 + (v / 4.6) ** 2 > 1) return -1; return C(sl[k], (u / 3.4) ** 2 + (v / 2.4) ** 2 < 1 && u > 0 ? 0 : tone(Math.cos(a), Math.sin(a)) === 0 ? 0 : 1) }) }
      disc(g, 16, 16, 4, (dx, dy) => C(2, dx + dy < 0 ? 0 : 1)); set(g, 15, 15, W) } },
    { name: 'Clover', vibe: 'four lobes, each a different colour', build(g) {
      ;[[16, 8.8, 0], [23.2, 16, 2], [16, 23.2, 3], [8.8, 16, 5]].forEach(([cx, cy, s]) => { disc(g, cx, cy, 5.9, (dx, dy) => C(s, lit(dx, dy) > 0.25 ? 0 : lit(dx, dy) > -0.45 ? 1 : 2)) })
      disc(g, 16, 16, 3.6, (dx, dy) => C(6, dx + dy < 0 ? 0 : 1)); set(g, 14, 14, W) } },
    { name: 'Butterfly', vibe: 'four wings from red to violet', build(g) {
      const wing = (cx, cy, rx, ry, a, s, sp, mirror) => { const ca = Math.cos(a), sa = Math.sin(a); each(g, (x, y) => { const dx = x - cx, dy = y - cy, u = dx * ca + dy * sa, v = -dx * sa + dy * ca; if ((u / rx) ** 2 + (v / ry) ** 2 > 1) return -1; return (u / (rx * 0.45) - 0.2) ** 2 + (v / (ry * 0.45)) ** 2 < 1 ? C(sp, 0) : C(s, (dx + dy) * (mirror ? -1 : 1) < 0 ? 1 : 2) }) }
      wing(9.4, 10.5, 7.8, 8.4, -0.5, 0, 2, false); wing(22.6, 10.5, 7.8, 8.4, 0.5, 5, 4, true); wing(11.2, 22, 5.6, 6, 0.5, 1, 2, false); wing(20.8, 22, 5.6, 6, -0.5, 6, 3, true)
      rect(g, C(6, 3), 15, 7, 17, 27); line(g, 15, 7, 12, 3, O); line(g, 17, 7, 20, 3, O) } },
    { name: 'Leaf', vibe: 'a leaf with a stripe for every colour', build(g) {
      each(g, (x, y) => { const dx = x - 16, dy = y - 16, a = (dx - dy) / 1.414, b = (dx + dy) / 1.414; if (Math.abs(a) > 14.8) return -1; const w = 7.4 * Math.pow(1 - (a / 14.8) ** 2, 0.8); if (Math.abs(b) > w) return -1; if (Math.abs(b) < 0.6) return O; return C(cl(Math.floor((a + 14.8) / 4.25), 0, 6), b < 0 ? 0 : 2) }) } },
    { name: 'Cloud', vibe: 'a pale cloud in front of a rainbow', build(g) {
      each(g, (x, y) => { if (y > 27) return -1; const d = Math.hypot(x - 16, y - 25); if (d > 15.4 || d < 6) return -1; return C([0, 1, 2, 3, 5, 6][cl(Math.floor((15.4 - d) / 1.57), 0, 5)], 1) })
      const cloud = (x, y) => Math.hypot(x - 8.5, y - 25.6) <= 4.4 || Math.hypot(x - 15, y - 22.8) <= 5.6 || Math.hypot(x - 22.5, y - 25) <= 4.6 || (x >= 8.5 && x <= 22.5 && y >= 25 && y <= 29.5)
      each(g, (x, y) => (cloud(x, y) ? C(4, y > 25.5 ? 2 : 0) : -1)) } },
    { name: 'Comet', vibe: 'a golden head trailing seven colours', build(g) {
      const d = [-0.707, -0.707]
      each(g, (x, y) => { const px = x - 22.5, py = y - 22.5, s = px * d[0] + py * d[1], p = px * -d[1] + py * d[0]; if (s < 0 || s > 27) return -1; const h = 6 * (1 - s / 27) + 0.8; if (Math.abs(p) > h) return -1; return C(cl(Math.floor(((p + h) / (2 * h)) * 7), 0, 6), 1) })
      disc(g, 23, 23, 6.2, (dx, dy) => C(2, lit(dx, dy) > 0.2 ? 0 : lit(dx, dy) > -0.4 ? 1 : 2)); set(g, 21, 20, W); set(g, 22, 19, W) } },
    { name: 'Peaks', vibe: 'three peaks, red, blue and green', build(g) {
      P(g, 3, 0, [[0, 28], [10, 11], [10, 28]]); P(g, 3, 2, [[10, 11], [20, 28], [10, 28]])
      P(g, 5, 0, [[8, 28], [19, 3], [19, 28]]); P(g, 5, 2, [[19, 3], [30, 28], [19, 28]]); P(g, 4, 0, [[19, 3], [15.4, 10.6], [19, 12], [22, 10.6]])
      P(g, 0, 1, [[18, 28], [25.5, 14], [25.5, 28]]); P(g, 0, 3, [[25.5, 14], [31.5, 28], [25.5, 28]]); stroke(g, [[19, 3], [19, 28]], O) } },
    { name: 'Ribbon Wave', vibe: 'a rainbow ribbon rolling across', build(g) {
      each(g, (x, y) => { if (x < 1.5 || x > 30.5) return -1; const y0 = 16 + 5.6 * Math.sin((x - 1) * 0.36), v = (y - y0) / 6.6; if (Math.abs(v) > 1) return -1; return C([0, 1, 2, 3, 5, 6][cl(Math.floor((v + 1) * 3), 0, 5)], v < -0.5 ? 0 : v < 0.4 ? 1 : 2) }) } },
    // ---------------------------------------------------------------- symbols
    { name: 'Bolt', vibe: 'a lightning bolt striped in every colour', build(g) {
      const pts = [[21, 1], [5, 18], [14.5, 18], [10, 31], [28, 12], [18, 12]]
      each(g, (x, y) => (inPoly(pts, x, y) ? C(cl(Math.floor((y - 1) / 4.3), 0, 6), x < 16 ? 0 : 2) : -1)) } },
    { name: 'Chevrons', vibe: 'six arrowheads stacked, red to violet', build(g) {
      for (let i = 0; i < 6; i++) { const y0 = 1.5 + i * 3.2, s = [0, 1, 2, 3, 5, 6][i]; P(g, s, 0, [[3, y0], [16, y0 + 9], [16, y0 + 12.2], [3, y0 + 3.2]]); P(g, s, 2, [[16, y0 + 9], [29, y0], [29, y0 + 3.2], [16, y0 + 12.2]]) } } },
    { name: 'Infinity', vibe: 'a loop of light that never ends', build(g) {
      const pts = []; for (let i = 0; i < 260; i++) { const t = (i / 260) * Math.PI * 2, d = 1 + Math.sin(t) ** 2; pts.push([16 + (14 * Math.cos(t)) / d, 16 + (17 * Math.sin(t) * Math.cos(t)) / d]) }
      each(g, (x, y) => { let m = 99; for (const p of pts) m = Math.min(m, Math.hypot(x - p[0], y - p[1])); return m <= 2.5 ? C(cl(Math.floor((x - 1.5) / 4.3), 0, 6), m < 1.2 ? 0 : 1) : -1 }) } },
    { name: 'Atom', vibe: 'three coloured orbits round a golden core', build(g) {
      const ors = [[0, 0], [Math.PI / 3, 3], [(2 * Math.PI) / 3, 5]]
      each(g, (x, y) => { let best = 9, bs = -1; for (const [a, s] of ors) { const dx = x - 16, dy = y - 16, u = dx * Math.cos(a) + dy * Math.sin(a), v = -dx * Math.sin(a) + dy * Math.cos(a), e = Math.abs(Math.hypot(u / 14, v / 5.2) - 1); if (e < best) { best = e; bs = s } } return best < 0.17 ? C(bs, 1) : -1 })
      disc(g, 16, 16, 3.6, (dx, dy) => C(2, dx + dy < 0 ? 0 : 1)); ;[[29, 16], [9, 4.5], [9, 27.5]].forEach(([x, y]) => disc(g, x, y, 1.6, () => W)) } },
    { name: 'Honeycomb', vibe: 'three hexagon cells, red, green and blue', build(g) {
      ;[[16, 9.6, 0], [9.6, 20.8, 3], [22.4, 20.8, 5]].forEach(([cx, cy, s]) => { const V = reg(6, cx, cy, 7.8, -Math.PI / 2); each(g, (x, y) => (inPoly(V, x, y) ? C(s, x < cx - 1 ? 0 : x < cx + 2 ? 1 : 2) : -1)); stroke(g, V, O) }) } },
    { name: 'Crown', vibe: 'a golden crown set with coloured stones', build(g) {
      const pts = [[3, 27], [3, 9], [10, 17], [16, 4], [22, 17], [29, 9], [29, 27]]
      each(g, (x, y) => (inPoly(pts, x, y) ? C(2, x < 12 ? 0 : x > 20 ? 2 : 1) : -1)); line(g, 4, 21, 28, 21, O)
      ;[[9, 24.2, 0], [16, 24.2, 5], [23, 24.2, 3]].forEach(([x, y, s]) => disc(g, x, y, 2.1, (dx, dy) => C(s, dx + dy < 0 ? 0 : 1)))
      ;[[3.5, 8, 0], [16, 3.4, 4], [28.5, 8, 6]].forEach(([x, y, s]) => disc(g, x, y, 1.7, () => C(s, 0))) } },
    { name: 'Cross', vibe: 'five small squares, five colours', build(g) {
      const sq = (x0, y0, s, t) => { rect(g, C(s, 1), x0, y0, x0 + 8, y0 + 8); rect(g, C(s, 0), x0, y0, x0 + 8, y0 + 1.4); rect(g, C(s, 0), x0, y0, x0 + 1.4, y0 + 8); rect(g, C(s, t), x0 + 6.6, y0, x0 + 8, y0 + 8); rect(g, C(s, t), x0, y0 + 6.6, x0 + 8, y0 + 8) }
      sq(12, 12, 2, 2); sq(12, 2, 0, 2); sq(22, 12, 3, 3); sq(12, 22, 5, 3); sq(2, 12, 6, 2) } },
    { name: 'Hourglass', vibe: 'sand in seven colours', build(g) {
      const top = [[5, 3.5], [27, 3.5], [16.5, 15.4]], bot = [[16.5, 16.6], [5, 28.5], [27, 28.5]]
      each(g, (x, y) => (inPoly(top, x, y) || inPoly(bot, x, y) ? C(cl(Math.floor((y - 3.5) / 3.6), 0, 6), x < 16 ? 0 : 2) : -1)); rect(g, C(6, 2), 3, 1.5, 29, 3.5); rect(g, C(6, 3), 3, 28.5, 29, 30.5) } },
    { name: 'Snowflake', vibe: 'six arms, one colour each', build(g) {
      const c = [16, 16], sl = [0, 1, 2, 3, 5, 6]
      for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 3, d = [Math.cos(a), Math.sin(a)], pt = (r) => [16 + d[0] * r, 16 + d[1] * r]
        bar(g, C(sl[k], 1), pt(2.5), pt(14.2), 2.6)
        ;[6.2, 10].forEach((r) => [-1, 1].forEach((sg) => { const b = [Math.cos(a + sg * 1.05), Math.sin(a + sg * 1.05)], p0 = pt(r); bar(g, C(sl[k], 0), p0, [p0[0] + b[0] * 4.2, p0[1] + b[1] * 4.2], 1.8) })) }
      disc(g, 16, 16, 3, () => C(2, 0)) } },
    { name: 'Pinwheel', vibe: 'four blades turning in four colours', build(g) {
      const c = [16, 16], sl = [0, 2, 3, 5]
      for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2, f = (pts) => pts.map((p) => rot([16 + p[0], 16 + p[1]], c, a)); P(g, sl[k], 1, f([[0, 0], [0, -14.2], [12.6, -7.6]])); P(g, sl[k], 0, f([[0, 0], [0, -14.2], [3, -12.6], [1.6, -4]])); P(g, sl[k], 3, f([[1, -3], [12.6, -7.6], [3, -5.4]])) }
      disc(g, 16, 16, 2.2, () => W) } },
    { name: 'Cog', vibe: 'a ring of colour with eight teeth', build(g) {
      each(g, (x, y) => { const dx = x - 16, dy = y - 16, d = Math.hypot(dx, dy), a = (Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2), s = Math.floor(a * 7) % 7; const ang = (a * 360 + 22.5) % 45; const tooth = d > 12 && d <= 15.2 && ang > 11 && ang < 34; if ((d >= 7.6 && d <= 12.2) || tooth) return C(s, tooth ? 2 : d > 10.6 ? 1 : 0); if (d < 7.6) return C(4, lit(dx, dy) > 0 ? 0 : 1); return -1 }) } },
    { name: 'Pentastar', vibe: 'a five-pointed star, a colour on every point', build(g) {
      const c = [16, 17.2], out = reg(5, 16, 17.2, 15.4, -Math.PI / 2), inn = reg(5, 16, 17.2, 6.6, -Math.PI / 2 + Math.PI / 5), sl = [0, 1, 2, 3, 5]
      out.forEach((p, i) => { const a = inn[(i + 4) % 5], b = inn[i]; P(g, sl[i], 0, [c, a, p]); P(g, sl[i], 2, [c, p, b]) }); P(g, 6, 1, inn); set(g, 15, 15, W) } },
    { name: 'Steps', vibe: 'seven bars climbing, red to violet', build(g) {
      for (let i = 0; i < 7; i++) { const x0 = 2 + i * 4.1, top = 28 - (4 + i * 3.4); each(g, (x, y) => (x >= x0 && x < x0 + 3.6 && y >= top && y <= 29 ? C(i, x < x0 + 1 || y < top + 1 ? 0 : x > x0 + 2.6 ? 2 : 1) : -1)) } } },
    { name: 'Mosaic', vibe: 'a grid of sixteen tiles on a diagonal rainbow', build(g) {
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const x0 = 2 + c * 7, y0 = 2 + r * 7; each(g, (x, y) => (x >= x0 && x < x0 + 6 && y >= y0 && y < y0 + 6 ? C(r + c, x < x0 + 1 || y < y0 + 1 ? 0 : x >= x0 + 5 || y >= y0 + 5 ? 2 : 1) : -1)) } } },
    { name: 'Seven Pearls', vibe: 'seven round stones in a flower', build(g) {
      const spots = [[16, 16, 2]].concat(reg(6, 16, 16, 8.7, -Math.PI / 2).map((p, i) => [p[0], p[1], [0, 1, 3, 4, 5, 6][i]]))
      spots.forEach(([cx, cy, s]) => disc(g, cx, cy, 4.9, (dx, dy) => C(s, lit(dx, dy) > 0.3 ? 0 : lit(dx, dy) > -0.3 ? 1 : 2))); spots.forEach(([cx, cy]) => set(g, Math.floor(cx - 1.6), Math.floor(cy - 1.8), W)) } },
    { name: 'Trio', vibe: 'three round gems, red, green and blue', build(g) {
      ;[[9.4, 21.6, 3], [22.6, 21.6, 5], [16, 9.6, 0]].forEach(([cx, cy, s]) => disc(g, cx, cy, 7.9, (dx, dy) => C(s, lit(dx, dy) > 0.4 ? 0 : lit(dx, dy) > -0.2 ? 1 : lit(dx, dy) > -0.65 ? 2 : 3))); ;[[6.5, 18.5], [19.5, 18.5], [13, 6.5]].forEach(([x, y]) => { set(g, x, y, W); set(g, x + 1, y - 1, W) }) } },
    // ---------------------------------------------------------------- crystals and shapes
    { name: 'Crystal Cluster', vibe: 'five crystals, five colours', build(g) {
      const cr = [[2, 14, 6], [7.4, 7, 5], [12.8, 2, 3], [18.2, 8, 1], [23.6, 15, 0]]
      cr.forEach(([x0, top, s]) => { const w = 6.4, xm = x0 + w / 2, ty = top + 4; P(g, s, 0, [[x0, ty], [xm, top], [xm, ty]]); P(g, s, 2, [[xm, top], [x0 + w, ty], [xm, ty]]); rect(g, C(s, 0), x0, ty, x0 + 2.2, 29); rect(g, C(s, 1), x0 + 2.2, ty, x0 + 4.4, 29); rect(g, C(s, 2), x0 + 4.4, ty, x0 + w, 29) }) } },
    { name: 'Blade', vibe: 'one long shard with a colour all along it', build(g) {
      each(g, (x, y) => { const dx = x - 4, dy = 28 - y, s = (dx + dy) / 1.414, p = (dx - dy) / 1.414; if (s < 0 || s > 34) return -1; const h = 4.2 * Math.sin(Math.PI * Math.pow(s / 34, 0.62)) + 0.4; if (Math.abs(p) > h) return -1; return C(cl(Math.floor(s / 4.9), 0, 6), p < 0 ? 0 : 2) }) } },
    { name: 'Crystal Ball', vibe: 'a swirling ball on a golden stand', build(g) {
      disc(g, 16, 13.4, 11, (dx, dy, x, y) => C(cl(Math.floor((x - y + 14) / 3.3), 0, 6) % 7, Math.hypot(dx, dy) > 8.6 ? (lit(dx, dy) > 0 ? 1 : 2) : 0))
      P(g, 2, 1, [[8, 25.5], [24, 25.5], [27, 30], [5, 30]]); rect(g, C(2, 0), 8, 25.5, 24, 26.8); rect(g, C(2, 2), 5, 28.6, 27, 30); ;[[10, 7], [11, 6], [9, 8]].forEach(([x, y]) => set(g, x, y, W)) } },
    { name: 'Spires', vibe: 'five spikes rising in five colours', build(g) {
      const sp = [[5, 14, 0], [27, 15, 6], [10.6, 8, 1], [21.4, 9, 5], [16, 2, 3]]
      sp.forEach(([bx, top, s]) => { P(g, s, 0, [[bx, top], [bx - 3, 29.5], [bx, 29.5]]); P(g, s, 2, [[bx, top], [bx, 29.5], [bx + 3, 29.5]]) }); line(g, 1, 30, 31, 30, O) } },
    { name: 'Medal', vibe: 'a rainbow-rimmed medal on a ribbon', build(g) {
      P(g, 0, 1, [[8, 1.5], [15.5, 1.5], [17, 12.5], [11, 12]]); P(g, 5, 1, [[24, 1.5], [16.5, 1.5], [15, 12.5], [21, 12]])
      disc(g, 16, 20.4, 9.6, (dx, dy) => { const d = Math.hypot(dx, dy); if (d > 6.7) return C([0, 1, 2, 3, 5, 6][cl(Math.floor(((Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2)) * 6), 0, 5)], lit(dx, dy) > 0 ? 0 : 2); return C(2, lit(dx, dy) > 0 ? 0 : 1) }); set(g, 13, 17, W) } },
    { name: 'Potion', vibe: 'a flask full of colour', build(g) {
      each(g, (x, y) => { const bulb = Math.hypot(x - 16, y - 21) <= 9.4, neck = x >= 12.5 && x <= 19.5 && y >= 4 && y <= 14, lip = x >= 11 && x <= 21 && y >= 3 && y < 5; if (!(bulb || neck || lip)) return -1; if (bulb && y >= 17.5) return C(cl(Math.floor((y - 17.5) / 2.1), 0, 6), x < 13 ? 0 : x > 20 ? 2 : 1); return C(4, x < 14 ? 0 : 2) })
      rect(g, C(1, 2), 13, 0.8, 19, 3.6); set(g, 11, 20, W); set(g, 11, 19, W) } },
    { name: 'Egg', vibe: 'an egg striped on the diagonal', build(g) {
      each(g, (x, y) => { const v = (y - 16.5) / 13.4, u = (x - 16) / (10.4 * (1 - 0.2 * v)); if (u * u + v * v > 1) return -1; const l = lit(x - 16, y - 16); return C(cl(Math.floor((x + y - 9) / 4.9), 0, 6), l > 0.4 ? 0 : l > -0.2 ? 1 : 2) }); set(g, 10, 9, W); set(g, 11, 8, W); set(g, 9, 11, W) } },
    { name: 'Kite Flyer', vibe: 'a kite with a tail of coloured bows', build(g) {
      const K = [[14, 1.5], [23.5, 9.5], [14, 20], [4.5, 9.5]], c = [14, 9.5]
      P(g, 0, 0, [K[0], K[3], c]); P(g, 2, 1, [K[0], K[1], c]); P(g, 5, 1, [K[3], K[2], c]); P(g, 3, 2, [K[1], K[2], c]); line(g, 14, 2, 14, 19, O); line(g, 5, 9, 23, 9, O)
      ;[[15, 23, 1], [19, 26, 4], [21.5, 29.2, 6]].forEach(([x, y, s]) => { P(g, s, 0, [[x, y - 2], [x - 2, y], [x, y + 2]]); P(g, s, 2, [[x, y - 2], [x + 2, y], [x, y + 2]]) }); line(g, 14, 20, 15, 22, O) } },
    { name: 'Umbrella', vibe: 'seven panels of colour over one handle', build(g) {
      each(g, (x, y) => { const dx = x - 16, dy = y - 17, d = Math.hypot(dx, dy); if (dy > 0 || d > 14.4) return -1; const a = (Math.atan2(dy, dx) + Math.PI) / Math.PI; return C(cl(Math.floor(a * 7), 0, 6), lit(dx, dy) > 0.3 ? 0 : lit(dx, dy) > -0.3 ? 1 : 2) })
      bar(g, C(6, 3), [16, 17], [16, 27], 1.8); bar(g, C(6, 3), [16, 27], [12.5, 28.6], 1.8); set(g, 16, 2, W) } },
    { name: 'Bow Tie', vibe: 'two wings, striped end to end', build(g) {
      const l = [[1.5, 6], [14, 16], [1.5, 26]], r = [[30.5, 6], [18, 16], [30.5, 26]]
      each(g, (x, y) => (inPoly(l, x, y) || inPoly(r, x, y) ? C(cl(Math.floor((x - 1.5) / 4.15), 0, 6), y < 16 ? 0 : 2) : -1)); rect(g, C(2, 1), 13, 12, 19, 20); rect(g, C(2, 0), 13, 12, 19, 13.4); rect(g, C(2, 0), 13, 12, 14.4, 20) } },
    { name: 'Fish', vibe: 'a fish with a rainbow body', build(g) {
      each(g, (x, y) => { if (((x - 13) / 10.6) ** 2 + ((y - 16) / 7.6) ** 2 > 1) return -1; return C(cl(Math.floor((x - 2.4) / 3.0), 0, 6), y < 15 ? 0 : y > 18 ? 2 : 1) })
      P(g, 6, 1, [[23, 16], [30, 8], [30, 24]]); P(g, 6, 0, [[23, 16], [30, 8], [30, 15]]); set(g, 7, 14, W); set(g, 7, 13, W) } },
    { name: 'Candy', vibe: 'a wrapped sweet with a striped middle', build(g) {
      each(g, (x, y) => (((x - 16) / 9.6) ** 2 + ((y - 16) / 7.6) ** 2 <= 1 ? C(cl(Math.floor((x + y - 10) / 3.6), 0, 6), lit(x - 16, y - 16) > 0 ? 0 : 2) : -1))
      P(g, 6, 1, [[7, 16], [0.8, 8.5], [0.8, 23.5]]); P(g, 6, 2, [[25, 16], [31.2, 8.5], [31.2, 23.5]]); set(g, 11, 11, W); set(g, 12, 10, W) } },
    { name: 'Popsicle', vibe: 'a frozen treat in seven stripes', build(g) {
      each(g, (x, y) => { if (x < 8 || x > 24 || y < 2 || y > 22) return -1; const dx = Math.min(x - 8, 24 - x); if (y < 7 && dx < 7 - y) return -1; return C(cl(Math.floor((y - 2) / 2.9), 0, 6), x < 10 ? 0 : x > 21.5 ? 2 : 1) })
      rect(g, C(1, 2), 14.2, 22, 17.8, 30); rect(g, C(1, 0), 14.2, 22, 15.2, 30) } },
    { name: 'Twins', vibe: 'two small diamonds side by side', build(g) {
      const oct = (cx, sl) => { const T = [cx, 3], R = [cx + 9, 16], B = [cx, 29], L = [cx - 9, 16], F = [cx, 18]; P(g, sl[0], 0, [T, L, F]); P(g, sl[1], 1, [T, R, F]); P(g, sl[2], 1, [B, L, F]); P(g, sl[3], 2, [B, R, F]); stroke(g, [T, R, B, L], O) }
      oct(11, [0, 1, 2, 3]); oct(21, [4, 5, 6, 1]) } },
  ]
  window.Gem.DESIGNS.push(...D)
})()

/* The screens of the draft. Every scene is a pure function of time: draw(ctx, tau, options). That is also how the real game works
 * (a frame is a function of the clock), so these can be ported later. Logical size 1280 x 720, like the game. */
(function () {
  'use strict'
  const { W, H, clamp01, lerp, smooth, easeOut, easeInOut, backOut, rgb, mix, mulberry, COL, PX, SIL, stext, textWidth, wrap, bigTitle, radialAdd, rays, sparkle, vignette, prism, rect, backdrop } = window.UI
  const G = window.Gem
  const OFF = COL.OFF, SOFT = COL.SOFT

  // ------------------------------------------------------------------ the rarities (the first six are the game's own, packages/core/src/tiers.ts)
  const TIERS = [
    { name: 'COMMON', points: 10, bg: [30, 37, 56], fg: [205, 214, 238], edge: [154, 166, 191], factor: '÷ 3', sub: 'Almost everyone says this one.' },
    { name: 'UNCOMMON', points: 20, bg: [14, 58, 34], fg: [141, 255, 180], edge: [70, 208, 120], factor: '÷ 10', sub: 'Plenty of people know it, fewer say it.' },
    { name: 'RARE', points: 40, bg: [12, 42, 82], fg: [154, 216, 255], edge: [79, 195, 255], factor: '÷ 100', sub: 'Only a few players say this.' },
    { name: 'EXOTIC', points: 60, bg: [42, 24, 80], fg: [216, 188, 255], edge: [181, 131, 255], factor: '÷ 1,000', sub: 'Very few players think of this.' },
    { name: 'LEGENDARY', points: 80, bg: [74, 44, 0], fg: [255, 212, 136], edge: [255, 178, 63], factor: '÷ 10,000', sub: 'Far less familiar than kiwi or ostrich.' },
    { name: 'MYTHIC', points: 100, bg: [80, 16, 46], fg: [255, 168, 214], edge: [255, 95, 176], factor: '÷ 100,000', sub: 'Almost nobody says this.' },
    { name: 'SINGULARITY', points: 120, bg: [16, 10, 44], fg: [240, 232, 255], edge: [196, 176, 255], factor: '÷ 1,000,000', sub: 'The one gem hidden in each question.' },
  ]
  const GEM_POINTS = 120
  const WORLDS = ['THE ROOM', 'THE BOOKSHELF', 'THE PILE', 'YARN ROPES', 'THREAD FOREST', 'DROPLET WORLD', 'BACTERIA GARDEN', 'GERM REEF', 'PROTEIN FACTORY', 'DNA FOREST', 'CRYSTAL LATTICE', 'ELECTRON CLOUDS', 'GAMMA SEA', 'THE GREAT EMPTY', 'NUCLEUS CITY', 'INSIDE THE PROTON', 'FIRST QUARKS', 'SHORT REACH', 'RIPPLE SEA', 'COLLISION HALL']
  const worldOf = (pts) => (pts >= 440 ? [21, 'PLANCK FOAM'] : pts >= 400 ? [20, 'UNEXPLORED'] : [Math.floor(pts / 20), WORLDS[Math.floor(pts / 20)]])
  const sizeM = (pts) => 1.7 / Math.pow(10, pts / 20)
  function fmtSize(x) {
    const U = [[1, 'm'], [1e-3, 'mm'], [1e-6, 'µm'], [1e-9, 'nm'], [1e-12, 'pm'], [1e-15, 'fm']]
    if (x < 1e-15) { const e = Math.floor(Math.log10(x * 1.0000001)), sup = String(e).replace(/-/g, '⁻').replace(/d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]); return (x / Math.pow(10, e)).toFixed(1).replace(/.0$/, '') + ' × 10' + sup + ' m' }
    let u = U[0]; for (const k of U) if (x * 1.0000001 >= k[0]) { u = k; break }
    const m = x / u[0]; return (m < 9.95 ? m.toFixed(1) : String(Math.round(m))).replace(/\.0$/, '') + ' ' + u[1]
  }
  /** the largest font size (down to 13) at which the text fits in maxW */
  const fitPX = (c, text, maxW, size, w = 400) => { let s = size; while (s > 13 && textWidth(c, PX(s, w), text) > maxW) s--; return PX(s, w) }
  const gemRgb = (cat, l = 62) => (l > 70 ? G.lightRgb() : G.baseRgb())   // the chosen gem's colour, for glows and lines

  // ------------------------------------------------------------------ small shared pieces
  // gems are drawn by gem.js (version 2: real facets, drawn at any size). S and key are left over from version 1 and ignored.
  function paintGem(c, cat, x, y, size, t, S, extra = {}) { G.draw(c, cat, x, y, size, Object.assign({ t }, extra)) }
  const drawGemCached = (c, cat, x, y, size, t, S, key, extra) => paintGem(c, cat, x, y, size, t, S, extra)
  function tierIcon(c, ti, x, y, size, t = 0) {
    if (ti === 6) { G.draw(c, null, x, y, size, {}); return }
    const img = window.TIER_IMGS[ti]; if (!img) return
    c.save(); c.imageSmoothingEnabled = false; c.drawImage(img, Math.round(x - size / 2), Math.round(y - size / 2), size, size); c.restore()
  }
  const tierEdge = (ti, t) => (ti === 6 ? prism(t, 0, 72) : TIERS[ti].edge)

  /** the top bar: seven dots, the size and world, and (new) the gem counter */
  function hud(c, o, t = 0) {
    const x0 = 640 - Math.trunc((7 * 14 + 6 * 10) / 2)
    for (let k = 0; k < 7; k++) {
      const xx = x0 + k * 24, d = o.dots[k]
      if (d != null) { const col = d === 6 ? prism(t, k * 40, 70) : TIERS[d].edge; rect(c, xx, 19, 14, 14, col) }
      else if (k === o.cur) { rect(c, xx, 19, 14, 14, COL.OFF); rect(c, xx + 3, 22, 8, 8, [7, 11, 23]) }
      else rect(c, xx, 19, 14, 14, [52, 66, 112])
    }
    const pts = o.pts ?? 0, sz = fmtSize(sizeM(pts)), w = worldOf(pts)
    stext(c, sz, 1232, 52, PX(34, 600), OFF, 0, 'right')
    stext(c, w[0] ? `${w[0]}  ${w[1]}` : w[1], 1232, 78, SIL(12), SOFT, 2, 'right')
    // the cabinet counter (a new element; its position is a proposal)
    const cnt = o.gems ?? 0, pop = o.pop ?? 0
    G.draw(c, null, 54, 40, 32, {})
    stext(c, 'GEMS', 86, 34, SIL(11), SOFT, 2)
    stext(c, `${cnt} / 200`, 86, 58, PX(26 + Math.round(8 * pop), 600), pop > 0.05 ? [255, 244, 255] : OFF, 0)
  }

  // ------------------------------------------------------------------ THE REVEAL (the main new moment)
  const SH = (() => { const r = mulberry(21); return Array.from({ length: 80 }, () => ({ a: r() * 6.283, v: 180 + r() * 520, g: 500 + r() * 400, s: 3 + Math.floor(r() * 4), l: 0.45 + r() * 0.6, h: r() * 60 - 30 })) })()
  const ST = (() => { const r = mulberry(8); return Array.from({ length: 120 }, () => ({ a: r() * 6.283, r0: 160 + r() * 800, w: 0.5 + r() })) })()

  /** o: { g: gem record, answer, pts0 (points before this answer), dots0 (list of tiers so far), count (gems before this one), nextIndex } */
  function drawReveal(c, tau, o) {
    const cat = G.byCategory(o.g.cat), CX = 640, CY = 288, PULL = 1.2, BIRTH = 1.32, T = tau
    const bt = T - BIRTH, col = gemRgb(cat)
    backdrop(c, T * 0.4, smooth(0, 1, T) * 0.75)
    // what is on screen before the reveal: the bar at the top and the typed answer at the bottom
    const dive = easeInOut((T - 3.4) / 1.5), ptsNow = o.pts0 + GEM_POINTS * dive
    const dots = o.dots0.slice(); const dotOn = T >= 4.9
    while (dots.length < 7) dots.push(null)
    if (dotOn) dots[o.dots0.length] = 6
    const countShown = o.count + (T >= 5.5 ? 1 : 0), pop = T >= 5.5 ? Math.max(0, 1 - (T - 5.5) / 0.5) : 0
    c.save(); c.globalAlpha = 1 - 0.85 * smooth(0.2, 1.1, T) * (T < BIRTH ? 1 : 1 - smooth(BIRTH, BIRTH + 0.6, T))
    hud(c, { dots, cur: o.dots0.length, pts: ptsNow, gems: countShown, pop }, T)
    c.restore()

    // the roll (suspense) and its collapse
    if (T < 1.25) {
      const a = 1 - smooth(0.6, 1.1, T)
      c.save(); c.globalAlpha = a
      stext(c, 'HOW RARE IS THIS ANSWER?', 640, 570, SIL(12, false), SOFT, 3, 'center')
      stext(c, o.answer, 640, 622, PX(44, 500), OFF, 0, 'center')
      const k0 = easeInOut((T - 0.7) / 0.5)
      const idx = Math.floor(T * (22 - 10 * T)) % 6
      for (let k = 0; k < 6; k++) {
        const x = lerp(640 + (k - 2.5) * 70, CX, k0), y = lerp(668, CY, k0), on = k === idx
        c.globalAlpha = a * (on ? 1 : 0.4)
        tierIcon(c, k, x, y, on ? 46 : 30)
      }
      c.restore()
    }

    // 1  THE PULL: the world drains toward a point
    if (T < BIRTH) {
      const p = clamp01(T / PULL), pe = p * p
      for (const s of ST) {
        const r1 = s.r0 * Math.pow(1 - pe, 1.7), r2 = s.r0 * Math.pow(1 - Math.max(0, pe - 0.07), 1.7)
        if (r1 < 6) continue
        c.strokeStyle = `rgba(214,200,255,${0.55 * s.w * smooth(0.05, 0.4, T)})`; c.lineWidth = 2
        c.beginPath(); c.moveTo(CX + Math.cos(s.a) * r1, CY + Math.sin(s.a) * r1 * 0.9); c.lineTo(CX + Math.cos(s.a) * r2, CY + Math.sin(s.a) * r2 * 0.9); c.stroke()
      }
      if (T > 0.15) {
        let R = 6 + 44 * smooth(0.1, 1.15, T)
        for (const th of [0.18, 0.58, 0.88, 1.06]) if (T > th) R += 9 * Math.exp(-(T - th) * 12)
        if (T > 1.2) R = lerp(R, 2, smooth(1.2, 1.32, T))
        radialAdd(c, CX, CY, R * 5.5, [150, 110, 255], 0.5 * smooth(0.1, 0.9, T))
        c.save(); c.translate(CX, CY); c.rotate(T * 0.9)
        c.globalCompositeOperation = 'lighter'
        for (let i = 0; i < 3; i++) { c.strokeStyle = rgb(prism(T, i * 120, 66), 0.6); c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, R * (2.1 + 0.5 * i), R * (0.55 + 0.1 * i), i * 0.5, 0, 6.283); c.stroke() }
        c.restore()
        c.fillStyle = 'rgb(2,1,8)'; c.beginPath(); c.arc(CX, CY, R, 0, 6.283); c.fill()
        c.strokeStyle = rgb(prism(T, 0, 82)); c.lineWidth = 3; c.beginPath(); c.arc(CX, CY, R + 1.5, 0, 6.283); c.stroke()
      }
      vignette(c, 0.85 * smooth(0.1, 1.1, T))
      if (T > 1.2) { c.fillStyle = `rgba(0,0,0,${smooth(1.2, 1.3, T)})`; c.fillRect(0, 0, W, H); c.fillStyle = 'rgb(255,255,255)'; c.fillRect(CX - 1, CY - 1, 3, 3) }
    }

    // 3  THE BIRTH and after
    if (T >= BIRTH) {
      vignette(c, 0.55 * (1 - smooth(1.8, 3.6, T)))
      // light
      const flash = Math.exp(-bt * 6)
      radialAdd(c, CX, CY, 520, col, 0.55 * smooth(0, 0.3, bt) * (1 - 0.3 * smooth(2, 4, T)), 1.8)
      rays(c, CX, CY, 14, 620, bt * 0.22, (i) => prism(T, i * 26, 66), 0.4 * smooth(0, 0.3, bt) * (1 - 0.55 * smooth(0.8, 3, bt)) * (1 - smooth(4.4, 4.9, T)))
      // shockwaves
      for (let k = 0; k < 3; k++) {
        const r = (bt - 0.09 * k) * 1050; if (r <= 0 || r > 1300) continue
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgb(prism(T, k * 80, 70), 0.55 * (1 - r / 1300)); c.lineWidth = 9 * (1 - r / 1300) + 1
        c.beginPath(); c.arc(CX, CY, r, 0, 6.283); c.stroke(); c.restore()
      }
      // shards bursting out and falling
      if (bt < 3) for (const s of SH) {
        const x = CX + Math.cos(s.a) * s.v * bt, y = CY + Math.sin(s.a) * s.v * bt + 0.5 * s.g * bt * bt * 0.4, a = clamp01(1 - bt / (s.l * 3)) * smooth(0, 0.05, bt)
        if (a <= 0) continue
        c.fillStyle = rgb(s.h > 0 ? G.lightRgb() : G.baseRgb(), a); c.fillRect(Math.round(x), Math.round(y), s.s, s.s)
      }
      // the gem itself
      const fly = easeInOut((T - 4.6) / 0.9), arrived = T >= 5.5
      let size = 256 * backOut(bt / 0.5), gx = CX, gy = CY - 4 * Math.sin(6.283 * 0.8 * Math.max(0, bt - 0.5))
      if (bt < 0.4) gx += Math.trunc(Math.sin(bt * 130) * 7 * (1 - bt / 0.4))
      if (T > 4.6) { gx = lerp(CX, 54, fly); gy = lerp(gy, 40, fly); size = lerp(size, 40, Math.pow(fly, 0.7)) }
      if (!arrived && size > 6) {
        // soft shadow of light under it
        radialAdd(c, gx, gy, size * 0.9, col, 0.4, 2)
        paintGem(c, cat, gx, gy, Math.round(size / 4) * 4 || 4, T, 64, { key: 'reveal', variant: o.g.n })
        // twinkles
        for (let i = 0; i < 6; i++) { const ph = (T * 1.3 + i * 0.37) % 1, a = Math.sin(Math.PI * ph); const ang = i * 1.05 + 0.4; sparkle(c, gx + Math.cos(ang) * size * 0.46, gy + Math.sin(ang) * size * 0.46, 10 * a * (size / 256), [255, 255, 255], a * smooth(0.6, 1, bt)) }
        // trail on the way to the cabinet
        if (T > 4.6) for (let i = 1; i < 9; i++) { const f2 = Math.max(0, fly - i * 0.035), tx = lerp(CX, 54, easeInOut(f2)), ty = lerp(CY, 40, easeInOut(f2)); sparkle(c, tx, ty, 8 - i, prism(T, i * 30, 75), (1 - i / 9) * 0.8) }
      }
      if (arrived) radialAdd(c, 54, 40, 90 * Math.max(0, 1 - (T - 5.5) / 0.7), col, 0.9, 1.5)
      // flash on top
      if (flash > 0.01) { c.fillStyle = `rgba(255,255,255,${0.95 * flash})`; c.fillRect(0, 0, W, H) }

      // the title
      const ta = (1 - smooth(4.3, 4.7, T)) * smooth(0, 0.06, bt)
      if (ta > 0.01) {
        const q = bt / 0.3, scale = q < 1 ? 1 + 1.4 * (1 - backOut(q, 1.4)) : 1 + 0.025 * Math.sin(6.283 * 1.2 * bt)
        const split = Math.trunc(10 * Math.max(0, 1 - bt / 0.55)) * (Math.trunc(bt * 24) % 3 ? 1 : -1), jit = bt < 0.5 ? Math.trunc(Math.sin(bt * 130) * 6 * (1 - bt / 0.5)) : 0
        const sh = (bt - 0.55) / 0.9
        bigTitle(c, 'SINGULARITY!', 92, CX + jit, CY - 128 - 30, scale, (gx) => prism(T, gx * 0.35, 90), (gx) => prism(T, gx * 0.35 + 70, 62), (gx) => mix(prism(T, gx * 0.35 + 200, 25), [20, 8, 50], 0.6), [210, 190, 255], { glow: 0.85, shine: sh >= 0 && sh <= 1 ? sh : null, split, ls: 3, alpha: ta })
      }
      // the result block (same place and style as the game's)
      const ra = smooth(2.0, 2.3, T) * (1 - smooth(4.4, 4.8, T))
      if (ra > 0.01) {
        c.save(); c.globalAlpha = ra
        const n = Math.round(GEM_POINTS * easeOut((T - 2.1) / 0.8)), lab = `SINGULARITY   +${n}`, f = SIL(17), w = textWidth(c, f, lab, 3)
        tierIcon(c, 6, 640 - w / 2 - 24, 566, 34, T)
        stext(c, lab, 640 + 16, 577, f, mix(OFF, prism(T, 0, 80), 0.55), 3, 'center')
        stext(c, o.g.gem, 640, 636, PX(54, 500), OFF, 0, 'center')
        stext(c, o.g.why, 640, 676, fitPX(c, o.g.why, 1100, 19), SOFT, 0, 'center')
        stext(c, `NEW GEM  ·  ${cat.name.toUpperCase()}  ·  No. ${o.count + 1} OF 200`, 640, 538, SIL(12), prism(T, 40, 78), 3, 'center')
        c.restore()
      }
      // the divide-by stamp
      if (T >= 3.1 && T < 4.6) {
        const tau2 = T - 3.1, q = tau2 / 0.2, sc = q < 1 ? 1 + 1.6 * (1 - backOut(q, 1.6)) : 1, a = smooth(0, 0.05, tau2) * (1 - smooth(1.05, 1.45, tau2))
        bigTitle(c, '÷ 1,000,000', 96, CX, 372, sc, (gx) => prism(T, gx * 0.3, 92), (gx) => prism(T, gx * 0.3 + 60, 66), [10, 5, 30], [200, 180, 255], { glow: 0.7, ls: 2, w: 700, alpha: a })
      }
    }
  }
  const REVEAL_LEN = 6.4

  // ------------------------------------------------------------------ THE LADDER of seven rarities
  function drawLadder(c, tau) {
    backdrop(c, tau)
    stext(c, 'THE SEVEN RARITIES', 640, 70, SIL(15), SOFT, 3, 'center', smooth(0, 0.5, tau))
    const cw = 132, gap = 12, lastW = 214, total = 6 * cw + 6 * gap + lastW, x0 = (W - total) / 2, y0 = 150, h = 320
    let x = x0
    for (let i = 0; i < 7; i++) {
      const last = i === 6, w = last ? lastW : cw, t0 = last ? 3.0 : 0.4 + 0.3 * i, q = backOut((tau - t0) / 0.45), tr = TIERS[i]
      if (tau < t0) { x += w + gap; continue }
      const yy = (last ? y0 - 34 : y0) + (1 - q) * 40, hh = last ? h + 68 : h
      c.save(); c.globalAlpha = clamp01((tau - t0) / 0.25)
      if (last) {
        radialAdd(c, x + w / 2, yy + hh / 2, 320, [150, 110, 255], 0.5 * smooth(t0, t0 + 0.5, tau))
        rays(c, x + w / 2, yy + hh / 2, 12, 330, tau * 0.2, (k) => prism(tau, k * 30, 64), 0.22)
      }
      c.fillStyle = rgb(tr.bg); c.fillRect(x, yy, w, hh)
      const e = tierEdge(i, tau); c.strokeStyle = rgb(e); c.lineWidth = last ? 4 : 2; c.strokeRect(x + 1, yy + 1, w - 2, hh - 2)
      const icon = last ? 118 : 64
      if (last) G.draw(c, null, x + w / 2, yy + 100, 128, {}); else tierIcon(c, i, x + w / 2, yy + 64, icon)
      stext(c, tr.name, x + w / 2, yy + (last ? 196 : 138), SIL(last ? 17 : 13), last ? mix(OFF, prism(tau, 0, 80), 0.5) : tr.fg, 2, 'center')
      stext(c, '+' + tr.points, x + w / 2, yy + (last ? 244 : 186), PX(last ? 54 : 40, 600), OFF, 0, 'center')
      stext(c, tr.factor, x + w / 2, yy + (last ? 276 : 214), SIL(last ? 16 : 12), last ? prism(tau, 90, 78) : SOFT, 2, 'center')
      const lines = wrap(c, PX(last ? 17 : 14, 400), tr.sub, w - 20)
      lines.forEach((ln, k) => stext(c, ln, x + w / 2, yy + (last ? 316 : 250) + k * (last ? 20 : 17), PX(last ? 17 : 14, 400), SOFT, 0, 'center'))
      c.restore()
      x += w + gap
    }
    const a = smooth(3.8, 4.4, tau)
    stext(c, 'One more rarity sits above Mythic.', 640, 560, PX(28, 500), OFF, 0, 'center', a)
    stext(c, 'A hand-picked answer in every question: 120 points, one million times smaller (÷ 1,000,000).', 640, 598, SIL(13), SOFT, 2, 'center', a)
    stext(c, 'A perfect run is now 7 × 120 = 840 points (it was 700).', 640, 632, SIL(12, false), prism(tau, 0, 78), 2, 'center', smooth(5.2, 5.8, tau))
  }

  // ------------------------------------------------------------------ THE DESIGNS: every design on paged contact sheets, in the tone you chose
  const galleryHit = () => null
  function drawGallery(c, tau) {
    backdrop(c, tau)
    const n = G.DESIGNS.length, per = 24, pages = Math.ceil(n / per), page = Math.min(pages - 1, Math.floor(tau / 4.2)), start = page * per, tl = tau - page * 4.2
    stext(c, 'ALL ' + n + ' DESIGNS IN THE TONE YOU CHOSE  ·  PAGE ' + (page + 1) + ' OF ' + pages, 640, 44, SIL(14), SOFT, 3, 'center')
    for (let k = 0; k < per && start + k < n; k++) {
      const i = start + k, col = k % 8, row = Math.floor(k / 8), cx = 100 + col * 154, cy = 150 + row * 190
      const a = smooth(0.04 * k, 0.04 * k + 0.25, tl) * (page < pages - 1 ? 1 - smooth(3.9, 4.2, tl) : 1); if (a <= 0) continue
      c.save(); c.globalAlpha = a
      if (G.sel.d === i) { c.strokeStyle = rgb(G.lightRgb()); c.lineWidth = 2; c.strokeRect(cx - 70, cy - 66, 140, 172) }
      G.draw(c, null, cx, cy, 96, { design: i })
      stext(c, String(i + 1), cx, cy + 70, SIL(11), SOFT, 2, 'center')
      stext(c, G.DESIGNS[i].name, cx, cy + 92, PX(14, 500), OFF, 0, 'center')
      c.restore()
    }
  }

  // ------------------------------------------------------------------ THE CHAIN: the new gem next to the six agreed ones
  function drawChain(c, tau) {
    backdrop(c, tau)
    stext(c, 'THE CHAIN, COMMON TO SINGULARITY', 640, 70, SIL(15), SOFT, 3, 'center')
    const names = TIERS.map((t) => t.name + '  +' + t.points), step = 176, x0 = 640 - 3 * step
    for (let i = 0; i < 7; i++) {
      const t0 = 0.3 + 0.35 * i, a = smooth(t0, t0 + 0.3, tau), x = x0 + i * step, y = 300; if (a <= 0) continue
      c.save(); c.globalAlpha = a
      if (i === 6) radialAdd(c, x, y, 150, G.baseRgb(), 0.3)
      tierIcon(c, i, x, y, 160)
      stext(c, TIERS[i].name, x, y + 120, SIL(i === 6 ? 13 : 12), i === 6 ? G.lightRgb() : TIERS[i].fg, 2, 'center')
      stext(c, '+' + TIERS[i].points, x, y + 150, PX(26, 600), OFF, 0, 'center')
      c.restore()
    }
    const a3 = smooth(3.2, 3.8, tau)
    stext(c, 'Same 32 by 32 pixels, one shared dark outline, flat blocks with hard edges. The rainbow gem just uses more hues.', 640, 560, PX(22, 400), OFF, 0, 'center', a3)
    stext(c, G.describe().toUpperCase() + '  ·  CHANGE IT WITH CHOOSE GEM', 640, 604, SIL(12), G.lightRgb(), 2, 'center', a3)
  }

  // ------------------------------------------------------------------ THE CABINET (interactive: the app gives it the found set and the selection)
  const SLOT = { w: 148, h: 116, cols: 5, x0: 404, y0: 150 }
  function cabinetLayout() { return { tabs: G.CATEGORIES.map((_, i) => ({ x: 40, y: 124 + i * 44, w: 330, h: 40 })), slot: (i) => ({ x: SLOT.x0 + (i % SLOT.cols) * (SLOT.w + 8), y: SLOT.y0 + Math.floor(i / SLOT.cols) * (SLOT.h + 8), w: SLOT.w, h: SLOT.h }) } }
  function drawCabinet(c, tau, o) {
    backdrop(c, tau)
    const found = o.found, total = window.GEMS.length, mine = window.GEMS.filter((g) => found.has(g.n)).length
    stext(c, 'GEM CABINET', 40, 62, SIL(20), OFF, 3)
    stext(c, `${mine} / ${total} found`, 290, 62, PX(26, 600), prism(tau, 0, 78), 0)
    // the bar
    rect(c, 40, 80, 1200, 4, [26, 36, 74]); rect(c, 40, 80, 1200 * mine / total, 4, prism(tau, 0, 70))
    const lay = cabinetLayout(), by = {}
    window.GEMS.forEach((g) => (by[g.cat] = by[g.cat] || []).push(g))
    G.CATEGORIES.forEach((cat, i) => {
      const r = lay.tabs[i], list = by[cat.name] || [], n = list.filter((g) => found.has(g.n)).length, sel = i === o.sel, done = n === list.length
      c.fillStyle = sel ? 'rgba(60,76,140,0.55)' : 'rgba(20,28,60,0.6)'; c.fillRect(r.x, r.y, r.w, r.h)
      if (sel) { c.strokeStyle = rgb(gemRgb(cat, 70)); c.lineWidth = 2; c.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2) }
      drawGemCached(c, cat, r.x + 24, r.y + 20, 32, tau + i, 16, 'tab' + i, { glint: sel ? 1 : 0, dim: n ? 0 : 0.6 })
      stext(c, cat.name, r.x + 50, r.y + 25, PX(16, 500), sel ? OFF : SOFT, 0)
      stext(c, done ? 'COMPLETE' : `${n}/${list.length}`, r.x + r.w - 10, r.y + 25, SIL(11), done ? prism(tau, i * 30, 78) : COL.FAINT, 2, 'right')
    })
    // the shelf of the selected category
    const cat = G.CATEGORIES[o.sel], list = by[cat.name] || []
    list.forEach((g, i) => {
      const r = lay.slot(i), has = found.has(g.n), hover = o.hoverSlot === i
      c.fillStyle = has ? 'rgba(24,34,76,0.85)' : 'rgba(12,18,40,0.8)'; c.fillRect(r.x, r.y, r.w, r.h)
      c.strokeStyle = hover ? rgb(OFF) : has ? rgb(gemRgb(cat, 55), 0.7) : 'rgba(60,76,130,0.6)'; c.lineWidth = hover ? 2 : 1; c.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1)
      if (has) radialAdd(c, r.x + r.w / 2, r.y + 44, 70, gemRgb(cat), 0.35)
      drawGemCached(c, cat, r.x + r.w / 2, r.y + 44, 64, tau + i * 0.6, 32, 'slot' + i + cat.cut, { dim: has ? 0 : 0.78, glint: has ? 1 : 0, core: has, variant: g.n })
      if (!has) stext(c, '?', r.x + r.w / 2, r.y + 54, PX(30, 700), [110, 124, 190], 0, 'center')
      const nm = has ? g.gem : g.prompt.replace(/^Name (an? |the )?/i, '').replace(/\.$/, '')
      const font = has ? PX(15, 600) : PX(14, 400), lines = wrap(c, font, nm, r.w - 12).slice(0, 2)
      lines.forEach((ln, j) => stext(c, ln, r.x + r.w / 2, r.y + 92 + j * 16, font, has ? OFF : COL.FAINT, 0, 'center'))
    })
    // the detail card
    if (o.detail != null) {
      const g = window.GEMS.find((x) => x.n === o.detail), cat2 = G.byCategory(g.cat), has = found.has(g.n)
      c.fillStyle = 'rgba(3,5,14,0.78)'; c.fillRect(0, 0, W, H)
      const x = 340, y = 150, w = 600, h = 420
      c.fillStyle = 'rgb(14,20,46)'; c.fillRect(x, y, w, h); c.strokeStyle = rgb(prism(tau, 0, 72)); c.lineWidth = 3; c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3)
      radialAdd(c, x + w / 2, y + 120, 200, gemRgb(cat2), 0.4)
      drawGemCached(c, cat2, x + w / 2, y + 120, 192, tau, 64, 'detail', { dim: has ? 0 : 0.8, core: has, variant: g.n })
      if (!has) stext(c, '?', x + w / 2, y + 140, PX(64, 700), [120, 134, 200], 0, 'center')
      stext(c, `${g.cat.toUpperCase()}`, x + w / 2, y + 250, SIL(12), gemRgb(cat2, 78), 2, 'center')
      stext(c, has ? g.gem : '???', x + w / 2, y + 304, PX(46, 600), OFF, 0, 'center')
      wrap(c, PX(18, 400), has ? g.why : 'Not found yet.', w - 60).slice(0, 2).forEach((ln, j) => stext(c, ln, x + w / 2, y + 338 + j * 22, PX(18, 400), SOFT, 0, 'center'))
      stext(c, g.prompt, x + w / 2, y + 384, SIL(12, false), COL.FAINT, 2, 'center')
      stext(c, 'CLICK ANYWHERE TO CLOSE', x + w / 2, y + h + 28, SIL(11, false), COL.FAINT, 2, 'center')
    }
  }

  // ------------------------------------------------------------------ THE REPORT at the end of a run
  const SQ = ['⬜', '🟩', '🟦', '🟪', '🟧', '🟥', '💎']
  function drawReport(c, tau, o) {
    backdrop(c, tau)
    const recs = o.recs, total = recs.reduce((s, r) => s + r.pts, 0), gemsThis = recs.filter((r) => r.tier === 6).length
    const w = worldOf(total)
    stext(c, 'DIVE COMPLETE', 640, 70, SIL(15), SOFT, 3, 'center')
    stext(c, fmtSize(sizeM(total)), 640, 150, PX(80, 600), OFF, 0, 'center', smooth(0.2, 0.6, tau))
    stext(c, `${total} / ${recs.length * GEM_POINTS} points · ${w[0] ? 'world ' + w[0] + ' of 21' : 'the room'}`, 640, 190, SIL(14), SOFT, 2, 'center', smooth(0.5, 0.9, tau))
    recs.forEach((r, i) => {
      const t0 = 0.9 + 0.22 * i, a = smooth(t0, t0 + 0.25, tau); if (a <= 0) return
      const y = 250 + i * 36, x = 340, gem = r.tier === 6
      c.save(); c.globalAlpha = a
      if (gem) { c.fillStyle = 'rgba(120,90,255,0.16)'; c.fillRect(x - 14, y - 22, 624, 32); c.strokeStyle = rgb(prism(tau, 0, 70), 0.7); c.lineWidth = 1; c.strokeRect(x - 13.5, y - 21.5, 623, 31) }
      rect(c, x, y - 14, 14, 14, tierEdge(r.tier, tau + i))
      stext(c, r.answer, x + 30, y - 1, PX(22, 500), OFF, 0)
      if (gem) tierIcon(c, 6, x + 30 + textWidth(c, PX(22, 500), r.answer) + 22, y - 8, 22, tau)
      stext(c, r.prompt, x + 330, y - 1, PX(14, 400), COL.FAINT, 0, 'center')
      stext(c, String(r.pts), x + 600, y - 1, PX(21, 600), gem ? prism(tau, 0, 82) : SOFT, 0, 'right')
      c.restore()
    })
    const a2 = smooth(2.7, 3.2, tau)
    stext(c, gemsThis ? `${gemsThis} GEM${gemsThis > 1 ? 'S' : ''} FOUND IN THIS DIVE  ·  CABINET ${o.cabinet} / 200` : `NO GEM THIS TIME  ·  CABINET ${o.cabinet} / 200`, 640, 530, SIL(14), gemsThis ? prism(tau, 0, 80) : SOFT, 2, 'center', a2)
    // the share text
    const share = `MINITUDE\n${recs.map((r) => SQ[r.tier]).join('')}\n${total} pts · ${fmtSize(sizeM(total))} · ${w[0] ? 'world ' + w[0] : 'the room'}`
    c.save(); c.globalAlpha = smooth(3.2, 3.7, tau)
    c.fillStyle = 'rgba(20,28,60,0.8)'; c.fillRect(440, 556, 400, 112); c.strokeStyle = 'rgba(110,124,170,0.6)'; c.strokeRect(440.5, 556.5, 399, 111)
    share.split('\n').forEach((ln, i) => stext(c, ln, 640, 590 + i * 30, i === 1 ? '400 24px system-ui, "Segoe UI Emoji", sans-serif' : SIL(13, false), OFF, 0, 'center'))
    stext(c, 'SHARE TEXT: THE GEM IS A 💎 SQUARE', 640, 686, SIL(10, false), COL.FAINT, 2, 'center')
    c.restore()
  }

  // ------------------------------------------------------------------ TITLE and END cards
  function drawTitle(c, tau, o) {
    backdrop(c, tau)
    const gem = G.CATEGORIES[Math.floor(tau / 1.1) % 11]
    radialAdd(c, 640, 250, 420, gemRgb(gem), 0.35)
    rays(c, 640, 250, 14, 520, tau * 0.12, (i) => prism(tau, i * 26, 66), 0.14)
    paintGem(c, gem, 640, 250, 256, tau, 64, { key: 'title' })
    bigTitle(c, o.title || 'SINGULARITY', 84, 640, 468, 1, (gx) => prism(tau, gx * 0.3, 90), (gx) => prism(tau, gx * 0.3 + 70, 62), [20, 8, 50], [210, 190, 255], { glow: 0.8, ls: 3, shine: ((tau * 0.5) % 2) < 1 ? (tau * 0.5) % 1 : null })
    stext(c, o.sub || 'A NEW RARITY FOR MINITUDE', 640, 520, SIL(16), SOFT, 3, 'center')
    stext(c, o.line || 'DRAFT FOR REVIEW  ·  NOT IN THE LIVE GAME', 640, 600, SIL(12, false), COL.FAINT, 2, 'center')
  }

  // ------------------------------------------------------------------ a question screen for the playtest
  function drawQuestion(c, tau, o) {
    backdrop(c, tau)
    hud(c, { dots: o.dots, cur: o.dots.filter((d) => d != null).length, pts: o.pts, gems: o.gems }, tau)
    const lines = wrap(c, PX(46, 500), o.prompt, 1000)
    lines.forEach((ln, i) => stext(c, ln, 640, 300 + i * 56, PX(46, 500), OFF, 0, 'center'))
    stext(c, `QUESTION ${o.n} OF 7`, 640, 240, SIL(12), SOFT, 3, 'center')
    if (o.msg) stext(c, o.msg, 640, 560, PX(24, 500), o.msgCol || [255, 130, 100], 0, 'center')
  }

  window.Scenes = { TIERS, GEM_POINTS, WORLDS, worldOf, sizeM, fmtSize, drawReveal, REVEAL_LEN, drawLadder, drawGallery, drawChain, galleryHit, drawCabinet, cabinetLayout, drawReport, drawTitle, drawQuestion, gemRgb, paintGem, hud, tierIcon, SQ }
})()

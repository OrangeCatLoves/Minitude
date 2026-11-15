/* Round 5 (16 Nov 2026): the owner's picks become the defaults, the spheres of 9C move whole, and world 10 gets helices that really spiral. */
(function () {
  'use strict'
  const { helpers: H, vh, variant, all } = Motion
  const { sat, motes } = H
  const { lumOf, smooth, twSetup, twDraw } = vh
  const { clamp, mod } = Engine
  const W = 320, sin = Math.sin, cos = Math.cos, round = Math.round, floor = Math.floor

  // ================================================================ 9 PROTEIN FACTORY, design C: whole spheres
  /* The spheres are painted again with the rules of the art source (art3.py, w8), so each one is a complete ball even where the chain of beads
   * crosses it or the membrane hides it. Painting order of the original: far pair, chain of beads, near pair (the ribosome), then the membrane. */
  const LIL = Art.ramp('#2a1a58', '#5a3ab0', '#9a78f0', '#d8c8ff'), TEA = Art.ramp('#0a3a48', '#1a7a88', '#46c0c8', '#c0fcff'), CRATER = Art.ramp('#3a2a80', '#7a58d0', '#b898ff', '#ece0ff')
  /** the painted pixels of a buffer as a sprite */
  function spriteOf(buf, y1 = 179) { const xs = [], ys = [], cols = []; for (let y = 0; y <= y1; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (buf[i + 3]) { xs.push(x); ys.push(y); cols.push(buf[i], buf[i + 1], buf[i + 2]) } } return { xs: Int16Array.from(xs), ys: Int16Array.from(ys), cols: Uint8Array.from(cols), n: xs.length } }
  variant(8, 2, {
    title: 'Floating',
    moves: ['The spheres float up and down, each pair as one whole piece.', 'The chain of beads stays still: the far pair floats behind it and the near pair in front of it.', 'Soft specks of light drift upward.'],
    setup(L) {
      const far = Art.blank(), near = Art.blank(), beads = Art.blank(), dusk = Art.rgb('#240a38')
      Art.sphere(far, 276, 76, 26, Art.haze(LIL, dusk, 0.5), true); Art.sphere(far, 272, 40, 17, Art.haze(TEA, dusk, 0.5), true)
      for (let x = -6; x < W + 8; x += 5) Art.sphere(beads, x, 62 + Math.sin(x * 0.06) * 9, 3, Art.ramp('#6a2a00', '#c8661a', '#ffa850', '#ffe0a8'))
      Art.sphere(near, 96, 104, 40, LIL, true); Art.sphere(near, 88, 52, 28, TEA, true)
      for (const [x, y, r] of [[70, 92, 8], [112, 118, 9], [104, 88, 6], [80, 120, 6]]) Art.sphere(near, x, y, r, CRATER, true)
      const FLOOR = 138   // the membrane starts here and hides what is below
      const inNear = (p) => near[p * 4 + 3] && ((p / W) | 0) < FLOOR, inAny = (p) => far[p * 4 + 3] || beads[p * 4 + 3] || inNear(p)
      // cut all three out of the background at once, so the gaps are filled with real background
      L.liftGroups([{ rect: [0, 0, 319, FLOOR - 1], pred: (r, g, b, x, y) => inAny(y * W + x) }])
      L.far = spriteOf(far); L.near = spriteOf(near)
      // the beads: as the picture shows them where they can be seen, as painted where the near pair hides them
      for (let p = 0; p < W * FLOOR; p++) if (beads[p * 4 + 3] && !inNear(p)) { beads[p * 4] = L.base[p * 4]; beads[p * 4 + 1] = L.base[p * 4 + 1]; beads[p * 4 + 2] = L.base[p * 4 + 2] }
      L.beads = spriteOf(beads, FLOOR - 1)
      // whatever the picture has in front of a sphere (stars, the beads over the far pair, the worm) stays in front
      const front = (buf, ok) => { const out = []; for (let p = 0; p < W * FLOOR; p++) if (buf[p * 4 + 3] && ok(p) && (buf[p * 4] !== L.base[p * 4] || buf[p * 4 + 1] !== L.base[p * 4 + 1] || buf[p * 4 + 2] !== L.base[p * 4 + 2])) out.push(p * 4); return Int32Array.from(out) }
      L.frontFar = front(far, (p) => !inNear(p)); L.frontNear = front(near, () => true)
      L.FLOOR = FLOOR
      L.tw = twSetup(L, [0, 15, 320, 135], (r, g, b) => r > 235 && g > 235 && b > 235)
    },
    draw(L, t, K) {
      const o = L.out, keep = (list) => { for (let n = 0; n < list.length; n++) { const i = list[n]; o[i] = L.base[i]; o[i + 1] = L.base[i + 1]; o[i + 2] = L.base[i + 2] } }
      L.drawSprite(L.far, 0, round(K * 2 * sin(t * 0.45 + 3)))
      L.drawSprite(L.beads, 0, 0); keep(L.frontFar)
      L.drawSpriteMap(L.near, 0, round(K * 2 * sin(t * 0.5)), (r, g, b, x, y) => y < L.FLOOR)
      keep(L.frontNear)
      motes(L, t, K, { n: 18, rect: [0, 18, 320, 132], rise: 5, sway: 0.5, amp: 4, color: [255, 215, 240], alpha: 0.65, seed: 9, big: 3 })
      twDraw(L, L.tw, t, K)
    },
  })

  // ================================================================ 10 DNA FOREST: the helices spiral
  /* The picture was made by code (tools/art-source/art/art3.py, w9). src/dna.js is a port of it that reproduces the original pixel for pixel, so each
   * helix can simply be drawn again turned by an angle: a true rotation (the beads swing round, the rungs shorten, cross and lengthen), not a trick.
   * The stars and the small object by the player are not part of the helices: they are kept from the original, on top. */
  const TAU = Math.PI * 2
  function dnaSetup(L) {
    L.sky = Dna.background()
    const o = new Uint8ClampedArray(L.sky); Dna.helices(o, null)
    const keep = []
    for (let y = 0; y < 140; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (o[i] !== L.base[i] || o[i + 1] !== L.base[i + 1] || o[i + 2] !== L.base[i + 2]) keep.push(i) }
    L.keep = Int32Array.from(keep)
    L.turn = new Float64Array(7)
  }
  /** periods[i]: seconds for one full turn of helix i (negative turns the other way, 0 keeps it still) */
  function dnaDraw(L, t, K, periods) {
    let any = false
    for (let i = 0; i < 7; i++) { L.turn[i] = periods[i] ? K * t * TAU / periods[i] : 0; if (L.turn[i]) any = true }
    if (!any) return
    const o = L.out
    o.set(L.sky.subarray(0, 140 * W * 4))
    Dna.helices(o, L.turn)
    for (let n = 0; n < L.keep.length; n++) { const i = L.keep[n]; o[i] = L.base[i]; o[i + 1] = L.base[i + 1]; o[i + 2] = L.base[i + 2] }
    // the floor starts at row 140: the helices never paint below it
    o.set(L.base.subarray(140 * W * 4), 140 * W * 4)
  }
  const dna = (title, moves, periods) => ({ name: 'DNA FOREST', desc: 'Spiral towers with coloured rungs fill the horizon.', title, moves, setup: dnaSetup, draw(L, t, K) { dnaDraw(L, t, K, periods) } })
  // the helices in painting order: x = 12, 58, 110, 276, 312 (far ones), 150 and 254 (the two near ones)
  Motion.setVariants(9, [
    dna('Spiralling', ['Every helix turns slowly about its own axis: the strands wind round, and each rung shortens, crosses over and lengthens again.', 'The near towers turn a little faster than the far ones.', 'The colours and places of the rungs stay as they are.'], [16, 15, 14, 14, 16, 11, 12]),
    dna('Spiralling both ways', ['Every helix turns about its own axis, and neighbours turn in opposite directions.', 'The colours and places of the rungs stay as they are.'], [16, -15, 14, -14, 16, -11, 12]),
    dna('Only the near towers', ['Only the two big helices in front turn. The towers far behind stay still, so the picture is calmer.'], [0, 0, 0, 0, 0, 11, 12]),
  ])

  // ================================================================ the owner's picks (16 Nov 2026) are the designs shown first
  const PICKS = { 6: 0, 7: 0, 8: 2, 9: 1, 10: 2, 11: 0, 12: 2, 13: 2, 14: 1, 15: 0, 16: 0, 17: 2, 18: 2, 19: 0, 35: 0 }
  for (const k of Object.keys(PICKS)) Motion.setPick(Number(k), PICKS[k])
  Motion.PICKS = PICKS
})()

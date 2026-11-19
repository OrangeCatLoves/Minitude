/*
 * scenelib.js: the registry of the draft worlds and the little pieces several scenes share (desert ground, tank arrays, mountains, aurora, Milky Way).
 * A world is { id, world, slot, name, desc, kind, label, scale, real, draw(g, t) }.  `draw` paints a whole frame from the time t (seconds).
 */
(function (root) {
  const { W, H, fbm, vnoise, rnd, hash, mix, sc, clamp01, ridge, fillRidge } = root.Gfx
  const Worlds = []
  const def = (w) => { Worlds.push(w); return w }

  /** the Milky Way as a slanted band of dithered light */
  function milkyWay(g, t, y0, slope, width, c, k = 0.5, seed = 5) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = (y - (y0 + x * slope)) / width
      if (d < -1.4 || d > 1.4) continue
      const n = fbm(x * 0.03 + t * 0.004, y * 0.05, seed, 4)
      const f = Math.exp(-d * d * 2.2) * (0.25 + 1.2 * n * n) * k
      g.add(x, y, c, f)
    }
  }

  /** a ridge line that lights up a little at its top edge */
  function mountains(g, base, amp, scale, seed, c, rim, bottom = H) {
    const top = ridge(base, amp, scale, seed, 4)
    fillRidge(g, top, bottom - 1, c)
    if (rim) for (let x = 0; x < W; x++) g.add(x, Math.floor(top[x]), rim, 0.5)
    return top
  }

  /** green and teal curtains of aurora; `y` is the lower edge */
  function aurora(g, t, y, h, c1, c2, k = 0.8, seed = 21) {
    for (let x = 0; x < W; x++) {
      const sway = Math.sin(x * 0.03 + t * 0.5) * 8 + Math.sin(x * 0.011 - t * 0.31) * 12
      const ray = 0.4 + 0.6 * vnoise(x * 0.12 + t * 0.35, t * 0.2, seed)
      const top = y - h * (0.55 + 0.45 * vnoise(x * 0.02 + t * 0.1, 3, seed + 1)) + sway * 0.4
      for (let yy = Math.floor(top); yy < y; yy++) {
        const f = (yy - top) / Math.max(1, y - top)
        const col = mix(c2, c1, f)
        g.add(x, yy, col, Math.pow(f, 1.4) * ray * k * 0.9)
      }
    }
  }

  /** an array of small detector tanks on flat ground, in perspective. Returns the tank list (for flashes) */
  function tankField(g, horizonY, cx, rows, spread, c = [225, 232, 240], flash) {
    const tanks = []
    for (let r = 0; r < rows; r++) {
      const z = r / (rows - 1)
      const y = horizonY + 3 + Math.pow(z, 1.55) * (H - horizonY - 6)
      const s = 0.5 + z * 3.2
      const step = spread * s
      const n = Math.ceil(W / step) + 2
      for (let i = -n; i <= n; i++) {
        const off = (r % 2) * step * 0.5
        const x = cx + i * step + off - (cx - W / 2) * 0
        if (x < -6 || x > W + 6) continue
        tanks.push({ x, y, s })
      }
    }
    for (const k of tanks) {
      const w = Math.max(1, Math.round(k.s * 1.5)), h = Math.max(1, Math.round(k.s * 1.0))
      const lit = flash ? flash(k) : 0
      const base = mix([60, 72, 92], c, 0.55)
      g.rect(Math.round(k.x - w / 2), Math.round(k.y - h), w, h, base)
      if (w > 2) g.rect(Math.round(k.x - w / 2), Math.round(k.y - h), w, 1, mix(base, [255, 255, 255], 0.35))
      if (lit > 0.02) { g.add(k.x, k.y - h / 2, [90, 200, 255], lit * 1.2); g.glow(k.x, k.y - h / 2, 3 + k.s * 2.4, [60, 170, 255], lit * 0.8, 2) }
    }
    return tanks
  }


  /** textured ground between y0 and y1: colour from c0 (far) to c1 (near), broken up by fields of noise */
  function ground(g, y0, y1, c0, c1, seed = 3, tex = 0.4, scale = 0.05) {
    for (let y = y0; y <= y1; y++) {
      const dz = (y - y0) / Math.max(1, y1 - y0), base = mix(c0, c1, dz), s = scale * (1.6 - dz * 1.2)
      for (let x = 0; x < W; x++) {
        const n = fbm(x * s * 2.2, y * s * 5.5, seed, 3)
        const k = 1 + (n - 0.5) * 2 * tex
        g.set(x, y, [base[0] * k, base[1] * k, base[2] * k])
      }
    }
  }

  /** a conifer silhouette (for foreground framing) */
  function tree(g, x, y, h, c) {
    for (let i = 0; i < h; i++) { const w = Math.max(0, Math.round((i / h) * h * 0.22)); for (let k = -w; k <= w; k++) g.set(x + k, y - h + i, c) }
    g.rect(x, y, 1, 2, c)
  }

  /** low mist: soft horizontal bands that drift slowly */
  function mist(g, t, y0, y1, c, k = 0.3, seed = 31) {
    for (let y = y0; y <= y1; y++) {
      const f = 1 - Math.abs((y - (y0 + y1) / 2) / ((y1 - y0) / 2))
      for (let x = 0; x < W; x++) { const n = fbm(x * 0.012 + t * 0.012, y * 0.09, seed, 3); g.add(x, y, c, Math.max(0, n - 0.35) * 2.2 * f * k) }
    }
  }

  /** a small hut with a lit window (x, y = bottom left) */
  function hut(g, x, y, w, h, c, win) {
    g.rect(x, y - h, w, h, c); g.rect(x - 1, y - h - 1, w + 2, 2, mix(c, [255, 255, 255], 0.12))
    if (win) { g.rect(x + 2, y - h + 2, Math.max(2, w >> 2), 2, win); g.glow(x + 3, y - h + 3, 6, win, 0.3, 2) }
  }

  /** sharp, ridged peaks: returns the top y of the silhouette at every x */
  function peaks(base, amp, scale, seed) { const out = new Float32Array(W); for (let x = 0; x < W; x++) { let sum = 0, a = 1, f = 1; for (let o = 0; o < 5; o++) { const n = 1 - Math.abs(2 * vnoise(x * scale * f, seed * 5.1, seed + o * 13) - 1); sum += a * n * n; a *= 0.5; f *= 2.1 } out[x] = base - amp * Math.pow(Math.min(1, sum / 1.55), 1.5) } return out }

  /** soft pulsing 0..1 */
  const pulse = (t, period, phase = 0) => 0.5 + 0.5 * Math.sin(((t + phase) / period) * Math.PI * 2)
  /** position inside a repeating cycle, 0..1 */
  const cyc = (t, period, phase = 0) => (((t + phase) % period) + period) % period / period
  const ease = (x) => x * x * (3 - 2 * x)
  const seg = (p, a, b) => clamp01((p - a) / (b - a))

  root.Scene = { Worlds, def, milkyWay, mountains, aurora, tankField, ground, tree, mist, hut, peaks, pulse, cyc, ease, seg }
})(typeof window !== 'undefined' ? window : globalThis)

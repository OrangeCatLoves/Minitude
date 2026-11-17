/* The viewer. URL options for scripts:  ?w=<number>&t=<seconds>&life=<0..2>&wipe=<0..1>&manual=1 (the clock only moves when asked) */
(function () {
  'use strict'
  const { W, H } = Engine
  const $ = (id) => document.getElementById(id)
  const q = new URLSearchParams(location.search)
  const A = window.ASSETS
  // fonts for the page itself
  $('fonts').textContent = `@font-face{font-family:Pix;font-weight:500;src:url(${A.fonts.pix500})}@font-face{font-family:Pix;font-weight:700;src:url(${A.fonts.pix700})}@font-face{font-family:Sil;font-weight:700;src:url(${A.fonts.sil700})}`

  const S = { K: Number(q.get('life') ?? 1), speed: 1, playing: true, explorer: true, crop: true, t: Number(q.get('t') ?? 0), wipe: Number(q.get('wipe') ?? 0.5), cur: 0, slot: 20, manual: q.has('manual') }
  const images = [], worlds = new Map(), still = new Map()
  let explorerImgs = []

  function decode(src) { return new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = src }) }
  function pixels(im) { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, W, H).data }

  /** the entries of the picker: worlds 1 to 20, the unexplored stretch (slots 20 to 34, one design) and Planck Foam */
  const ENTRIES = []
  for (let k = 0; k < 20; k++) ENTRIES.push({ key: k, label: String(k + 1), slot: k })
  ENTRIES.push({ key: 'void', label: 'UNEXPLORED', slot: 20, variants: true })
  ENTRIES.push({ key: 35, label: 'PLANCK FOAM', slot: 35 })

  function slotOf(entry) { return entry.variants ? S.slot : entry.slot }
  function worldFor(slot) {
    const ck = slot + ':' + Motion.pickOf(slot)   // each design cuts the picture up its own way
    let w = worlds.get(ck)
    if (!w) {
      w = new Engine.World(slot, pixels(images[slot]))
      const m = Motion.forSlot(slot)
      if (m && m.setup) m.setup(w)
      worlds.set(ck, w)
      if (!still.has(slot)) still.set(slot, new ImageData(new Uint8ClampedArray(w.base), W, H))
    }
    return w
  }
  function render(slot, t, K, ctx, withExplorer) {
    const w = worldFor(slot)
    w.begin()
    const m = Motion.forSlot(slot)
    if (m && m.draw) m.draw(w, t, K)
    ctx.putImageData(w.image, 0, 0)
    if (withExplorer) drawExplorer(ctx, slot)
  }
  function drawExplorer(ctx, slot) {
    const st = 0, b = A.box[String(st)], im = explorerImgs[st]
    ctx.drawImage(im, b.ox, b.oy, b.w, b.h)
  }

  // ------------------------------------------------------------------ the big view: still on the left of the line, alive on the right
  const cv = $('cv'), cv2 = $('cv2'), g1 = cv.getContext('2d'), g2 = cv2.getContext('2d')
  const stage = $('stage')
  function applyCrop() {
    stage.style.aspectRatio = S.crop ? '320/165' : '320/180'
    for (const c of [cv, cv2]) { c.style.top = S.crop ? '-9.09%' : '0'; c.style.height = S.crop ? '109.09%' : '100%' }
    stage.style.overflow = 'hidden'
  }
  function drawBig() {
    const entry = ENTRIES.find((e) => e.key === S.cur), slot = slotOf(entry), w = worldFor(slot)
    // the still picture
    g1.putImageData(still.get(slot), 0, 0)
    if (S.explorer) drawExplorer(g1, slot)
    // the alive picture
    render(slot, S.t, S.K, g2, S.explorer)
    // the right part of the stage shows the alive picture: clip it with CSS
    cv2.style.clipPath = `inset(0 0 0 ${S.wipe * 100}%)`
    $('wipe').style.left = S.wipe * 100 + '%'
    void w
  }
  function select(key) {
    S.cur = key
    const entry = ENTRIES.find((e) => e.key === key)
    $('slotbox').hidden = !entry.variants
    for (const b of document.querySelectorAll('#worlds button')) b.setAttribute('aria-pressed', String(b.dataset.key === String(key)))
    const m = Motion.forSlot(slotOf(entry))
    // the designs to choose from (A, B, C)
    const vs = Motion.variantsOf(slotOf(entry)), box = $('designs')
    box.hidden = vs.length < 2; box.innerHTML = ''
    if (vs.length > 1) {
      const lab = document.createElement('label'); lab.textContent = 'DESIGN'; box.append(lab)
      vs.forEach((d, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = 'ABC'[i] + ': ' + String(d.title || '').toUpperCase(); b.setAttribute('aria-pressed', String(Motion.pickOf(slotOf(entry)) === i)); b.onclick = () => { Motion.setPick(slotOf(entry), i); savePicks(); select(key) }; box.append(b) })
    }
    showPicks()
    $('wname').textContent = (entry.variants ? 'UNEXPLORED (15 VARIANTS OF ONE LOOK, SLOTS 20 TO 34)' : entry.key === 35 ? 'WORLD 21: PLANCK FOAM' : 'WORLD ' + (entry.slot + 1) + ': ' + m.name)
    $('wdesc').textContent = m.desc || ''
    $('wmoves').innerHTML = (m.moves || []).map((s) => '<li>' + s + '</li>').join('')
    history.replaceState(null, '', '?w=' + key + (S.manual ? '&manual=1' : ''))
  }

  function showPicks() {
    const parts = ENTRIES.filter((e) => Motion.variantsOf(e.slot).length > 1).map((e) => (e.key === 35 ? 'FOAM ' : (e.slot + 1)) + 'ABC'[Motion.pickOf(e.slot)])
    $('picks').textContent = parts.length ? 'Your picks so far: ' + parts.join('  ') + '   (send me this line when you are done)' : ''
  }
  function savePicks() { try { const o = {}; ENTRIES.forEach((e) => { o[e.key] = Motion.pickOf(e.slot) }); localStorage.setItem('lw.picks2', JSON.stringify(o)) } catch (e) { /* the page works without storage */ } }
  function loadPicks() { try { const o = JSON.parse(localStorage.getItem('lw.picks2') || '{}'); ENTRIES.forEach((e) => { const v = o[e.key]; if (v === 1 || v === 2) Motion.setPick(e.slot, Math.min(v, Motion.variantsOf(e.slot).length - 1)) }) } catch (e) { /* ignore */ } }

  // ------------------------------------------------------------------ the small views
  const cells = []
  function buildGrid() {
    for (const entry of ENTRIES) {
      const d = document.createElement('div'); d.className = 'cell'
      const c = document.createElement('canvas'); c.width = W; c.height = H
      const s = document.createElement('span'); s.textContent = entry.key === 'void' ? 'UNEXPLORED' : entry.key === 35 ? '21 · PLANCK FOAM' : (entry.slot + 1) + ' · ' + Motion.forSlot(entry.slot).name
      d.append(c, s); d.onclick = () => { select(entry.key); scrollTo({ top: 0, behavior: 'smooth' }) }
      $('grid').append(d); cells.push({ entry, c, g: c.getContext('2d') })
    }
  }
  const visible = new Set()
  function observe() {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target) }), { rootMargin: '100px' })
    cells.forEach((c) => io.observe(c.c))
  }

  // ------------------------------------------------------------------ the loop
  let last = performance.now(), gridAt = 0
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now
    if (S.playing && !S.manual) S.t += dt * S.speed
    drawBig()
    if (now - gridAt > 90) {
      gridAt = now
      for (const c of cells) if (visible.has(c.c)) { const slot = c.entry.variants ? 24 : c.entry.slot; render(slot, S.t, S.K, c.g, true) }
    }
    requestAnimationFrame(frame)
  }

  async function start() {
    const ims = await Promise.all(A.worlds.map(decode)); ims.forEach((im, i) => { images[i] = im })
    explorerImgs = await Promise.all(A.explorer.map(decode))
    if (!q.has('manual')) loadPicks()
    const bar = $('worlds')
    for (const e of ENTRIES) { const b = document.createElement('button'); b.type = 'button'; b.dataset.key = e.key; b.textContent = e.label; b.setAttribute('aria-pressed', 'false'); b.onclick = () => select(e.key); bar.append(b) }
    buildGrid(); observe()
    $('life').oninput = (e) => { S.K = Number(e.target.value); $('lifev').textContent = S.K.toFixed(1) }
    $('speed').oninput = (e) => { S.speed = Number(e.target.value); $('speedv').textContent = S.speed + 'x' }
    $('play').onclick = () => { S.playing = !S.playing; $('play').textContent = S.playing ? 'PLAYING' : 'PAUSED'; $('play').setAttribute('aria-pressed', String(S.playing)) }
    $('expl').onclick = () => { S.explorer = !S.explorer; $('expl').setAttribute('aria-pressed', String(S.explorer)) }
    $('crop').onclick = () => { S.crop = !S.crop; $('crop').setAttribute('aria-pressed', String(S.crop)); applyCrop() }
    $('slot').oninput = (e) => { S.slot = Number(e.target.value); $('slotv').textContent = S.slot; select('void') }
    let drag = false
    const move = (e) => { const r = stage.getBoundingClientRect(); S.wipe = Math.max(0, Math.min(1, ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width)) }
    stage.addEventListener('pointerdown', (e) => { drag = true; move(e) }); window.addEventListener('pointerup', () => { drag = false }); stage.addEventListener('pointermove', (e) => { if (drag) move(e) })
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { S.playing = false; $('play').textContent = 'PAUSED'; $('play').setAttribute('aria-pressed', 'false') }
    $('life').value = S.K; $('lifev').textContent = S.K.toFixed(1)
    applyCrop()
    const w = q.get('w'); select(w === null ? 0 : (w === 'void' || Number.isNaN(Number(w))) ? 'void' : Number(w))
    if (q.get('slot')) { S.slot = Number(q.get('slot')); $('slot').value = S.slot; $('slotv').textContent = S.slot }
    document.body.classList.add('ready')
    // hooks for scripts
    window.Lab = { S, setTime: (t) => { S.t = t }, select, drawBig, render, worldFor, ENTRIES, still, pickAll: (i) => ENTRIES.forEach((e) => Motion.setPick(e.slot, i)) }
    requestAnimationFrame(frame)
  }
  start()
})()

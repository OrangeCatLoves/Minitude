/* The draft app: a guided tour, a playable run, the gem cabinet, and single scenes to look at.
 * It is a design prototype. It does NOT use the real game engine or server: the playtest checks your typing against the real answer lists
 * of 14 sample questions with a simplified matcher, and the six old rarities get a simplified reveal. The SINGULARITY moment is the real design. */
(async function () {
  'use strict'
  const U = window.UI, S = window.Scenes, G = window.Gem
  const { clamp01, smooth, prism, stext, rgb, COL, PX, SIL, wrap } = U
  const W = 1280, H = 720, STRIP = 60, HH = H + STRIP
  const qs = new URLSearchParams(location.search)
  await U.loadFonts()
  window.TIER_IMGS = await Promise.all(window.ASSETS.tierIcons.map((src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = src })))

  const canvas = document.getElementById('game'), ctx = canvas.getContext('2d')
  canvas.width = W; canvas.height = HH
  const $ = (id) => document.getElementById(id)

  // ------------------------------------------------------------------ the cabinet (what the player has found), kept in this browser only
  const KEY = 'singularity-gems-found'
  let found = new Set()
  try { found = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch (e) { /* private window: the cabinet just starts empty */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...found])) } catch (e) { /* ignore */ } }

  // ------------------------------------------------------------------ state
  const A = { mode: 'tour', t: 0, paused: false, chapter: 0, fired: new Set(), sel: 0, hoverSlot: -1, detail: null, scene: null, last: performance.now(), movie: false, onEnd: null }

  // ---- the tour
  const SAMPLE = [
    { prompt: 'Name a mineral.', answer: 'Quartz', tier: 0 }, { prompt: 'Name a national capital city.', answer: (window.GEMS.find((g) => g.id === 'places-capital-city') || {}).gem || 'a gem', tier: 6, gem: true }, { prompt: 'Name a chemical element.', answer: 'osmium', tier: 4 },
    { prompt: 'Name a musical instrument.', answer: 'Hurdy-gurdy', tier: 4 }, { prompt: 'Name a video game.', answer: 'Tetris', tier: 1 }, { prompt: 'Name a mammal.', answer: 'Okapi', tier: 3 }, { prompt: 'Name a philosopher.', answer: 'Plato', tier: 0 },
  ]
  const tourRecs = () => SAMPLE.map((s) => ({ prompt: s.prompt.replace(/^Name (an? |the )?/, '').replace(/\.$/, ''), answer: s.answer, tier: s.tier, pts: S.TIERS[s.tier].points }))
  const REVEAL_OPTS = { g: window.GEMS[0], answer: 'Norwegian Lundehund', pts0: 150, dots0: [1, 3, 2], count: 7 }
  const GEM_ANSWER = window.GEMS.find((g) => g.id === 'science-mineral')
  Object.assign(REVEAL_OPTS, { g: GEM_ANSWER, answer: GEM_ANSWER.gem, pts0: 150, dots0: [1, 3, 2], count: 7 })
  const demoFound = (k) => { const s = new Set(); const order = window.GEMS.map((g) => g.n).sort((a, b) => ((a * 37) % 101) - ((b * 37) % 101)); for (let i = 0; i < k; i++) s.add(order[i]); return s }

  const CHAPTERS = [
    { id: 'title', dur: 5, cap: 'DRAFT FOR REVIEW. A seventh rarity above Mythic, called SINGULARITY.', draw: (c, t) => S.drawTitle(c, t, {}) },
    { id: 'ladder', dur: 12, cap: 'The rarity ladder grows by one rung: 120 points, and a size stamp of ÷ 1,000,000. Seven prompts can now score up to 840.', draw: (c, t) => S.drawLadder(c, t), sounds: [[3.0, 'hover']] },
    { id: 'chain', dur: 9, cap: 'The rainbow gem next to the six agreed ones: the same 32 by 32 size, one dark outline, flat blocks. It just uses more hues.', draw: (c, t) => S.drawChain(c, t) },
    { id: 'reveal', dur: 7.0, cap: 'Type the gem answer. The world is pulled inward, goes silent for one beat, then the gem is born. (Turn the sound on.)', draw: (c, t) => S.drawReveal(c, t, REVEAL_OPTS), sounds: [[0, 'singularity'], [5.2, 'collect']] },
    { id: 'cabinet', dur: 11, cap: 'Every gem you find is kept in your cabinet, one slot per question. Unfound slots stay hidden behind a question mark.', draw: (c, t) => cabinetTour(c, t), sounds: [[1.0, 'blip'], [2.6, 'blip'], [4.2, 'blip'], [5.8, 'blip'], [7.2, 'blip'], [8.3, 'hover']] },
    { id: 'report', dur: 10, cap: 'The end-of-run report counts gems, and the share text gets a 💎 square. Your cabinet stays in your browser.', draw: (c, t) => S.drawReport(c, t, { recs: tourRecs(), cabinet: 8 }), sounds: [[0.9, 'blip'], [1.12, 'blip'], [1.34, 'hover'], [1.56, 'blip'], [1.78, 'blip'], [2.0, 'blip'], [2.22, 'blip'], [2.8, 'hover']] },
    { id: 'end', dur: 5, cap: 'Now play it: open the PLAYTEST. Real questions, real answer lists, and a "show the gem" peek button.', draw: (c, t) => S.drawTitle(c, t, { title: 'YOUR TURN', sub: 'OPEN PLAYTEST AND FIND A GEM', line: 'THE 200 GEM PICKS ARE IN THE REVIEW LIST' }) },
  ]
  const TOTAL = CHAPTERS.reduce((s, c) => s + c.dur, 0)
  const chapterStart = (i) => CHAPTERS.slice(0, i).reduce((s, c) => s + c.dur, 0)
  function cabinetTour(c, t) {
    const k = Math.round(8 + 44 * smooth(1, 8, t)), sel = Math.min(10, Math.floor(t / 1.0))
    const f = demoFound(k); const detail = t > 8.2 && t < 10.6 ? window.GEMS.find((g) => g.id === 'science-mineral' && (f.add(g.n), true)).n : null
    S.drawCabinet(c, t, { found: f, sel: t > 8.2 ? 5 : sel, hoverSlot: -1, detail })
  }

  // ------------------------------------------------------------------ sound hooks
  const sounds = { singularity: () => Sound.play('singularity'), collect: () => Sound.play('collect'), hover: () => Sound.play('hover'), blip: () => Sound.play('blip') }

  // ------------------------------------------------------------------ the playtest
  const PL = { q: [], i: 0, dots: [], recs: [], pts: 0, gemsThis: 0, phase: 'menu', msg: '', msgCol: null, peek: true, tried: new Set(), reveal: null, confirm: null, qIndex: [] }
  const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/^the /, '').replace(/[^a-z0-9]+/g, '')
  function indexQuestion(q) {
    const m = new Map(); const gemN = norm(q.gem)
    for (const [name, tier, aliases] of q.answers) for (const n of [name, ...aliases]) { const k = norm(n); if (k && !m.has(k)) m.set(k, { name, tier, gem: norm(name) === gemN }) }
    return m
  }
  const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length] }
  function startRun() {
    const pool = window.PLAY.slice().sort(() => Math.random() - 0.5).slice(0, 7)
    Object.assign(PL, { q: pool, i: 0, dots: [], recs: [], pts: 0, gemsThis: 0, phase: 'question', msg: '', tried: new Set(), reveal: null, confirm: null })
    PL.qIndex = pool.map(indexQuestion)
    setMode('play'); showInput(true)
  }
  function judge(text) {
    const q = PL.q[PL.i], idx = PL.qIndex[PL.i], k = norm(text)
    if (!k) return
    if (PL.tried.has(k)) { PL.msg = 'You already tried that one.'; PL.msgCol = [255, 200, 87]; return }
    const hit = idx.get(k)
    if (hit) return accept(hit)
    // a near miss gets the game's "did you mean?" question
    let best = null, bd = 9; const lim = k.length >= 9 ? 2 : k.length >= 5 ? 1 : 0
    if (lim) for (const [key, v] of idx) { if (Math.abs(key.length - k.length) > lim) continue; const d = lev(k, key); if (d <= lim && d < bd) { bd = d; best = v } }
    if (best) { PL.confirm = best; PL.msg = `Did you mean ${best.name}?  (Y / N)`; PL.msgCol = [141, 255, 180]; showInput(false); return }
    PL.tried.add(k); PL.msg = "We don't have that one. Check the spelling or try another."; PL.msgCol = [255, 130, 100]
  }
  function accept(hit) {
    const q = PL.q[PL.i], tier = hit.gem ? 6 : hit.tier
    PL.confirm = null; showInput(false)
    PL.phase = 'reveal'; PL.msg = ''
    PL.reveal = { t: 0, answer: hit.name, tier, g: window.GEMS.find((g) => g.id === q.id), fired: new Set(), pts0: PL.pts, dots0: PL.dots.slice(), count: found.size }
    PL.recs.push({ prompt: q.prompt.replace(/^Name (an? |the )?/, '').replace(/\.$/, ''), answer: hit.name, tier, pts: S.TIERS[tier].points })
  }
  function nextQuestion() {
    const r = PL.recs[PL.recs.length - 1]; PL.pts += r.pts; PL.dots.push(r.tier)
    if (r.tier === 6) PL.gemsThis++
    PL.i++; PL.tried = new Set(); PL.msg = ''
    if (PL.i >= 7) { PL.phase = 'report'; PL.reportT = 0; showInput(false); $('pbtn').hidden = false; return }
    PL.phase = 'question'; showInput(true)
  }
  function pass() { // give up on a question: no points, like a time-out
    if (PL.phase !== 'question') return
    PL.recs.push({ prompt: PL.q[PL.i].prompt.replace(/^Name (an? |the )?/, '').replace(/\.$/, ''), answer: '(time out)', tier: 0, pts: 0 }); PL.reveal = null
    const r = PL.recs[PL.recs.length - 1]; PL.pts += 0; PL.dots.push(0); PL.i++; PL.tried = new Set(); PL.msg = ''
    if (PL.i >= 7) { PL.phase = 'report'; PL.reportT = 0; showInput(false); $('pbtn').hidden = false } else showInput(true)
  }
  // a short, simplified reveal for the six old rarities (the real game has its own, richer one)
  function drawSimple(c, t, r) {
    const ti = r.tier, tr = S.TIERS[ti]
    U.backdrop(c, t)
    const dots = r.dots0.slice(); while (dots.length < 7) dots.push(null)
    S.hud(c, { dots, cur: r.dots0.length, pts: r.pts0 + tr.points * U.easeInOut((t - 1.2) / 0.9), gems: found.size }, t)
    const cx = 640, cy = 300, a = U.backOut((t - 0.15) / 0.35), size = [72, 84, 100, 116, 124, 132][ti]
    U.radialAdd(c, cx, cy, size * 1.8, tr.edge, 0.3 + 0.08 * ti)
    S.tierIcon(c, ti, cx, cy, Math.round(size * a / 4) * 4 || 4)
    const T = { 2: 'RARE!', 3: 'EXOTIC!', 4: 'LEGENDARY!', 5: 'MYTHIC!' }[ti]
    if (T) U.bigTitle(c, T, [0, 0, 72, 84, 90, 104][ti], cx, cy - size / 2 - 18, 1 + 0.9 * (1 - U.backOut(t / 0.3, 1.4)), U.mix(tr.fg, [255, 255, 255], 0.5), tr.edge, U.mix(tr.bg, [0, 0, 0], 0.3), tr.edge, { glow: 0.6, alpha: smooth(0, 0.06, t) })
    const n = Math.round(tr.points * U.easeOut((t - 0.5) / 0.7))
    stext(c, `${tr.name}   +${n}`, 640, 577, SIL(17), tr.fg, 3, 'center', smooth(0.4, 0.7, t))
    stext(c, r.answer, 640, 636, PX(54, 500), COL.OFF, 0, 'center', smooth(0.45, 0.75, t))
    stext(c, tr.sub, 640, 676, PX(19, 400), COL.SOFT, 0, 'center', smooth(0.5, 0.8, t))
  }

  // ------------------------------------------------------------------ modes
  function setMode(m) {
    A.mode = m; A.t = 0; A.paused = false; A.fired = new Set(); A.detail = null
    document.querySelectorAll('.nav button[data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === m))
    showInput(m === 'play' && PL.phase === 'question')
    $('pbtn').hidden = !(m === 'play' && PL.phase === 'report')
    $('tourbar').hidden = m !== 'tour'; $('playbar').hidden = m !== 'play'; $('cabbar').hidden = m !== 'cabinet'
    if (m === 'play' && PL.phase === 'menu') $('startbtn').hidden = false; else $('startbtn').hidden = true
    updateHelp()
  }
  const HELP = {
    tour: 'GUIDED TOUR. Space pauses. Left and right arrows change chapter. The sound is on after your first click.',
    play: 'PLAYTEST. Type answers to real questions. Not sure of the gem? Press the PEEK button. TAB passes a question.',
    cabinet: 'GEM CABINET. Click a category on the left, then a slot. Use the buttons to fill it with demo gems.',
    scene: '',
  }
  function updateHelp() { $('help').textContent = HELP[A.mode] || '' }
  function showInput(on) { const i = $('ans'); i.hidden = !on; if (on) { i.value = ''; setTimeout(() => i.focus(), 20) } }

  // ------------------------------------------------------------------ frame
  function frame(now) {
    const dt = Math.min(0.1, (now - A.last) / 1000); A.last = now
    if (A.movie && !A.movieStarted) { requestAnimationFrame(frame); return }
    if (!A.paused && !A.freeze) A.t += dt
    ctx.save(); ctx.fillStyle = '#04060f'; ctx.fillRect(0, 0, W, HH)
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip()
    let caption = '', progress = 0
    if (A.mode === 'tour') {
      if (A.t >= TOTAL) { A.t = A.loop ? 0 : TOTAL - 0.001; if (A.movie && A.onEnd) { const f = A.onEnd; A.onEnd = null; f() } if (A.loop) A.fired = new Set() }
      let acc = 0, ci = 0; for (; ci < CHAPTERS.length - 1; ci++) { if (A.t < acc + CHAPTERS[ci].dur) break; acc += CHAPTERS[ci].dur }
      const ch = CHAPTERS[ci], lt = A.t - acc
      if (ci !== A.chapter) { A.chapter = ci; for (const k of [...A.fired]) if (k.startsWith('c')) A.fired.delete(k) }
      for (const [at, name] of ch.sounds || []) { const key = 'c' + ci + name + at; if (lt >= at && !A.fired.has(key)) { A.fired.add(key); if (!A.freeze) sounds[name]() } }
      ch.draw(ctx, lt); caption = ch.cap; progress = A.t / TOTAL
      $('chap').textContent = `${ci + 1} / ${CHAPTERS.length}  ${ch.id.toUpperCase()}`
    } else if (A.mode === 'play') {
      if (PL.phase === 'menu') S.drawTitle(ctx, A.t, { title: 'PLAYTEST', sub: 'SEVEN QUESTIONS, ONE GEM IN EACH', line: 'YOUR GEM: ' + G.describe().toUpperCase() + '  ·  CHANGE IT WITH CHOOSE GEM' })
      else if (PL.phase === 'question') { S.drawQuestion(ctx, A.t, { prompt: PL.q[PL.i].prompt, n: PL.i + 1, dots: PL.dots, pts: PL.pts, gems: found.size, msg: PL.msg, msgCol: PL.msgCol }); caption = PL.peek ? 'GEM HINT: ' + PL.q[PL.i].gem + '   (use the PEEK button to hide this)' : 'Type an answer and press Enter.' }
      else if (PL.phase === 'reveal') {
        const r = PL.reveal; r.t += A.paused ? 0 : dt
        if (r.tier === 6) {
          if (!r.fired.has('s')) { r.fired.add('s'); Sound.play('singularity') }
          if (r.t >= 5.2 && !r.fired.has('c')) { r.fired.add('c'); Sound.play('collect') }
          if (r.t >= 5.5 && !r.fired.has('f')) { r.fired.add('f'); found.add(r.g.n); save() }
          S.drawReveal(ctx, r.t, { g: r.g, answer: r.answer, pts0: r.pts0, dots0: r.dots0, count: r.count })
          if (r.t >= S.REVEAL_LEN) nextQuestion()
        } else {
          if (!r.fired.has('s')) { r.fired.add('s'); Sound.play(r.tier >= 2 ? 'hover' : 'blip') }
          drawSimple(ctx, r.t, r); if (r.t >= 2.6 + 0.15 * r.tier) nextQuestion()
        }
      } else if (PL.phase === 'report') { PL.reportT = (PL.reportT || 0) + dt; S.drawReport(ctx, PL.reportT, { recs: PL.recs, cabinet: found.size }) }
    } else if (A.mode === 'cabinet') {
      S.drawCabinet(ctx, A.t, { found, sel: A.sel, hoverSlot: A.hoverSlot, detail: A.detail }); caption = 'Click a category, then a slot. Found gems show their answer; the rest stay a question mark. Each of the 200 gems has its own look.'
    } else if (A.mode === 'scene') {
      const s = A.scene; s.draw(ctx, A.t); caption = s.cap || ''
    }
    ctx.restore()
    // the strip under the picture: what is being shown, and a progress line
    ctx.fillStyle = '#080d20'; ctx.fillRect(0, H, W, STRIP); ctx.fillStyle = 'rgba(110,124,170,0.35)'; ctx.fillRect(0, H, W, 1)
    if (caption) { const lines = wrap(ctx, PX(19, 400), caption, 1180); lines.slice(0, 2).forEach((ln, i) => stext(ctx, ln, 640, H + 26 + i * 22, PX(19, 400), COL.OFF, 0, 'center')) }
    if (progress) { ctx.fillStyle = rgb(prism(A.t, 0, 66)); ctx.fillRect(0, H + STRIP - 4, W * progress, 4) }
    requestAnimationFrame(frame)
  }

  // ------------------------------------------------------------------ choosing the gem (design x colour); kept in this browser
  const onGallery = () => (A.mode === 'tour' && CHAPTERS[A.chapter].id === 'gallery') || (A.mode === 'scene' && A.scene && A.scene.id === 'gallery')
  function refreshTiles() { document.querySelectorAll('#pgrid .ptile').forEach((b) => { const g = b.querySelector('canvas').getContext('2d'); g.clearRect(0, 0, 32, 32); g.drawImage(G.sprite(+b.dataset.d, G.sel.c), 0, 0) }) }
  function updateChoice() {
    $('choice').textContent = G.describe()
    const big = $('pbig'), g = big.getContext('2d'); g.clearRect(0, 0, 32, 32); g.drawImage(G.sprite(G.sel.d, G.sel.c), 0, 0)
    $('pname').textContent = G.describe(); $('pdesc').textContent = G.DESIGNS[G.sel.d] ? G.DESIGNS[G.sel.d].vibe : ''
    document.querySelectorAll('#pgrid .ptile').forEach((b) => b.classList.toggle('on', +b.dataset.d === G.sel.d))
    document.querySelectorAll('#pgrid .ptone').forEach((b) => b.classList.toggle('on', +b.dataset.c === G.sel.c))
    refreshTiles()
  }
  function buildPicker() {
    const grid = $('pgrid'); grid.innerHTML = ''
    const bar = document.createElement('div'); bar.className = 'ptones'; bar.innerHTML = '<span>RAINBOW TONE</span>'
    G.COLOURS.forEach((col, ci) => { const b = document.createElement('button'); b.className = 'ptone'; b.dataset.c = ci; b.textContent = col.name.toUpperCase(); b.onclick = () => { G.select(G.sel.d, ci); Sound.ensure(); Sound.play('blip'); updateChoice() }; bar.appendChild(b) })
    grid.appendChild(bar)
    const tiles = document.createElement('div'); tiles.className = 'ptiles'
    G.DESIGNS.forEach((d, di) => {
      const b = document.createElement('button'); b.className = 'ptile'; b.dataset.d = di; b.title = d.name + ': ' + d.vibe
      const cv = document.createElement('canvas'); cv.width = cv.height = 32; b.appendChild(cv)
      const lb = document.createElement('span'); lb.textContent = (di + 1) + ' ' + d.name; b.appendChild(lb)
      b.onclick = () => { G.select(di, G.sel.c); Sound.ensure(); Sound.play('blip'); updateChoice() }
      tiles.appendChild(b)
    })
    grid.appendChild(tiles); updateChoice()
  }
  const openPicker = () => { Sound.ensure(); $('picker').hidden = false; updateChoice(); const on = document.querySelector('#pgrid .ptile.on'); if (on) on.scrollIntoView({ block: 'center' }) }
  const closePicker = () => { $('picker').hidden = true }
  $('pclose').onclick = closePicker
  $('picker').addEventListener('click', (e) => { if (e.target.id === 'picker') closePicker() })
  $('pplay').onclick = () => { closePicker(); setMode('play') }
  $('preveal').onclick = () => { closePicker(); document.querySelector('[data-scene="reveal"]').click() }
  buildPicker()

  // ------------------------------------------------------------------ the controls
  const toLogical = (e) => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * HH] }
  canvas.addEventListener('mousemove', (e) => {
    const [x, y] = toLogical(e)
    if (A.mode === 'cabinet' && A.detail == null) {
      const lay = S.cabinetLayout(); A.hoverSlot = -1
      const cat = G.CATEGORIES[A.sel], n = window.GEMS.filter((g) => g.cat === cat.name).length
      for (let i = 0; i < n; i++) { const r = lay.slot(i); if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) A.hoverSlot = i }
    }
    if (onGallery()) { const h = S.galleryHit(x, y); A.hover = h && h.d != null ? h.d : undefined; A.hoverC = h && h.c != null ? h.c : undefined }
  })
  canvas.addEventListener('click', (e) => {
    const [x, y] = toLogical(e); Sound.ensure()
    if (A.mode === 'cabinet') {
      if (A.detail != null) { A.detail = null; return }
      const lay = S.cabinetLayout()
      lay.tabs.forEach((r, i) => { if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) { A.sel = i; Sound.play('blip') } })
      const cat = G.CATEGORIES[A.sel], list = window.GEMS.filter((g) => g.cat === cat.name)
      list.forEach((g, i) => { const r = lay.slot(i); if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) { A.detail = g.n; Sound.play('hover') } })
    } else if (onGallery()) { const h = S.galleryHit(x, y); if (h) { if (h.d != null) G.select(h.d, G.sel.c); else G.select(G.sel.d, h.c); Sound.play('hover'); updateChoice() } }
  })
  document.addEventListener('keydown', (e) => {
    if (e.target === $('ans')) { if (e.key === 'Enter') { Sound.ensure(); judge($('ans').value); $('ans').value = '' } if (e.key === 'Tab') { e.preventDefault(); pass() } return }
    Sound.ensure()
    if (A.mode === 'play' && PL.confirm) { if (e.key.toLowerCase() === 'y') accept(PL.confirm); else if (e.key.toLowerCase() === 'n') { PL.tried.add(norm(PL.confirm.name)); PL.confirm = null; PL.msg = "We don't have that one."; PL.msgCol = [255, 130, 100]; showInput(true) } }
    if (A.mode === 'tour') {
      if (e.key === ' ') { e.preventDefault(); A.paused = !A.paused }
      if (e.key === 'ArrowRight') jump(A.chapter + 1); if (e.key === 'ArrowLeft') jump(A.chapter - 1)
    }
    if (e.key === 'Escape') { A.detail = null; closePicker() }
  })
  function jump(i) { i = Math.max(0, Math.min(CHAPTERS.length - 1, i)); A.t = chapterStart(i); A.fired = new Set(); A.chapter = i }
  $('startbtn').onclick = () => { Sound.ensure(); $('startbtn').hidden = true; startRun() }
  $('pbtn').onclick = () => { Sound.ensure(); startRun() }
  $('peek').onclick = () => { PL.peek = !PL.peek; $('peek').textContent = PL.peek ? 'PEEK: ON' : 'PEEK: OFF' }
  $('pass').onclick = pass
  $('ans').addEventListener('focus', () => Sound.ensure())
  $('pickbtn').onclick = openPicker
  $('mute').onclick = () => { Sound.setMuted(!Sound.isMuted()); $('mute').textContent = Sound.isMuted() ? 'SOUND: OFF' : 'SOUND: ON' }
  $('prev').onclick = () => jump(A.chapter - 1); $('next').onclick = () => jump(A.chapter + 1)
  $('pause').onclick = () => { A.paused = !A.paused; $('pause').textContent = A.paused ? 'PLAY' : 'PAUSE' }
  $('replay').onclick = () => { Sound.ensure(); jump(A.chapter) }
  $('fill30').onclick = () => { found = demoFound(60); save() }; $('fillall').onclick = () => { found = new Set(window.GEMS.map((g) => g.n)); save() }; $('empty').onclick = () => { found = new Set(); save() }
  document.querySelectorAll('.nav button[data-mode]').forEach((b) => b.addEventListener('click', () => { Sound.ensure(); const m = b.dataset.mode; if (m === 'tour') { setMode('tour'); jump(0) } else if (m === 'play') { if (PL.phase === 'reveal' || PL.phase === 'question') { /* resume */ } setMode('play') } else setMode(m) }))
  document.querySelectorAll('[data-scene]').forEach((b) => b.addEventListener('click', () => { Sound.ensure(); const id = b.dataset.scene; const ch = CHAPTERS.find((c) => c.id === id); setMode('scene'); A.scene = ch; A.t = 0; A.fired = new Set(); $('chap').textContent = id.toUpperCase(); if (ch.sounds) ch.sounds.forEach(([at, name]) => setTimeout(() => sounds[name](), at * 1000)) }))

  // ------------------------------------------------------------------ hooks for the recorder and for screenshots
  window.__draft = {
    A, PL, CHAPTERS, TOTAL,
    show(id, t) { const ch = CHAPTERS.find((c) => c.id === id); setMode('scene'); A.scene = ch; A.t = t; A.freeze = true },
    cabinet(k, sel, detail) { found = demoFound(k); setMode('cabinet'); A.sel = sel || 0; A.detail = detail ?? null; A.t = 3; A.freeze = true },
    async record() {
      // play the whole tour once while recording the picture and the sound
      Sound.ensure(); const R = Sound.live
      const vs = canvas.captureStream(30), as = R.tap.stream, mix = new MediaStream([...vs.getVideoTracks(), ...as.getAudioTracks()])
      const mime = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2') ? 'video/mp4;codecs=avc1.42E01E,mp4a.40.2' : 'video/webm;codecs=vp9,opus'
      const rec = new MediaRecorder(mix, { mimeType: mime, videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 160_000 }), chunks = []
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
      const done = new Promise((res) => { rec.onstop = res })
      setMode('tour'); A.freeze = false; A.t = 0; A.fired = new Set(); A.movie = true; A.movieStarted = true; A.loop = false
      const ended = new Promise((res) => { A.onEnd = res })
      rec.start(250); await ended; await new Promise((r) => setTimeout(r, 600)); rec.stop(); await done
      const blob = new Blob(chunks, { type: mime.split(';')[0] }), buf = new Uint8Array(await blob.arrayBuffer()); let s = ''
      for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000))
      return { mime, b64: btoa(s) }
    },
  }
  // opening the page: the tour runs from the start (it waits for a click to make sound)
  const scene = qs.get('scene'), tt = qs.get('t')
  if (qs.get('design')) G.select(+qs.get('design') - 1, +(qs.get('colour') || 1) - 1)
  updateChoice()
  if (qs.get('picker')) openPicker()
  setMode(qs.get('mode') || 'tour')
  if (qs.get('movie')) { A.movie = true; A.movieStarted = false; A.paused = false }
  if (scene) window.__draft.show(scene, +(tt || 0))
  else if (qs.get('chapter')) { jump(+qs.get('chapter')); A.t += +(tt || 0); if (qs.get('freeze')) A.freeze = true }
  if (qs.get('cab')) window.__draft.cabinet(+qs.get('cab'), +(qs.get('sel') || 0), qs.get('detail') ? +qs.get('detail') : null)
  document.body.classList.add('ready')
  requestAnimationFrame(frame)
})()

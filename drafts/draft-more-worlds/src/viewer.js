/* viewer.js: the review page. Rows of two designs per world, every picture alive, a big view with the facts, and a list of picks to paste into the chat. */
(function () {
  const Worlds = Scene.Worlds
  const G = new Gfx.Gfx()
  const KINDS = {
    MEASURED: { cls: 'k-measured', text: 'Something with this energy was seen or measured.' },
    LIMIT: { cls: 'k-limit', text: 'Experiments looked here and found nothing, which sets a limit.' },
    THEORY: { cls: 'k-theory', text: 'A published idea that no experiment has tested.' },
    PLAN: { cls: 'k-plan', text: 'A machine that has been proposed but not built.' },
  }
  const POWER = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }
  const sup = (n) => String(n).split('').map((c) => POWER[c] ?? c).join('')
  const sizeText = (points) => { const e = -points / 20, m = 1.7 * Math.pow(10, e - Math.floor(e)) ; const ex = Math.floor(e); return (1.7 * Math.pow(10, e - Math.ceil(e) + 1)).toFixed(1) + ' × 10' + sup(Math.ceil(e) - 1) + ' m' }
  const sizeOf = (points) => { const e = Math.floor(-points / 20 + 1e-9), mant = 1.7 * Math.pow(10, -points / 20 - e); return mant.toFixed(1) + ' × 10' + sup(e) + ' m' }
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e }
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v) } catch (e) { return d } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { /* ignore */ } } }

  let paused = store.get('moreworlds.paused', window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)
  let picks = new Set(store.get('moreworlds.picks', []))
  const STILL_T = 3.1
  const cards = []
  const visible = new Set()

  // ---- the ladder of points -------------------------------------------------------------------
  function buildLadder() {
    const box = document.getElementById('ladder')
    const bar = el('div', 'ladder-bar')
    for (let w = 21; w <= 30; w++) { const a = (w - 1) * 20, seg = el('a', 'seg', '<b>' + w + '</b><small>' + a + '</small>'); seg.href = '#w' + w; seg.title = 'World ' + w + ': ' + a + ' to ' + (a + 20) + ' points, ' + sizeOf(a) + ' down to ' + sizeOf(a + 20); bar.appendChild(seg) }
    const un = el('div', 'seg unex', '<b>UNEXPLORED</b><small>600 – 700</small>'); un.title = '600 to 700 points: 1.7 × 10⁻³⁰ m down to the Planck length'; bar.appendChild(un)
    const pl = el('div', 'seg planck', '<b>PLANCK FOAM</b><small>700</small>'); bar.appendChild(pl)
    box.appendChild(bar)
  }

  // ---- cards -----------------------------------------------------------------------------------
  function card(w) {
    const k = KINDS[w.kind] || KINDS.THEORY
    const c = el('article', 'card'); c.id = 'd' + w.id
    const pic = el('button', 'pic'); pic.type = 'button'; pic.setAttribute('aria-label', 'Open ' + w.name + ' in the big view')
    const cv = el('canvas'); cv.width = 320; cv.height = 180; pic.appendChild(cv)
    const tag = el('div', 'tag ' + k.cls, '<span>' + w.kind + '</span> ' + w.label)
    const head = el('h3', null, '<i>' + w.id + '</i> ' + w.name)
    const desc = el('p', 'desc', w.desc)
    const row = el('div', 'actions')
    const keep = el('button', 'keep'); keep.type = 'button'
    const open = el('button', 'more', 'WHAT IS REAL'); open.type = 'button'
    row.appendChild(keep); row.appendChild(open)
    c.appendChild(pic); c.appendChild(head); c.appendChild(tag); c.appendChild(desc); c.appendChild(row)
    const rec = { w, cv, ctx: cv.getContext('2d'), keep, el: c }
    const syncKeep = () => { keep.textContent = picks.has(w.id) ? '★ KEPT' : '☆ KEEP'; keep.setAttribute('aria-pressed', picks.has(w.id)); c.classList.toggle('kept', picks.has(w.id)) }
    keep.addEventListener('click', () => { picks.has(w.id) ? picks.delete(w.id) : picks.add(w.id); store.set('moreworlds.picks', [...picks]); cards.forEach((r) => r.sync()); updatePicks() })
    pic.addEventListener('click', () => openBig(w)); open.addEventListener('click', () => openBig(w))
    rec.sync = syncKeep; syncKeep(); cards.push(rec)
    drawCard(rec, STILL_T)
    return c
  }
  function drawCard(rec, t) { G.clear([0, 0, 0]); rec.w.draw(G, t); G.present(rec.ctx) }

  function buildRows() {
    const host = document.getElementById('rows')
    for (let n = 21; n <= 30; n++) {
      const a = (n - 1) * 20, list = Worlds.filter((w) => w.world === n)
      const row = el('section', 'row'); row.id = 'w' + n
      const energy = list[0] && list[0].scale ? '' : ''
      row.appendChild(el('header', null, '<h2>WORLD ' + n + '</h2><p><b>' + a + ' – ' + (a + 20) + ' points</b><span>' + sizeOf(a) + ' → ' + sizeOf(a + 20) + '</span></p>'))
      const pair = el('div', 'pair'); list.forEach((w) => pair.appendChild(card(w))); row.appendChild(pair)
      host.appendChild(row)
    }
  }

  // ---- picks ------------------------------------------------------------------------------------
  function updatePicks() {
    const ids = [...picks].sort()
    document.getElementById('picks-list').textContent = ids.length ? ids.join(', ') : 'nothing kept yet'
    const per = {}; ids.forEach((i) => { const n = Number(i.slice(0, 2)); per[n] = (per[n] || 0) + 1 })
    const filled = Object.keys(per).length
    document.getElementById('picks-note').textContent = ids.length ? filled + ' of 10 worlds have a pick' + (ids.some((i) => per[Number(i.slice(0, 2))] > 1) ? ' (some have two: that is fine, say which you prefer)' : '') + '.' : 'Keep the designs you like. The list is only for pasting into the chat.'
  }
  function copyPicks() {
    const txt = [...picks].sort().join(', ')
    const done = () => { const b = document.getElementById('copy'); b.textContent = 'COPIED'; setTimeout(() => (b.textContent = 'COPY LIST'), 1400) }
    const select = () => { const n = document.getElementById('picks-list'), r = document.createRange(); r.selectNodeContents(n); const s = getSelection(); s.removeAllRanges(); s.addRange(r); done() }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, select); else select()
  }

  // ---- the big view -----------------------------------------------------------------------------
  let big = null
  function openBig(w) {
    big = w
    const d = document.getElementById('big'), k = KINDS[w.kind] || KINDS.THEORY
    document.getElementById('big-name').innerHTML = '<i>' + w.id + '</i> ' + w.name
    document.getElementById('big-tag').className = 'tag ' + k.cls
    document.getElementById('big-tag').innerHTML = '<span>' + w.kind + '</span> ' + w.label
    document.getElementById('big-kind').textContent = k.text
    document.getElementById('big-desc').textContent = w.desc
    const a = (w.world - 1) * 20
    document.getElementById('big-scale').innerHTML = '<dt>World</dt><dd>' + w.world + ' (' + a + ' to ' + (a + 20) + ' points)</dd><dt>Sizes it covers</dt><dd>' + sizeOf(a) + ' to ' + sizeOf(a + 20) + '</dd><dt>The real number</dt><dd>' + w.scale.energy + ', wavelength ' + w.scale.length + '</dd>'
    document.getElementById('big-real').innerHTML = w.real.map((p) => '<p>' + p + '</p>').join('') + '<p class="src">Source: ' + w.source + '</p>'
    const bk = document.getElementById('big-keep'); bk.textContent = picks.has(w.id) ? '★ KEPT' : '☆ KEEP'
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '')
    bigStart = performance.now() - 600
  }
  let bigStart = 0
  function closeBig() { const d = document.getElementById('big'); big = null; if (d.close) d.close(); else d.removeAttribute('open') }

  // ---- loop -------------------------------------------------------------------------------------
  const bigCv = () => document.getElementById('big-canvas')
  let last = 0, t0 = performance.now()
  function frame(now) {
    requestAnimationFrame(frame)
    if (now - last < 1000 / 24) return
    last = now
    if (big) { const cv = bigCv(); G.clear([0, 0, 0]); big.draw(G, paused ? STILL_T : (now - bigStart) / 1000 + 0.6); G.present(cv.getContext('2d')); return }
    if (paused) return
    const t = (now - t0) / 1000
    for (const rec of cards) if (visible.has(rec.el)) drawCard(rec, t + rec.w.world * 0.37)
  }

  function setPaused(p) {
    paused = p; store.set('moreworlds.paused', p)
    document.getElementById('pause').textContent = p ? '▶ PLAY MOTION' : '⏸ PAUSE MOTION'
    document.getElementById('pause').setAttribute('aria-pressed', p)
    if (p) cards.forEach((r) => drawCard(r, STILL_T))
  }

  function start() {
    buildLadder(); buildRows(); updatePicks()
    const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))), { rootMargin: '80px' })
    cards.forEach((r) => io.observe(r.el))
    document.getElementById('pause').addEventListener('click', () => setPaused(!paused)); setPaused(paused)
    document.getElementById('copy').addEventListener('click', copyPicks)
    document.getElementById('clear').addEventListener('click', () => { picks.clear(); store.set('moreworlds.picks', []); cards.forEach((r) => r.sync()); updatePicks() })
    document.getElementById('big-close').addEventListener('click', closeBig)
    document.getElementById('big').addEventListener('close', () => { big = null })
    document.getElementById('big').addEventListener('click', (e) => { if (e.target.id === 'big') closeBig() })
    document.getElementById('big-keep').addEventListener('click', () => { if (!big) return; picks.has(big.id) ? picks.delete(big.id) : picks.add(big.id); store.set('moreworlds.picks', [...picks]); document.getElementById('big-keep').textContent = picks.has(big.id) ? '★ KEPT' : '☆ KEEP'; cards.forEach((r) => r.sync()); updatePicks() })
    requestAnimationFrame(frame)
    window.MoreWorlds = { Worlds, openBig, closeBig, setPaused }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start()
})()

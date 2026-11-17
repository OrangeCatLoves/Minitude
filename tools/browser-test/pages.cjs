// The plain pages (how to play, about, privacy), the links to them on the title screen, and the visit count (docs/TRAFFIC.md). Needs `npm run dev`.
//   MINITUDE_URL=http://localhost:5173 MINITUDE_CHANNEL=chrome node pages.cjs      (pictures go to out/pages-*.png)
// Checks: the three pages open without a script error and have a footer; the title screen shows three links at the top right, and they are gone
// during a run; they do not sit on the sound or cabinet buttons nor on an ad; the visit ping sends the time zone and nothing else, once, after
// a few seconds; a browser that says it is automated (navigator.webdriver) sends nothing; the test modes (?debug=1) send nothing.
const { chromium } = require('playwright')
const path = require('path')
const OUT = path.join(__dirname, 'out')
require('fs').mkdirSync(OUT, { recursive: true })
const BASE = process.env.MINITUDE_URL || 'http://127.0.0.1:5173'
let bad = 0
const ok = (c, w, d = '') => { if (!c) bad++; console.log((c ? 'ok       ' : 'PROBLEM  ') + w + (d ? '  ' + d : '')) }

const NOT_AUTOMATED = () => { Object.defineProperty(navigator, 'webdriver', { get: () => false }) }

;(async () => {
  const browser = await chromium.launch({
    ...(process.env.MINITUDE_CHANNEL ? { channel: process.env.MINITUDE_CHANNEL } : {}),
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
  })

  console.log('## the three pages')
  {
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 800 } })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
    for (const p of ['how-to-play', 'about', 'privacy']) {
      await page.goto(`${BASE}/${p}`)
      await page.waitForSelector('footer.site-foot', { timeout: 20000 }).catch(() => {})
      const h1 = await page.locator('h1').first().innerText().catch(() => '')
      const foot = await page.locator('footer.site-foot').count()
      const privacyLink = await page.locator('footer.site-foot a[href="/privacy"]').count()
      ok(h1.length > 3 && foot === 1, `/${p} opens with a heading and a footer`, h1)
      if (p !== 'privacy') ok(privacyLink === 1, `/${p}: the footer links to the privacy page`)
      if (p === 'privacy') ok((await page.locator('#updated').innerText()).toLowerCase() === '17 november 2026', 'the privacy page shows its new date')
      if (p !== 'privacy') ok(await page.locator('#contact').isVisible(), `/${p}: the contact section shows (there is an address to write to)`)
      await page.screenshot({ path: path.join(OUT, `pages-${p}.png`), fullPage: false })
      // a page on a phone must not scroll sideways
    }
    ok(errors.length === 0, 'no script errors on the three pages', errors.join(' | ').slice(0, 200))
    await ctx.close()
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    const pp = await phone.newPage()
    for (const p of ['how-to-play', 'about']) {
      await pp.goto(`${BASE}/${p}`)
      await pp.waitForSelector('footer.site-foot', { timeout: 20000 }).catch(() => {})
      const wide = await pp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      ok(wide <= 1, `/${p} does not scroll sideways on a phone`, `${wide} px too wide`)
    }
    await pp.screenshot({ path: path.join(OUT, 'pages-how-to-play-phone.png') })
    await phone.close()
  }

  console.log('\n## the links on the title screen')
  for (const [name, w, h, touch, query] of [['laptop', 1440, 800, false, ''], ['laptop-with-ad-preview', 1440, 800, false, '&adpreview=1'], ['phone', 390, 844, true, ''], ['phone-small', 320, 568, true, '&adpreview=1']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch })
    await ctx.addInitScript(NOT_AUTOMATED)
    await ctx.route('**/api/visit', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))
    const page = await ctx.newPage()
    await page.goto(BASE + '/?debug=1' + query)
    await page.waitForSelector('#boot', { state: 'hidden', timeout: 90000 })
    await page.waitForTimeout(1200)
    const r = await page.evaluate(() => {
      const box = (sel) => { const e = document.querySelector(sel); if (!e) return null; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, r: b.right, b: b.bottom } }
      return { links: box('#pagelinks'), parts: [...document.querySelectorAll('#pagelinks a')].map((a) => { const b = a.getBoundingClientRect(); return { x: b.left, y: b.top, r: b.right, b: b.bottom } }), anchors: [...document.querySelectorAll('#pagelinks a')].map((a) => a.getAttribute('href')), mute: box('#mute'), cab: box('#cabbtn'), left: box('#ads .ad-left'), right: box('#ads .ad-right'), bottom: box('#ads .ad-bottom'), vw: innerWidth, title: document.documentElement.hasAttribute('data-title') }
    })
    const hit = (a, b) => a && b && a.x < b.r && a.r > b.x && a.y < b.b && a.b > b.y
    ok(!!r.links && r.title, `${name}: the three links show on the title screen`, JSON.stringify(r.anchors))
    ok(JSON.stringify(r.anchors) === JSON.stringify(['/how-to-play', '/about', '/privacy']), `${name}: they go to how to play, about and privacy`)
    ok(r.links && r.links.r <= r.vw && r.links.x >= 0, `${name}: they are inside the window`)
    ok(!r.parts.some((a) => hit(a, r.mute) || hit(a, r.cab)), `${name}: they do not sit on the sound or cabinet buttons`)
    if (w >= 360) ok(r.parts.every((a) => a.y === r.parts[0].y), `${name}: the three links are on one line`)   // a 320 px phone wraps them to two rows: fine, they overlap nothing
    ok(!r.parts.some((a) => hit(a, r.left) || hit(a, r.right) || hit(a, r.bottom)), `${name}: they do not sit on an ad`)
    await page.screenshot({ path: path.join(OUT, `pages-title-${name}.png`) })
    // pressing PLAY takes them away
    if (name === 'laptop') {
      await page.evaluate(() => { window.__mtv.game.press('solo').catch(() => {}) })
      await page.waitForTimeout(600)
      ok(!(await page.evaluate(() => document.documentElement.hasAttribute('data-title'))), 'the links are gone once PLAY is pressed')
      // and a link opens its page in a new tab (the game here has already started, so use a fresh page)
    }
    await ctx.close()
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 800 } })
    await ctx.addInitScript(NOT_AUTOMATED)
    await ctx.route('**/api/visit', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))
    const page = await ctx.newPage()
    await page.goto(BASE + '/?debug=1')
    await page.waitForSelector('#boot', { state: 'hidden', timeout: 90000 })
    await page.waitForTimeout(1200)
    const [popup] = await Promise.all([ctx.waitForEvent('page'), page.click('#pagelinks a[href="/how-to-play"]')])
    await popup.waitForLoadState()
    ok(/\/how-to-play$/.test(popup.url()), 'a link opens its page in a new tab', popup.url())
    ok(!(await page.evaluate(() => window.__mtv.game.pressedAt)), 'the game stays where it was')
    await ctx.close()
  }

  console.log('\n## the visit count')
  const visitTest = async (label, { init, query, expectSent, wait = 7500, touch = false }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
    if (init) await ctx.addInitScript(init)
    const sent = []
    await ctx.route('**/api/visit', (r) => { sent.push({ body: r.request().postData(), method: r.request().method() }); r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }) })
    const page = await ctx.newPage()
    await page.goto(BASE + '/' + query)
    await page.waitForSelector('#boot', { state: 'hidden', timeout: 90000 })
    if (touch) await page.mouse.click(300, 300)
    await page.waitForTimeout(wait)
    ok(sent.length === expectSent, `${label}: ${expectSent} visit${expectSent === 1 ? '' : 's'} sent`, `${sent.length} sent`)
    await ctx.close()
    return sent
  }
  const s1 = await visitTest('a normal browser, left open', { init: NOT_AUTOMATED, query: '', expectSent: 1 })
  if (s1[0]) {
    const b = JSON.parse(s1[0].body)
    ok(Object.keys(b).join() === 'tz' && typeof b.tz === 'string', 'it sends the time zone and nothing else', s1[0].body)
    ok(s1[0].method === 'POST', 'as a POST')
  }
  await visitTest('a browser that is touched at once', { init: NOT_AUTOMATED, query: '', expectSent: 1, wait: 1500, touch: true })
  await visitTest('a page left after two seconds', { init: NOT_AUTOMATED, query: '', expectSent: 0, wait: 2000 })
  await visitTest('a browser that says it is automated', { init: null, query: '', expectSent: 0, wait: 7500, touch: true })
  await visitTest('the test mode ?debug=1', { init: NOT_AUTOMATED, query: '?debug=1', expectSent: 0 })
  await visitTest('the test mode ?manual=1', { init: NOT_AUTOMATED, query: '?manual=1', expectSent: 0 })

  await browser.close()
  console.log(bad ? `\n${bad} PROBLEM(S)` : '\nall good')
  process.exit(bad ? 1 : 0)
})().catch((e) => { console.error(e); process.exit(1) })

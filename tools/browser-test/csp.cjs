// The Content-Security-Policy (packages/server/src/securityHeaders.ts) must not stop the game from working. Plays through the screens
// that load things (title, a question, the lobby, the report with the page under it, the gem cabinet, the privacy page, the API) and
// FAILS on any refusal the browser reports. Needs the PRODUCTION server, because only it sends the headers:
//   npm run build; (cd packages/server && PORT=8788 DATABASE_FILE=<throw-away file> node --import tsx src/index.ts)
//   MINITUDE_URL=http://localhost:8788 MINITUDE_CHANNEL=chrome node csp.cjs
// It lets every question time out (a miss scores 0, nothing is typed into the server) and rates nothing.
const { chromium } = require('playwright')
const BASE = process.env.MINITUDE_URL || 'http://localhost:8788'
let bad = 0
const ok = (c, w, d = '') => { if (!c) bad++; console.log((c ? 'ok       ' : 'PROBLEM  ') + w + (d ? '  ' + d : '')) }

;(async () => {
  const browser = await chromium.launch({
    ...(process.env.MINITUDE_CHANNEL ? { channel: process.env.MINITUDE_CHANNEL } : {}),
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
  })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  // every refusal the browser reports, from the page itself (a console message alone can be missed)
  await ctx.addInitScript(() => {
    window.__csp = []
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} blocked ${e.blockedURI || '(inline)'}`))
  })
  const page = await ctx.newPage()
  const consoleBad = []
  page.on('console', (m) => { if (/content security policy|refused to|violates the following/i.test(m.text())) consoleBad.push(m.text().slice(0, 200)) })
  page.on('pageerror', (e) => consoleBad.push('PAGEERROR ' + e.message))
  const violations = () => page.evaluate(() => window.__csp.slice())

  // ---- the headers themselves, as the browser got them
  const resp = await page.goto(BASE + '/?manual=1')
  const h = resp.headers()
  ok(/default-src 'self'/.test(h['content-security-policy'] || ''), 'the page comes with a Content-Security-Policy', (h['content-security-policy'] || '').slice(0, 70) + '...')
  ok(h['x-frame-options'] === 'DENY' && h['x-content-type-options'] === 'nosniff' && /camera=\(\)/.test(h['permissions-policy'] || ''), 'and the other security headers')
  ok(!h['access-control-allow-origin'], 'and the page is not open to other sites')
  await page.waitForFunction(() => window.__mt, null, { timeout: 60000 })
  ok((await violations()).length === 0, 'the title screen loads everything it needs', (await violations()).join(' | '))

  // ---- a question
  await page.evaluate(() => window.__mt.press('solo'))
  let s = await page.evaluate(() => window.__mt.state()), guard = 0
  while (!s.canType && s.phase === 'run' && guard++ < 3000) {
    if (s.rec && s.T >= s.rec.start + 0.4 && !s.q) await page.waitForTimeout(10); else await page.evaluate(() => window.__mt.advance(0.1, false))
    s = await page.evaluate(() => window.__mt.state())
  }
  ok(s.canType, 'a question appears')
  await page.evaluate(() => document.getElementById('answer').focus())
  await page.keyboard.type('hello', { delay: 5 })
  await page.evaluate(() => window.__mt.advance(0.3, true))
  ok((await page.evaluate(() => document.getElementById('answer').value)) === 'hello', 'typing works')
  ok((await violations()).length === 0, 'a question loads everything it needs (script, pictures, fonts, the API)', (await violations()).join(' | '))

  // ---- let every question time out until the report, which opens the page under it
  guard = 0
  while (s.phase !== 'report' && guard++ < 400) {
    await page.evaluate(() => window.__mt.advance(5, false))
    s = await page.evaluate(() => window.__mt.state())
  }
  ok(s.phase === 'report', 'the run reaches its report')
  await page.evaluate(() => window.__mt.advance(6, true))
  await page.waitForTimeout(400)
  const afterVisible = await page.evaluate(() => { const a = document.getElementById('after'); return !!a && !a.hidden && a.children.length > 0 })
  ok(afterVisible, 'the page under the report is there (logbook, rating, ideas, footer)')
  ok((await violations()).length === 0, 'the report and the page under it load everything they need', (await violations()).join(' | '))

  // ---- the gem cabinet, the lobby, the privacy page, the API called from the page
  await page.evaluate(() => { const b = document.getElementById('cabbtn'); if (b && !b.hidden) b.click() })
  await page.waitForTimeout(300)
  ok((await violations()).length === 0, 'the gem cabinet opens', (await violations()).join(' | '))
  const api = await page.evaluate(async () => { const r = await fetch('/api/health'); const g = await fetch('/api/gems'); return [r.status, g.status] })
  ok(api[0] === 200 && api[1] === 200, 'the page can call its own API', api.join(','))
  const beforeProbes = consoleBad.length // the two probes below are attacks on purpose: the browser's refusal of them is the right answer, not a complaint
  const foreign = await page.evaluate(async () => { try { await fetch('https://example.com/', { mode: 'no-cors' }); return 'sent' } catch (e) { return 'blocked' } })
  ok(foreign === 'blocked', 'the page cannot send anything to another site', foreign)
  const inline = await page.evaluate(() => { try { const s = document.createElement('script'); s.textContent = 'window.__ran = 1'; document.body.appendChild(s); return !!window.__ran } catch { return false } })
  ok(!inline, 'an injected inline script does not run', String(inline))
  await page.waitForTimeout(200)
  consoleBad.splice(beforeProbes)
  await page.evaluate(() => { window.__csp.length = 0 })

  const p2 = await ctx.newPage()
  p2.on('console', (m) => { if (/content security policy|refused to|violates the following/i.test(m.text())) consoleBad.push('privacy: ' + m.text().slice(0, 200)) })
  await p2.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} blocked ${e.blockedURI || '(inline)'}`)) })
  const pr = await p2.goto(BASE + '/privacy')
  await p2.waitForTimeout(800)
  const v2 = await p2.evaluate(() => window.__csp.slice())
  ok(pr.status() === 200 && v2.length === 0, 'the privacy page loads and nothing is refused', v2.join(' | '))
  ok(await p2.evaluate(() => /minitude/i.test(document.title) || document.body.innerText.length > 200), 'the privacy page has its text')

  ok(consoleBad.length === 0, 'the browser console reports no policy refusal and no page error', consoleBad.join(' | '))
  await browser.close()
  console.log(bad ? `${bad} PROBLEM(S)` : 'the policy lets the whole game work and blocks everything else')
  process.exit(bad ? 1 : 0)
})().catch((e) => { console.error('TEST FAILED', e); process.exit(1) })

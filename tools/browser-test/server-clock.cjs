// The game and the server's question clock:
//   1. the browser tells the server when each question appears (POST .../start)
//   2. if the server says "time is up" (code "late"), the game treats it as a time-out
//   3. if the start message is lost, the question (its prompt comes with that reply) waits and the game asks again
const { open, pick } = require('./lib.cjs')
;(async () => {
  const t = await open()
  const reqs = []
  t.page.on('request', (r) => { if (r.url().includes('/api/run/')) reqs.push(r.method() + ' ' + r.url().replace(/^.*\/api\/run\/[^/]+/, '') + ' ' + (r.postData() || '')) })
  let ok = true
  const check = (name, cond, extra = '') => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) ok = false }

  await t.adv(3.5)
  await t.page.evaluate(() => window.__mt.press())
  let s = await t.waitQuestion()
  await t.page.waitForTimeout(300)
  check('start message sent for question 1', reqs.some((r) => r.startsWith('POST /start') && r.includes('"index":0')), JSON.stringify(reqs))

  // 2. the server says late
  await t.page.route('**/api/run/*/answer', (route) => route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'Time is up for this question.', code: 'late' }) }))
  await t.page.evaluate((a) => window.__mt.answer(a), pick(s.q.id, 1))
  await t.page.waitForFunction(() => !window.__mt.state().pending)
  await t.adv(0.2)
  s = await t.state()
  check('a "late" reply from the server becomes a time-out', s.rec.miss === true, `miss=${s.rec.miss} total=${s.total}`)
  await t.page.unroute('**/api/run/*/answer')
  await t.page.waitForTimeout(200)
  check('the game also told the server about the miss', reqs.some((r) => r.startsWith('POST /miss')))

  // 3. the first start message of question 2 is lost. The prompt only comes with that reply, so nothing can be shown or typed until a
  //    later try works; the game keeps asking.
  await t.gotoT(s.rec.next - 0.01)
  let aborted = 0
  await t.page.route('**/api/run/*/start', (route) => { if (aborted++ === 0) route.abort(); else route.continue() })
  await t.adv(0.05)
  await t.adv(1.0)
  let mid = await t.state()
  check('while the start message is lost the question has no prompt and cannot be typed into', mid.rec.i === 1 && !mid.canType && !mid.q, `i=${mid.rec.i} canType=${mid.canType} q=${JSON.stringify(mid.q)}`)
  s = await t.waitQuestion()
  check('the game asks again and the prompt arrives', s.rec.i === 1 && !!s.q && s.canType && aborted >= 2, `aborted=${aborted}`)
  await t.page.evaluate((a) => window.__mt.answer(a), pick(s.q.id, 2))
  await t.page.waitForFunction(() => !window.__mt.state().pending)
  s = await t.state()
  check('the answer counted', s.rec.known && !s.rec.miss && s.total === 40, `total=${s.total} known=${s.rec.known}`)
  check('start was sent twice for question 2', reqs.filter((r) => r.startsWith('POST /start') && r.includes('"index":1')).length === 2)
  console.log(t.logs.join('\n') || 'no console errors')
  await t.browser.close()
  process.exit(ok ? 0 : 1)
})().catch((e) => { console.error(e); process.exit(1) })

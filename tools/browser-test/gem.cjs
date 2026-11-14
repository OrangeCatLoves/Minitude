// SINGULARITY gems: plays a run in which every answer is the question's gem, saves a frame at each stage of the reveal (the pull, the vacuum,
// the birth, the flight into the counter), the report and the cabinet, and checks the totals and the cabinet's storage.
//   node gem.cjs [tag] [how many gems, 1 to 7, default 7]
// Needs a server whose database has the gems (npm run cli -- gems import) and MINITUDE_URL pointing at it (see README.md). The 200 gems come
// from packages/server/data/gems.json. Answers real questions of that database: use a throw-away copy.
const fs = require('fs')
const path = require('path')
const { open } = require('./lib.cjs')

const gems = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'packages', 'server', 'data', 'gems.json'), 'utf8')).gems
const byQ = new Map(gems.map((g) => [g.question, g]))

;(async () => {
  const tag = process.argv[2] || 'gem'
  const n = Math.max(1, Math.min(7, Number(process.argv[3] || 7)))
  const t = await open()
  const { page } = t
  const fail = (m) => { throw new Error(m) }
  await t.adv(3.5)
  await page.evaluate(() => window.__mt.press())
  let expected = 0
  for (let i = 0; i < 7; i++) {
    let s = await t.waitQuestion()
    if (i >= n) { await t.adv(31); s = await t.state(); await t.gotoT(s.rec.next - 0.01); await t.adv(0.05); continue }   // the rest time out
    const g = byQ.get(s.q.id)
    if (!g) fail('no gem for ' + s.q.id)
    s = await t.answer(g.answer)
    const r = s.rec
    if (r.ti !== 6) fail(`question ${i + 1} (${s.q.id}): "${g.answer}" scored tier ${r.ti}, not a gem`)
    expected += 120
    const pull = r.rev - 1.4
    if (i === 0 || i === 3) {
      await t.shotAt(pull + 0.15, `${tag}${i}_1pull`)
      await t.shotAt(pull + 0.75, `${tag}${i}_2pull`)
      await t.shotAt(r.rev - 0.3, `${tag}${i}_3dark`)
      await t.shotAt(r.rev - 0.04, `${tag}${i}_4vacuum`)
      await t.shotAt(r.rev + 0.05, `${tag}${i}_5birth`)
      await t.shotAt(r.rev + 0.3, `${tag}${i}_6bloom`)
      await t.shotAt(r.rev + 1.2, `${tag}${i}_7title`)
      await t.shotAt(r.rev + 3.0, `${tag}${i}_8hold`)
      await t.shotAt(r.chg + 0.22, `${tag}${i}_9fly`)
      await t.shotAt(r.fe + 0.7, `${tag}${i}_10landed`)
    }
    await t.gotoT(r.next - 0.01); await t.adv(0.05)
    console.log(`question ${i + 1}: ${s.q.id} -> ${g.answer}: tier ${r.ti}, total ${(await t.state()).total}`)
  }
  let s = await t.state()
  while (s.phase !== 'report') { await t.adv(0.5); s = await t.state() }
  await t.adv(4)
  await t.shot(`${tag}_report`)
  const total = (await t.state()).total
  if (total !== expected) fail(`total ${total}, expected ${expected}`)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('minitude.gems') || '{"gems":[]}').gems.length)
  if (stored !== n) fail(`the cabinet holds ${stored} gems, expected ${n}`)
  // the cabinet
  const btn = page.locator('#cabbtn')
  await btn.waitFor({ state: 'visible', timeout: 5000 })
  console.log('button says:', (await btn.textContent()).replace(/\s+/g, ' '))
  await btn.click()
  await page.waitForSelector('#cabinet .cab-box')
  await page.waitForTimeout(400)
  const cabFont = await page.locator('#cabinet .cab-intro').evaluate((e) => ({ family: getComputedStyle(e).fontFamily, ok: false }))
  cabFont.ok = await page.evaluate(async () => { const f = await document.fonts.load('16px PixelifyFix'); return f.length > 0 && f.every((x) => x.status === 'loaded') })
  console.log('cabinet font:', cabFont.family, '| loaded:', cabFont.ok)
  if (!/PixelifyFix/.test(cabFont.family) || !cabFont.ok) fail('the cabinet is not using Pixelify Sans')
  await page.screenshot({ path: path.join(__dirname, 'out', `${tag}_cabinet.png`) })
  await page.locator('#cabinet .cab-slot:not(.locked)').first().click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: path.join(__dirname, 'out', `${tag}_cabinet_card.png`) })
  await page.keyboard.press('Escape')
  const closed = await page.evaluate(() => document.getElementById('cabinet').hidden)
  if (!closed) fail('Escape did not close the cabinet')
  const still = (await t.state()).phase
  if (still !== 'report') fail('Escape in the cabinet also left the report (phase ' + still + ')')
  console.log(`total ${total} points; ${stored} gems in the cabinet`)
  console.log(t.logs.join('\n') || 'no console errors')
  await t.browser.close()
})().catch((e) => { console.error('FAILED', e.message); process.exit(1) })

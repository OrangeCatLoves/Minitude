// A solo run's report: click an answer to see everything that counted (the owner asked for it on 18 Nov 2026, as on the Daily's report).
//   node solo-answers.cjs [tag]
// Plays a whole solo run with time-outs (quick), then opens question 1 and 3 from the report. Uses a throw-away database (see README.md) with the gems.
const path = require('path')
const { open } = require('./lib.cjs')

;(async () => {
  const tag = process.argv[2] || 'solo-ans'
  const t = await open()
  const { page } = t
  const fail = (m) => { throw new Error(m) }
  const shot = (name) => page.screenshot({ path: path.join(__dirname, 'out', `${tag}_${name}.png`) })
  const rowY = (i, extra) => (extra ? 394 : 378) + i * 34 - 8

  await t.adv(3.5)
  await page.evaluate(() => window.__mt.press('solo'))
  for (let i = 0; i < 7; i++) {
    let s = await t.waitQuestion()
    await t.adv(31)
    s = await t.state()
    await t.gotoT(s.rec.next - 0.01); await t.adv(0.05)
  }
  let s = await t.state()
  while (s.phase !== 'report') { await t.adv(0.5); s = await t.state() }
  await t.adv(4)
  console.log('solo run played: total', (await t.state()).total)
  const extra = await page.evaluate(() => !!window.__mt.game.reportData?.extraLine)

  await page.mouse.move(300, rowY(1, extra))
  await t.shot(`${tag}_report_hover`)
  for (const i of [0, 2]) {
    await page.mouse.click(300, rowY(i, extra))
    await page.waitForSelector('#answers .ans-box .ans-tiers', { timeout: 10000 })
    const head = await page.locator('#answers .ans-q').textContent()
    const rows = await page.locator('#answers .ans-tier').evaluateAll((els) => els.map((e) => ({ name: e.querySelector('.ans-tier-n').textContent, count: Number(e.querySelector('.ans-tier-c').textContent.replace(/,/g, '')) })))
    console.log(`row ${i + 1}: ${head} | ${rows.map((r) => `${r.name} ${r.count}`).join(', ')}`)
    if (rows.length !== 7) fail('expected 7 rarities, got ' + rows.length)
    if (i === 0) await shot('open')
    await page.keyboard.press('Escape')
    if (!(await page.evaluate(() => document.getElementById('answers').hidden))) fail('Esc did not close it')
  }
  // the number keys work too
  await page.keyboard.press('4')
  await page.waitForSelector('#answers .ans-box .ans-tiers', { timeout: 10000 })
  console.log('key 4 opened:', await page.locator('#answers .ans-q').textContent())
  await page.keyboard.press('Escape')
  console.log('ok')
  await t.close?.()
  process.exit(0)
})().catch((e) => { console.error(e); process.exit(1) })

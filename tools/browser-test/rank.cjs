// The rank statistic on the page under the end-of-run report: plays a solo run (a few gems, then time-outs), waits for the page, and checks that the
// logbook shows "rank" with the same numbers the server gives for that score.   node rank.cjs [tag] [gems 0-7, default 3]
// Needs a server whose database has the gems (npm run cli -- gems import); use a throw-away copy (the run is recorded and changes the ranking).
const fs = require('fs')
const path = require('path')
const { open, BASE } = require('./lib.cjs')

const gems = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'packages', 'server', 'data', 'gems.json'), 'utf8')).gems
const byQ = new Map(gems.map((g) => [g.question, g]))

;(async () => {
  const tag = process.argv[2] || 'rank'
  const n = Math.max(0, Math.min(7, Number(process.argv[3] ?? 3)))
  const t = await open()
  const { page } = t
  const fail = (m) => { throw new Error(m) }
  await t.adv(3.5)
  await page.evaluate(() => window.__mt.press('solo'))
  for (let i = 0; i < 7; i++) {
    let s = await t.waitQuestion()
    const g = byQ.get(s.q.id)
    if (i < n && g) await t.answer(g.answer)
    else await t.adv(31)
    s = await t.state()
    await t.gotoT(s.rec.next - 0.01); await t.adv(0.05)
  }
  let s = await t.state()
  while (s.phase !== 'report') { await t.adv(0.5); s = await t.state() }
  await t.adv(4)
  const points = (await t.state()).total
  // the page under the report opens once the report has settled
  await page.waitForSelector('#after:not([hidden]) .af-rank', { timeout: 15000 })
  const tile = await page.locator('#after .af-rank').evaluate((e) => ({ label: e.querySelector('dt').textContent, main: e.querySelectorAll('dd')[0].textContent, sub: e.querySelectorAll('dd')[1].textContent }))
  const api = await (await fetch(BASE + `/api/rank?points=${points}&mine=1`)).json()
  console.log(`score ${points}: the page says "${tile.main}" / "${tile.sub}"; the server says rank ${api.rank} of ${api.total}`)
  if (tile.label !== 'rank') fail('the tile is not labelled rank')
  const want = '#' + api.rank.toLocaleString('en-US')
  if (tile.main !== want) fail(`expected ${want}, the page shows ${tile.main}`)
  if (!tile.sub.includes(api.total.toLocaleString('en-US') + ' dive') && !/first dive|best of/.test(tile.sub)) fail('the line does not mention the number of dives: ' + tile.sub)
  // the four older statistics are still there, and the rank is one more
  const labels = await page.locator('#after .af-stat dt').allTextContents()
  console.log('statistics:', labels.join(', '))
  if (labels.length !== 5) fail('expected 5 statistics, found ' + labels.length)
  await page.locator('#after .af-stats').scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(__dirname, 'out', `${tag}_page.png`) })
  // a phone-sized screen
  await page.setViewportSize({ width: 390, height: 780 })
  await page.waitForTimeout(300)
  await page.locator('#after .af-stats').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(__dirname, 'out', `${tag}_page_phone.png`) })
  console.log(t.logs.filter((l) => !/Oscillator/.test(l)).join('\n') || 'no console errors')
  await t.browser.close()
  console.log('ok')
})().catch((e) => { console.error('FAILED', e.message); process.exit(1) })

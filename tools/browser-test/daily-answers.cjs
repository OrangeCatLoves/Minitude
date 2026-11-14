// The Daily's report: click an answer to see everything that counted for that question (counts by rarity, the names, a search, the gem).
//   node daily-answers.cjs [tag]
// Plays a whole Daily as a new guest (3 gems, then the time runs out on 4 questions), so it uses up that guest's attempt of the day: use a throw-away
// database (see README.md) and MINITUDE_URL for a server whose database has the gems (npm run cli -- gems import).
const fs = require('fs')
const path = require('path')
const { open } = require('./lib.cjs')

const gems = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'packages', 'server', 'data', 'gems.json'), 'utf8')).gems
const byQ = new Map(gems.map((g) => [g.question, g]))

;(async () => {
  const tag = process.argv[2] || 'ans'
  const t = await open()
  const { page } = t
  const fail = (m) => { throw new Error(m) }
  const shot = (name) => page.screenshot({ path: path.join(__dirname, 'out', `${tag}_${name}.png`) })
  const rowY = (i, extra) => (extra ? 394 : 378) + i * 34 - 8

  await t.adv(3.5)
  await page.evaluate(() => window.__mt.press('daily'))
  const own = []
  for (let i = 0; i < 7; i++) {
    let s = await t.waitQuestion()
    const g = byQ.get(s.q.id)
    if (i < 3 && g) { s = await t.answer(g.answer); own.push({ q: s.q.id, answer: g.answer }) }
    else { await t.adv(31); own.push({ q: s.q.id, answer: null }) }
    s = await t.state()
    await t.gotoT(s.rec.next - 0.01); await t.adv(0.05)
  }
  let s = await t.state()
  while (s.phase !== 'report') { await t.adv(0.5); s = await t.state() }
  await t.adv(4)
  const total = (await t.state()).total
  console.log('daily played: total', total, '| gems answered:', own.filter((o) => o.answer).length)
  const extra = await page.evaluate(() => !!window.__mt.game.reportData?.extraLine)

  // hover a row: the report shows that it opens
  await page.mouse.move(300, rowY(1, extra))
  await t.shot(`${tag}_report_hover`)

  // click the first answer: the screen opens with the counts
  await page.mouse.click(300, rowY(0, extra))
  await page.waitForSelector('#answers .ans-box .ans-tiers', { timeout: 10000 })
  const head = await page.locator('#answers .ans-q').textContent()
  const note = await page.locator('#answers .ans-note').first().textContent()
  const rows = await page.locator('#answers .ans-tier').evaluateAll((els) => els.map((e) => ({ name: e.querySelector('.ans-tier-n').textContent, count: Number(e.querySelector('.ans-tier-c').textContent.replace(/,/g, '')) })))
  const sum = rows.reduce((a, r) => a + r.count, 0)
  console.log('question:', head, '| rarities:', rows.map((r) => `${r.name} ${r.count}`).join(', '))
  if (rows.length !== 7) fail('expected 7 rarities, got ' + rows.length)
  const claimed = Number((note.match(/([\d,]+) answers were accepted/) || [])[1].replace(/,/g, ''))
  if (claimed !== sum) fail(`the note says ${claimed} but the rarities add up to ${sum}`)
  if (rows[6].count !== 1 || rows[6].name !== 'Singularity') fail('the gem row is wrong')
  const gemName = await page.locator('#answers .ans-gem-name').textContent()
  if (gemName.toLowerCase() !== own[0].answer.toLowerCase()) fail(`the gem shown is "${gemName}", the player's answer was "${own[0].answer}"`)
  if (!(await page.locator('#answers .ans-yours').count())) fail('the player\'s own rarity is not marked')
  const font = await page.locator('#answers .ans-q').evaluate((e) => ({ family: getComputedStyle(e).fontFamily, ok: false }))
  font.ok = await page.evaluate(async () => { const f = await document.fonts.load('600 23px PixelifyFix'); return f.length > 0 && f.every((x) => x.status === 'loaded') })
  console.log('panel font:', font.family, '| loaded:', font.ok)
  if (!/PixelifyFix/.test(font.family) || !font.ok) fail('the panel is not using Pixelify Sans')
  await shot('open')

  // open the biggest rarity: names appear, A to Z, with a "show more"
  const biggest = rows.slice(0, 6).reduce((a, r, i) => (r.count > rows[a].count ? i : a), 0)
  await page.locator('#answers .ans-tier-h').nth(biggest).click()
  await page.waitForSelector('#answers .ans-names li', { timeout: 10000 })
  const names = await page.locator('#answers .ans-names li .ans-n').allTextContents()
  console.log(`${rows[biggest].name}: ${names.length} names shown, first: ${names.slice(0, 3).join(' | ')}`)
  const sorted = [...names].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
  if (JSON.stringify(sorted) !== JSON.stringify(names)) fail('names are not A to Z')
  const wantMore = rows[biggest].count > 100
  if (wantMore) {
    await page.locator('#answers .ans-more').click()
    await page.waitForFunction((n) => document.querySelectorAll('#answers .ans-names li').length > n, names.length, { timeout: 10000 })
    console.log('SHOW MORE gave', await page.locator('#answers .ans-names li').count(), 'names')
  }
  await shot('list')

  // search: the gem is found and marked as the gem's rarity
  await page.locator('#answers .ans-search').fill(gemName.slice(0, Math.max(3, Math.floor(gemName.length / 2))))
  await page.waitForSelector('#answers .ans-found .ans-chip', { timeout: 10000 })
  const chips = await page.locator('#answers .ans-found .ans-chip').allTextContents()
  console.log('search results carry their rarity:', [...new Set(chips)].join(', '))
  if (!chips.includes('Singularity')) fail('the gem was not found by search')
  await shot('search')
  await page.locator('#answers .ans-search').fill('')
  await page.waitForSelector('#answers .ans-tiers')

  // Esc closes it and stays on the report
  await page.keyboard.press('Escape')
  if (!(await page.evaluate(() => document.getElementById('answers').hidden))) fail('Esc did not close it')
  if ((await t.state()).phase !== 'report') fail('Esc also left the report')

  // the number keys open a question; a question that timed out still shows its lists
  await page.keyboard.press('5')
  await page.waitForSelector('#answers .ans-box .ans-tiers', { timeout: 10000 })
  const msg = await page.locator('#answers .ans-own').textContent()
  console.log('question 5:', msg)
  if (!/time ran out/i.test(msg)) fail('a missed question should say the time ran out')
  await page.keyboard.press('Escape')

  // today's result opened again from the title screen also works
  await page.evaluate(() => window.__mt.game.home())
  await page.waitForFunction(() => window.__mt.state().phase === 'title' && window.__mt.state().daily && window.__mt.state().daily.status === 'done', null, { timeout: 15000 })
  await page.evaluate(() => window.__mt.showResult())
  await t.adv(5)
  const extra2 = await page.evaluate(() => !!window.__mt.game.reportData?.extraLine)
  await page.mouse.click(300, rowY(2, extra2))
  await page.waitForSelector('#answers .ans-box .ans-tiers', { timeout: 10000 })
  console.log('today\'s result: the row opens it too')
  await page.keyboard.press('Escape')

  // a solo report has no such rows
  await page.evaluate(() => window.__mt.game.home())
  await t.adv(1)
  console.log(t.logs.filter((l) => !/Oscillator/.test(l)).join('\n') || 'no console errors')
  await t.browser.close()
  console.log('ok')
})().catch((e) => { console.error('FAILED', e.message); process.exit(1) })

// Achievements: plays real answers (a Common one, a Rare one) and checks that the right banners drop in, one after the other, at the top under the
// progress squares; then fills the gem cabinet and checks the quiet backfill, a gem banner, and the cabinet's ACHIEVEMENTS tab. Takes pictures into out/.
//   MINITUDE_URL=http://127.0.0.1:8792 MINITUDE_CHANNEL=chrome node achievements.cjs
// Needs a server on a throw-away database (the seed bank is enough: see the recipe in docs/MULTIPLAYER.md) serving the built game.
const fs = require('fs')
const path = require('path')
const { open, pick, bank, OUT } = require('./lib.cjs')

;(async () => {
  const t = await open()
  const { page, logs } = t
  const fail = (m) => { throw new Error(m) }
  const ok = (c, m) => { if (!c) fail(m); console.log('  ok  ' + m) }
  const shotPage = async (name) => { await page.evaluate(() => window.__mt.draw()); return page.screenshot({ path: path.join(OUT, name + '.png') }) }
  const stored = () => page.evaluate(() => { try { return JSON.parse(localStorage.getItem('minitude.achievements') || '{}') } catch { return {} } })
  const banner = () => page.evaluate(() => { const b = document.getElementById('ach-banner'); return b && !b.hidden ? { cls: b.className, name: b.querySelector('.ach-nm')?.textContent, lab: b.querySelector('.ach-lab')?.textContent, chip: b.querySelector('.ach-chip')?.textContent, box: (({ x, y, width, height }) => ({ x, y, width, height }))(b.getBoundingClientRect()) } : null })

  // a clean start: no gems, nothing earned but Quick Draw (this script answers at once, which would earn it: tested in core)
  await page.evaluate(() => { localStorage.setItem('minitude.achievements', JSON.stringify({ earned: { 'quick-draw': '' } })); localStorage.removeItem('minitude.gems'); localStorage.removeItem('minitude.logbook') })
  await page.reload()
  await page.waitForFunction(() => window.__mt, null, { timeout: 60000 })
  await t.adv(3.5)
  ok(!(await banner()), 'no banner on the title screen')
  ok((await page.evaluate(() => !!window.__mt.game.achievements)), 'the achievements are wired into the game')

  // ---- a real run: question 1 answered with a Common answer
  await page.evaluate(() => window.__mt.press())
  let s = await t.waitQuestion()
  const q1 = s.q.id
  if (!bank.questions.find((x) => x.id === q1)) fail('question ' + q1 + ' is not in the seed bank: use a database seeded from it')
  s = await t.answer(pick(q1, 0))
  ok(s.rec && s.rec.ti === 0, 'the first answer scored Common')
  ok(Object.keys((await stored()).earned || {}).filter((id) => id !== 'quick-draw').join() === 'first-common', 'Down to Earth is stored right away: ' + JSON.stringify(await stored()))
  ok(!(await banner()), 'but the banner waits for the answer\'s own show (nothing yet at the start of the roll)')
  await t.gotoT((s.rec.cardOn ? s.rec.card + s.rec.clen : s.rec.fe) + 0.4)
  await page.waitForTimeout(500)
  let b = await banner()
  ok(b && b.name === 'Down to Earth' && /COMMON/.test(b.lab) && b.chip === '×1', 'the banner "Down to Earth" (ACHIEVEMENT · COMMON, ×1) drops in after the dive: ' + JSON.stringify(b))
  ok(b.box.y >= 30 && b.box.y <= 120, 'it sits just below the progress squares (top ' + Math.round(b.box.y) + ' px)')
  await shotPage('ach_banner_common')
  await page.waitForTimeout(4300)
  ok(!(await banner()), 'and slides away again by itself')

  // ---- question 2: a Rare answer gives its own banner
  await t.gotoT(s.rec.next + 0.05)
  s = await t.waitQuestion()
  const q2 = s.q.id
  s = await t.answer(pick(q2, 2))
  ok(s.rec && s.rec.ti === 2, 'the second answer scored Rare')
  await t.gotoT((s.rec.cardOn ? s.rec.card + s.rec.clen : s.rec.fe) + 0.4)
  await page.waitForTimeout(500)
  b = await banner()
  ok(b && b.name === 'Rare Find' && /RARE/.test(b.lab), 'the banner "Rare Find" drops in: ' + JSON.stringify(b))
  await shotPage('ach_banner_rare')
  await page.waitForTimeout(4300)

  // a second Rare answer earns nothing new
  await t.gotoT(s.rec.next + 0.05)
  s = await t.waitQuestion()
  s = await t.answer(pick(s.q.id, 2))
  const before = Object.keys((await stored()).earned).length
  await t.gotoT((s.rec.cardOn ? s.rec.card + s.rec.clen : s.rec.fe) + 0.4)
  await page.waitForTimeout(500)
  ok(!(await banner()), 'a second Rare answer shows no banner')
  ok(Object.keys((await stored()).earned).length === before && before === 3, 'and stores nothing new (Common, Rare, and the Quick Draw set at the start)')

  // ---- the cabinet: twelve gems found earlier are noticed quietly
  await page.evaluate(() => {
    const g = window.__mt.game
    for (let i = 0; i < 12; i++) g.cabinet.add({ id: 'fake-' + i, category: ['Animals and Nature', 'Food', 'Games'][i % 3], prompt: 'Name a thing ' + i + '?', answer: 'Gem number ' + i, desc: 'A made-up gem for a test.', day: '2026-11-' + String(8 + i).padStart(2, '0') })
    g.achievements.sync(g.cabinet.gemDays, null)
  })
  let st = await stored()
  ok(['first-singularity', 'gems-5', 'gems-10'].every((id) => id in st.earned), 'twelve gems in the cabinet quietly earn Singularity, Pocketful and Collector: ' + Object.keys(st.earned).join())
  ok(st.earned['gems-5'] === '2026-11-12' && st.earned['first-singularity'] === '2026-11-08', 'each is dated by the gem that reached it')
  ok(!('gems-all' in st.earned), '"every gem" is not earned while the total is not known')
  ok(!(await banner()), 'and nothing is announced for a quiet backfill')

  // ---- a live gem: the 13th gem found at tier 6 reaches nothing new; a fresh player's first gem announces two things in order
  await page.evaluate(() => { const g = window.__mt.game; g.achievements.onScored(2, 13, 1000, 0); g.achievements.onScored(6, 13, 1000, 0) })
  await t.adv(0.1)
  await page.waitForTimeout(500)
  ok(!(await banner()), 'a gem that reaches no new step shows nothing')
  await page.evaluate(() => { const g = window.__mt.game; localStorage.removeItem('minitude.achievements'); g.achievements.state = { earned: {} }; g.achievements.onScored(6, 25, 1000, 0) })
  await t.adv(0.1)
  await page.waitForTimeout(500)
  b = await banner()
  ok(b && b.name === 'Singularity' && /SINGULARITY/.test(b.lab), 'the first gem shows "Singularity" first: ' + JSON.stringify(b))
  await shotPage('ach_banner_gem')
  await page.waitForTimeout(4300)
  await t.adv(0.1)
  await page.waitForTimeout(400)
  b = await banner()
  ok(b && b.name === 'Pocketful', 'then the next one in the queue, "Pocketful": ' + JSON.stringify(b))
  await page.waitForTimeout(4300)
  await t.adv(0.1)
  await page.waitForTimeout(400)
  ok((await banner())?.name === 'Collector', 'then "Collector"')
  await page.waitForTimeout(4300)
  await t.adv(0.1)
  await page.waitForTimeout(400)
  ok((await banner())?.name === 'Curator', 'and "Curator" (25 gems reached in one go)')
  await page.waitForTimeout(4300)

  // ---- a run ends (22 Nov 2026: the dive, how it went, the Daily): the banners come in order, the dive first
  await page.evaluate(() => { const g = window.__mt.game; g.achievements.onRunEnd({ mode: 'daily', total: 700, tiers: [5, 5, 5, 5, 5, 5, 5], won: false }, 0) })
  await t.adv(0.1)
  await page.waitForTimeout(500)
  b = await banner()
  ok(b && b.name === 'Uncharted' && /THE DIVE/.test(b.lab), 'a run of 700 shows "Uncharted" first (ACHIEVEMENT · THE DIVE): ' + JSON.stringify(b))
  await shotPage('ach_banner_dive')
  st = await stored()
  ok(['uncharted', 'planck', 'clean', 'no-easy', 'daily-debut'].every((id) => id in st.earned) && !('so-close' in st.earned), 'and stores Uncharted, The Edge of Physics, Beat the Clock, No Easy Answers and Daily Debut')
  await page.evaluate(() => { window.__mt.game.achievements.queue = [] })
  await page.waitForTimeout(4300)
  // a match won: the count of wins is kept
  await page.evaluate(() => { window.__mt.game.achievements.onRunEnd({ mode: 'versus', total: 100, tiers: [0, 0, null, 0, 0, 0, 0], won: true }, 0); window.__mt.game.achievements.queue = [] })
  st = await stored()
  ok(st.wins === 1 && 'room-champion' in st.earned && 'face-to-face' in st.earned, 'a match won stores Face to Face, Room Champion and one win')

  // ---- the cabinet's second tab
  await page.evaluate(() => { window.__mt.game.cabinet.open() })
  await page.waitForSelector('#cabinet .cab-tab')
  const tabs = await page.$$eval('#cabinet .cab-tab', (els) => els.map((e) => e.textContent))
  ok(tabs.length === 2 && /GEMS/.test(tabs[0]) && /ACHIEVEMENTS/.test(tabs[1]), 'the cabinet has two tabs: ' + tabs.join(' | '))
  await page.click('#cabinet .cab-tab:nth-child(2)')
  await page.waitForSelector('#cabinet .ach-item')
  const items = await page.$$eval('#cabinet .ach-item', (els) => els.map((e) => ({ name: e.querySelector('.ach-name')?.textContent, locked: e.classList.contains('locked'), grand: e.classList.contains('grand'), date: e.querySelector('.ach-date')?.textContent })))
  ok(items.length === 45, 'the tab lists all forty-five achievements, locked ones with their text')
  ok(items.find((i) => i.name === 'Reigning Champion')?.date === '1 / 10 wins', 'Reigning Champion shows its progress in wins')
  ok(items.find((i) => i.name === 'Singularity Complete')?.grand === true, '"Singularity Complete" has the large card')
  ok(items.find((i) => i.name === 'Five Hundred Strong') && items.find((i) => i.name === 'Down to Earth'), 'the new names are on the list')
  const curator = items.find((i) => i.name === 'Curator')
  ok(curator && /25 \/ 25|12 \/ 25|Earned/.test(curator.date), 'progress or the earned day shows on a gem step: ' + JSON.stringify(curator))
  await shotPage('ach_cabinet_tab')
  await page.evaluate(() => { document.querySelector('#cabinet').scrollTo(0, 99999) })
  await shotPage('ach_cabinet_tab_bottom')
  // every one earned, to look at all forty-five pictures
  await page.evaluate(() => {
    const g = window.__mt.game, ids = [...document.querySelectorAll('#cabinet .ach-item')].length
    const all = {}
    for (const a of window.__mt.achievementIds) all[a] = '2026-11-22'
    g.achievements.state = { earned: all }
    g.cabinet.render()
    return ids
  })
  await page.evaluate(() => { document.querySelector('#cabinet').scrollTo(0, 0) })
  await shotPage('ach_cabinet_all_1')
  for (let k = 1; k <= 4; k++) {
    await page.evaluate((k) => { const c = document.querySelector('#cabinet'); c.scrollTo(0, k * c.clientHeight * 0.85) }, k)
    await shotPage('ach_cabinet_all_' + (k + 1))
  }
  await page.click('#cabinet .cab-tab:nth-child(1)')
  ok(await page.$('#cabinet .cab-cat'), 'the first tab still shows the gems by category')
  await page.keyboard.press('Escape')

  const bad = logs.filter((l) => !/favicon|404|Failed to load resource|GPU stall due to ReadPixels/.test(l))
  ok(bad.length === 0, 'no page errors' + (bad.length ? ': ' + bad.join(' | ') : ''))
  await t.browser.close()
  console.log('achievements: all checks passed')
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })

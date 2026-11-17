// Takes real game frames (1280 x 720) to put the draft banners over: the title, a question, and the card after a Rare and after a Common answer.
//   needs the game running (npm run dev, on a THROW-AWAY copy of the database: DATABASE_FILE=<copy> npm run dev), then
//   MINITUDE_CHANNEL=chrome DB=<the same copy> node context-shots.cjs
const path = require('path')
const { open } = require('../../../tools/browser-test/lib.cjs')
const Database = require('../../../packages/server/node_modules/better-sqlite3')
const OUT = path.join(__dirname, '..', 'context')
const db = new Database(process.env.DB, { readonly: true })
;(async () => {
  const t = await open()
  const { page } = t
  const snap = async (name) => { await page.evaluate(() => window.__mt.draw()); await page.locator('#game').screenshot({ path: path.join(OUT, name + '.png') }); console.log('saved', name) }
  await t.adv(4)
  await snap('title')
  await page.evaluate(() => window.__mt.press())
  let s = await t.waitQuestion()
  await t.adv(0.6)
  await snap('question')
  const pickTier = (qid, tier) => db.prepare('select name from answers where question_id = ? and tier = ? order by length(name) limit 1 offset 2').get(qid, tier)?.name
  // a Rare answer: the card shows its rarity, the stamp and the new size
  const rare = pickTier(s.q.id, 2)
  s = await t.answer(rare)
  console.log('answered', JSON.stringify(rare), 'tier', s.rec && s.rec.ti)
  const base = s.rec.rev ?? s.rec.start
  for (const [name, dt] of [['reveal-a', 0.6], ['reveal-b', 1.2], ['reveal-c', 2.0]]) { await t.gotoT(base + dt); await snap(name) }
  await t.browser.close()
})().catch((e) => { console.error(e); process.exit(1) })

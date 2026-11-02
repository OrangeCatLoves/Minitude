// One frame per stage of the reveal for each tier:  node reveals.cjs <tag> <tiers>   e.g. node reveals.cjs v 0,1,2,3,4,5
const { open, pick } = require('./lib.cjs')
;(async () => {
  const tag = process.argv[2] || 'v'
  const tiers = (process.argv[3] || '0,1,2,3,4').split(',').map(Number)
  const t = await open()
  await t.adv(3.5); await t.page.evaluate(() => window.__mt.press())
  for (let i = 0; i < tiers.length; i++) {
    let s = await t.waitQuestion()
    s = await t.answer(pick(s.q.id, tiers[i]))
    const r = s.rec
    await t.shotAt(r.rev + 0.12, `${tag}${i}_a`)
    await t.shotAt(r.rev + 0.5, `${tag}${i}_b`)
    await t.shotAt(r.chg + 0.25, `${tag}${i}_c`)
    await t.shotAt(r.fe + 0.6, `${tag}${i}_d`)
    await t.gotoT(r.next - 0.01); await t.adv(0.05)
  }
  console.log(t.logs.join('\n') || 'no console errors')
  await t.browser.close()
})().catch((e) => { console.error(e); process.exit(1) })

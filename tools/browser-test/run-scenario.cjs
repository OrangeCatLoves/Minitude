// Plays a scripted run and saves screenshots of each question's key moments.
//   node run-scenario.cjs <tag> <steps> [skip]
// steps: comma list, one per question: a tier digit 0-5 (answer of that tier), b (a wrong answer first, then tier 1), m (let the time run out)
//   node run-scenario.cjs perfect 5,5,5,5,5,5,5
//   node run-scenario.cjs h 5,5,5,5,0,0,0 skip      (edging hints; "skip" taps the world cards away)
//   node run-scenario.cjs x b,m,2,m,3,1,0
const { open, pick } = require('./lib.cjs')
;(async () => {
  const tag = process.argv[2] || 's'
  const steps = (process.argv[3] || '5,5,5,5,5,5,5').split(',')
  const skip = process.argv[4] === 'skip'
  const t = await open()
  await t.adv(3.5)
  await t.page.evaluate(() => window.__mt.press())
  for (let i = 0; i < 7; i++) {
    let s = await t.waitQuestion()
    if (s.phase !== 'run') break
    const st = steps[i] ?? '0'
    await t.shot(`${tag}${i}_ask`)
    if (st === 'm') {
      await t.adv(10); await t.shot(`${tag}${i}_t10`)
      await t.adv(21.5); await t.shot(`${tag}${i}_t30`)
      while (s.rec.i === i && !s.rec.miss) { await t.adv(0.1); s = await t.state() }
      await t.adv(0.3); await t.shot(`${tag}${i}_timeup`)
      console.log(`Q${i + 1}: time ran out`)
      await t.adv(1.5)
      continue
    }
    if (st === 'b') {
      s = await t.answer('qwertyuiop')
      await t.adv(0.3); await t.shot(`${tag}${i}_wrong`)
      console.log(`Q${i + 1}: wrong answer ->`, s.message)
    }
    const tier = st === 'b' ? 1 : Number(st)
    const ans = pick(s.q.id, tier)
    s = await t.answer(ans)
    const r = s.rec
    if (!r.known) { console.log('answer not accepted:', s.message); break }
    console.log(`Q${i + 1}: ${ans} (tier ${tier}) total=${s.total} dz=${r.dz} finale=${r.fin} card=${r.cardOn}`)
    await t.shotAt(r.val + 0.1, `${tag}${i}_valid`)
    await t.shotAt(r.roll + 0.8, `${tag}${i}_roll`)
    await t.shotAt(r.rev + 0.25, `${tag}${i}_reveal`)
    await t.shotAt(r.chg + 0.4, `${tag}${i}_charge`)
    await t.shotAt((r.fs + r.fe) / 2, `${tag}${i}_dive`)   // no dive for a Common answer inside the same world
    await t.shotAt(r.fe + 1.6, `${tag}${i}_landed`)
    if (r.cardOn) {
      await t.gotoT(r.card + 2.0)
      if (skip) { await t.page.evaluate(() => window.__mt.skip()); await t.adv(0.4); await t.shot(`${tag}${i}_card_skipped`) }
      else await t.shot(`${tag}${i}_card`)
    }
    s = await t.state()
    await t.gotoT(s.rec.next - 0.01); await t.adv(0.05)
  }
  const s = await t.state()
  console.log('end:', s.phase, 'points', s.total)
  await t.adv(4.5); await t.shot(`${tag}_report`)
  console.log(t.logs.join('\n') || 'no console errors')
  await t.browser.close()
})().catch((e) => { console.error(e); process.exit(1) })

// The Daily Challenge in a real browser: title, one attempt, the report with the ranking, coming back later, leaving mid-run.
//   node daily.cjs
// Needs the dev servers on a database where today's daily has not been played (a new guest is made for every browser, so only the
// number of daily runs per day matters). Uses the demo checker's seed bank to pick answers of a wanted tier.
const { open, pick } = require('./lib.cjs')

const fails = []
const check = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) fails.push(what) }

async function playDaily(t, steps) {
  await t.page.evaluate(() => window.__mt.press('daily'))
  const prompts = []
  for (let i = 0; i < 7; i++) {
    let s = await t.waitQuestion()
    if (s.phase !== 'run') break
    prompts.push(s.q.prompt)
    if (i === 0) await t.shot('daily_q1')
    const st = steps[i]
    if (st === 'm') {
      await t.adv(31)
      while (s.rec.i === i && !s.rec.miss) { await t.adv(0.1); s = await t.state() }
      await t.adv(1.8)
      continue
    }
    s = await t.answer(pick(s.q.id, Number(st)))
    if (!s.rec.known) { console.log('answer not accepted:', s.message); break }
    await t.gotoT(s.rec.next - 0.01); await t.adv(0.05)
  }
  return prompts
}

;(async () => {
  // ---- guest A: the title, the whole run, the report
  const a = await open()
  await a.page.waitForFunction(() => window.__mt.state().daily || window.__mt.state().dailyFailed, null, { timeout: 20000 })
  let s = await a.state()
  check(s.daily && s.daily.status === 'new', 'a new guest sees a new daily')
  await a.adv(3.5)
  s = await a.state()
  check(s.title.primary === 'PLAY DAILY' && s.title.secondary === 'SOLO RUN', 'title offers PLAY DAILY and SOLO RUN')
  await a.shot('daily_title')

  const steps = ['1', '3', 'm', '2', '0', '4', '5']
  const promptsA = await playDaily(a, steps)
  check(promptsA.length === 7 && new Set(promptsA).size === 7, 'seven different prompts arrived, one at a time')
  s = await a.state()
  check(s.phase === 'report', 'the run ends on the report')
  await a.page.waitForFunction(() => window.__mt.state().reportDaily, null, { timeout: 20000 })
  await a.adv(5)
  s = await a.state()
  const expected = 20 + 60 + 0 + 40 + 10 + 80 + 100
  check(s.total === expected, `total is ${expected} (got ${s.total})`)
  check(s.reportDaily.standings.players === 1 && s.reportDaily.standings.rank === 1, 'the report knows the ranking')
  await a.shot('daily_report')

  // ---- coming back: the result, not another attempt
  await a.reopen()
  s = await a.state()
  check(s.daily.status === 'done' && s.daily.total === expected, 'after a reload the daily is done with the same total')
  await a.adv(3.5)
  s = await a.state()
  check(s.title.primary === "TODAY'S RESULT" && /NEXT DAILY IN \d\d:\d\d:\d\d/.test(s.title.line), "title says TODAY'S RESULT and counts down")
  await a.shot('daily_title_done')
  await a.page.evaluate(() => window.__mt.pressPrimary())
  await a.adv(5)
  s = await a.state()
  check(s.phase === 'report' && s.total === expected, 'the stored result opens the report with the same total')
  await a.shot('daily_result_view')
  // a solo run is still possible after the daily
  await a.reopen()
  await a.adv(3.5)
  await a.page.evaluate(() => window.__mt.press('solo'))
  s = await a.waitQuestion()
  check(s.phase === 'run' && s.mode === 'solo' && !!s.q, 'solo run works after the daily')
  console.log('guest A console:', a.logs.join('\n') || 'no errors')
  check(a.logs.length === 0, 'no console errors for guest A')
  await a.browser.close()

  // ---- guest B: the same questions, in the same order; then leaving in the middle ends the run
  const b = await open()
  await b.page.waitForFunction(() => window.__mt.state().daily || window.__mt.state().dailyFailed, null, { timeout: 20000 })
  await b.adv(3.5)
  const promptsB = []
  await b.page.evaluate(() => window.__mt.press('daily'))
  let sb = await b.waitQuestion()
  promptsB.push(sb.q.prompt)
  check(promptsB[0] === promptsA[0], 'another guest gets the same first question')
  sb = await b.answer(pick(sb.q.id, 2))
  await b.gotoT(sb.rec.next - 0.01); await b.adv(0.05)
  sb = await b.waitQuestion()
  check(sb.q.prompt === promptsA[1], 'and the same second question')
  await b.reopen()              // reload in the middle of question 2
  let sb2 = await b.state()
  for (let k = 0; k < 20 && sb2.daily.status !== 'done'; k++) { await b.page.waitForTimeout(250); await b.page.evaluate(() => window.__mt.loadDaily()); sb2 = await b.state() }
  check(sb2.daily.status === 'done', 'reloading in the middle of a daily run ends it')
  check(sb2.daily.total === 40, `what was answered counts, the rest is 0 (got ${sb2.daily.total})`)
  await b.page.evaluate(() => window.__mt.pressPrimary())
  await b.adv(5)
  await b.shot('daily_abandoned_result')
  console.log('guest B console:', b.logs.join('\n') || 'no errors')
  await b.browser.close()

  console.log(fails.length ? `\n${fails.length} check(s) FAILED` : '\nall daily checks passed')
  process.exit(fails.length ? 1 : 0)
})().catch((e) => { console.error(e); process.exit(1) })

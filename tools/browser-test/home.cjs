// The HOME button on the report: after a solo run, after the Daily, from "today's result" (opened from the title), and with Esc.
// Needs `npm run dev`. Answers nothing: every question is left to time out. Plays today's Daily for a new guest (see daily.cjs).
const { open } = require('./lib.cjs')

;(async () => {
  const { browser, page, adv, state } = await open()
  const fails = []
  const check = (ok, what) => { console.log((ok ? 'ok     ' : 'BROKEN ') + what); if (!ok) fails.push(what) }
  const waitDaily = () => page.waitForFunction(() => window.__mt.state().daily || window.__mt.state().dailyFailed, null, { timeout: 20000 })
  /** leave every question to time out until the report is showing, and its buttons are on screen */
  const playOut = async () => {
    for (let guard = 0; guard < 30; guard++) {
      let s = await state()
      if (s.phase === 'report') break
      for (let k = 0; k < 600; k++) {
        s = await state()
        if (s.canType || s.phase === 'report') break
        if (s.rec && s.T >= s.rec.start + 0.4 && !s.q) await page.waitForTimeout(25); else await adv(0.1)
      }
      if (s.phase === 'report') break
      await adv(31); await adv(0.3); s = await state()
      await adv(Math.max(0, s.rec.next - s.T) + 0.05)
    }
    const s = await state()
    await adv(Math.max(0, s.reportAt - s.T) + 4)
    return state()
  }
  const click = (b) => page.mouse.click(b.x + b.w / 2, b.y + b.h / 2)
  const HOME = { x: 476, y: 650, w: 170, h: 50 }, PRIMARY = { x: 490, y: 422, w: 300, h: 56 }, SECONDARY = { x: 540, y: 526, w: 200, h: 40 }

  await waitDaily()
  await click(SECONDARY)                                   // SOLO RUN
  let s = await playOut()
  check(s.phase === 'report', 'a solo run ends on the report')
  await click(HOME); await adv(2); await waitDaily(); s = await state()
  check(s.phase === 'title' && s.title.primary === 'PLAY DAILY', 'HOME after a solo run goes back to the title')

  await click(PRIMARY)                                     // PLAY DAILY
  s = await playOut()
  check(s.phase === 'report' && s.mode === 'daily', 'the daily ends on the report')
  await click(HOME); await adv(2)
  await page.waitForFunction(() => window.__mt.state().daily && window.__mt.state().daily.status === 'done', null, { timeout: 20000 })
  s = await state()
  check(s.phase === 'title' && s.title.primary === "TODAY'S RESULT", "HOME after the daily goes back to the title, which now offers TODAY'S RESULT")

  await click(PRIMARY); await adv(1); s = await state()
  await adv(Math.max(0, s.reportAt - s.T) + 4); s = await state()
  check(s.phase === 'report', "TODAY'S RESULT opens the report")
  await click(HOME); await adv(2); s = await state()
  check(s.phase === 'title', "HOME on today's result goes back to the title")

  await click(SECONDARY); s = await playOut()
  await page.keyboard.press('Escape'); await adv(1.5); s = await state()
  check(s.phase === 'title', 'Esc on the report also goes back to the title')

  await click(SECONDARY)
  for (let k = 0; k < 600; k++) { s = await state(); if (s.canType) break; if (s.rec && s.T >= s.rec.start + 0.4 && !s.q) await page.waitForTimeout(25); else await adv(0.1) }
  check(s.phase === 'run' && s.canType, 'a new run after HOME starts normally')

  await browser.close()
  if (fails.length) { console.error(`${fails.length} check(s) failed`); process.exit(1) }
  console.log('HOME works from every report')
})().catch((e) => { console.error('TEST FAILED', e.message); process.exit(1) })

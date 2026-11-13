// The page under the end-of-run report: the logbook, "how was that dive?", "got an idea for a question?" and the footer.
//   MINITUDE_URL=http://127.0.0.1:8799 MINITUDE_CHANNEL=chrome node afterword.cjs
// Needs a server with a built game (npm run build, then the server; a throw-away DATABASE_FILE is best: it plays a real Daily run and
// submits a rating and an idea). Answers nothing: every question is left to time out, so every run scores 0.
// For the footer to show all its links, build with VITE_CONTACT_EMAIL, VITE_BUSINESS_EMAIL and VITE_INSTAGRAM_URL set (any values).
const { open } = require('./lib.cjs')
const path = require('path')

;(async () => {
  const { browser, page, adv, state, logs } = await open()
  const fails = []
  const check = (ok, what) => { console.log((ok ? 'ok     ' : 'BROKEN ') + what); if (!ok) fails.push(what) }
  const OUT = path.join(__dirname, 'out')
  const waitDaily = () => page.waitForFunction(() => window.__mt.state().daily || window.__mt.state().dailyFailed, null, { timeout: 20000 })
  /** leave every question to time out until the report is on screen and has settled (its buttons are showing) */
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
  const BTN = { share: { x: 96, y: 650, w: 170, h: 50 }, again: { x: 286, y: 650, w: 170, h: 50 }, home: { x: 476, y: 650, w: 170, h: 50 } }
  const PRIMARY = { x: 490, y: 422, w: 300, h: 56 }, SECONDARY = { x: 540, y: 526, w: 200, h: 40 }
  const stats = () => page.evaluate(() => [...document.querySelectorAll('.af-stat dd')].map((e) => e.textContent))
  const afterOpen = () => page.evaluate(() => !document.getElementById('after').hidden)
  const canScroll = () => page.evaluate(() => document.scrollingElement.scrollHeight > window.innerHeight + 50)
  const note = (i) => page.evaluate((i) => document.querySelectorAll('.af-note')[i].textContent, i)

  await waitDaily()
  await click(SECONDARY)                                           // SOLO RUN
  let s = await state()
  check(!(await afterOpen()) && !(await canScroll()), 'while a run is being played there is nothing to scroll to')

  s = await playOut()
  check(s.phase === 'report', 'the run ends on the report')
  check(await afterOpen(), 'the page under the report opens once the report has settled')
  check(await page.evaluate(() => document.documentElement.classList.contains('has-after')), 'the page can scroll now')
  check(await canScroll(), 'there is more page than screen: the player has to scroll down to see it')
  check(JSON.stringify(await stats()) === JSON.stringify(['1', '1', '0', '0']), 'the logbook after the first run: streak 1, played 1, avg 0, best 0 (' + (await stats()).join(' / ') + ')')

  // the sheet slides up over the game as the page scrolls
  await page.evaluate(() => window.scrollTo(0, 360))
  await page.waitForTimeout(150)
  await page.screenshot({ path: path.join(OUT, 'afterword-scrolling.png') })
  await page.evaluate(() => window.scrollTo(0, 100000))
  await page.waitForTimeout(150)
  await page.screenshot({ path: path.join(OUT, 'afterword-desktop.png') })
  const heads = await page.evaluate(() => [...document.querySelectorAll('#after .af-h')].map((e) => e.textContent))
  check(JSON.stringify(heads) === JSON.stringify(['logbook', 'how was that dive?', 'got an idea for a question?']), 'the three sections are there, in order: ' + heads.join(' | '))
  const foot = await page.evaluate(() => document.querySelector('#after .site-foot').innerText.replace(/\s+/g, ' '))
  check(/privacy/.test(foot) && /© 2026 Minitude/.test(foot), 'the footer has the privacy link and the copyright line: ' + foot)
  const privacyLink = await page.evaluate(() => { const a = [...document.querySelectorAll('#after .site-foot a')].find((x) => x.textContent === 'privacy'); return a ? [a.getAttribute('href'), a.target, a.rel] : null })
  check(privacyLink && privacyLink[0] === '/privacy' && privacyLink[1] === '_blank' && /noopener/.test(privacyLink[2]), 'the privacy link opens the privacy page in a new tab, safely')

  // "how was that dive?"
  await page.locator('.af-rate-btn').nth(3).click()
  await page.waitForFunction(() => document.querySelectorAll('.af-note')[0].textContent === 'thanks!', null, { timeout: 8000 })
  check((await page.locator('.af-rate-btn').nth(3).getAttribute('aria-pressed')) === 'true', 'tapping 4 marks 4 and says thanks')
  await page.locator('.af-rate-btn').nth(4).click()
  await page.waitForFunction(() => document.querySelectorAll('.af-rate-btn')[4].getAttribute('aria-pressed') === 'true' && !document.querySelectorAll('.af-rate-btn')[4].disabled, null, { timeout: 8000 })
  check((await page.locator('.af-rate-btn').nth(3).getAttribute('aria-pressed')) === 'false', 'tapping 5 afterwards changes the rating instead of adding a second one')

  // "got an idea for a question?": typing keys that mean something to the game must stay in the box
  await page.locator('#af-idea-text').click()
  await page.keyboard.type('hm name a type of cloud')
  s = await state()
  check(s.phase === 'report', 'typing an "h" and an "m" in the idea box does not send the game home')
  check((await page.locator('#mute').innerText()) === 'SOUND ON', 'and does not switch the sound off')
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => /thanks/.test(document.querySelectorAll('.af-note')[1].textContent), null, { timeout: 8000 })
  s = await state()
  check(s.phase === 'report', 'Enter in the idea box sends the idea, it does not start a new run')
  check((await page.inputValue('#af-idea-text')) === '', 'the box is empty again after sending')
  await page.locator('#af-idea-text').fill('hi')
  await page.keyboard.press('Enter')
  check(/little more/.test(await note(1)), 'an idea that is too short is not sent: it asks for more (' + (await note(1)) + ')')
  await page.locator('#af-idea-text').fill('see https://spam.example now')
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => /link/.test(document.querySelectorAll('.af-note')[1].textContent), null, { timeout: 8000 })
  check(/link/.test(await note(1)), 'an idea with a link is turned down in a friendly way (' + (await note(1)) + ')')

  // a swipe that starts on a button must not press it; a tap must
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(100)
  await page.mouse.move(BTN.again.x + 85, BTN.again.y + 25)
  await page.mouse.down(); await page.mouse.move(BTN.again.x + 85, BTN.again.y - 90, { steps: 6 }); await page.mouse.up()
  s = await state()
  check(s.phase === 'report', 'dragging from PLAY AGAIN (a swipe) does not press it')
  await click(BTN.home); await adv(2); await waitDaily(); s = await state()
  check(s.phase === 'title', 'a tap on HOME still works')
  check(!(await afterOpen()) && !(await canScroll()), 'back on the title screen the page under the report is gone')
  check((await page.evaluate(() => window.scrollY)) === 0, 'and the page is back at the top')

  // a second run, then the Daily: the logbook counts each run once
  await click(SECONDARY); s = await playOut()
  check(JSON.stringify(await stats()) === JSON.stringify(['1', '2', '0', '0']), 'after a second run the same day: streak 1, played 2 (' + (await stats()).join(' / ') + ')')
  await click(BTN.home); await adv(2); await waitDaily()
  await click(PRIMARY); s = await playOut()                        // PLAY DAILY
  check(s.mode === 'daily' && JSON.stringify(await stats()) === JSON.stringify(['1', '3', '0', '0']), 'a Daily run counts too: played 3 (' + (await stats()).join(' / ') + ')')
  check(!(await page.locator('.af-rate-btn').first().isHidden()), 'a Daily run can be rated')
  await click(BTN.home); await adv(2)
  await page.waitForFunction(() => window.__mt.state().daily && window.__mt.state().daily.status === 'done', null, { timeout: 20000 })
  await click(PRIMARY); await adv(1); s = await state()            // TODAY'S RESULT
  await adv(Math.max(0, s.reportAt - s.T) + 4); s = await state()
  check(s.phase === 'report' && (await afterOpen()), "today's result, opened from the title, shows the page too")
  check(JSON.stringify(await stats()) === JSON.stringify(['1', '3', '0', '0']), 'but looking at it again does not count as another run (' + (await stats()).join(' / ') + ')')
  check(await page.evaluate(() => document.querySelector('.af-rate-btn').closest('section').hidden), 'and it offers no rating, because there is no new run to rate')
  await click(BTN.home); await adv(2)

  // the same on a phone
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(300)
  await waitDaily()
  await page.evaluate(() => window.__mt.press('solo'))
  s = await playOut()
  check(s.phase === 'report' && (await afterOpen()), 'on a phone the run ends and the page opens')
  await page.evaluate(() => window.scrollTo(0, 100000))
  await page.waitForTimeout(200)
  await page.screenshot({ path: path.join(OUT, 'afterword-phone.png') })
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'on a phone nothing is wider than the screen')

  // the one 400 is the server turning down the idea with a link, which this test sends on purpose
  const bad = logs.filter((l) => !/favicon|404/.test(l))
  const unexpected = bad.filter((l) => !/status of 400/.test(l))
  check(unexpected.length === 0 && bad.length <= 1, 'no unexpected errors in the browser console' + (unexpected.length ? ': ' + unexpected.join(' | ') : ''))
  await browser.close()
  console.log(fails.length ? `\n${fails.length} BROKEN` : '\nall fine')
  process.exit(fails.length ? 1 : 0)
})()

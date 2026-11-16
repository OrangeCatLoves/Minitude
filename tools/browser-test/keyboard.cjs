// The answer box must stay above a phone's on-screen keyboard (src/keyboard.ts, Game.stepKeyboard). Needs `npm run dev`.
//   node keyboard.cjs            (pictures go to out/keyboard-*.png)
// What it can and cannot show: headless Chromium has no on-screen keyboard, so this FAKES what a real one does to the page: it
// replaces window.visualViewport with an object whose height shrinks by the keyboard's height (that is the number a real browser
// reports), and draws a grey block where the keyboard would be so the pictures show what is covered. It proves the game raises the
// box above that line, lowers it again, ignores pinch-zoom, and that taps land on the raised buttons. It cannot prove how a real
// iPhone or Android browser reports the keyboard; only a real phone can confirm that.
const { chromium } = require('playwright')
const path = require('path')
const BASE = process.env.MINITUDE_URL || 'http://127.0.0.1:5173'
const OUT = path.join(__dirname, 'out')
require('fs').mkdirSync(OUT, { recursive: true })

// [name, width, height of the visible area, keyboard height, touch device?]
const PROFILES = [
  ['phone-landscape-844x390', 844, 390, 200, true],
  ['phone-landscape-small-667x300', 667, 300, 170, true],
  ['phone-portrait-390x664', 390, 664, 300, true],
  ['tablet-landscape-1024x700', 1024, 700, 330, true],
]

const FAKE_VISUAL_VIEWPORT = () => {
  const vv = new EventTarget()
  const st = { kb: 0, scale: 1 }
  Object.defineProperties(vv, {
    width: { get: () => innerWidth }, height: { get: () => innerHeight - st.kb }, offsetTop: { get: () => 0 }, offsetLeft: { get: () => 0 },
    pageTop: { get: () => 0 }, pageLeft: { get: () => 0 }, scale: { get: () => st.scale },
  })
  Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => vv })
  window.__setKeyboard = (kb) => {
    st.kb = kb
    vv.dispatchEvent(new Event('resize'))
    let d = document.getElementById('fakekb')
    if (!d) {
      d = document.createElement('div'); d.id = 'fakekb'
      d.style.cssText = 'position:fixed;left:0;right:0;bottom:0;background:#3a3f4a;color:#9aa3b5;font:14px monospace;display:grid;place-items:center;z-index:9999;pointer-events:none;border-top:2px solid #6b7384'
      document.body.appendChild(d)
    }
    d.style.height = kb + 'px'; d.style.display = kb ? 'grid' : 'none'; d.textContent = 'KEYBOARD (pretend) ' + kb + 'px'
  }
  window.__setZoom = (s) => { st.scale = s }
}

let bad = 0
const ok = (c, w, d = '') => { if (!c) bad++; console.log((c ? 'ok       ' : 'PROBLEM  ') + w + (d ? '  ' + d : '')) }

;(async () => {
  const browser = await chromium.launch({
    ...(process.env.MINITUDE_CHANNEL ? { channel: process.env.MINITUDE_CHANNEL } : {}),
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
  })
  for (const [name, w, h, kb, touch] of PROFILES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: touch, hasTouch: touch, deviceScaleFactor: 2 })
    await ctx.addInitScript(FAKE_VISUAL_VIEWPORT)
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(BASE + '/?manual=1')
    await page.waitForFunction(() => window.__mt, null, { timeout: 60000 })
    const state = () => page.evaluate(() => window.__mt.state())
    const adv = (s, d = true) => page.evaluate(([s, d]) => window.__mt.advance(s, d), [s, d])
    const rect = () => page.evaluate(() => { const r = document.getElementById('game').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, height: r.height, left: r.left, width: r.width } })
    const shot = (n) => page.screenshot({ path: path.join(OUT, `keyboard-${name}-${n}.png`) })

    // ---- the answer box
    await page.evaluate(() => window.__mt.press('solo'))
    let s = await state(), guard = 0
    while (!s.canType && s.phase === 'run' && guard++ < 3000) {
      if (s.rec && s.T >= s.rec.start + 0.4 && !s.q) await page.waitForTimeout(10); else await adv(0.1, false)
      s = await state()
    }
    ok(s.canType, `${name}: a question is waiting for an answer`)
    await page.evaluate(() => document.getElementById('answer').focus())
    await page.keyboard.type('tiger', { delay: 5 })
    await adv(0.6)
    ok(s.kbLift === 0 && (await state()).kbLift === 0, `${name}: no keyboard, no lift`, `lift ${(await state()).kbLift}`)
    await shot('1-before')

    await page.evaluate((k) => window.__setKeyboard(k), kb)
    await adv(0.8)
    s = await state()
    const r = await rect()
    const scale = r.height / 720
    const inkBottomOnScreen = r.bottom - s.kbLift * scale // the lowest line of the box (the timer bar, picture row 718)
    const covered = r.bottom > h - kb
    ok(!covered || s.kbLift > 0, `${name}: the box rises when the keyboard covers it`, `lift ${s.kbLift.toFixed(1)} picture px, picture bottom ${r.bottom.toFixed(0)} vs keyboard top ${h - kb}`)
    ok(inkBottomOnScreen <= h - kb - 8 || !covered, `${name}: the lowest line ends above the keyboard`, `box bottom at y=${inkBottomOnScreen.toFixed(0)}, keyboard starts at y=${h - kb}`)
    ok(r.bottom - s.kbLift * scale >= 0 && s.kbLift <= 550, `${name}: the box stays inside the picture`, `lift ${s.kbLift.toFixed(0)} of at most 550`)
    ok(await page.evaluate(() => document.activeElement === document.getElementById('answer')), `${name}: the answer field keeps the focus`)
    ok((await page.evaluate(() => document.getElementById('answer').value)) === 'tiger', `${name}: what was typed is untouched`)
    ok(await page.evaluate(() => scrollY === 0 && scrollX === 0 && window.visualViewport.offsetTop === 0), `${name}: the page did not scroll`)
    await shot('2-keyboard-up')

    // typing while it is up keeps working and the box stays raised
    await page.keyboard.type('x', { delay: 5 }); await adv(0.2)
    ok(Math.abs((await state()).kbLift - s.kbLift) < 1, `${name}: stays raised while typing`)

    // "did you mean ...?": its YES / NO buttons are drawn raised too, and a tap must hit them where they are drawn (and not where they were).
    // A suggestion is faked and the "player said yes / no" handler is replaced, so nothing is sent to the server.
    await page.evaluate(() => { const g = window.__mt.game; window.__confirmed = null; g.answerConfirm = (c) => { window.__confirmed = c }; g.confirm = { text: 'tigr', suggestion: 'Tiger' } })
    await adv(0.3)
    s = await state()
    const r3 = await rect(), sc3 = r3.height / 720
    ok(s.confirm === 'Tiger' && s.kbLift > 0, `${name}: "did you mean?" is on screen with the box still raised`, `lift ${s.kbLift.toFixed(0)}`)
    await shot('2b-confirm-keyboard-up')
    const YES = { x: 978, y: 668 }, NO = { x: 1086, y: 668 } // centres of the two buttons in the picture
    const at = (p, lift) => [r3.left + p.x * sc3, r3.top + (p.y - lift) * sc3]
    if (s.kbLift * sc3 > 45) { // far enough that the old and the new place do not overlap
      const [ox, oy] = at(YES, 0)
      if (oy < h) { await page.touchscreen.tap(ox, oy); await adv(0.1) }
      ok((await page.evaluate(() => window.__confirmed)) === null, `${name}: a tap where the buttons used to be does nothing`)
    }
    const [yx, yy] = at(YES, s.kbLift), [nx, ny] = at(NO, s.kbLift)
    await page.touchscreen.tap(yx, yy); await adv(0.1)
    ok((await page.evaluate(() => window.__confirmed)) === 'yes', `${name}: a tap on the raised YES works`)
    await page.evaluate(() => { window.__confirmed = null; window.__mt.game.confirm = { text: 'tigr', suggestion: 'Tiger' } }); await adv(0.1)
    await page.touchscreen.tap(nx, ny); await adv(0.1)
    ok((await page.evaluate(() => window.__confirmed)) === 'no', `${name}: a tap on the raised NO works`)
    await page.evaluate(() => { window.__mt.game.confirm = null }); await adv(0.3)

    // pinch-zoom makes the visible area smaller too, and must not move the box
    await page.evaluate(() => window.__setZoom(2.4)); await adv(0.8)
    ok((await state()).kbLift === 0, `${name}: a pinch-zoomed page does not raise the box`, `lift ${(await state()).kbLift}`)
    await page.evaluate(() => window.__setZoom(1)); await adv(0.8)
    ok((await state()).kbLift > 0, `${name}: raised again after the zoom is back to 1`)

    // the field loses the focus (the keyboard was dismissed): the box comes back down by itself
    await page.evaluate(() => document.getElementById('answer').blur()); await adv(0.8)
    ok((await state()).kbLift === 0, `${name}: lowers again when the field loses the focus`)
    await page.evaluate(() => document.getElementById('answer').focus()); await adv(0.8)
    ok((await state()).kbLift > 0, `${name}: raised again when it is focused`)

    // the keyboard goes away: back to exactly the original place
    await page.evaluate(() => window.__setKeyboard(0)); await adv(0.8)
    ok((await state()).kbLift === 0, `${name}: back to its place when the keyboard retracts`, `lift ${(await state()).kbLift}`)
    await shot('3-after')

    // ---- the multiplayer lobby (name field)
    await page.evaluate(() => { window.__mt.game.toTitle?.() })
    await page.reload()
    await page.waitForFunction(() => window.__mt, null, { timeout: 60000 })
    await page.evaluate(() => window.__mt.game.openLobby())
    await adv(0.8)
    let vs = await page.evaluate(() => window.__mt.game.versusDebug())
    if (vs.screen === 'name') {
      await page.evaluate(() => document.getElementById('answer').focus())
      await page.keyboard.type('Zoe', { delay: 5 })
      await page.evaluate((k) => window.__setKeyboard(k), kb)
      await adv(0.8)
      s = await state()
      const r2 = await rect()
      const sc2 = r2.height / 720
      const items = (await page.evaluate(() => window.__mt.game.versusDebug())).items
      const go = items.find((i) => i.action === 'name-ok')
      const goBottom = r2.top + (go.box.y + go.box.h - s.kbLift) * sc2
      const fieldBottom = r2.top + (288 + 56 - s.kbLift) * sc2
      const need = r2.top + 344 * sc2 > h - kb // the field would have been covered
      ok(!need || s.kbLift > 0, `${name}: the lobby rises when the keyboard would cover its field`, `lift ${s.kbLift.toFixed(1)}`)
      ok(fieldBottom <= h - kb - 8, `${name}: the name field is above the keyboard`, `field bottom y=${fieldBottom.toFixed(0)}, keyboard at ${h - kb}`)
      ok(s.kbLift <= 110.5, `${name}: the lobby rises by at most 110`, `lift ${s.kbLift.toFixed(1)}`)
      await shot('4-lobby-keyboard-up')
      // tap the CONTINUE button where it is drawn now (raised); it must work
      const cx = r2.left + (go.box.x + go.box.w / 2) * sc2, cy = r2.top + (go.box.y + go.box.h / 2 - s.kbLift) * sc2
      if (cy < h - kb) {
        await page.touchscreen.tap(cx, cy)
        await adv(0.3)
        vs = await page.evaluate(() => window.__mt.game.versusDebug())
        ok(vs.screen !== 'name', `${name}: a tap on the raised CONTINUE button works`, `screen is now "${vs.screen}"`)
      } else {
        console.log(`note     ${name}: the CONTINUE button (y=${cy.toFixed(0)}) is still under the keyboard (lift is capped); Enter on the keyboard sends the name`)
      }
    } else console.log(`note     ${name}: the lobby opened on "${vs.screen}", not the name field: lobby checks skipped`)
    if (errors.length) ok(false, `${name}: no page errors`, errors.join(' | '))
    await ctx.close()
  }

  // ---- a computer: nothing may change
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  await ctx.addInitScript(FAKE_VISUAL_VIEWPORT)
  const page = await ctx.newPage()
  await page.goto(BASE + '/?manual=1')
  await page.waitForFunction(() => window.__mt, null, { timeout: 60000 })
  await page.evaluate(() => window.__mt.press('solo'))
  let s = await page.evaluate(() => window.__mt.state()), guard = 0
  while (!s.canType && s.phase === 'run' && guard++ < 3000) {
    if (s.rec && s.T >= s.rec.start + 0.4 && !s.q) await page.waitForTimeout(10); else await page.evaluate(() => window.__mt.advance(0.1, false))
    s = await page.evaluate(() => window.__mt.state())
  }
  await page.evaluate(() => document.getElementById('answer').focus())
  await page.evaluate(() => window.__mt.advance(0.6, true))
  ok((await page.evaluate(() => window.__mt.state())).kbLift === 0, 'computer: no lift')
  const pos = await page.evaluate(() => { const a = getComputedStyle(document.getElementById('answer')); return { top: a.top, bottom: a.bottom } })
  ok(pos.bottom === '8px', 'computer: the hidden field stays at the bottom, as before', JSON.stringify(pos))
  await ctx.close()

  await browser.close()
  console.log(bad ? `${bad} PROBLEM(S)` : 'all keyboard checks pass')
  process.exit(bad ? 1 : 0)
})().catch((e) => { console.error('TEST FAILED', e); process.exit(1) })

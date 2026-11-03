// Keyboard focus: typing must reach the answer box however the player got away from it (the Tab key, a click on the page or on the
// game, the sound button, another tab or app). Needs `npm run dev`. Exits 1 if any case cannot type. Submits no answers.
const { open } = require('./lib.cjs')

;(async () => {
  const { browser, page, waitQuestion } = await open()
  await page.setViewportSize({ width: 1600, height: 1000 }) // leaves an empty margin around the game to click on
  await page.evaluate(() => window.__mt.press('solo'))
  const s = await waitQuestion()
  if (!s.canType) throw new Error('no question became typeable')

  const reset = () => page.evaluate(() => { const i = document.getElementById('answer'); i.value = ''; i.focus() })
  const typed = async () => {
    await page.keyboard.type('abc', { delay: 10 })
    return page.evaluate(() => document.getElementById('answer').value)
  }
  const box = await page.locator('#game').boundingBox()
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  const margin = { x: 4, y: 4 }
  if (!(margin.y < box.y)) throw new Error('the margin click point is not outside the game')

  const cases = [
    ['nothing (baseline)', async () => {}],
    ['press Tab', () => page.keyboard.press('Tab')],
    ['press Tab, then Shift+Tab', async () => { await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab') }],
    ['click the empty margin', () => page.mouse.click(margin.x, margin.y)],
    ['click the margin, then the game', async () => { await page.mouse.click(margin.x, margin.y); await page.mouse.click(centre.x, centre.y) }],
    ['click the game', () => page.mouse.click(centre.x, centre.y)],
    ['click the sound button', () => page.locator('#mute').click()],
    ['switch to another tab and back', async () => {
      const p2 = await browser.newPage(); await p2.goto('about:blank'); await p2.bringToFront()
      await page.waitForTimeout(200); await page.bringToFront(); await page.waitForTimeout(200); await p2.close()
    }],
  ]
  let bad = 0
  for (const [name, act] of cases) {
    await reset()
    await act()
    const v = await typed()
    const ok = v === 'abc'
    if (!ok) bad++
    console.log((ok ? 'ok     ' : 'BROKEN ') + name + (ok ? '' : ` (the box holds "${v}")`))
  }
  await browser.close()
  if (bad) { console.error(`${bad} case(s) cannot type`); process.exit(1) }
  console.log('typing works in every case')
})().catch((e) => { console.error('TEST FAILED', e.message); process.exit(1) })

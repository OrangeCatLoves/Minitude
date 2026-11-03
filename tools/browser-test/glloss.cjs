// The browser can take the graphics context (WebGL) away at any time. The world picture must come back by itself; if it did not,
// the background would freeze while the titles and the size readout (drawn in 2D) carried on. Needs `npm run dev`. Submits no answers.
const { open } = require('./lib.cjs')

;(async () => {
  const { browser, page, waitQuestion } = await open()
  await page.evaluate(() => window.__mt.press('solo')) // the room, undimmed, with a question on screen
  await waitQuestion()
  const ready = () => page.evaluate(() => window.__mt.game.gl.ready)
  /** average brightness of the left part of the game picture (the world, not the text) */
  const bright = () => page.evaluate(() => {
    window.__mt.draw()
    const d = document.getElementById('game').getContext('2d').getImageData(0, 100, 300, 350).data
    let sum = 0
    for (let i = 0; i < d.length; i += 4) sum += d[i] + d[i + 1] + d[i + 2]
    return Math.round(sum / (d.length / 4) / 3)
  })
  const fails = []
  const check = (ok, what) => { console.log((ok ? 'ok     ' : 'BROKEN ') + what); if (!ok) fails.push(what) }

  const before = await bright()
  check(await ready(), 'the world picture is ready at the start')
  check(before > 15, `the world is on screen (brightness ${before})`)

  await page.evaluate(() => { const g = window.__mt.game.gl.canvas.getContext('webgl2'); g.getExtension('WEBGL_lose_context').loseContext() })
  const during = await bright()
  check(!(await ready()), 'the game notices the loss')
  check(during < before / 2, `meanwhile the frame is cleared, not left stale (brightness ${during})`)

  await page.waitForTimeout(2800)
  const after = await bright()
  check(await ready(), 'the world picture is rebuilt by itself')
  check(Math.abs(after - before) <= before * 0.25, `the world is back (brightness ${after}, was ${before})`)

  await browser.close()
  if (fails.length) { console.error(`${fails.length} check(s) failed`); process.exit(1) }
  console.log('the world picture recovers from a lost graphics context')
})().catch((e) => { console.error('TEST FAILED', e.message); process.exit(1) })

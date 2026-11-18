// Pictures of the icons page (icons.html) into designs/: the page, and the cabinet screen for each frame.
//   MINITUDE_CHANNEL=chrome node icon-shots.cjs
const path = require('path'), fs = require('fs'), { pathToFileURL } = require('url')
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'designs')
fs.mkdirSync(OUT, { recursive: true })
const URL = (q) => pathToFileURL(path.join(ROOT, 'icons.html')).href + '?' + q
;(async () => {
  const b = await chromium.launch({ channel: process.env.MINITUDE_CHANNEL || 'chrome' })
  const p = await b.newPage({ viewport: { width: 1320, height: 900 }, deviceScaleFactor: 1 })
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  await p.goto(URL('still=1&frame=tile')); await p.waitForSelector('body.ready'); await p.waitForTimeout(400)
  await (await p.$('#glyphs')).screenshot({ path: path.join(OUT, 'icons-pictograms.png') })
  await (await p.$('#frames')).screenshot({ path: path.join(OUT, 'icons-frames.png') })
  for (const f of ['tile', 'badge', 'medal', 'plain']) {
    await p.goto(URL('still=1&frame=' + f + '&state=mixed')); await p.waitForSelector('body.ready'); await p.waitForTimeout(400)
    await (await p.$('.stage')).screenshot({ path: path.join(OUT, `cabinet-tab-${f}.png`) })
    await (await p.$('#bars')).screenshot({ path: path.join(OUT, `slim-bar-icon-${f}.png`) })
  }
  await b.close()
  console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no page errors', '| files in designs/:', fs.readdirSync(OUT).length)
})().catch((e) => { console.error(e); process.exit(1) })

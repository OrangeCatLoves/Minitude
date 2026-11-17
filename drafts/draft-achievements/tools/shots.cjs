// Screenshots of the review page (index.html) into designs/: the six designs for a few achievements, and the whole list in each design.
//   MINITUDE_CHANNEL=chrome node shots.cjs
const path = require('path'), fs = require('fs'), { pathToFileURL } = require('url')
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'designs')
fs.mkdirSync(OUT, { recursive: true })
const URL = (q) => pathToFileURL(path.join(ROOT, 'index.html')).href + '?still=1&' + q
;(async () => {
  const b = await chromium.launch({ channel: process.env.MINITUDE_CHANNEL || 'chrome' })
  const p = await b.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 1 })
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  const names = ['1-slim-bar', '2-top-strip', '3-medal-plate', '4-terminal', '5-prism', '6-ticket']
  // each design, for a rarity first, a gem step, and the medal icon style
  for (const [tag, q] of [['rare', 'ach=first-rare&ctx=reveal'], ['gems10', 'ach=gems-10&ctx=reveal'], ['singularity', 'ach=first-singularity&ctx=question'], ['common', 'ach=first-common&ctx=question&icons=medal']]) {
    await p.goto(URL(q)); await p.waitForSelector('body.ready'); await p.waitForTimeout(700)
    const cards = await p.$$('.design')
    for (let i = 0; i < cards.length; i++) await cards[i].screenshot({ path: path.join(OUT, `${names[i]}--${tag}.png`) })
  }
  // the whole list in each design
  for (let i = 0; i < 6; i++) {
    await p.goto(URL('shelf=d' + (i + 1) + '&ctx=question')); await p.waitForSelector('body.ready'); await p.addStyleTag({ content: '.bar { position: static !important; }' }); await p.waitForTimeout(700)
    await (await p.$('#shelf')).screenshot({ path: path.join(OUT, `shelf-${names[i]}.png`) })
  }
  // full-size crops (1 pixel of the page = 1 pixel of the 1280 x 720 game): the top 190 px of each design's stage, for four achievements
  for (const [tag, q] of [['first-rare', 'ach=first-rare&ctx=reveal'], ['gems-10', 'ach=gems-10&ctx=reveal'], ['singularity', 'ach=first-singularity&ctx=reveal'], ['first-common-medal', 'ach=first-common&ctx=reveal&icons=medal']]) {
    await p.goto(URL(q)); await p.waitForSelector('body.ready')
    await p.addStyleTag({ content: '.grid { grid-template-columns: 1fr !important; } .fit { width: 1280px !important; }' })
    await p.evaluate(() => window.dispatchEvent(new Event('resize'))); await p.waitForTimeout(700)
    const fits = await p.$$('.fit')
    for (let i = 0; i < fits.length; i++) {
      await fits[i].scrollIntoViewIfNeeded(); const box = await fits[i].boundingBox(); const y = await p.evaluate(() => window.scrollY)
      await p.screenshot({ path: path.join(OUT, 'zoom-' + names[i] + '--' + tag + '.png'), fullPage: true, clip: { x: box.x, y: box.y + y, width: 1280, height: 190 } })
    }
  }
  // an overview of the page
  await p.goto(URL('ach=first-rare&ctx=reveal')); await p.waitForSelector('body.ready'); await p.waitForTimeout(700)
  await p.screenshot({ path: path.join(OUT, 'overview.png'), fullPage: false })
  await b.close()
  console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no page errors', '| files in designs/:', fs.readdirSync(OUT).length)
})().catch((e) => { console.error(e); process.exit(1) })

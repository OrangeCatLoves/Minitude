// Draws the four gem-ladder icons (100, 250, 500, all) at 12x, on the tile and on the slim bar, into designs/zoom-big4.png.
//   MINITUDE_CHANNEL=chrome node zoom-big4.cjs
const path = require('path'), { pathToFileURL } = require('url')
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'designs', 'zoom-big4.png')
;(async () => {
  const b = await chromium.launch({ channel: process.env.MINITUDE_CHANNEL || 'chrome' })
  const p = await b.newPage({ viewport: { width: 1320, height: 900 }, deviceScaleFactor: 1 })
  await p.goto(pathToFileURL(path.join(ROOT, 'icons.html')).href + '?still=1&frame=tile')
  await p.waitForSelector('body.ready')
  await p.evaluate(() => {
    const ids = ['gems-100', 'gems-250', 'gems-500', 'gems-all']
    const wrap = document.createElement('div')
    wrap.id = 'zoom'
    wrap.style.cssText = 'position:fixed;left:0;top:0;z-index:999;background:#0a1026;padding:16px;display:flex;flex-direction:column;gap:14px'
    const row1 = document.createElement('div'); row1.style.cssText = 'display:flex;gap:16px'
    const row2 = document.createElement('div'); row2.style.cssText = 'display:flex;gap:16px'
    for (const id of ids) {
      const a = ACH.find((x) => x.id === id)
      row1.append(show(glyph(a), 12))
      row2.append(show(framed(a, 'tile'), 7), show(framed(a, 'medal'), 7), show(framed(a, 'badge'), 7), show(framed(a, 'tile', true), 7))
    }
    wrap.append(row1, row2); document.body.append(wrap)
  })
  await (await p.$('#zoom')).screenshot({ path: OUT })
  await b.close(); console.log('wrote', OUT)
})().catch((e) => { console.error(e); process.exit(1) })

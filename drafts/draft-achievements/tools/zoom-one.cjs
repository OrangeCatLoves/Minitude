// One icon very large (and at game size beside it): node zoom-one.cjs gems-all 24  ->  designs/zoom-<id>.png
//   MINITUDE_CHANNEL=chrome node zoom-one.cjs gems-all 24
const path = require('path'), { pathToFileURL } = require('url')
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const ROOT = path.join(__dirname, '..'), id = process.argv[2] || 'gems-all', scale = Number(process.argv[3] || 20)
const OUT = path.join(ROOT, 'designs', 'zoom-' + id + '.png')
;(async () => {
  const b = await chromium.launch({ channel: process.env.MINITUDE_CHANNEL || 'chrome' })
  const p = await b.newPage({ viewport: { width: 1000, height: 700 }, deviceScaleFactor: 1 })
  await p.goto(pathToFileURL(path.join(ROOT, 'icons.html')).href + '?still=1&frame=tile')
  await p.waitForSelector('body.ready')
  await p.evaluate(([id, scale]) => {
    const a = ACH.find((x) => x.id === id)
    const wrap = document.createElement('div')
    wrap.id = 'zoom'
    wrap.style.cssText = 'position:fixed;left:0;top:0;z-index:999;background:#0a1026;padding:20px;display:flex;gap:24px;align-items:center'
    const small = document.createElement('div'); small.style.cssText = 'display:flex;flex-direction:column;gap:12px'
    small.append(show(framed(a, 'tile'), 3), show(glyph(a), 2))
    wrap.append(show(glyph(a), scale), small); document.body.append(wrap)
  }, [id, scale])
  await (await p.$('#zoom')).screenshot({ path: OUT })
  await b.close(); console.log('wrote', OUT)
})().catch((e) => { console.error(e); process.exit(1) })

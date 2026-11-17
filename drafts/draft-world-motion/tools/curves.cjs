const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  const errs = []; p.on('pageerror', (e) => errs.push(e.message))
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  console.log(JSON.stringify(await p.evaluate(() => { const L = Lab.worldFor(12); return { curves: L.curves.map((c) => ({ lam: +c.lam.toFixed(2), P: c.P, rms: +c.rms.toFixed(2), ok: c.ok.reduce((a, v) => a + v, 0), px: c.sp.n })), packets: L.packets.map((q) => [q.minx, q.maxx, q.n]) } })))
  console.log(errs.join('|')); await b.close()
})()

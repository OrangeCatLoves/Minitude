// ring radii of the ripple world along some directions
const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  const r = await p.evaluate(() => {
    const L = Lab.worldFor(18), out = {}
    const lum = (x, y) => { const i = (y * 320 + x) * 4; return Math.round(0.299 * L.base[i] + 0.587 * L.base[i + 1] + 0.114 * L.base[i + 2]) }
    for (const ang of [0, 20, 340, 180]) {
      const a = ang * Math.PI / 180, hits = []
      for (let rho = 20; rho < 240; rho++) { const x = Math.round(83 + rho * Math.cos(a)), y = Math.round(52 + rho * Math.sin(a) * 0.56); if (x < 0 || x > 319 || y < 15 || y > 142) break; const l = lum(x, y), x2 = Math.round(83 + (rho - 3) * Math.cos(a)), y2 = Math.round(52 + (rho - 3) * Math.sin(a) * 0.56); if (l - lum(x2, y2) > 40) hits.push(rho) }
      out[ang] = hits.join(',')
    }
    return out
  })
  console.log(JSON.stringify(r, null, 1)); await b.close()
})()

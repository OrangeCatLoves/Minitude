// colour counts in a rectangle of the ORIGINAL picture:  node region.cjs <slot> x0 y0 x1 y1
const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const [slot, x0, y0, x1, y1] = process.argv.slice(2).map(Number)
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  const r = await p.evaluate(({ slot, x0, y0, x1, y1 }) => { const L = Lab.worldFor(slot), m = {}; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y * 320 + x) * 4, k = [L.base[i], L.base[i + 1], L.base[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join(''); m[k] = (m[k] || 0) + 1 } return Object.entries(m).sort((a, c) => c[1] - a[1]).slice(0, 24) }, { slot, x0, y0, x1, y1 })
  console.log(r.map((e) => e.join(':')).join('  '))
  await b.close()
})()

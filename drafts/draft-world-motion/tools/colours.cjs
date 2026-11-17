// every non-background colour of a picture with its count and mean y, sorted by mean y:  node colours.cjs <slot> <y0> <y1> <bgHex,...>
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const [slot, y0, y1] = process.argv.slice(2, 5).map(Number), bg = process.argv[5].split(',')
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  const r = await p.evaluate(({ slot, y0, y1, bg }) => { const L = Lab.worldFor(slot), m = {}; for (let y = y0; y <= y1; y++) for (let x = 0; x < 320; x++) { const i = (y * 320 + x) * 4, k = [L.base[i], L.base[i + 1], L.base[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join(''); if (bg.includes(k)) continue; const e = m[k] || (m[k] = { n: 0, sy: 0 }); e.n++; e.sy += y } return Object.entries(m).filter((e) => e[1].n >= 25).map(([k, e]) => ({ k, n: e.n, y: Math.round(e.sy / e.n) })).sort((a, b) => a.y - b.y) }, { slot, y0, y1, bg })
  console.log(r.map((e) => e.k + ' n=' + e.n + ' y~' + e.y).join('\n')); await b.close()
})()

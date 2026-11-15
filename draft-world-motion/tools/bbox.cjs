// bounding box of pixels in a rect whose colour is one of the given hex colours:  node bbox.cjs <slot> x0 y0 x1 y1 hex,hex,...
const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const [slot, x0, y0, x1, y1] = process.argv.slice(2, 7).map(Number), hex = process.argv[7].split(',')
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  console.log(JSON.stringify(await p.evaluate(({ slot, x0, y0, x1, y1, hex }) => { const L = Lab.worldFor(slot); let a = 999, c = 999, d = -1, e = -1, n = 0; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y * 320 + x) * 4, k = [L.base[i], L.base[i + 1], L.base[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join(''); if (hex.includes(k)) { n++; a = Math.min(a, x); d = Math.max(d, x); c = Math.min(c, y); e = Math.max(e, y) } } return { n, x: [a, d], y: [c, e], cx: (a + d) / 2, cy: (c + e) / 2, r: Math.max(d - a, e - c) / 2 } }, { slot, x0, y0, x1, y1, hex })))
  await b.close()
})()

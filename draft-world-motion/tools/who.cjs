// which lifted pieces contain a pixel:   node who.cjs <slot> <x> <y>
const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const [slot, X, Y] = process.argv.slice(2).map(Number)
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  console.log(JSON.stringify(await p.evaluate(({ slot, X, Y }) => {
    const L = Lab.worldFor(slot), hits = []
    const has = (s) => { for (let k = 0; k < s.n; k++) if (s.xs[k] === X && s.ys[k] === Y) return [s.cols[k * 3], s.cols[k * 3 + 1], s.cols[k * 3 + 2]]; return null }
    for (const key of Object.keys(L)) { const v = L[key]; const list = Array.isArray(v) ? v : [v]; list.forEach((s, i) => { if (s && s.xs && s.n) { const h = has(s); if (h) hits.push({ key, i, col: h }) } else if (Array.isArray(s)) s.forEach((q, j) => { if (q && q.xs && has(q)) hits.push({ key, i, j }) }) }) }
    const i = (Y * 320 + X) * 4; return { base: [...L.base.slice(i, i + 3)], cur: [...L.cur.slice(i, i + 3)], hits }
  }, { slot, X, Y })))
  await b.close()
})()

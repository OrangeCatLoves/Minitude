// which rows/columns changed between still and alive:  node rows.cjs <slot> <t> <y0> <y1>
const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const [slot, t, y0, y1] = process.argv.slice(2).map(Number)
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  const r = await p.evaluate(({ slot, t, y0, y1 }) => {
    const st = (Lab.worldFor(slot), Lab.still.get(slot)), tmp = document.createElement('canvas'); tmp.width = 320; tmp.height = 180; const g = tmp.getContext('2d')
    Lab.render(slot, t, 1, g, false); const d = g.getImageData(0, 0, 320, 180).data, rows = []
    for (let y = y0; y <= y1; y++) { let n = 0, x0 = 999, x1 = -1, mx = 0; for (let x = 0; x < 320; x++) { const i = (y * 320 + x) * 4, e = Math.abs(d[i] - st.data[i]) + Math.abs(d[i + 1] - st.data[i + 1]) + Math.abs(d[i + 2] - st.data[i + 2]); if (e > 24) { n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); mx = Math.max(mx, e) } } rows.push(y + ': ' + n + ' px x ' + x0 + '..' + x1 + ' max ' + mx) }
    return rows
  }, { slot, t, y0, y1 })
  console.log(r.join('\n')); await b.close()
})()

// per column of the DNA picture: which period (72..108) the column's pattern repeats with best, and how well (0 = perfectly)
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  const r = await p.evaluate(() => {
    const img = Lab.still.get(9) || (Lab.worldFor(9), Lab.still.get(9)), B = img.data, W = 320
    const px = (x, y) => { const i = (y * W + x) * 4; return [B[i], B[i + 1], B[i + 2]] }
    const out = [], Ps = [66, 72, 78, 84, 90, 96, 102, 108]
    let line = ''
    for (let x = 0; x < W; x++) {
      let best = null
      for (const P of Ps) { let e = 0, n = 0; for (let y = 15; y + P <= 139; y++) { const a = px(x, y), c = px(x, y + P); n++; e += Math.min(1, (Math.abs(a[0] - c[0]) + Math.abs(a[1] - c[1]) + Math.abs(a[2] - c[2])) / 120) } const v = e / n; if (!best || v < best.v) best = { P, v } }
      line += x + ':' + best.P + '/' + best.v.toFixed(2) + ' '
      if (x % 16 === 15) { out.push(line); line = '' }
    }
    return out
  })
  console.log(r.join('\n')); await b.close()
})()

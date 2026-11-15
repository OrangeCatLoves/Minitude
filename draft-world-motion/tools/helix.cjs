// for column ranges of the DNA picture: the vertical period at which the helix shape repeats best, and how well
const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  const r = await p.evaluate(() => {
    const img = Lab.still.get(9) || (Lab.worldFor(9), Lab.still.get(9)), B = img.data, W = 320
    const lum = (x, y) => { const i = (y * W + x) * 4; return 0.299 * B[i] + 0.587 * B[i + 1] + 0.114 * B[i + 2] }
    const sat = (x, y) => { const i = (y * W + x) * 4, mx = Math.max(B[i], B[i + 1], B[i + 2]), mn = Math.min(B[i], B[i + 1], B[i + 2]); return mx ? 255 * (mx - mn) / mx : 0 }
    const out = []
    // column profile: how many non-background pixels per column (to see where the helices are)
    const prof = []; for (let x = 0; x < W; x += 4) { let n = 0; for (let y = 15; y <= 139; y++) for (let k = 0; k < 4; k++) if (lum(x + k, y) > 60) n++; prof.push(Math.round(n / 5)) }
    out.push('bright pixels per 4 columns: ' + prof.join(' '))
    for (const thr of [45, 75]) for (const [x0, x1] of [[0, 40], [40, 78], [80, 118], [118, 162], [165, 230], [232, 282], [282, 319]]) {
      let best = null
      for (let P = 16; P <= 110; P++) { let e = 0, n = 0; for (let y = 15; y + P <= 139; y++) for (let x = x0; x <= x1; x++) { const a = lum(x, y) > thr, c = lum(x, y + P) > thr; if (a || c) { n++; if (a !== c) e++ } } if (n > 300) { const v = e / n; if (!best || v < best.v) best = { P, v: +v.toFixed(3), n } } }
      out.push('lum>' + thr + ' x ' + x0 + '-' + x1 + ': ' + JSON.stringify(best))
    }
    return out
  })
  console.log(r.join('\n')); await b.close()
})()

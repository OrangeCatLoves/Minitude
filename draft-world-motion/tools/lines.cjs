// the sine curves of the gamma world: for each of the 7 curves, per-column centre of the curve (mean y of curve pixels), then the best period and how well it repeats
const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  const r = await p.evaluate(() => {
    const L = Lab.worldFor(12), W = 320, out = []
    const col = (x, y) => { const i = (y * W + x) * 4; return [L.base[i], L.base[i + 1], L.base[i + 2]] }
    const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
    const white = (c) => c[0] > 235 && c[1] > 235 && c[2] > 235
    // curve pixels = bright and not white, y in 15..138
    const bands = [[15, 30], [26, 50], [42, 66], [58, 80], [74, 98], [92, 112], [108, 134]]
    bands.forEach(([a, z], k) => {
      const ys = []
      for (let x = 0; x < W; x++) { let s = 0, n = 0; for (let y = a; y <= z; y++) { const c = col(x, y); if (lum(c) > 95 && !white(c)) { s += y; n++ } } ys.push(n ? s / n : null) }
      let best = null
      for (let P = 12; P < 160; P++) { let e = 0, m = 0; for (let x = 0; x + P < W; x++) { if (ys[x] != null && ys[x + P] != null) { e += Math.abs(ys[x] - ys[x + P]); m++ } } if (m > 100) { const v = e / m; if (!best || v < best.v) best = { P, v: +v.toFixed(2), m } } }
      const vals = ys.filter((v) => v != null)
      out.push({ k, band: [a, z], cover: vals.length, min: Math.min(...vals).toFixed(1), max: Math.max(...vals).toFixed(1), best })
    })
    // cross-section of curve 3 at a crest and at a slope
    const sec = {}; for (const x of [10, 11, 12, 13, 14]) { const cs = []; for (let y = 40; y <= 70; y++) { const c = col(x, y); if (lum(c) > 95) cs.push(y + ':' + c.map((v) => v.toString(16).padStart(2, '0')).join('')) } sec[x] = cs.join(' ') }
    return { out, sec }
  })
  console.log(r.out.map((o) => JSON.stringify(o)).join('\n')); console.log(JSON.stringify(r.sec, null, 1)); await b.close()
})()

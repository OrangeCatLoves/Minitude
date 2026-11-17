// frame-to-frame change at 30 fps: per world, the share of pixels that change by more than a little between two frames (calm = small), and the biggest single jump
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab); if (process.env.V !== undefined) await p.evaluate((v) => Lab.pickAll(v), Number(process.env.V))
  const res = await p.evaluate(() => {
    const out = [], tmp = document.createElement('canvas'); tmp.width = 320; tmp.height = 180; const g = tmp.getContext('2d')
    for (let sl = 0; sl < 36; sl++) {
      let prev = null, sum = 0, mx = 0, n = 0
      for (let f = 0; f < 150; f++) {
        Lab.render(sl, 1 + f / 30, 1, g, false); const d = g.getImageData(0, 15, 320, 150).data
        if (prev) { let c = 0; for (let i = 0; i < d.length; i += 4) { if (Math.abs(d[i] - prev[i]) + Math.abs(d[i + 1] - prev[i + 1]) + Math.abs(d[i + 2] - prev[i + 2]) > 30) c++ } const pc = 100 * c / (320 * 150); sum += pc; mx = Math.max(mx, pc); n++ }
        prev = new Uint8ClampedArray(d)
      }
      out.push((sl < 20 ? 'world ' + (sl + 1) : sl < 35 ? 'unexplored ' + sl : 'planck foam').padEnd(14) + 'avg ' + (sum / n).toFixed(2) + '%  max ' + mx.toFixed(2) + '%')
    }
    return out
  })
  console.log(res.join('\n')); await b.close()
})()

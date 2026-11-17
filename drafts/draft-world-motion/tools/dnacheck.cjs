// does the JS port of the DNA picture reproduce the original at angle 0? counts differing pixels in rows 0..139 and shows where
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const path = require('path'), fs = require('fs'), { pathToFileURL } = require('url')
;(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  const errs = []; p.on('pageerror', (e) => errs.push(e.message))
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  const r = await p.evaluate(() => {
    const base = (Lab.worldFor(9), Lab.still.get(9)).data, o = Dna.background(); Dna.helices(o, null)
    let n = 0; const rows = {}, ex = [], d = new Uint8ClampedArray(320 * 180 * 4)
    for (let y = 0; y < 140; y++) for (let x = 0; x < 320; x++) { const i = (y * 320 + x) * 4, e = Math.abs(o[i] - base[i]) + Math.abs(o[i + 1] - base[i + 1]) + Math.abs(o[i + 2] - base[i + 2]); d[i + 3] = 255; if (e) { n++; rows[y] = (rows[y] || 0) + 1; d[i] = 255; d[i + 1] = 60; d[i + 2] = 200; if (ex.length < 12) ex.push([x, y, [base[i], base[i + 1], base[i + 2]], [o[i], o[i + 1], o[i + 2]]]) } else { d[i] = base[i] * 0.3; d[i + 1] = base[i + 1] * 0.3; d[i + 2] = base[i + 2] * 0.3 } }
    const c = document.createElement('canvas'); c.width = 960; c.height = 420; const g = c.getContext('2d'); g.imageSmoothingEnabled = false
    const t = document.createElement('canvas'); t.width = 320; t.height = 180; t.getContext('2d').putImageData(new ImageData(d, 320, 180), 0, 0); g.drawImage(t, 0, 0, 320, 140, 0, 0, 960, 420)
    return { n, ex, rows: Object.keys(rows).length, png: c.toDataURL('image/png') }
  })
  fs.writeFileSync(path.join(__dirname, '..', 'sheets', 'dnadiff.png'), Buffer.from(r.png.split(',')[1], 'base64'))
  console.log('differing pixels (rows 0-139):', r.n, 'in', r.rows, 'rows'); console.log(JSON.stringify(r.ex)); console.log(errs.join('|')); await b.close()
})()

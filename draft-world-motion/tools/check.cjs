// every slot, several times and LIFE values: no errors, LIFE 0 equals the still exactly, and how long a frame takes
const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1400, height: 900 } })
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab); if (process.env.V !== undefined) await p.evaluate((v) => Lab.pickAll(v), Number(process.env.V))
  const res = await p.evaluate(() => {
    const out = [], tmp = document.createElement('canvas'); tmp.width = 320; tmp.height = 180; const g = tmp.getContext('2d')
    for (let sl = 0; sl < 36; sl++) {
      const row = { slot: sl, err: null }
      try {
        const st = Lab.still.get(sl) || (Lab.worldFor(sl), Lab.still.get(sl)); let t0 = performance.now(), n = 0
        for (const K of [0, 1, 2]) for (const t of [0, 1.7, 3.3, 9.9, 61.2]) {
          Lab.render(sl, t, K, g, false); n++
          if (K === 0) { const d = g.getImageData(0, 0, 320, 180).data; for (let i = 0; i < d.length; i++) if (d[i] !== st.data[i]) { row.err = 'LIFE 0 differs from the still at ' + i; break } }
        }
        row.ms = ((performance.now() - t0) / n).toFixed(1)
      } catch (e) { row.err = String(e && e.stack || e).split('\n').slice(0, 3).join(' | ') }
      out.push(row)
    }
    return out
  })
  for (const r of res) console.log(String(r.slot).padStart(2), r.err ? 'ERROR ' + r.err : 'ok  ' + r.ms + ' ms/frame')
  console.log(errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors')
  await b.close()
})().catch((e) => { console.error(e); process.exit(1) })

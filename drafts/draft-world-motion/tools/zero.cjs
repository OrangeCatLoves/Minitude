// where LIFE 0 differs from the still:   node zero.cjs 3,4,5
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  const res = await p.evaluate((slots) => slots.map((sl) => {
    const st = (Lab.worldFor(sl), Lab.still.get(sl)), tmp = document.createElement('canvas'); tmp.width = 320; tmp.height = 180; const g = tmp.getContext('2d')
    Lab.render(sl, 3.3, 0, g, false); const d = g.getImageData(0, 0, 320, 180).data
    let n = 0, x0 = 999, y0 = 999, x1 = -1, y1 = -1, mx = 0; const ex = []
    for (let i = 0; i < d.length; i += 4) { const e = Math.abs(d[i] - st.data[i]) + Math.abs(d[i + 1] - st.data[i + 1]) + Math.abs(d[i + 2] - st.data[i + 2]); if (e) { n++; const x = (i / 4) % 320, y = Math.floor(i / 4 / 320); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); mx = Math.max(mx, e); if (ex.length < 3) ex.push([x, y, [st.data[i], st.data[i + 1], st.data[i + 2]], [d[i], d[i + 1], d[i + 2]]]) } }
    return { slot: sl, n, box: [x0, y0, x1, y1], max: mx, ex }
  }), process.argv[2].split(',').map(Number))
  for (const r of res) console.log(JSON.stringify(r))
  await b.close()
})()

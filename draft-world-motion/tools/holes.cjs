// pixels inside a box that no lifted piece covers at time t although a piece covered them in the still (they show the filled background):  node holes.cjs <slot> <t> x0 y0 x1 y1
const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const [slot, t, x0, y0, x1, y1] = process.argv.slice(2).map(Number)
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  console.log(JSON.stringify(await p.evaluate(({ slot, t, x0, y0, x1, y1 }) => {
    const L = Lab.worldFor(slot), tmp = document.createElement('canvas'); tmp.width = 320; tmp.height = 180; Lab.render(slot, t, 1, tmp.getContext('2d'), false)
    const o = L.out, out = []
    const hex = (A, i) => [A[i], A[i + 1], A[i + 2]].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y * 320 + x) * 4; if (L.taken[y * 320 + x] && o[i] === L.cur[i] && o[i + 1] === L.cur[i + 1] && o[i + 2] === L.cur[i + 2] && hex(L.base, i) !== hex(L.cur, i)) out.push([x, y, 'base ' + hex(L.base, i), 'now ' + hex(o, i)]) }
    return { n: out.length, first: out.slice(0, 40) }
  }, { slot, t, x0, y0, x1, y1 })))
  await b.close()
})()

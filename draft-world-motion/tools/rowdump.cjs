const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const [slot, y, x0, x1] = process.argv.slice(2).map(Number)
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  console.log(await p.evaluate(({ slot, y, x0, x1 }) => { const L = Lab.worldFor(slot); const row = (A) => { const o = []; for (let x = x0; x <= x1; x++) { const i = (y * 320 + x) * 4; o.push([A[i], A[i + 1], A[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')) } return o.join(' ') }; return 'base: ' + row(L.base) + '\ncur : ' + row(L.cur) + '\ntaken: ' + Array.from({ length: x1 - x0 + 1 }, (_, k) => L.taken[y * 320 + x0 + k]).join('') }, { slot, y, x0, x1 }))
  await b.close()
})()

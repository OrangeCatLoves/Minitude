const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const [slot, y0, y1] = process.argv.slice(2).map(Number)
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  console.log(await p.evaluate(({ slot, y0, y1 }) => { const L = Lab.worldFor(slot), out = []
    const flat = (A, y) => { let run = 1, best = 0, bx = 0; for (let x = 1; x < 320; x++) { const i = (y * 320 + x) * 4, j = i - 4; if (A[i] === A[j] && A[i + 1] === A[j + 1] && A[i + 2] === A[j + 2]) { run++; if (run > best) { best = run; bx = x } } else run = 1 } return [best, bx] }
    for (let y = y0; y <= y1; y++) { const [c, cx] = flat(L.cur, y), [bb] = flat(L.base, y); if (c > 6 && bb <= 6) out.push('y' + y + ': cut-out flat run ' + c + ' ending x' + cx + ' (original ' + bb + ')') } return out.join('\n') }, { slot, y0, y1 }))
  await b.close()
})()

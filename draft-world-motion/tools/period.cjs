// how exactly does a pattern repeat?  node period.cjs <slot> <axis x|y> <x0> <y0> <x1> <y1> <pmin> <pmax>   (prints the best periods and the mean colour error)
const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const [slot, axis, x0, y0, x1, y1, pmin, pmax] = process.argv.slice(2)
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  const r = await p.evaluate(([slot, axis, x0, y0, x1, y1, pmin, pmax]) => {
    const L = Lab.worldFor(Number(slot)), d = L.cur, res = []
    for (let per = Number(pmin); per <= Number(pmax); per++) {
      let e = 0, n = 0
      for (let y = Number(y0); y <= Number(y1); y += 2) for (let x = Number(x0); x <= Number(x1); x += 2) {
        const xx = axis === 'x' ? x + per : x, yy = axis === 'y' ? y + per : y
        if (xx > Number(x1) || yy > Number(y1)) continue
        const i = (y * 320 + x) * 4, j = (yy * 320 + xx) * 4
        e += Math.abs(d[i] - d[j]) + Math.abs(d[i + 1] - d[j + 1]) + Math.abs(d[i + 2] - d[j + 2]); n++
      }
      if (n) res.push([per, e / n])
    }
    return res.sort((a, b) => a[1] - b[1]).slice(0, 6).map(([per, e]) => `${per}px: ${e.toFixed(1)}`)
  }, [slot, axis, x0, y0, x1, y1, pmin, pmax])
  console.log(`slot ${slot} along ${axis} (${x0},${y0})-(${x1},${y1}):`, r.join('  '))
  await b.close()
})()

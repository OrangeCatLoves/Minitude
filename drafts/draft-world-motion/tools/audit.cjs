// every lifted piece that reaches down to the platform / floor line (y >= 138), per world
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  const r = await p.evaluate(() => {
    const out = []
    for (let sl = 0; sl < 36; sl++) {
      const L = Lab.worldFor(sl)
      for (const key of Object.keys(L)) { const v = L[key]; const list = Array.isArray(v) ? v : [v]; list.forEach((s, i) => { if (s && s.xs && s.n) { let lo = 0, n = 0; for (let k = 0; k < s.n; k++) if (s.ys[k] >= 138) { n++; lo = Math.max(lo, s.ys[k]) } if (n) out.push('slot ' + sl + ' ' + key + '[' + i + '] has ' + n + ' of ' + s.n + ' pixels at y>=138 (down to ' + lo + ')') } }) }
    }
    return out
  })
  console.log(r.join('\n')); await b.close()
})()

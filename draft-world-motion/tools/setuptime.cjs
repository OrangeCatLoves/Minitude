const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  console.log((await p.evaluate(() => { const out = []; for (let s = 0; s < 36; s++) { const t0 = performance.now(); Lab.worldFor(s); out.push(s + ':' + (performance.now() - t0).toFixed(0)) } return out })).join(' ')); await b.close()
})()

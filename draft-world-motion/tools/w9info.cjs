const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message))
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  console.log(JSON.stringify(await p.evaluate(() => { const L = Lab.worldFor(8); return { far: L.far.n, near: L.near.n, beads: L.beads.n, frontFar: L.frontFar.length, frontNear: L.frontNear.length } })), errs.join('|')); await b.close()
})()

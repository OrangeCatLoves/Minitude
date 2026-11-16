// screenshot of the review page:  node shot.cjs [out.png] [width]
const { chromium } = require('../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const [out = 'page.png', width = '1240'] = process.argv.slice(2)
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: Number(width), height: 900 } })
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  await p.goto(pathToFileURL(path.join(__dirname, 'index.html')).href); await p.waitForSelector('body.ready'); await p.waitForTimeout(400)
  await p.screenshot({ path: path.join(__dirname, out), fullPage: true }); console.log('saved', out, errs.length ? 'ERRORS ' + errs.join(' | ') : 'no errors'); await b.close()
})()

// screenshot the real viewer page:  node shot.cjs <out.png> [query] [width]
const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), { pathToFileURL } = require('url')
;(async () => {
  const [out, query = '?w=0&manual=1&t=3.3', width = '1400'] = process.argv.slice(2)
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: Number(width), height: 900 } })
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  await p.goto(pathToFileURL(path.join(__dirname, '..', process.env.PAGE || 'index.html')).href + query); await p.waitForSelector('body.ready'); await p.waitForTimeout(700)
  await p.screenshot({ path: path.join(__dirname, '..', 'sheets', out), fullPage: false })
  console.log('saved', out, errs.length ? 'ERRORS ' + errs.join(' | ') : 'no errors'); await b.close()
})()

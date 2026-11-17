// Draft helper: open a page of the draft folder in the installed Chrome and save a screenshot.
//   node tools/shot.cjs <page.html?query> <out.png> [width] [height] [waitMs]
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const path = require('path')
;(async () => {
  const [page, out, w = '1500', h = '700', wait = '400'] = process.argv.slice(2)
  const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] })
  const p = await browser.newPage({ viewport: { width: +w, height: +h } })
  const logs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()) })
  p.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message))
  const root = path.join(__dirname, '..')
  const [file, q = ''] = page.split('?')
  await p.goto('file:///' + path.join(root, file).replace(/\\/g, '/') + (q ? '?' + q : ''))
  await p.waitForTimeout(+wait)
  // set CLIP=1 to save only the visible window instead of the whole (possibly very tall) page
  await p.screenshot({ path: path.join(root, out), fullPage: !process.env.CLIP })
  console.log('saved', out, logs.length ? '\n' + logs.join('\n') : '(no console errors)')
  await browser.close()
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })

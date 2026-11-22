// Builds more.html (the proposed new achievements) from src/more.template.html (the pixel toolkit is taken from src/icons.template.html) and takes
// designs/more-sheet.png (the whole page) and designs/more-<group>.png (one picture per group).   MINITUDE_CHANNEL=chrome node more-shots.cjs
const fs = require('fs'), path = require('path'), { pathToFileURL } = require('url')
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const ROOT = path.join(__dirname, '..')
const icons = fs.readFileSync(path.join(ROOT, 'src', 'icons.template.html'), 'utf8')
const a = icons.indexOf('const TIER = ['), b = icons.indexOf('/* ---------- the 15 pictograms')
if (a < 0 || b < 0) throw new Error('toolkit markers not found in icons.template.html')
fs.writeFileSync(path.join(ROOT, 'more.html'), fs.readFileSync(path.join(ROOT, 'src', 'more.template.html'), 'utf8').replace('/*TOOLKIT*/', icons.slice(a, b)))
;(async () => {
  const br = await chromium.launch({ channel: process.env.MINITUDE_CHANNEL || 'chrome' })
  const p = await br.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  await p.goto(pathToFileURL(path.join(ROOT, 'more.html')).href)
  await p.waitForSelector('body.ready'); await p.waitForTimeout(500)
  await p.screenshot({ path: path.join(ROOT, 'designs', 'more-sheet.png'), fullPage: true })
  const heads = await p.$$('#groups h2'), grids = await p.$$('#groups .grid')
  const ids = ['journey', 'runs', 'quirks', 'daily', 'multi', 'gems']
  for (let i = 0; i < grids.length; i++) {
    const hb = await heads[i].boundingBox(), gb = await grids[i].boundingBox()
    await p.screenshot({ path: path.join(ROOT, 'designs', `more-${ids[i]}.png`), fullPage: true, clip: { x: 0, y: hb.y - 4, width: 1280, height: gb.y + gb.height - hb.y + 12 } })
  }
  await br.close()
  console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no page errors', '| wrote designs/more-sheet.png and 6 group pictures')
})().catch((e) => { console.error(e); process.exit(1) })

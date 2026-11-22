// Builds six.html (six more achievements, two pictures each) from src/six.template.html (the pixel toolkit is taken from src/icons.template.html)
// and takes designs/six-sheet.png (the whole page) and designs/six-zoom.png (every picture at 8 times).   MINITUDE_CHANNEL=chrome node six-shots.cjs
const fs = require('fs'), path = require('path'), { pathToFileURL } = require('url')
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const ROOT = path.join(__dirname, '..')
const icons = fs.readFileSync(path.join(ROOT, 'src', 'icons.template.html'), 'utf8')
const a = icons.indexOf('const TIER = ['), b = icons.indexOf('/* ---------- the 15 pictograms')
if (a < 0 || b < 0) throw new Error('toolkit markers not found in icons.template.html')
fs.writeFileSync(path.join(ROOT, 'six.html'), fs.readFileSync(path.join(ROOT, 'src', 'six.template.html'), 'utf8').replace('/*TOOLKIT*/', icons.slice(a, b)))
;(async () => {
  const br = await chromium.launch({ channel: process.env.MINITUDE_CHANNEL || 'chrome' })
  const p = await br.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  await p.goto(pathToFileURL(path.join(ROOT, 'six.html')).href)
  await p.waitForSelector('body.ready'); await p.waitForTimeout(500)
  await p.screenshot({ path: path.join(ROOT, 'designs', 'six-sheet.png'), fullPage: true })
  // every picture at 8 times, in a row per achievement (A then B), to judge the pixels
  const url = await p.evaluate(() => {
    const ids = ITEMS.flatMap((it) => [`${it.id}-a`, `${it.id}-b`])
    const S = 8, cell = 40 * S + 24, out = document.createElement('canvas')
    out.width = cell * 4; out.height = cell * 3
    const g = out.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#070b17'; g.fillRect(0, 0, out.width, out.height)
    ids.forEach((id, i) => { const it = ITEMS.find((x) => id.startsWith(x.id + '-')); g.drawImage(tile(id, it.tier), (i % 4) * cell + 12, Math.floor(i / 4) * cell + 12, 40 * S, 40 * S) })
    return out.toDataURL('image/png')
  })
  fs.writeFileSync(path.join(ROOT, 'designs', 'six-zoom.png'), Buffer.from(url.split(',')[1], 'base64'))
  await br.close()
  console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no page errors', '| wrote six.html, designs/six-sheet.png and designs/six-zoom.png')
})().catch((e) => { console.error(e); process.exit(1) })

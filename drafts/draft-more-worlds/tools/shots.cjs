// shots.cjs: render some of the draft worlds to PNG contact sheets so a person (or Claude) can look at them.
//   node tools/shots.cjs <ids comma list | all> <out.png> [times comma list, default 1.5,3.5,5.5] [scale]
// Loads src/*.js into a blank page in Chrome (no index.html needed), draws each world at the given times, saves one PNG.
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const path = require('path'), fs = require('fs')
const root = path.join(__dirname, '..')
;(async () => {
  const [ids = 'all', out = 'sheet.png', times = '1.5,3.5,5.5', scale = '1'] = process.argv.slice(2)
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1200, height: 800 } })
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  await p.setContent('<html><body style="margin:0;background:#000"></body></html>')
  const files = fs.readdirSync(path.join(root, 'src')).filter((f) => f.endsWith('.js') && f !== 'viewer.js').sort((a, b2) => (a === 'gfx.js' ? -1 : b2 === 'gfx.js' ? 1 : a === 'scenelib.js' ? -1 : b2 === 'scenelib.js' ? 1 : a.localeCompare(b2)))
  for (const f of files) await p.addScriptTag({ content: fs.readFileSync(path.join(root, 'src', f), 'utf8') + '\n//# sourceURL=' + f })
  const res = await p.evaluate(({ ids, times, scale }) => {
    const list = ids === 'all' ? Scene.Worlds : ids.split(',').map((i) => Scene.Worlds.find((w) => w.id === i)).filter(Boolean)
    const ts = times.split(',').map(Number), S = Number(scale)
    const cw = Math.round(320 * S), ch = Math.round(180 * S)
    const c = document.createElement('canvas'); c.width = ts.length * (cw + 4); c.height = list.length * (ch + 4)
    const g2 = c.getContext('2d'); g2.fillStyle = '#222'; g2.fillRect(0, 0, c.width, c.height); g2.imageSmoothingEnabled = false
    const tmp = document.createElement('canvas'); tmp.width = 320; tmp.height = 180; const tg = tmp.getContext('2d')
    const gf = new Gfx.Gfx(); const timing = []
    list.forEach((w, row) => ts.forEach((t, col) => { const t0 = performance.now(); gf.clear([0, 0, 0]); w.draw(gf, t); gf.present(tg); timing.push(w.id + ':' + (performance.now() - t0).toFixed(0) + 'ms'); g2.drawImage(tmp, 0, 0, 320, 180, col * (cw + 4), row * (ch + 4), cw, ch) }))
    return { png: c.toDataURL('image/png'), timing: timing.filter((_, i) => i % ts.length === 0) }
  }, { ids, times, scale })
  fs.writeFileSync(path.join(root, 'sheets', out), Buffer.from(res.png.split(',')[1], 'base64'))
  console.log('saved sheets/' + out, '|', res.timing.join(' '), '|', errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no errors')
  await b.close()
})().catch((e) => { console.error(e); process.exit(1) })

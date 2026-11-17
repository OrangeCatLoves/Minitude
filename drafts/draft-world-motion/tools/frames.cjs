// Pictures of the motion: a contact sheet of one world at several moments, the still picture beside them, and a map of what changed.
//   node frames.cjs <world> <out.png> [times=0,1,2,3,4,5] [life=1] [slot]
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const path = require('path')
const { pathToFileURL } = require('url')
const root = path.join(__dirname, '..')
;(async () => {
  const [w, out, times = '0,1.5,3,4.5,6,7.5', life = '1', slot] = process.argv.slice(2)
  const ts = times.split(',').map(Number)
  const b = await chromium.launch({ channel: 'chrome' })
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } })
  const errs = []
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  await p.goto(pathToFileURL(path.join(root, 'index.html')).href + `?w=${w}&manual=1&life=${life}${slot ? '&slot=' + slot : ''}`)
  await p.waitForFunction(() => window.Lab, null, { timeout: 30000 }); if (process.env.V !== undefined) await p.evaluate((v) => Lab.pickAll(v), Number(process.env.V))
  const res = await p.evaluate(({ ts, w, slot }) => {
    const entry = Lab.ENTRIES.find((e) => String(e.key) === String(w)) || Lab.ENTRIES[0]
    const sl = entry.variants ? (slot ? Number(slot) : 24) : entry.slot
    const S = 2, cols = 2, cw = 320 * S, ch = 165 * S, rows = Math.ceil((ts.length + 1) / cols) + 1
    const c = document.createElement('canvas'); c.width = cols * cw + (cols - 1) * 6; c.height = rows * ch + (rows - 1) * 6
    const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = false
    const tmp = document.createElement('canvas'); tmp.width = 320; tmp.height = 180; const tg = tmp.getContext('2d')
    const place = (i, label) => { const x = (i % cols) * (cw + 6), y = Math.floor(i / cols) * (ch + 6); g.drawImage(tmp, 0, 15, 320, 165, x, y, cw, ch); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x + 4, y + 4, 120, 16); g.fillStyle = '#ff0'; g.font = 'bold 12px monospace'; g.fillText(label, x + 8, y + 16) }
    // the still
    tg.putImageData(Lab.still.get(sl) || (Lab.worldFor(sl), Lab.still.get(sl)), 0, 0); const st = Lab.still.get(sl).data
    place(0, 'still')
    const diff = new Uint8ClampedArray(320 * 180 * 4); const changed = []
    ts.forEach((t, k) => {
      Lab.render(sl, t, Lab.S.K, tg, false); place(k + 1, 't = ' + t + ' s')
      const o = Lab.worldFor(sl).out; let n = 0
      for (let i = 0; i < o.length; i += 4) { const d = Math.abs(o[i] - st[i]) + Math.abs(o[i + 1] - st[i + 1]) + Math.abs(o[i + 2] - st[i + 2]); if (d > 24) { n++; diff[i] = 255; diff[i + 1] = 80; diff[i + 2] = 200; diff[i + 3] = 255 } else { diff[i] = st[i] * 0.25; diff[i + 1] = st[i + 1] * 0.25; diff[i + 2] = st[i + 2] * 0.25; diff[i + 3] = 255 } }
      changed.push((100 * n / (320 * 165)).toFixed(1) + '%')
      if (k === ts.length - 1) { tg.putImageData(new ImageData(diff, 320, 180), 0, 0); place(ts.length + 1, 'changed pixels') }
    })
    return { png: c.toDataURL('image/png'), changed }
  }, { ts, w, slot })
  require('fs').writeFileSync(path.join(root, 'sheets', out), Buffer.from(res.png.split(',')[1], 'base64'))
  console.log('saved sheets/' + out, '| share of the picture that differs from the still at each time:', res.changed.join(' '), '|', errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no errors')
  await b.close()
})().catch((e) => { console.error(e); process.exit(1) })

// one picture with every world: still | alive at t | what changed (small), to check quickly that the effects are where they should be.   node overview.cjs <first> <last> <out.png> [t=3.3]
const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), fs = require('fs'), { pathToFileURL } = require('url')
const root = path.join(__dirname, '..')
;(async () => {
  const [a, z, out, t = '3.3'] = process.argv.slice(2)
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1400, height: 900 } })
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  await p.goto(pathToFileURL(path.join(root, 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab); if (process.env.V !== undefined) await p.evaluate((v) => Lab.pickAll(v), Number(process.env.V))
  const res = await p.evaluate(({ a, z, t }) => {
    const slots = String(a).includes(',') ? String(a).split(',').map(Number) : []; if (!slots.length) for (let s = Number(a); s <= Number(z); s++) slots.push(s)
    const S = 1.2, cw = Math.round(320 * S), ch = Math.round(165 * S)
    const c = document.createElement('canvas'); c.width = 3 * cw + 8; c.height = slots.length * (ch + 4)
    const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = false
    const tmp = document.createElement('canvas'); tmp.width = 320; tmp.height = 180; const tg = tmp.getContext('2d')
    const stats = []
    slots.forEach((sl, row) => {
      Lab.worldFor(sl); const st = Lab.still.get(sl).data
      const put = (col) => g.drawImage(tmp, 0, 15, 320, 165, col * (cw + 4), row * (ch + 4), cw, ch)
      tg.putImageData(Lab.still.get(sl), 0, 0); put(0)
      Lab.render(sl, Number(t), 1, tg, false); put(1)
      const o = Lab.worldFor(sl).out, d = new Uint8ClampedArray(320 * 180 * 4); let n = 0
      for (let i = 0; i < o.length; i += 4) { const e = Math.abs(o[i] - st[i]) + Math.abs(o[i + 1] - st[i + 1]) + Math.abs(o[i + 2] - st[i + 2]); if (e > 24) { n++; d[i] = 255; d[i + 1] = 80; d[i + 2] = 200 } else { d[i] = st[i] * 0.22; d[i + 1] = st[i + 1] * 0.22; d[i + 2] = st[i + 2] * 0.22 } d[i + 3] = 255 }
      tg.putImageData(new ImageData(d, 320, 180), 0, 0); put(2)
      stats.push(sl + ': ' + (100 * n / (320 * 165)).toFixed(1) + '%')
    })
    return { png: c.toDataURL('image/png'), stats }
  }, { a, z, t })
  fs.writeFileSync(path.join(root, 'sheets', out), Buffer.from(res.png.split(',')[1], 'base64'))
  console.log('saved', out, '| changed pixels per world:', res.stats.join('  '), '|', errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no errors')
  await b.close()
})().catch((e) => { console.error(e); process.exit(1) })

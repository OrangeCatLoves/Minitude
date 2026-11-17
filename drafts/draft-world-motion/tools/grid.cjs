// contact sheets of the world pictures with a pixel grid (labels in picture pixels, 320 x 180), to read positions from.   node grid.cjs <first> <last> <out.png> [scale]
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const fs = require('fs'), path = require('path')
const root = path.join(__dirname, '..')
;(async () => {
  const [a, z, out, sc = '3'] = process.argv.slice(2)
  const S = Number(sc)
  const slots = []
  for (let k = Number(a); k <= Number(z); k++) slots.push(k)
  const imgs = slots.map((k) => 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'assets', `s${k}.png`)).toString('base64'))
  const cols = 2
  const b = await chromium.launch({ channel: 'chrome' })
  const p = await b.newPage({ viewport: { width: cols * (320 * S + 8), height: 400 } })
  const cells = slots.map((k, i) => `<div style="position:relative;width:${320 * S}px;height:${180 * S}px"><canvas id="c${i}" width="${320 * S}" height="${180 * S}" style="display:block"></canvas></div>`).join('')
  await p.setContent(`<body style="margin:0;background:#000;display:grid;grid-template-columns:repeat(${cols},${320 * S}px);gap:8px">${cells}</body>`)
  await p.evaluate(async ([imgs, slots, S]) => {
    for (let i = 0; i < imgs.length; i++) {
      const im = new Image(); im.src = imgs[i]; await im.decode()
      const c = document.getElementById('c' + i), g = c.getContext('2d'); g.imageSmoothingEnabled = false
      g.drawImage(im, 0, 0, 320 * S, 180 * S)
      // the top 15 rows are cut off in the game: shade them
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 0, 320 * S, 15 * S)
      g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1; g.font = '10px monospace'; g.fillStyle = '#fff'
      for (let x = 0; x <= 320; x += 20) { g.beginPath(); g.moveTo(x * S + .5, 0); g.lineTo(x * S + .5, 180 * S); g.stroke(); if (x < 320) g.fillText(String(x), x * S + 2, 10) }
      for (let y = 0; y <= 180; y += 20) { g.beginPath(); g.moveTo(0, y * S + .5); g.lineTo(320 * S, y * S + .5); g.stroke(); if (y > 0 && y < 180) g.fillText(String(y), 2, y * S - 2) }
      g.fillStyle = '#ff0'; g.font = 'bold 14px monospace'; g.fillText('slot ' + slots[i], 320 * S - 70, 16 * S + 6)
    }
  }, [imgs, slots, S])
  await p.screenshot({ path: path.join(root, 'sheets', out), fullPage: true })
  await b.close()
})()

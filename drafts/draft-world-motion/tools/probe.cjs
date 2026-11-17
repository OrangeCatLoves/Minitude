// Prints the colours of a patch of a world picture, and saves it zoomed.   node probe.cjs <slot> <x> <y> [w=12] [h=8] [zoom=14]
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const fs = require('fs')
const path = require('path')
const root = path.join(__dirname, '..')
;(async () => {
  const [slot, X, Y, w = 12, h = 8, zoom = 14] = process.argv.slice(2).map(Number)
  const b = await chromium.launch({ channel: 'chrome' })
  const p = await b.newPage({ viewport: { width: 800, height: 600 } })
  const src = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'assets', `s${slot}.png`)).toString('base64')
  await p.setContent('<canvas id="c" width="320" height="180"></canvas><canvas id="z"></canvas>')
  const out = await p.evaluate(async ([src, X, Y, w, h, zoom]) => {
    const im = new Image(); im.src = src; await im.decode()
    const c = document.getElementById('c'), g = c.getContext('2d'); g.drawImage(im, 0, 0)
    const rows = []
    for (let y = Y; y < Y + h; y++) { const r = []; for (let x = X; x < X + w; x++) { const d = g.getImageData(x, y, 1, 1).data; r.push([d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('')) } rows.push(`${String(y).padStart(3)}: ` + r.join(' ')) }
    const z = document.getElementById('z'); z.width = w * zoom; z.height = h * zoom
    const zg = z.getContext('2d'); zg.imageSmoothingEnabled = false; zg.drawImage(c, X, Y, w, h, 0, 0, w * zoom, h * zoom)
    return rows.join('\n')
  }, [src, X, Y, w, h, zoom])
  console.log(out)
  await p.locator('#z').screenshot({ path: path.join(root, 'sheets', `probe-${slot}-${X}-${Y}.png`) })
  await b.close()
})()

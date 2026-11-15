// The commonest colours of world pictures, with how many pixels, and the box they sit in.   node palette.cjs <first> <last> [top=22]
const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const fs = require('fs')
const path = require('path')
const root = path.join(__dirname, '..')
;(async () => {
  const [a, z, top = 22] = process.argv.slice(2).map(Number)
  const b = await chromium.launch({ channel: 'chrome' })
  const p = await b.newPage()
  await p.setContent('<canvas id="c" width="320" height="180"></canvas>')
  for (let slot = a; slot <= z; slot++) {
    const src = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'assets', `s${slot}.png`)).toString('base64')
    const rows = await p.evaluate(async ([src, top]) => {
      const im = new Image(); im.src = src; await im.decode()
      const g = document.getElementById('c').getContext('2d'); g.drawImage(im, 0, 0)
      const d = g.getImageData(0, 0, 320, 180).data, m = new Map()
      for (let y = 0; y < 180; y++) for (let x = 0; x < 320; x++) {
        const i = (y * 320 + x) * 4, k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]
        const e = m.get(k) || { n: 0, x0: 999, y0: 999, x1: -1, y1: -1 }
        e.n++; if (x < e.x0) e.x0 = x; if (y < e.y0) e.y0 = y; if (x > e.x1) e.x1 = x; if (y > e.y1) e.y1 = y; m.set(k, e)
      }
      return { distinct: m.size, top: [...m].sort((p, q) => q[1].n - p[1].n).slice(0, top).map(([k, e]) => `${k.toString(16).padStart(6, '0')} n=${e.n} box[${e.x0},${e.y0}-${e.x1},${e.y1}]`) }
    }, [src, top])
    console.log(`--- slot ${slot}: ${rows.distinct} distinct colours`)
    console.log(rows.top.join('\n'))
  }
  await b.close()
})()

// zoomed crops of still and alive side by side:  node crop.cjs <slot> <out.png> <x0,y0,x1,y1> <scale> <t1,t2,...> [life=1]
const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), fs = require('fs'), { pathToFileURL } = require('url')
;(async () => {
  const [slot, out, box, scale, times, life = '1'] = process.argv.slice(2)
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab); if (process.env.V !== undefined) await p.evaluate((v) => Lab.pickAll(v), Number(process.env.V))
  const png = await p.evaluate(({ slot, box, scale, times, life }) => {
    const [x0, y0, x1, y1] = box.split(',').map(Number), S = Number(scale), ts = times.split(',').map(Number), w = x1 - x0 + 1, h = y1 - y0 + 1
    const c = document.createElement('canvas'); c.width = (ts.length + 1) * (w * S + 6); c.height = h * S; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height)
    const tmp = document.createElement('canvas'); tmp.width = 320; tmp.height = 180; const tg = tmp.getContext('2d')
    Lab.worldFor(Number(slot)); tg.putImageData(Lab.still.get(Number(slot)), 0, 0); g.drawImage(tmp, x0, y0, w, h, 0, 0, w * S, h * S)
    ts.forEach((t, i) => { Lab.render(Number(slot), t, Number(life), tg, false); g.drawImage(tmp, x0, y0, w, h, (i + 1) * (w * S + 6), 0, w * S, h * S) })
    return c.toDataURL('image/png')
  }, { slot, box, scale, times, life })
  fs.writeFileSync(path.join(__dirname, '..', 'sheets', out), Buffer.from(png.split(',')[1], 'base64')); console.log('saved', out); await b.close()
})()

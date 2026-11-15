// the working background (everything lifted is cut out and filled) of a world, cropped and zoomed:  node bgonly.cjs <slot> <out.png> x0,y0,x1,y1 scale
const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), fs = require('fs'), { pathToFileURL } = require('url')
;(async () => {
  const [slot, out, box, scale] = process.argv.slice(2)
  const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage()
  await p.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '?w=0&manual=1'); await p.waitForFunction(() => window.Lab)
  const png = await p.evaluate(({ slot, box, scale }) => {
    const L = Lab.worldFor(Number(slot)), [x0, y0, x1, y1] = box.split(',').map(Number), S = Number(scale), w = x1 - x0 + 1, h = y1 - y0 + 1
    const tmp = document.createElement('canvas'); tmp.width = 320; tmp.height = 180; const tg = tmp.getContext('2d'); tg.putImageData(new ImageData(new Uint8ClampedArray(L.cur), 320, 180), 0, 0)
    const c = document.createElement('canvas'); c.width = w * S; c.height = h * S; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(tmp, x0, y0, w, h, 0, 0, w * S, h * S); return c.toDataURL('image/png')
  }, { slot, box, scale })
  fs.writeFileSync(path.join(__dirname, '..', 'sheets', out), Buffer.from(png.split(',')[1], 'base64')); console.log('saved', out); await b.close()
})()

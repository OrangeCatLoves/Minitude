// Draft helper: capture a scene of the prototype at several moments and lay the frames out as one contact sheet.
//   node tools/frames.cjs <scene> <out.png> <cols> <t1,t2,t3,...>
const { chromium } = require('../../tools/browser-test/node_modules/playwright')
const path = require('path'), fs = require('fs')
;(async () => {
  const [scene, out, cols, times] = process.argv.slice(2)
  const toks = times.split(','), ts = toks.map((x) => Number(x.split('@').pop())), scs = toks.map((x) => (x.includes('@') ? x.split('@')[0] : scene))
  const root = path.join(__dirname, '..')
  const browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } })
  const logs = []; page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text()) })
  await page.goto('file:///' + path.join(root, 'index.html').replace(/\\/g, '/') + '?scene=' + scene + '&t=0' + (process.env.DESIGN ? '&design=' + process.env.DESIGN + '&colour=' + (process.env.COLOUR || 1) : ''))
  await page.waitForFunction(() => document.body.classList.contains('ready'))
  const shots = []
  for (let i = 0; i < ts.length; i++) { const t = ts[i]
    await page.evaluate(([s, t]) => window.__draft.show(s, t), [scs[i], t])
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    shots.push(await page.evaluate(() => document.getElementById('game').toDataURL('image/png')))
  }
  const sheet = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  await sheet.setContent('<body style="margin:0;background:#000"></body>')
  const png = await sheet.evaluate(async ([shots, ts, cols]) => {
    const imgs = await Promise.all(shots.map((s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = s })))
    const cw = 640, ch = Math.round(640 * 780 / 1280), rows = Math.ceil(imgs.length / cols), cv = document.createElement('canvas'); cv.width = cw * cols; cv.height = ch * rows
    const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height)
    imgs.forEach((im, k) => { const x = (k % cols) * cw, y = Math.floor(k / cols) * ch; g.drawImage(im, x, y, cw, ch); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x + 4, y + 4, 86, 22); g.fillStyle = '#fff'; g.font = '16px monospace'; g.fillText((ts[k] + 's'), x + 10, y + 21) })
    return cv.toDataURL('image/png')
  }, [shots, ts, +cols])
  fs.writeFileSync(path.join(root, out), Buffer.from(png.split(',')[1], 'base64'))
  console.log('saved', out, logs.length ? logs.join('\n') : '(no errors)')
  await browser.close()
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })

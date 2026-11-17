// Draft helper (read-only): look closely at the game's six agreed tier icons (packages/web/public/assets/gem0..5.png).
// Saves gem-art/_tier-icons.png (each icon at 12x, pixels not smoothed) and prints how each one is built: colours, outline, highlights.
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const fs = require('fs'), path = require('path')
;(async () => {
  const root = path.join(__dirname, '..'), pub = path.join(root, '..', '..', 'packages', 'web', 'public', 'assets')
  const imgs = [0, 1, 2, 3, 4, 5].map((i) => 'data:image/png;base64,' + fs.readFileSync(path.join(pub, `gem${i}.png`)).toString('base64'))
  const browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage({ viewport: { width: 1200, height: 520 } })
  await page.setContent('<body style="margin:0;background:#0b1124"><div id="o" style="display:flex;gap:18px;padding:18px"></div></body>')
  const info = await page.evaluate(async (imgs) => {
    const out = [], o = document.getElementById('o')
    for (const src of imgs) {
      const im = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src })
      const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const g = cv.getContext('2d'); g.drawImage(im, 0, 0)
      const d = g.getImageData(0, 0, im.width, im.height).data, cols = new Map(); let opaque = 0, minx = 99, maxx = -1, miny = 99, maxy = -1
      for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) { const i = (y * im.width + x) * 4; if (d[i + 3] > 0) { opaque++; minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); const k = d[i] + ',' + d[i + 1] + ',' + d[i + 2] + (d[i + 3] < 255 ? 'a' + d[i + 3] : ''); cols.set(k, (cols.get(k) || 0) + 1) } }
      const top = [...cols.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => k + 'x' + n)
      const light = [...cols.keys()].filter((k) => { const [r, gg, b] = k.split(',').map((v) => parseInt(v)); return r > 235 && gg > 235 && b > 235 }).length
      out.push({ size: im.width + 'x' + im.height, colours: cols.size, opaque, bbox: `${minx}-${maxx} x ${miny}-${maxy}`, top, nearWhite: light })
      const c2 = document.createElement('canvas'); c2.width = c2.height = 32 * 12; const g2 = c2.getContext('2d'); g2.imageSmoothingEnabled = false; g2.drawImage(im, 0, 0, 32 * 12, 32 * 12); c2.style.cssText = 'width:200px;height:200px;image-rendering:pixelated'; o.appendChild(c2)
    }
    return out
  }, imgs)
  info.forEach((x, i) => console.log(`gem${i}: ${x.size} | ${x.colours} colours | ${x.opaque} opaque px | box ${x.bbox} | near-white colours ${x.nearWhite} | most used: ${x.top.join('  ')}`))
  await page.screenshot({ path: path.join(root, 'gem-art', '_tier-icons.png') })
  await browser.close()
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })

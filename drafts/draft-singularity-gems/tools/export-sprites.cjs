// Draft helper: export the 40 gem sprites (8 designs x 5 colours) as real 32 x 32 PNG files, the same kind of file as the game's gem0.png .. gem5.png.
// Output: gem-sprites/dN-name-colour.png  (and a copy of each at 8x in gem-sprites/x8/ so they are easy to look at)
const { chromium } = require('../../../tools/browser-test/node_modules/playwright')
const fs = require('fs'), path = require('path')
;(async () => {
  const root = path.join(__dirname, '..')
  fs.mkdirSync(path.join(root, 'gem-sprites', 'x8'), { recursive: true })
  const browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage()
  await page.goto('about:blank')
  await page.addScriptTag({ path: path.join(root, 'src', 'gem.js') })
  await page.addScriptTag({ path: path.join(root, 'src', 'designs2.js') })
  const files = await page.evaluate(() => {
    const out = []
    Gem.DESIGNS.forEach((d, di) => Gem.COLOURS.forEach((c, ci) => {
      const cv = Gem.sprite(di, ci), big = document.createElement('canvas'); big.width = big.height = 256; const g = big.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(cv, 0, 0, 256, 256)
      out.push({ name: `d${String(di + 1).padStart(2, '0')}-${d.name.toLowerCase().replace(/ /g, '-')}-${c.id}.png`, png: cv.toDataURL('image/png'), big: big.toDataURL('image/png') })
    }))
    return out
  })
  for (const f of files) {
    fs.writeFileSync(path.join(root, 'gem-sprites', f.name), Buffer.from(f.png.split(',')[1], 'base64'))
    fs.writeFileSync(path.join(root, 'gem-sprites', 'x8', f.name), Buffer.from(f.big.split(',')[1], 'base64'))
  }
  console.log('exported', files.length, 'sprites to gem-sprites/ (32x32) and gem-sprites/x8/ (256x256)')
  await browser.close()
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })

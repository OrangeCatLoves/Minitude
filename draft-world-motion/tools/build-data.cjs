// Packs the world pictures, the explorer and the fonts into data/assets.js (base64), so index.html works when double-clicked (no server needed).
const fs = require('fs')
const path = require('path')
const root = path.join(__dirname, '..')
const fonts = path.join(root, '..', 'packages', 'web', 'public', 'fonts')
const b64 = (f, mime) => `data:${mime};base64,` + fs.readFileSync(f).toString('base64')
const worlds = []
for (let k = 0; k < 36; k++) worlds.push(b64(path.join(root, 'assets', `s${k}.png`), 'image/png'))
const explorer = [0, 1, 2].map((k) => b64(path.join(root, 'assets', `explorer${k}.png`), 'image/png'))
const manifest = JSON.parse(fs.readFileSync(path.join(root, '..', 'packages', 'web', 'public', 'assets', 'manifest.json'), 'utf8'))
const data = {
  worlds,
  explorer,
  box: manifest.explorer,
  fonts: { pix500: b64(path.join(fonts, 'PixelifyFix-500.ttf'), 'font/ttf'), pix700: b64(path.join(fonts, 'PixelifyFix-700.ttf'), 'font/ttf'), sil700: b64(path.join(fonts, 'Silkscreen-Bold.ttf'), 'font/ttf') },
}
fs.mkdirSync(path.join(root, 'data'), { recursive: true })
fs.writeFileSync(path.join(root, 'data', 'assets.js'), 'window.ASSETS = ' + JSON.stringify(data) + ';\n')
console.log('data/assets.js', (fs.statSync(path.join(root, 'data', 'assets.js')).size / 1e6).toFixed(1) + ' MB')

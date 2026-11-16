// Builds the review page of the tab icon drafts (index.html, self-contained: open it by double-click).   node build.cjs
const fs = require('fs'), path = require('path')
const WEB = path.join(__dirname, '..', 'packages', 'web', 'public')
const b64 = (f) => fs.readFileSync(path.join(WEB, f)).toString('base64')
const DATA = {
  explorer: 'data:image/png;base64,' + b64('assets/explorer0.png'),
  gem: 'data:image/png;base64,' + b64('assets/gem6.png'),
  foam: 'data:image/png;base64,' + b64('assets/world/s35.png'),
  pix: 'data:font/ttf;base64,' + b64('fonts/PixelifyFix-500.ttf'),
  sil: 'data:font/ttf;base64,' + b64('fonts/Silkscreen-Bold.ttf'),
}

const page = `<title>Minitude Tab Icons</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
  /* layout: one card per icon; each card shows the icon huge, then at real size inside mock browser tabs (light and dark) */
  @font-face { font-family: Pix; font-weight: 500; src: url(${DATA.pix}); }
  @font-face { font-family: Sil; font-weight: 700; src: url(${DATA.sil}); }
  :root { color-scheme: dark; --ink: #070b17; --panel: #0b1122; --line: rgba(110,124,170,.4); --off: #eef2ff; --soft: #a3b0d6; --faint: #8190bb; --cyan: #5be0ff;
    --tab-light-bar: #dee1e6; --tab-light-on: #ffffff; --tab-light-text: #3c4043; --tab-dark-bar: #202124; --tab-dark-on: #35363a; --tab-dark-text: #e8eaed; --white: #ffffff;
    --pix: 'Sil', monospace; --read: 'Pix', system-ui, sans-serif; }
  html, body { margin: 0; background: var(--ink); color: var(--off); font: 16px/1.5 var(--read); }
  .wrap { max-width: 1180px; margin: 0 auto; padding-block: 20px 60px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
  h1 { margin: 0; font: 700 15px/1.3 var(--pix); letter-spacing: .16em; }
  .lede { margin: 6px 0 18px; color: var(--soft); max-width: 78ch; }
  .lede b { color: var(--off); }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 500px), 1fr)); gap: 14px; }
  .card { background: var(--panel); border: 1px solid var(--line); padding: 14px; display: grid; gap: 12px; min-width: 0; }
  .card h2 { margin: 0; font: 700 13px/1.3 var(--pix); letter-spacing: .14em; }
  .card p { margin: 0; color: var(--soft); }
  .row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; }
  .big { display: flex; }
  .big div { width: 144px; height: 144px; display: grid; place-items: center; }
  .big .d { background: var(--tab-dark-on); } .big .l { background: var(--white); }
  .big canvas { width: 128px; height: 128px; image-rendering: pixelated; }
  .tabs { display: grid; gap: 8px; flex: 1 1 250px; min-width: 0; }
  .bar { display: flex; align-items: flex-end; height: 34px; padding: 0 8px; overflow: hidden; }
  .bar.l { background: var(--tab-light-bar); color: var(--tab-light-text); } .bar.d { background: var(--tab-dark-bar); color: var(--tab-dark-text); }
  .tab { display: flex; align-items: center; gap: 8px; height: 28px; padding: 0 12px; border-radius: 8px 8px 0 0; font: 12px/1 system-ui, 'Segoe UI', sans-serif; white-space: nowrap; }
  .bar.l .tab.on { background: var(--tab-light-on); } .bar.d .tab.on { background: var(--tab-dark-on); }
  .tab.off { opacity: .8; }
  .tab img { width: 16px; height: 16px; image-rendering: pixelated; flex: none; }
  .sizes { display: flex; gap: 14px; align-items: flex-end; color: var(--faint); font-size: 13px; }
  .sizes figure { margin: 0; display: grid; gap: 4px; justify-items: center; }
  .sizes img { image-rendering: pixelated; display: block; }
  .sizes .home { border-radius: 14px; background: var(--ink); }
  .note { color: var(--faint); font-size: 14px; margin-top: 18px; max-width: 80ch; }
</style>
<div class="wrap">
  <h1>MINITUDE: TAB ICON DRAFTS</h1>
  <p class="lede">Six ideas for the small picture in the browser tab. Each is drawn on a <b>16 x 16 pixel grid</b>, like the game's own pixel art, so it stays sharp at tab size. Every card shows the icon enlarged, then at its <b>real size</b> in a light and a dark browser tab, and bigger for bookmarks and a phone's home screen. Tell me the letter you like (or what to change: colours, a mix of two).</p>
  <div class="grid" id="grid"></div>
  <p class="note">The same picture would also be used when someone saves the game to a phone's home screen or bookmarks it. Nothing here is in the game yet.</p>
</div>
<script>
(async function () {
  const SRC = { explorer: '${DATA.explorer}', gem: '${DATA.gem}', foam: '${DATA.foam}' }
  const load = (u) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = u })
  const pixels = (im) => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, im.width, im.height) }
  const ex = pixels(await load(SRC.explorer)), gem = pixels(await load(SRC.gem))
  const INK = [7, 11, 23], OUT = [18, 10, 30], OFF = [238, 242, 255], CYAN = [91, 224, 255]
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

  /** a 16 x 16 icon is a grid of colours (null = see-through) */
  const blank = () => Array.from({ length: 16 }, () => Array(16).fill(null))
  const fill = (g, c) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) g[y][x] = c; return g }
  const rect = (g, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < 16 && y < 16) g[y][x] = c }
  const frame = (g, x0, y0, x1, y1, c) => { for (let x = x0; x <= x1; x++) { g[y0][x] = c; g[y1][x] = c } for (let y = y0; y <= y1; y++) { g[y][x0] = c; g[y][x1] = c } }
  const round = (g) => { for (const [x, y] of [[0, 0], [15, 0], [0, 15], [15, 15]]) g[y][x] = null; return g }
  const over = (g, top) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (top[y][x]) g[y][x] = top[y][x]; return g }

  /** the explorer's helmet: the top 16 rows of the game's explorer, two plain columns of the visor taken out so that it is 16 wide */
  function head() {
    const g = blank(), cols = []
    for (let x = 3; x <= 20; x++) if (x !== 14 && x !== 15) cols.push(x)
    for (let y = 0; y < 16; y++) cols.forEach((sx, x) => { const i = (y * ex.width + sx) * 4; if (ex.data[i + 3] > 127) g[y][x] = [ex.data[i], ex.data[i + 1], ex.data[i + 2]] })
    for (let x = 0; x < 16; x++) if (g[15][x]) g[15][x] = OUT   // close the neck with the outline
    return g
  }
  /** the rainbow Crescent at half size: each 2 x 2 block becomes its most common colour (the dark outline only where nothing else is there) */
  function crescent() {
    const g = blank()
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const n = new Map(); let opaque = 0
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const i = ((y * 2 + dy) * 32 + x * 2 + dx) * 4; if (gem.data[i + 3] < 128) continue; opaque++; const k = gem.data[i] + ',' + gem.data[i + 1] + ',' + gem.data[i + 2]; n.set(k, (n.get(k) || 0) + 1) }
      if (opaque < 2) continue
      const list = [...n].sort((a, b) => b[1] - a[1]), col = list.find(([k]) => k !== '18,10,30') || list[0]
      g[y][x] = col[0].split(',').map(Number)
    }
    // put the outline back around the shape
    const o = blank()
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (!g[y][x]) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < 16 && yy < 16 && g[yy][xx]) o[y][x] = OUT }
    return over(o, g)
  }
  const ICONS = [
    { key: 'A', name: 'THE EXPLORER', idea: 'The helmet of the little explorer you play, cut straight from the game. No background, so it sits on any tab colour (it can also be put on a dark tile like B).', grid: () => head() },
    { key: 'B', name: 'THE WHOLE EXPLORER', idea: 'The explorer from head to boots, redrawn tiny, standing on the glowing floor line of the later worlds. Reads as "a small person", which is the game. On a dark tile, so it looks like an app icon on a phone.', grid: () => {
      const g = round(fill(blank(), INK))
      const C = { o: OUT, b: hex('#ffeed0'), s: hex('#d6bea0'), n: hex('#283c6e'), f: hex('#f2c698'), h: hex('#603a28'), t: hex('#3ad0c4'), T: hex('#1e808c'), O: hex('#ff7c44'), D: hex('#c44e30'), w: hex('#ffeed0'), p: hex('#5a4a8a'), c: CYAN, k: hex('#2a6a9a') }
      const art = [
        '................',
        '.....bbbbbb.....',
        '....bbbbbbbb....',
        '....bbnnnnnn....',
        '....bbnhhhhn....',
        '....bbnffffn....',
        '....sbnnnnnn....',
        '.....ssbbss.....',
        '...TtOOOOOD.....',
        '...TtOOOOOD.....',
        '...Ttwwwwww.....',
        '....tOOOOOD.....',
        '.....OD.OD......',
        '.....pp.pp......',
        '.cccccccccccccc.',
        '.kkkkkkkkkkkkkk.',
      ]
      art.forEach((row, y) => [...row].forEach((ch, x) => { if (C[ch]) g[y][x] = C[ch] }))
      return g } },
    { key: 'C', name: 'THE CRESCENT', idea: 'The rainbow Crescent, the hidden SINGULARITY gem. The most colourful one. It gives away what the gem looks like before a player finds one.', grid: () => crescent() },
    { key: 'D', name: 'THE DIVE', idea: 'Frames inside frames, getting smaller and brighter toward a single white point: shrinking, as a symbol.', grid: () => {
      const g = round(fill(blank(), INK))
      frame(g, 1, 1, 14, 14, hex('#22306e')); frame(g, 3, 3, 12, 12, hex('#3050b8')); frame(g, 5, 5, 10, 10, hex('#3a9be8')); rect(g, 7, 7, 8, 8, [255, 255, 255])
      for (const [x, y] of [[6, 6], [9, 6], [6, 9], [9, 9]]) g[y][x] = CYAN
      return g } },
    { key: 'E', name: 'THE LETTER', idea: 'A pixel M over the game\\'s little scale bar (the ruler that shows your size). The plainest and easiest to recognise as "Minitude".', grid: () => {
      const g = round(fill(blank(), INK))
      const M = ['##......##', '###....###', '####..####', '##.####.##', '##..##..##', '##......##', '##......##', '##......##']
      M.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') g[2 + y][3 + x] = OFF }))
      rect(g, 3, 13, 12, 13, CYAN); rect(g, 3, 12, 3, 14, CYAN); rect(g, 12, 12, 12, 14, CYAN)
      return g } },
    { key: 'F', name: 'PLANCK FOAM', idea: 'The glowing heart of the last world with two of its bubbles: where every run is trying to get to.', grid: () => {
      const g = round(fill(blank(), hex('#140c3c')))
      const ring = (cx, cy, r, c) => { for (let a = 0; a < 64; a++) { const x = Math.round(cx + r * Math.cos(a * Math.PI / 32)), y = Math.round(cy + r * Math.sin(a * Math.PI / 32)); if (x >= 0 && y >= 0 && x < 16 && y < 16 && g[y][x]) g[y][x] = c } }
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 8.5); if (g[y][x] && d < 5.2 && (x + y) % 2 === 0) g[y][x] = hex('#4a3aa8'); if (g[y][x] && d < 3.2) g[y][x] = hex('#8a78e8') }
      ring(4.5, 4.5, 3.5, hex('#ff96d2')); ring(11, 11, 4, hex('#78ebff'))
      rect(g, 7, 8, 8, 9, [255, 255, 255]); for (const [x, y] of [[7, 7], [8, 7], [6, 8], [6, 9], [9, 8], [9, 9], [7, 10], [8, 10]]) g[y][x] = hex('#e8e0ff')
      return g } },
  ]
  /** the icon as a canvas of size S (16 or a multiple: every grid square becomes a block) */
  function canvasOf(grid, S) {
    const c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d'), k = S / 16
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const p = grid[y][x]; if (!p) continue; g.fillStyle = 'rgb(' + p.join(',') + ')'; g.fillRect(x * k, y * k, k, k) }
    return c
  }
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e }
  window.ICONS = {}
  for (const ic of ICONS) {
    const grid = ic.grid(), u16 = canvasOf(grid, 16).toDataURL(), u32 = canvasOf(grid, 32).toDataURL(), u180 = canvasOf(grid, 176).toDataURL()
    window.ICONS[ic.key] = { grid, png16: u16, png32: u32 }
    const card = el('section', 'card')
    card.append(el('h2', '', ic.key + ' &nbsp; ' + ic.name), el('p', '', ic.idea))
    const row = el('div', 'row'), big = el('div', 'big')
    for (const cls of ['d', 'l']) { const d = el('div', cls); d.append(canvasOf(grid, 16)); big.append(d) }
    const tabs = el('div', 'tabs')
    for (const cls of ['l', 'd']) tabs.append(el('div', 'bar ' + cls, '<span class="tab on"><img alt="" src="' + u16 + '">Minitude</span><span class="tab off"><img alt="" src="' + u16 + '">Minitude</span>'))
    const sizes = el('div', 'sizes', '<figure><img alt="" width="16" height="16" src="' + u16 + '">tab</figure><figure><img alt="" width="32" height="32" src="' + u32 + '">sharp screens, bookmarks</figure><figure><img alt="" class="home" width="60" height="60" src="' + u180 + '">phone home screen</figure>')
    tabs.append(sizes); row.append(big, tabs); card.append(row)
    document.getElementById('grid').append(card)
  }
  document.body.classList.add('ready')
})()
</script>
`
fs.writeFileSync(path.join(__dirname, 'index.html'), page)
console.log('wrote index.html', (page.length / 1024).toFixed(0) + ' KB')

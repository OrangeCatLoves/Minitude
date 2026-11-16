// Makes the tab / bookmark / home-screen icons of the game (the "M over the scale bar", chosen by the owner on 16 Nov 2026) into packages/web/public.
//   node tools/make-icons.cjs
// The picture is a 16 x 16 grid of squares, drawn by hand below (the drafts that were compared are in draft-favicon/). Everything is written without
// any image library: PNG (zlib), a multi-size .ico (PNG inside) and an .svg of one rectangle per run of squares.
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const OUT = path.join(__dirname, '..', 'packages', 'web', 'public')
const INK = [7, 11, 23], OFF = [238, 242, 255], CYAN = [91, 224, 255]

/** the grid: null = see-through */
function grid(rounded) {
  const g = Array.from({ length: 16 }, () => Array(16).fill(INK))
  if (rounded) for (const [x, y] of [[0, 0], [15, 0], [0, 15], [15, 15]]) g[y][x] = null
  const M = ['##......##', '###....###', '####..####', '##.####.##', '##..##..##', '##......##', '##......##', '##......##']
  M.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') g[2 + y][3 + x] = OFF }))
  for (let x = 3; x <= 12; x++) g[13][x] = CYAN
  for (const x of [3, 12]) for (const y of [12, 13, 14]) g[y][x] = CYAN
  return g
}

// ---------------------------------------------------------------- PNG
const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]), crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
/** RGBA PNG of size w x h from a function pixel(x, y) -> [r, g, b, a] */
function png(w, h, pixel) {
  const raw = Buffer.alloc(h * (w * 4 + 1))
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w; x++) { const p = pixel(x, y), o = y * (w * 4 + 1) + 1 + x * 4; raw[o] = p[0]; raw[o + 1] = p[1]; raw[o + 2] = p[2]; raw[o + 3] = p[3] } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
}
/** the grid enlarged by a whole number k, with `pad` pixels of INK all round */
function render(g, k, pad = 0) {
  const S = 16 * k + 2 * pad
  return png(S, S, (x, y) => {
    const gx = Math.floor((x - pad) / k), gy = Math.floor((y - pad) / k)
    if (gx < 0 || gy < 0 || gx > 15 || gy > 15) return [...INK, 255]
    const c = g[gy][gx]
    return c ? [...c, 255] : [0, 0, 0, 0]
  })
}
/** an .ico holding PNG images */
function ico(images) {
  const head = Buffer.alloc(6); head.writeUInt16LE(1, 2); head.writeUInt16LE(images.length, 4)
  let offset = 6 + 16 * images.length
  const dirs = [], bodies = []
  for (const { size, data } of images) {
    const d = Buffer.alloc(16); d[0] = size === 256 ? 0 : size; d[1] = size === 256 ? 0 : size; d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6); d.writeUInt32LE(data.length, 8); d.writeUInt32LE(offset, 12)
    dirs.push(d); bodies.push(data); offset += data.length
  }
  return Buffer.concat([head, ...dirs, ...bodies])
}
/** an .svg with one rectangle per run of equal squares in a row */
function svg(g) {
  const rects = []
  for (let y = 0; y < 16; y++) {
    let x = 0
    while (x < 16) {
      const c = g[y][x]
      if (!c) { x++; continue }
      let e = x + 1
      while (e < 16 && g[y][e] && g[y][e].join() === c.join()) e++
      rects.push(`<rect x="${x}" y="${y}" width="${e - x}" height="1" fill="rgb(${c.join(',')})"/>`)
      x = e
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${rects.join('')}</svg>\n`
}

const round = grid(true), square = grid(false)
const files = {
  'icon-32.png': render(round, 2),
  'apple-touch-icon.png': render(square, 10, 10), // the phone rounds the corners itself: a full square, 180 x 180
  'favicon.ico': ico([{ size: 16, data: render(round, 1) }, { size: 32, data: render(round, 2) }, { size: 48, data: render(round, 3) }]),
  'icon.svg': Buffer.from(svg(round)),
}
for (const [name, data] of Object.entries(files)) { fs.writeFileSync(path.join(OUT, name), data); console.log(name.padEnd(22), String(data.length).padStart(6), 'bytes') }

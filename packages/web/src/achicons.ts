// @ts-nocheck
/**
 * The achievement pictures, drawn in code (no image files), like the gems and the living worlds. Carried over from the draft the owner
 * reviewed (drafts/draft-achievements: icons.html and final.html, 19 Nov 2026; more.html, 22 Nov 2026): to change a picture, change it THERE first, look at it, then carry
 * it over here. Forty of them are 24 x 24 pixels; the last ("Singularity Complete", the trophy with 1000 on it, chosen by the owner) is 31 x 31
 * and sits in a larger tile.
 */
const TIER = [
  { name: 'COMMON', bg: '#1e2538', fg: '#cdd6ee', edge: '#9aa6bf' }, { name: 'UNCOMMON', bg: '#0e3a22', fg: '#8dffb4', edge: '#46d078' },
  { name: 'RARE', bg: '#0c2a52', fg: '#9ad8ff', edge: '#4fc3ff' }, { name: 'EXOTIC', bg: '#2a1850', fg: '#d8bcff', edge: '#b583ff' },
  { name: 'LEGENDARY', bg: '#4a2c00', fg: '#ffd488', edge: '#ffb23f' }, { name: 'MYTHIC', bg: '#50102e', fg: '#ffa8d6', edge: '#ff5fb0' },
  { name: 'SINGULARITY', bg: '#1b1245', fg: '#f0e8ff', edge: '#c4b0ff' },
]

const RAINBOW = ['#5be0ff', '#5bf0b0', '#ffe066', '#ff9a3c', '#ff5fb0', '#c4a0ff']
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})` }

/* ---------- a tiny pixel toolkit */
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = false; return [c, g] }
const px = (g, x, y, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1) }
const rect = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h) }
function ell(g, cx, cy, rx, ry, col) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) px(g, x, y, col) } }
const disc = (g, cx, cy, r, col) => ell(g, cx, cy, r, r, col)
function line(g, x0, y0, x1, y1, col, w = 1) { const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx - dy; for (;;) { rect(g, x0, y0, w, w, col); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 > -dy) { e -= dy; x0 += sx } if (e2 < dx) { e += dx; y0 += sy } } }
function poly(g, pts, col) { const ys = pts.map((p) => p[1]), xs = pts.map((p) => p[0]); for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) { let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y + .5) !== (yj > y + .5) && x + .5 < ((xj - xi) * (y + .5 - yi)) / (yj - yi) + xi) inside = !inside } if (inside) px(g, x, y, col) } }
/** a 1-pixel dark edge around whatever has been drawn */
function outline(c, col = '#070b17') {
  const g = c.getContext('2d'), w = c.width, h = c.height, im = g.getImageData(0, 0, w, h), d = im.data, src = new Uint8ClampedArray(d)
  const a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : src[(y * w + x) * 4 + 3])
  const n = parseInt(col.slice(1), 16)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) { const i = (y * w + x) * 4; d[i] = n >> 16; d[i + 1] = (n >> 8) & 255; d[i + 2] = n & 255; d[i + 3] = 255 }
  g.putImageData(im, 0, 0)
}
/** every drawn pixel becomes one flat colour (the "not yet earned" silhouette) */
function dim(c) {
  const g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height), d = im.data
  for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { const y = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) * 0.42 + 16; d[i] = y * 0.9; d[i + 1] = y * 0.95; d[i + 2] = y * 1.25 }
  g.putImageData(im, 0, 0)
}
function flat(c, col) {
  const g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height), d = im.data, n = parseInt(col.slice(1), 16)
  for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { d[i] = n >> 16; d[i + 1] = (n >> 8) & 255; d[i + 2] = n & 255 }
  g.putImageData(im, 0, 0)
}
const crescent = (g, cx, cy, r, ox, oy, r2) => { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) { const dx = x + .5 - cx, dy = y + .5 - cy; if (dx * dx + dy * dy > r * r) continue; const ex = x + .5 - (cx + ox), ey = y + .5 - (cy + oy); if (ex * ex + ey * ey <= r2 * r2) continue; const ang = (Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI); px(g, x, y, RAINBOW[Math.min(5, Math.floor(ang * 6))]) } }
const smallGem = (g, x, y, col, lite) => { poly(g, [[x, y - 3], [x + 3, y], [x, y + 3], [x - 3, y]], col); px(g, x - 1, y - 1, lite); px(g, x, y - 2, lite) }

const mix = (hex, to, t) => { const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16); const c = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t); return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1) }
const rainAt = (t) => RAINBOW[Math.max(0, Math.min(5, Math.floor(t * 6)))]
function inPoly(pts, x, y) { let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside } return inside }
function polyFn(g, pts, fn) { const ys = pts.map((p) => p[1]), xs = pts.map((p) => p[0]); for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) if (inPoly(pts, x + .5, y + .5)) px(g, x, y, fn(x, y)) }
const sparkle = (g, x, y, col, big) => { px(g, x, y, col); px(g, x - 1, y, col); px(g, x + 1, y, col); px(g, x, y - 1, col); px(g, x, y + 1, col); if (big) { px(g, x - 2, y, col); px(g, x + 2, y, col); px(g, x, y - 2, col); px(g, x, y + 2, col) } }


/* ---------- helpers of the 26 later pictures (more.html) */
const BM = { 0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '111', '001', '111'], 5: ['111', '100', '111', '001', '111'], 7: ['111', '001', '010', '010', '010'], V: ['101', '101', '101', '101', '010'], S: ['011', '100', '010', '001', '110'] }
/** digits and letters in a 3 x 5 face at scale s, with an optional drop shadow; colFn(x, y) gives the colour */
function digits(g, str, x0, y0, s, colFn, shadow) {
  const cells = []
  ;[...str].forEach((ch, i) => BM[ch].forEach((row, ry) => [...row].forEach((v, rx) => { if (v === '1') cells.push([x0 + (i * 4 + rx) * s, y0 + ry * s]) })))
  if (shadow) for (const [x, y] of cells) rect(g, x + 1, y + 1, s, s, shadow)
  for (const [x, y] of cells) rect(g, x, y, s, s, typeof colFn === 'string' ? colFn : colFn(x, y))
}
const star = (g, cx, cy, R, r, col) => { const pts = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r : R; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]) } poly(g, pts, col) }
/** a spacesuit helmet: cream shell, blue visor on the side the face looks to (dir = 1 right, -1 left) */
function helmet(g, cx, cy, r, dir = 1) {
  disc(g, cx, cy, r, '#d9c9a5'); disc(g, cx - .6, cy - .6, r - .8, '#fff0d0')
  ell(g, cx + dir * r * .22, cy + .4, r * .62, r * .5, '#1d4a86'); ell(g, cx + dir * r * .22, cy + .2, r * .56, r * .42, '#2b5fa0')
  px(g, cx + dir * r * .22 - dir * 1, cy - r * .22, '#bfe4ff'); px(g, cx + dir * r * .22 - dir * 2, cy - r * .22 + 1, '#bfe4ff')
}
function flame(g, outer, mid, core) {
  const T = (pts) => pts.map(([x, y]) => [12 + (x - 12) * 1.12, 0.5 + (y - 1) * .8])
  polyFn(g, T([[12, 1], [15, 6], [18, 11], [18, 16], [15, 20], [12, 21], [9, 20], [6, 16], [6, 11], [8, 8], [10, 12], [11, 6]]), typeof outer === 'string' ? () => outer : outer)
  poly(g, T([[12, 9], [15, 13], [15, 17], [12, 20], [9, 17], [9, 13]]), mid)
  poly(g, T([[12, 13], [13.6, 16], [12, 19], [10.4, 16]]), core)
}
function crescentDot(g) { px(g, 3, 3, '#fff'); px(g, 20, 4, '#fff'); px(g, 21, 11, '#ffe9a0') }


/* ---------- the pictograms, 24 x 24 (the first 14; the trophy is drawn below) */
const GLYPH = {
  'first-common'(g) { ell(g, 12, 14, 9, 6, '#8b97b5'); ell(g, 11, 13, 8, 5, '#cdd6ee'); ell(g, 8, 11, 2.2, 1.2, '#ffffff'); px(g, 15, 15, '#6b7696'); px(g, 17, 14, '#6b7696'); px(g, 13, 17, '#6b7696') },
  'first-uncommon'(g) { rect(g, 11, 6, 2, 16, '#8a5a2b'); rect(g, 7, 21, 10, 2, '#2c8c4a'); poly(g, [[4, 4], [16, 4], [20, 8], [16, 12], [4, 12]], '#59d97c'); rect(g, 6, 7, 8, 1, '#1d6a35'); rect(g, 6, 9, 5, 1, '#1d6a35'); poly(g, [[20, 13], [8, 13], [4, 16], [8, 19], [20, 19]], '#46b86b'); rect(g, 10, 15, 7, 1, '#1d6a35') },
  'first-rare'(g) { poly(g, [[6, 9], [9, 5], [15, 5], [18, 9]], '#bdf0ff'); poly(g, [[6, 9], [18, 9], [12, 20]], '#4fc3ff'); poly(g, [[12, 9], [18, 9], [12, 20]], '#2b8fb8'); px(g, 9, 6, '#fff'); px(g, 10, 6, '#fff'); line(g, 9, 5, 9, 9, '#7ed3f7'); line(g, 15, 5, 15, 9, '#7ed3f7'); rect(g, 19, 2, 1, 5, '#fff'); rect(g, 17, 4, 5, 1, '#fff') },
  'first-exotic'(g) { const pet = ['#ff7fc0', '#ff9ccd']; for (let k = 0; k < 5; k++) { const a = (k * 72 - 90) * Math.PI / 180; disc(g, 12 + 5.5 * Math.cos(a), 12 + 5.5 * Math.sin(a), 4, pet[0]); disc(g, 12 + 6 * Math.cos(a), 12 + 6 * Math.sin(a), 2, pet[1]) } disc(g, 12, 12, 3, '#ffd866'); px(g, 12, 12, '#ff5a5a'); px(g, 13, 11, '#ff5a5a'); px(g, 11, 13, '#ff5a5a') },
  'first-legendary'(g) { poly(g, [[3, 18], [3, 8], [8, 13], [12, 5], [16, 13], [21, 8], [21, 18]], '#ffd866'); rect(g, 3, 17, 18, 4, '#c58a1f'); rect(g, 3, 17, 18, 1, '#ffe9a0'); px(g, 12, 12, '#ff5a5a'); px(g, 12, 13, '#ff5a5a'); px(g, 7, 19, '#5be0ff'); px(g, 12, 19, '#ff5fb0'); px(g, 17, 19, '#5be0ff'); px(g, 3, 7, '#fff'); px(g, 12, 4, '#fff'); px(g, 21, 7, '#fff') },
  'first-mythic'(g) { rect(g, 11, 1, 2, 6, '#ffa8d6'); rect(g, 9, 3, 6, 2, '#ffa8d6'); px(g, 12, 4, '#fff'); disc(g, 12, 11, 3, '#ffa8d6'); rect(g, 9, 14, 6, 5, '#ff5fb0'); rect(g, 9, 19, 2, 3, '#ff5fb0'); rect(g, 13, 19, 2, 3, '#ff5fb0'); rect(g, 7, 15, 2, 4, '#ff5fb0'); rect(g, 15, 15, 2, 4, '#ff5fb0'); rect(g, 3, 22, 18, 1, '#7d1c4d'); px(g, 4, 6, '#ff5fb0'); px(g, 20, 8, '#ff5fb0'); px(g, 3, 14, '#ffa8d6'); px(g, 21, 12, '#ffa8d6') },
  'first-singularity'(g) { crescent(g, 12, 12, 10, 4, -3, 8); px(g, 19, 6, '#fff'); px(g, 20, 5, '#fff'); px(g, 20, 7, '#fff'); px(g, 21, 6, '#fff') },
  'gems-5'(g) { ell(g, 12, 15, 8, 7, '#c9a064'); ell(g, 10, 14, 6, 5, '#e0b97a'); rect(g, 9, 8, 6, 3, '#a67c3d'); rect(g, 8, 10, 8, 2, '#7a5230'); smallGem(g, 9, 6, '#5be0ff', '#fff'); smallGem(g, 12, 4, '#ff5fb0', '#fff'); smallGem(g, 15, 6, '#ffe066', '#fff'); px(g, 20, 4, '#fff') },
  'gems-10'(g) { rect(g, 6, 8, 12, 13, '#2a3a6e'); rect(g, 7, 9, 10, 11, '#142048'); rect(g, 7, 5, 10, 3, '#cdd6ee'); rect(g, 7, 5, 10, 1, '#fff'); line(g, 8, 10, 8, 17, '#7a8ed0'); smallGem(g, 11, 17, '#5be0ff', '#fff'); smallGem(g, 15, 17, '#ff9a3c', '#fff'); smallGem(g, 13, 13, '#ff5fb0', '#fff'); smallGem(g, 10, 13, '#c4a0ff', '#fff'); px(g, 15, 12, '#5bf0b0') },
  'gems-25'(g) { disc(g, 10, 10, 8, '#cdd6ee'); disc(g, 10, 10, 6, '#142048'); line(g, 16, 16, 21, 21, '#8a5a2b', 3); line(g, 15, 15, 17, 17, '#cdd6ee', 2); crescent(g, 10, 10, 4, 2, -1, 3); px(g, 6, 6, '#fff'); px(g, 7, 5, '#fff') },
  'gems-50'(g) { poly(g, [[4, 3], [20, 3], [20, 13], [12, 22], [4, 13]], '#c4b0ff'); poly(g, [[6, 5], [18, 5], [18, 12.5], [12, 19.5], [6, 12.5]], '#3a2790'); crescent(g, 12, 11, 5, 2, -1, 4); px(g, 7, 6, '#fff'); px(g, 8, 6, '#fff') },
  'gems-100'(g) {
    // a burst of light behind one big prism gem: every facet a different colour of the Crescent
    for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, long = k % 2 === 0, r1 = long ? 12 : 10.6; for (let r = 9.6; r <= r1; r += .5) px(g, 12 + r * Math.cos(a), 12 + r * Math.sin(a), long ? '#ffe9a0' : '#8c9bd8') }
    const crown = [[4, 9], [8, 4], [16, 4], [20, 9]], pav = [[4, 9], [20, 9], [12, 21]]
    polyFn(g, crown, (x, y) => mix(rainAt((x - 4) / 16), '#ffffff', y < 6 ? .5 : .28))
    polyFn(g, pav, (x, y) => mix(rainAt((x - 4) / 16), '#000000', .06 + (y - 9) / 12 * .34))
    const L = 'rgba(255,255,255,.5)'
    line(g, 12, 4, 8, 8, L); line(g, 12, 4, 16, 8, L); line(g, 12, 4, 12, 8, L); rect(g, 5, 9, 14, 1, L)
    line(g, 8, 10, 12, 19, L); line(g, 16, 10, 12, 19, L); line(g, 12, 10, 12, 19, L)
    rect(g, 9, 5, 3, 1, '#fff'); px(g, 8, 6, '#fff'); px(g, 6, 8, '#fff')
    return (p) => { sparkle(p, 3, 3, '#fff'); sparkle(p, 21, 2, '#fff', true); sparkle(p, 20, 21, '#ffe9a0'); sparkle(p, 2, 20, '#bdf0ff') }
  },
  'gems-250'(g) {
    // an open treasure chest heaped with gems, light pouring out of it
    rect(g, 4, 8, 16, 5, '#5a3a1b'); rect(g, 4, 8, 16, 1, '#c58a1f'); rect(g, 4, 12, 16, 1, '#c58a1f')
    rect(g, 3, 13, 18, 9, '#8a5a2b'); rect(g, 3, 13, 18, 2, '#c98a45'); rect(g, 3, 20, 18, 2, '#5a3a1b')
    rect(g, 6, 13, 2, 9, '#c58a1f'); rect(g, 16, 13, 2, 9, '#c58a1f'); rect(g, 6, 13, 2, 1, '#ffe9a0'); rect(g, 16, 13, 2, 1, '#ffe9a0')
    smallGem(g, 6, 11, '#5be0ff', '#fff'); smallGem(g, 10, 10, '#ff5fb0', '#fff'); smallGem(g, 15, 10, '#ffe066', '#fff'); smallGem(g, 18, 11, '#5bf0b0', '#fff')
    smallGem(g, 8, 8, '#ff9a3c', '#fff'); smallGem(g, 16, 7, '#5be0ff', '#fff'); smallGem(g, 12, 6, '#c4a0ff', '#fff')
    rect(g, 10, 15, 4, 4, '#ffd866'); rect(g, 11, 16, 2, 2, '#5a3a1b'); rect(g, 10, 15, 4, 1, '#fff2b0')
    return (p) => {
      for (const [x, a] of [[8, .22], [12, .3], [16, .22]]) for (let y = 0; y < 4; y++) { p.fillStyle = 'rgba(255,255,255,' + (a * (y + 1) / 4) + ')'; p.fillRect(x, y, 1, 1) }
      sparkle(p, 12, 2, '#fff', true); sparkle(p, 3, 5, '#ffe9a0'); sparkle(p, 21, 5, '#bdf0ff'); sparkle(p, 21, 19, '#fff')
    }
  },
  'gems-500'(g) {
    // "Five Hundred Strong": the number itself, chunky and in the Crescent's colours, under a small Crescent, on a gold line
    const DIG = { 5: ['111', '100', '111', '001', '111'], 0: ['111', '101', '101', '101', '111'] }
    const on = Array.from({ length: 24 }, () => new Array(24).fill(false))
    ;[5, 0, 0].forEach((d, i) => DIG[d].forEach((row, ry) => [...row].forEach((ch, rx) => { if (ch === "1") for (let k = 0; k < 4; k++) on[11 + ry * 2 + (k >> 1)][1 + i * 8 + rx * 2 + (k & 1)] = true })))
    const at = (x, y) => y >= 0 && y < 24 && x >= 0 && x < 24 && on[y][x]
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) if (on[y][x]) px(g, x + 1, y + 1, '#2a1a66')
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) if (on[y][x]) { const c = rainAt((x - 1) / 22); px(g, x, y, !at(x, y - 1) ? mix(c, "#ffffff", .55) : !at(x, y + 1) ? mix(c, "#000000", .3) : c) }
    rect(g, 2, 22, 21, 1, '#ffd866'); rect(g, 2, 22, 3, 1, '#fff2b0')
    crescent(g, 12, 5, 4, 1.6, -1.2, 3.2)
    return (p) => { sparkle(p, 4, 4, '#fff'); sparkle(p, 20, 4, '#fff', true); px(p, 7, 8, '#bdf0ff'); px(p, 18, 8, '#ffc0e4'); px(p, 1, 8, '#ffe9a0'); px(p, 22, 8, '#fff') }
  },

  // ---------- the 26 approved on 22 Nov 2026, carried over from drafts/draft-achievements/src/more.template.html (more.html)
  uncharted(g) {
    disc(g, 12, 12, 10, '#0d1330'); for (let k = 0; k < 28; k += 2) { const a = k * Math.PI / 14; px(g, 12 + 10.1 * Math.cos(a), 12 + 10.1 * Math.sin(a), '#6f7fc0') }
    const Q = ['01110', '10001', '00001', '00010', '00100', '00000', '00100']
    Q.forEach((row, ry) => [...row].forEach((v, rx) => { if (v === '1') { rect(g, 7 + rx * 2 + 1, 5 + ry * 2 + 1, 2, 2, '#2a1a66'); rect(g, 7 + rx * 2, 5 + ry * 2, 2, 2, '#bdf0ff') } }))
    px(g, 4, 6, '#fff'); px(g, 19, 17, '#ffe9a0'); px(g, 18, 5, '#c4a0ff'); px(g, 5, 18, '#ff9ccd')
  },
  'so-close'(g) {
    rect(g, 1, 8, 20, 9, '#6f7fc0'); rect(g, 2, 9, 18, 7, '#0b1122')
    for (let x = 2; x < 17; x++) for (let y = 9; y < 16; y++) px(g, x, y, mix(rainS((x - 2) / 14), y === 9 ? '#ffffff' : '#000000', y === 9 ? .4 : y >= 14 ? .22 : 0))
    rect(g, 21, 4, 2, 17, '#ffd866'); rect(g, 21, 4, 2, 1, '#fff6d0'); poly(g, [[21, 1], [21, 7], [15, 4]], '#ff5a5a')
    px(g, 18, 11, '#fff'); px(g, 18, 12, 'rgba(255,255,255,.5)'); px(g, 18, 13, 'rgba(255,255,255,.25)')
    return (p) => { sparkle(p, 18, 20, '#fff'); px(p, 4, 4, '#ffe9a0'); px(p, 10, 21, '#bdf0ff') }
  },
  planck(g) {
    const B = [[8, 8, 6], [16, 7, 5], [16, 16, 6], [7, 17, 4.5], [12, 12, 3.4], [20, 11.5, 2.6]]
    B.forEach(([x, y, r], i) => { const c = rainS(i / 5); disc(g, x, y, r, c); disc(g, x, y, r - 1.3, mix(c, '#0d1330', .72)); px(g, x - r * .45, y - r * .45, '#fff'); px(g, x - r * .45 + 1, y - r * .45, '#fff') })
    return (p) => { sparkle(p, 12, 12, '#fff'); px(p, 2, 3, '#bdf0ff'); px(p, 21, 21, '#ffe9a0') }
  },
  'past-edge'(g) {
    rect(g, 1, 14, 11, 8, '#8a5a14'); rect(g, 1, 14, 11, 2, '#ffd866'); rect(g, 1, 16, 11, 1, '#c58a1f')
    for (let k = 0; k <= 22; k++) { const t = k / 22, x = 11 + 11 * t, y = 13 - 9 * Math.sin(t * Math.PI * .85); if (k % 2 === 0) rect(g, Math.round(x), Math.round(y), 2, 2, rainS(t)) }
    star(g, 20.5, 5, 3.6, 1.5, '#fff6d0')
    px(g, 15, 19, '#6f7fc0'); px(g, 20, 17, '#6f7fc0'); px(g, 18, 21, '#c4a0ff')
  },
  'first-dive'(g) {
    rect(g, 4, 14, 3, 7, '#3de0c0'); rect(g, 4, 14, 1, 7, '#9af5e0')
    rect(g, 7, 15, 11, 7, '#ff8a3c'); rect(g, 7, 15, 11, 1, '#ffb27a'); rect(g, 15, 15, 3, 7, '#d96a22'); rect(g, 10, 17, 5, 1, '#ffe9a0')
    helmet(g, 12, 9, 7)
  },
  'ten-dives'(g) { helmet(g, 12, 6, 5, 1); digits(g, '10', 5, 12, 2, '#8dffb4', '#0d3a22') },
  'fifty-dives'(g) { helmet(g, 12, 6, 5, 1); digits(g, '50', 5, 12, 2, '#9ad8ff', '#0c2a52') },
  'hundred-dives'(g) { helmet(g, 12, 6, 5, 1); digits(g, '100', 1, 12, 2, '#d8bcff', '#2a1850'); px(g, 3, 4, '#fff'); px(g, 20, 3, '#ffe9a0') },
  clean(g) {
    disc(g, 11, 12, 9.5, '#8b97b5'); disc(g, 11, 12, 8, '#fff6e0')
    for (const [x, y] of [[11, 5], [11, 19], [4, 12], [18, 12]]) px(g, x, y, '#6b7696')
    line(g, 11, 12, 11, 7, '#2a1a66'); line(g, 11, 12, 15, 12, '#2a1a66'); disc(g, 11, 12, 1, '#2a1a66')
    disc(g, 18, 18, 5, '#1e7a3a'); disc(g, 18, 18, 4, '#59d97c'); line(g, 15, 18, 17, 20, '#fff', 1); line(g, 17, 20, 20, 15, '#fff', 1); line(g, 15, 19, 17, 21, '#fff', 1); line(g, 17, 21, 20, 16, '#fff', 1)
  },
  'no-easy'(g) {
    ell(g, 12, 13, 9, 6, '#8b97b5'); ell(g, 11, 12, 8, 5, '#cdd6ee'); ell(g, 8, 10, 2.2, 1.2, '#fff')
    line(g, 4, 3, 20, 21, '#ff5a5a', 2); line(g, 20, 3, 4, 21, '#ff5a5a', 2)
  },
  buzzer(g) {
    rect(g, 10, 1, 4, 2, '#c58a1f'); rect(g, 11, 3, 2, 3, '#c58a1f'); rect(g, 17, 4, 3, 2, '#c58a1f')
    disc(g, 12, 14, 9.5, '#8b97b5'); disc(g, 12, 14, 8, '#fff6e0')
    for (let a = -90; a <= -50; a += 2) line(g, 12, 14, Math.round(12 + 7.4 * Math.cos(a * Math.PI / 180)), Math.round(14 + 7.4 * Math.sin(a * Math.PI / 180)), '#ff5a5a')
    line(g, 12, 14, Math.round(12 + 6.4 * Math.cos(-64 * Math.PI / 180)), Math.round(14 + 6.4 * Math.sin(-64 * Math.PI / 180)), '#2a1a66'); disc(g, 12, 14, 1.2, '#2a1a66')
    for (const [x, y] of [[12, 7], [12, 21], [5, 14], [19, 14]]) px(g, x, y, '#6b7696')
  },
  'quick-draw'(g) {
    poly(g, [[15, 1], [4, 13], [11, 13], [8, 23], [20, 9], [13, 9]], '#ffe066'); poly(g, [[15, 3], [8, 12], [12, 12], [10, 19], [16, 10], [12, 10]], '#fff6b0')
    return (p) => { px(p, 3, 4, '#fff'); px(p, 20, 17, '#ffc857'); px(p, 21, 4, '#fff') }
  },
  'close-enough'(g) {
    rect(g, 2, 3, 20, 13, '#eef2ff'); g.clearRect(2, 3, 1, 1); g.clearRect(21, 3, 1, 1); g.clearRect(2, 15, 1, 1); g.clearRect(21, 15, 1, 1)
    poly(g, [[6, 15], [6, 21], [12, 15]], '#eef2ff')
    line(g, 7, 9, 10, 12, '#1e7a3a', 2); line(g, 10, 12, 17, 6, '#1e7a3a', 2); line(g, 7, 8, 10, 11, '#59d97c', 1); line(g, 10, 11, 17, 5, '#59d97c', 1)
  },
  'open-book'(g) {
    poly(g, [[2, 8], [11, 10], [11, 21], [2, 19]], '#fff6e0'); poly(g, [[22, 8], [13, 10], [13, 21], [22, 19]], '#e9dcc0')
    rect(g, 11, 10, 2, 11, '#8a5a2b'); rect(g, 1, 19, 10, 2, '#c58a1f'); rect(g, 13, 19, 10, 2, '#c58a1f')
    for (let k = 0; k < 4; k++) { line(g, 4, 11 + k * 2, 9, 12 + k * 2, '#8d99c0'); line(g, 15, 12 + k * 2, 20, 11 + k * 2, '#a99fbf') }
    smallGem(g, 12, 4, '#c4a0ff', '#fff')
    return (p) => { px(p, 6, 3, '#fff'); px(p, 19, 3, '#ffe9a0') }
  },
  'daily-debut'(g) {
    rect(g, 3, 4, 18, 18, '#eef2ff'); rect(g, 3, 4, 18, 5, '#ff5fb0'); rect(g, 3, 4, 18, 1, '#ff9ccd'); rect(g, 7, 2, 2, 5, '#8d99c0'); rect(g, 15, 2, 2, 5, '#8d99c0')
    star(g, 12, 15.5, 5, 2.2, '#ffc857'); star(g, 12, 15.5, 3.4, 1.4, '#fff2b0')
  },
  'streak-3'(g) { flame(g, '#ff8a3c', '#ffc857', '#fff2b0'); digits(g, '3', 10, 17, 1, '#fff6d0', '#2a1a66') },
  'streak-7'(g) { flame(g, '#ffa03c', '#ffe066', '#ffffff'); digits(g, '7', 10, 17, 1, '#fff6d0', '#2a1a66'); px(g, 4, 6, '#ffe066'); px(g, 19, 9, '#ffe066') },
  'streak-30'(g) { flame(g, '#4fc3ff', '#bdf0ff', '#ffffff'); digits(g, '30', 8, 17, 1, '#fff6d0', '#2a1a66'); px(g, 4, 6, '#bdf0ff'); px(g, 19, 9, '#bdf0ff') },
  'streak-100'(g) {
    flame(g, (x, y) => rainS((y - 1) / 15), '#fff6d0', '#ffffff'); digits(g, '100', 6, 17, 1, '#fff6d0', '#2a1a66')
    crescentDot(g)
  },
  'face-to-face'(g) {
    for (const [x0, dir, bx] of [[5.5, 1, 2], [18.5, -1, 15]]) {
      rect(g, bx, 14, 7, 8, '#ff8a3c'); rect(g, bx, 14, 7, 1, '#ffb27a'); rect(g, bx + (dir > 0 ? 5 : 0), 14, 2, 8, '#d96a22')
      helmet(g, x0, 9, 4.8, dir)
    }
    poly(g, [[13.6, 2], [10.4, 10.6], [12.8, 10.6], [10.8, 19], [14.8, 8.8], [12.4, 8.8]], '#ffe066'); poly(g, [[13.2, 4], [11.4, 10], [13, 10], [12, 15], [13.8, 9.6], [12.2, 9.6]], '#fff6b0')
  },
  'room-champion'(g) {
    rect(g, 2, 14, 7, 8, '#cdd6ee'); rect(g, 2, 14, 7, 1, '#fff'); rect(g, 15, 16, 7, 6, '#d79a5a'); rect(g, 15, 16, 7, 1, '#ffc891'); rect(g, 8, 10, 8, 12, '#ffd866'); rect(g, 8, 10, 8, 1, '#fff6d0'); rect(g, 8, 20, 8, 2, '#c58a1f')
    digits(g, '1', 11, 13, 1, '#2a1a66'); digits(g, '2', 4, 16, 1, '#2a1a66'); digits(g, '3', 17, 18, 1, '#5a3a1b')
    star(g, 12, 5, 4.6, 2, '#ffe066'); star(g, 12, 5, 2.8, 1.2, '#fff')
  },
  reigning(g) {
    helmet(g, 12, 14, 8, 1)
    polyFn(g, [[6.5, 8], [6.5, 2.5], [9.2, 5], [12, 1], [14.8, 5], [17.5, 2.5], [17.5, 8]], () => '#ffd866'); rect(g, 6, 7, 12, 2, '#c58a1f'); px(g, 12, 4, '#ff5a5a'); px(g, 8, 7, '#5be0ff'); px(g, 16, 7, '#5bf0b0')
  },
  'well-rounded'(g) {
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) { const dx = x + .5 - 12, dy = y + .5 - 12, d = Math.sqrt(dx * dx + dy * dy); if (d > 10.4) continue; const a = (Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI), s = Math.floor(a * 11), edge = Math.abs(a * 11 - Math.round(a * 11)) < .06 && d > 3.6; px(g, x, y, edge ? '#0d1330' : mix(rainS(s / 10), d < 6 ? '#ffffff' : '#000000', d < 6 ? .25 : .05)) }
    disc(g, 12, 12, 3.6, '#0d1330'); smallGem(g, 12, 12, '#ffffff', '#c4a0ff')
  },
  'full-shelf'(g) {
    rect(g, 2, 17, 20, 3, '#8a5a2b'); rect(g, 2, 17, 20, 1, '#c98a45'); rect(g, 3, 20, 2, 3, '#5a3a1b'); rect(g, 19, 20, 2, 3, '#5a3a1b')
    smallGem(g, 5, 13, '#5be0ff', '#fff'); smallGem(g, 10, 13, '#ff5fb0', '#fff'); smallGem(g, 15, 13, '#ffe066', '#fff'); smallGem(g, 20, 13, '#5bf0b0', '#fff')
    return (p) => { sparkle(p, 12, 5, '#fff', true); px(p, 3, 6, '#ffe9a0'); px(p, 21, 6, '#bdf0ff') }
  },
  'gem-hunter'(g) {
    smallGem(g, 7, 17, '#5be0ff', '#fff'); smallGem(g, 17, 17, '#ff5fb0', '#fff'); smallGem(g, 12, 10, '#ffe066', '#fff')
    smallGem(g, 12, 18, '#c4a0ff', '#fff')
    return (p) => { sparkle(p, 12, 3, '#fff'); sparkle(p, 3, 9, '#ffe9a0'); sparkle(p, 21, 9, '#bdf0ff') }
  },
  'singularity-seven'(g) {
    const C = ['#5be0ff', '#5bf0b0', '#ffe066', '#ffffff', '#ff9a3c', '#ff5fb0', '#c4a0ff']
    for (let k = 0; k < 7; k++) { const a = Math.PI + k * Math.PI / 6, x = 12 + 9.2 * Math.cos(a), y = 17.5 + 9.2 * Math.sin(a); poly(g, [[x, y - 2.8], [x + 2.8, y], [x, y + 2.8], [x - 2.8, y]], C[k]); px(g, x - 1, y - 1, '#fff') }
    rect(g, 2, 21, 20, 1, '#6f7fc0')
    return (p) => { sparkle(p, 12, 4, '#fff', true); px(p, 3, 4, '#ffe9a0'); px(p, 21, 4, '#bdf0ff') }
  },
}
function glyph(a, locked) { const [c, g] = cv(24, 24); const post = GLYPH[a.id](g); outline(c); if (typeof post === "function") post(g); if (locked) dim(c); return c }


const W = 31
const NAVY = '#141c42'
function mk() { const [c, g] = cv(W, W); return [c, g] }
const DG = { 1: ['010', '110', '010', '010', '111'], 0: ['111', '101', '101', '101', '111'] }
/** "1000" in a 3 x 5 pixel face, 15 wide, rainbow with a lighter top edge */
function numeral(g, x0, y0, shadow) {
  const cells = []
  ;[...'1000'].forEach((ch, i) => DG[ch].forEach((row, ry) => [...row].forEach((v, rx) => { if (v === '1') cells.push([x0 + i * 4 + rx, y0 + ry]) })))
  if (shadow) for (const [x, y] of cells) px(g, x + 1, y + 1, shadow)
  for (const [x, y] of cells) px(g, x, y, mix(rainAt((x - x0) / 15), '#ffffff', y === y0 ? .5 : .12))
}
function mirrorLeft(g) {
  const im = g.getImageData(0, 0, W, W), src = new Uint8ClampedArray(im.data), d = im.data
  for (let y = 0; y < W; y++) for (let x = 0; x < 15; x++) { const a = (y * W + x) * 4, b = (y * W + (W - 1 - x)) * 4; d[b] = src[a]; d[b + 1] = src[a + 1]; d[b + 2] = src[a + 2]; d[b + 3] = src[a + 3] }
  g.putImageData(im, 0, 0)
}
const crown = (g, top, base, w) => { /* a small crown, symmetric about the centre column */ const l = 15.5 - w / 2, r = 15.5 + w / 2, h = base - top; polyFn(g, [[l, base], [l, top + h * .35], [l + w * .24, top + h * .6], [15.5, top], [r - w * .24, top + h * .6], [r, top + h * .35], [r, base]], () => '#ffd866'); rect(g, Math.round(l), Math.round(base - 1), Math.round(w) + 1, 1, '#c58a1f'); px(g, 15, Math.round(top + 2), '#ff5a5a'); px(g, 15, Math.round(top + 1), '#ffffff') }

const rainS = (t) => { t = Math.max(0, Math.min(.999, t)) * 5; const i = Math.floor(t); return mix(RAINBOW[i], RAINBOW[i + 1], t - i) }
function moon(g, cx, cy, r, ox, oy, r2) { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = x + .5 - cx, dy = y + .5 - cy; if (dx * dx + dy * dy > r * r) continue; const ex = x + .5 - (cx + ox), ey = y + .5 - (cy + oy); if (ex * ex + ey * ey <= r2 * r2) continue; px(g, x, y, mix(rainS(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI) + .08) % 1), '#ffffff', .12)) } }


/* B · trophy cup with the Crescent rising from it */
function B() {
  const [c, g] = mk()
  for (let y = 0; y < W; y++) for (let x = 0; x < 15; x++) { const e = ((x + .5 - 3.7) / 3.8) ** 2 + ((y + .5 - 17.5) / 5.2) ** 2; if (e <= 1 && e >= .4) px(g, x, y, x + y < 19 ? '#fff2b0' : '#e0a82e') }
  mirrorLeft(g)
  polyFn(g, [[5, 12], [26, 12], [26, 19], [22, 24], [9, 24], [5, 19]], (x) => x < 9 ? '#fff2b0' : x < 21 ? '#ffd866' : '#e0a82e')
  rect(g, 5, 12, 21, 1, '#fff6d0'); rect(g, 5, 13, 21, 1, '#c58a1f')
  rect(g, 7, 15, 17, 7, NAVY); numeral(g, 8, 16)
  rect(g, 13, 24, 5, 2, '#e0a82e'); rect(g, 13, 24, 5, 1, '#ffd866'); rect(g, 11, 26, 9, 1, '#fff2b0')
  rect(g, 9, 27, 13, 2, '#ffd866'); rect(g, 9, 27, 13, 1, '#fff2b0'); rect(g, 6, 29, 19, 2, '#c58a1f'); rect(g, 6, 29, 19, 1, '#e0a82e')
  moon(g, 15, 6, 6, 2.6, -1.6, 4.8)
  outline(c)
  return [c, (p) => { sparkle(p, 4, 4, '#fff', true); sparkle(p, 26, 4, '#ffe9a0'); sparkle(p, 23, 9, '#bdf0ff'); px(p, 8, 9, '#ffc0e4') }]
}


const GREY = { bg: '#0d1328', fg: '#27304f', edge: '#323d62' }
/** the trophy's own tile colours: gold on a deep violet, the only gold in the list */
const GRAND = { bg: '#241a52', fg: '#ffe9a0', edge: '#ffd866' }

/** the picture of the trophy (31 x 31) */
function trophyCanvas(locked) {
  const [c, post] = B()
  post(c.getContext('2d'))
  if (locked) dim(c)
  return c
}

/** every achievement id that has a 24 x 24 picture (the trophy, 'gems-all', is drawn by its own code) */
export const GLYPH_IDS: string[] = Object.keys(GLYPH)
export const TROPHY_ID: string = 'gems-all'

/**
 * The picture of an achievement in its tile: a square with the rarity's colour. While it is not earned the tile shows a "?" instead of the picture
 * (the owner's choice, 19 Nov 2026), in a dimmed version of the rarity's colour. 40 x 40 pixels, or 47 x 47 for the trophy. Draw it with
 * image-rendering: pixelated.
 */
export function achievementTile(a: { id: string; tier: number }, locked: boolean): HTMLCanvasElement {
  const key = a.id + (locked ? ":locked" : "")
  let base = TILES.get(key)
  if (!base) { base = drawTile(a, locked); TILES.set(key, base) }
  const [c, g] = cv(base.width, base.height)   // a copy: a canvas can only sit in one place on the page
  g.drawImage(base, 0, 0)
  return c
}
const TILES = new Map<string, HTMLCanvasElement>()
/** the "?" that stands in for a picture that is not earned yet: 5 x 7 pixels */
const QMARK = ['01110', '10001', '00001', '00010', '00100', '00000', '00100']
function drawTile(a: { id: string; tier: number }, locked: boolean): HTMLCanvasElement {
  const grand = a.id === TROPHY_ID
  const n = grand ? 47 : 40
  const own = grand ? GRAND : TIER[a.tier]
  // a tile that is not earned keeps a hint of its rarity (a dimmed edge and "?") but not its picture
  const t = locked ? { bg: '#0d1328', edge: mix(own.edge, '#0d1328', .62) } : own
  const [c, g] = cv(n, n)
  rect(g, 1, 1, n - 2, n - 2, t.edge); rect(g, 2, 2, n - 4, n - 4, t.bg)
  g.clearRect(0, 0, 1, 1); g.clearRect(n - 1, 0, 1, 1); g.clearRect(0, n - 1, 1, 1); g.clearRect(n - 1, n - 1, 1, 1)
  if (!locked) rect(g, 3, 3, n - 6, 1, 'rgba(255,255,255,.16)')
  else for (let x = 3; x < n - 3; x += 4) { rect(g, x, 2, 2, 1, '#070b17'); rect(g, x, n - 3, 2, 1, '#070b17') }
  if (locked) {
    const k = grand ? 3 : 2, x0 = Math.round((n - 5 * k) / 2), y0 = Math.round((n - 7 * k) / 2), col = mix(own.edge, '#0d1328', .3)
    QMARK.forEach((row, ry) => [...row].forEach((v, rx) => { if (v === '1') { rect(g, x0 + rx * k + 1, y0 + ry * k + 1, k, k, '#070b17'); rect(g, x0 + rx * k, y0 + ry * k, k, k, col) } }))
  } else g.drawImage(grand ? trophyCanvas(false) : glyph(a, false), 8, 8)
  return c
}
/** the colours of a rarity for the banner and the cabinet (edge, glow and a name) */
export const achievementColours = (tier: number): { name: string; bg: string; fg: string; edge: string } => TIER[Math.max(0, Math.min(6, tier | 0))]

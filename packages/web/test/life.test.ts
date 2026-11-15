import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { LifeCore, LIFE_H, LIFE_W } from '../src/life'
import { Dna } from '../src/life/artsource'
import golden from './life.golden.json'

/** A small PNG reader, enough for the world pictures (8-bit RGB or RGBA, not interlaced). Returns RGBA. */
function readPng(file: string): Uint8ClampedArray {
  const b = readFileSync(file)
  let p = 8, w = 0, h = 0, type = 0
  const idat: Buffer[] = []
  while (p < b.length) {
    const len = b.readUInt32BE(p), name = b.toString('latin1', p + 4, p + 8), data = b.subarray(p + 8, p + 8 + len)
    if (name === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); type = data[9]; if (data[8] !== 8 || (type !== 2 && type !== 6) || data[12] !== 0) throw new Error('unexpected PNG format: ' + file) }
    if (name === 'IDAT') idat.push(data)
    p += 12 + len
  }
  const bpp = type === 6 ? 4 : 3, raw = inflateSync(Buffer.concat(idat)), stride = w * bpp
  const px = new Uint8Array(h * stride), out = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], row = y * stride, src = y * (stride + 1) + 1
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? px[row + i - bpp] : 0, up = y ? px[row - stride + i] : 0, c = i >= bpp && y ? px[row - stride + i - bpp] : 0
      let v = raw[src + i]
      if (f === 1) v += a
      else if (f === 2) v += up
      else if (f === 3) v += (a + up) >> 1
      else if (f === 4) { const pa = Math.abs(up - c), pb = Math.abs(a - c), pc = Math.abs(a + up - 2 * c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c }
      px[row + i] = v & 255
    }
  }
  for (let i = 0, j = 0; i < w * h; i++, j += bpp) { out[i * 4] = px[j]; out[i * 4 + 1] = px[j + 1]; out[i * 4 + 2] = px[j + 2]; out[i * 4 + 3] = bpp === 4 ? px[j + 3] : 255 }
  if (w !== LIFE_W || h !== LIFE_H) throw new Error('unexpected picture size: ' + file)
  return out
}
/** FNV-1a of the RGB bytes (the same fingerprint draft-world-motion/tools/golden.cjs takes of the reviewed frames) */
function fnv(a: Uint8ClampedArray): string {
  let h = 0x811c9dc5
  for (let i = 0; i < a.length; i += 4) { h = Math.imul(h ^ a[i], 0x01000193); h = Math.imul(h ^ a[i + 1], 0x01000193); h = Math.imul(h ^ a[i + 2], 0x01000193) }
  return (h >>> 0).toString(16).padStart(8, '0')
}

const dir = join(__dirname, '..', 'public', 'assets', 'world')
const stills = Array.from({ length: 36 }, (_, k) => readPng(join(dir, `s${k}.png`)))
const core = new LifeCore((slot) => new Uint8ClampedArray(stills[slot]))

describe('the living worlds', () => {
  it('reads the pictures the way the browser does', () => {
    expect(stills.map(fnv)).toEqual(golden.still)
  })

  it('has a design for every picture', () => {
    for (let s = 0; s < 36; s++) expect(core.render(s, 1, 1), 'slot ' + s).not.toBeNull()
  })

  it('with no life (k = 0) every picture is the original, pixel for pixel, at any time', () => {
    for (let s = 0; s < 36; s++) for (const t of [0, 1.7, 61.2]) {
      const out = core.render(s, t, 0)!
      let same = true
      for (let i = 0; i < out.length && same; i++) if (out[i] !== stills[s][i]) same = false
      expect(same, `slot ${s} at t = ${t}`).toBe(true)
    }
  })

  it('draws the frames the owner reviewed (fingerprints taken from the review page)', () => {
    for (let s = 0; s < 36; s++) {
      const got = golden.cases.map(([t, k]) => fnv(core.render(s, t, k)!))
      expect(got, 'slot ' + s).toEqual(golden.frames[s])
    }
  })

  it('a frame depends only on the time and the amount, not on what was drawn before', () => {
    for (const s of [0, 8, 9, 12, 18, 35]) {
      const a = fnv(core.render(s, 4.2, 1)!)
      core.render(s, 9.9, 0.3); core.render((s + 5) % 36, 2, 1)
      expect(fnv(core.render(s, 4.2, 1)!), 'slot ' + s).toBe(a)
    }
  })

  it('moves: a living frame differs from the still one (worlds 1 to 20 and Planck Foam)', () => {
    for (const s of [...Array.from({ length: 20 }, (_, k) => k), 35]) expect(fnv(core.render(s, 3.3, 1)!), 'slot ' + s).not.toBe(golden.still[s])
  })

  it('the DNA Forest is redrawn from the rules of its picture: at angle 0 only the stars and the object by the explorer differ', () => {
    const o = Dna.background()
    Dna.helices(o, null)
    let n = 0
    for (let y = 0; y < 140; y++) for (let x = 0; x < LIFE_W; x++) { const i = (y * LIFE_W + x) * 4; if (o[i] !== stills[9][i] || o[i + 1] !== stills[9][i + 1] || o[i + 2] !== stills[9][i + 2]) n++ }
    expect(n).toBeLessThan(600) // 40 stars and a 32 x 14 object; a helix that was a pixel off would add thousands
  })
})

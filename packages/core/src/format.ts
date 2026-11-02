import { sizeOfU } from './scoring'

const UNITS: [number, string][] = [
  [1.0, 'm'], [1e-2, 'cm'], [1e-3, 'mm'], [1e-6, 'µm'], [1e-9, 'nm'], [1e-12, 'pm'], [1e-15, 'fm'],
  [1e-18, 'am'], [1e-21, 'zm'], [1e-24, 'ym'], [1e-27, 'rm'], [1e-30, 'qm'],
]

/** Python-style round(): halves go to the even neighbour (the design tool this was ported from used it). */
export function pyRound(x: number): number {
  const f = Math.floor(x), d = x - f
  if (Math.abs(d - 0.5) < 1e-12) return f % 2 === 0 ? f : f + 1
  return Math.round(x)
}

export function unitOf(x: number): [number, string] {
  for (const [s, n] of UNITS) if (x >= s * (1 - 1e-9)) return [s, n]
  return UNITS[UNITS.length - 1]
}

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
export function sup(n: number): string {
  return (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map((c) => SUP[Number(c)]).join('')
}

function stripZero(v: string): string {
  return v.endsWith('.0') ? v.slice(0, -2) : v
}

/** "54 cm", "1.7 µm", "170 am", or "1.7 × 10⁻³² m" below the last metric prefix (quecto, 10⁻³⁰ m). */
export function fmtSize(x: number, compact = false): string {
  if (x < 0.99999e-30) {
    let e = Math.floor(Math.log10(x * 1.0000001))
    let m = x / Math.pow(10, e)
    if (pyRound(m * 10) / 10 >= 10) { m /= 10; e += 1 }
    const v = stripZero(m.toFixed(1))
    return compact ? v + '×10' + sup(e) : v + ' × 10' + sup(e) + ' m'
  }
  const [s, n] = unitOf(x * 1.0000001)
  const m = x / s
  let v: string
  if (m < 9.95) v = m.toFixed(1)
  else if (m < 99.5) v = String(pyRound(m))
  else v = String(pyRound(m / 10) * 10)
  return stripZero(v) + ' ' + n
}

export function fmtU(u: number): string {
  return fmtSize(sizeOfU(u))
}

/** a round number of metres for the scale bar: 1, 2 or 5 times a power of ten, about 1.2x the explorer's size */
export function niceBar(sizeM: number): number {
  const x = 1.2 * sizeM
  const e = Math.floor(Math.log10(x))
  const m = x / Math.pow(10, e)
  return (m >= 5 ? 5 : m >= 2 ? 2 : 1) * Math.pow(10, e)
}

/** The label for the divide-by stamp of a dive from depth u0 to u1. Inside worlds 1 to 20 it is the tier's own label. */
export function factorLabel(tierFactor: string, points: number, u0: number, u1: number): string | null {
  const d = u1 - u0
  if (d < 1e-9) return null
  if (Math.abs(d - points / 20) < 1e-9) return tierFactor
  const x = Math.pow(10, d)
  if (x < 1e6) {
    const sig = x >= 100 ? Math.pow(10, Math.floor(Math.log10(x)) - 1) : 1
    return '÷ ' + (Math.round(x / sig) * sig).toLocaleString('en-US')
  }
  let e = Math.floor(Math.log10(x))
  let m = x / Math.pow(10, e)
  if (Number(m.toFixed(1)) >= 10) { m = 1; e += 1 }
  return '÷ ' + stripZero(m.toFixed(1)) + '×10' + sup(e)
}

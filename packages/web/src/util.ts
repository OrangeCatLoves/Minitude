/** Small maths helpers shared by the drawing and timeline code (ported from the design tool, same formulas). */
export type RGB = [number, number, number]

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x)
export function smooth(a: number, b: number, x: number): number {
  const v = clamp01((x - a) / (b - a))
  return v * v * (3 - 2 * v)
}
export const easeOut = (x: number): number => { const v = clamp01(x); return 1 - (1 - v) ** 3 }
export const easeInOut = (x: number): number => { const v = clamp01(x); return v * v * (3 - 2 * v) }
export function backOut(x: number, s = 1.9): number {
  const v = clamp01(x) - 1
  return 1 + v * v * ((s + 1) * v + s)
}
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/** colour scaled by k, clamped (the design tool's ck) */
export function ck(c: ArrayLike<number>, k: number): RGB {
  const f = (v: number) => Math.max(0, Math.min(255, Math.trunc(v * k)))
  return [f(c[0]), f(c[1]), f(c[2])]
}
export function lerpc(a: ArrayLike<number>, b: ArrayLike<number>, t: number): RGB {
  const u = clamp01(t)
  return [Math.trunc(a[0] + (b[0] - a[0]) * u), Math.trunc(a[1] + (b[1] - a[1]) * u), Math.trunc(a[2] + (b[2] - a[2]) * u)]
}
export const rgb = (c: ArrayLike<number>): string => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`
export const rgba = (c: ArrayLike<number>, a: number): string => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`

/** Deterministic random table: the same (seed, n, m) always gives the same n x m numbers in 0..1. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rndCache = new Map<string, Float32Array>()
export interface RndTable { get(k: number, j: number): number }
export function rnd(seed: number, n: number, m: number): RndTable {
  const key = `${seed}:${n}:${m}`
  let arr = rndCache.get(key)
  if (!arr) {
    const r = mulberry32(seed * 2654435761 + 12345)
    arr = new Float32Array(n * m)
    for (let i = 0; i < arr.length; i++) arr[i] = r()
    rndCache.set(key, arr)
  }
  const a = arr
  return { get: (k, j) => a[k * m + j] }
}
export function seededRand(seed: number): () => number {
  return mulberry32(seed)
}

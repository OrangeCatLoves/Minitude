/**
 * The living worlds: a little movement in every world picture (the owner reviewed and chose the designs, 16 Nov 2026).
 *
 * How it fits the engine: the picture of the world the camera is IN is drawn again every frame at its own 320 x 180 pixels (a pure function of
 * the time since the camera arrived and of the picture) and handed to gl.ts as one extra texture layer. The next world, seen through the zoom
 * window during a dive, is the still picture; when the camera lands, the amount of life starts at 0 (the still picture exactly) and grows to
 * 1 over RAMP seconds, so nothing jumps.
 */
import { World } from './engine'
import { designFor } from './designs'

export const LIFE_W = 320
export const LIFE_H = 180
/** seconds for a world to come alive after the camera arrives */
export const RAMP = 1.5

const smooth01 = (u: number): number => { u = u < 0 ? 0 : u > 1 ? 1 : u; return u * u * (3 - 2 * u) }

/** The part with no browser in it (tests use it): prepares pictures and draws frames. */
export class LifeCore {
  /** every frame is drawn into this one buffer (RGBA, 320 x 180) */
  readonly out = new Uint8ClampedArray(LIFE_W * LIFE_H * 4)
  private readonly worlds = new Map<number, World | null>()

  constructor(private readonly pixelsOf: (slot: number) => Uint8ClampedArray) {}

  has(slot: number): boolean { return this.worlds.has(slot) }

  /** cut the picture's moving objects out (once per slot; takes from a few to about 80 ms) */
  prepare(slot: number): void {
    if (this.worlds.has(slot)) return
    const d = designFor(slot)
    if (!d) { this.worlds.set(slot, null); return }
    const w = new World(slot, this.pixelsOf(slot), this.out)
    d.setup(w)
    this.worlds.set(slot, w)
  }

  /** the picture of a slot at time t (seconds) with the amount of life k (0 = the original picture exactly, 1 = as reviewed); null if it has no design */
  render(slot: number, t: number, k: number): Uint8ClampedArray | null {
    if (!this.worlds.has(slot)) this.prepare(slot)
    const w = this.worlds.get(slot)
    if (!w) return null
    w.begin()
    designFor(slot)!.draw(w, t, k)
    return this.out
  }
}

export interface LiveFrame {
  /** RGBA, 320 x 180 */
  pixels: Uint8ClampedArray
  /** false when this is the frame already given last time (nothing to upload) */
  fresh: boolean
}

/** The game's side: knows which world the camera is in, keeps its clock, prepares the pictures while the browser is idle. */
export class WorldLife {
  readonly enabled: boolean
  private readonly core: LifeCore
  private slot = -1
  private since = 0
  private lastAt = -Infinity
  private shown = false
  /** how long a frame takes to draw, in ms (a running average): slow devices get fewer new frames a second */
  private cost = 0

  constructor(scenes: HTMLImageElement[], enabled?: boolean) {
    // people who ask their device for less motion get the still pictures; ?still=1 does the same (for test scripts)
    this.enabled = enabled ?? !(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('still'))
    const canvas = document.createElement('canvas')
    canvas.width = LIFE_W
    canvas.height = LIFE_H
    const g = canvas.getContext('2d', { willReadFrequently: true })!
    this.core = new LifeCore((slot) => {
      g.clearRect(0, 0, LIFE_W, LIFE_H)
      g.drawImage(scenes[slot], 0, 0)
      return g.getImageData(0, 0, LIFE_W, LIFE_H).data
    })
    if (this.enabled) this.prepareNext()
  }

  /** prepare one picture at a time while the browser has nothing else to do, so that landing in a world never has to wait for it */
  private prepareNext(): void {
    let next = -1
    for (let s = 0; s < 36; s++) if (!this.core.has(s)) { next = s; break }
    if (next < 0) return
    const run = (): void => {
      try { this.core.prepare(next) } catch (e) { console.error('[minitude] could not prepare the living picture of slot ' + next + ':', e); return }
      this.prepareNext()
    }
    const idle = (window as unknown as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => void }).requestIdleCallback
    if (idle) idle(run, { timeout: 1500 })
    else setTimeout(run, 80)
  }

  /** The living picture of the world the camera is in (z = camera position in worlds, T = the game clock in seconds), or null when the still
   *  picture should be shown (switched off, or that picture is not prepared yet). */
  frame(z: number, T: number): LiveFrame | null {
    if (!this.enabled) return null
    const j = Math.min(35, Math.max(0, Math.floor(z + 1e-9)))
    if (j !== this.slot || T < this.since) { this.slot = j; this.since = T; this.shown = false }
    if (!this.core.has(j)) { this.since = T; return null } // its clock starts when it is ready
    const t = T - this.since
    const step = this.cost > 10 ? 1 / 15 : this.cost > 3 ? 1 / 30 : 0
    if (this.shown && T >= this.lastAt && T - this.lastAt < step - 1e-4) return { pixels: this.core.out, fresh: false }
    const t0 = performance.now()
    let pixels: Uint8ClampedArray | null = null
    try { pixels = this.core.render(j, t, smooth01(t / RAMP)) } catch (e) { console.error('[minitude] living picture of slot ' + j + ':', e) }
    if (!pixels) { this.shown = false; return null }
    this.cost += (performance.now() - t0 - this.cost) * 0.1
    this.lastAt = T
    this.shown = true
    return { pixels, fresh: true }
  }
}

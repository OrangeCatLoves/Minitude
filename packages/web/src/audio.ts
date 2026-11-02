/**
 * Sound. The v5 sound design (ported from the design tool's numpy synth), made live with WebAudio so there are no audio files.
 *
 * - Every sound is built from a few primitives (tone, bell, band-limited noise, riser, pad) at an absolute time.
 * - When the judge answers, the whole schedule of that question (roll ticks, sting, charge, dive, landing, card) is queued by game time;
 *   each frame the queue releases what is due in the next 0.25 s, so the sound stays locked to the picture.
 * - The six rarity stings are rendered once into buffers (OfflineAudioContext) after the first click.
 * - The Planck Foam finale has its own bus that is not ducked or compressed; the normal mix drops away under it.
 * - A quiet drone follows the depth of the camera.
 */
import { CHARGE, FIN_BEATS, STOP } from './config'
import { seededRand } from './util'
import { prof, type Cam, type Rec, type Timeline } from './timeline'
import { displaySlot, worldOfSlot } from '@minitude/core'
import type { SoundHook } from './game'

const SR = 44100
const LOOK = 0.25
const TAU2 = Math.PI * 2

type Ctx = BaseAudioContext
type Kind = 'sine' | 'square' | 'tri' | 'saw'

interface Rig {
  ctx: Ctx
  noise: AudioBuffer
  waves: Map<string, PeriodicWave>
}

function makeNoise(ctx: Ctx): AudioBuffer {
  const n = Math.floor(ctx.sampleRate * 4)
  const b = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = b.getChannelData(0)
  const r = seededRand(7)
  // sum of two uniforms: a little closer to Gaussian than a single one
  for (let i = 0; i < n; i++) d[i] = (r() + r() - 1) * 1.2
  return b
}
function wave(R: Rig, key: string, imag: number[]): PeriodicWave {
  let w = R.waves.get(key)
  if (!w) {
    w = R.ctx.createPeriodicWave(new Float32Array(imag.length), new Float32Array(imag), { disableNormalization: true })
    R.waves.set(key, w)
  }
  return w
}
const curve = (n: number, f: (x: number) => number): Float32Array<ArrayBuffer> => {
  const a = new Float32Array(Math.max(2, n))
  for (let i = 0; i < a.length; i++) a[i] = f(i / (a.length - 1))
  return a
}

/** where a voice's output goes: straight to the bus, or through a panner (the original used a cos/sin law that is 1.414 louder than WebAudio's) */
function route(R: Rig, dst: AudioNode, pan: number): { node: AudioNode; k: number } {
  if (!pan) return { node: dst, k: 1 }
  const p = R.ctx.createStereoPanner()
  p.pan.value = Math.max(-1, Math.min(1, pan))
  p.connect(dst)
  return { node: p, k: 1.414 }
}

function oscNode(R: Rig, kind: Kind, f: number, at: number, dur: number, f2?: number): OscillatorNode {
  const o = R.ctx.createOscillator()
  if (kind === 'saw') o.setPeriodicWave(wave(R, 'saw', [0, 0.6, 0.3, 0.2, 0.15, 0.12, 0.1]))
  else o.type = kind === 'tri' ? 'triangle' : kind
  o.frequency.setValueAtTime(f, at)
  if (f2 !== undefined && f2 !== f) o.frequency.linearRampToValueAtTime(f2, at + dur)
  o.start(at)
  o.stop(at + dur + 0.02)
  return o
}
/** envelope: linear attack to vol, then exp(-t/d) */
function expEnv(g: AudioParam, at: number, a: number, d: number, vol: number): void {
  const aa = Math.max(a, 0.001)
  g.setValueAtTime(0, at)
  g.linearRampToValueAtTime(vol * Math.exp(-aa / d), at + aa)
  g.setTargetAtTime(0, at + aa, d)
}

function tone(R: Rig, dst: AudioNode, at: number, f: number, dur: number, kind: Kind, a: number, d: number, vol: number, f2?: number, pan = 0): void {
  const { node, k } = route(R, dst, pan)
  const g = R.ctx.createGain()
  const amp = kind === 'square' ? 0.6 : 1
  expEnv(g.gain, at, a, d, vol * amp * k)
  oscNode(R, kind, f, at, dur, f2).connect(g)
  g.connect(node)
}
const thump = (R: Rig, dst: AudioNode, at: number, f1 = 110, f2 = 45, dur = 0.4, vol = 0.6, d = 0.12, pan = 0): void =>
  tone(R, dst, at, f1, dur, 'sine', 0.002, d, vol, f2, pan)
const tick = (R: Rig, dst: AudioNode, at: number, f = 1900, vol = 0.07, pan = 0): void => tone(R, dst, at, f, 0.02, 'square', 0.001, 0.008, vol, undefined, pan)

function partial(R: Rig, dst: AudioNode, at: number, f: number, dur: number, amp: number, decay: number): void {
  const g = R.ctx.createGain()
  expEnv(g.gain, at, 0.002, decay, amp)
  oscNode(R, 'sine', f, at, dur).connect(g)
  g.connect(dst)
}
function bell(R: Rig, dst: AudioNode, at: number, f: number, dur = 0.7, vol = 0.25, decay = 0.28, pan = 0): void {
  const { node, k } = route(R, dst, pan)
  const v = vol * k
  const tau2 = 1 / (1 / 0.15 + 1 / decay), tau3 = 1 / (1 / 0.08 + 1 / decay)
  partial(R, node, at, f, dur, v, decay)
  partial(R, node, at, f * 2.76, Math.min(dur, tau2 * 6), v * 0.45, tau2)
  partial(R, node, at, f * 4.1, Math.min(dur, tau3 * 6), v * 0.3, tau3)
}

/** band-limited noise through a gain; the caller sets the gain envelope. Level is normalised the way the original's was (peak = 1). */
function noiseBand(R: Rig, dst: AudioNode, at: number, dur: number, lo: number, hi: number, pan = 0): { g: GainNode; k: number } {
  const { node, k } = route(R, dst, pan)
  const src = R.ctx.createBufferSource()
  src.buffer = R.noise
  src.loop = true
  let head: AudioNode = src
  if (lo > 20) {
    const hp = R.ctx.createBiquadFilter()
    hp.type = 'highpass'; hp.frequency.value = lo; hp.Q.value = 0.7071
    head.connect(hp); head = hp
  }
  if (hi < 20000) {
    const lp = R.ctx.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = hi; lp.Q.value = 0.7071
    head.connect(lp); head = lp
  }
  const g = R.ctx.createGain()
  g.gain.value = 0
  head.connect(g)
  g.connect(node)
  src.start(at, (at * 0.37) % 2.5)
  src.stop(at + dur + 0.02)
  // the original normalised its noise to peak = 1 (about 0.26 rms); our buffer is about 0.49 rms in full band
  const bw = Math.max(50, Math.min(hi, 22050) - Math.max(lo, 0)) / 22050
  return { g, k: (0.537 / Math.sqrt(bw)) * k }
}
function noiseExp(R: Rig, dst: AudioNode, at: number, dur: number, lo: number, hi: number, d: number, amp: number, pan = 0): void {
  const { g, k } = noiseBand(R, dst, at, dur, lo, hi, pan)
  g.gain.setValueAtTime(amp * k, at)
  g.gain.setTargetAtTime(0, at, d)
}
function swish(R: Rig, dst: AudioNode, at: number, dur = 0.35, vol = 0.1, pan = 0): void {
  const { g, k } = noiseBand(R, dst, at, dur, 500, 5000, pan)
  g.gain.setValueCurveAtTime(curve(24, (x) => vol * k * Math.sin(Math.PI * x) ** 2), at, dur)
}
function click(R: Rig, dst: AudioNode, at: number, vol = 0.35, pan = 0): void {
  const { node, k } = route(R, dst, pan)
  const g = R.ctx.createGain()
  expEnv(g.gain, at, 0.001, 0.012, 0.7 * vol * k)
  oscNode(R, 'sine', 900, at, 0.05).connect(g)
  g.connect(node)
  noiseExp(R, node, at, 0.05, 2000, 9000, 0.006, 0.5 * vol * k)
}
function riser(R: Rig, dst: AudioNode, at: number, dur: number, f1 = 150, f2 = 1400, vol = 0.25, noise = 0.2): void {
  const o = R.ctx.createOscillator()
  o.setPeriodicWave(wave(R, 'riser', [0, 1, 0.4]))
  o.frequency.setValueAtTime(f1, at)
  o.frequency.exponentialRampToValueAtTime(f2, at + dur)
  o.start(at); o.stop(at + dur + 0.02)
  const g = R.ctx.createGain()
  g.gain.setValueCurveAtTime(curve(40, (x) => vol * x ** 1.6 * Math.min((1 - x) * dur / 0.02, 1)), at, dur)
  o.connect(g); g.connect(dst)
  const nb = noiseBand(R, dst, at, dur, 800, 9000)
  nb.g.gain.setValueCurveAtTime(curve(40, (x) => noise * nb.k * x ** 2.24 * Math.min((1 - x) * dur / 0.02, 1)), at, dur)
}
/** sustained chord: sines with two overtones and a little vibrato. env(t) shapes it over its length (default: swell then decay). */
function pad(R: Rig, dst: AudioNode, at: number, freqs: number[], dur: number, vol = 0.12, a = 0.35, d = 1.6, shape?: (t: number) => number, pan = 0): void {
  const { node, k } = route(R, dst, pan)
  const g = R.ctx.createGain()
  const per = (vol / Math.max(1, freqs.length)) * 2.2 * k
  const f = shape ?? ((t: number) => Math.min(t / a, 1) * Math.exp(-t / d))
  g.gain.setValueCurveAtTime(curve(Math.max(8, Math.ceil(dur * 20)), (x) => per * f(x * dur)), at, dur)
  g.connect(node)
  const lfo = R.ctx.createOscillator()
  lfo.frequency.value = 5
  lfo.start(at); lfo.stop(at + dur + 0.02)
  freqs.forEach((fr, i) => {
    const o = R.ctx.createOscillator()
    o.setPeriodicWave(wave(R, 'pad', [0, 1, 0.35, 0.15]))
    o.frequency.value = fr
    const lg = R.ctx.createGain()
    lg.gain.value = fr * 0.004
    lfo.connect(lg); lg.connect(o.frequency)
    o.start(at); o.stop(at + dur + 0.02)
    o.connect(g)
    void i
  })
}
function sparkles(R: Rig, dst: AudioNode, at: number, dur: number, n: number, notes: number[], vol: number, seed: number, start = 0, decay = 0.45, pan = 0): void {
  const rs = seededRand(seed)
  for (let k = 0; k < n; k++) {
    const t = start + rs() * dur
    const f = notes[Math.floor(rs() * notes.length)]
    bell(R, dst, at + t, f, 0.9, vol * (1 - (0.6 * t) / dur), decay, pan)
  }
}
/** exponential glide with a slow swell: the rising 'light' tone of the finale */
function glide(R: Rig, dst: AudioNode, at: number, f0: number, f1: number, dur: number, play: number, vol: number, a: number, harm = 0.35, pan = 0): void {
  const { node, k } = route(R, dst, pan)
  const o = R.ctx.createOscillator()
  o.setPeriodicWave(wave(R, 'glide' + harm, [0, 1, harm]))
  o.frequency.setValueAtTime(f0, at)
  o.frequency.exponentialRampToValueAtTime(f0 * (f1 / f0) ** (play / dur), at + play)
  o.start(at); o.stop(at + play + 0.02)
  const g = R.ctx.createGain()
  g.gain.setValueCurveAtTime(curve(Math.ceil(play * 12), (x) => { const t = x * play; return vol * k * (t / dur) ** 1.7 * Math.min(t / a, 1) * Math.min((play - t) / 0.1, 1) }), at, play)
  o.connect(g); g.connect(node)
}

// ------------------------------------------------------------------ the six rarity stings
function sting(R: Rig, dst: AudioNode, at: number, ti: number): void {
  const rng = seededRand(40 + ti)
  const t = (x: number) => at + x
  if (ti === 0) {
    tone(R, dst, t(0), 500, 0.22, 'sine', 0.003, 0.08, 0.26, 820)
    thump(R, dst, t(0), 160, 90, 0.2, 0.3, 0.06)
  } else if (ti === 1) {
    ;[659.25, 830.6, 987.77].forEach((f, i) => { bell(R, dst, t(0.085 * i), f, 1.0, 0.22); tone(R, dst, t(0.085 * i), f * 2, 0.4, 'sine', 0.002, 0.08, 0.05) })
    sparkles(R, dst, t(0), 0.6, 6, [2637, 3136, 3520], 0.05, 4, 0.12)
    thump(R, dst, t(0), 130, 70, 0.25, 0.3, 0.07)
  } else if (ti === 2) {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { bell(R, dst, t(0.07 * i), f, 1.1, 0.24); tone(R, dst, t(0.07 * i), f, 0.5, 'tri', 0.003, 0.14, 0.12) })
    noiseExp(R, dst, t(0.02), 0.5, 4500, 11000, 0.2, 0.10)
    thump(R, dst, t(0), 120, 55, 0.4, 0.5, 0.10)
    sparkles(R, dst, t(0), 1.0, 8, [2093, 2637, 3136, 4186], 0.05, 5, 0.2)
  } else if (ti === 3) {
    tone(R, dst, t(0), 2400, 0.28, 'square', 0.002, 0.10, 0.12, 180)
    for (let k = 0; k < 14; k++) noiseExp(R, dst, t(0.05 + rng() * 1.1), 0.03, 2500, 12000, 0.008, 0.12)
    pad(R, dst, t(0.04), [220, 329.6, 440, 523.25, 659.25], 2.6, 0.22, 0.18, 1.1)
    ;[440, 523.25, 659.25, 880, 1046.5].forEach((f, i) => { bell(R, dst, t(0.06 + 0.07 * i), f, 1.2, 0.18); tone(R, dst, t(0.06 + 0.07 * i), f, 0.4, 'tri', 0.003, 0.10, 0.08) })
    thump(R, dst, t(0), 110, 40, 0.7, 0.65, 0.16)
    sparkles(R, dst, t(0), 1.6, 10, [1760, 2093, 2637, 3520], 0.05, 6, 0.3)
  } else if (ti === 4) {
    thump(R, dst, t(0), 150, 42, 0.9, 0.85, 0.22)
    noiseExp(R, dst, t(0), 0.35, 60, 900, 0.10, 0.5)
    ;[261.6, 392.0, 523.25, 659.25, 783.99].forEach((f, i) => tone(R, dst, t(0.02 * i), f, 2.6, 'saw', 0.04, 1.0, 0.16))
    pad(R, dst, t(0.05), [130.8, 196, 261.6, 392, 523.25], 3.2, 0.2, 0.25, 1.4)
    noiseExp(R, dst, t(0.02), 2.2, 3000, 12500, 0.7, 0.22)
    sparkles(R, dst, t(0), 2.6, 18, [1318.5, 1568, 1976, 2349, 2637, 3136], 0.075, 7, 0.15, 0.55)
    ;[1046.5, 1318.5, 1568, 2093].forEach((f, i) => bell(R, dst, t(0.22 + 0.09 * i), f, 1.5, 0.2, 0.5))
  } else {
    tone(R, dst, t(0), 95, 3.0, 'sine', 0.004, 1.2, 0.95, 36)
    noiseExp(R, dst, t(0), 0.25, 60, 1200, 0.08, 0.6)
    noiseExp(R, dst, t(0), 3.0, 1200, 14000, 0.9, 0.36)
    pad(R, dst, t(0), [130.8, 196, 261.6, 329.6, 392, 523.25, 784], 4.6, 0.34, 0.5, 2.0)
    pad(R, dst, t(0), [65.4, 98, 130.8], 4.0, 0.3, 0.3, 1.8)
    sparkles(R, dst, t(0), 3.3, 40, [1046.5, 1174.7, 1318.5, 1568, 1760, 2093, 2349, 2637], 0.14, 8, 0.12, 0.8)
    ;[523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) => bell(R, dst, t(0.14 + 0.08 * i), f, 1.8, 0.22, 0.6))
  }
}

// ------------------------------------------------------------------ the dive
let MAXV = 0
for (let k = 0; k <= 200; k++) MAXV = Math.max(MAXV, prof(k / 200)[1])

function whoosh(R: Rig, dst: AudioNode, at: number, dur: number, dz: number, vol: number): void {
  const total = dur + 0.5
  const N = Math.ceil(total * 40)
  const v = (x: number): number => {
    const t = x * total
    const tau = Math.min(1, t / dur)
    let s = dz === 0 ? 0.6 * Math.sin(Math.PI * tau) ** 2 : prof(tau)[1] / MAXV
    if (t > dur) s *= Math.exp(-(t - dur) / 0.14)
    return Math.max(0, s)
  }
  const fadeIn = (x: number) => Math.min((x * total) / 0.03, 1)
  const bands: [number, number, number, number][] = [[60, 500, 0.55, 0.7], [400, 2500, 0.5, 1.3], [2500, 10000, 0.38, 2.2]]
  for (const [lo, hi, a, p] of bands) {
    const nb = noiseBand(R, dst, at, total, lo, hi)
    nb.g.gain.setValueCurveAtTime(curve(N, (x) => 0.5 * vol * nb.k * a * v(x) ** p * fadeIn(x)), at, total)
  }
  const mk = (base: number, span: number, p: number, amp: number, pf: number, harm: number[]): void => {
    const o = R.ctx.createOscillator()
    o.setPeriodicWave(wave(R, 'wh' + harm.join(), [0, ...harm]))
    o.frequency.setValueCurveAtTime(curve(N, (x) => base + span * v(x) ** p), at, total)
    o.start(at); o.stop(at + total + 0.02)
    const g = R.ctx.createGain()
    g.gain.setValueCurveAtTime(curve(N, (x) => 0.5 * vol * amp * v(x) ** pf * fadeIn(x)), at, total)
    o.connect(g); g.connect(dst)
  }
  mk(120, 700, 1.3, 0.24, 1.1, [1, 0.4167])           // sin(phi) + 0.10/0.24 sin(2 phi), the overtone ratio of the original
  mk(900, 2600, 1.6, 0.07, 2, [1])
}

function finaleA(R: Rig, f: AudioNode, fs: number): void {
  thump(R, f, fs, 120, 45, 0.5, 0.34, 0.14)
  {
    const nb = noiseBand(R, f, fs, 2.6, 150, 3200)
    nb.g.gain.setValueCurveAtTime(curve(40, (x) => 0.16 * nb.k * Math.sin(Math.PI * x) ** 1.5), fs, 2.6)
  }
  tone(R, f, fs + 0.1, 760, 3.2, 'sine', 0.05, 1.5, 0.12, 70)
  // the dark: a sub bed that fades in while the interface dims, and drops out for the held breath
  {
    const len = 11.6
    pad(R, f, fs + 0.6, [55.0, 82.4, 110.0, 164.8], len, 0.055, 2.4, 60.0, (t) => {
      const base = Math.min(t / 2.4, 1) * Math.exp(-t / 60)
      const x = t
      return base * Math.min(x / 2.6, 1) * (1 - Math.min(Math.max((x - 11.0) / 0.5, 0), 1)) * Math.min(Math.max((x - 0.6) / 2.0, 0), 1) * Math.min((len - t) / 0.1, 1)
    })
  }
  // heartbeats, getting a little stronger
  FIN_BEATS.forEach((b, n) => {
    const v = 0.13 + 0.22 * (n / Math.max(1, FIN_BEATS.length - 1)) ** 1.5
    thump(R, f, fs + b, 72, 38, 0.30, v, 0.10)
    thump(R, f, fs + b + 0.17, 64, 34, 0.26, v * 0.72, 0.09)
  })
  // the light: a tone that climbs very slowly, a faint high shimmer, a few single bells
  glide(R, f, fs + 4.0, 196.0, 784.0, 8.4, 8.0, 0.06, 2.0)
  glide(R, f, fs + 4.2, 1175.0, 2349.0, 8.4, 7.8, 0.016, 2.5, 0.1, 0.2)
  const rs = seededRand(321)
  const pick = [1174.7, 1568.0, 1760.0, 2349.0, 2637.0, 3136.0]
  for (let k = 0; k < 16; k++) {
    const at = 3.8 + 8.2 * (k / 16.0) ** 0.85
    bell(R, f, fs + at, pick[Math.floor(rs() * pick.length)], 1.8, 0.016 + (0.030 * k) / 16.0, 0.8, rs() * 1.2 - 0.6)
  }
  // the held breath, then the burst
  tone(R, f, fs + 11.9, 1318.5, 0.9, 'sine', 0.25, 0.5, 0.04)
  riser(R, f, fs + 12.4, 1.0, 220, 3200, 0.30, 0.32)
  pad(R, f, fs + 12.3, [146.83, 220.0, 293.66, 369.99, 440.0, 587.33, 739.99, 880.0], 8.2, 0.36, 1.15, 3.4)
  pad(R, f, fs + 12.3, [73.42, 110.0, 146.83], 6.0, 0.30, 1.0, 2.6)
}

function finaleB(R: Rig, f: AudioNode, fe: number): void {
  // impact
  thump(R, f, fe, 95, 30, 1.6, 1.05, 0.30)
  noiseExp(R, f, fe, 0.6, 50, 1500, 0.14, 0.85)
  noiseExp(R, f, fe, 3.6, 1500, 14000, 1.0, 0.42)
  ;[587.33, 739.99, 880.0, 1174.66, 1479.98, 1760.0, 2349.3, 2959.96].forEach((fr, k) => bell(R, f, fe + 0.03 + 0.09 * k, fr, 2.0, 0.24, 0.8, -0.5 + 0.14 * k))
  sparkles(R, f, fe + 0.1, 4.2, 56, [1174.7, 1480.0, 1760.0, 2349.0, 2960.0, 3520.0], 0.12, 77, 0.0, 0.6)
  pad(R, f, fe + 0.1, [293.66, 440.0, 587.33, 739.99, 880.0], 6.5, 0.20, 0.4, 3.0)
  // under the card: a slow bell line in D major
  ;[587.33, 739.99, 880.0, 1108.73, 880.0, 739.99, 987.77, 1174.66, 880.0].forEach((fr, k) => bell(R, f, fe + 2.0 + 0.8 * k, fr, 1.8, 0.10, 0.8, -0.3 + 0.07 * k))
}

// ------------------------------------------------------------------ the engine
interface Ev { t: number; run: (at: number) => void; tag?: string }

export class Sfx implements SoundHook {
  private ctx: Ctx | null = null
  private R!: Rig
  private main!: GainNode      // the ordinary mix
  private duck!: GainNode      // ducked under the finale
  private fin!: GainNode       // finale stems
  private master!: GainNode
  private stings: (AudioBuffer | null)[] = [null, null, null, null, null, null]
  private q: Ev[] = []
  private drone: { f: OscillatorNode[]; mult: number[]; air: GainNode; k: number } | null = null
  private cardPads = new Map<number, GainNode>()
  private offline = false
  private _muted = false
  private lastKey = 0

  constructor(ctx?: Ctx) {
    try { this._muted = localStorage.getItem('minitude.muted') === '1' } catch { /* storage blocked */ }
    if (ctx) { this.ctx = ctx; this.offline = true; this.build(ctx) }
  }
  get muted(): boolean { return this._muted }
  setMuted(m: boolean): void {
    this._muted = m
    try { localStorage.setItem('minitude.muted', m ? '1' : '0') } catch { /* storage blocked */ }
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.03)
  }

  unlock(): void {
    if (this.ctx) { if (this.ctx.state === 'suspended' && 'resume' in this.ctx) void (this.ctx as AudioContext).resume(); return }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    try {
      const ctx = new AC({ latencyHint: 'interactive' })
      this.ctx = ctx
      this.build(ctx)
      void ctx.resume()
      void this.renderStings()
    } catch { this.ctx = null }
  }

  private build(ctx: Ctx): void {
    this.R = { ctx, noise: makeNoise(ctx), waves: new Map() }
    this.master = ctx.createGain()
    this.master.gain.value = this._muted ? 0 : 1
    // soft limiter after everything (the original used tanh)
    const lim = ctx.createWaveShaper()
    lim.curve = curve(2048, (x) => Math.tanh((x * 2 - 1) * 1.1))
    lim.oversample = '2x'
    this.master.connect(ctx.destination)
    lim.connect(this.master)
    const post = ctx.createGain()
    post.gain.value = 0.5
    post.connect(lim)
    // ordinary mix: main -> duck -> compressor -> post, plus a short reverb
    this.main = ctx.createGain()
    this.duck = ctx.createGain()
    this.main.connect(this.duck)
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -30; comp.knee.value = 28; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.35
    const makeup = ctx.createGain()
    makeup.gain.value = 1.0
    this.duck.connect(comp)
    comp.connect(makeup)
    makeup.connect(post)
    this.fin = ctx.createGain()
    this.fin.gain.value = 1.5
    const conv = ctx.createConvolver()
    conv.normalize = false
    conv.buffer = this.impulse(ctx)
    const sendMain = ctx.createGain(); sendMain.gain.value = 0.16
    const sendFin = ctx.createGain(); sendFin.gain.value = 0.30
    const wet = ctx.createGain()
    this.duck.connect(sendMain); sendMain.connect(conv)
    this.fin.connect(sendFin); sendFin.connect(conv)
    conv.connect(wet); wet.connect(post)
    this.fin.connect(post)
    this.master.gain.value = this._muted ? 0 : 1
    if (!this.offline) this.startDrone(ctx as AudioContext)
  }
  private impulse(ctx: Ctx): AudioBuffer {
    const n = Math.floor(ctx.sampleRate * 1.6)
    const b = ctx.createBuffer(2, n, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c)
      const r = seededRand(5 + c)
      let sum = 0
      const ramp = Math.floor(0.012 * ctx.sampleRate)
      for (let i = 0; i < n; i++) {
        const t = i / ctx.sampleRate
        d[i] = (r() * 2 - 1) * Math.exp(-t / 0.28) * (i < ramp ? i / ramp : 1)
        sum += Math.abs(d[i])
      }
      const k = 1 / (sum * 0.12)   // the original normalised the response so that sum |ir| = 1 / 0.12
      for (let i = 0; i < n; i++) d[i] *= k
    }
    return b
  }
  private async renderStings(): Promise<void> {
    for (let ti = 0; ti < 6; ti++) {
      try {
        const off = new OfflineAudioContext(2, Math.ceil(5.4 * SR), SR)
        const R: Rig = { ctx: off, noise: makeNoise(off), waves: new Map() }
        sting(R, off.destination, 0, ti)
        this.stings[ti] = await off.startRendering()
      } catch { this.stings[ti] = null }
    }
  }

  // ---- drone
  private startDrone(ctx: AudioContext): void {
    const out = ctx.createGain()
    out.gain.value = 0
    out.gain.linearRampToValueAtTime(1, ctx.currentTime + 2)
    out.connect(this.main)
    const base = ctx.createGain()
    base.gain.value = 0.0225
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.16
    const lg = ctx.createGain(); lg.gain.value = 0.0075
    lfo.connect(lg); lg.connect(base.gain); lfo.start()
    base.connect(out)
    const mult = [1.0, 1.5, 2.0, 3.01]
    const amp = [1.0, 0.55, 0.4, 0.18]
    const f = mult.map((m, i) => {
      const o = ctx.createOscillator(); o.frequency.value = 82.4 * m
      const g = ctx.createGain(); g.gain.value = amp[i]
      o.connect(g); g.connect(base); o.start()
      return o
    })
    const nb = noiseBand(this.R, out, ctx.currentTime, 36000, 300, 3000)
    nb.g.gain.value = 0.0025 * nb.k
    this.drone = { f, mult, air: nb.g, k: nb.k }
  }

  // ---- queue
  private push(t: number, run: (at: number) => void, tag?: string): void {
    if (this.offline) { run(t); return }
    this.q.push({ t, run, tag })
    this.q.sort((a, b) => a.t - b.t)
  }
  private drop(tag: string): void { this.q = this.q.filter((e) => e.tag !== tag) }
  private put(t: number, fn: (R: Rig, dst: AudioNode, at: number) => void, tag?: string): void { this.push(t, (at) => fn(this.R, this.main, at), tag) }
  private putFin(t: number, fn: (R: Rig, dst: AudioNode, at: number) => void, tag?: string): void { this.push(t, (at) => fn(this.R, this.fin, at), tag) }

  frame(T: number, cam: Cam, _tl: Timeline, phase: 'title' | 'run' | 'report'): void {
    const ctx = this.ctx
    if (!ctx || this.offline) return
    const now = ctx.currentTime
    while (this.q.length && this.q[0].t <= T + LOOK) {
      const e = this.q.shift()!
      if (e.t < T - 0.12) continue            // too late to be worth playing
      e.run(now + Math.max(0, e.t - T))
    }
    if (this.drone) {
      const f0 = Math.max(30, 82.4 * 2 ** (-cam.u / 9))
      this.drone.f.forEach((o, i) => o.frequency.setTargetAtTime(f0 * this.drone!.mult[i], now, 0.08))
      this.drone.air.gain.setTargetAtTime((0.0025 + 0.0075 * cam.s) * this.drone.k * (phase === 'report' ? 0.5 : 1), now, 0.1)
    }
  }
  reset(): void { this.q = []; this.cardPads.clear() }

  // ---- direct (not scheduled ahead): the player's own actions
  private live(fn: (R: Rig, dst: AudioNode, at: number) => void): void {
    if (!this.ctx) return
    fn(this.R, this.main, this.ctx.currentTime + 0.005)
  }
  key(): void {
    const n = performance.now()
    if (n - this.lastKey < 25) return
    this.lastKey = n
    this.live((R, d, at) => tick(R, d, at, 1700 + Math.random() * 700, 0.09, (Math.random() - 0.5) * 0.6))
  }
  invalid(): void {
    this.live((R, d, at) => { tone(R, d, at, 200, 0.2, 'square', 0.003, 0.09, 0.13, 120); tick(R, d, at, 900, 0.08) })
  }
  lock(_r: Rec): void {
    this.live((R, d, at) => { click(R, d, at, 0.55, 0.2); thump(R, d, at + 0.02, 150, 90, 0.15, 0.25, 0.05) })
  }
  press(T: number): void {
    this.put(T, (R, d, at) => { click(R, d, at, 0.5, 0.3); bell(R, d, at + 0.05, 1046.5, 0.8, 0.18); bell(R, d, at + 0.05, 1568, 0.9, 0.12, 0.28, 0.2) })
    this.put(T + 0.35, (R, d, at) => swish(R, d, at, 0.5, 0.11, -0.3))
    this.put(T + 1.1, (R, d, at) => swish(R, d, at, 0.5, 0.10, 0.4))
  }
  question(r: Rec): void {
    this.put(r.start, (R, d, at) => { swish(R, d, at, 0.5, 0.12, -0.3); tone(R, d, at + 0.1, 440, 0.12, 'sine', 0.003, 0.05, 0.08, undefined, -0.2) })
  }
  miss(r: Rec, T: number): void {
    this.put(T, (R, d, at) => { tone(R, d, at, 330, 0.35, 'tri', 0.005, 0.14, 0.2, 150); thump(R, d, at, 110, 60, 0.3, 0.3, 0.1) })
    void r
  }
  /** a world card was tapped away: its sounds stop and the closing swish plays now */
  skip(r: Rec, _T: number): void {
    this.drop('card' + r.i)
    this.drop('card' + r.i + 'end')
    this.live((R, d, at) => swish(R, d, at, 0.4, 0.07, -0.2))
    const g = this.cardPads.get(r.i)
    if (g && this.ctx) { g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12); this.cardPads.delete(r.i) }
  }
  report(at: number, perfect: boolean): void {
    this.put(at, (R, d, t0) => { swish(R, d, t0, 0.6, 0.13) })
    this.put(at + 0.4, (R, d, t0) => swish(R, d, t0, 0.5, 0.1, 0.4))
    for (let k = 0; k < 14; k++) this.put(at + 0.7 + k * 0.07, (R, d, t0) => tick(R, d, t0, 1100 + 70 * k, 0.06, 0.3))
    for (let i = 0; i < 7; i++) {
      this.put(at + 1.0 + 0.28 * i, (R, d, t0) => { tick(R, d, t0, 1300 + 120 * i, 0.10, -0.3 + 0.1 * i); bell(R, d, t0, 1046.5 * 1.12 ** i, 0.25, 0.05, 0.28, -0.3 + 0.1 * i) })
    }
    this.put(at + 3.4, (R, d, t0) => {
      ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(R, d, t0 + 0.09 * i, f, 1.8, 0.22))
      tone(R, d, t0, 130.8, 1.4, 'tri', 0.01, 0.5, 0.3)
      if (perfect) sparkles(R, d, t0 + 0.2, 1.6, 12, [2093, 2637, 3136, 3520], 0.06, 99)
    })
  }

  // ---- everything that follows a judged answer
  scheduled(r: Rec, _T: number, tl: Timeline): void {
    const ti = r.ti
    // checking, valid
    for (let k = 0; k < 6; k++) this.put(r.chk + 0.08 * k, (R, d, at) => tick(R, d, at, 1100 + 140 * k, 0.07, 0.3))
    this.put(r.val, (R, d, at) => { bell(R, d, at, 1318.5, 0.5, 0.14, 0.28, 0.2); bell(R, d, at + 0.07, 1760, 0.6, 0.12, 0.28, 0.25) })
    // the rarity roll
    const steps = tl.rollStepTimes(r)
    steps.forEach((ts, k) => {
      const last = k >= steps.length - 3
      this.put(ts, (R, d, at) => {
        tick(R, d, at, 1250 + 40 * (k % 6), 0.10, -0.2 + 0.08 * (k % 6))
        if (last) tone(R, d, at, 220, 0.05, 'sine', 0.001, 0.02, 0.12)
      })
    })
    if (ti === 5) {
      this.put(r.rev - 1.2, (R, d, at) => riser(R, d, at, 1.2, 120, 1800, 0.22, 0.25))
      for (let k = 0; k < 3; k++) this.put(r.rev - 1.0 + 0.4 * k, (R, d, at) => { thump(R, d, at, 90, 50, 0.2, 0.35, 0.06); thump(R, d, at + 0.17, 80, 45, 0.2, 0.28, 0.06) })
    } else if (ti === 4) this.put(r.rev - 0.7, (R, d, at) => riser(R, d, at, 0.7, 180, 1500, 0.15, 0.15))
    // reveal sting after the hit-stop
    this.push(r.rev + STOP[ti], (at) => {
      const b = this.stings[ti]
      if (b && this.ctx) {
        const s = this.ctx.createBufferSource(); s.buffer = b
        const g = this.ctx.createGain(); g.gain.value = 0.9
        s.connect(g); g.connect(this.main); s.start(at)
      } else sting(this.R, this.main, at, ti)
    })
    // point count-up
    for (let k = 0; k < 10; k++) this.put(r.rev + 0.2 + k * 0.07, (R, d, at) => tick(R, d, at, 1300 + 70 * k, 0.07, 0.3))
    this.put(r.rev + 0.95, (R, d, at) => tone(R, d, at, 220, 0.16, 'sine', 0.003, 0.06, 0.20, 150))
    this.put(r.rev + 0.5, (R, d, at) => swish(R, d, at, 0.4, 0.07, -0.3))
    // charge-up and the stamp
    this.put(r.chg - 0.02, (R, d, at) => swish(R, d, at, 0.35, 0.07, -0.4))
    this.put(r.chg, (R, d, at) => riser(R, d, at, CHARGE, 120, 1300 + 120 * ti, 0.22, 0.25))
    this.put(r.chg + 0.05, (R, d, at) => { thump(R, d, at, 130, 40, 0.5, 0.62, 0.14); noiseExp(R, d, at, 0.12, 800, 6000, 0.03, 0.25) })
    this.put(r.chg + 0.45, (R, d, at) => { bell(R, d, at, 1568 + 100 * ti, 0.6, 0.15, 0.28, 0.1); tone(R, d, at, 300, 0.2, 'sine', 0.002, 0.07, 0.15, 900) })
    if (r.fin) {
      this.scheduleFinale(r)
      return
    }
    // the dive
    this.put(r.fs, (R, d, at) => { whoosh(R, d, at, r.dur, r.dz, 0.95); thump(R, d, at, 180, 60, 0.35, 0.4, 0.09) })
    for (const [tcx, slot] of tl.crossTimes(r)) {
      const k = slot - r.z0
      this.put(tcx, (R, d, at) => {
        const p = k % 2 ? 0.3 : -0.3
        tone(R, d, at, 700 + 95 * k, 0.14, 'sine', 0.002, 0.05, 0.20, undefined, p)
        tone(R, d, at, 1400 + 190 * k, 0.14, 'sine', 0.002, 0.03, 0.08, undefined, p)
        bell(R, d, at, 1046.5 * 1.06 ** k, 0.5, 0.10)
        thump(R, d, at, 100, 60, 0.15, 0.18, 0.05)
      })
    }
    // landing
    this.put(r.fe, (R, d, at) => {
      thump(R, d, at, 95, 35, 0.6, r.dz > 0 ? 0.85 : 0.5, 0.15)
      noiseExp(R, d, at, 0.25, 100, 2500, 0.07, r.dz > 0 ? 0.35 : 0.2)
      bell(R, d, at + 0.02, 880, 0.8, 0.18); bell(R, d, at + 0.12, 1320, 0.8, 0.14, 0.28, 0.2)
    })
    if (r.cardOn) this.scheduleCard(r)
  }

  private scheduleCard(r: Rec): void {
    const nm = worldOfSlot(displaySlot(r.z1)).name
    const tag = 'card' + r.i
    this.put(r.card, (R, d, at) => swish(R, d, at, 0.6, 0.10, 0.2), tag)
    this.push(r.card, (at) => {
      if (!this.ctx) return
      const g = this.ctx.createGain()
      g.connect(this.main)
      this.cardPads.set(r.i, g)
      pad(this.R, g, at, [220, 329.6, 440, 554.4], r.clen - 1.0, 0.12, 0.3, 2.4)
    }, tag)
    ;[...nm].forEach((ch, k) => { if (ch !== ' ') this.put(r.card + 0.12 + 0.05 * k, (R, d, at) => tick(R, d, at, 2000 + 25 * (k % 7), 0.06, 0.4 - 0.08 * (k % 10)), tag) })
    this.put(r.card + 0.12 + 0.05 * nm.length + 0.1, (R, d, at) => sparkles(R, d, at, 0.8, 5, [2093, 2637, 3136], 0.07, 20 + r.i), tag)
    this.put(r.card + 3.9, (R, d, at) => sparkles(R, d, at, 0.8, 3, [2093, 2637, 3136], 0.05, 40 + r.i), tag)
    this.put(r.card + r.clen - 0.55, (R, d, at) => swish(R, d, at, 0.5, 0.07, -0.2), tag + 'end')
  }

  private scheduleFinale(r: Rec): void {
    // launch to burst is built when the dive starts, the impact when it ends (one burst of nodes each, not 13 s early)
    this.push(r.fs, (at) => finaleA(this.R, this.fin, at))
    this.push(r.fe - 0.3, (at) => finaleB(this.R, this.fin, at + 0.3))
    // duck the ordinary mix under it, bring it back after the impact
    const sm = (x: number) => x * x * (3 - 2 * x)
    this.push(r.fs + 0.5, (at) => { this.duck.gain.cancelScheduledValues(at); this.duck.gain.setValueCurveAtTime(curve(30, (x) => 1 - 0.97 * sm(x)), at, 1.9) })
    this.push(r.fe + 0.5, (at) => { this.duck.gain.cancelScheduledValues(at); this.duck.gain.setValueCurveAtTime(curve(30, (x) => 0.03 + 0.97 * sm(x)), at, 1.2) })
    // the card (the normal mix is back by then)
    const nm = 'PLANCK FOAM'
    const tag = 'card' + r.i
    this.put(r.card, (R, d, at) => swish(R, d, at, 0.6, 0.10, 0.2), tag)
    ;[...nm].forEach((ch, k) => { if (ch !== ' ') this.put(r.card + 0.15 + 0.06 * k, (R, d, at) => tick(R, d, at, 2000 + 25 * (k % 7), 0.06, 0.4 - 0.08 * (k % 10)), tag) })
    this.put(r.card + 1.1, (R, d, at) => sparkles(R, d, at, 0.8, 5, [2093, 2637, 3136], 0.07, 90), tag)
    this.put(r.card + 4.6, (R, d, at) => sparkles(R, d, at, 0.8, 3, [2093, 2637, 3136], 0.05, 91), tag)
    this.put(r.card + r.clen - 0.55, (R, d, at) => swish(R, d, at, 0.5, 0.07, -0.2), tag + 'end')
  }

  // ---- offline test hook: render everything queued so far into a buffer
  get context(): Ctx | null { return this.ctx }
}

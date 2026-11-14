/* SINGULARITY SOUNDS (draft). Everything is synthesised live, like the game's own sound (no audio files).
 *
 *   singularity()  ~6 s   the reveal.  1) THE PULL: a rising drone, a rush of air drawn inward, a whistle falling away and a heartbeat that
 *                                         speeds up. 2) THE VACUUM: everything drops out for a heartbeat.  3) THE BIRTH: a deep boom, a crash of light and
 *                                         a cluster of glass bells.  4) THE BLOOM: a rising glass arpeggio, a pad, thirty-odd sparkles.
 *                                         5) THE SETTLE: a warm major-ninth chord, and the +120 count-up ticks.
 *   collect()      ~1.2 s the gem flying into the cabinet: a rising swish, a glass "tink", a soft thud.
 *   tick()/blip()           small interface sounds.
 *
 * The same functions can be rendered offline to a WAV file (render()), which is how the video gets its sound.
 * The helpers (tone, bell, noise, thump) copy the game's audio.ts approach so the sounds can move into the game later.
 */
(function () {
  'use strict'
  const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

  function makeRig(ctx, seed = 7) {
    const R = { ctx, rnd: mulberry(seed) }
    // one second of white noise, reused by every whoosh
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0)
    for (let i = 0; i < nd.length; i++) nd[i] = R.rnd() * 2 - 1
    R.noise = nb
    // a bright, glassy room for the bells
    const len = Math.floor(ctx.sampleRate * 2.6), ir = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (R.rnd() * 2 - 1) * Math.pow(1 - i / len, 3.1) * (i < 90 ? i / 90 : 1) }
    const conv = ctx.createConvolver(); conv.buffer = ir
    const wet = ctx.createGain(); wet.gain.value = 0.42
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.25
    const master = ctx.createGain(); master.gain.value = 0.9
    const dry = ctx.createGain(); dry.gain.value = 1
    dry.connect(comp); conv.connect(wet); wet.connect(comp); comp.connect(master)
    R.dry = dry; R.send = conv; R.master = master; R.out = master
    return R
  }

  // ------------------------------------------------------------------ building blocks
  function env(g, at, a, d, vol) { g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), at + a); g.gain.exponentialRampToValueAtTime(0.0001, at + a + d) }
  function route(R, pan, reverb) {
    const p = R.ctx.createStereoPanner ? R.ctx.createStereoPanner() : null
    if (p) { p.pan.value = pan || 0; p.connect(R.dry); if (reverb) { const s = R.ctx.createGain(); s.gain.value = reverb; p.connect(s); s.connect(R.send) } return p }
    return R.dry
  }
  function tone(R, at, f, dur, type, a, d, vol, f2, pan, reverb) {
    const o = R.ctx.createOscillator(), g = R.ctx.createGain()
    o.type = type; o.frequency.setValueAtTime(f, at)
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + dur)
    env(g, at, a, d, vol); o.connect(g); g.connect(route(R, pan, reverb))
    o.start(at); o.stop(at + a + d + 0.05)
  }
  /** a struck glass bell: four partials that are not whole multiples of each other, which is what makes it sound like glass or metal */
  function bell(R, at, f, dur, vol, pan, reverb = 0.7) {
    const ratios = [1, 2.76, 5.4, 8.93], amps = [1, 0.46, 0.2, 0.09], decays = [1, 0.62, 0.38, 0.22]
    ratios.forEach((r, i) => { if (f * r < 15000) tone(R, at, f * r, dur, 'sine', 0.002, dur * decays[i], vol * amps[i], undefined, pan, reverb) })
  }
  function noise(R, at, dur, lo, hi, vol, shape = 'swell', pan = 0, q = 1.2) {
    const s = R.ctx.createBufferSource(); s.buffer = R.noise; s.loop = true
    const f = R.ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q
    f.frequency.setValueAtTime(lo, at); f.frequency.exponentialRampToValueAtTime(hi, at + dur)
    const g = R.ctx.createGain()
    if (shape === 'swell') { g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + dur * 0.85); g.gain.linearRampToValueAtTime(0.0001, at + dur) }
    else { g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur) }
    s.connect(f); f.connect(g); g.connect(route(R, pan, 0.2)); s.start(at, R.rnd() * 1.5); s.stop(at + dur + 0.05)
  }
  const thump = (R, at, f1, f2, dur, vol) => tone(R, at, f1, dur, 'sine', 0.003, dur * 0.8, vol, f2, 0, 0)
  const tick = (R, at, f, vol, pan) => tone(R, at, f, 0.03, 'square', 0.001, 0.014, vol, undefined, pan || 0, 0)

  // ------------------------------------------------------------------ the sounds. Each takes the rig and a start time and returns its length in seconds.
  const C = { C4: 261.63, G4: 392, E5: 659.25, C5: 523.25, G5: 783.99, B5: 987.77, D6: 1174.66, C6: 1046.5, E6: 1318.5, G6: 1568, A6: 1760, C7: 2093, D7: 2349.3, G7: 3136 }

  function singularity(R, t0 = 0) {
    const rnd = R.rnd
    // 1 THE PULL (0 to 1.2 s)
    { const o = R.ctx.createOscillator(), f = R.ctx.createBiquadFilter(), g = R.ctx.createGain()
      o.type = 'sawtooth'; o.frequency.setValueAtTime(55, t0); o.frequency.exponentialRampToValueAtTime(130, t0 + 1.2)
      f.type = 'lowpass'; f.frequency.setValueAtTime(180, t0); f.frequency.exponentialRampToValueAtTime(2200, t0 + 1.2); f.Q.value = 4
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.2, t0 + 1.15); g.gain.setValueAtTime(0.2, t0 + 1.18); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.24)
      o.connect(f); f.connect(g); g.connect(R.dry); o.start(t0); o.stop(t0 + 1.3) }
    noise(R, t0, 1.2, 6500, 260, 0.2, 'swell', 0, 0.9)
    tone(R, t0 + 0.05, 2600, 1.1, 'sine', 0.2, 0.9, 0.05, 140, 0.15, 0.4)
    ;[0.18, 0.58, 0.88, 1.06].forEach((t, i) => thump(R, t0 + t, 78 - i * 6, 38, 0.22, 0.34 + 0.05 * i))
    // 2 THE VACUUM (1.2 to 1.32 s): nothing at all
    // 3 THE BIRTH (1.32 s)
    const b = t0 + 1.32
    thump(R, b, 64, 27, 1.9, 0.85)
    tone(R, b, 32, 2.4, 'sine', 0.01, 1.8, 0.4, undefined, 0, 0)
    noise(R, b, 1.3, 9000, 380, 0.34, 'burst', 0, 0.6)
    bell(R, b + 0.01, C.G5, 2.6, 0.2, -0.2); bell(R, b + 0.01, C.C7, 2.2, 0.15, 0.25); bell(R, b + 0.03, C.G6, 2.4, 0.16, 0.05)
    // 4 THE BLOOM (1.45 to 3.4 s)
    const arp = [C.C6, C.D6, C.G6, C.A6, C.C7, C.D7, C.G7]
    arp.forEach((f, i) => { const at = b + 0.14 + i * 0.115, v = 0.13 - i * 0.008, pan = (i % 2 ? 1 : -1) * (0.15 + 0.07 * i); tone(R, at, f, 1.6, 'sine', 0.003, 1.5, v, undefined, pan, 0.8); tone(R, at, f * 2.001, 1.0, 'triangle', 0.003, 0.9, v * 0.3, undefined, pan, 0.8) })
    ;[C.C4, C.G4, C.E5].forEach((f, i) => {
      const o = R.ctx.createOscillator(), g = R.ctx.createGain(), lfo = R.ctx.createOscillator(), lg = R.ctx.createGain()
      o.type = 'sine'; o.frequency.value = f; lfo.frequency.value = 4.5 + i * 0.7; lg.gain.value = f * 0.004
      lfo.connect(lg); lg.connect(o.frequency)
      g.gain.setValueAtTime(0.0001, b + 0.1); g.gain.linearRampToValueAtTime(0.075, b + 0.7); g.gain.exponentialRampToValueAtTime(0.0001, b + 3.6)
      o.connect(g); g.connect(route(R, (i - 1) * 0.3, 0.6)); o.start(b + 0.1); lfo.start(b + 0.1); o.stop(b + 3.7); lfo.stop(b + 3.7)
    })
    for (let i = 0; i < 34; i++) { const at = b + 0.25 + rnd() * 2.6, f = 3000 + rnd() * 6200; tone(R, at, f, 0.5, 'sine', 0.002, 0.18 + rnd() * 0.3, 0.025 + rnd() * 0.04 * (1 - (at - b) / 3), undefined, rnd() * 2 - 1, 0.9) }
    // 5 THE SETTLE (from 3.0 s)
    const s = b + 1.7
    ;[C.C5, C.E5, C.G5, C.B5, C.D6].forEach((f, i) => bell(R, s + i * 0.05, f, 2.6, 0.1, (i - 2) * 0.25))
    tone(R, s, 65.4, 2.4, 'sine', 0.05, 1.9, 0.22, undefined, 0, 0)
    for (let k = 0; k < 12; k++) tick(R, b + 0.95 + k * 0.07, 1300 + 70 * k, 0.05, 0.3)   // the +120 counting up
    return 5.8
  }

  function collect(R, t0 = 0) {
    noise(R, t0, 0.3, 1400, 6000, 0.12, 'swell', -0.4, 1.5)
    bell(R, t0 + 0.3, C.G6, 1.1, 0.2, 0.2); bell(R, t0 + 0.36, C.C7, 1.0, 0.16, 0.3)
    thump(R, t0 + 0.32, 120, 58, 0.3, 0.38)
    for (let k = 0; k < 5; k++) tone(R, t0 + 0.4 + k * 0.05, 4200 + k * 600, 0.3, 'sine', 0.002, 0.2, 0.03, undefined, 0.2 * (k % 2 ? 1 : -1), 0.9)
    return 1.6
  }
  const hover = (R, t0 = 0) => { bell(R, t0, C.E6, 0.4, 0.06, 0, 0.3); return 0.5 }
  const blip = (R, t0 = 0) => { tone(R, t0, 880, 0.08, 'triangle', 0.003, 0.07, 0.07, 1320, 0, 0.1); return 0.2 }
  const SOUNDS = { singularity, collect, hover, blip }

  // ------------------------------------------------------------------ live playback
  let live = null, muted = false
  function ensure() {
    if (live) { if (live.ctx.state === 'suspended') live.ctx.resume(); return live }
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const R = makeRig(ctx, 11)
    R.out.connect(ctx.destination)
    // the video recorder listens here too
    R.tap = ctx.createMediaStreamDestination(); R.out.connect(R.tap)
    live = R
    return R
  }
  function play(name, delay = 0) {
    if (muted) return 0
    const R = ensure()
    return SOUNDS[name](R, R.ctx.currentTime + 0.03 + delay)
  }

  // ------------------------------------------------------------------ offline render to WAV (for listening without the page, and for the video)
  async function render(name, seconds, seed = 11) {
    const sr = 44100, ctx = new OfflineAudioContext(2, Math.ceil(sr * seconds), sr)
    const R = makeRig(ctx, seed); R.out.connect(ctx.destination)
    SOUNDS[name](R, 0.05)
    return ctx.startRendering()
  }
  function toWav(buf) {
    const ch = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate, bytes = new ArrayBuffer(44 + n * ch * 2), v = new DataView(bytes)
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
    w(0, 'RIFF'); v.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true)
    v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * ch * 2, true)
    const d = []; for (let c = 0; c < ch; c++) d.push(buf.getChannelData(c))
    let o = 44
    for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, d[c][i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2 }
    return bytes
  }
  window.Sound = { play, ensure, render, toWav, setMuted: (m) => { muted = m }, isMuted: () => muted, makeRig, SOUNDS, get live() { return live } }
})()

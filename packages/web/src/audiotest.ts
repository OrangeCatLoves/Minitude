/** Test helper (only loaded with ?manual=1): renders the sound of a whole scripted run offline and reports its levels. */
import { nextRecord, type RunRecord } from '@minitude/core'
import { Sfx } from './audio'
import { newRec, schedule, Timeline } from './timeline'

export async function renderRun(tiers: number[], tail = 6): Promise<{ seconds: number; peak: number; rms: number; p999: number; perSecond: [number, number][]; pcm11k: string; ends: number[] }> {
  const SR = 44100
  const seconds = 5 + tiers.length * 22 + 20 + tail
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * SR), SR)
  const sfx = new Sfx(ctx)
  const tl = new Timeline()
  const recs: RunRecord[] = []
  let start = 5
  const ends: number[] = []
  for (let i = 0; i < tiers.length; i++) {
    const prev = recs[i - 1]
    const r = newRec(i, start, prev ? prev.c1 : 0, prev ? prev.u1 : 0, prev ? prev.z1 : 0)
    tl.recs.push(r)
    const core = nextRecord(recs, tiers[i])
    r.answer = 'Test'
    schedule(r, core, { lock: start + 3, respondedAt: start + 3.1 })
    recs.push(core)
    sfx.question(r)
    sfx.scheduled(r, start + 3.1, tl)
    start = r.next
    ends.push(start)
  }
  sfx.report(start, true)
  const buf = await ctx.startRendering()
  const L = buf.getChannelData(0), R = buf.getChannelData(1)
  let peak = 0, sum = 0
  const n = L.length
  const abs = new Float32Array(Math.floor(n / 7))
  const per: [number, number][] = []
  let sr = 0, sp = 0, cnt = 0
  for (let i = 0; i < n; i++) {
    const a = Math.max(Math.abs(L[i]), Math.abs(R[i]))
    peak = Math.max(peak, a)
    const e = (L[i] * L[i] + R[i] * R[i]) / 2
    sum += e; sr += e; cnt++; sp = Math.max(sp, a)
    if (i % 7 === 0 && i / 7 < abs.length) abs[i / 7] = a
    if (cnt === SR) { per.push([Math.sqrt(sr / cnt), sp]); sr = 0; sp = 0; cnt = 0 }
  }
  abs.sort()
  const p999 = abs[Math.floor(abs.length * 0.999)]
  // mono, 11.025 kHz, 16 bit
  const m = Math.floor(n / 4)
  const pcm = new Int16Array(m)
  for (let i = 0; i < m; i++) { let s = 0; for (let k = 0; k < 4; k++) s += L[i * 4 + k] + R[i * 4 + k]; pcm[i] = Math.max(-32768, Math.min(32767, Math.round((s / 8) * 32767))) }
  let bin = ''
  const u8 = new Uint8Array(pcm.buffer)
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000))
  return { seconds, peak, rms: Math.sqrt(sum / n), p999, perSecond: per, pcm11k: btoa(bin), ends }
}

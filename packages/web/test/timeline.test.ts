import { describe, expect, it } from 'vitest'
import { nextRecord, type RunRecord } from '@minitude/core'
import { makeMiss, newRec, schedule, Timeline } from '../src/timeline'

/** Plays a run through the same steps the game takes: a question appears, then it is answered with a tier (0 to 5) or times out (null). */
function play(steps: (number | null)[]): { tl: Timeline; core: RunRecord[] } {
  const tl = new Timeline()
  const core: RunRecord[] = []
  let start = 1.5
  steps.forEach((tier, i) => {
    const prev = core[i - 1]
    const r = newRec(i, start, prev ? prev.c1 : 0, prev ? prev.u1 : 0, prev ? prev.z1 : 0)
    tl.recs.push(r)
    const c = nextRecord(core, tier)
    core.push(c)
    if (tier === null) makeMiss(r, start + 30, c)
    else schedule(r, c, { lock: start + 5, respondedAt: start + 5.5 })
    start = r.next
  })
  return { tl, core }
}

describe('camera over a whole run', () => {
  it('dives from where the player is, after answers only', () => {
    const { tl } = play([2, 3])
    const second = tl.recs[1]
    const mid = tl.cam(second.fs + second.dur * 0.5)
    expect(mid.z).toBeGreaterThan(second.z0 + 0.5)
    expect(mid.z).toBeLessThan(second.z1)
    expect(tl.cam(second.fe + 0.01).z).toBeCloseTo(second.z1, 5)
  })

  it('still dives after questions that timed out (the camera must not freeze at the first time-out)', () => {
    const { tl, core } = play([2, null, null, 5])
    const last = tl.recs[3]
    expect(core[3].z0).toBe(2)
    expect(core[3].z1).toBe(7)
    const before = tl.cam(last.fs - 0.01)
    const mid = tl.cam(last.fs + last.dur * 0.5)
    const after = tl.cam(last.fe + 0.01)
    expect(before.z).toBeCloseTo(2, 5)
    expect(mid.z).toBeGreaterThan(3)
    expect(mid.z).toBeLessThan(7)
    expect(after.z).toBeCloseTo(7, 5)
    // the size follows the same dive
    expect(mid.u).toBeGreaterThan(before.u)
    expect(after.u).toBeCloseTo(core[3].u1, 5)
  })

  it('holds still on a time-out and keeps the position it had', () => {
    const { tl, core } = play([3, null])
    const miss = tl.recs[1]
    const during = tl.cam(miss.start + 10)
    expect(during.z).toBeCloseTo(core[0].z1, 5)
    expect(during.u).toBeCloseTo(core[0].u1, 5)
    expect(during.s).toBe(0)
    // after the last question the camera rests where the run ended
    const end = tl.cam(miss.next + 5)
    expect(end.z).toBeCloseTo(core[0].z1, 5)
    expect(end.u).toBeCloseTo(core[0].u1, 5)
  })

  it('dives after a time-out that comes first', () => {
    const { tl, core } = play([null, 4])
    const second = tl.recs[1]
    expect(tl.cam(second.fs + second.dur * 0.5).z).toBeGreaterThan(core[1].z0 + 0.5)
    expect(tl.cam(second.fe + 0.01).z).toBeCloseTo(core[1].z1, 5)
  })

  it('every dive of a run with time-outs in between moves the camera', () => {
    const { tl } = play([1, null, 3, null, 2, 0, null, 4])
    for (const r of tl.recs) {
      if (r.miss || r.dz === 0) continue
      const a = tl.cam(r.fs + r.dur * 0.2).z, b = tl.cam(r.fs + r.dur * 0.6).z
      expect(b).toBeGreaterThan(a)
      expect(tl.cam(r.fe + 0.01).z).toBeCloseTo(r.z1, 5)
    }
  })
})

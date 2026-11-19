import { describe, expect, it } from 'vitest'
import { nextRecord, type RunRecord } from '@minitude/core'
import { makeMiss, newRec, pullStart, schedule, Timeline } from '../src/timeline'
import { GEM_PULL, ROLL_DUR } from '../src/config'

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
    const { tl, core } = play([3, null, null, 5])
    const last = tl.recs[3]
    expect(core[3].z0).toBe(2)
    expect(core[3].z1).toBe(5)
    const before = tl.cam(last.fs - 0.01)
    const mid = tl.cam(last.fs + last.dur * 0.5)
    const after = tl.cam(last.fe + 0.01)
    expect(before.z).toBeCloseTo(2, 5)
    expect(mid.z).toBeGreaterThan(2.5)
    expect(mid.z).toBeLessThan(5)
    expect(after.z).toBeCloseTo(5, 5)
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

describe('a gem (tier 6)', () => {
  it('the world is pulled in before the gem is born; the roll stops on Mythic', () => {
    const { tl } = play([6])
    const r = tl.recs[0]
    expect(r.ti).toBe(6)
    expect(r.pts).toBe(120)
    // roll, then the pull, then the reveal
    expect(r.rev).toBeCloseTo(r.roll + ROLL_DUR[6] + GEM_PULL, 6)
    expect(pullStart(r)).toBeCloseTo(r.roll + ROLL_DUR[6], 6)
    // the roll ends on the Mythic icon (index 5), never on a seventh one
    expect(tl.rollPos(r, r.roll + ROLL_DUR[6] + 1) % 6).toBeCloseTo(5, 6)
    const steps = tl.rollStepTimes(r)
    expect(steps.length).toBe(17)
    expect(steps[steps.length - 1]).toBeLessThanOrEqual(pullStart(r) + 1e-9)
  })
  it('the reveal fits before the next question and nothing is not-a-number', () => {
    const { tl } = play([6, 0])
    const [a, b] = tl.recs
    for (const k of ['roll', 'rev', 'chg', 'fs', 'fe', 'next', 'dotAt'] as const) expect(Number.isFinite(a[k]), k).toBe(true)
    expect(a.rev).toBeLessThan(a.chg)
    expect(a.chg).toBeLessThan(a.fs)
    expect(a.next).toBeGreaterThan(a.fe)
    expect(b.start).toBe(a.next)
    expect(a.stamp).toBe('÷ 10,000')
    const mid = tl.cam(a.fs + a.dur * 0.5)
    expect(Number.isFinite(mid.u) && Number.isFinite(mid.z)).toBe(true)
    expect(tl.cam(a.fe + 0.01).z).toBe(a.z1)
  })
  it('other tiers keep their schedule (no pull)', () => {
    const { tl } = play([5])
    const r = tl.recs[0]
    expect(r.rev).toBeCloseTo(r.roll + ROLL_DUR[5], 6)
  })
  it('a gem can cross the Planck finale like any 120 points (the first gem lands at 620, inside the unexplored stretch; the second crosses 700)', () => {
    const { tl, core } = play([5, 5, 5, 5, 5, 6, 6])
    expect(core[5].finale).toBe(false)
    expect(tl.recs[5].fin).toBe(false)
    expect(Number.isFinite(tl.recs[5].next)).toBe(true) // a dive through the dark pictures still has a schedule
    expect(core[6].finale).toBe(true)
    expect(tl.recs[6].fin).toBe(true)
    expect(Number.isFinite(tl.recs[6].next)).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { nextRecord, type RunRecord, pickPostFirst, POST_FIRST_LINES, buildReport, shareText, isPerfect } from '../src'

function play(tiers: (number | null)[]): RunRecord[] {
  const recs: RunRecord[] = []
  for (const t of tiers) recs.push(nextRecord(recs, t))
  return recs
}

describe('the edging hint', () => {
  it('4 Mythic, two Exotic, Rare: the card, the two hints, then Planck Foam at 560 (Planck Foam is 555 since 16 Nov 2026)', () => {
    const r = play([5, 5, 5, 5, 3, 3, 2])
    expect(r[3].c1).toBe(400)
    expect(r[3].voidStreak).toBe(1)
    expect(r[3].hintLevel).toBe(0)
    expect(r[4].c1).toBe(460)
    expect(r[4].voidStreak).toBe(2)
    expect(r[4].hintLevel).toBe(1)
    expect(r[5].c1).toBe(520)
    expect(r[5].hintLevel).toBe(2)
    expect(r[5].finale).toBe(false)
    expect(r[6].c1).toBe(560)
    expect(r[6].finale).toBe(true)
  })
  it('lands at 400, then 420: second landing in a row gets the hint (440, the old edge of Planck Foam, is just another landing now)', () => {
    const r = play([5, 5, 5, 5, 1, 1])
    expect(r[3].c1).toBe(400)
    expect(r[4].c1).toBe(420)
    expect(r[4].voidStreak).toBe(2)
    expect(r[4].hintLevel).toBe(1)
    expect(r[5].c1).toBe(440)
    expect(r[5].voidStreak).toBe(3)
    expect(r[5].hintLevel).toBe(2)
    expect(r[5].finale).toBe(false)
  })
  it('third landing in a row gets the stronger line', () => {
    const r = play([5, 5, 5, 5, 0, 0, 0])
    expect(r.map((x) => x.hintLevel)).toEqual([0, 0, 0, 0, 1, 2, 2])
    expect(r[6].c1).toBe(430)
  })
  it('a run that never reaches the void has no hints', () => {
    expect(play([0, 0, 0, 0, 0, 0, 0]).every((x) => x.hintLevel === 0)).toBe(true)
  })
  it('the unexplored stretch can no longer be skipped: even a gem from 380 only gets 120 of its 155 points', () => {
    const r = play([5, 5, 5, 4])
    expect(r[3].c1).toBe(380)
    const r2 = play([5, 5, 5, 4, 6])
    expect(r2[4].c1).toBe(500)
    expect(r2[4].finale).toBe(false)
    expect(r2[4].voidStreak).toBe(1)
    expect(r2[4].dz).toBe(29 - 19) // from the last world's picture (slot 19) to the dark picture at slot 29
  })
  it('a missed answer in the void keeps the streak but gives no hint', () => {
    const r = play([5, 5, 5, 5, null, 0])
    expect(r[4].hintLevel).toBe(0)
    expect(r[5].voidStreak).toBe(2)
    expect(r[5].hintLevel).toBe(1)
  })
})

describe('after the finale', () => {
  it('after a finale on answer 5 (only gems can get there that fast now), answers 6 and 7 are post answers', () => {
    const r = play([6, 6, 6, 6, 6, 0, 0])
    expect(r[4].c1).toBe(600)
    expect(r[4].finale).toBe(true)
    expect(r[4].post).toBe(0)
    expect(r[5].post).toBe(1)
    expect(r[6].post).toBe(2)
    expect(r[6].c1).toBe(620)
    expect(r[6].dz).toBe(0)
  })
  it('without gems the finale comes on answer 6 at the earliest (five Mythic answers are 500), so there is at most one answer after it', () => {
    const r = play([5, 5, 5, 5, 5, 5, 0])
    expect(r[4].c1).toBe(500)
    expect(r[4].finale).toBe(false)
    expect(r[5].finale).toBe(true)
    expect(r[6].post).toBe(1)
    const last = play([4, 4, 4, 4, 4, 4, 4]) // seven Legendary: the finale is the very last answer
    expect(last[6].c1).toBe(560)
    expect(last[6].finale).toBe(true)
    expect(last.filter((x) => x.post > 0).length).toBe(0)
  })
  it('first-line variants never repeat the last one', () => {
    for (let last = 0; last < POST_FIRST_LINES.length; last++) {
      for (let k = 0; k < 50; k++) expect(pickPostFirst(last, Math.random)).not.toBe(last)
    }
  })
})

describe('report', () => {
  it('seven Common answers', () => {
    const rep = buildReport(play([0, 0, 0, 0, 0, 0, 0]))
    expect(rep.total).toBe(70)
    expect(rep.bigSize).toBe('540 µm')
    expect(rep.compare).toBe('Smaller than a grain of rice.')
    expect(rep.worldLine).toBe('70 / 840 points · world 4 of 21')
  })
  it('seven Exotic answers miss Planck Foam by 135', () => {
    const rep = buildReport(play([3, 3, 3, 3, 3, 3, 3]))
    expect(rep.total).toBe(420)
    expect(rep.extraLine).toBe('Planck Foam was 135 points away')
    expect(rep.worldLine).toContain('unexplored')
  })
  it('perfect run', () => {
    const recs = play([5, 5, 5, 5, 5, 5, 5])
    expect(isPerfect(recs)).toBe(true)
    const rep = buildReport(recs)
    expect(rep.total).toBe(700)
    expect(rep.extraLine).toBe('145 points past the edge') // 700 - 555
    expect(rep.bigSize.startsWith('< ')).toBe(true)
  })
  it('share text has no answers in it', () => {
    const t = shareText(play([0, 1, 2, 3, 4, 5, 0]))
    expect(t).toContain('MINITUDE')
    expect(t.split('\n').length).toBe(3)
  })
})

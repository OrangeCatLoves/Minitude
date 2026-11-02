import { describe, expect, it } from 'vitest'
import { nextRecord, type RunRecord, pickPostFirst, POST_FIRST_LINES, buildReport, shareText, isPerfect } from '../src'

function play(tiers: (number | null)[]): RunRecord[] {
  const recs: RunRecord[] = []
  for (const t of tiers) recs.push(nextRecord(recs, t))
  return recs
}

describe('the edging hint', () => {
  it('4 Mythic, Rare, Uncommon: card, hint, Planck Foam (the example sent to the player)', () => {
    const r = play([5, 5, 5, 5, 2, 1])
    expect(r[3].c1).toBe(400)
    expect(r[3].voidStreak).toBe(1)
    expect(r[3].hintLevel).toBe(0)
    expect(r[4].c1).toBe(440)
    expect(r[4].finale).toBe(true)
  })
  it('lands at 400, then 420: second landing in a row gets the hint', () => {
    const r = play([5, 5, 5, 5, 1, 1])
    expect(r[3].c1).toBe(400)
    expect(r[4].c1).toBe(420)
    expect(r[4].voidStreak).toBe(2)
    expect(r[4].hintLevel).toBe(1)
    expect(r[5].c1).toBe(440)
    expect(r[5].finale).toBe(true)
  })
  it('third landing in a row gets the stronger line', () => {
    const r = play([5, 5, 5, 5, 0, 0, 0])
    expect(r.map((x) => x.hintLevel)).toEqual([0, 0, 0, 0, 1, 2, 2])
    expect(r[6].c1).toBe(430)
  })
  it('a run that never reaches the void has no hints', () => {
    expect(play([0, 0, 0, 0, 0, 0, 0]).every((x) => x.hintLevel === 0)).toBe(true)
  })
  it('crossing in one go skips the void entirely', () => {
    const r = play([5, 5, 5, 4])
    expect(r[3].c1).toBe(380)
    const r2 = play([5, 5, 5, 4, 3])
    expect(r2[4].finale).toBe(true)
    expect(r2[4].dz).toBe(35 - 19)
  })
  it('a missed answer in the void keeps the streak but gives no hint', () => {
    const r = play([5, 5, 5, 5, null, 0])
    expect(r[4].hintLevel).toBe(0)
    expect(r[5].voidStreak).toBe(2)
    expect(r[5].hintLevel).toBe(1)
  })
})

describe('after the finale', () => {
  it('answers 6 and 7 are post answers', () => {
    const r = play([5, 5, 5, 5, 2, 0, 0])
    expect(r[4].finale).toBe(true)
    expect(r[4].post).toBe(0)
    expect(r[5].post).toBe(1)
    expect(r[6].post).toBe(2)
    expect(r[6].c1).toBe(460)
    expect(r[6].dz).toBe(0)
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
    expect(rep.worldLine).toBe('70 / 700 points · world 4 of 21')
  })
  it('seven Exotic answers miss Planck Foam by 20', () => {
    const rep = buildReport(play([3, 3, 3, 3, 3, 3, 3]))
    expect(rep.total).toBe(420)
    expect(rep.extraLine).toBe('Planck Foam was 20 points away')
    expect(rep.worldLine).toContain('unexplored')
  })
  it('perfect run', () => {
    const recs = play([5, 5, 5, 5, 5, 5, 5])
    expect(isPerfect(recs)).toBe(true)
    const rep = buildReport(recs)
    expect(rep.total).toBe(700)
    expect(rep.extraLine).toBe('260 points past the edge')
    expect(rep.bigSize.startsWith('< ')).toBe(true)
  })
  it('share text has no answers in it', () => {
    const t = shareText(play([0, 1, 2, 3, 4, 5, 0]))
    expect(t).toContain('MINITUDE')
    expect(t.split('\n').length).toBe(3)
  })
})

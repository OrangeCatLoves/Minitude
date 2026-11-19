import { describe, expect, it } from 'vitest'
import { nextRecord, type RunRecord, pickPostFirst, POST_FIRST_LINES, buildReport, shareText, isPerfect } from '../src'

function play(tiers: (number | null)[]): RunRecord[] {
  const recs: RunRecord[] = []
  for (const t of tiers) recs.push(nextRecord(recs, t))
  return recs
}

describe('the edging hint', () => {
  it('the card, then the two hints (five gems reach 600 on answer 5; the hints need the player to stay inside Unexplored, 600 to 699)', () => {
    const r = play([6, 6, 6, 6, 6, 1, 1])
    expect(r[4].c1).toBe(600)
    expect(r[4].voidStreak).toBe(1)
    expect(r[4].hintLevel).toBe(0)
    expect(r[5].c1).toBe(630)
    expect(r[5].voidStreak).toBe(2)
    expect(r[5].hintLevel).toBe(1)
    expect(r[6].c1).toBe(660)
    expect(r[6].hintLevel).toBe(2)
    expect(r[6].finale).toBe(false)
  })
  it('five Mythic, an Exotic and a Rare end exactly on the edge of Unexplored: the card, no hint yet', () => {
    const r = play([5, 5, 5, 5, 5, 3, 2])
    expect(r[5].c1).toBe(560)
    expect(r[6].c1).toBe(600)
    expect(r[6].voidStreak).toBe(1)
    expect(r[6].hintLevel).toBe(0)
  })
  it('third landing in a row gets the stronger line', () => {
    const r = play([6, 6, 6, 6, 6, 0, 0])
    expect(r.map((x) => x.hintLevel)).toEqual([0, 0, 0, 0, 0, 1, 2])
    expect(r[6].c1).toBe(640)
  })
  it('a run that never reaches the void has no hints', () => {
    expect(play([0, 0, 0, 0, 0, 0, 0]).every((x) => x.hintLevel === 0)).toBe(true)
  })
  it('unexplored is only 100 points wide, so a gem from the end of world 20 skips it (580 + 120 = 700) and a Mythic from 600 does too', () => {
    const r = play([5, 5, 5, 5, 5, 4, 6])
    expect(r[5].c1).toBe(580)
    expect(r[6].c1).toBe(700)
    expect(r[6].finale).toBe(true)
    expect(r[6].voidStreak).toBe(0)
    expect(r[6].dz).toBe(35 - 19) // from the last world's picture (slot 19) to Planck Foam (slot 35)
    const r2 = play([6, 6, 6, 6, 6, 5])
    expect(r2[4].c1).toBe(600)
    expect(r2[5].c1).toBe(700)
    expect(r2[5].finale).toBe(true)
  })
  it('a missed answer in the void keeps the streak but gives no hint', () => {
    const r = play([6, 6, 6, 6, 6, null, 0])
    expect(r[5].hintLevel).toBe(0)
    expect(r[6].voidStreak).toBe(2)
    expect(r[6].hintLevel).toBe(1)
  })
})

describe('after the finale', () => {
  it('after a finale on answer 6 (six gems; no run without gems gets there before the last answer), answer 7 is a post answer', () => {
    const r = play([6, 6, 6, 6, 6, 6, 1])
    expect(r[5].c1).toBe(720)
    expect(r[5].finale).toBe(true)
    expect(r[5].post).toBe(0)
    expect(r[6].post).toBe(1)
    expect(r[6].c1).toBe(750)
    expect(r[6].dz).toBe(0)
  })
  it('without gems the finale is the very last answer: seven Mythic answers make exactly 700', () => {
    const r = play([5, 5, 5, 5, 5, 5, 5])
    expect(r[5].c1).toBe(600)
    expect(r[5].finale).toBe(false)
    expect(r[6].c1).toBe(700)
    expect(r[6].finale).toBe(true)
    expect(r.filter((x) => x.post > 0).length).toBe(0)
    const near = play([5, 5, 5, 5, 5, 5, 4]) // six Mythic and a Legendary: 680, no finale
    expect(near[6].c1).toBe(680)
    expect(near[6].finale).toBe(false)
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
    expect(rep.total).toBe(140)
    expect(rep.bigSize).toBe('37 µm')
    expect(rep.compare).toBe('Smaller than a grain of table salt.')
    expect(rep.worldLine).toBe('140 / 840 points · world 5 of 21')
  })
  it('six Mythic answers and a Common are in Unexplored and miss Planck Foam by 80', () => {
    const rep = buildReport(play([5, 5, 5, 5, 5, 5, 0]))
    expect(rep.total).toBe(620)
    expect(rep.extraLine).toBe('Planck Foam was 80 points away')
    expect(rep.worldLine).toContain('unexplored')
  })
  it('seven Legendary answers stay in world 19', () => {
    const rep = buildReport(play([4, 4, 4, 4, 4, 4, 4]))
    expect(rep.total).toBe(560)
    expect(rep.worldLine).toBe('560 / 840 points · world 19 of 21')
    expect(rep.extraLine).toBeNull()
  })
  it('perfect run: exactly 700, about one Planck length', () => {
    const recs = play([5, 5, 5, 5, 5, 5, 5])
    expect(isPerfect(recs)).toBe(true)
    const rep = buildReport(recs)
    expect(rep.total).toBe(700)
    expect(rep.compare).toBe('About one Planck length.')
    expect(rep.bigSize).toBe('1.7 × 10⁻³⁵ m')
    expect(rep.extraLine).toBeNull()
  })
  it('a run with gems goes past the edge', () => {
    const rep = buildReport(play([6, 6, 6, 6, 6, 6, 6]))
    expect(rep.total).toBe(840)
    expect(rep.extraLine).toBe('140 points past the edge') // 840 - 700
    expect(rep.bigSize.startsWith('< ')).toBe(true)
  })
  it('share text has no answers in it', () => {
    const t = shareText(play([0, 1, 2, 3, 4, 5, 0]))
    expect(t).toContain('MINITUDE')
    expect(t.split('\n').length).toBe(3)
  })
})

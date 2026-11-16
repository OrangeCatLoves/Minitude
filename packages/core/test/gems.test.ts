import { describe, expect, it } from 'vitest'
import {
  addGem, buildReport, cabinetView, emptyCabinet, gemsFound, GEM_TIER, isPerfect, MAX_POINTS, MAX_POINTS_DISPLAY, nextRecord, parseCabinet,
  serializeCabinet, shareText, TIERS, type GemEntry, type RunRecord,
} from '../src'

function play(tiers: (number | null)[]): RunRecord[] {
  const recs: RunRecord[] = []
  for (const t of tiers) recs.push(nextRecord(recs, t))
  return recs
}
const gem = (id: string, category = 'Science', extra: Partial<GemEntry> = {}): GemEntry => ({ id, category, prompt: 'Name a mineral', answer: 'Otwayite', desc: 'A rare mineral.', day: '2026-11-14', ...extra })

describe('the seventh tier', () => {
  it('SINGULARITY is tier 6, worth 120, and the best run is 840', () => {
    expect(TIERS.length).toBe(7)
    expect(TIERS[GEM_TIER].name).toBe('SINGULARITY')
    expect(TIERS[GEM_TIER].points).toBe(120)
    expect(MAX_POINTS).toBe(840)
    expect(MAX_POINTS_DISPLAY).toBe(MAX_POINTS)
  })
  it('a gem scores 120 and shrinks the player by six powers of ten (120 / 20)', () => {
    const r = play([GEM_TIER])
    expect(r[0].points).toBe(120)
    expect(r[0].tier).toBe(6)
    expect(r[0].u1).toBe(6)
  })
  it('a gem can carry a dive over several worlds and the finale still plays exactly once', () => {
    const r = play([5, 5, 5, 5, GEM_TIER, GEM_TIER, 0])
    expect(r[3].c1).toBe(400)
    expect(r[4].c1).toBe(520) // still inside the unexplored stretch (it runs to 554): no finale yet
    expect(r[4].finale).toBe(false)
    expect(r[5].c1).toBe(640) // the second gem crosses Planck Foam (555)
    expect(r.filter((x) => x.finale).length).toBe(1)
    expect(r[5].finale).toBe(true)
    expect(r[6].post).toBe(1)
  })
  it('seven gems is 840 and the report counts them', () => {
    const recs = play([6, 6, 6, 6, 6, 6, 6])
    const rep = buildReport(recs)
    expect(rep.total).toBe(840)
    expect(rep.gems).toBe(7)
    expect(rep.perfect).toBe(true)
    expect(rep.worldLine).toContain('/ 840 points')
    expect(rep.extraLine).toBe('285 points past the edge') // 840 - 555
  })
  it('a run of Mythic answers and gems is still perfect; one weaker answer or a miss is not', () => {
    expect(isPerfect(play([5, 5, 6, 5, 5, 5, 5]))).toBe(true)
    expect(isPerfect(play([5, 5, 6, 5, 5, 5, 4]))).toBe(false)
    expect(isPerfect(play([5, 5, 6, 5, 5, 5, null]))).toBe(false)
  })
  it('only SINGULARITY answers count as gems', () => {
    expect(gemsFound(play([5, 6, null, 0, 6, 4, 6]))).toBe(3)
  })
  it('the share text puts a diamond square for a gem and still holds no answers', () => {
    const t = shareText(play([0, 1, 2, 3, 4, 5, 6]))
    expect(t.split('\n')[1]).toBe('⬜🟩🟦🟪🟧🟥💎')
    expect(t.split('\n').length).toBe(3)
  })
})

describe('the gem cabinet', () => {
  it('adds a gem once; the same gem found again is not new', () => {
    const a = addGem(emptyCabinet(), gem('q1'))
    expect(a.isNew).toBe(true)
    expect(a.cabinet.gems.length).toBe(1)
    const b = addGem(a.cabinet, gem('q1', 'Science', { answer: 'something else' }))
    expect(b.isNew).toBe(false)
    expect(b.cabinet.gems.length).toBe(1)
    expect(b.cabinet.gems[0].answer).toBe('Otwayite')
  })
  it('does not change the cabinet it was given', () => {
    const c = emptyCabinet()
    addGem(c, gem('q1'))
    expect(c.gems.length).toBe(0)
  })
  it('saves and reads back', () => {
    const c = addGem(addGem(emptyCabinet(), gem('q1')).cabinet, gem('q2', 'Food')).cabinet
    expect(parseCabinet(serializeCabinet(c))).toEqual(c)
  })
  it('reads nothing, rubbish and the wrong shape as an empty cabinet', () => {
    for (const raw of [null, undefined, '', 'not json', '42', 'null', '{}', '{"gems":5}', '[]']) expect(parseCabinet(raw as string | null).gems).toEqual([])
  })
  it('drops bad entries and duplicates but keeps the good ones', () => {
    const raw = JSON.stringify({ gems: [gem('a'), { id: 'b' }, 7, null, gem('a', 'Food'), gem('c', 'Food', { day: 'yesterday', desc: 5 as unknown as string }), { ...gem('d'), answer: '   ' }] })
    const c = parseCabinet(raw)
    expect(c.gems.map((g) => g.id)).toEqual(['a', 'c'])
    expect(c.gems[1].day).toBe('')
    expect(c.gems[1].desc).toBe('')
  })
  it('cuts overlong text rather than keep it', () => {
    const c = parseCabinet(JSON.stringify({ gems: [gem('a', 'Science', { answer: 'x'.repeat(5000), desc: 'y'.repeat(5000) })] }))
    expect(c.gems[0].answer.length).toBe(160)
    expect(c.gems[0].desc.length).toBe(400)
  })
  it('lays the cabinet out by category with the hidden slots counted', () => {
    const cab = addGem(addGem(emptyCabinet(), gem('q1', 'Science')).cabinet, gem('q2', 'Science')).cabinet
    const v = cabinetView(cab, { total: 5, categories: [{ name: 'Science', total: 3 }, { name: 'Food', total: 2 }] })
    expect(v.found).toBe(2)
    expect(v.total).toBe(5)
    expect(v.categories.map((c) => [c.name, c.found.length, c.locked, c.total])).toEqual([['Science', 2, 1, 3], ['Food', 0, 2, 2]])
  })
  it('keeps a found gem whose category the summary no longer lists, and never shows a negative count', () => {
    const cab = addGem(addGem(emptyCabinet(), gem('q1', 'Old category')).cabinet, gem('q2', 'Science')).cabinet
    const v = cabinetView(cab, { total: 1, categories: [{ name: 'Science', total: 0 }] })
    expect(v.categories.find((c) => c.name === 'Old category')?.found.length).toBe(1)
    expect(v.categories.every((c) => c.locked >= 0)).toBe(true)
    expect(v.total).toBe(2)
  })
  it('works with no summary at all (the server could not be reached)', () => {
    const v = cabinetView(addGem(emptyCabinet(), gem('q1')).cabinet, null)
    expect(v.found).toBe(1)
    expect(v.total).toBe(1)
  })
})

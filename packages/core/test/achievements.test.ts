import { describe, expect, it } from 'vitest'
import {
  ACHIEVEMENTS, achievementById, achievementsView, awardAnswer, backfillFromCabinet, emptyAch, firstOfTier, GEM_TIER, hasAch, parseAch, serializeAch,
  TIERS,
} from '../src'

const DAY = '2026-11-19'

describe('the catalogue', () => {
  it('has fifteen achievements with unique ids: seven firsts and eight gem steps', () => {
    expect(ACHIEVEMENTS.length).toBe(15)
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(15)
    expect(ACHIEVEMENTS.filter((a) => a.group === 'firsts').length).toBe(7)
    expect(ACHIEVEMENTS.filter((a) => a.group === 'gems').length).toBe(8)
  })
  it('has one "first" for every rarity, in rarity order', () => {
    const firsts = ACHIEVEMENTS.filter((a) => a.group === 'firsts')
    expect(firsts.map((a) => a.tier)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(TIERS.length).toBe(7)
    for (let t = 0; t < 7; t++) expect(firstOfTier(t)?.tier).toBe(t)
    expect(firstOfTier(7)).toBeNull()
    expect(firstOfTier(-1)).toBeNull()
  })
  it('has the gem steps 5, 10, 25, 50, 100, 250, 500 and every gem', () => {
    expect(ACHIEVEMENTS.filter((a) => a.group === 'gems').map((a) => a.goal)).toEqual([5, 10, 25, 50, 100, 250, 500, 'all'])
    expect(achievementById('gems-all')?.name).toBe('Singularity Complete')
    expect(achievementById('gems-500')?.name).toBe('Five Hundred Strong')
  })
  it('gives every achievement a name and a text a player can read before earning it', () => {
    for (const a of ACHIEVEMENTS) { expect(a.name.length).toBeGreaterThan(2); expect(a.text).toMatch(/\.$/) }
  })
})

describe('scoring an answer', () => {
  it('earns the first of a rarity once, and only that rarity', () => {
    const a = awardAnswer(emptyAch(), 2, 0, null, DAY)
    expect(a.fresh.map((x) => x.id)).toEqual(['first-rare'])
    expect(a.state.earned['first-rare']).toBe(DAY)
    const b = awardAnswer(a.state, 2, 0, null, '2026-11-20')
    expect(b.fresh).toEqual([])
    expect(b.state.earned['first-rare']).toBe(DAY)           // the day it was first earned is kept
  })
  it('a Common answer earns only Down to Earth', () => {
    expect(awardAnswer(emptyAch(), 0, 0, null, DAY).fresh.map((x) => x.id)).toEqual(['first-common'])
  })
  it('ignores a tier that is not a rarity', () => {
    for (const t of [-1, 7, 2.5, NaN]) expect(awardAnswer(emptyAch(), t, 0, null, DAY).fresh).toEqual([])
  })
  it('the first gem earns Singularity, then the steps in order, the rarity first', () => {
    const one = awardAnswer(emptyAch(), GEM_TIER, 1, 1000, DAY)
    expect(one.fresh.map((x) => x.id)).toEqual(['first-singularity'])
    const five = awardAnswer(one.state, GEM_TIER, 5, 1000, DAY)
    expect(five.fresh.map((x) => x.id)).toEqual(['gems-5'])
  })
  it('a gem found again does not reach a step twice (the caller passes the number of DIFFERENT gems)', () => {
    const s = awardAnswer(emptyAch(), GEM_TIER, 5, 1000, DAY).state
    expect(awardAnswer(s, GEM_TIER, 5, 1000, '2026-11-20').fresh).toEqual([])
  })
  it('two things at once come out in the order to show them', () => {
    const s = awardAnswer(emptyAch(), 0, 0, null, DAY).state
    const r = awardAnswer(s, GEM_TIER, 5, 1000, DAY)
    expect(r.fresh.map((x) => x.id)).toEqual(['first-singularity', 'gems-5'])
  })
  it('"every gem" needs the total from the server: not known means not earned, even with a full-looking cabinet', () => {
    expect(awardAnswer(emptyAch(), GEM_TIER, 1000, null, DAY).fresh.map((x) => x.id)).not.toContain('gems-all')
    expect(awardAnswer(emptyAch(), GEM_TIER, 3, 0, DAY).fresh.map((x) => x.id)).not.toContain('gems-all')
    const all = awardAnswer(emptyAch(), GEM_TIER, 1000, 1000, DAY)
    expect(all.fresh.map((x) => x.id)).toEqual(['first-singularity', 'gems-5', 'gems-10', 'gems-25', 'gems-50', 'gems-100', 'gems-250', 'gems-500', 'gems-all'])
    expect(awardAnswer(emptyAch(), GEM_TIER, 999, 1000, DAY).fresh.map((x) => x.id)).not.toContain('gems-all')
  })
  it('does not change the state it was given', () => {
    const s = emptyAch()
    awardAnswer(s, 3, 0, null, DAY)
    expect(s.earned).toEqual({})
  })
})

describe('backfilling from the cabinet (quiet, dated by the gem that reached the step)', () => {
  const days = Array.from({ length: 12 }, (_, i) => `2026-11-${String(10 + i).padStart(2, '0')}`)
  it('a cabinet with 12 gems already holds Singularity, Pocketful and Collector', () => {
    const s = backfillFromCabinet(emptyAch(), days, 1000)
    expect(Object.keys(s.earned).sort()).toEqual(['first-singularity', 'gems-10', 'gems-5'])
    expect(s.earned['first-singularity']).toBe('2026-11-10')   // the first gem's day
    expect(s.earned['gems-5']).toBe('2026-11-14')              // the fifth gem's day
    expect(s.earned['gems-10']).toBe('2026-11-19')
  })
  it('an empty cabinet earns nothing, and what is already earned is kept', () => {
    expect(backfillFromCabinet(emptyAch(), [], 1000).earned).toEqual({})
    const had = { earned: { 'gems-5': '2026-01-01' } }
    expect(backfillFromCabinet(had, days, 1000).earned['gems-5']).toBe('2026-01-01')
  })
  it('does not award "every gem" without a known total', () => {
    expect(hasAch(backfillFromCabinet(emptyAch(), days, null), 'gems-all')).toBe(false)
    expect(hasAch(backfillFromCabinet(emptyAch(), days, 12), 'gems-all')).toBe(true)
  })
})

describe('storage', () => {
  it('round-trips', () => {
    const s = awardAnswer(emptyAch(), 4, 0, null, DAY).state
    expect(parseAch(serializeAch(s))).toEqual(s)
  })
  it('reads nothing sensible as an empty state, and never throws', () => {
    for (const raw of [null, undefined, '', 'not json', '[]', '{}', '{"earned":[]}', '{"earned":5}', '{"earned":null}', 'null', '5', '"x"']) {
      expect(parseAch(raw as string)).toEqual({ earned: {} })
    }
  })
  it('drops ids that are not achievements and a day that is not a date', () => {
    const s = parseAch(JSON.stringify({ earned: { 'first-rare': '2026-11-19', 'made-up': '2026-11-19', 'gems-5': 'yesterday', __proto__: 'x' } }))
    expect(Object.keys(s.earned).sort()).toEqual(['first-rare', 'gems-5'])
    expect(s.earned['gems-5']).toBe('')
    expect(s.earned['first-rare']).toBe(DAY)
  })
})

describe('the view for the cabinet tab', () => {
  it('counts what is earned, in two groups, and shows progress towards the next gem steps', () => {
    const state = awardAnswer(awardAnswer(emptyAch(), 2, 0, null, DAY).state, GEM_TIER, 12, 1000, DAY).state
    const v = achievementsView(state, 12, 1000)
    expect(v.total).toBe(15)
    expect(v.groups.map((g) => g.id)).toEqual(['firsts', 'gems'])
    expect(v.earned).toBe(v.groups[0].earned + v.groups[1].earned)
    const curator = v.groups[1].items.find((i) => i.a.id === 'gems-25')
    expect(curator?.earned).toBe(false)
    expect(curator?.progress).toEqual({ have: 12, goal: 25 })
    const every = v.groups[1].items.find((i) => i.a.id === 'gems-all')
    expect(every?.progress).toEqual({ have: 12, goal: 1000 })
    expect(v.groups[0].items.find((i) => i.a.id === 'first-mythic')?.progress).toBeNull()
  })
  it('does not invent a goal for "every gem" when the total is not known', () => {
    const every = achievementsView(emptyAch(), 3, null).groups[1].items.find((i) => i.a.id === 'gems-all')
    expect(every?.progress).toBeNull()
  })
})

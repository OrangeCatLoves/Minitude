import { describe, expect, it } from 'vitest'
import {
  ACH_GROUPS, ACHIEVEMENTS, achievementById, achievementsView, awardAnswer, awardEvent, awardRun, backfillFacts, backfillFromCabinet, emptyAch, firstOfTier,
  GEM_TIER, hasAch, longestStreak, parseAch, serializeAch, TIERS, type RunEnd,
} from '../src'

const DAY = '2026-11-19'

describe('the catalogue', () => {
  it('has forty-one achievements with unique ids: the first fifteen and the twenty-six approved on 22 Nov 2026', () => {
    expect(ACHIEVEMENTS.length).toBe(41)
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(41)
    const n = (g: string) => ACHIEVEMENTS.filter((a) => a.group === g).length
    expect([n('firsts'), n('gems'), n('dive'), n('runs'), n('moments'), n('daily'), n('multi'), n('shelves')]).toEqual([7, 8, 4, 6, 4, 5, 3, 4])
    expect(ACH_GROUPS.map((g) => g.id).sort()).toEqual([...new Set(ACHIEVEMENTS.map((a) => a.group))].sort())
  })
  it('keeps the names the owner approved', () => {
    expect(ACHIEVEMENTS.slice(15).map((a) => a.name)).toEqual([
      'Uncharted', 'So Close', 'The Edge of Physics', 'Past the Edge', 'First Dive', 'Getting Deeper', 'Deep Diver', 'Bottomless', 'Beat the Clock',
      'No Easy Answers', 'Buzzer Beater', 'Quick Draw', 'Close Enough', 'Open Book', 'Daily Debut', 'On a Roll', 'Full Week', 'Moon Cycle', 'Hundred Days',
      'Face to Face', 'Room Champion', 'Reigning Champion', 'Well Rounded', 'Full Shelf', 'Gem Hunter', 'Singularity Seven',
    ])
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
    for (const a of ACHIEVEMENTS) { expect(a.name.length).toBeGreaterThan(2); expect(a.text).toMatch(/[.?]["”]?$/) }
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
  it('keeps the count of wins only when it is a sensible number', () => {
    expect(parseAch('{"earned":{},"wins":3}').wins).toBe(3)
    for (const w of ['-2', '"5"', 'null', '1.5e99', '0']) expect(parseAch(`{"earned":{},"wins":${w}}`).wins ?? 0).toBeLessThanOrEqual(1e6)
    expect(parseAch('{"earned":{},"wins":-2}').wins).toBeUndefined()
    expect(parseAch('{"earned":{},"wins":"5"}').wins).toBeUndefined()
  })
})

describe('the view for the cabinet tab', () => {
  it('counts what is earned, in eight groups, and shows progress towards the next gem steps', () => {
    const state = awardAnswer(awardAnswer(emptyAch(), 2, 0, null, DAY).state, GEM_TIER, 12, 1000, DAY).state
    const v = achievementsView(state, 12, 1000)
    expect(v.total).toBe(41)
    expect(v.groups.map((g) => g.id)).toEqual(['firsts', 'gems', 'dive', 'runs', 'moments', 'daily', 'multi', 'shelves'])
    expect(v.earned).toBe(v.groups.reduce((n, g) => n + g.earned, 0))
    const curator = v.groups[1].items.find((i) => i.a.id === 'gems-25')
    expect(curator?.earned).toBe(false)
    expect(curator?.progress).toEqual({ have: 12, goal: 25, unit: 'gems' })
    const every = v.groups[1].items.find((i) => i.a.id === 'gems-all')
    expect(every?.progress).toEqual({ have: 12, goal: 1000, unit: 'gems' })
    expect(v.groups[0].items.find((i) => i.a.id === 'first-mythic')?.progress).toBeNull()
  })
  it('does not invent a goal for "every gem" when the total is not known', () => {
    const every = achievementsView(emptyAch(), 3, null).groups[1].items.find((i) => i.a.id === 'gems-all')
    expect(every?.progress).toBeNull()
  })
  it('shows progress for runs, days in a row, wins and categories', () => {
    const v = achievementsView({ earned: {}, wins: 4 }, 0, null, { runs: 7, streak: 2, shelves: [{ name: 'Food', have: 3, total: 91 }, { name: 'Sports', have: 0, total: 91 }] })
    const p = (id: string) => v.groups.flatMap((g) => g.items).find((i) => i.a.id === id)?.progress
    expect(p('ten-dives')).toEqual({ have: 7, goal: 10, unit: 'runs' })
    expect(p('streak-7')).toEqual({ have: 2, goal: 7, unit: 'days in a row' })
    expect(p('reigning')).toEqual({ have: 4, goal: 10, unit: 'wins' })
    expect(p('well-rounded')).toEqual({ have: 1, goal: 2, unit: 'categories' })
    expect(p('full-shelf')).toEqual({ have: 3, goal: 91, unit: 'gems of Food' })
    expect(p('buzzer')).toBeNull()
  })
})

const ids = (r: { fresh: { id: string }[] }) => r.fresh.map((a) => a.id)
const run = (over: Partial<RunEnd>): RunEnd => ({ mode: 'solo', total: 140, tiers: [0, 0, 0, 0, 0, 0, 0], ...over })

describe('moments at the answer', () => {
  it('Buzzer Beater: under one second left', () => {
    expect(ids(awardAnswer(emptyAch(), 1, 0, null, DAY, { secondsLeft: 0.4 }))).toEqual(['first-uncommon', 'buzzer'])
    expect(ids(awardAnswer(emptyAch(), 1, 0, null, DAY, { secondsLeft: 1 }))).toEqual(['first-uncommon'])
  })
  it('Quick Draw: within 3 seconds of the question', () => {
    expect(ids(awardAnswer(emptyAch(), 0, 0, null, DAY, { secondsUsed: 2.9 }))).toContain('quick-draw')
    expect(ids(awardAnswer(emptyAch(), 0, 0, null, DAY, { secondsUsed: 3.2 }))).not.toContain('quick-draw')
  })
  it('Close Enough: a "Did you mean…?" said yes to, and only for an answer that scored', () => {
    expect(ids(awardAnswer(emptyAch(), 3, 0, null, DAY, { confirmed: true }))).toEqual(['first-exotic', 'close-enough'])
    expect(ids(awardAnswer(emptyAch(), -1, 0, null, DAY, { confirmed: true, secondsLeft: 0.2 }))).toEqual([])
  })
  it('Open Book: once', () => {
    const a = awardEvent(emptyAch(), 'open-book', DAY)
    expect(ids(a)).toEqual(['open-book'])
    expect(ids(awardEvent(a.state, 'open-book', DAY))).toEqual([])
  })
})

describe('when a run ends', () => {
  it('the dive: 600, 690 to 699, 700 and 750', () => {
    expect(ids(awardRun(emptyAch(), run({ total: 590 }), {}, DAY))).not.toContain('uncharted')
    expect(ids(awardRun(emptyAch(), run({ total: 600 }), {}, DAY))).toContain('uncharted')
    expect(ids(awardRun(emptyAch(), run({ total: 689 }), {}, DAY))).not.toContain('so-close')
    expect(ids(awardRun(emptyAch(), run({ total: 690 }), {}, DAY))).toEqual(expect.arrayContaining(['uncharted', 'so-close']))
    const planck = ids(awardRun(emptyAch(), run({ total: 700 }), {}, DAY))
    expect(planck).toContain('planck')
    expect(planck).not.toContain('so-close')
    expect(planck).not.toContain('past-edge')
    expect(ids(awardRun(emptyAch(), run({ total: 750 }), {}, DAY))).toEqual(expect.arrayContaining(['planck', 'past-edge']))
  })
  it('Beat the Clock and No Easy Answers need all seven answered; a Common answer spoils No Easy Answers', () => {
    expect(ids(awardRun(emptyAch(), run({ tiers: [0, 1, 1, 1, 1, 1, 1] }), {}, DAY))).toEqual(['clean'])
    expect(ids(awardRun(emptyAch(), run({ tiers: [1, 1, 1, 1, 1, 1, 2] }), {}, DAY))).toEqual(['clean', 'no-easy'])
    expect(ids(awardRun(emptyAch(), run({ tiers: [1, 1, 1, null, 1, 1, 2] }), {}, DAY))).toEqual([])
    expect(ids(awardRun(emptyAch(), run({ tiers: [1, 1, 1] }), {}, DAY))).toEqual([])
  })
  it('Gem Hunter at three gems in a run; Singularity Seven at seven', () => {
    const g = GEM_TIER
    expect(ids(awardRun(emptyAch(), run({ tiers: [g, g, 0, 0, 0, 0, null] }), {}, DAY))).not.toContain('gem-hunter')
    expect(ids(awardRun(emptyAch(), run({ tiers: [g, g, g, 0, 0, 0, null] }), {}, DAY))).toContain('gem-hunter')
    const seven = ids(awardRun(emptyAch(), run({ total: 840, tiers: [g, g, g, g, g, g, g] }), {}, DAY))
    expect(seven).toEqual(expect.arrayContaining(['uncharted', 'planck', 'past-edge', 'clean', 'no-easy', 'gem-hunter', 'singularity-seven']))
  })
  it('Daily Debut for a Daily; Face to Face for a match; Room Champion for a win, and ten wins make Reigning Champion', () => {
    expect(ids(awardRun(emptyAch(), run({ mode: 'daily', tiers: [0, null] }), {}, DAY))).toEqual(['daily-debut'])
    expect(ids(awardRun(emptyAch(), run({ mode: 'versus', tiers: [0, null] }), {}, DAY))).toEqual(['face-to-face'])
    let s = emptyAch()
    for (let i = 1; i <= 10; i++) {
      const r = awardRun(s, run({ mode: 'versus', tiers: [0, null], won: true }), {}, DAY)
      s = r.state
      expect(s.wins).toBe(i)
      if (i === 1) expect(ids(r)).toEqual(['face-to-face', 'room-champion'])
      if (i === 10) expect(ids(r)).toEqual(['reigning'])
    }
    expect(awardRun(s, run({ mode: 'versus', tiers: [0, null], won: false }), {}, DAY).state.wins).toBe(10)
    expect(parseAch(serializeAch(s)).wins).toBe(10)
  })
  it('runs played and days in a row come from the facts (this run already counted)', () => {
    expect(ids(awardRun(emptyAch(), run({ tiers: [0, null] }), { runs: 1, streak: 1 }, DAY))).toEqual(['first-dive'])
    expect(ids(awardRun(emptyAch(), run({ tiers: [0, null] }), { runs: 10, streak: 3 }, DAY))).toEqual(['first-dive', 'ten-dives', 'streak-3'])
    expect(ids(awardRun(emptyAch(), run({ tiers: [0, null] }), { runs: 100, streak: 100 }, DAY))).toEqual([
      'first-dive', 'ten-dives', 'fifty-dives', 'hundred-dives', 'streak-3', 'streak-7', 'streak-30', 'streak-100',
    ])
  })
})

describe('the cabinet by category', () => {
  const shelf = (name: string, have: number, total: number) => ({ name, have, total })
  it('Well Rounded: a gem in every category; Full Shelf: one category complete', () => {
    const some = [shelf('Food', 1, 91), shelf('Sports', 0, 91)]
    expect(ids(awardAnswer(emptyAch(), GEM_TIER, 1, 1000, DAY, {}, some))).toEqual(['first-singularity'])
    const every = [shelf('Food', 1, 91), shelf('Sports', 2, 91)]
    expect(ids(awardAnswer(emptyAch(), GEM_TIER, 3, 1000, DAY, {}, every))).toEqual(['first-singularity', 'well-rounded'])
    const full = [shelf('Food', 91, 91), shelf('Sports', 0, 91)]
    expect(ids(awardAnswer(emptyAch(), GEM_TIER, 91, 1000, DAY, {}, full))).toContain('full-shelf')
  })
  it('a category the server does not list (total 0) neither blocks nor completes anything', () => {
    const odd = [shelf('Food', 1, 91), shelf('Old category', 1, 0)]
    expect(ids(awardAnswer(emptyAch(), GEM_TIER, 1, 1000, DAY, {}, odd))).toContain('well-rounded')
    expect(ids(awardAnswer(emptyAch(), GEM_TIER, 1, 1000, DAY, {}, [shelf('Old', 1, 0)]))).not.toContain('full-shelf')
  })
})

describe('backfilling from the logbook and the cabinet (quiet)', () => {
  it('runs played and the longest streak on record; a streak is dated by the day it was reached', () => {
    const days = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06']
    const s = backfillFacts(emptyAch(), { runs: 12, streak: longestStreak(days) }, days)
    expect(Object.keys(s.earned).sort()).toEqual(['first-dive', 'streak-3', 'ten-dives'])
    expect(s.earned['streak-3']).toBe('2026-11-03')
    expect(s.earned['first-dive']).toBe('')
  })
  it('leaves the gem steps to the cabinet backfill and keeps what is already earned', () => {
    const had = { earned: { 'first-dive': '2026-01-01' } }
    const s = backfillFacts(had, { runs: 3, gemsFound: 50, gemTotal: 1000 })
    expect(s.earned['first-dive']).toBe('2026-01-01')
    expect(hasAch(s, 'gems-5')).toBe(false)
  })
  it('the longest streak counts days in a row, in any order, with repeats', () => {
    expect(longestStreak([])).toBe(0)
    expect(longestStreak(['2026-11-03', '2026-11-01', '2026-11-02', '2026-11-02', 'nonsense'])).toBe(3)
    expect(longestStreak(['2026-02-28', '2026-03-01', '2026-12-31', '2027-01-01', '2027-01-02'])).toBe(3)
  })
})

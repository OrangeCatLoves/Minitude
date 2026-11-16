import { describe, expect, it } from 'vitest'
import type { Candidate } from '../src/expand/build'
import { buildQuestion, coldTiers, reviewSheet, type NewQuestion } from '../src/expand/newq'

const def = (over: Partial<NewQuestion> = {}): NewQuestion => ({ id: 'test-q', category: 'Test', prompt: 'Name a thing.', rules: 'Anything.', source: 'test', ...over })
const cand = (name: string, signal: number, aliases: string[] = [], desc?: string): Candidate => ({ id: 'Q' + name, name, aliases, signal, ...(desc ? { desc } : {}) })

describe('tiers by rank inside a new class', () => {
  it('a big class: about 10 / 20 / 40 / 80 / 160 are the first five tiers, everything else is Mythic', () => {
    const t = coldTiers(1000)
    expect([0, 1, 2, 3, 4, 5].map((k) => t.filter((x) => x === k).length)).toEqual([10, 20, 40, 80, 160, 690])
    expect(t[0]).toBe(0)
    expect(t[999]).toBe(5)
  })
  it('a small class shrinks the bands so every tier keeps answers (the game needs 4 per tier)', () => {
    const t = coldTiers(200)
    const counts = [0, 1, 2, 3, 4, 5].map((k) => t.filter((x) => x === k).length)
    expect(counts.reduce((a, b) => a + b, 0)).toBe(200)
    expect(Math.min(...counts)).toBeGreaterThanOrEqual(4)
    expect(counts[0]).toBeLessThanOrEqual(12) // 6% of 200
  })
  it('is monotone: a better-known answer never has a rarer tier', () => {
    const t = coldTiers(500)
    for (let i = 1; i < t.length; i++) expect(t[i]).toBeGreaterThanOrEqual(t[i - 1])
  })
})

describe('building a question from what Wikidata returned', () => {
  it('ranks by how many languages know it, ties by name, and gives the best-known the lowest tier', () => {
    const many = Array.from({ length: 120 }, (_, i) => cand('Thing ' + String(i).padStart(3, '0'), 200 - i))
    const b = buildQuestion(def(), many)
    expect(b.ranked[0].name).toBe('Thing 000')
    expect(b.ranked[0].tier).toBe(0)
    expect(b.ranked[119].tier).toBe(5)
    expect(b.record.answers).toHaveLength(120)
  })
  it('keeps one answer per name, drops generic words and unusable names, and counts what it dropped', () => {
    const b = buildQuestion(def(), [cand('Alpha', 50), cand('alpha', 10), cand('ALPHA!', 5), cand('movie', 90), cand('x', 80), cand('Beta (film)', 70), cand('List of things', 60), cand('Gamma', 40)])
    expect(b.ranked.map((r) => r.name)).toEqual(['Alpha', 'Gamma'])
    expect(b.stats.dropped['same name as a better-known one']).toBe(2)
    expect(b.stats.dropped['generic word']).toBe(1)
    expect(b.stats.dropped['no usable name']).toBe(3)
  })
  it('an alias never takes another answer\'s name, nor repeats an earlier alias', () => {
    const b = buildQuestion(def(), [cand('Alpha', 50, ['Beta', 'Al', 'The Alpha']), cand('Beta', 40, ['Al', 'B-eta', 'Bets']), cand('Alpha-2', 30)])
    const alpha = b.ranked.find((r) => r.name === 'Alpha')!
    const beta = b.ranked.find((r) => r.name === 'Beta')!
    expect(alpha.aliases).toEqual(['Al']) // "Beta" is an answer; "The Alpha" is the same as "Alpha" once "the" is ignored
    expect(beta.aliases).toEqual(['Bets']) // "Al" was taken by Alpha; "B-eta" is just "Beta" with a hyphen
  })
  it('hand-added extras and aliases are merged in, and the recipe can add or skip things', () => {
    const b = buildQuestion(def({ extras: [{ name: 'Ruby', signal: 100, aliases: ['red gem'] }], extraAliases: { Alpha: ['alfa'] }, alsoWritten: (n) => [n + ' thing'], skip: (c) => c.name === 'Skipme' }), [cand('Alpha', 50), cand('Skipme', 60)])
    expect(b.ranked.map((r) => r.name)).toEqual(['Ruby', 'Alpha'])
    expect(b.ranked[0].aliases).toEqual(['red gem', 'Ruby thing'])
    expect(b.ranked[1].aliases).toEqual(['Alpha thing', 'alfa'])
  })
  it('flags a small class and a tier with too few answers', () => {
    const b = buildQuestion(def(), [cand('A one', 9), cand('B two', 8), cand('C three', 7)])
    expect(b.flags.some((f) => /SMALL CLASS/.test(f))).toBe(true)
    expect(b.flags.some((f) => /fewer than 4/.test(f))).toBe(true)
  })
  it('the review sheet names the question, its rules, the size and the best-known answers', () => {
    const d = def()
    const b = buildQuestion(d, Array.from({ length: 200 }, (_, i) => cand('Item ' + String(i).padStart(3, '0'), 300 - i, [], i < 3 ? 'a described thing' : undefined)))
    const md = reviewSheet('batch-test', [d], new Map([[d.id, b]]))
    expect(md).toMatch(/Name a thing\./)
    expect(md).toMatch(/\*\*Rules:\*\* Anything\./)
    expect(md).toMatch(/Item 000 _\(a described thing\)_/)
    expect(md).toMatch(/\| 1 \| Name a thing\. \| Test \| 200 \|/)
  })
})

describe('the hand-listed head of a question (mustHave)', () => {
  const filler = Array.from({ length: 40 }, (_, i) => cand('Filler ' + String(i).padStart(2, '0'), 100 - i))
  const names = (b: ReturnType<typeof buildQuestion>) => b.ranked.map((r) => r.name)

  it('ranks strictly in the order it is listed, above every fame score', () => {
    const b = buildQuestion(def({ mustHave: ['Second', 'First'] }), [{ ...cand('First', 5), big: 10, en: true }, { ...cand('Second', 1), big: 0 }, ...filler])
    expect(names(b).slice(0, 2)).toEqual(['Second', 'First'])
  })

  it('is never dropped as a generic word, which the filter for the older questions would do to "dog"', () => {
    const b = buildQuestion(def({ mustHave: ['Dog'], extras: [{ name: 'Dog', signal: 50 }] }), filler)
    expect(names(b)[0]).toBe('Dog')
    // without being listed, the same word is still dropped
    expect(names(buildQuestion(def({ extras: [{ name: 'Dog', signal: 50 }] }), filler))).not.toContain('Dog')
  })

  it('is never skipped by the recipe', () => {
    const b = buildQuestion(def({ mustHave: ['Association football'], skip: (c) => /Association/.test(c.name) }), [cand('Association football', 90), ...filler])
    expect(names(b)[0]).toBe('Association football')
  })

  it('a hand-added answer wins a name tie with a Wikidata item that reads the same ("Google" and "Google+")', () => {
    const b = buildQuestion(def({ mustHave: ['Google'], extras: [{ name: 'Google', signal: 150 }] }), [{ ...cand('Google+', 120), big: 10, en: true }, ...filler])
    expect(names(b)[0]).toBe('Google')
    expect(names(b)).not.toContain('Google+')
  })

  it('"rename" shows the listed name for an item that has another name, and keeps the old name as an alias; without it the item keeps its own name', () => {
    const items = [cand('Spinacia oleracea', 80, ['Spinach']), ...filler]
    const renamed = buildQuestion(def({ mustHave: ['Spinach'], rename: ['Spinach'] }), items)
    expect(names(renamed)[0]).toBe('Spinach')
    expect(renamed.ranked[0].aliases).toContain('Spinacia oleracea')
    const kept = buildQuestion(def({ mustHave: ['Spinach'] }), items)
    expect(names(kept)[0]).toBe('Spinacia oleracea')
  })

  it('a famous name that is only an alias of a RELATED item gets an answer of its own when listed as an extra', () => {
    const items = [cand('Toyota Auris', 60, ['Toyota Corolla']), ...filler]
    const b = buildQuestion(def({ mustHave: ['Toyota Corolla'], extras: [{ name: 'Toyota Corolla', signal: 150 }] }), items)
    expect(names(b)).toContain('Toyota Corolla')
    expect(names(b)).toContain('Toyota Auris')
    expect(b.ranked.find((r) => r.name === 'Toyota Auris')!.aliases).not.toContain('Toyota Corolla')
  })

  it('a Wikidata code is never an alias (Wikidata editors put "Q140" on the lion)', () => {
    const b = buildQuestion(def(), [cand('Lion', 100, ['q140', 'Q140', 'Panthera leo']), ...filler])
    expect(b.ranked.find((r) => r.name === 'Lion')!.aliases).toEqual(['Panthera leo'])
  })

  it('a slur that Wikidata uses as the name of an animal is never stored, as a name or as an alias: the listed name is shown instead', () => {
    // Wikidata's English label for the bearded dragon is a slur-like Australian nickname
    const items = [cand('Jew Lizard', 60, ['Jew lizard', 'Bearded dragon', 'Pogona']), ...filler]
    const b = buildQuestion(def({ mustHave: ['Bearded dragon'], rename: ['Bearded dragon'] }), items)
    expect(names(b)[0]).toBe('Bearded dragon')
    expect(b.ranked[0].aliases.join('|')).not.toMatch(/jew/i)
    expect(b.ranked[0].aliases).toContain('Pogona')
    expect(names(b).join('|')).not.toMatch(/jew/i)
  })

  it('slur-like film titles, stage names and old names found in Batch 5 are dropped too, and the thing they name keeps its other names', () => {
    const items = [cand('The Squaw Man', 60, []), cand('Gayniggers from Outer Space', 55, []), cand('Lift Every Voice and Sing', 50, ['Negro national anthem', 'Black national anthem']), cand('Dave Lee', 45, ['Joey Negro', 'David Lee']), ...filler]
    const b = buildQuestion(def(), items)
    expect(names(b)).not.toContain('The Squaw Man')
    expect(names(b).join('|')).not.toMatch(/nigger/i) // also inside a longer word
    expect(b.ranked.find((r) => r.name === 'Lift Every Voice and Sing')!.aliases).toEqual(['Black national anthem'])
    expect(b.ranked.find((r) => r.name === 'Dave Lee')!.aliases).toEqual(['David Lee'])
  })
})

describe('a recipe can look at the one-line description (people described as something else are skipped)', () => {
  const filler = Array.from({ length: 40 }, (_, i) => cand('Filler ' + String(i).padStart(2, '0'), 100 - i, [], 'American baseball player'))
  const names = (b: ReturnType<typeof buildQuestion>) => b.ranked.map((r) => r.name)
  const onlyDescribedAs = (re: RegExp) => (c: Candidate) => !!c.desc && !re.test(c.desc)
  it('drops a president "who was a baseball player", keeps real players, keeps a person with no description, and never drops a hand-listed name', () => {
    const items = [cand('A President', 150, [], '41st President of the United States'), cand('Real Player', 90, [], 'American baseball player'), cand('Nobody Known', 40), ...filler]
    const b = buildQuestion(def({ skip: onlyDescribedAs(/baseball/i) }), items)
    expect(names(b)).not.toContain('A President')
    expect(names(b)).toContain('Real Player')
    expect(names(b)).toContain('Nobody Known')
    const listed = buildQuestion(def({ skip: onlyDescribedAs(/baseball/i), mustHave: ['A President'] }), items)
    expect(names(listed)).toContain('A President')
  })
})

describe('a listed name that landed on an item with another name', () => {
  const filler = Array.from({ length: 40 }, (_, i) => cand('Filler ' + String(i).padStart(2, '0'), 100 - i))
  it('is flagged for a person to check, unless it was renamed on purpose', () => {
    const items = [cand('Toyota Auris', 60, ['Toyota Corolla']), cand('Spinacia oleracea', 50, ['Spinach']), ...filler]
    const flagged = buildQuestion(def({ mustHave: ['Toyota Corolla', 'Spinach'] }), items)
    expect(flagged.flags.join('\n')).toContain('Toyota Corolla -> Toyota Auris')
    expect(flagged.flags.join('\n')).toContain('Spinach -> Spinacia oleracea')
    const settled = buildQuestion(def({ mustHave: ['Spinach'], rename: ['Spinach'] }), items)
    expect(settled.flags.join('\n')).not.toContain('LANDED')
  })
})

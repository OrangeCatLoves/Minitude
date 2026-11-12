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

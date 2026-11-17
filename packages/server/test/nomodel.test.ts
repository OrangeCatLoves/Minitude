import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { editDistance, looseKey, normalize, typoBudget } from '../src/normalize'

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(join(here, '..', rel), 'utf8')

describe('the live game never calls a language model (decided: answer lists built ahead of time)', () => {
  it('the server start-up code does not import or build any model client', () => {
    const src = read('src/index.ts')
    expect(src).not.toMatch(/llm\//i)
    expect(src).not.toMatch(/makeLlm|GeminiClient|LocalLlm|GuardedLlm/)
    expect(src).toMatch(/new PipelineJudge\(repo, null\)/)
  })
  it('the routes that check answers do not reach a model either', () => {
    for (const f of ['src/app.ts', 'src/versusRoutes.ts', 'src/versus.ts', 'src/daily.ts']) expect(read(f), f).not.toMatch(/llm\/|makeLlm|GeminiClient/i)
  })
})

describe('edit distance', () => {
  it('a swapped pair of neighbouring letters is one slip; ordinary edits count one each', () => {
    expect(editDistance('brie', 'brei')).toBe(1)
    expect(editDistance('cheddar', 'chedar')).toBe(1)
    expect(editDistance('kitten', 'sitting')).toBe(3)
    expect(editDistance('same', 'same')).toBe(0)
  })
  it('stops early: above the limit it just says "more than the limit"', () => {
    expect(editDistance('aaaaaaaa', 'bbbbbbbb', 2)).toBe(3)
    expect(editDistance('abc', 'abcdefgh', 2)).toBe(3)
  })
  it('the number of slips forgiven grows with the length of what was typed', () => {
    expect([2, 3, 4, 7, 8, 11, 12, 20].map(typoBudget)).toEqual([0, 0, 1, 1, 2, 2, 3, 3])
  })
})

describe('the same answer written another way', () => {
  it('has one key', () => {
    expect(looseKey(normalize('Wing-back'))).toBe(looseKey(normalize('wingback')))
    expect(looseKey(normalize('Coastal defence ship'))).toBe(looseKey(normalize('coastal defense ship')))
    expect(looseKey(normalize('Pepi II'))).toBe(looseKey(normalize('Pepi 2')))
    expect(looseKey(normalize('Mt. Etna'))).toBe(looseKey(normalize('Mount Etna')))
    expect(looseKey(normalize('Rock \'n\' Roll'))).toBe(looseKey(normalize('rock and roll')))
  })
  it('keeps different answers apart', () => {
    expect(looseKey(normalize('Pepi I'))).not.toBe(looseKey(normalize('Pepi II')))
    expect(looseKey(normalize('Tour'))).not.toBe(looseKey(normalize('Tor')))
    expect(looseKey(normalize('I Confess'))).not.toBe(looseKey(normalize('1 Confess')))
  })
})

describe('a wrong first letter costs two slips', () => {
  it('is not forgiven in a short word, but a slip later in the word still is', async () => {
    const { fuzzyFind } = await import('../src/match')
    const forms = new Map([['brie', 'brie'], ['gorgonzola', 'gorgonzola']])
    expect(fuzzyFind('wrie', forms)).toBeNull()                                  // first letter wrong in a 4-letter word: 2 slips > 1
    expect(fuzzyFind('brei', forms)).toMatchObject({ kind: 'one', canon: 'brie' }) // swap later in the word: 1 slip
    expect(fuzzyFind('yorgonzola', forms)).toMatchObject({ kind: 'one', canon: 'gorgonzola' }) // first letter wrong in a long word: 2 slips <= 2
  })
})

describe('surprising suggestions are intended (owner, 12 Nov 2026)', () => {
  it('a name a couple of slips from ANOTHER real name still gets "Did you mean ...?" (Mekong River -> the Moa, via its other name Makona River)', async () => {
    const { fuzzyFind } = await import('../src/match')
    const forms = new Map([['makona river', 'moa river'], ['wensleydale cheese', 'wensleydale cheese']])
    expect(fuzzyFind('mekong river', forms)).toMatchObject({ kind: 'one', canon: 'moa river' })
  })
  it('but a name that is far from every real answer never matches', async () => {
    const { fuzzyFind } = await import('../src/match')
    const forms = new Map([['makona river', 'moa river'], ['wensleydale cheese', 'wensleydale cheese']])
    for (const far of ['danube river', 'yangtze river', 'mississippi river', 'wensley cheese board', 'zzzzzz']) expect(fuzzyFind(far, forms), far).toBeNull()
  })
})

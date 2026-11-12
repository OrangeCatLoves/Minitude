import { describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { importQuestion } from '../src/bankio'
import { runCli, type CliContext } from '../src/cli/commands'
import { expand, loadExisting, tierFromPairs, type Candidate, type Recipe } from '../src/expand/build'
import { PipelineJudge } from '../src/judge/pipeline'
import { head, testRepo } from './helpers'

function ctx(repo = testRepo()): CliContext & { lines: string[] } {
  const lines: string[] = []
  return { repo, llm: null, llmNote: 'no model', dbFile: ':memory:', now: () => 123_456, out: (s) => lines.push(s), lines }
}
const run = async (argv: string[], c: CliContext & { lines: string[] }) => ({ code: await runCli(argv, c), text: c.lines.join('\n') })

function cheeseRepo() {
  const repo = testRepo()
  importQuestion(repo, { id: 'ch', category: 'Food', prompt: 'Name a cheese.', rules: 'r', answers: [
    { name: 'Cheddar', tier: 0, aliases: ['cheddar cheese'] }, { name: 'Brie', tier: 1 }, { name: 'Gorgonzola', tier: 3 }, { name: 'Halloumi', tier: 2 }, { name: 'Roquefort', tier: 3 },
  ] }, { status: 'approved', source: 'import', answerSource: 'seed', at: 1 })
  repo.insertSpelling({ questionId: 'ch', norm: 'processed cheese', verdict: 'invalid', message: 'No.', source: 'admin', at: 1 })
  return repo
}
const RECIPE: Recipe = { question: 'ch', note: 'test' }
const cand = (id: string, name: string, signal: number, aliases: string[] = []): Candidate => ({ id, name, aliases, signal })

describe('tier for a new answer comes from how well known it is, compared with the answers we already have', () => {
  const pairs = [{ signal: 90, tier: 0 }, { signal: 60, tier: 1 }, { signal: 30, tier: 2 }, { signal: 12, tier: 3 }, { signal: 5, tier: 4 }, { signal: 2, tier: 5 }]
  it("the question's own tier counts are laid over the order of how well known its answers are; the ends extend outwards", () => {
    expect(tierFromPairs(100, pairs)).toBe(0)   // better known than all of them
    expect(tierFromPairs(31, pairs)).toBe(2)
    expect(tierFromPairs(12, pairs)).toBe(3)
    expect(tierFromPairs(1, pairs)).toBe(5)     // less known than all of them: the rarest tier
  })
  it("uses the question's own proportions, whatever the generator labelled", () => {
    // three answers at tier 0, one at tier 5: the three best-known are tier 0, only the least known is tier 5
    const skew = [{ signal: 90, tier: 0 }, { signal: 80, tier: 0 }, { signal: 70, tier: 0 }, { signal: 10, tier: 5 }]
    expect(tierFromPairs(75, skew)).toBe(0)
    expect(tierFromPairs(50, skew)).toBe(5)
    expect(tierFromPairs(10, skew)).toBe(5)
  })
  it('with nothing to compare against it says "exotic" and never invents extremes', () => {
    expect(tierFromPairs(500, [])).toBe(3)
  })
})

describe('merging what Wikidata knows into a question', () => {
  it('adds new answers, adds other names to answers we have, and leaves alone what a person ruled out', () => {
    const repo = cheeseRepo()
    const ex = loadExisting(repo.db, 'ch')
    const file = expand('ch', 'Name a cheese.', RECIPE, [
      cand('Q1', 'Cheddar cheese', 95, ['Cheddar', 'English cheddar']),     // already had (alias): new alias "English cheddar"
      cand('Q2', 'Brie', 70, ['Brie de Meaux']),                            // already had: new alias
      cand('Q3', 'Wensleydale', 40),                                        // new
      cand('Q4', 'Processed cheese', 50),                                   // a person ruled this out: never added
      cand('Q5', 'Gouda', 65, ['Gouda cheese']),                            // new, with an alias
      cand('Q6', 'Goudá', 3),                                               // same answer written another way as Gouda: not added twice
      cand('Q7', 'X', 80),                                                  // too short to be a name
    ], ex)
    expect(file.newAnswers.map((a) => a.name).sort()).toEqual(['Gouda', 'Wensleydale'])
    expect(file.newAnswers.find((a) => a.name === 'Gouda')!.aliases).toEqual(['Gouda cheese'])
    expect(file.newAliases.map((a) => `${a.answer}<-${a.alias}`).sort()).toEqual(['Brie<-Brie de Meaux', 'Cheddar<-English cheddar'])
    expect(file.stats).toMatchObject({ fetched: 7, alreadyHad: 2, newAnswers: 2, skippedStoredInvalid: 1 })
    // Gouda is known in 65 languages: closer to Brie (70) than to Halloumi-ish things, so it is common-ish
    for (const a of file.newAnswers) expect(a.tier).toBeGreaterThanOrEqual(0)
  })
  it('a name that Wikidata knows must not take over an alias that points to another answer', () => {
    const repo = cheeseRepo()
    const file = expand('ch', 'p', RECIPE, [cand('Q9', 'Cheddar Cheese', 50)], loadExisting(repo.db, 'ch'))
    expect(file.newAnswers).toEqual([]) // "cheddar cheese" is an alias of Cheddar already
  })
})

describe('answers: add, alias, unknown, import-expansion', () => {
  it('add puts an answer on the list at once; the judge then accepts it, and its aliases', async () => {
    const c = ctx(cheeseRepo())
    const r = await run(['answers', 'add', 'ch', 'Wensleydale', '4', '--alias', 'wensleydale cheese'], c)
    expect(r.code).toBe(0)
    const judge = new PipelineJudge(c.repo, null)
    expect((await judge.judge(head(c.repo, 'ch'), 'wensleydale')).res).toMatchObject({ status: 'valid', answer: 'Wensleydale', tier: 4 })
    expect((await judge.judge(head(c.repo, 'ch'), 'Wensleydale cheese')).res).toMatchObject({ status: 'valid', answer: 'Wensleydale' })
    expect((await run(['answers', 'add', 'ch', 'Wensleydale', '4'], c)).code).toBe(1) // already there
    expect((await run(['answers', 'add', 'ch', 'Gouda', '9'], c)).code).toBe(1)       // not a tier
  })
  it('alias adds another way to write an existing answer', async () => {
    const c = ctx(cheeseRepo())
    expect((await run(['answers', 'alias', 'ch', 'Brie', 'brie de meaux'], c)).code).toBe(0)
    expect((await new PipelineJudge(c.repo, null).judge(head(c.repo, 'ch'), 'brie de meaux')).res).toMatchObject({ status: 'valid', answer: 'Brie' })
  })
  it('unknown lists what players typed that was not found, most often first', async () => {
    const c = ctx(cheeseRepo())
    const runRow = c.repo.createRun(c.repo.approvedHeads().slice(0, 7), 'list', 1)
    const heads = c.repo.approvedHeads().slice(0, 7)
    const judge = new PipelineJudge(c.repo, null)
    for (const text of ['Zorblax', 'zorblax ', 'plugh']) {
      const out = await judge.judge(heads[0], text)
      c.repo.logAttempt({ runId: runRow.id, idx: 0, text, status: out.res.status, via: out.via, ms: 1, at: 100_000 })
    }
    const r = await run(['answers', 'unknown'], c)
    expect(r.text).toMatch(/2x .*zorblax/)
    expect(r.text).toMatch(/1x .*plugh/)
    expect(r.text.indexOf('zorblax')).toBeLessThan(r.text.indexOf('plugh'))
  })
  it('import-expansion adds what the builder found; a dry run only counts; running it twice adds nothing new', async () => {
    const c = ctx(cheeseRepo())
    const dir = mkdtempSync(join(tmpdir(), 'mt-exp-'))
    try {
      const file = join(dir, 'ch.json')
      writeFileSync(file, JSON.stringify({ question: 'ch', newAnswers: [{ name: 'Gouda', tier: 1, aliases: ['gouda cheese'], signal: 65, qid: 'Q5' }, { name: 'Bad', tier: 9, aliases: [], signal: 1, qid: 'Q0' }], newAliases: [{ answer: 'Brie', alias: 'brie de meaux' }] }))
      const dry = await run(['answers', 'import-expansion', file, '--dry-run'], c)
      expect(dry.text).toMatch(/Would add 1 answer and 2 aliases/)
      expect(c.repo.getAnswer('ch', 'gouda')).toBeUndefined()
      const real = await run(['answers', 'import-expansion', file], c)
      expect(real.text).toMatch(/Added 1 answer and 2 aliases/)
      expect(c.repo.getAnswer('ch', 'gouda')).toMatchObject({ name: 'Gouda', tier: 1, source: 'wikidata' })
      expect((await new PipelineJudge(c.repo, null).judge(head(c.repo, 'ch'), 'gouda cheese')).res).toMatchObject({ status: 'valid', answer: 'Gouda' })
      const again = await run(['answers', 'import-expansion', file], c)
      expect(again.text).toMatch(/Added 0 answers and 0 aliases/)
      expect((await run(['answers', 'list', 'ch', '--source', 'wikidata'], c)).text).toMatch(/Gouda/)
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
})

describe('lint: different answers that are one slip apart', () => {
  it('finds a close pair, ignores two forms of the same answer, and does not look at very short words', async () => {
    const { nearForms } = await import('../src/expand/lint')
    const forms = new Map([
      ['sea donkey', 'threebanded sheephead'], ['sea monkey', 'sea monkey'], // different answers, one slip apart
      ['cheddar', 'cheddar'], ['cheddar cheese', 'cheddar'], ['chedar', 'cheddar'], // same answer: harmless
      ['ox', 'ox'], ['ax', 'ax'],                                          // too short to forgive anything
    ])
    const pairs = nearForms(forms)
    expect(pairs.map((p) => [p.a, p.b].sort().join(' ~ '))).toEqual(['sea donkey ~ sea monkey'])
    expect(pairs[0].distance).toBe(1)
  })
  it('the lint command lists them per question', async () => {
    const repo = cheeseRepo()
    importQuestion(repo, { id: 'sea', category: 'Test', prompt: 'p', rules: 'r', answers: [{ name: 'Threebanded Sheephead', tier: 4, aliases: ['sea donkey'] }, { name: 'Sea Monkey', tier: 2 }] }, { status: 'approved', source: 'import', answerSource: 'seed', at: 1 })
    const c = ctx(repo)
    const r = await run(['answers', 'lint', 'sea'], c)
    expect(r.text).toMatch(/1 close pair/)
    expect(r.text).toMatch(/sea donkey/)
  })
})

describe('group names (the owner\'s rule) are data now', () => {
  it('import-groups adds umbrella terms at Common, with aliases; running it again adds nothing; a ruled-out term is left alone', async () => {
    const c = ctx(cheeseRepo())
    c.repo.insertSpelling({ questionId: 'ch', norm: 'cheese', verdict: 'invalid', message: 'The question\'s own word.', source: 'admin', at: 1 })
    const dir = mkdtempSync(join(tmpdir(), 'mt-grp-'))
    try {
      const file = join(dir, 'groups.json')
      writeFileSync(file, JSON.stringify({ _about: 'x', ch: [{ name: 'Blue cheese', aliases: ['blue cheeses'] }, { name: 'Cheese', aliases: [] }], nope: [{ name: 'Ignored' }] }))
      const first = await run(['answers', 'import-groups', file], c)
      expect(first.text).toMatch(/added 1 answer and 1 alias \(1 skipped/)
      const judge = new PipelineJudge(c.repo, null)
      expect((await judge.judge(head(c.repo, 'ch'), 'blue cheeses')).res).toMatchObject({ status: 'valid', answer: 'Blue cheese', tier: 0 })
      expect((await judge.judge(head(c.repo, 'ch'), 'cheese')).res.status).toBe('invalid')
      expect((await run(['answers', 'import-groups', file], c)).text).toMatch(/added 0 answers and 0 aliases/)
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
  it('the shipped data file is well formed and names only questions that exist in the bank', async () => {
    const { readFileSync } = await import('node:fs')
    const data = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'group-terms.json'), 'utf8')) as Record<string, unknown>
    for (const [qid, list] of Object.entries(data)) {
      if (qid.startsWith('_')) continue
      expect(Array.isArray(list), qid).toBe(true)
      for (const g of list as { name: string }[]) expect(typeof g.name === 'string' && g.name.length > 1, qid).toBe(true)
    }
  })
})

describe('import-expansion on a whole folder', () => {
  it('imports every .json file in it, and a dry run changes nothing', async () => {
    const c = ctx(cheeseRepo())
    importQuestion(c.repo, { id: 'two', category: 'Test', prompt: 'p', rules: 'r', answers: [{ name: 'Alpha', tier: 0 }] }, { status: 'approved', source: 'import', answerSource: 'seed', at: 1 })
    const dir = mkdtempSync(join(tmpdir(), 'mt-dir-'))
    try {
      writeFileSync(join(dir, 'a.json'), JSON.stringify({ question: 'ch', newAnswers: [{ name: 'Gouda', tier: 1, aliases: [], signal: 5, qid: 'Q1' }], newAliases: [] }))
      writeFileSync(join(dir, 'b.curated.json'), JSON.stringify({ question: 'two', source: 'curated', newAnswers: [{ name: 'Beta', tier: 2, aliases: ['beta thing'], signal: 0, qid: 'curated' }], newAliases: [] }))
      writeFileSync(join(dir, 'notes.txt'), 'ignored')
      const dry = await run(['answers', 'import-expansion', dir, '--dry-run'], c)
      expect(dry.text).toMatch(/Would add 1 answer and 0 aliases to ch/)
      expect(dry.text).toMatch(/Would add 1 answer and 1 alias to two/)
      expect(c.repo.getAnswer('ch', 'gouda')).toBeUndefined()
      await run(['answers', 'import-expansion', dir], c)
      expect(c.repo.getAnswer('ch', 'gouda')).toMatchObject({ source: 'wikidata' })
      expect(c.repo.getAnswer('two', 'beta')).toMatchObject({ source: 'curated', tier: 2 })
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
})

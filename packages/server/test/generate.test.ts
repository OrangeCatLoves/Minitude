import { describe, expect, it } from 'vitest'
import { applyAudit, checkAnswers, generateQuestions, makeId, MIN_PER_TIER, parseAnswers, parseAudit, parseProposals, similarPrompts, type DraftAnswer } from '../src/generate/generate'
import { LlmError, type JsonRequest } from '../src/llm/types'
import { FakeLlm, testRepo } from './helpers'

/** a full answer list: 8 answers in each of the six tiers */
const fullAnswers = (tag = 'A', per = 8) => ({
  answers: [0, 1, 2, 3, 4, 5].flatMap((t) => Array.from({ length: per }, (_, i) => ({ name: `${tag} Thing ${t}-${i}`, tier: t, desc: 'A thing.', aliases: i === 0 ? [`${tag} alias ${t}`] : [] }))),
})
const clean = { question_ok: true, question_note: '', problems: [] as unknown[] }

/** model that proposes the given prompts, then answers and audits */
function model(prompts: string[], over: { answers?: () => unknown; audit?: (req: JsonRequest) => unknown } = {}) {
  let p = 0
  return new FakeLlm((req) => {
    const props = Object.keys(req.schema.properties ?? {})
    if (props.includes('questions')) return { questions: prompts.map((x) => ({ prompt: x, rules: 'Any real example counts. Fictional ones do not.' })).slice(p) }
    if (props.includes('answers')) { p++; return over.answers ? over.answers() : fullAnswers('T' + p) }
    return over.audit ? over.audit(req) : clean
  })
}

describe('question generator', () => {
  it('saves what the model writes as DRAFTS, with its answers, and plays nothing until approved', async () => {
    const repo = testRepo()
    const llm = model(['Name a kind of soup.'])
    const rep = await generateQuestions(repo, llm, { categories: ['Food'], count: 1, now: () => 77 })
    expect(rep.drafted).toHaveLength(1)
    const q = repo.getQuestion(rep.drafted[0])!
    expect(q).toMatchObject({ status: 'draft', source: 'llm', model: 'fake-model', category: 'Food', prompt: 'Name a kind of soup.' })
    expect(q.notes).toMatch(/question looks fine/)
    expect(repo.answersOf(q.id)).toHaveLength(48)
    expect(repo.answersOf(q.id).every((a) => a.source === 'draft')).toBe(true)
    expect(repo.approvedHeads().map((x) => x.id)).not.toContain(q.id)
    expect(repo.aliasesOf(q.id).size).toBe(6)
    // three model calls for one question: propose, answers, audit
    expect(llm.calls.map((c) => c.purpose)).toEqual(['generate', 'generate', 'audit'])
  })
  it('tops each category up to the target and does nothing when it is already there', async () => {
    const repo = testRepo() // one seed question per category
    const first = await generateQuestions(repo, model(['Name a kind of soup.']), { categories: ['Food'], perCategory: 2 })
    expect(first.drafted).toHaveLength(1)
    const llm = model(['Name a kind of bread.'])
    const second = await generateQuestions(repo, llm, { categories: ['Food'], perCategory: 2 })
    expect(second.drafted).toHaveLength(0)
    expect(llm.calls).toHaveLength(0)
  })
  it('skips a prompt that is too like one we already have', async () => {
    const repo = testRepo()
    const rep = await generateQuestions(repo, model(['Name a kind of cheese.', 'Name a type of cheese!', 'Name a kind of soup.']), { categories: ['Food'], count: 1 })
    expect(rep.skipped.length).toBeGreaterThanOrEqual(1)
    expect(repo.getQuestion(rep.drafted[0])!.prompt).toBe('Name a kind of soup.')
  })
  it('rejects a draft that fails the automatic checks, but keeps it so the prompt is not tried again', async () => {
    const repo = testRepo()
    const llm = model(['Name a kind of soup.'], { answers: () => fullAnswers('X', 2) })
    const rep = await generateQuestions(repo, llm, { categories: ['Food'], count: 1 })
    expect(rep.rejected).toHaveLength(1)
    expect(repo.getQuestion(rep.rejected[0])).toMatchObject({ status: 'rejected' })
    expect(repo.getQuestion(rep.rejected[0])!.notes).toMatch(/REJECTED by the automatic checks/)
    expect(llm.calls.map((c) => c.purpose)).not.toContain('audit') // no point auditing it
  })
  it('the audit drops broken answers and flags doubtful ones for a person', async () => {
    const repo = testRepo()
    const llm = model(['Name a kind of soup.'], {
      audit: () => ({
        question_ok: true, question_note: '',
        problems: [
          { name: 'T1 Thing 0-1', issue: 'not_valid', note: 'not real' },
          { name: 'T1 Thing 3-2', issue: 'tier_too_high', note: 'it is quite common' },
          { name: 'Not In The List', issue: 'not_valid', note: 'ignored' },
        ],
      }),
    })
    const rep = await generateQuestions(repo, llm, { categories: ['Food'], count: 1 })
    const id = rep.drafted[0]
    const names = repo.answersOf(id).map((a) => a.name)
    expect(names).not.toContain('T1 Thing 0-1')
    expect(names).toHaveLength(47)
    const flagged = repo.answersOf(id).filter((a) => a.review)
    expect(flagged.map((a) => a.name)).toEqual(['T1 Thing 3-2'])
    expect(flagged[0].note).toMatch(/tier_too_high/)
    expect(repo.getQuestion(id)!.notes).toMatch(/Dropped by the audit: T1 Thing 0-1/)
  })
  it('a question whose audit throws out too much is rejected; one with a bad question is flagged in its notes', async () => {
    const repo = testRepo()
    const many = fullAnswers('T1').answers.slice(0, 20).map((a) => ({ name: a.name, issue: 'not_valid', note: '' }))
    const r1 = await generateQuestions(repo, model(['Name a kind of soup.'], { audit: () => ({ question_ok: true, question_note: '', problems: many }) }), { categories: ['Food'], count: 1 })
    expect(r1.rejected).toHaveLength(1)
    const r2 = await generateQuestions(repo, model(['Name a kind of bread.'], { audit: () => ({ question_ok: false, question_note: 'Too vague.', problems: [] }) }), { categories: ['Food'], count: 1 })
    expect(repo.getQuestion(r2.drafted[0])!.notes).toMatch(/QUESTION has a problem: Too vague/)
  })
  it('an unusable audit reply is noted, not hidden', async () => {
    const repo = testRepo()
    const rep = await generateQuestions(repo, model(['Name a kind of soup.'], { audit: () => ({ junk: 1 }) }), { categories: ['Food'], count: 1 })
    expect(repo.getQuestion(rep.drafted[0])!.notes).toMatch(/NOT been audited/)
  })
  it('stops cleanly when the model budget runs out and keeps what was finished', async () => {
    const repo = testRepo()
    let n = 0
    const llm = new FakeLlm((req) => {
      const props = Object.keys(req.schema.properties ?? {})
      if (props.includes('questions')) return { questions: [{ prompt: `Name a thing number ${++n} here.`, rules: 'Anything real counts.' }, { prompt: 'Name a second wholly different item.', rules: 'Anything real counts.' }] }
      if (props.includes('answers')) return fullAnswers('B' + n)
      if (n >= 2) throw new LlmError('daily budget used up', 'budget')
      return clean
    })
    const rep = await generateQuestions(repo, llm, { categories: ['Food', 'Sports', 'Games'], count: 1 })
    expect(rep.drafted.length).toBeGreaterThanOrEqual(1)
    expect(rep.stopped).toMatch(/budget/)
  })
  it('an unknown category is refused', async () => {
    await expect(generateQuestions(testRepo(), model([]), { categories: ['Cooking'] })).rejects.toThrow(/Unknown category/)
  })
})

describe('checking a draft', () => {
  const mk = (name: string, tier: number, aliases: string[] = []): DraftAnswer => ({ name, tier, desc: '', aliases })
  it('removes duplicates and alias clashes, keeps at most three aliases', () => {
    const r = checkAnswers([mk('Brie', 1, ['brie cheese', 'Cheddar']), mk('brie!', 1), mk('Cheddar', 0, ['a', 'b', 'c', 'd'])])
    expect(r.answers.map((a) => a.name)).toEqual(['Brie', 'Cheddar'])
    expect(r.answers[0].aliases).toEqual(['brie cheese']) // "Cheddar" belongs to the answer Cheddar
    expect(r.answers[1].aliases).toHaveLength(3)
    expect(r.dropped.join()).toMatch(/duplicate/)
  })
  it('needs enough answers in every tier', () => {
    expect(checkAnswers(parseAnswers(fullAnswers('Z', MIN_PER_TIER))).failures.length).toBe(1) // only the total is short
    expect(checkAnswers(parseAnswers(fullAnswers('Z', 8))).failures).toEqual([])
    expect(checkAnswers([]).failures.length).toBeGreaterThan(6)
  })
  it('reads the model output defensively', () => {
    expect(parseProposals({ questions: [{ prompt: 'x', rules: 'y' }, { prompt: 'Name a thing.', rules: 'Any thing counts.' }] })).toHaveLength(1)
    expect(parseProposals('nonsense')).toEqual([])
    expect(parseAnswers({ answers: [{ name: 'A', tier: 9, desc: '', aliases: [] }, { name: 'B', tier: 2, desc: 'd', aliases: 'x' }] })).toEqual([{ name: 'B', tier: 2, desc: 'd', aliases: [] }])
    expect(parseAudit({ question_ok: 'yes' })).toBeNull()
    expect(applyAudit([mk('A', 1)], { questionOk: true, questionNote: '', problems: [{ name: 'a', issue: 'unsure', note: 'hm' }] }).flagged).toHaveLength(1)
  })
  it('ids are short, readable and unique; similar prompts are noticed', () => {
    expect(makeId('Food', 'Name a kind of cheese.', () => false)).toBe('food-cheese')
    expect(makeId('Animals & Nature', 'Name a flightless bird species.', () => false)).toBe('animals-flightless-bird-species')
    const taken = new Set(['food-cheese', 'food-cheese-2'])
    expect(makeId('Food', 'Name a type of cheese', (x) => taken.has(x))).toBe('food-cheese-3')
    expect(similarPrompts('Name a kind of cheese.', 'Name a type of cheese')).toBe(true)
    expect(similarPrompts('Name a kind of cheese.', 'Name a kind of soup.')).toBe(false)
  })
})

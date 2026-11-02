import { describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { migrate, openDb } from '../src/db/open'
import { MIGRATIONS } from '../src/db/schema'
import { Repo } from '../src/db/repo'
import { exportBank, importBank, importQuestion, seedIfEmpty } from '../src/bankio'
import { GuardedLlm } from '../src/llm/guard'
import { makeLlm } from '../src/llm/factory'
import { LlmError } from '../src/llm/types'
import { bank, FakeLlm, testRepo } from './helpers'

describe('database file', () => {
  it('creates the schema and records its version', () => {
    const db = openDb(':memory:')
    expect(db.pragma('user_version', { simple: true })).toBe(MIGRATIONS.length)
    migrate(db) // running again changes nothing
    expect(db.pragma('user_version', { simple: true })).toBe(MIGRATIONS.length)
  })
  it('refuses a database from a newer version', () => {
    const db = openDb(':memory:')
    db.pragma(`user_version = ${MIGRATIONS.length + 1}`)
    expect(() => migrate(db)).toThrow(/newer version/)
  })
  it('keeps its data in a real file between openings', () => {
    const dir = mkdtempSync(join(tmpdir(), 'minitude-'))
    try {
      const file = join(dir, 'sub', 'm.db')
      const a = new Repo(openDb(file))
      seedIfEmpty(a, bank, 1)
      a.db.close()
      const b = new Repo(openDb(file))
      expect(b.countByStatus().approved).toBe(bank.questions.length)
      expect(seedIfEmpty(b, bank, 2)).toBe(0) // not seeded twice
      b.db.close()
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
})

describe('seed import', () => {
  it('loads every question as approved, with aliases as spellings', () => {
    const repo = testRepo()
    expect(repo.countByStatus()).toEqual({ draft: 0, approved: bank.questions.length, rejected: 0 })
    const listed = bank.questions.reduce((n, q) => n + new Set(q.answers.map((a) => a.name.toLowerCase())).size, 0)
    expect(repo.stats().answers).toBeGreaterThanOrEqual(listed - 5)
    expect(repo.findStored('food-cheese', 'parmigiano reggiano')).toMatchObject({ kind: 'valid', answer: { name: 'Parmesan' } })
  })
  it('importing the same bank again adds nothing', () => {
    const repo = testRepo()
    const before = repo.stats()
    expect(importBank(repo, bank, { status: 'approved', source: 'seed', answerSource: 'seed', at: 9 })).toBe(0)
    expect(repo.stats()).toEqual(before)
  })
  it('a draft is not played until approved', () => {
    const repo = testRepo()
    importQuestion(repo, { id: 'd1', category: 'Food', prompt: 'Name a soup.', rules: 'Soups.', answers: [{ name: 'Pho', tier: 1 }] }, { status: 'draft', source: 'llm', answerSource: 'draft', model: 'm', at: 5 })
    expect(repo.approvedHeads().map((q) => q.id)).not.toContain('d1')
    repo.setQuestionStatus('d1', 'approved', 6)
    expect(repo.approvedHeads().map((q) => q.id)).toContain('d1')
  })
  it('export then import into an empty database gives the same questions', () => {
    const a = testRepo()
    const out = exportBank(a, ['approved'], 'test')
    const b = new Repo(openDb(':memory:'))
    importBank(b, out, { status: 'approved', source: 'import', answerSource: 'seed', at: 1 })
    expect(b.stats().answers).toBe(a.stats().answers)
    expect(b.stats().spellings).toBe(a.stats().spellings)
    for (const q of bank.questions) expect(b.answersOf(q.id).map((x) => [x.name, x.tier])).toEqual(a.answersOf(q.id).map((x) => [x.name, x.tier]))
  })
})

describe('corrections by a person', () => {
  it('changing a tier is logged and clears the review flag', () => {
    const repo = testRepo()
    repo.db.prepare("UPDATE answers SET review = 1 WHERE question_id = 'food-cheese' AND norm = 'cheddar'").run()
    expect(repo.setTier('food-cheese', 'cheddar', 2, 'too rare for common', 10)).toBe(true)
    expect(repo.getAnswer('food-cheese', 'cheddar')).toMatchObject({ tier: 2, review: false, source: 'admin' })
    expect(repo.db.prepare("SELECT before, after, reason FROM changes WHERE what = 'tier'").get()).toEqual({ before: '0', after: '2', reason: 'too rare for common' })
  })
  it('removing an answer stores a "does not count" and drops its spellings', () => {
    const repo = testRepo()
    expect(repo.invalidateAnswer('food-cheese', 'parmesan', 'Not allowed.', 'test', 10)).toBe(true)
    expect(repo.findStored('food-cheese', 'parmesan')).toEqual({ kind: 'invalid', message: 'Not allowed.' })
    expect(repo.findStored('food-cheese', 'parmigiano')).toBeNull()
  })
  it('runs keep their points when a tier is corrected later', () => {
    const repo = testRepo()
    const run = repo.createRun(repo.approvedHeads().slice(0, 7), 'mock', 1)
    repo.markStarted(run.id, 0, 2)
    repo.finishValid(run.id, 0, { answer: 'Cheddar', tier: 0, points: 10 }, 3)
    repo.setTier('food-cheese', 'cheddar', 5, null, 4)
    expect(repo.getRun(run.id)!.questions[0]).toMatchObject({ tier: 0, points: 10 })
  })
})

describe('model budget', () => {
  it('refuses calls beyond the per-minute and per-day budget, and logs every call', async () => {
    const repo = testRepo()
    let t = 1_000_000
    const llm = new GuardedLlm(new FakeLlm(), repo, { perMinute: 2, perDay: 3 }, () => t)
    const ask = () => llm.generateJson({ purpose: 'judge', system: '', prompt: '', schema: { type: 'OBJECT' } })
    await ask(); await ask()
    await expect(ask()).rejects.toMatchObject({ kind: 'budget' })
    t += 61_000
    await ask() // a new minute, third call of the day
    await expect(ask()).rejects.toBeInstanceOf(LlmError)
    expect(repo.stats().llmCalls).toBe(3)
    expect(llm.leftToday()).toBe(0)
    t += 86_400_000
    expect(llm.leftToday()).toBe(3)
  })
  it('a failed call is logged as a failure', async () => {
    const repo = testRepo()
    const llm = new GuardedLlm(new FakeLlm(() => { throw new LlmError('model http 503') }), repo)
    await expect(llm.generateJson({ purpose: 'judge', system: '', prompt: '', schema: { type: 'OBJECT' } })).rejects.toThrow('503')
    expect(repo.stats()).toMatchObject({ llmCalls: 1, llmFailures: 1 })
  })
  it('the model is chosen from environment variables', () => {
    const repo = testRepo()
    expect(makeLlm(repo, {}).llm).toBeNull()
    expect(makeLlm(repo, { LLM_PROVIDER: 'mock', GEMINI_API_KEY: 'k' }).llm).toBeNull()
    expect(makeLlm(repo, { LLM_PROVIDER: 'gemini' }).llm).toBeNull()
    const g = makeLlm(repo, { GEMINI_API_KEY: 'k', LLM_MODEL: 'some-model' })
    expect(g.llm?.model).toBe('some-model')
    expect(g.describe).toMatch(/some-model/)
    expect(g.describe).not.toMatch(/k$/)
  })
})

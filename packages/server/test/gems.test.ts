import { describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp } from '../src/app'
import { runCli, type CliContext } from '../src/cli/commands'
import { migrate } from '../src/db/open'
import { Repo, runTotal } from '../src/db/repo'
import { MIGRATIONS } from '../src/db/schema'
import { PipelineJudge } from '../src/judge/pipeline'
import { normalize } from '../src/normalize'
import { head, testRepo } from './helpers'

const Q = 'food-cheese'
/** the seed question's answer of a tier, to use as the gem */
const answerOf = (repo: Repo, tier: number) => repo.answersOf(Q).find((a) => a.tier === tier)!

function make() {
  const repo = testRepo()
  const judge = new PipelineJudge(repo, null, () => 5_000)
  // a long, made-up answer, so that a one-letter slip is reliably a slip and not another answer
  const gem = repo.insertAnswer({ questionId: Q, norm: normalize('Pecorino Sardo Dolce'), name: 'Pecorino Sardo Dolce', tier: 5, source: 'admin', at: 1 }).row
  repo.setGem(Q, gem.norm, 'A very rare cheese, made in one village.', null, 9)
  return { repo, judge, q: head(repo, Q), gem }
}

describe('the gems table', () => {
  it('is added by migration 4 and an older database upgrades without losing anything', () => {
    expect(MIGRATIONS.length).toBeGreaterThanOrEqual(4)
    const raw = new Database(':memory:')
    raw.pragma('foreign_keys = ON')
    for (let v = 0; v < 3; v++) raw.exec(MIGRATIONS[v])
    raw.pragma('user_version = 3')
    raw.prepare("INSERT INTO questions (id, category, prompt, rules, status, source, policy_version, created_at) VALUES ('q','Food','Name a food.','r','approved','seed','v1',1)").run()
    raw.prepare("INSERT INTO answers (question_id, norm, name, tier, source, created_at) VALUES ('q','apple','Apple',0,'seed',1)").run()
    migrate(raw)
    expect(raw.pragma('user_version', { simple: true })).toBe(MIGRATIONS.length)
    expect(raw.prepare('SELECT COUNT(*) n FROM gems').get()).toEqual({ n: 0 })
    expect(raw.prepare('SELECT name FROM answers').all()).toEqual([{ name: 'Apple' }])
  })
  it('holds one gem per question, replaced by the next one set', () => {
    const { repo, gem } = make()
    const other = answerOf(repo, 4)
    expect(repo.gemOf(Q)?.answerNorm).toBe(gem.norm)
    expect(repo.setGem(Q, other.norm, 'Another one.', null, 10)).toBe(true)
    expect(repo.gemOf(Q)).toEqual({ answerNorm: other.norm, description: 'Another one.' })
    expect(repo.listGems().length).toBe(1)
  })
  it('refuses an answer the question does not have, and keeps the answer own stored rarity', () => {
    const { repo, gem } = make()
    expect(repo.setGem(Q, 'no such answer', null, null, 1)).toBe(false)
    expect(repo.getAnswer(Q, gem.norm)!.tier).toBe(5)
  })
  it('removing the gem answer removes its gem, and says so in the change log', () => {
    const { repo, gem } = make()
    repo.invalidateAnswer(Q, gem.norm, "That doesn't count.", 'test', 11)
    expect(repo.gemOf(Q)).toBeUndefined()
    const log = repo.db.prepare("SELECT what FROM changes WHERE question_id = ? AND what = 'gem removed'").all(Q)
    expect(log.length).toBeGreaterThan(0)
  })
})

describe('the answer checker and gems', () => {
  it('the gem answer scores as SINGULARITY (tier 6, 120) with its own one-line story; the stored rarity stays Mythic', async () => {
    const { judge, q, gem, repo } = make()
    const r = await judge.judge(q, gem.name)
    expect(r.res).toMatchObject({ status: 'valid', answer: gem.name, tier: 6, points: 120, description: 'A very rare cheese, made in one village.' })
    expect(repo.getAnswer(Q, gem.norm)!.tier).toBe(5)
  })
  it('every other answer still scores by its own tier', async () => {
    const { judge, q, gem, repo } = make()
    for (const a of repo.answersOf(Q).filter((x) => x.norm !== gem.norm).slice(0, 40)) {
      const r = await judge.judge(q, a.name)
      expect(r.res.tier).toBe(a.tier)
    }
  })
  it('an alias of the gem is the gem', async () => {
    const { judge, q, gem, repo } = make()
    repo.insertSpelling({ questionId: Q, norm: normalize('the one village cheese'), verdict: 'valid', canonNorm: gem.norm, source: 'alias', at: 1 })
    const r = await judge.judge(q, 'The One Village Cheese')
    expect(r.res).toMatchObject({ status: 'valid', tier: 6, points: 120, answer: gem.name })
  })
  it('another way of writing the gem is accepted at once and is the gem', async () => {
    const { judge, q, repo } = make()
    const hyphen = repo.insertAnswer({ questionId: Q, norm: normalize('Saint Marcellin'), name: 'Saint Marcellin', tier: 5, source: 'admin', at: 1 }).row
    repo.setGem(Q, hyphen.norm, 'Soft, from one valley.', null, 2)
    const r = await judge.judge(q, 'St-Marcellin')
    expect(r.res).toMatchObject({ status: 'valid', tier: 6 })
  })
  it('a slip is asked about first (no tier, no points), and a yes gives the gem', async () => {
    const { judge, q, gem } = make()
    const slip = 'Pecorino Sardo Dolc'
    const ask = await judge.judge(q, slip)
    expect(ask.res.status).toBe('confirm')
    expect(ask.res.tier).toBeUndefined()
    expect(ask.res.points).toBeUndefined()
    const yes = await judge.judge(q, slip, 'confirmed')
    expect(yes.res).toMatchObject({ status: 'valid', tier: 6, points: 120 })
  })
  it('a question without a gem is exactly as before', async () => {
    const { judge, repo } = make()
    const q2 = head(repo, 'places-landlocked')
    const a = repo.answersOf('places-landlocked').find((x) => x.tier === 5)!
    expect((await judge.judge(q2, a.name)).res).toMatchObject({ tier: 5, points: 100 })
  })
  it('clearing the gem puts the answer back to its own tier', async () => {
    const { judge, q, gem, repo } = make()
    repo.clearGem(Q, 20)
    expect((await judge.judge(q, gem.name)).res).toMatchObject({ tier: 5, points: 100 })
  })
  it('a gem answer typed "as typed" after a no still counts as the gem when it is exactly the answer', async () => {
    const { judge, q, gem } = make()
    expect((await judge.judge(q, gem.name, 'literal')).res).toMatchObject({ tier: 6 })
  })
  it('the gem reply says nothing about how answers are checked', async () => {
    const { judge, q, gem } = make()
    const text = JSON.stringify((await judge.judge(q, gem.name)).res).toLowerCase()
    for (const word of ['model', 'gemini', 'llm', 'list', 'mock', 'ai ', 'checker', 'singularity', 'gem']) expect(text).not.toContain(word)
  })
})

describe('gems over the API', () => {
  function setup() {
    const { repo, judge, gem } = make()
    let t = 1_000_000
    const app = createApp({ repo, judge, rand: () => 0.3, now: () => t, rateLimitPerMinute: 10_000 })
    const post = async (path: string, body: unknown) => {
      const r = await app.request(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      return { status: r.status, json: (await r.json()) as any }
    }
    return { repo, app, post, gem, tick: (ms: number) => { t += ms } }
  }
  it('a run that answers its gem is scored 120 and stores tier 6', async () => {
    const { repo, post, gem } = setup()
    // a run made directly, so the gem question is certainly in it (the picker is random)
    const others = repo.approvedHeads().filter((h) => h.id !== Q).slice(0, 6)
    const runId = repo.createRun([head(repo, Q), ...others], 'list', 1_000_000).id
    const idx = 0
    await post(`/api/run/${runId}/start`, { index: idx })
    const res = await post(`/api/run/${runId}/answer`, { index: idx, text: gem.name })
    expect(res.json).toMatchObject({ status: 'valid', tier: 6, points: 120 })
    const run = repo.getRun(runId)!
    expect(run.questions[idx]).toMatchObject({ result: 'valid', tier: 6, points: 120 })
    expect(runTotal(run)).toBe(120)
  })
  it('/api/gems gives counts by category and nothing else: no prompt, no answer, no id', async () => {
    const { app, repo, gem } = setup()
    const body = await (await app.request('/api/gems')).json() as any
    expect(body.total).toBe(1)
    expect(body.categories).toEqual([{ name: repo.getQuestion(Q)!.category, total: 1 }])
    const text = JSON.stringify(body)
    expect(text).not.toContain(gem.name)
    expect(text).not.toContain(repo.getQuestion(Q)!.prompt)
    expect(text).not.toContain(Q)
  })
  it('/api/gems counts only approved questions', async () => {
    const { app, repo } = setup()
    repo.setQuestionStatus(Q, 'rejected', 5)
    expect(((await (await app.request('/api/gems')).json()) as any).total).toBe(0)
  })
  it('the run, start and health replies carry no gem information', async () => {
    const { app, post } = setup()
    const created = await post('/api/run', {})
    const first = await post(`/api/run/${created.json.runId}/start`, { index: 0 })
    const text = (JSON.stringify(created.json) + JSON.stringify(first.json) + (await (await app.request('/api/health')).text())).toLowerCase()
    expect(text).not.toContain('gem')
    expect(text).not.toContain('singularity')
  })
})

describe('gems on the command line', () => {
  function ctx() {
    const repo = testRepo()
    const lines: string[] = []
    const c: CliContext & { lines: string[] } = { repo, llm: null, llmNote: 'no model', dbFile: ':memory:', now: () => 123_456, out: (s) => lines.push(s), lines }
    return { repo, c, run: async (argv: string[]) => { lines.length = 0; const code = await runCli(argv, c); return { code, text: lines.join('\n') } } }
  }
  const file = (content: unknown) => {
    const dir = mkdtempSync(join(tmpdir(), 'gems-'))
    const f = join(dir, 'gems.json')
    writeFileSync(f, JSON.stringify(content))
    return { f, done: () => rmSync(dir, { recursive: true, force: true }) }
  }

  it('set, list and clear', async () => {
    const { repo, run } = ctx()
    const a = answerOf(repo, 5)
    expect((await run(['gems', 'set', Q, a.name, 'A line.', '--note', 'checked'])).code).toBe(0)
    expect(repo.gemOf(Q)?.description).toBe('A line.')
    expect((await run(['gems', 'list'])).text).toContain(a.name)
    expect((await run(['gems', 'clear', Q])).code).toBe(0)
    expect(repo.gemOf(Q)).toBeUndefined()
    expect((await run(['gems', 'clear', Q])).code).toBe(1)
    expect((await run(['gems', 'set', Q, 'not an answer at all'])).code).toBe(1)
  })
  it('import: a dry run changes nothing, a real run sets the gems, running it again changes nothing, and bad entries are reported', async () => {
    const { repo, run } = ctx()
    const a = answerOf(repo, 5)
    const { f, done } = file({ gems: [
      { question: Q, answer: a.name, description: 'The line.', tier: 5 },
      { question: 'no-such-question', answer: 'x', description: 'y' },
      { question: 'places-landlocked', answer: 'not an answer', description: 'y' },
    ] })
    try {
      const dry = await run(['gems', 'import', f, '--dry-run'])
      expect(dry.text).toContain('Would set 1 new gem')
      expect(repo.gemOf(Q)).toBeUndefined()
      const real = await run(['gems', 'import', f])
      expect(real.code).toBe(1) // two entries were skipped
      expect(real.text).toContain('Set 1 new gem')
      expect(real.text).toContain('no such question')
      expect(real.text).toContain('is not an answer of that question')
      expect(repo.gemOf(Q)).toEqual({ answerNorm: a.norm, description: 'The line.' })
      const again = await run(['gems', 'import', f])
      expect(again.text).toContain('Set 0 new gems, 0 changed, 1 already as in the file')
    } finally { done() }
  })
  it('import only takes approved questions and warns when the stored tier differs', async () => {
    const { repo, run } = ctx()
    const a = answerOf(repo, 3)
    repo.setQuestionStatus('places-landlocked', 'rejected', 1)
    const other = repo.answersOf('places-landlocked')[0]
    const { f, done } = file([{ question: Q, answer: a.name, description: 'x', tier: 5 }, { question: 'places-landlocked', answer: other.name, description: 'x' }])
    try {
      const r = await run(['gems', 'import', f])
      expect(r.text).toContain('the question is not approved')
      expect(r.text).toContain(`is tier ${a.tier} here, the file says 5`)
    } finally { done() }
  })
  it('audit finds questions without a gem, gems that are not Mythic (unless the owner says so), and passes when all is well', async () => {
    const { repo, run } = ctx()
    const heads = repo.approvedHeads()
    const first = await run(['gems', 'audit'])
    expect(first.code).toBe(1)
    expect(first.text).toContain(`${heads.length} approved question(s) have no gem`)
    for (const h of heads) {
      const pick = repo.answersOf(h.id).find((x) => x.tier === 5) ?? repo.answersOf(h.id)[0]
      repo.setGem(h.id, pick.norm, 'A line.', pick.tier === 5 ? null : "the owner's own pick", 3)
    }
    const ok = await run(['gems', 'audit'])
    expect(ok.text).toContain(`All good: ${heads.length} gems`)
    expect(ok.code).toBe(0)
    const h0 = heads[0]
    const weak = repo.answersOf(h0.id).find((x) => x.tier === 1)!
    repo.setGem(h0.id, weak.norm, 'A line.', null, 4)
    const bad = await run(['gems', 'audit'])
    expect(bad.code).toBe(1)
    expect(bad.text).toContain('are not Mythic and have no note')
  })
})

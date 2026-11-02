import { describe, expect, it } from 'vitest'
import { createApp, pickRun, GRACE_MS, MAX_ATTEMPTS_PER_QUESTION, QUESTION_SECONDS, START_DELAY_MS } from '../src/app'
import { openDb } from '../src/db/open'
import { Repo } from '../src/db/repo'
import { PipelineJudge } from '../src/judge/pipeline'
import { lookup } from '../src/match'
import { bank, dec, FakeLlm, testRepo } from './helpers'

/** an app on a fake clock, so tests can say "30 seconds later" without waiting */
function setup(opts: { llm?: FakeLlm | null; repo?: Repo } = {}) {
  const repo = opts.repo ?? testRepo()
  let t = 1_000_000
  const clock = { now: () => t, advance: (ms: number) => { t += ms } }
  const llm = opts.llm === undefined ? null : opts.llm
  const judge = new PipelineJudge(repo, llm, clock.now)
  const app = createApp({ repo, judge, rand: () => 0.3, now: clock.now, rateLimitPerMinute: 10_000 })
  const post = async (path: string, body: unknown) => {
    const r = await app.request(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    return { status: r.status, json: (await r.json()) as any }
  }
  /** starts a run; `questions` is read straight from the database (the API itself sends no prompt before a question starts) */
  const newRun = async () => {
    const j = (await post('/api/run', {})).json as { runId: string; count: number; seconds: number; checker: string; mode: string }
    return { ...j, questions: repo.getRun(j.runId)!.questions.map((q) => ({ id: q.id, category: q.category, prompt: q.prompt })) }
  }
  return { repo, app, clock, post, newRun, llm }
}

/** an answer that the seed bank lists for a question */
const listed = (qid: string, tier = 0) => bank.questions.find((q) => q.id === qid)!.answers.find((a) => a.tier === tier)!.name

describe('matching a seed question', () => {
  const cheese = bank.questions.find((q) => q.id === 'food-cheese')!
  it('exact, alias, accents and articles', () => {
    expect((lookup(cheese, 'cheddar') as any).name).toBe('Cheddar')
    expect((lookup(cheese, 'Parmigiano Reggiano') as any).name).toBe('Parmesan')
    expect((lookup(cheese, 'gruyere') as any).name).toBe('Gruyère')
    expect((lookup(cheese, '  CHEDDAR!! ') as any).name).toBe('Cheddar')
  })
  it('forgives one typo in a longer word, none in a short one', () => {
    expect((lookup(cheese, 'chedar') as any).name).toBe('Cheddar')
    expect(lookup(cheese, 'brei')).toBeNull()
  })
  it('does not guess when it is unlisted', () => {
    expect(lookup(cheese, 'zorblax')).toBeNull()
  })
})

describe('api basics', () => {
  it('health', async () => {
    const { app } = setup()
    const j = (await (await app.request('/api/health')).json()) as any
    expect(j.ok).toBe(true)
    expect(j.checker).toBe('mock')
    expect(j.questions).toBe(bank.questions.length)
  })
  it('a run has seven questions and the clock length, and sends no prompt until a question starts', async () => {
    const { post } = setup()
    const created = await post('/api/run', {})
    expect(created.json.count).toBe(7)
    expect(created.json.seconds).toBe(QUESTION_SECONDS)
    expect(created.json.mode).toBe('solo')
    expect(created.json.questions).toBeUndefined()
    const first = await post(`/api/run/${created.json.runId}/start`, { index: 0 })
    expect(first.json.question.prompt.length).toBeGreaterThan(5)
    expect(first.json.question.category).toBeTruthy()
    expect(JSON.stringify(created.json)).not.toContain(first.json.question.prompt)
    expect(JSON.stringify(first.json)).not.toContain('Cheddar')
    // the next prompt cannot be had before this question is finished
    const next = await post(`/api/run/${created.json.runId}/start`, { index: 1 })
    expect(next.status).toBe(409)
    expect(JSON.stringify(next.json)).not.toMatch(/prompt/)
  })
  it('asking to start the same question again gives the same prompt and does not restart its clock', async () => {
    const { post, clock, newRun } = setup()
    const run = await newRun()
    const a = await post(`/api/run/${run.runId}/start`, { index: 0 })
    clock.advance(10_000)
    const b = await post(`/api/run/${run.runId}/start`, { index: 0 })
    expect(b.json.question).toEqual(a.json.question)
    expect(b.json.secondsLeft).toBeLessThan(a.json.secondsLeft - 9.9)
  })
  it('refuses to start a run when there are not enough approved questions', async () => {
    const empty = new Repo(openDb(':memory:'))
    const { post } = setup({ repo: empty })
    const r = await post('/api/run', {})
    expect(r.status).toBe(503)
    expect(r.json.code).toBe('no_questions')
  })
  it('draft questions are never played', async () => {
    const repo = testRepo()
    repo.setQuestionStatus('food-cheese', 'rejected', 5)
    const { newRun } = setup({ repo })
    for (let i = 0; i < 5; i++) expect((await newRun()).questions.map((q) => q.id)).not.toContain('food-cheese')
  })
  it('pickRun uses different categories when it can', () => {
    const picked = pickRun(bank.questions, Math.random)
    expect(new Set(picked.map((q) => q.category)).size).toBe(picked.length)
  })
  it('rejects bad input', async () => {
    const { newRun, post } = setup()
    const run = await newRun()
    expect((await post(`/api/run/${run.runId}/answer`, { index: 9, text: 'x' })).status).toBe(400)
    expect((await post(`/api/run/${run.runId}/answer`, { index: 0, text: '' })).status).toBe(400)
    expect((await post(`/api/run/${run.runId}/answer`, { index: 0, text: 'x'.repeat(200) })).status).toBe(400)
    expect((await post(`/api/run/nope/answer`, { index: 0, text: 'x' })).status).toBe(404)
    expect((await post(`/api/run/${run.runId}/start`, { index: -1 })).status).toBe(400)
  })
})

describe('answering and the server clock', () => {
  it('a question must be started before it can be answered', async () => {
    const { newRun, post } = setup()
    const run = await newRun()
    const r = await post(`/api/run/${run.runId}/answer`, { index: 0, text: listed(run.questions[0].id) })
    expect(r.status).toBe(409)
    expect(r.json.code).toBe('not_started')
  })
  it('questions start in order', async () => {
    const { newRun, post } = setup()
    const run = await newRun()
    const r = await post(`/api/run/${run.runId}/start`, { index: 1 })
    expect(r.status).toBe(409)
    expect(r.json.code).toBe('order')
  })
  it('a valid answer returns tier and points once, then the question is finished', async () => {
    const { newRun, post } = setup()
    const run = await newRun()
    const q = run.questions[0]
    await post(`/api/run/${run.runId}/start`, { index: 0 })
    const r = await post(`/api/run/${run.runId}/answer`, { index: 0, text: listed(q.id, 2) })
    expect(r.json.status).toBe('valid')
    expect(r.json.tier).toBe(2)
    expect(r.json.points).toBe(40)
    const again = await post(`/api/run/${run.runId}/answer`, { index: 0, text: listed(q.id, 0) })
    expect(again.status).toBe(409)
    expect(again.json.code).toBe('finished')
    expect(((await post(`/api/run/${run.runId}/start`, { index: 1 })).json as any).ok).toBe(true)
  })
  it('an unknown answer is unresolved, not invalid, and does not finish the question', async () => {
    const { newRun, post } = setup()
    const run = await newRun()
    await post(`/api/run/${run.runId}/start`, { index: 0 })
    const r = await post(`/api/run/${run.runId}/answer`, { index: 0, text: 'qwertyuiop' })
    expect(r.json.status).toBe('unresolved')
    const ok = await post(`/api/run/${run.runId}/answer`, { index: 0, text: listed(run.questions[0].id) })
    expect(ok.json.status).toBe('valid')
  })
  it('an answer inside the time (and the grace period) counts; one after it is a miss', async () => {
    const { newRun, post, clock, app } = setup()
    const run = await newRun()
    await post(`/api/run/${run.runId}/start`, { index: 0 })
    clock.advance(QUESTION_SECONDS * 1000 + START_DELAY_MS + GRACE_MS - 10)
    const inTime = await post(`/api/run/${run.runId}/answer`, { index: 0, text: listed(run.questions[0].id) })
    expect(inTime.json.status).toBe('valid')

    await post(`/api/run/${run.runId}/start`, { index: 1 })
    clock.advance(QUESTION_SECONDS * 1000 + START_DELAY_MS + GRACE_MS + 10)
    const late = await post(`/api/run/${run.runId}/answer`, { index: 1, text: listed(run.questions[1].id) })
    expect(late.status).toBe(409)
    expect(late.json.code).toBe('late')
    // the late question is closed as a miss, so the run moves on
    expect(((await post(`/api/run/${run.runId}/start`, { index: 2 })).json as any).ok).toBe(true)
    const total = (await (await app.request(`/api/run/${run.runId}`)).json()) as any
    expect(total.total).toBe(10)
    expect(total.answered).toBe(2)
  })
  it('time the server spends checking is not the player\'s time', async () => {
    let clockRef: { advance(ms: number): void } | null = null
    // the model is slow (20 s) and unsure, so the player has to try again
    const llm = new FakeLlm(() => { clockRef!.advance(20_000); return dec({ confidence: 'low' }) })
    const s = setup({ llm })
    clockRef = s.clock
    const run = await s.newRun()
    await s.post(`/api/run/${run.runId}/start`, { index: 0 })
    s.clock.advance(5_000)
    const slow = await s.post(`/api/run/${run.runId}/answer`, { index: 0, text: 'a brand new thing' })
    expect(slow.json.status).toBe('unresolved')
    s.clock.advance(15_000)  // 40 s since the start, but only 20 s of it was the player's
    const again = await s.post(`/api/run/${run.runId}/answer`, { index: 0, text: listed(run.questions[0].id) })
    expect(again.json.status).toBe('valid')
  })
  it('the same wait without any checking time is too late', async () => {
    const s = setup()
    const run = await s.newRun()
    await s.post(`/api/run/${run.runId}/start`, { index: 0 })
    s.clock.advance(40_000)
    const late = await s.post(`/api/run/${run.runId}/answer`, { index: 0, text: listed(run.questions[0].id) })
    expect(late.json.code).toBe('late')
  })
  it('a question accepts only so many tries', async () => {
    const { newRun, post } = setup()
    const run = await newRun()
    await post(`/api/run/${run.runId}/start`, { index: 0 })
    for (let i = 0; i < MAX_ATTEMPTS_PER_QUESTION; i++) {
      expect((await post(`/api/run/${run.runId}/answer`, { index: 0, text: 'nope' + i })).json.status).toBe('unresolved')
    }
    const r = await post(`/api/run/${run.runId}/answer`, { index: 0, text: 'one more' })
    expect(r.status).toBe(429)
    expect(r.json.code).toBe('too_many')
  })
  it('a miss closes the question and a late answer cannot reopen it', async () => {
    const { newRun, post } = setup()
    const run = await newRun()
    await post(`/api/run/${run.runId}/start`, { index: 0 })
    expect((await post(`/api/run/${run.runId}/miss`, { index: 0 })).status).toBe(200)
    expect((await post(`/api/run/${run.runId}/answer`, { index: 0, text: listed(run.questions[0].id) })).status).toBe(409)
  })
  it('every try is logged for later', async () => {
    const { newRun, post, repo } = setup()
    const run = await newRun()
    await post(`/api/run/${run.runId}/start`, { index: 0 })
    await post(`/api/run/${run.runId}/answer`, { index: 0, text: 'qwerty' })
    await post(`/api/run/${run.runId}/answer`, { index: 0, text: listed(run.questions[0].id) })
    expect(repo.attemptCount(run.runId, 0)).toBe(2)
  })
})

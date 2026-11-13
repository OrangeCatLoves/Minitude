import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { runCli, type CliContext } from '../src/cli/commands'
import { PipelineJudge } from '../src/judge/pipeline'
import { IDEA_MAX, tidyIdea } from '../src/siteRoutes'
import { testRepo } from './helpers'

/** an app on a fake clock where every request can come from a chosen network address */
function setup() {
  const repo = testRepo()
  let t = Date.UTC(2026, 10, 13, 12, 0, 0)
  const clock = { now: () => t, advance: (ms: number) => { t += ms } }
  const app = createApp({ repo, judge: new PipelineJudge(repo, null, clock.now), rand: () => 0.3, now: clock.now, rateLimitPerMinute: 10_000, clientIp: (c) => c.req.header('x-test-ip') ?? '203.0.113.9' })
  const post = async (path: string, body: unknown, ip = '203.0.113.9') => {
    const r = await app.request(path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-test-ip': ip }, body: typeof body === 'string' ? body : JSON.stringify(body) })
    return { status: r.status, json: (await r.json()) as any }
  }
  return { repo, app, clock, post }
}

describe('"how was that dive?"', () => {
  it('stores a rating for a real run, and a second tap on the same run changes the score instead of adding one', async () => {
    const { repo, post } = setup()
    const run = (await post('/api/run', {})).json.runId as string
    expect((await post('/api/rating', { runId: run, score: 3 })).status).toBe(200)
    expect((await post('/api/rating', { runId: run, score: 5 })).status).toBe(200)
    const s = repo.ratingSummary()
    expect(s.total).toBe(1)
    expect(s.average).toBe(5)
    expect(s.byMode.solo.n).toBe(1)
  })

  it('takes the kind of run from the run itself, not from the browser', async () => {
    const { repo, post } = setup()
    const run = (await post('/api/run', {})).json.runId as string
    await post('/api/rating', { runId: run, mode: 'versus', score: 4 })
    expect(Object.keys(repo.ratingSummary().byMode)).toEqual(['solo'])
  })

  it('a multiplayer match has no run: it is rated as "versus", and only as that', async () => {
    const { repo, post } = setup()
    expect((await post('/api/rating', { mode: 'versus', score: 2 })).status).toBe(200)
    expect((await post('/api/rating', { mode: 'versus', score: 4 })).status).toBe(200)
    expect(repo.ratingSummary().byMode.versus.n).toBe(2)
    expect((await post('/api/rating', { mode: 'solo', score: 4 })).status).toBe(400)
    expect((await post('/api/rating', { score: 4 })).status).toBe(400)
  })

  it('refuses a score that is not 1 to 5, a run that does not exist, and a body that is not JSON', async () => {
    const { repo, post } = setup()
    const run = (await post('/api/run', {})).json.runId as string
    for (const score of [0, 6, 2.5, '3', null, undefined]) expect((await post('/api/rating', { runId: run, score })).status).toBe(400)
    expect((await post('/api/rating', { runId: 'nope', score: 3 })).status).toBe(404)
    expect((await post('/api/rating', 'not json')).status).toBe(400)
    expect(repo.ratingSummary().total).toBe(0)
  })

  it('keeps no guest id and no address: only the score, the day and a one-way fingerprint', async () => {
    const { repo, post } = setup()
    await post('/api/rating', { mode: 'versus', score: 5 })
    const row = repo.db.prepare('SELECT * FROM ratings').get() as Record<string, unknown>
    expect(Object.keys(row).sort()).toEqual(['created_at', 'day', 'id', 'ip_hash', 'mode', 'run_id', 'score'])
    expect(String(row.ip_hash)).not.toContain('203.0.113.9')
    expect(row.day).toBe('2026-11-13')
  })
})

describe('"got an idea for a question?"', () => {
  it('stores a tidy idea and lists it for a person', async () => {
    const { repo, post } = setup()
    expect((await post('/api/suggest', { text: '  name   a type of cloud  ' })).json).toEqual({ ok: true })
    expect(repo.listSuggestions('new', 10).map((s) => s.text)).toEqual(['name a type of cloud'])
  })

  it('asks for a little more when it is too short, and refuses a very long one', async () => {
    const { repo, post } = setup()
    expect((await post('/api/suggest', { text: 'cl' })).json.code).toBe('short')
    expect((await post('/api/suggest', { text: '12345 678' })).json.code).toBe('short')   // no letters to speak of
    expect((await post('/api/suggest', { text: 'a'.repeat(IDEA_MAX + 1) })).json.code).toBe('long')
    expect((await post('/api/suggest', { text: 42 })).json.code).toBe('short')
    expect(repo.countSuggestions('all')).toBe(0)
  })

  it('does not take links, which are almost always advertisements', async () => {
    const { repo, post } = setup()
    for (const text of ['visit https://example.com for prizes', 'buy at www.shop-now.biz today', 'try cheap-pills.shop please']) {
      expect((await post('/api/suggest', { text })).json.code).toBe('link')
    }
    expect(repo.countSuggestions('all')).toBe(0)
  })

  it('says thanks to a robot that fills in the hidden field, and keeps nothing', async () => {
    const { repo, post } = setup()
    expect((await post('/api/suggest', { text: 'name a type of cloud', website: 'http://spam.example' })).json).toEqual({ ok: true })
    expect(repo.countSuggestions('all')).toBe(0)
  })

  it('keeps the same idea once, whatever the capitals, without telling the sender', async () => {
    const { repo, post } = setup()
    await post('/api/suggest', { text: 'Name a type of cloud' }, '198.51.100.1')
    expect((await post('/api/suggest', { text: 'name a TYPE of cloud' }, '198.51.100.2')).json).toEqual({ ok: true })
    expect(repo.countSuggestions('all')).toBe(1)
  })

  it('lets one network send five a day, then asks it to come back tomorrow, while other networks are not affected', async () => {
    const { repo, post, clock } = setup()
    for (let i = 0; i < 5; i++) expect((await post('/api/suggest', { text: `name a kind of thing number ${'x'.repeat(i + 1)}` })).status).toBe(200)
    const sixth = await post('/api/suggest', { text: 'name another kind of thing' })
    expect(sixth.status).toBe(429)
    expect(sixth.json.code).toBe('limit')
    expect((await post('/api/suggest', { text: 'name a kind of fruit from elsewhere' }, '198.51.100.7')).status).toBe(200)
    clock.advance(24 * 3600_000)
    expect((await post('/api/suggest', { text: 'name another kind of thing' })).status).toBe(200)
    expect(repo.countSuggestions('all')).toBe(7)
  })

  it('stops taking ideas when too many are unread (the limit is 5,000; a tiny one proves the rule)', async () => {
    const { mountSite } = await import('../src/siteRoutes')
    const { Hono } = await import('hono')
    const mini = new Hono()
    mountSite(mini, { repo: testRepo(), clientIp: () => '203.0.113.50', now: () => Date.now(), maxUnread: 2, ideasPerDay: 0 })
    const send = (text: string) => mini.request('/api/suggest', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) })
    expect((await send('name a kind of tree')).status).toBe(200)
    expect((await send('name a kind of bird')).status).toBe(200)
    expect((await send('name a kind of fish')).status).toBe(503)
  })

  it('cleans text: control characters, runs of spaces and odd line breaks', () => {
    expect(tidyIdea('a\u0000b\u0007  c\n\nd e')).toBe('a b c d e')
    expect(tidyIdea(null)).toBe('')
    expect(tidyIdea('   ')).toBe('')
  })
})

describe('what a person can do with them', () => {
  const ctx = (repo = testRepo()): CliContext & { lines: string[] } => {
    const lines: string[] = []
    return { repo, llm: null, llmNote: 'none', dbFile: ':memory:', now: () => 1, out: (s) => lines.push(s), lines }
  }

  it('lists new ideas, marks one as used, and shows ratings', async () => {
    const { repo, post } = setup()
    await post('/api/suggest', { text: 'name a type of cloud' })
    await post('/api/suggest', { text: 'name a famous bridge' })
    await post('/api/rating', { mode: 'versus', score: 4 })
    await post('/api/rating', { mode: 'versus', score: 2 })
    const c = ctx(repo)
    expect(await runCli(['suggestions', 'list'], c)).toBe(0)
    expect(c.lines.join('\n')).toContain('name a famous bridge')
    expect(c.lines.join('\n')).toContain('2 shown. In all: 2 new, 0 used, 0 skipped.')
    const id = repo.listSuggestions('new', 5).find((s) => s.text.includes('cloud'))!.id
    const m = ctx(repo)
    expect(await runCli(['suggestions', 'mark', String(id), 'used'], m)).toBe(0)
    const after = ctx(repo)
    await runCli(['suggestions', 'list'], after)
    expect(after.lines.join('\n')).not.toContain('cloud')
    const r = ctx(repo)
    expect(await runCli(['ratings'], r)).toBe(0)
    expect(r.lines[0]).toBe('2 ratings, average 3.00 out of 5')
    expect(await runCli(['suggestions', 'mark', '999', 'used'], ctx(repo))).toBe(1)
    expect(await runCli(['suggestions', 'list', '--status', 'weird'], ctx(repo))).toBe(1)
  })

  it('db stats counts them', async () => {
    const { repo, post } = setup()
    await post('/api/suggest', { text: 'name a type of cloud' })
    const c = ctx(repo)
    await runCli(['db', 'stats'], c)
    expect(c.lines.join('\n')).toMatch(/suggestionsNew\s+1/)
    expect(c.lines.join('\n')).toMatch(/ratings\s+0/)
  })
})

describe('the new replies say nothing about how answers are checked', () => {
  const LEAK = /backup-model|fake-model|gemini|flash|fallback|failover|\bllm\b|\bmodel\b|http \d{3}|\bmock\b|\blists?\b/i
  it('every reply, good or bad, passes the same guard as the rest of the API', async () => {
    const { post } = setup()
    const run = (await post('/api/run', {})).json.runId as string
    const replies = [
      await post('/api/rating', { runId: run, score: 4 }), await post('/api/rating', { runId: run, score: 9 }), await post('/api/rating', { runId: 'x', score: 3 }),
      await post('/api/rating', 'nope'), await post('/api/suggest', { text: 'hi' }), await post('/api/suggest', { text: 'see http://a.com ok' }),
      await post('/api/suggest', { text: 'a'.repeat(300) }), await post('/api/suggest', { text: 'name a type of cloud' }),
    ]
    for (const r of replies) expect(JSON.stringify(r.json)).not.toMatch(LEAK)
  })
})

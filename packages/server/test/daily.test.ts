import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'
import { RUN_LENGTH } from '@minitude/core'
import { createApp, STALE_RUN_MS } from '../src/app'
import { backupIfDue } from '../src/backup'
import { ipFingerprint, isLoopback } from '../src/clientip'
import { ensureDailySet, epochDay, pickDaily } from '../src/daily'
import { openDb } from '../src/db/open'
import { MIGRATIONS } from '../src/db/schema'
import { Repo } from '../src/db/repo'
import { PipelineJudge } from '../src/judge/pipeline'
import type { QuestionHead } from '../src/questions'
import { bank, testRepo } from './helpers'

const T0 = Date.parse('2026-11-01T12:00:00Z')
const DAY = 86_400_000
const guestId = (n: number) => 'guest-' + String(n).padStart(16, '0')
const listed = (qid: string, tier: number) => bank.questions.find((q) => q.id === qid)!.answers.find((a) => a.tier === tier)!.name
const heads = (n: number, cats: number): QuestionHead[] =>
  Array.from({ length: n }, (_, i) => ({ id: `q${i}`, category: `c${i % cats}`, prompt: `prompt ${i}`, rules: '' }))

/** an app on a fake clock; every request says which guest (and which network address) it comes from */
function setup(opts: { repo?: Repo; start?: number; dailyPerIp?: number; rateLimitPerMinute?: number } = {}) {
  const repo = opts.repo ?? testRepo()
  let t = opts.start ?? T0
  const clock = { now: () => t, advance: (ms: number) => { t += ms }, set: (ms: number) => { t = ms } }
  const judge = new PipelineJudge(repo, null, clock.now)
  const app = createApp({
    repo, judge, now: clock.now, rand: () => 0.3, rateLimitPerMinute: opts.rateLimitPerMinute ?? 10_000, dailyPerIp: opts.dailyPerIp,
    clientIp: (c) => c.req.header('x-test-ip') ?? 'local',
  })
  type Opt = { guest?: number; ip?: string; body?: unknown }
  const call = async (method: 'GET' | 'POST', path: string, o: Opt = {}) => {
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (o.guest !== undefined) headers['x-guest'] = guestId(o.guest)
    if (o.ip) headers['x-test-ip'] = o.ip
    const r = await app.request(path, { method, headers, body: method === 'POST' ? JSON.stringify(o.body ?? {}) : undefined })
    return { status: r.status, json: (await r.json()) as any, headers: r.headers }
  }
  const get = (path: string, o: Opt = {}) => call('GET', path, o)
  const post = (path: string, o: Opt = {}) => call('POST', path, o)
  const daily = (guest: number, ip?: string) => get('/api/daily', { guest, ip })
  const startDaily = (guest: number, ip?: string) => post('/api/daily/start', { guest, ip })
  /** plays a whole daily run with answers of the given tiers (null = let the time run out); returns the prompts in the order they came */
  const playRun = async (guest: number, tiers: (number | null)[], ip?: string) => {
    const s = await startDaily(guest, ip)
    expect(s.status).toBe(200)
    const prompts: string[] = []
    const ids: string[] = []
    for (let i = 0; i < tiers.length; i++) {
      const q = await post(`/api/run/${s.json.runId}/start`, { body: { index: i } })
      expect(q.status).toBe(200)
      prompts.push(q.json.question.prompt)
      ids.push(q.json.question.id)
      if (tiers[i] === null) await post(`/api/run/${s.json.runId}/miss`, { body: { index: i } })
      else {
        const a = await post(`/api/run/${s.json.runId}/answer`, { body: { index: i, text: listed(q.json.question.id, tiers[i]!) } })
        expect(a.json.status).toBe('valid')
      }
    }
    return { runId: s.json.runId as string, prompts, ids }
  }
  return { repo, app, clock, get, post, daily, startDaily, playRun }
}

describe('choosing the day\'s seven questions', () => {
  it('seven different questions from seven different categories, no random numbers', () => {
    const pool = bank.questions.map((q) => ({ id: q.id, category: q.category, prompt: q.prompt, rules: q.rules }))
    const a = pickDaily(pool, '2026-11-01', new Map())
    expect(a.length).toBe(RUN_LENGTH)
    expect(new Set(a.map((q) => q.id)).size).toBe(RUN_LENGTH)
    expect(new Set(a.map((q) => q.category)).size).toBe(RUN_LENGTH)
    expect(pickDaily(pool, '2026-11-01', new Map()).map((q) => q.id)).toEqual(a.map((q) => q.id))
    expect(pickDaily([...pool].reverse(), '2026-11-01', new Map()).map((q) => q.id)).toEqual(a.map((q) => q.id))
  })
  it('other days give other sets and orders', () => {
    const pool = heads(40, 20)
    const seen = new Set<string>()
    for (let d = 1; d <= 10; d++) seen.add(pickDaily(pool, `2026-11-${String(d).padStart(2, '0')}`, new Map()).map((q) => q.id).join(','))
    expect(seen.size).toBeGreaterThan(8)
  })
  it('takes the least recently used first, so every question comes round', () => {
    const pool = heads(14, 14)
    const used = new Map<string, string>()
    const day1 = pickDaily(pool, '2026-11-01', used)
    day1.forEach((q) => used.set(q.id, '2026-11-01'))
    const day2 = pickDaily(pool, '2026-11-02', used)
    // all seven that were never used come before any repeat
    expect(day2.some((q) => day1.includes(q))).toBe(false)
    day2.forEach((q) => used.set(q.id, '2026-11-02'))
    const day3 = pickDaily(pool, '2026-11-03', used)
    expect(day3.every((q) => day1.includes(q))).toBe(true)
  })
  it('fills up from the same categories when there are fewer than seven', () => {
    const pool = heads(12, 3)
    const set = pickDaily(pool, '2026-11-01', new Map())
    expect(set.length).toBe(RUN_LENGTH)
    expect(new Set(set.map((q) => q.id)).size).toBe(RUN_LENGTH)
    expect(new Set(set.map((q) => q.category)).size).toBe(3)
  })
  it('gives nothing when the bank is too small', () => {
    expect(pickDaily(heads(6, 6), '2026-11-01', new Map())).toEqual([])
  })
})

describe('the stored set', () => {
  it('is chosen once and never changes, even when the bank does', () => {
    const repo = testRepo()
    const first = ensureDailySet(repo, '2026-11-01', T0)!
    expect(first.created).toBe(true)
    expect(first.questions.length).toBe(7)
    repo.insertQuestion({ id: 'new-one', category: 'zzz', prompt: 'A brand new question?', rules: 'r', status: 'approved', source: 'import', at: 5 })
    const again = ensureDailySet(repo, '2026-11-01', T0 + 5000)!
    expect(again.created).toBe(false)
    expect(again.questions.map((q) => q.id)).toEqual(first.questions.map((q) => q.id))
  })
  it('never uses a draft or rejected question, and needs seven approved ones', () => {
    const repo = testRepo()
    repo.setQuestionStatus('food-cheese', 'rejected', 5)
    repo.setQuestionStatus('misc-hat', 'rejected', 5)
    for (let d = 1; d <= 6; d++) expect(ensureDailySet(repo, `2026-11-0${d}`, T0)!.questions.map((q) => q.id)).not.toContain('food-cheese')
    const small = new Repo(openDb(':memory:'))
    expect(ensureDailySet(small, '2026-11-01', T0)).toBeNull()
  })
  it('the first set made for today fixes daily #1; a set made ahead does not', () => {
    const repo = testRepo()
    ensureDailySet(repo, '2026-11-02', T0)          // tomorrow, made ahead
    expect(repo.getMeta('daily_epoch')).toBeUndefined()
    ensureDailySet(repo, '2026-11-01', T0)
    expect(repo.getMeta('daily_epoch')).toBe('2026-11-01')
    ensureDailySet(repo, '2026-10-30', T0)          // the first one wins
    expect(repo.getMeta('daily_epoch')).toBe('2026-11-01')
    expect(epochDay(repo, '2026-12-01')).toBe('2026-11-01')
    expect(epochDay(new Repo(openDb(':memory:')), '2026-12-01')).toBe('2026-12-01')
  })
  it('a set can be removed only until somebody has played it', async () => {
    const s = setup()
    ensureDailySet(s.repo, '2026-11-05', T0)
    expect(s.repo.deleteDailySet('2026-11-05')).toBe(true)
    expect(s.repo.dailySet('2026-11-05')).toBeUndefined()
    await s.startDaily(1)
    expect(s.repo.deleteDailySet('2026-11-01')).toBe(false)
  })
})

describe('the daily api', () => {
  it('needs a guest id of the right shape', async () => {
    const { get, post, app } = setup()
    expect((await get('/api/daily')).status).toBe(400)
    const bad = await app.request('/api/daily', { headers: { 'x-guest': 'short' } })
    expect(bad.status).toBe(400)
    const odd = await app.request('/api/daily', { headers: { 'x-guest': 'a'.repeat(20) + '<script>' } })
    expect(odd.status).toBe(400)
    expect((await post('/api/daily/start')).status).toBe(400)
  })
  it('a new guest sees a new day, the number, and the time left', async () => {
    const { daily } = setup({ start: Date.parse('2026-11-01T18:00:00Z') })
    const r = await daily(1)
    expect(r.status).toBe(200)
    expect(r.json).toMatchObject({ day: '2026-11-01', number: 1, status: 'new', streak: 0, resetsInMs: 6 * 3_600_000 })
    expect(r.json.items).toBeUndefined()
    expect(r.headers.get('cache-control')).toBe('no-store')
  })
  it('starting sends no questions and no prompts', async () => {
    const { startDaily } = setup()
    const r = await startDaily(1)
    expect(r.json).toMatchObject({ mode: 'daily', count: 7, seconds: 30, day: '2026-11-01', number: 1 })
    expect(r.json.questions).toBeUndefined()
    expect(JSON.stringify(r.json)).not.toMatch(/prompt/)
  })
  it('each prompt arrives only when its question starts, and in order', async () => {
    const { startDaily, post } = setup()
    const run = (await startDaily(1)).json.runId
    expect((await post(`/api/run/${run}/start`, { body: { index: 2 } })).json.code).toBe('order')
    const q0 = await post(`/api/run/${run}/start`, { body: { index: 0 } })
    expect(q0.json.question.prompt).toBeTruthy()
    expect((await post(`/api/run/${run}/start`, { body: { index: 1 } })).json.code).toBe('order')
  })
  it('everybody gets the same seven questions in the same order', async () => {
    const { playRun } = setup()
    const a = await playRun(1, [0, 0, 0, 0, 0, 0, 0])
    const b = await playRun(2, [null, null, null, null, null, null, null])
    expect(b.ids).toEqual(a.ids)
    expect(b.prompts).toEqual(a.prompts)
    expect(new Set(a.ids).size).toBe(7)
  })
  it('one attempt a day: a second start is refused, open or finished', async () => {
    const { startDaily, playRun, post } = setup()
    const open = await startDaily(1)
    const again = await startDaily(1)
    expect(again.status).toBe(409)
    expect(again.json.code).toBe('in_progress')
    // finishing it turns the refusal into "already played"
    for (let i = 0; i < 7; i++) {
      await post(`/api/run/${open.json.runId}/start`, { body: { index: i } })
      await post(`/api/run/${open.json.runId}/miss`, { body: { index: i } })
    }
    const done = await startDaily(1)
    expect(done.status).toBe(409)
    expect(done.json.code).toBe('played')
    // another guest is not affected
    expect((await playRun(2, [0])).prompts.length).toBe(1)
  })
  it('a finished run shows its result, the standings, and a streak of one', async () => {
    const { playRun, daily } = setup()
    await playRun(1, [5, 4, null, 2, 1, 0, 3])
    const r = await daily(1)
    expect(r.json.status).toBe('done')
    expect(r.json.total).toBe(100 + 80 + 0 + 40 + 20 + 10 + 60)
    expect(r.json.items.length).toBe(7)
    expect(r.json.items[2]).toEqual({ miss: true, answer: null, tier: null, points: 0 })
    expect(r.json.items[0]).toMatchObject({ miss: false, tier: 5, points: 100 })
    expect(typeof r.json.items[0].answer).toBe('string')
    expect(r.json.standings).toEqual({ players: 1, rank: 1, below: 0, best: 310 })
    expect(r.json.streak).toBe(1)
  })
  it('ranks players, with equal scores sharing a rank', async () => {
    const { playRun, daily } = setup()
    await playRun(1, [0, 0, 0, 0, 0, 0, 0])           //  70
    await playRun(2, [5, 5, 5, 5, 5, 5, 5])           // 700
    await playRun(3, [0, 0, 0, 0, 0, 0, 0])           //  70
    await playRun(4, [2, 2, 2, 2, 2, 2, 2])           // 280
    expect((await daily(2)).json.standings).toEqual({ players: 4, rank: 1, below: 3, best: 700 })
    expect((await daily(4)).json.standings).toEqual({ players: 4, rank: 2, below: 2, best: 700 })
    expect((await daily(1)).json.standings).toEqual({ players: 4, rank: 3, below: 0, best: 700 })
    expect((await daily(3)).json.standings.rank).toBe(3)
  })
  it('only finished runs count as players', async () => {
    const { playRun, startDaily, daily } = setup()
    await playRun(1, [5, 5, 5, 5, 5, 5, 5])
    await startDaily(2)                                // opened, never played
    expect((await daily(1)).json.standings.players).toBe(1)
  })
  it('solo runs do not use up the daily', async () => {
    const { post, startDaily, daily } = setup()
    const solo = await post('/api/run')
    await post(`/api/run/${solo.json.runId}/start`, { body: { index: 0 } })
    await post(`/api/run/${solo.json.runId}/abandon`)
    expect((await daily(1)).json.status).toBe('new')
    expect((await startDaily(1)).status).toBe(200)
  })

  describe('leaving a run', () => {
    it('the browser can say it is leaving: what is left scores 0 and the attempt is used', async () => {
      const { startDaily, post, daily } = setup()
      const run = (await startDaily(1)).json.runId
      const q0 = await post(`/api/run/${run}/start`, { body: { index: 0 } })
      await post(`/api/run/${run}/answer`, { body: { index: 0, text: listed(q0.json.question.id, 3) } })
      await post(`/api/run/${run}/start`, { body: { index: 1 } })
      expect((await post(`/api/run/${run}/abandon`)).status).toBe(200)
      const r = await daily(1)
      expect(r.json.status).toBe('done')
      expect(r.json.total).toBe(60)
      expect(r.json.items.map((i: any) => i.miss)).toEqual([false, true, true, true, true, true, true])
      expect((await startDaily(1)).json.code).toBe('played')
      // saying it twice changes nothing
      expect((await post(`/api/run/${run}/abandon`)).status).toBe(200)
      expect((await daily(1)).json.total).toBe(60)
    })
    it('a late answer cannot revive a closed question', async () => {
      const { startDaily, post, daily } = setup()
      const run = (await startDaily(1)).json.runId
      const q0 = await post(`/api/run/${run}/start`, { body: { index: 0 } })
      await post(`/api/run/${run}/abandon`)
      const a = await post(`/api/run/${run}/answer`, { body: { index: 0, text: listed(q0.json.question.id, 5) } })
      expect(a.status).toBe(409)
      expect((await daily(1)).json.total).toBe(0)
    })
    it('a run nobody touches for a while is closed by the next visit', async () => {
      const { startDaily, post, daily, clock } = setup()
      const run = (await startDaily(1)).json.runId
      await post(`/api/run/${run}/start`, { body: { index: 0 } })
      clock.advance(STALE_RUN_MS - 1000)
      expect((await daily(1)).json.status).toBe('playing')
      expect((await startDaily(1)).json.code).toBe('in_progress')
      clock.advance(2000)
      const r = await daily(1)
      expect(r.json.status).toBe('done')
      expect(r.json.total).toBe(0)
    })
    it('a run that is being played is not closed, however many pages ask', async () => {
      const { startDaily, post, daily, clock } = setup()
      const run = (await startDaily(1)).json.runId
      for (let i = 0; i < 3; i++) {
        await post(`/api/run/${run}/start`, { body: { index: i } })
        clock.advance(60_000)
        expect((await daily(1)).json.status).toBe('playing')
        await post(`/api/run/${run}/miss`, { body: { index: i } })
      }
    })
    it('abandoning a solo run does nothing', async () => {
      const { post, repo } = setup()
      const solo = (await post('/api/run')).json.runId
      await post(`/api/run/${solo}/start`, { body: { index: 0 } })
      await post(`/api/run/${solo}/abandon`)
      expect(repo.getRun(solo)!.questions.every((q) => q.result === null)).toBe(true)
    })
    it('an unknown run is a 404', async () => {
      expect((await setup().post('/api/run/nope/abandon')).status).toBe(404)
    })
  })

  describe('the day changes at 00:00 UTC', () => {
    it('a new day is a new set, a new number, and a fresh attempt; the streak waits', async () => {
      const s = setup({ start: Date.parse('2026-11-01T23:59:00Z') })
      const day1 = await s.playRun(1, [1, 1, 1, 1, 1, 1, 1])
      s.clock.advance(2 * 60_000)                                     // 00:01 UTC the next day
      const r = await s.daily(1)
      expect(r.json).toMatchObject({ day: '2026-11-02', number: 2, status: 'new', streak: 1 })
      const day2 = await s.playRun(1, [1, 1, 1, 1, 1, 1, 1])
      expect(day2.ids).not.toEqual(day1.ids)
      expect((await s.daily(1)).json.streak).toBe(2)
    })
    it('missing a day breaks the streak', async () => {
      const s = setup()
      await s.playRun(1, [0, 0, 0, 0, 0, 0, 0])
      s.clock.advance(2 * DAY)
      expect((await s.daily(1)).json.streak).toBe(0)
    })
    it('a run started before midnight can be finished after it and counts for the day it started', async () => {
      const s = setup({ start: Date.parse('2026-11-01T23:59:50Z') })
      const run = (await s.startDaily(1)).json.runId
      for (let i = 0; i < 7; i++) {
        const q = await s.post(`/api/run/${run}/start`, { body: { index: i } })
        s.clock.advance(4000)
        await s.post(`/api/run/${run}/answer`, { body: { index: i, text: listed(q.json.question.id, 1) } })
      }
      // it is now the next day for the clock, but the finished run belongs to day 1
      expect(s.repo.dailyPlay('2026-11-01', guestId(1))!.total).toBe(140)
      expect((await s.daily(1)).json.status).toBe('new')
      expect(s.repo.dailyStandings('2026-11-01', 140).players).toBe(1)
    })
    it('the set is made at the first request of the day and the days before are untouched', async () => {
      const s = setup()
      const a = await s.playRun(1, [0])
      s.clock.advance(DAY)
      const b = await s.playRun(1, [0])
      expect(s.repo.dailySet('2026-11-01')!.map((q) => q.id)[0]).toBe(a.ids[0])
      expect(s.repo.dailySet('2026-11-02')!.map((q) => q.id)[0]).toBe(b.ids[0])
    })
  })

  describe('abuse', () => {
    it('limits daily runs per network, not per guest', async () => {
      const s = setup({ dailyPerIp: 2 })
      expect((await s.startDaily(1, '203.0.113.7')).status).toBe(200)
      expect((await s.startDaily(2, '203.0.113.7')).status).toBe(200)
      const third = await s.startDaily(3, '203.0.113.7')
      expect(third.status).toBe(429)
      expect(third.json.code).toBe('ip_limit')
      expect((await s.startDaily(3, '203.0.113.8')).status).toBe(200)       // another network is fine
      expect((await s.startDaily(4, '203.0.113.7')).status).toBe(429)
    })
    it('the limit starts over the next day and never stores the address', async () => {
      const s = setup({ dailyPerIp: 1 })
      await s.startDaily(1, '203.0.113.7')
      expect((await s.startDaily(2, '203.0.113.7')).status).toBe(429)
      s.clock.advance(DAY)
      expect((await s.startDaily(2, '203.0.113.7')).status).toBe(200)
      const rows = s.repo.db.prepare('SELECT ip_hash FROM daily_plays').all() as { ip_hash: string }[]
      expect(rows.every((r) => !r.ip_hash.includes('203'))).toBe(true)
      expect(new Set(rows.map((r) => r.ip_hash)).size).toBe(2)
    })
    it('the machine itself (development) is never limited', async () => {
      const s = setup({ dailyPerIp: 1 })
      for (let g = 1; g <= 4; g++) expect((await s.startDaily(g)).status).toBe(200)
    })
    it('asking too fast is refused', async () => {
      const s = setup({ rateLimitPerMinute: 3 })
      for (let g = 1; g <= 3; g++) expect((await s.startDaily(g, '198.51.100.1')).status).toBe(200)
      const r = await s.startDaily(4, '198.51.100.1')
      expect(r.status).toBe(429)
      expect(r.json.code).toBe('rate')
    })
    it('a bank that is too small gives a clear refusal', async () => {
      const s = setup({ repo: new Repo(openDb(':memory:')) })
      const r = await s.daily(1)
      expect(r.status).toBe(503)
      expect(r.json.code).toBe('no_questions')
      expect((await s.startDaily(1)).status).toBe(503)
    })
  })
})

describe('network addresses', () => {
  it('recognises the machine itself', () => {
    for (const ip of ['local', '127.0.0.1', '::1', '::ffff:127.0.0.1']) expect(isLoopback(ip)).toBe(true)
    for (const ip of ['203.0.113.7', '2001:db8::1', '10.0.0.5']) expect(isLoopback(ip)).toBe(false)
  })
  it('a fingerprint is stable within a day, different across days and hides the address', () => {
    const a = ipFingerprint('2026-11-01', '203.0.113.7')
    expect(ipFingerprint('2026-11-01', '203.0.113.7')).toBe(a)
    expect(ipFingerprint('2026-11-02', '203.0.113.7')).not.toBe(a)
    expect(ipFingerprint('2026-11-01', '203.0.113.8')).not.toBe(a)
    expect(a).toMatch(/^[0-9a-f]{16}$/)
  })
})

describe('daily backups', () => {
  const dir = () => mkdtempSync(join(tmpdir(), 'minitude-backup-'))
  it('makes one copy a day, keeps the newest few, and leaves other files alone', async () => {
    const repo = testRepo()
    const d = dir()
    try {
      writeFileSync(join(d, 'notes.txt'), 'mine')
      writeFileSync(join(d, 'minitude-old.db'), 'not a dated backup')
      const made = await backupIfDue(repo.db, d, Date.parse('2026-11-01T01:00:00Z'), 3)
      expect(made).toBe(join(d, 'minitude-2026-11-01.db'))
      expect(await backupIfDue(repo.db, d, Date.parse('2026-11-01T23:00:00Z'), 3)).toBeNull()
      for (const day of ['02', '03', '04', '05']) await backupIfDue(repo.db, d, Date.parse(`2026-11-${day}T01:00:00Z`), 3)
      expect(readdirSync(d).sort()).toEqual(['minitude-2026-11-03.db', 'minitude-2026-11-04.db', 'minitude-2026-11-05.db', 'minitude-old.db', 'notes.txt'])
      // the copy is a real database with the questions in it
      const copy = new Repo(openDb(join(d, 'minitude-2026-11-05.db')))
      expect(copy.countByStatus().approved).toBe(bank.questions.length)
      copy.db.close()
    } finally {
      rmSync(d, { recursive: true, force: true })
    }
  })
})

describe('the database upgrade', () => {
  it('an old database (schema 1) with runs in it gets the new tables and keeps its runs as solo runs', () => {
    const d = mkdtempSync(join(tmpdir(), 'minitude-up-'))
    try {
      const file = join(d, 'old.db')
      // build a version-1 database by hand: run only the first migration
      const raw = new Database(file)
      raw.exec(MIGRATIONS[0])
      raw.pragma('user_version = 1')
      raw.prepare("INSERT INTO runs (id, created_at, checker, policy_version) VALUES ('r1', 5, 'mock', 'v1')").run()
      raw.close()
      const repo = new Repo(openDb(file))
      expect(repo.getRun('r1')!.mode).toBe('solo')
      expect(repo.db.pragma('user_version', { simple: true })).toBe(2)
      expect(repo.dailyDays('2000-01-01')).toEqual([])
      repo.db.close()
    } finally {
      rmSync(d, { recursive: true, force: true })
    }
  })
})

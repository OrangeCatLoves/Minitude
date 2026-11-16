import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { createApp, MAX_BODY_BYTES, pickRun } from '../src/app'
import { backupIfDue } from '../src/backup'
import { isLoopback, makeClientIp, networkOf } from '../src/clientip'
import { BACKUP_MIN_SPARE_BYTES, DAILY_MIN_FREE_BYTES, SOLO_MIN_FREE_BYTES } from '../src/diskguard'
import { ensureDailySet } from '../src/daily'
import { PipelineJudge } from '../src/judge/pipeline'
import { tidyTyped } from '../src/sanitize'
import { CSP, securityHeaders } from '../src/securityHeaders'
import { testRepo } from './helpers'

const MB = 1024 * 1024
const T0 = Date.parse('2026-11-20T10:00:00Z')

/** an app on a fake clock; the caller's address comes from the x-test-ip header, through the same code the server uses */
function setup(o: { freeBytes?: () => number; maxRunsPerDay?: number; maxRunsPerNetworkPerDay?: number; rateLimitPerMinute?: number } = {}) {
  const repo = testRepo()
  let t = T0
  const clock = { now: () => t, advance: (ms: number) => { t += ms } }
  const judge = new PipelineJudge(repo, null, clock.now)
  const app = createApp({
    repo, judge, now: clock.now, rand: () => 0.3, rateLimitPerMinute: o.rateLimitPerMinute ?? 10_000,
    clientIp: makeClientIp('x-test-ip'), freeBytes: o.freeBytes, maxRunsPerDay: o.maxRunsPerDay, maxRunsPerNetworkPerDay: o.maxRunsPerNetworkPerDay,
  })
  const call = async (method: string, path: string, o2: { body?: unknown; raw?: string; ip?: string; guest?: string; headers?: Record<string, string> } = {}) => {
    const headers: Record<string, string> = { 'x-test-ip': o2.ip ?? '203.0.113.9', ...(o2.headers ?? {}) }
    if (o2.guest) headers['x-guest'] = o2.guest
    const hasBody = o2.raw !== undefined || o2.body !== undefined
    if (hasBody) headers['content-type'] = 'application/json'
    const r = await app.request(path, { method, headers, body: o2.raw !== undefined ? o2.raw : o2.body !== undefined ? JSON.stringify(o2.body) : undefined })
    const text = await r.text()
    let json: any = null
    try { json = JSON.parse(text) } catch { /* not JSON */ }
    return { status: r.status, json, text, headers: r.headers }
  }
  return { repo, app, clock, call }
}

describe('which network an address belongs to', () => {
  it('leaves IPv4 and the machine itself alone', () => {
    expect(networkOf('203.0.113.7')).toBe('203.0.113.7')
    expect(networkOf('local')).toBe('local')
  })
  it('counts every address inside one IPv6 /64 as the same network (a visitor has billions of them)', () => {
    const a = networkOf('2001:db8:1:2:aaaa:bbbb:cccc:dddd')
    expect(networkOf('2001:db8:1:2::1')).toBe(a)
    expect(networkOf('2001:0db8:0001:0002:0:0:0:ffff')).toBe(a)
    expect(networkOf('2001:DB8:1:2:1234:5678:9abc:def0')).toBe(a)
    expect(a).toBe('2001:0db8:0001:0002::/64')
  })
  it('tells different /64 networks apart', () => {
    expect(networkOf('2001:db8:1:2::1')).not.toBe(networkOf('2001:db8:1:3::1'))
    expect(networkOf('2001:db8:2:2::1')).not.toBe(networkOf('2001:db8:1:2::1'))
  })
  it('reads the short forms and a zone id, and an IPv4-mapped address is the IPv4 one', () => {
    expect(networkOf('2001:db8::1')).toBe('2001:0db8:0000:0000::/64')
    expect(networkOf('::2')).toBe('0000:0000:0000:0000::/64')
    expect(networkOf('fe80::1%eth0')).toBe('fe80:0000:0000:0000::/64')
    expect(networkOf('::ffff:203.0.113.7')).toBe('203.0.113.7')
  })
  it('returns what it cannot read as it came', () => {
    for (const odd of ['2001:db8::1::2', 'gggg::1', '1:2:3', '::1.2.3.4', '']) expect(networkOf(odd)).toBe(odd)
  })
  it('keeps the loopback exempt from the per-network limits (isLoopback still sees it)', async () => {
    const app = new Hono()
    app.get('/ip', (c) => c.text(makeClientIp('x-test-ip')(c)))
    const ip = async (v: string) => (await app.request('/ip', { headers: { 'x-test-ip': v } })).text()
    expect(isLoopback(await ip('::1'))).toBe(true)
    expect(isLoopback(await ip('::ffff:127.0.0.1'))).toBe(true)
    expect(await ip('2001:db8:1:2::5')).toBe('2001:0db8:0001:0002::/64')
  })
  it('gives a visitor who rotates through addresses inside one /64 no fresh allowance', async () => {
    const { call } = setup({ rateLimitPerMinute: 5 })
    const codes: number[] = []
    for (let i = 1; i <= 8; i++) codes.push((await call('POST', '/api/run', { ip: `2001:db8:5:5::${i.toString(16)}` })).status)
    expect(codes.filter((c) => c === 200)).toHaveLength(5)
    expect(codes.slice(5)).toEqual([429, 429, 429])
    // a different network is unaffected
    expect((await call('POST', '/api/run', { ip: '2001:db8:6:6::1' })).status).toBe(200)
  })
})

describe('a request body is never read whole when it is huge', () => {
  it('refuses a body over the limit with 413, for every route that reads one', async () => {
    const { call } = setup()
    const big = JSON.stringify({ text: 'a'.repeat(MAX_BODY_BYTES + 100) })
    for (const path of ['/api/suggest', '/api/rating', '/api/run/abc/answer', '/api/versus/create']) {
      const r = await call('POST', path, { raw: big, guest: 'abcd1234abcd1234abcd' })
      expect([path, r.status]).toEqual([path, 413])
      expect(r.json.code).toBe('too_big')
    }
  })
  it('refuses a body whose Content-Length lies about being small', async () => {
    const { app } = setup()
    const body = 'x'.repeat(MAX_BODY_BYTES * 3)
    const r = await app.request('/api/suggest', { method: 'POST', headers: { 'content-type': 'application/json', 'x-test-ip': '203.0.113.50' }, body })
    expect(r.status).toBe(413)
  })
  it('still takes a normal idea and a normal answer', async () => {
    const { call } = setup()
    expect((await call('POST', '/api/suggest', { body: { text: 'What is the tallest tree in the world?' } })).status).toBe(200)
    expect((await call('POST', '/api/rating', { body: { score: 4, mode: 'versus' } })).status).toBe(200)
  })
})

describe('no other website may call the API from a visitor\'s browser', () => {
  it('sends no CORS permission, for a normal call or a preflight', async () => {
    const { app } = setup()
    const get = await app.request('/api/health', { headers: { origin: 'https://evil.example' } })
    expect(get.status).toBe(200)
    expect(get.headers.get('access-control-allow-origin')).toBeNull()
    const pre = await app.request('/api/run', { method: 'OPTIONS', headers: { origin: 'https://evil.example', 'access-control-request-method': 'POST' } })
    expect(pre.headers.get('access-control-allow-origin')).toBeNull()
  })
})

describe('a path under /api that does not exist', () => {
  it('is a JSON error, not the game page', async () => {
    const { call } = setup()
    for (const [m, p] of [['GET', '/api/admin'], ['GET', '/api/'], ['PUT', '/api/run'], ['DELETE', '/api/health'], ['GET', '/api/run/x/y/z']] as const) {
      const r = await call(m, p)
      expect([m, p, r.status]).toEqual([m, p, 404])
      expect(r.json).toEqual({ error: 'Not found.' })
    }
  })
})

describe('typed text is kept free of control characters', () => {
  it('tidyTyped turns them into spaces and trims the ends', () => {
    expect(tidyTyped('  a\u001b[2Jb\u0007\u0000c d\u009f ')).toBe('a [2Jb  c d')
    expect(tidyTyped('Zürich 東京')).toBe('Zürich 東京')
  })
  it('an answer with an escape code is stored without it', async () => {
    const { call, repo } = setup()
    const run = (await call('POST', '/api/run')).json as { runId: string }
    const q0 = repo.getRun(run.runId)!.questions[0]
    expect((await call('POST', `/api/run/${run.runId}/start`, { body: { index: 0 } })).status).toBe(200)
    const r = await call('POST', `/api/run/${run.runId}/answer`, { body: { index: 0, text: 'zork\u001b]52;c;ZXZpbA==\u0007blat' } })
    expect(r.status).toBe(200)
    const rows = repo.db.prepare('SELECT text FROM attempts').all() as { text: string }[]
    expect(rows).toHaveLength(1)
    expect(rows[0].text).not.toMatch(/[\u0000-\u001f\u007f-\u009f]/)
    expect(q0.id).toBeTruthy()
  })
  it('an answer that is only control characters is refused as empty', async () => {
    const { call } = setup()
    const run = (await call('POST', '/api/run')).json as { runId: string }
    await call('POST', `/api/run/${run.runId}/start`, { body: { index: 0 } })
    expect((await call('POST', `/api/run/${run.runId}/answer`, { body: { index: 0, text: '\u001b\u0007\t' } })).status).toBe(400)
  })
})

describe('a nearly full disk and a flood of runs', () => {
  const guest = 'abcd1234abcd1234abcd1234'
  it('refuses new solo runs below the solo limit, and says so politely', async () => {
    const { call } = setup({ freeBytes: () => SOLO_MIN_FREE_BYTES - MB })
    const r = await call('POST', '/api/run')
    expect(r.status).toBe(503)
    expect(r.json.code).toBe('busy')
    expect(r.json.error).not.toMatch(/disk|database|space|sqlite/i) // nothing about how it works inside
  })
  it('accepts new solo runs when there is room', async () => {
    const { call } = setup({ freeBytes: () => SOLO_MIN_FREE_BYTES + MB })
    expect((await call('POST', '/api/run')).status).toBe(200)
  })
  it('keeps the Daily working below the solo limit and refuses it only when the disk is almost completely full', async () => {
    const low = setup({ freeBytes: () => SOLO_MIN_FREE_BYTES - MB })
    expect((await low.call('POST', '/api/run')).status).toBe(503)
    expect((await low.call('POST', '/api/daily/start', { guest })).status).toBe(200)
    const full = setup({ freeBytes: () => DAILY_MIN_FREE_BYTES - MB })
    const r = await full.call('POST', '/api/daily/start', { guest })
    expect(r.status).toBe(503)
    expect(r.json.code).toBe('busy')
  })
  it('stops after the daily number of solo runs and starts again the next UTC day', async () => {
    const { call, clock } = setup({ maxRunsPerDay: 3 })
    for (let i = 0; i < 3; i++) expect((await call('POST', '/api/run', { ip: `198.51.100.${i}` })).status).toBe(200)
    const over = await call('POST', '/api/run', { ip: '198.51.100.99' })
    expect(over.status).toBe(503)
    expect(over.json.code).toBe('busy')
    clock.advance(24 * 3_600_000)
    expect((await call('POST', '/api/run', { ip: '198.51.100.99' })).status).toBe(200)
  })
  it('has no daily cap when it is set to 0', async () => {
    const { call } = setup({ maxRunsPerDay: 0 })
    for (let i = 0; i < 6; i++) expect((await call('POST', '/api/run', { ip: `198.51.100.${i}` })).status).toBe(200)
  })
})

describe('clearing away abandoned solo runs', () => {
  const finish = (repo: ReturnType<typeof testRepo>, runId: string, at: number) => {
    for (let i = 0; i < 7; i++) repo.markStarted(runId, i, at)
    repo.closeRun(runId, at)
  }
  it('deletes old unfinished solo runs and their answers, and keeps finished runs, recent runs and Daily runs', () => {
    const repo = testRepo()
    const heads = repo.approvedHeads()
    const mk = (at: number) => repo.createRun(pickRun(heads, () => 0.3), 'lists', at)
    const old = mk(1_000), oldFinished = mk(1_000), recent = mk(9_000_000), daily = repo.startDailyPlay('2026-11-01', 'abcd1234abcd1234abcd', ensureDailySet(repo, '2026-11-01', 1_000)!.questions, 'lists', null, 1_000)
    finish(repo, oldFinished.id, 2_000)
    repo.logAttempt({ runId: old.id, idx: 0, text: 'x', status: 'invalid', answer: null, tier: null, message: 'm', via: 'none', ms: 1, at: 1_500 })
    const gone = repo.purgeAbandonedRuns(5_000_000)
    expect(gone).toBe(1)
    expect(repo.getRun(old.id)).toBeUndefined()
    expect(repo.getRun(oldFinished.id)).not.toBeNull()
    expect(repo.getRun(recent.id)).not.toBeNull()
    expect(repo.getRun(daily.id)).not.toBeNull() // an unfinished Daily run is never touched here (it is closed and kept)
    expect((repo.db.prepare('SELECT COUNT(*) n FROM attempts').get() as { n: number }).n).toBe(0) // the answers went with it
    expect(repo.purgeAbandonedRuns(5_000_000)).toBe(0) // nothing left to do
  })
  it('does not break a rating that points at a deleted run', () => {
    const repo = testRepo()
    const heads = repo.approvedHeads()
    const run = repo.createRun(pickRun(heads, () => 0.3), 'lists', 1_000)
    repo.addRating({ runId: run.id, mode: 'solo', score: 4, day: '2026-11-01', ipHash: null, at: 1_100 })
    expect(repo.purgeAbandonedRuns(5_000_000)).toBe(1)
    expect((repo.db.prepare('SELECT COUNT(*) n FROM ratings').get() as { n: number }).n).toBe(1)
  })
})

describe('one person cannot spend everybody\'s allowance', () => {
  it('holds one network to its own number of new solo runs a day, and leaves the others (and the server-wide allowance) alone', async () => {
    const { call, clock } = setup({ maxRunsPerNetworkPerDay: 3, maxRunsPerDay: 5 })
    for (let i = 0; i < 3; i++) expect((await call('POST', '/api/run', { ip: '198.51.100.1' })).status).toBe(200)
    const over = await call('POST', '/api/run', { ip: '198.51.100.1' })
    expect(over.status).toBe(429)
    expect(over.json.code).toBe('ip_limit')
    // the refused attempts did not use up the server-wide allowance: two more runs from other networks still fit (3 used + 2 = 5)
    for (let i = 0; i < 4; i++) await call('POST', '/api/run', { ip: '198.51.100.1' })
    expect((await call('POST', '/api/run', { ip: '198.51.100.2' })).status).toBe(200)
    expect((await call('POST', '/api/run', { ip: '198.51.100.3' })).status).toBe(200)
    expect((await call('POST', '/api/run', { ip: '198.51.100.4' })).status).toBe(503) // now the server-wide allowance is gone
    // a new day starts everybody afresh
    clock.advance(24 * 3_600_000)
    expect((await call('POST', '/api/run', { ip: '198.51.100.1' })).status).toBe(200)
  })
  it('counts a whole IPv6 /64 as one network', async () => {
    const { call } = setup({ maxRunsPerNetworkPerDay: 2 })
    expect((await call('POST', '/api/run', { ip: '2001:db8:7:7::1' })).status).toBe(200)
    expect((await call('POST', '/api/run', { ip: '2001:db8:7:7:aaaa::2' })).status).toBe(200)
    expect((await call('POST', '/api/run', { ip: '2001:db8:7:7:bbbb::3' })).status).toBe(429)
    expect((await call('POST', '/api/run', { ip: '2001:db8:7:8::1' })).status).toBe(200)
  })
  it('never limits the machine itself (development), and has no limit when set to 0', async () => {
    const dev = setup({ maxRunsPerNetworkPerDay: 1 })
    for (let i = 0; i < 4; i++) expect((await dev.call('POST', '/api/run', { ip: '::1' })).status).toBe(200)
    const off = setup({ maxRunsPerNetworkPerDay: 0 })
    for (let i = 0; i < 4; i++) expect((await off.call('POST', '/api/run', { ip: '198.51.100.1' })).status).toBe(200)
  })
  it('the default is generous enough for a whole classroom (300 runs from one address)', async () => {
    const { call } = setup()
    for (let i = 0; i < 300; i++) expect((await call('POST', '/api/run', { ip: '198.51.100.8' })).status).toBe(200)
    expect((await call('POST', '/api/run', { ip: '198.51.100.8' })).status).toBe(429)
  })
})

describe('the routes that only move a run along are limited too', () => {
  it('allows three times the per-minute limit of answers, counted apart from them, and then says slow down', async () => {
    const { call } = setup({ rateLimitPerMinute: 5 }) // so 15 a minute for start / miss / abandon
    const runs: string[] = []
    for (let i = 0; i < 5; i++) { const r = await call('POST', '/api/run', { ip: `198.51.100.${10 + i}` }); runs.push(r.json.runId) }
    const codes: number[] = []
    for (let i = 0; i < 18; i++) codes.push((await call('POST', `/api/run/${runs[0]}/miss`, { body: { index: i % 7 }, ip: '198.51.100.99' })).status)
    expect(codes.slice(0, 15).every((c) => c === 200)).toBe(true)
    expect(codes.slice(15)).toEqual([429, 429, 429])
    // the answer route has its own allowance, untouched by all that
    const a = await call('POST', `/api/run/${runs[1]}/answer`, { body: { index: 0, text: 'x' }, ip: '198.51.100.99' })
    expect(a.status).not.toBe(429)
    // a different network is not affected
    expect((await call('POST', `/api/run/${runs[2]}/start`, { body: { index: 0 }, ip: '198.51.100.55' })).status).toBe(200)
  })
  it('also limits start and abandon', async () => {
    const { call } = setup({ rateLimitPerMinute: 1 }) // 3 a minute
    const run = (await call('POST', '/api/run', { ip: '198.51.100.20' })).json.runId
    const codes: number[] = []
    for (let i = 0; i < 4; i++) codes.push((await call('POST', `/api/run/${run}/start`, { body: { index: 0 }, ip: '198.51.100.77' })).status)
    expect(codes).toEqual([200, 200, 200, 429])
    expect((await call('POST', `/api/run/${run}/abandon`, { ip: '198.51.100.77' })).status).toBe(429)
  })
})

describe('clearing away solo runs in which nothing was typed and nothing scored', () => {
  const closed = (repo: ReturnType<typeof testRepo>, runId: string, at: number) => { for (let i = 0; i < 7; i++) repo.markStarted(runId, i, at); repo.closeRun(runId, at) }
  it('deletes old all-timeout runs, however they were finished, and keeps runs with a typed answer or a valid answer, recent runs and Daily runs', () => {
    const repo = testRepo()
    const heads = repo.approvedHeads()
    const mk = (at: number) => repo.createRun(pickRun(heads, () => 0.3), 'lists', at)
    const junk = mk(1_000), junkUnstarted = mk(1_000), typed = mk(1_000), scored = mk(1_000), recent = mk(9_000_000)
    const daily = repo.startDailyPlay('2026-11-01', 'abcd1234abcd1234abcd', ensureDailySet(repo, '2026-11-01', 1_000)!.questions, 'lists', null, 1_000)
    closed(repo, junk.id, 1_500)
    closed(repo, typed.id, 1_500)
    repo.logAttempt({ runId: typed.id, idx: 0, text: 'tiger', status: 'invalid', answer: null, tier: null, message: 'm', via: 'none', ms: 1, at: 1_200 })
    for (let i = 0; i < 7; i++) repo.markStarted(scored.id, i, 1_500)
    repo.finishValid(scored.id, 0, { answer: 'Cheddar', tier: 0, points: 10 }, 1_600)
    repo.closeRun(scored.id, 1_700)
    closed(repo, recent.id, 9_000_100)
    const gone = repo.purgeEmptyRuns(5_000_000)
    expect(gone).toBe(2) // the finished junk run and the never-started one
    expect(repo.getRun(junk.id)).toBeUndefined()
    expect(repo.getRun(junkUnstarted.id)).toBeUndefined()
    for (const keep of [typed, scored, recent, daily]) expect(repo.getRun(keep.id)).toBeDefined()
    expect(repo.purgeEmptyRuns(5_000_000)).toBe(0)
  })
})

describe('the nightly backup and a nearly full disk', () => {
  it('does not start a copy that would leave the disk too full, and says why', async () => {
    const repo = testRepo()
    const d = mkdtempSync(join(tmpdir(), 'minitude-spare-'))
    try {
      writeFileSync(join(d, 'marker.txt'), 'x')
      await expect(backupIfDue(repo.db, d, Date.parse('2026-11-20T01:00:00Z'), 3, 2, () => BACKUP_MIN_SPARE_BYTES - 1)).rejects.toThrow(/not enough free disk/)
      expect(await backupIfDue(repo.db, d, Date.parse('2026-11-20T01:00:00Z'), 3, 2, () => BACKUP_MIN_SPARE_BYTES + 10 * MB)).toBe(join(d, 'minitude-2026-11-20.db'))
    } finally {
      rmSync(d, { recursive: true, force: true })
    }
  })
})

describe('the headers every page and reply carries', () => {
  const root = new Hono()
  root.use('*', securityHeaders())
  root.get('/', (c) => c.text('hi'))
  it('holds the page to its own address: no outside scripts, styles, pictures, connections or framing', async () => {
    const h = (await root.request('/')).headers
    const csp = h.get('content-security-policy') ?? ''
    for (const d of ["default-src 'self'", "script-src 'self'", "connect-src 'self'", "object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'", "form-action 'self'"]) expect(csp).toContain(d)
    expect(csp).not.toMatch(/unsafe-eval|https?:|\*/)
    expect((csp.match(/script-src [^;]*/)?.[0] ?? '')).not.toContain('unsafe-inline') // a script may never run inline
    expect(Object.keys(CSP).length).toBeGreaterThan(8)
  })
  it('says HTTPS only, no sniffing, no framing, no referrer, and switches off the browser features the game never uses', async () => {
    const h = (await root.request('/')).headers
    expect(h.get('strict-transport-security')).toMatch(/max-age=\d{7,}/)
    expect(h.get('x-content-type-options')).toBe('nosniff')
    expect(h.get('x-frame-options')).toBe('DENY')
    expect(h.get('referrer-policy')).toBe('no-referrer')
    const pp = h.get('permissions-policy') ?? ''
    for (const f of ['camera=()', 'microphone=()', 'geolocation=()', 'payment=()']) expect(pp).toContain(f)
  })
})

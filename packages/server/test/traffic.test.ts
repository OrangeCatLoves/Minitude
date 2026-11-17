import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { runCli, type CliContext } from '../src/cli/commands'
import { ensureDailySet } from '../src/daily'
import { areaOf, cleanZone, GUIDE_PREMIUM } from '../src/regions'
import { mountSite, VISITS_PER_NETWORK_PER_DAY } from '../src/siteRoutes'
import { testRepo } from './helpers'

const DAY = Date.UTC(2026, 10, 17, 12, 0, 0)
const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

/** the visit route on its own, on a fake clock, where every request can come from a chosen network address and user agent */
function setup(extra: { visitsPerNetworkPerDay?: number } = {}) {
  const repo = testRepo()
  let t = DAY
  const app = new Hono()
  mountSite(app, { repo, clientIp: (c) => c.req.header('x-test-ip') ?? '203.0.113.9', now: () => t, ...extra })
  const visit = async (body: unknown, opts: { ip?: string; ua?: string | null } = {}) => {
    const headers: Record<string, string> = { 'content-type': 'application/json', 'x-test-ip': opts.ip ?? '203.0.113.9' }
    if (opts.ua !== null) headers['user-agent'] = opts.ua ?? CHROME
    const r = await app.request('/api/visit', { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) })
    return { status: r.status, json: (await r.json()) as Record<string, unknown> }
  }
  const total = (): number => repo.visitsBetween('2026-11-01', '2026-12-31').reduce((s, v) => s + v.n, 0)
  return { repo, visit, total, day: (ms: number) => { t = ms } }
}

describe('the visit count', () => {
  it('adds one to the total of the day and the time zone, and keeps nothing else', async () => {
    const { repo, visit } = setup()
    expect((await visit({ tz: 'Asia/Singapore' })).status).toBe(200)
    await visit({ tz: 'Asia/Singapore' }, { ip: '198.51.100.7' })
    await visit({ tz: 'America/New_York' }, { ip: '198.51.100.8', ua: IPHONE })
    const rows = repo.visitsBetween('2026-11-17', '2026-11-17')
    expect(rows).toEqual([{ day: '2026-11-17', zone: 'Asia/Singapore', n: 2 }, { day: '2026-11-17', zone: 'America/New_York', n: 1 }])
    // the table holds only day, zone and a number: no address, no fingerprint, no guest id
    const cols = (repo.db.prepare("PRAGMA table_info('visits')").all() as { name: string }[]).map((c) => c.name).sort()
    expect(cols).toEqual(['day', 'n', 'zone'])
  })

  it('does not count crawlers, scripts, headless browsers, a request with no user agent, or a developer machine', async () => {
    const { visit, total } = setup()
    const robots = [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/126.0 Safari/537.36',
      'python-requests/2.31.0',
      'curl/8.4.0',
      'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
      'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
      'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 (KHTML, like Gecko) Lighthouse',
    ]
    for (const ua of robots) expect((await visit({ tz: 'Asia/Singapore' }, { ua })).status).toBe(200)
    expect((await visit({ tz: 'Asia/Singapore' }, { ua: null })).status).toBe(200)
    expect((await visit({ tz: 'Asia/Singapore' }, { ip: '127.0.0.1' })).status).toBe(200)
    expect((await visit({ tz: 'Asia/Singapore' }, { ip: '::1' })).status).toBe(200)
    expect(total()).toBe(0)
  })

  it('answers the same whether or not the visit was counted, so a program learns nothing', async () => {
    const { visit } = setup()
    const counted = await visit({ tz: 'Asia/Singapore' })
    const ignored = await visit({ tz: 'Asia/Singapore' }, { ua: 'curl/8.4.0' })
    expect(ignored).toEqual(counted)
  })

  it('stops counting one network after its daily limit, and counts again the next day', async () => {
    const { visit, total, day } = setup({ visitsPerNetworkPerDay: 3 })
    // (the rate limit is 20 calls a minute per address, so spread the calls over minutes)
    let t = DAY
    for (let i = 0; i < 6; i++) { day(t); await visit({ tz: 'Asia/Singapore' }); t += 61_000 }
    expect(total()).toBe(3)
    // another network is unaffected
    await visit({ tz: 'Asia/Singapore' }, { ip: '198.51.100.50' })
    expect(total()).toBe(4)
    // the next UTC day starts a fresh allowance
    day(DAY + 86_400_000)
    await visit({ tz: 'Asia/Singapore' })
    expect(total()).toBe(5)
  })

  it('has a generous default limit, because a school or an office shares one address', () => {
    expect(VISITS_PER_NETWORK_PER_DAY).toBeGreaterThanOrEqual(200)
  })

  it('refuses a flood of calls from one address (20 a minute, shared with the other forms)', async () => {
    const { visit } = setup({ visitsPerNetworkPerDay: 0 })
    let last = 0
    for (let i = 0; i < 25; i++) last = (await visit({ tz: 'Asia/Singapore' })).status
    expect(last).toBe(429)
  })

  it('refuses a body that is not an object', async () => {
    const { visit } = setup()
    expect((await visit('not json')).status).toBe(400)
    expect((await visit('[1,2]')).status).toBe(400)
  })

  it('cannot be filled with made-up zones: a name that is not a zone is stored as "other", junk and nothing as "unknown"', async () => {
    const { repo, visit } = setup({ visitsPerNetworkPerDay: 0 })
    let n = 0
    const ip = () => `198.51.100.${++n}`
    await visit({ tz: 'Mars/Olympus_Mons' }, { ip: ip() })
    await visit({ tz: '<script>alert(1)</script>' }, { ip: ip() })
    await visit({ tz: 'x'.repeat(500) }, { ip: ip() })
    await visit({}, { ip: ip() })
    await visit({ tz: 42 }, { ip: ip() })
    await visit({ tz: 'UTC' }, { ip: ip() })
    await visit({ tz: 'Etc/GMT+8' }, { ip: ip() })
    const zones = Object.fromEntries(repo.visitsBetween('2026-11-17', '2026-11-17').map((r) => [r.zone, r.n]))
    expect(zones).toEqual({ other: 1, unknown: 4, UTC: 2 })
  })
})

describe('which part of the world a time zone is', () => {
  it('knows the zones a browser really reports', () => {
    expect(cleanZone('Asia/Singapore')).toBe('Asia/Singapore')
    expect(cleanZone('America/Argentina/Buenos_Aires')).toBe('America/Argentina/Buenos_Aires')
    expect(cleanZone('  Europe/London ')).toBe('Europe/London')
  })
  it('groups the zones for the report', () => {
    expect(areaOf('Asia/Singapore')).toBe('Singapore')
    for (const z of ['America/New_York', 'America/Los_Angeles', 'America/Toronto', 'America/Indiana/Indianapolis', 'America/Kentucky/Louisville', 'Pacific/Honolulu', 'America/Vancouver']) expect(areaOf(z)).toBe('US and Canada')
    for (const z of ['Europe/London', 'Europe/Dublin']) expect(areaOf(z)).toBe('UK and Ireland')
    for (const z of ['Australia/Sydney', 'Australia/Perth', 'Pacific/Auckland']) expect(areaOf(z)).toBe('Australia and New Zealand')
    for (const z of ['America/Sao_Paulo', 'America/Mexico_City', 'America/Bogota', 'America/Argentina/Buenos_Aires']) expect(areaOf(z)).toBe('Latin America')
    for (const z of ['Europe/Paris', 'Europe/Berlin', 'Europe/Moscow']) expect(areaOf(z)).toBe('Rest of Europe')
    for (const z of ['Asia/Tokyo', 'Asia/Kolkata', 'Asia/Kuala_Lumpur', 'Asia/Manila', 'Asia/Shanghai']) expect(areaOf(z)).toBe('Rest of Asia')
    for (const z of ['Asia/Dubai', 'Africa/Lagos', 'Africa/Johannesburg']) expect(areaOf(z)).toBe('Middle East and Africa')
    expect(areaOf('unknown')).toBe('Unknown')
    expect(areaOf('other')).toBe('Other')
    expect(areaOf('UTC')).toBe('Other')
  })
  it('names the markets the big networks pay most for, and Singapore is not among them in this guide', () => {
    expect([...GUIDE_PREMIUM].sort()).toEqual(['Australia and New Zealand', 'UK and Ireland', 'US and Canada'])
  })
})

describe('the traffic command', () => {
  const ctx = (repo = testRepo(), now = DAY): CliContext & { lines: string[] } => {
    const lines: string[] = []
    return { repo, llm: null, llmNote: 'none', dbFile: ':memory:', now: () => now, out: (s) => lines.push(s), lines }
  }

  it('says so when nothing has been counted', async () => {
    const c = ctx()
    expect(await runCli(['traffic'], c)).toBe(0)
    expect(c.lines.join('\n')).toContain('No visits counted in this period yet.')
  })

  it('shows visits per day, finished solo runs, the Daily, and where visits came from', async () => {
    const { repo, visit } = setup({ visitsPerNetworkPerDay: 0 })
    let n = 0
    const ip = () => `198.51.100.${++n}`
    for (let i = 0; i < 6; i++) await visit({ tz: 'Asia/Singapore' }, { ip: ip() })
    for (let i = 0; i < 3; i++) await visit({ tz: 'America/New_York' }, { ip: ip() })
    await visit({ tz: 'Europe/London' }, { ip: ip() })
    const c = ctx(repo)
    expect(await runCli(['traffic', '--days', '3'], c)).toBe(0)
    const text = c.lines.join('\n')
    expect(text).toContain('Traffic, 2026-11-15 to 2026-11-17')
    expect(text).toMatch(/2026-11-17 +10 +0 +0 +0/)
    expect(text).toMatch(/Singapore +6 +60\.0%/)
    expect(text).toMatch(/US and Canada +3 +30\.0%/)
    expect(text).toMatch(/UK and Ireland +1 +10\.0%/)
    expect(text).toContain('40.0% of visits')     // the US, Canada and UK share
    expect(text).toContain('Asia/Singapore 6')
    // it tells the reader what the numbers are not
    expect(text).toContain('Programs that pretend to be people can still get in')
    expect(text).toContain('Multiplayer matches are not recorded')
  })

  it('counts only FINISHED solo runs and the Daily attempts, per UTC day', async () => {
    const repo = testRepo()
    const heads = repo.approvedHeads().slice(0, 7)
    // a solo run on 17 Nov with all seven questions answered (or timed out), one with only three, and one finished the day before
    const mk = (answered: number, at: number) => {
      const run = repo.createRun(heads, 'test', at)
      repo.db.prepare("UPDATE run_questions SET result = 'miss' WHERE run_id = ? AND idx < ?").run(run.id, answered)
      return run
    }
    mk(7, DAY)
    mk(3, DAY)
    mk(7, DAY - 86_400_000)
    // two Daily players on 17 Nov: one finished, one did not (the Daily's own runs are not counted as solo runs)
    ensureDailySet(repo, '2026-11-17', DAY)
    const finished = repo.startDailyPlay('2026-11-17', 'guest-one-aaaaaaaaaaaa', heads, 'test', null, DAY)
    repo.startDailyPlay('2026-11-17', 'guest-two-bbbbbbbbbbbb', heads, 'test', null, DAY)
    repo.finishDailyPlay(finished.id, 300, DAY + 1000)
    repo.db.prepare("UPDATE run_questions SET result = 'miss' WHERE run_id = ?").run(finished.id)
    const c = ctx(repo)
    expect(await runCli(['traffic', '--days', '2'], c)).toBe(0)
    const text = c.lines.join('\n')
    expect(text).toMatch(/2026-11-17 +0 +1 +2 +1/)   // visits 0, solo finished 1, Daily players 2, Daily finished 1
    expect(text).toMatch(/2026-11-16 +0 +1 +0 +0/)
  })

  it('asks for a sensible number of days', async () => {
    expect(await runCli(['traffic', '--days', '0'], ctx())).toBe(1)
    expect(await runCli(['traffic', '--days', '400'], ctx())).toBe(1)
    expect(await runCli(['traffic', '--days', 'abc'], ctx())).toBe(1)
  })
})

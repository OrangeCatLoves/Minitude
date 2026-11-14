import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import type { Repo } from '../src/db/repo'
import { PipelineJudge } from '../src/judge/pipeline'
import { normalize } from '../src/normalize'
import { testRepo } from './helpers'

const T0 = Date.parse('2026-11-01T12:00:00Z')
const DAY = '2026-11-01'
const guestId = (n: number) => 'guest-' + String(n).padStart(16, '0')

function setup(repo: Repo = testRepo()) {
  let t = T0
  const clock = { advance: (ms: number) => { t += ms } }
  const app = createApp({ repo, judge: new PipelineJudge(repo, null, () => t), now: () => t, rand: () => 0.3, rateLimitPerMinute: 10_000, clientIp: () => 'local' })
  const call = async (method: 'GET' | 'POST', path: string, guest?: number, body?: unknown) => {
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (guest !== undefined) headers['x-guest'] = guestId(guest)
    const r = await app.request(path, { method, headers, body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined })
    return { status: r.status, json: (await r.json()) as any }
  }
  const get = (path: string, guest?: number) => call('GET', path, guest)
  /** opens the Daily; returns the run id and the seven question ids (read from the database: the API sends no prompt early) */
  const open = async (guest: number) => {
    const s = await call('POST', '/api/daily/start', guest)
    expect(s.status).toBe(200)
    return { runId: s.json.runId as string, ids: repo.getRun(s.json.runId)!.questions.map((q) => q.id) }
  }
  /** plays the whole Daily with time-outs: quick, and the run is finished */
  const finish = async (guest: number) => {
    const r = await open(guest)
    for (let i = 0; i < 7; i++) {
      await call('POST', `/api/run/${r.runId}/start`, undefined, { index: i })
      await call('POST', `/api/run/${r.runId}/miss`, undefined, { index: i })
    }
    return r
  }
  const summary = (guest: number, index: number, day = DAY) => get(`/api/daily/answers?day=${day}&index=${index}`, guest)
  const list = (guest: number, index: number, params: string, day = DAY) => get(`/api/daily/answers/list?day=${day}&index=${index}&${params}`, guest)
  return { repo, app, clock, get, open, finish, summary, list }
}

describe('who may see what counted', () => {
  it('needs a guest id, a real day and a real question number', async () => {
    const { finish, get, summary } = setup()
    await finish(1)
    expect((await get(`/api/daily/answers?day=${DAY}&index=0`)).status).toBe(400)               // no guest id
    expect((await summary(1, 7)).status).toBe(400)
    expect((await summary(1, -1)).status).toBe(400)
    expect((await get(`/api/daily/answers?day=yesterday&index=0`, 1)).status).toBe(400)
    expect((await get(`/api/daily/answers?day=${DAY}&index=abc`, 1)).status).toBe(400)
  })
  it('gives nothing to a guest who has not played that Daily, or a different day', async () => {
    const { finish, summary, list } = setup()
    await finish(1)
    expect((await summary(2, 0)).status).toBe(404)
    expect((await summary(2, 0)).json.code).toBe('no_play')
    expect((await summary(1, 0, '2026-10-31')).status).toBe(404)
    expect((await list(2, 0, 'tier=0')).status).toBe(404)
  })
  it('gives nothing while the Daily is still open', async () => {
    const { open, summary, list, repo } = setup()
    const r = await open(1)
    const s = await summary(1, 0)
    expect(s.status).toBe(403)
    expect(s.json.code).toBe('not_finished')
    expect((await list(1, 0, 'tier=0')).status).toBe(403)
    // the prompt and answers do not leak in the refusal either
    expect(JSON.stringify(s.json)).not.toContain(repo.getQuestion(r.ids[0])!.prompt)
  })
  it('opens once the Daily is finished (every question, also the ones that timed out)', async () => {
    const { finish, summary } = setup()
    const r = await finish(1)
    for (let i = 0; i < 7; i++) {
      const s = await summary(1, i)
      expect(s.status).toBe(200)
      expect(s.json.question.id).toBe(r.ids[i])
    }
  })
  it('a guest only ever sees the Daily they played themselves', async () => {
    const { finish, summary } = setup()
    await finish(1)
    await finish(2)
    expect((await summary(1, 0)).json.question.id).toBe((await summary(2, 0)).json.question.id)   // same Daily, same questions: each is shown to each who finished
    expect((await summary(3, 0)).status).toBe(404)
  })
})

describe('the counts by rarity', () => {
  it('seven rarities that add up to every accepted answer', async () => {
    const { finish, summary, repo } = setup()
    const r = await finish(1)
    for (let i = 0; i < 7; i++) {
      const s = (await summary(1, i)).json
      expect(s.tiers.map((t: any) => t.tier)).toEqual([0, 1, 2, 3, 4, 5, 6])
      expect(s.total).toBe(repo.answersOf(r.ids[i]).length)
      expect(s.tiers.reduce((a: number, t: any) => a + t.count, 0)).toBe(s.total)
      expect(s.gem).toBeNull()
      expect(s.tiers[6].count).toBe(0)
      for (let t = 0; t < 6; t++) expect(s.tiers[t].count).toBe(repo.answersOf(r.ids[i]).filter((a) => a.tier === t).length)
    }
  })
  it('the gem is counted under SINGULARITY, not under its stored rarity, and is named with its line', async () => {
    const { finish, summary, repo, open } = setup()
    void open
    const r = await finish(1)
    const qid = r.ids[2]
    const mythics = repo.answersOf(qid).filter((a) => a.tier === 5)
    const gem = mythics[0]
    repo.setGem(qid, gem.norm, 'A line about the gem.', null, 1)
    const s = (await summary(1, 2)).json
    expect(s.tiers[5].count).toBe(mythics.length - 1)
    expect(s.tiers[6].count).toBe(1)
    expect(s.gem).toEqual({ name: gem.name, description: 'A line about the gem.' })
    expect(s.total).toBe(repo.answersOf(qid).length)
  })
  it('a gem that is not stored Mythic is taken out of its own rarity (the owner exception)', async () => {
    const { finish, summary, repo } = setup()
    const r = await finish(1)
    const qid = r.ids[0]
    const legendary = repo.answersOf(qid).filter((a) => a.tier === 4)
    expect(legendary.length).toBeGreaterThan(0)
    repo.setGem(qid, legendary[0].norm, 'My favourite.', 'the owner pick', 1)
    const s = (await summary(1, 0)).json
    expect(s.tiers[4].count).toBe(legendary.length - 1)
    expect(s.tiers[6].count).toBe(1)
  })
})

describe('the lists', () => {
  it('a rarity is listed A to Z, a page at a time, and adds up to its count', async () => {
    const { finish, summary, list, repo } = setup()
    const r = await finish(1)
    const qid = r.ids[0]
    const t = (await summary(1, 0)).json.tiers.find((x: any) => x.count >= 3)
    const first = (await list(1, 0, `tier=${t.tier}&limit=2`)).json
    expect(first.total).toBe(t.count)
    expect(first.items.length).toBe(2)
    expect(first.items.every((i: any) => i.tier === t.tier)).toBe(true)
    const all = (await list(1, 0, `tier=${t.tier}&limit=200`)).json
    const names = all.items.map((i: any) => i.name)
    expect(names.length).toBe(t.count)
    expect([...names].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))).toEqual(names)
    // the second page continues where the first stopped
    const next = (await list(1, 0, `tier=${t.tier}&limit=2&offset=2`)).json
    expect(next.items.map((i: any) => i.name)).toEqual(names.slice(2, 4))
    expect(new Set(names).size).toBe(names.length)
    expect(names.sort()).toEqual(repo.answersOf(qid).filter((a) => a.tier === t.tier).map((a) => a.name).sort())
  })
  it('the gem is left out of its stored rarity and is the one answer of SINGULARITY', async () => {
    const { finish, list, repo } = setup()
    const r = await finish(1)
    const qid = r.ids[1]
    const gem = repo.answersOf(qid).filter((a) => a.tier === 5)[0]
    repo.setGem(qid, gem.norm, 'Line.', null, 1)
    const mythic = (await list(1, 1, 'tier=5&limit=200')).json
    expect(mythic.items.map((i: any) => i.name)).not.toContain(gem.name)
    const gemList = (await list(1, 1, 'tier=6')).json
    expect(gemList).toEqual({ total: 1, offset: 0, items: [{ name: gem.name, tier: 6 }] })
    expect((await list(1, 1, 'tier=6&q=zzzzqqq')).json.total).toBe(0)
  })
  it('searching finds an answer in any rarity and tells which one; the gem shows as SINGULARITY', async () => {
    const { finish, list, repo } = setup()
    const r = await finish(1)
    const qid = r.ids[0]
    const rows = repo.answersOf(qid)
    const probe = rows.find((a) => a.tier === 2)!
    const found = (await list(1, 0, `q=${encodeURIComponent(probe.name.toUpperCase())}`)).json
    expect(found.items.some((i: any) => i.name === probe.name && i.tier === 2)).toBe(true)
    repo.setGem(qid, probe.norm, 'Line.', null, 1)
    const again = (await list(1, 0, `q=${encodeURIComponent(probe.name)}`)).json
    expect(again.items.find((i: any) => i.name === probe.name).tier).toBe(6)
  })
  it('searching also finds an answer by another way of writing it, and shows those', async () => {
    const { finish, list, repo } = setup()
    const r = await finish(1)
    const qid = r.ids[0]
    const a = repo.answersOf(qid)[0]
    repo.insertSpelling({ questionId: qid, norm: normalize('Zorbulax Nickname'), verdict: 'valid', canonNorm: a.norm, source: 'alias', at: 1 })
    const found = (await list(1, 0, 'q=zorbulax')).json
    expect(found.items.map((i: any) => i.name)).toContain(a.name)
    expect(found.items.find((i: any) => i.name === a.name).also).toContain('zorbulax nickname')
    // a learned misspelling is not shown as another way of writing it
    repo.insertSpelling({ questionId: qid, norm: 'qwxzzy', verdict: 'valid', canonNorm: a.norm, source: 'typo', at: 1 })
    expect((await list(1, 0, 'q=qwxzzy')).json.total).toBe(0)
  })
  it('percent and underscore in a search are letters, not wildcards', async () => {
    const { finish, list } = setup()
    await finish(1)
    expect((await list(1, 0, 'q=%25')).json.total).toBe(0)
    expect((await list(1, 0, 'q=_')).json.total).toBe(0)
  })
  it('refuses a bad rarity, no tier and no search, an overlong search; caps the page size', async () => {
    const { finish, list } = setup()
    await finish(1)
    expect((await list(1, 0, 'tier=7')).status).toBe(400)
    expect((await list(1, 0, 'tier=-1')).status).toBe(400)
    expect((await list(1, 0, 'tier=abc')).status).toBe(400)
    expect((await list(1, 0, '')).status).toBe(400)
    expect((await list(1, 0, 'q=' + 'x'.repeat(61))).status).toBe(400)
    const big = (await list(1, 0, 'tier=0&limit=99999')).json
    expect(big.items.length).toBeLessThanOrEqual(200)
  })
  it('replies carry nothing about how answers are checked', async () => {
    const { finish, summary, list } = setup()
    await finish(1)
    const text = JSON.stringify((await summary(1, 0)).json) + JSON.stringify((await list(1, 0, 'tier=0')).json)
    for (const w of ['model', 'gemini', 'llm', 'checker', 'mock', 'fallback']) expect(text.toLowerCase()).not.toContain(w)
  })
})

import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import type { Judge, JudgeOutcome } from '../src/judge/types'
import { PipelineJudge } from '../src/judge/pipeline'
import { VersusHub } from '../src/versus'
import { testRepo } from './helpers'

// "Everything that counted" for a solo run and for a multiplayer match (the owner asked on 18 Nov 2026; the Daily's screen is in answers.test.ts).
// The rule is the same: nothing before the run or the match is over, and only for whoever played it.

const T0 = Date.parse('2026-11-01T12:00:00Z')
const guestId = (n: number) => 'guest-' + String(n).padStart(16, '0')

class AlwaysValid implements Judge {
  readonly kind = 'list' as const
  async judge(): Promise<JudgeOutcome> {
    return { res: { status: 'valid', answer: 'X', description: '', tier: 0, points: 10 }, via: 'stored' }
  }
}

function setup() {
  const repo = testRepo()
  const clock = { t: T0 }
  const hub = new VersusHub({ judge: new AlwaysValid(), heads: () => repo.approvedHeads(), pick: (h) => h.slice(0, 7), now: () => clock.t, rand: () => 0.5, seconds: 30, makeCode: () => 'QAAAA' })
  const app = createApp({ repo, judge: new PipelineJudge(repo, null, () => clock.t), now: () => clock.t, rand: () => 0.3, rateLimitPerMinute: 10_000, clientIp: () => 'local', versus: hub })
  const call = async (method: 'GET' | 'POST', path: string, guest?: number, body?: unknown) => {
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (guest !== undefined) headers['x-guest'] = guestId(guest)
    const r = await app.request(path, { method, headers, body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined })
    return { status: r.status, json: (await r.json()) as any }
  }
  return { repo, clock, hub, call }
}

describe('everything that counted: a solo run', () => {
  const startRun = async (s: ReturnType<typeof setup>) => {
    const r = await s.call('POST', '/api/run')
    expect(r.status).toBe(200)
    return { runId: r.json.runId as string, ids: s.repo.getRun(r.json.runId)!.questions.map((q) => q.id) }
  }
  const finishRun = async (s: ReturnType<typeof setup>, runId: string) => {
    for (let i = 0; i < 7; i++) {
      await s.call('POST', `/api/run/${runId}/start`, undefined, { index: i })
      await s.call('POST', `/api/run/${runId}/miss`, undefined, { index: i })
    }
  }

  it('gives nothing while the run is still open, and the refusal does not leak the question', async () => {
    const s = setup()
    const { runId, ids } = await startRun(s)
    const a = await s.call('GET', `/api/run/${runId}/answers?index=0`)
    expect(a.status).toBe(403)
    expect(a.json.code).toBe('not_finished')
    expect(JSON.stringify(a.json)).not.toContain(s.repo.getQuestion(ids[0])!.prompt)
    expect((await s.call('GET', `/api/run/${runId}/answers/list?index=0&tier=0`)).status).toBe(403)
    // one question left open is still "not finished"
    for (let i = 0; i < 6; i++) { await s.call('POST', `/api/run/${runId}/start`, undefined, { index: i }); await s.call('POST', `/api/run/${runId}/miss`, undefined, { index: i }) }
    expect((await s.call('GET', `/api/run/${runId}/answers?index=0`)).status).toBe(403)
  })

  it('opens for every question once the run is finished, and pages the answers', async () => {
    const s = setup()
    const { runId, ids } = await startRun(s)
    await finishRun(s, runId)
    for (let i = 0; i < 7; i++) {
      const a = await s.call('GET', `/api/run/${runId}/answers?index=${i}`)
      expect(a.status).toBe(200)
      expect(a.json.question.id).toBe(ids[i])
      expect(a.json.tiers).toHaveLength(7)
    }
    const page = await s.call('GET', `/api/run/${runId}/answers/list?index=0&tier=0&limit=5`)
    expect(page.status).toBe(200)
    expect(page.json.items.length).toBeGreaterThan(0)
    const search = await s.call('GET', `/api/run/${runId}/answers/list?index=0&q=a`)
    expect(search.status).toBe(200)
  })

  it('refuses a bad question number, an unknown run and a run that is not a solo run', async () => {
    const s = setup()
    const { runId } = await startRun(s)
    await finishRun(s, runId)
    expect((await s.call('GET', `/api/run/${runId}/answers?index=7`)).status).toBe(400)
    expect((await s.call('GET', `/api/run/${runId}/answers?index=x`)).status).toBe(400)
    expect((await s.call('GET', `/api/run/${runId}/answers/list?index=0`)).status).toBe(400)   // neither a rarity nor a search text
    expect((await s.call('GET', `/api/run/${runId}/answers/list?index=0&tier=9`)).status).toBe(400)
    expect((await s.call('GET', `/api/run/not-a-run/answers?index=0`)).status).toBe(404)
    // a Daily run id does not work on the solo route (the Daily has its own rules: the guest and the day)
    const d = await s.call('POST', '/api/daily/start', 1)
    expect(d.status).toBe(200)
    for (let i = 0; i < 7; i++) { await s.call('POST', `/api/run/${d.json.runId}/start`, undefined, { index: i }); await s.call('POST', `/api/run/${d.json.runId}/miss`, undefined, { index: i }) }
    expect((await s.call('GET', `/api/run/${d.json.runId}/answers?index=0`)).status).toBe(404)
  })
})

describe('everything that counted: a multiplayer match', () => {
  /** two players in a room; returns the code */
  const room = (s: ReturnType<typeof setup>) => {
    const code = s.hub.create(guestId(1), 'Alice', 'private').code
    s.hub.join(guestId(2), code, 'Bob')
    for (const g of [1, 2]) s.hub.subscribe(guestId(g), code, () => {})   // a player counts as here once the live connection is open
    return code
  }
  const playAll = async (s: ReturnType<typeof setup>, code: string) => {
    s.hub.start(guestId(1), code)
    s.clock.t += 3000
    s.hub.tick()
    for (let r = 0; r < 7; r++) {
      for (const g of [1, 2]) { await s.hub.answer(guestId(g), code, r, 'anything'); s.hub.revealed(guestId(g), code, r) }
      for (const g of [1, 2]) s.hub.ready(guestId(g), code, r)
    }
  }

  it('gives nothing before the match is over, nor to a guest who is not in the room', async () => {
    const s = setup()
    const code = room(s)
    s.hub.start(guestId(1), code)
    s.clock.t += 3000
    s.hub.tick()
    const early = await s.call('GET', `/api/versus/${code}/answers?index=0`, 1)
    expect(early.status).toBe(409)
    expect(early.json.code).toBe('not_over')
    expect((await s.call('GET', `/api/versus/${code}/answers/list?index=0&tier=0`, 1)).status).toBe(409)
    expect((await s.call('GET', `/api/versus/${code}/answers?index=0`, 3)).status).toBe(404)   // not in the room
    expect((await s.call('GET', `/api/versus/${code}/answers?index=0`)).status).toBe(400)       // no guest id
  })

  it('opens for the players of a finished match, question by question', async () => {
    const s = setup()
    const code = room(s)
    await playAll(s, code)
    for (const g of [1, 2]) {
      for (let i = 0; i < 7; i++) {
        const a = await s.call('GET', `/api/versus/${code}/answers?index=${i}`, g)
        expect(a.status, `guest ${g} question ${i}`).toBe(200)
        expect(a.json.tiers).toHaveLength(7)
      }
    }
    const page = await s.call('GET', `/api/versus/${code}/answers/list?index=0&tier=0&limit=3`, 2)
    expect(page.status).toBe(200)
    // somebody else still gets nothing
    expect((await s.call('GET', `/api/versus/${code}/answers?index=0`, 3)).status).toBe(404)
    expect((await s.call('GET', `/api/versus/${code}/answers?index=7`, 1)).status).toBe(400)
  })

  it('closes again when the host starts a rematch (the questions are gone)', async () => {
    const s = setup()
    const code = room(s)
    await playAll(s, code)
    s.hub.rematch(guestId(1), code)
    expect((await s.call('GET', `/api/versus/${code}/answers?index=0`, 1)).status).toBe(409)
  })
})

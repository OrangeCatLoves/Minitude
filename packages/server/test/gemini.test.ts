import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GeminiClient, type GeminiConfig } from '../src/llm/gemini'
import type { JsonRequest } from '../src/llm/types'

/** a reply the way Google sends one */
const reply = (value: unknown) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }] }), { status: 200 })
const later = <T>(ms: number, make: () => T) => new Promise<T>((resolve) => setTimeout(() => resolve(make()), ms))

const req = (extra: Partial<JsonRequest> = {}): JsonRequest => ({
  purpose: 'judge', system: 's', prompt: 'p', schema: { type: 'OBJECT' }, timeoutMs: 3000, retries: 0, ...extra,
})
const client = () => new GeminiClient({ apiKey: 'test-key', model: 'm', baseUrl: 'http://fake.invalid' })

afterEach(() => { vi.unstubAllGlobals() })

describe('GeminiClient hedging (resend a slow call)', () => {
  it('sends one request when the first answers in time', async () => {
    const f = vi.fn(() => later(10, () => reply({ n: 1 })))
    vi.stubGlobal('fetch', f)
    expect(await client().generateJson(req({ hedgeAfterMs: 200 }))).toEqual({ n: 1 })
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('takes the second reply when the first is slow', async () => {
    let n = 0
    const f = vi.fn(() => (++n === 1 ? later(1500, () => reply({ from: 'slow' })) : later(10, () => reply({ from: 'fast' }))))
    vi.stubGlobal('fetch', f)
    const t0 = Date.now()
    expect(await client().generateJson(req({ hedgeAfterMs: 100 }))).toEqual({ from: 'fast' })
    expect(Date.now() - t0).toBeLessThan(1000)
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('goes straight to the second request when the first fails outright', async () => {
    let n = 0
    const f = vi.fn(() => (++n === 1 ? Promise.reject(new TypeError('network down')) : later(10, () => reply({ ok: true }))))
    vi.stubGlobal('fetch', f)
    const t0 = Date.now()
    expect(await client().generateJson(req({ hedgeAfterMs: 2000 }))).toEqual({ ok: true })
    expect(Date.now() - t0).toBeLessThan(1000) // did not wait for the 2000 ms hedge timer
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('still wins with the first reply when the second one is slower', async () => {
    let n = 0
    const f = vi.fn(() => (++n === 1 ? later(250, () => reply({ from: 'first' })) : later(1500, () => reply({ from: 'second' }))))
    vi.stubGlobal('fetch', f)
    expect(await client().generateJson(req({ hedgeAfterMs: 100 }))).toEqual({ from: 'first' })
  })

  it('fails when both requests fail', async () => {
    const f = vi.fn(() => Promise.reject(new TypeError('network down')))
    vi.stubGlobal('fetch', f)
    await expect(client().generateJson(req({ hedgeAfterMs: 50 }))).rejects.toThrow(/unreachable/)
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('sends one request and never hedges when hedgeAfterMs is not set', async () => {
    const f = vi.fn(() => later(300, () => reply({ n: 1 })))
    vi.stubGlobal('fetch', f)
    expect(await client().generateJson(req())).toEqual({ n: 1 })
    expect(f).toHaveBeenCalledTimes(1)
  })
})

// ------------------------------------------------------------------ the fallback model
const modelOf = (url: unknown) => String(url).match(/models\/([^:]+):/)?.[1] ?? '?'

/** a fetch that answers per model: 'ok', an HTTP error, or 'hang' (no answer until the request is cancelled). The plan can change between calls. */
function stubModels(plan: Record<string, 'ok' | '503' | '429' | 'hang'>) {
  const calls: string[] = []
  vi.stubGlobal('fetch', vi.fn((url: unknown, init?: { signal?: AbortSignal }) => {
    const m = modelOf(url)
    calls.push(m)
    const what = plan[m] ?? 'ok'
    if (what === 'ok') return later(10, () => reply({ from: m }))
    if (what === 'hang') return new Promise((_ok, no) => init?.signal?.addEventListener('abort', () => no(Object.assign(new Error('aborted'), { name: 'AbortError' }))))
    return later(10, () => new Response('{}', { status: Number(what) }))
  }))
  return { calls, plan }
}

describe('GeminiClient fallback model', () => {
  let clock = 0
  const fb = (extra: Partial<GeminiConfig> = {}) => new GeminiClient({ apiKey: 'k', model: 'main', fallbackModel: 'backup', baseUrl: 'http://fake.invalid', now: () => clock, ...extra })
  const fbReq = (extra: Partial<JsonRequest> = {}) => req({ failoverAfterMs: 150, timeoutMs: 2000, ...extra })
  beforeEach(() => { clock = 1_000_000; vi.spyOn(console, 'warn').mockImplementation(() => {}) })
  afterEach(() => { vi.restoreAllMocks() })

  it('uses only the main model while it works', async () => {
    const s = stubModels({})
    const used: string[] = []
    expect(await fb().generateJson(fbReq({ onModel: (m) => used.push(m) }))).toEqual({ from: 'main' })
    expect(s.calls).toEqual(['main'])
    expect(used).toEqual(['main'])
  })

  it('goes to the fallback when the main model fails, and says which model answered', async () => {
    const s = stubModels({ main: '503' })
    const used: string[] = []
    expect(await fb().generateJson(fbReq({ onModel: (m) => used.push(m) }))).toEqual({ from: 'backup' })
    expect(s.calls).toEqual(['main', 'backup'])
    expect(used).toEqual(['backup'])
  })

  it('then leaves the main model alone for a while, and tries it again afterwards', async () => {
    const s = stubModels({ main: '503' })
    const c = fb()
    await c.generateJson(fbReq())
    await c.generateJson(fbReq())
    expect(s.calls).toEqual(['main', 'backup', 'backup']) // the second call did not wait for the main model
    clock += 61_000
    s.plan.main = 'ok'
    expect(await c.generateJson(fbReq())).toEqual({ from: 'main' })
  })

  it('skips the main model for a shorter time after a rate limit, which clears sooner', async () => {
    const s = stubModels({ main: '429' })
    const c = fb()
    await c.generateJson(fbReq())
    clock += 16_000
    s.plan.main = 'ok'
    expect(await c.generateJson(fbReq())).toEqual({ from: 'main' })
  })

  it('goes to the fallback when the main model does not answer in time, well inside the overall limit', async () => {
    const s = stubModels({ main: 'hang' })
    const t0 = Date.now()
    expect(await fb().generateJson(fbReq({ failoverAfterMs: 150, timeoutMs: 2000 }))).toEqual({ from: 'backup' })
    expect(Date.now() - t0).toBeLessThan(1200)
    expect(s.calls).toEqual(['main', 'backup'])
  })

  it('fails when both models fail', async () => {
    stubModels({ main: '503', backup: '503' })
    await expect(fb().generateJson(fbReq())).rejects.toThrow(/http 503/)
  })

  it('while the main model is being skipped and the fallback fails, the main model is the last resort', async () => {
    const s = stubModels({ main: '503' })
    const c = fb()
    await c.generateJson(fbReq()) // opens the skip
    s.plan.backup = '503'
    s.plan.main = 'ok'
    expect(await c.generateJson(fbReq())).toEqual({ from: 'main' })
    expect(s.calls.slice(-2)).toEqual(['backup', 'main'])
  })

  it('does nothing different when there is no fallback model', async () => {
    const s = stubModels({ main: '503' })
    await expect(fb({ fallbackModel: undefined }).generateJson(fbReq())).rejects.toThrow(/http 503/)
    expect(s.calls).toEqual(['main'])
  })

  it('never uses the fallback for a call that did not ask for it (the question generator)', async () => {
    const s = stubModels({ main: '503' })
    await expect(fb().generateJson(req())).rejects.toThrow(/http 503/)
    expect(s.calls).toEqual(['main'])
  })
})

import { LlmError, type JsonRequest, type LlmClient } from './types'

/**
 * Gemini over plain HTTPS (generateContent with a JSON response schema).
 * Verified against the real service with gemini-3.5-flash-lite (about 1.1 s per call); the request shape and JSON schema work as written.
 */
export interface GeminiConfig {
  apiKey: string
  model: string
  /** Another model to use when the main one fails or does not answer. Only requests that ask for it (`failoverAfterMs`) can use it. */
  fallbackModel?: string
  /** how long the main model is left alone after it failed, in ms (default 60 s; 15 s after a rate-limit error, which clears sooner) */
  skipMainMs?: number
  /** the clock, for tests */
  now?: () => number
  baseUrl?: string
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class GeminiClient implements LlmClient {
  /** while the clock is before this, the main model is not tried first: it failed a moment ago */
  private mainDownUntil = 0
  constructor(private cfg: GeminiConfig) {}
  get model(): string { return this.cfg.model }

  async generateJson(req: JsonRequest): Promise<unknown> {
    const fallback = this.cfg.fallbackModel
    if (!fallback || fallback === this.cfg.model || !req.failoverAfterMs) return this.run(this.cfg.model, req)
    return this.withFallback(fallback, req, req.failoverAfterMs)
  }

  /**
   * The main model first. If it fails, or has not answered within `mainMs`, the fallback model gets the rest of the time. After a failure the
   * main model is skipped for a while, so players are not made to wait for it again and again while it is having trouble.
   */
  private async withFallback(fallback: string, req: JsonRequest, mainMs: number): Promise<unknown> {
    const now = this.cfg.now ?? Date.now
    const t0 = now()
    const total = req.timeoutMs ?? 15000
    const left = () => Math.max(1500, total - (now() - t0))

    if (t0 < this.mainDownUntil) {
      try {
        return await this.run(fallback, { ...req, retries: 0, timeoutMs: total })
      } catch {
        // the fallback failed too: the main model may have recovered, so it is the last resort
        return this.run(this.cfg.model, { ...req, retries: 0, timeoutMs: left() })
      }
    }

    try {
      return await this.run(this.cfg.model, { ...req, retries: 0, timeoutMs: Math.min(total, mainMs) })
    } catch (e) {
      if (e instanceof LlmError && e.kind === 'unavailable') {
        // a rate limit ("http 429") clears within seconds; a stalled or overloaded model needs longer
        const skip = /http 429/.test(e.message) ? Math.min(this.cfg.skipMainMs ?? 15_000, 15_000) : this.cfg.skipMainMs ?? 60_000
        this.mainDownUntil = now() + skip
        console.warn(`[llm] ${this.cfg.model} failed (${e.message}); using ${fallback} for the next ${Math.round(skip / 1000)} s`)
      }
    }
    return this.run(fallback, { ...req, retries: 0, timeoutMs: left() })
  }

  /** one model, with the hedged second request when the call asks for it */
  private async run(model: string, req: JsonRequest): Promise<unknown> {
    const out = req.hedgeAfterMs ? await this.hedged(model, req, req.hedgeAfterMs) : await this.attempts(model, req)
    req.onModel?.(model)
    return out
  }

  /** Runs the request; if it is still waiting after `afterMs` (or has failed), runs it a second time and takes the first success. */
  private hedged(model: string, req: JsonRequest, afterMs: number): Promise<unknown> {
    const t0 = Date.now()
    const total = req.timeoutMs ?? 15000
    return new Promise((resolve, reject) => {
      let started = 0, running = 0, settled = false
      let timer: ReturnType<typeof setTimeout> | undefined
      const launch = (): void => {
        clearTimeout(timer)
        started++; running++
        // the second request only gets what is left of the overall time, so hedging never makes the wait longer than timeoutMs
        const mine = started === 1 ? req : { ...req, timeoutMs: Math.max(1500, total - (Date.now() - t0)) }
        if (started === 1) timer = setTimeout(launch, afterMs)
        this.attempts(model, mine).then(
          (v) => { if (!settled) { settled = true; clearTimeout(timer); resolve(v) } },
          (e: unknown) => {
            running--
            if (settled) return
            if (started < 2) launch() // the first one failed outright: go straight to the second
            else if (running === 0) { settled = true; clearTimeout(timer); reject(e) }
          },
        )
      }
      launch()
    })
  }

  private async attempts(model: string, req: JsonRequest): Promise<unknown> {
    const retries = req.retries ?? 1
    let last: unknown
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.once(model, req)
      } catch (e) {
        last = e
        const retryable = e instanceof LlmError && e.kind === 'unavailable' && /http (429|500|502|503|504)/.test(e.message)
        if (!retryable || attempt === retries) break
        await sleep(800 * 2 ** attempt)
      }
    }
    throw last instanceof Error ? last : new LlmError(String(last))
  }

  private async once(model: string, req: JsonRequest): Promise<unknown> {
    const base = this.cfg.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta'
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), req.timeoutMs ?? 15000)
    let res: Response
    try {
      res = await fetch(`${base}/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        signal: ctl.signal,
        headers: { 'content-type': 'application/json', 'x-goog-api-key': this.cfg.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: req.system }] },
          contents: [{ role: 'user', parts: [{ text: req.prompt }] }],
          generationConfig: {
            temperature: req.temperature ?? 0,
            // thinking models count their hidden reasoning inside this limit, so leave plenty of room
            maxOutputTokens: req.maxOutputTokens ?? 2048,
            responseMimeType: 'application/json',
            responseSchema: req.schema,
          },
        }),
      })
    } catch (e) {
      throw new LlmError(e instanceof Error && e.name === 'AbortError' ? 'model timed out' : 'model unreachable')
    } finally {
      clearTimeout(timer)
    }
    if (!res.ok) throw new LlmError('model http ' + res.status)
    let body: { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[] }
    try { body = (await res.json()) as typeof body } catch { throw new LlmError('model reply was not JSON', 'bad_reply') }
    const cand = body.candidates?.[0]
    const text = cand?.content?.parts?.map((p) => p.text ?? '').join('')
    if (!text) throw new LlmError('model gave no text' + (cand?.finishReason ? ` (${cand.finishReason})` : ''), 'bad_reply')
    try { return JSON.parse(text) } catch { throw new LlmError('model text was not valid JSON', 'bad_reply') }
  }
}

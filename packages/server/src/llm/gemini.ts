import { LlmError, type JsonRequest, type LlmClient } from './types'

/**
 * Gemini over plain HTTPS (generateContent with a JSON response schema).
 *
 * NEVER RUN against the real service by the people who wrote it: the build environment could not reach Google. It follows the
 * documented v1beta request shape. Run `npm run trial -w @minitude/server` first and read what it prints. If Google changed
 * a field name, this is the only file to fix.
 */
export interface GeminiConfig {
  apiKey: string
  model: string
  baseUrl?: string
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class GeminiClient implements LlmClient {
  constructor(private cfg: GeminiConfig) {}
  get model(): string { return this.cfg.model }

  async generateJson(req: JsonRequest): Promise<unknown> {
    const retries = req.retries ?? 1
    let last: unknown
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.once(req)
      } catch (e) {
        last = e
        const retryable = e instanceof LlmError && e.kind === 'unavailable' && /http (429|500|502|503|504)/.test(e.message)
        if (!retryable || attempt === retries) break
        await sleep(800 * 2 ** attempt)
      }
    }
    throw last instanceof Error ? last : new LlmError(String(last))
  }

  private async once(req: JsonRequest): Promise<unknown> {
    const base = this.cfg.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta'
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), req.timeoutMs ?? 15000)
    let res: Response
    try {
      res = await fetch(`${base}/models/${encodeURIComponent(this.cfg.model)}:generateContent`, {
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

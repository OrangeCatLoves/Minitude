import type { Repo } from '../db/repo'
import { LlmError, type JsonRequest, type LlmClient } from './types'

export interface Budget {
  perMinute: number
  perDay: number
}

export const DEFAULT_BUDGET: Budget = { perMinute: 10, perDay: 200 }

export interface GuardOptions {
  /** instead of refusing when the per-minute budget is used up, wait for the minute to pass (for the command-line tools, where nobody is waiting on a screen) */
  waitForMinute?: boolean
  sleep?: (ms: number) => Promise<void>
}

/**
 * Wraps a model client: refuses calls once the minute or day budget is used up (so a free plan is never exceeded by accident),
 * and writes every call to the database log. The budget is counted from that log, so it survives restarts and is shared with
 * the command-line tools.
 */
export class GuardedLlm implements LlmClient {
  constructor(private inner: LlmClient, private repo: Repo, private budget: Budget = DEFAULT_BUDGET, private now: () => number = Date.now, private opts: GuardOptions = {}) {}
  get model(): string { return this.inner.model }

  /** calls left today (for messages) */
  leftToday(): number { return Math.max(0, this.budget.perDay - this.repo.llmCallsSince(this.now() - 86_400_000)) }

  async generateJson(req: JsonRequest): Promise<unknown> {
    if (this.opts.waitForMinute) {
      const sleep = this.opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
      for (let i = 0; i < 40 && this.repo.llmCallsSince(this.now() - 60_000) >= this.budget.perMinute; i++) await sleep(2000)
    }
    const t = this.now()
    if (this.repo.llmCallsSince(t - 60_000) >= this.budget.perMinute) throw new LlmError('per-minute budget used up', 'budget')
    if (this.repo.llmCallsSince(t - 86_400_000) >= this.budget.perDay) throw new LlmError('daily budget used up', 'budget')
    const id = this.repo.startLlm(t, req.purpose, this.inner.model)
    try {
      const out = await this.inner.generateJson(req)
      this.repo.finishLlm(id, true, this.now() - t)
      return out
    } catch (e) {
      this.repo.finishLlm(id, false, this.now() - t, e instanceof Error ? e.message.slice(0, 200) : String(e))
      throw e
    }
  }
}

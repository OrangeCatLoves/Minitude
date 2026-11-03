import { describe, expect, it } from 'vitest'
import { PipelineJudge } from '../src/judge/pipeline'
import { DEFAULT_FALLBACK_MODEL, makeLlm } from '../src/llm/factory'
import { GuardedLlm } from '../src/llm/guard'
import { dec, FakeLlm, head, testRepo } from './helpers'

const CHEESE = 'food-cheese'

describe('which model made a decision', () => {
  it('a stored decision names the fallback model when that is the one that answered', async () => {
    const repo = testRepo()
    const llm = new FakeLlm((req) => { req.onModel?.('backup-model'); return dec({ answer: 'Beenleigh Blue', tier: 4 }) })
    const judge = new PipelineJudge(repo, llm, () => 5_000)
    await judge.judge(head(repo, CHEESE), 'beenleigh blue')
    expect(repo.getAnswer(CHEESE, 'beenleigh blue')).toMatchObject({ source: 'live', model: 'backup-model' })
  })

  it('and names the main model when nothing says otherwise', async () => {
    const repo = testRepo()
    const judge = new PipelineJudge(repo, new FakeLlm(() => dec({ answer: 'Beenleigh Blue', tier: 4 })), () => 5_000)
    await judge.judge(head(repo, CHEESE), 'beenleigh blue')
    expect(repo.getAnswer(CHEESE, 'beenleigh blue')).toMatchObject({ model: 'fake-model' })
  })

  it('live answer checks ask for the fallback; the 8 s limit is the total for both models', async () => {
    const repo = testRepo()
    const llm = new FakeLlm()
    await new PipelineJudge(repo, llm, () => 5_000).judge(head(repo, CHEESE), 'beenleigh blue')
    expect(llm.calls[0]).toMatchObject({ failoverAfterMs: 3000, timeoutMs: 8000 })
  })

  it('the call log names the model that answered', async () => {
    const repo = testRepo()
    const inner = new FakeLlm((req) => { req.onModel?.('backup-model'); return dec() })
    const guarded = new GuardedLlm(inner, repo, { perMinute: 100, perDay: 100 }, () => 5_000)
    await guarded.generateJson({ purpose: 'judge', system: 's', prompt: 'p', schema: { type: 'OBJECT' } })
    expect(repo.db.prepare('SELECT model, ok FROM llm_log').get()).toEqual({ model: 'backup-model', ok: 1 })
  })
})

describe('the fallback model setting', () => {
  const repo = testRepo()
  const env = (o: Record<string, string> = {}) => ({ GEMINI_API_KEY: 'k', LLM_MODEL: 'gemini-3.5-flash-lite', ...o }) as NodeJS.ProcessEnv
  it('is gemini-3.5-flash unless said otherwise', () => {
    expect(makeLlm(repo, env()).describe).toContain(`falling back to ${DEFAULT_FALLBACK_MODEL}`)
  })
  it('can be changed with LLM_FALLBACK_MODEL', () => {
    expect(makeLlm(repo, env({ LLM_FALLBACK_MODEL: 'gemini-x' })).describe).toContain('falling back to gemini-x')
  })
  it('can be turned off', () => {
    expect(makeLlm(repo, env({ LLM_FALLBACK_MODEL: 'none' })).describe).toContain('no fallback model')
    expect(makeLlm(repo, env({ LLM_FALLBACK_MODEL: '' })).describe).toContain('no fallback model')
  })
  it('is not used when it is the main model itself', () => {
    expect(makeLlm(repo, env({ LLM_MODEL: DEFAULT_FALLBACK_MODEL })).describe).toContain('no fallback model')
  })
})

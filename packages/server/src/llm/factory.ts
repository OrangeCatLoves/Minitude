import type { Repo } from '../db/repo'
import { GeminiClient } from './gemini'
import { DEFAULT_BUDGET, GuardedLlm, type GuardOptions } from './guard'
import type { LlmClient } from './types'

export const DEFAULT_MODEL = 'gemini-3.8-flash'
/** used for live answer checks when the main model fails or does not answer; verified to answer when the flash-lite models were overloaded */
export const DEFAULT_FALLBACK_MODEL = 'gemini-3.5-flash'

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v)
  return v !== undefined && v !== '' && Number.isFinite(n) && n >= 0 ? n : fallback
}

export interface LlmSetup {
  /** null = no language model (mock mode) */
  llm: LlmClient | null
  /** one line for the start-up message */
  describe: string
}

/**
 * Chooses the language model from environment variables:
 *   LLM_PROVIDER      'gemini' or 'mock'. Unset means gemini when GEMINI_API_KEY is set, otherwise mock.
 *   GEMINI_API_KEY    your key (keep it in .env, never in code)
 *   LLM_MODEL         default gemini-3.8-flash
 *   LLM_FALLBACK_MODEL  used for live answer checks when LLM_MODEL fails or does not answer. Default gemini-3.5-flash; "none" turns it off.
 *   LLM_MAX_PER_MINUTE / LLM_MAX_PER_DAY   budget (defaults 10 and 200): calls beyond it are refused, not sent
 */
export function makeLlm(repo: Repo, env: NodeJS.ProcessEnv = process.env, opts: GuardOptions = {}): LlmSetup {
  const provider = (env.LLM_PROVIDER ?? (env.GEMINI_API_KEY ? 'gemini' : 'mock')).toLowerCase()
  if (provider === 'mock') return { llm: null, describe: 'mock (no language model: only stored answers count)' }
  if (provider !== 'gemini') return { llm: null, describe: `mock (unknown LLM_PROVIDER "${provider}")` }
  if (!env.GEMINI_API_KEY) return { llm: null, describe: 'mock (LLM_PROVIDER=gemini but GEMINI_API_KEY is not set)' }
  const model = env.LLM_MODEL || DEFAULT_MODEL
  const budget = { perMinute: num(env.LLM_MAX_PER_MINUTE, DEFAULT_BUDGET.perMinute), perDay: num(env.LLM_MAX_PER_DAY, DEFAULT_BUDGET.perDay) }
  const wanted = (env.LLM_FALLBACK_MODEL === undefined ? DEFAULT_FALLBACK_MODEL : env.LLM_FALLBACK_MODEL).trim()
  const fallbackModel = wanted && !['none', 'off', 'false', '0'].includes(wanted.toLowerCase()) && wanted !== model ? wanted : undefined
  const llm = new GuardedLlm(new GeminiClient({ apiKey: env.GEMINI_API_KEY, model, ...(fallbackModel ? { fallbackModel } : {}) }), repo, budget, Date.now, opts)
  return { llm, describe: `Gemini ${model}${fallbackModel ? `, falling back to ${fallbackModel} when it fails` : ', no fallback model'} (budget ${budget.perMinute}/min, ${budget.perDay}/day)` }
}

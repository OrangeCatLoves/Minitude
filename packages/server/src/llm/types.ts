/**
 * The language model, as the rest of the server sees it: one call that returns JSON matching a schema.
 * Gemini-specific code lives in gemini.ts only; tests use a scripted fake.
 */
export type Purpose = 'judge' | 'generate' | 'audit'

export interface JsonSchema {
  type: 'OBJECT' | 'ARRAY' | 'STRING' | 'INTEGER' | 'NUMBER' | 'BOOLEAN'
  properties?: Record<string, JsonSchema>
  items?: JsonSchema
  required?: string[]
  enum?: string[]
}

export interface JsonRequest {
  purpose: Purpose
  system: string
  prompt: string
  schema: JsonSchema
  temperature?: number
  maxOutputTokens?: number
  timeoutMs?: number
  /** extra attempts after a rate-limit or server error */
  retries?: number
  /**
   * For a call a player is waiting on: if there is no reply after this many ms, send the same request a second time and use whichever
   * answers first. The slowest few percent of calls are many times slower than a normal one; this cuts that tail. Costs one extra
   * call only when the first one is slow. timeoutMs still caps the whole thing.
   */
  hedgeAfterMs?: number
  /**
   * Lets the client use its fallback model for this call. The main model gets this many ms (timeoutMs is still the total for both);
   * if it has failed or has not answered by then, the fallback model is asked for the rest of the time. Without it, or when the
   * client has no fallback, only the main model is used.
   */
  failoverAfterMs?: number
  /** called with the name of the model that actually produced the reply (the main model, or the fallback) */
  onModel?: (model: string) => void
}

export interface LlmClient {
  readonly model: string
  /** Returns the parsed JSON. Throws LlmError when the model cannot be reached, answers badly, or the budget is used up. */
  generateJson(req: JsonRequest): Promise<unknown>
}

export class LlmError extends Error {
  constructor(message: string, readonly kind: 'budget' | 'unavailable' | 'bad_reply' = 'unavailable') { super(message) }
}

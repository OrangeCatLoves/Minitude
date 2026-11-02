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
}

export interface LlmClient {
  readonly model: string
  /** Returns the parsed JSON. Throws LlmError when the model cannot be reached, answers badly, or the budget is used up. */
  generateJson(req: JsonRequest): Promise<unknown>
}

export class LlmError extends Error {
  constructor(message: string, readonly kind: 'budget' | 'unavailable' | 'bad_reply' = 'unavailable') { super(message) }
}

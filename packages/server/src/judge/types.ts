import type { AnswerResponse } from '@minitude/core'
import type { QuestionHead } from '../questions'

/** how the result was reached: from a stored decision, a local typo match, the language model, or not at all */
export type Via = 'stored' | 'typo' | 'llm' | 'none'

export interface JudgeOutcome {
  res: AnswerResponse
  via: Via
}

export interface Judge {
  /** 'mock' = no language model: only answers already in the database count; 'llm' = unknown answers go to the model */
  readonly kind: 'mock' | 'llm'
  judge(question: QuestionHead, text: string): Promise<JudgeOutcome>
}

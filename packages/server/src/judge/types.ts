import type { AnswerResponse } from '@minitude/core'
import type { QuestionHead } from '../questions'

/** how the result was reached: from a stored decision, a local typo match, the language model, or not at all */
export type Via = 'stored' | 'typo' | 'llm' | 'none'

export interface JudgeOutcome {
  res: AnswerResponse
  via: Via
}

/**
 * ask       (the default) a misspelling or other name of a known answer is NOT accepted on the spot: the reply is status 'confirm',
 *           "did you mean X?", and nothing is scored or remembered.
 * confirmed the player said yes to that question: accept the answer and remember the spelling.
 * literal   the player said no, "I meant what I typed": judge the text as an answer in its own right, never as a correction.
 */
export type JudgeMode = 'ask' | 'confirmed' | 'literal'

export interface Judge {
  /** 'mock' = no language model: only answers already in the database count; 'llm' = unknown answers go to the model */
  readonly kind: 'mock' | 'llm'
  judge(question: QuestionHead, text: string, mode?: JudgeMode): Promise<JudgeOutcome>
}

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

export interface AnswerEntry {
  /** the answer as it should be shown */
  name: string
  /** 0..5 = Common..Mythic. These tiers are the seed bank's own estimates of how unfamiliar an answer is (see README). */
  tier: number
  desc?: string
  aliases?: string[]
  /** a person should check this answer (set by the question generator's audit) */
  review?: boolean
  /** why (for the reviewer) */
  note?: string
}

export interface RejectEntry {
  names: string[]
  message: string
}

export interface QuestionRecord {
  id: string
  category: string
  prompt: string
  /** what counts as a valid answer (shown to the judge and to future editors; never to the player) */
  rules: string
  answers: AnswerEntry[]
  rejects?: RejectEntry[]
}

/** The parts of a question the game needs to run it (answers live in the database). */
export interface QuestionHead {
  id: string
  category: string
  prompt: string
  rules: string
}

export interface QuestionBank {
  version: string
  note: string
  categories: string[]
  questions: QuestionRecord[]
}

export function loadBank(path?: string): QuestionBank {
  const p = path ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'questions.seed.json')
  return JSON.parse(readFileSync(p, 'utf8')) as QuestionBank
}

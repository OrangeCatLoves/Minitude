/** The shapes shared by the server and the browser. */

export interface Question {
  id: string
  category: string
  prompt: string
}

export type RunMode = 'solo' | 'daily'

export interface StartRunResponse {
  runId: string
  /** how many questions the run has. The prompts are NOT sent here: each one arrives when its question starts. */
  count: number
  /** seconds the player has per question (the game starts the clock only when the question is on screen) */
  seconds: number
  /** the answer checker in use: 'mock' (a fixed list of demo answers) or 'llm' */
  checker: 'mock' | 'llm'
  mode: RunMode
  /** daily runs only: the UTC day (YYYY-MM-DD) and its number */
  day?: string
  number?: number
}

/** The reply to "question `index` is on screen": its clock starts now, and this is the first time the player may see the prompt. */
export interface StartQuestionResponse {
  ok: true
  secondsLeft: number
  question: Question
}

export type AnswerStatus = 'valid' | 'invalid' | 'unresolved'

export interface AnswerResponse {
  status: AnswerStatus
  /** the canonical answer the text was matched to (shown in the result) */
  answer?: string
  /** short description of the answer (one line) */
  description?: string
  /** 0..5 for Common..Mythic (valid answers only) */
  tier?: number
  /** points for the tier (valid answers only) */
  points?: number
  /** a short reason when the answer is not valid or could not be checked */
  message?: string
}

// ------------------------------------------------------------------ the daily challenge
/** one finished question of a daily run, in order (a miss has no answer and no tier) */
export interface DailyResultItem {
  miss: boolean
  answer: string | null
  tier: number | null
  points: number
}

/** where a finished daily run stands among everyone who finished that day */
export interface DailyStandings {
  /** how many runs finished that day */
  players: number
  /** 1 = best; equal scores share a rank */
  rank: number
  /** how many scored strictly less */
  below: number
  /** the best total of the day */
  best: number
}

/**
 * 'new'     the guest has not played today's daily
 * 'playing' a run is open (in another tab, or it ended without being closed and will be closed soon)
 * 'done'    the guest has played: the result is included
 */
export type DailyStatus = 'new' | 'playing' | 'done'

export interface DailyState {
  /** UTC day, YYYY-MM-DD */
  day: string
  /** 1 on the first day the daily ran, 2 on the next, ... */
  number: number
  /** milliseconds until the daily changes (the next UTC midnight), as the server measured it when it replied */
  resetsInMs: number
  status: DailyStatus
  /** days in a row this browser has finished the daily (counting today only once it is finished) */
  streak: number
  /** status 'done' only */
  items?: DailyResultItem[]
  total?: number
  standings?: DailyStandings
}

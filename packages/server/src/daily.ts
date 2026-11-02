/**
 * Choosing the Daily Challenge set.
 *
 * Everyone gets the same seven questions on a UTC day. The set is chosen once (the first time anything asks for that day),
 * stored, and then never changes, so a restart or a new question in the bank cannot give two players different days.
 *
 * The choice is: questions that were used least recently first, at most one per category (mixed categories), the order of the
 * seven shuffled by the date. It uses no random numbers: the same bank and history always give the same set.
 */
import { createHash } from 'node:crypto'
import { RUN_LENGTH, utcDay } from '@minitude/core'
import type { QuestionHead } from './questions'
import type { Repo } from './db/repo'

/** a number from 0 to 2^32 that depends only on the text */
function hash(...parts: string[]): number {
  return createHash('sha256').update(parts.join('|')).digest().readUInt32BE(0)
}

/**
 * `lastUsed` maps a question id to the last day it was a daily question; a question that never was sorts first.
 * Returns [] when the bank has fewer than seven questions.
 */
export function pickDaily<T extends QuestionHead>(pool: readonly T[], day: string, lastUsed: ReadonlyMap<string, string>): T[] {
  if (pool.length < RUN_LENGTH) return []
  const sorted = [...pool].sort((a, b) => {
    const la = lastUsed.get(a.id) ?? '', lb = lastUsed.get(b.id) ?? ''
    if (la !== lb) return la < lb ? -1 : 1
    const ha = hash(day, 'pick', a.id), hb = hash(day, 'pick', b.id)
    return ha !== hb ? ha - hb : a.id < b.id ? -1 : 1
  })
  const seen = new Set<string>()
  const picked: T[] = []
  for (const q of sorted) {
    if (picked.length === RUN_LENGTH) break
    if (seen.has(q.category)) continue
    seen.add(q.category)
    picked.push(q)
  }
  // fewer than seven categories: fill up with the least recently used of the rest
  for (const q of sorted) {
    if (picked.length === RUN_LENGTH) break
    if (!picked.includes(q)) picked.push(q)
  }
  return picked.sort((a, b) => hash(day, 'order', a.id) - hash(day, 'order', b.id))
}

export interface DailySet {
  day: string
  questions: QuestionHead[]
  /** true when this call created it */
  created: boolean
}

/**
 * The set for a day: the stored one, or a newly chosen one that is stored now.
 * Returns null when the bank has too few approved questions and no set was stored.
 * The first set made for today (or an earlier day) fixes "daily #1" for ever.
 */
export function ensureDailySet(repo: Repo, day: string, now: number): DailySet | null {
  const stored = repo.dailySet(day)
  if (stored) return { day, questions: stored, created: false }
  const picked = pickDaily(repo.approvedHeads(), day, repo.lastDailyUse())
  if (picked.length < RUN_LENGTH) return null
  const created = repo.insertDailySet(day, picked.map((q) => q.id), now)
  if (created && day <= utcDay(now)) repo.setMetaOnce('daily_epoch', day)
  return { day, questions: repo.dailySet(day)!, created }
}

/** the day the daily started (daily #1); before anything was played it is `today` */
export function epochDay(repo: Repo, today: string): string {
  return repo.getMeta('daily_epoch') ?? today
}

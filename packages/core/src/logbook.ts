/**
 * The player's own record on this device (the "logbook" under the end-of-run report). There are no accounts, so it lives in the
 * browser's storage only and the server never sees it. Pure maths: the browser reads and writes the storage.
 */
import { streakOf } from './daily'

export interface Logbook {
  /** runs finished (solo, daily and multiplayer) */
  played: number
  /** every run's points added up (for the average) */
  sum: number
  /** the best run, in points */
  best: number
  /** the UTC days on which at least one run was finished: the most recent ones, oldest first */
  days: string[]
}

export interface LogbookStats {
  /** days in a row on which a run was finished, ending today, or yesterday while today is still open */
  streak: number
  played: number
  /** average points per run, rounded */
  avg: number
  best: number
}

/** days kept: enough for any streak a person could have, small enough to stay tiny */
export const LOGBOOK_DAYS = 400

export const emptyLogbook = (): Logbook => ({ played: 0, sum: 0, best: 0, days: [] })

/** a finished run: `points` is its total, `today` the UTC day ('YYYY-MM-DD') it was finished on. Returns a new logbook. */
export function recordRun(log: Logbook, points: number, today: string): Logbook {
  const p = Number.isFinite(points) ? Math.max(0, Math.round(points)) : 0
  const days = log.days.includes(today) ? log.days.slice() : [...log.days, today].sort()
  return {
    played: log.played + 1,
    sum: log.sum + p,
    best: Math.max(log.best, p),
    days: days.slice(-LOGBOOK_DAYS),
  }
}

export function logbookStats(log: Logbook, today: string): LogbookStats {
  return {
    streak: streakOf(log.days, today),
    played: log.played,
    avg: log.played > 0 ? Math.round(log.sum / log.played) : 0,
    best: log.best,
  }
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

/** Reads what storage gave back. Storage can hold anything (an old version, a hand edit), so nothing is trusted: bad parts are dropped. */
export function parseLogbook(raw: string | null | undefined): Logbook {
  if (!raw) return emptyLogbook()
  let v: unknown
  try { v = JSON.parse(raw) } catch { return emptyLogbook() }
  if (!v || typeof v !== 'object') return emptyLogbook()
  const o = v as Record<string, unknown>
  const count = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0)
  const days = Array.isArray(o.days) ? [...new Set(o.days.filter((d): d is string => typeof d === 'string' && DAY_RE.test(d) && !Number.isNaN(Date.parse(d))))].sort().slice(-LOGBOOK_DAYS) : []
  const played = count(o.played)
  // an average needs a sum that can belong to that many runs; a damaged record starts again rather than show nonsense
  const sum = count(o.sum)
  const best = count(o.best)
  if (played === 0 || best > sum) return emptyLogbook()
  return { played, sum, best, days }
}

export const serializeLogbook = (log: Logbook): string => JSON.stringify(log)

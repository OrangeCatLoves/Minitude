/** Helpers for the Daily Challenge. The day always changes at 00:00 UTC (08:00 in Singapore), for everyone. */
import type { DailyStandings } from './types'

const DAY_MS = 86_400_000

/** the UTC day, 'YYYY-MM-DD', that a time in milliseconds falls on */
export function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/** milliseconds from `ms` until the next 00:00 UTC */
export function msToReset(ms: number): number {
  const d = new Date(ms)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - ms
}

export function addDays(day: string, n: number): string {
  return utcDay(Date.parse(day) + n * DAY_MS)
}

/** the number shown to players: 1 on the epoch day, 2 the day after, ... (days with no players still count) */
export function dayNumber(epochDay: string, day: string): number {
  return Math.round((Date.parse(day) - Date.parse(epochDay)) / DAY_MS) + 1
}

/**
 * Days in a row, ending today if today is finished, otherwise ending yesterday (the streak is still alive until the day ends).
 * `finishedDays` is every day this guest finished, in any order.
 */
export function streakOf(finishedDays: readonly string[], today: string): number {
  const have = new Set(finishedDays)
  let d = have.has(today) ? today : addDays(today, -1)
  let n = 0
  while (have.has(d)) { n++; d = addDays(d, -1) }
  return n
}

/** 'HH:MM:SS' (hours may pass 24 only if given more than a day) */
export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`
}

/** a percentage is shown only when enough people have played for it to mean something */
export const MIN_PLAYERS_FOR_PERCENT = 10

/** share of the day's players this run beat (rounded down) */
export function percentBeaten(s: DailyStandings): number {
  return s.players <= 0 ? 0 : Math.floor((100 * s.below) / s.players)
}

/** the lines shown under a finished daily run */
export function standingsLines(s: DailyStandings): string[] {
  if (s.players < MIN_PLAYERS_FOR_PERCENT) return [s.players === 1 ? 'YOU ARE THE FIRST TODAY' : `${s.players} PLAYERS SO FAR`]
  return [`RANK ${s.rank} OF ${s.players}`, `BETTER THAN ${percentBeaten(s)}% OF PLAYERS`]
}

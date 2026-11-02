import { RUN_LENGTH, TIERS } from './tiers'
import { PLANCK_POINTS, VOID_START_POINTS, isInVoid, pointsToU, uToSlot, PLANCK_SLOT } from './scoring'

/** What one answered question did to the run. `miss` = the time ran out without a valid answer (0 points, no shrink). */
export interface RunRecord {
  i: number
  miss: boolean
  tier: number
  points: number
  /** total points before / after this answer (not capped: points above 440 still count) */
  c0: number
  c1: number
  /** depth in powers of ten before / after */
  u0: number
  u1: number
  /** picture slots before / after, and how many were crossed */
  z0: number
  z1: number
  dz: number
  /** this answer crossed 440 points: the Planck Foam finale */
  finale: boolean
  /** 1, 2, 3...: how many answers in a row have now ended inside the unexplored stretch (0 = this one did not) */
  voidStreak: number
  /** edging hint: 0 none, 1 "something is getting closer", 2 "it is very close" (from the 2nd landing in a row inside Unexplored) */
  hintLevel: 0 | 1 | 2
  /** 0 = normal; 1, 2 = the first / second answer made after the finale (the player is past the Planck length) */
  post: 0 | 1 | 2
}

/**
 * Build the record for the next answer from the records so far.
 * tier = 0..5, or null for a miss.
 */
export function nextRecord(prev: readonly RunRecord[], tier: number | null): RunRecord {
  const last = prev[prev.length - 1]
  const c0 = last ? last.c1 : 0
  const miss = tier === null
  const points = miss ? 0 : TIERS[tier!].points
  const c1 = c0 + points
  const u0 = pointsToU(c0), u1 = pointsToU(c1)
  const z0 = uToSlot(u0), z1 = uToSlot(u1)
  const finale = !miss && c0 < PLANCK_POINTS && c1 >= PLANCK_POINTS
  const prevStreak = last ? last.voidStreak : 0
  let voidStreak = 0
  if (miss) voidStreak = prevStreak
  else if (isInVoid(c1)) voidStreak = isInVoid(c0) ? prevStreak + 1 : 1
  const hintLevel: 0 | 1 | 2 = !miss && voidStreak >= 3 ? 2 : !miss && voidStreak === 2 ? 1 : 0
  let post: 0 | 1 | 2 = 0
  if (!miss && c0 >= PLANCK_POINTS) {
    const prevPost = prev.filter((r) => !r.miss && r.c0 >= PLANCK_POINTS).length
    post = Math.min(2, prevPost + 1) as 1 | 2
  }
  return { i: prev.length, miss, tier: miss ? -1 : tier!, points, c0, c1, u0, u1, z0, z1, dz: z1 - z0, finale, voidStreak, hintLevel, post }
}

export function totalPoints(recs: readonly RunRecord[]): number {
  return recs.length ? recs[recs.length - 1].c1 : 0
}

export function isPerfect(recs: readonly RunRecord[]): boolean {
  return recs.length === RUN_LENGTH && recs.every((r) => !r.miss && r.tier === 5)
}

/** Points still needed to reach Planck Foam (0 if already there). */
export function pointsToPlanck(total: number): number {
  return Math.max(0, PLANCK_POINTS - total)
}

export const FINALE_SLOT = PLANCK_SLOT
export const VOID_START = VOID_START_POINTS

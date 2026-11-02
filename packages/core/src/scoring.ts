/**
 * Points -> size -> world.
 *
 * Size is always 1.7 m divided by 10^u, where u is the "depth in powers of ten".
 *  - Worlds 1 to 20: u = points / 20 (every 20 points is 10x smaller). World n spans points 20(n-1) .. 20n - 1.
 *  - Unexplored (nothing measured): points 400 .. 439. It crosses 15 powers of ten (from 10^20 to 10^35) in 40 points,
 *    so u = 20 + (points - 400) * 15 / 40, i.e. 3 powers of ten every 8 points.
 *  - Planck Foam (world 21): from 440 points. u = 35, size 1.7 x 10^-35 m (the Planck length). Points above 440 still count for the score.
 *
 * The picture is a chain of 36 "slots", one per power of ten: slot j is drawn when floor(u) = j.
 * Slots 0..19 = worlds 1..20, slots 20..34 = the unexplored stretch (15 dark variants), slot 35 = Planck Foam.
 */
export const START_SIZE_M = 1.7
export const VOID_START_POINTS = 400
export const PLANCK_POINTS = 440
export const VOID_FIRST_SLOT = 20
export const VOID_LAST_SLOT = 34
export const PLANCK_SLOT = 35
export const SLOT_COUNT = 36
export const N_WORLDS = 21
/** powers of ten shrunk per point inside the unexplored stretch */
export const VOID_DECADES_PER_POINT = (PLANCK_SLOT - VOID_FIRST_SLOT) / (PLANCK_POINTS - VOID_START_POINTS)

export function pointsToU(points: number): number {
  if (points <= VOID_START_POINTS) return points / 20
  if (points >= PLANCK_POINTS) return PLANCK_SLOT
  return VOID_FIRST_SLOT + (points - VOID_START_POINTS) * VOID_DECADES_PER_POINT
}

/** the slot (picture) shown at rest at depth u */
export function uToSlot(u: number): number {
  return Math.max(0, Math.min(PLANCK_SLOT, Math.floor(u + 1e-9)))
}

export function sizeOfU(u: number): number {
  return START_SIZE_M * Math.pow(10, -u)
}

export type StageKind = 'world' | 'unexplored' | 'planck'
export interface Stage {
  slot: number
  kind: StageKind
  /** world number 1..21, or null inside the unexplored stretch */
  worldNo: number | null
}

export function isVoidSlot(slot: number): boolean {
  return slot >= VOID_FIRST_SLOT && slot <= VOID_LAST_SLOT
}

/** the world a slot belongs to for title cards: all unexplored slots are one place */
export function displaySlot(slot: number): number {
  return isVoidSlot(slot) ? VOID_FIRST_SLOT : slot
}

export function worldNoOfSlot(slot: number): number | null {
  if (isVoidSlot(slot)) return null
  return slot < VOID_FIRST_SLOT ? slot + 1 : N_WORLDS
}

export function stageOfPoints(points: number): Stage {
  const slot = uToSlot(pointsToU(points))
  return { slot, kind: slot === PLANCK_SLOT ? 'planck' : isVoidSlot(slot) ? 'unexplored' : 'world', worldNo: worldNoOfSlot(slot) }
}

export function isInVoid(points: number): boolean {
  return points >= VOID_START_POINTS && points < PLANCK_POINTS
}

/** how long a dive takes, in seconds (the camera moves at an even pace through the slots it crosses) */
export function diveSeconds(z0: number, z1: number): number {
  if (z1 === z0) return 1.9
  let cost = 0
  for (let s = z0 + 1; s <= z1; s++) cost += isVoidSlot(s) && s !== VOID_FIRST_SLOT ? 0.3 : 0.8
  return 1.5 + cost
}

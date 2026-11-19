/**
 * Achievements: fifteen small goals, kept on the player's own device only (there are no accounts, so the server never sees them), like the
 * gem cabinet. Pure maths: the browser reads and writes the storage.
 *
 *  - SEVEN "firsts": the first answer scored at each rarity (Common ... Mythic, then the SINGULARITY gem).
 *  - EIGHT "gem steps": how many DIFFERENT gems the cabinet holds (5, 10, 25, 50, 100, 250, 500, and every gem there is). A gem found
 *    again does not count twice, because the cabinet itself counts each question's gem once.
 *
 * They count in solo runs, the Daily and multiplayer (every place an answer is scored). The firsts cannot be worked out for answers
 * scored before this existed (the browser never stored them), so they are earned going forward; the gem steps are backfilled from the
 * cabinet, quietly, with the day the gem that reached the step was found.
 */
import { GEM_TIER } from './tiers'

export type AchGroup = 'firsts' | 'gems'

export interface Achievement {
  id: string
  group: AchGroup
  /** the rarity it is about (0 COMMON ... 6 SINGULARITY): colours its picture and banner */
  tier: number
  name: string
  text: string
  /** gem steps only: how many different gems, or 'all' for every gem in the game */
  goal?: number | 'all'
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'first-common', group: 'firsts', tier: 0, name: 'Down to Earth', text: 'Score your first Common answer.' },
  { id: 'first-uncommon', group: 'firsts', tier: 1, name: 'Off the Beaten Path', text: 'Score your first Uncommon answer.' },
  { id: 'first-rare', group: 'firsts', tier: 2, name: 'Rare Find', text: 'Score your first Rare answer.' },
  { id: 'first-exotic', group: 'firsts', tier: 3, name: 'Exotic Taste', text: 'Score your first Exotic answer.' },
  { id: 'first-legendary', group: 'firsts', tier: 4, name: 'Legend Has It', text: 'Score your first Legendary answer.' },
  { id: 'first-mythic', group: 'firsts', tier: 5, name: 'Almost Nobody', text: 'Score your first Mythic answer.' },
  { id: 'first-singularity', group: 'firsts', tier: GEM_TIER, name: 'Singularity', text: 'Find your first hidden gem.' },
  { id: 'gems-5', group: 'gems', tier: GEM_TIER, goal: 5, name: 'Pocketful', text: 'Find 5 different gems.' },
  { id: 'gems-10', group: 'gems', tier: GEM_TIER, goal: 10, name: 'Collector', text: 'Find 10 different gems.' },
  { id: 'gems-25', group: 'gems', tier: GEM_TIER, goal: 25, name: 'Curator', text: 'Find 25 different gems.' },
  { id: 'gems-50', group: 'gems', tier: GEM_TIER, goal: 50, name: 'Gem Warden', text: 'Find 50 different gems.' },
  { id: 'gems-100', group: 'gems', tier: GEM_TIER, goal: 100, name: 'A Hundred Gems', text: 'Find 100 different gems.' },
  { id: 'gems-250', group: 'gems', tier: GEM_TIER, goal: 250, name: 'The Vault', text: 'Find 250 different gems.' },
  { id: 'gems-500', group: 'gems', tier: GEM_TIER, goal: 500, name: 'Five Hundred Strong', text: 'Find 500 different gems.' },
  { id: 'gems-all', group: 'gems', tier: GEM_TIER, goal: 'all', name: 'Singularity Complete', text: 'Find every gem in the game.' },
]

const BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]))
export const achievementById = (id: string): Achievement | undefined => BY_ID.get(id)
/** the "first" achievement of a rarity (null for a number that is not a rarity) */
export const firstOfTier = (tier: number): Achievement | null => ACHIEVEMENTS.find((a) => a.group === 'firsts' && a.tier === tier) ?? null

/** which achievements the player has, and the UTC day each was earned (YYYY-MM-DD, '' when it is not known) */
export interface AchState {
  earned: Record<string, string>
}

export const emptyAch = (): AchState => ({ earned: {} })
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/
const goodDay = (d: unknown): string => (typeof d === 'string' && DAY_RE.test(d) && !Number.isNaN(Date.parse(d)) ? d : '')

/** Reads what storage gave back. Storage can hold anything (an old version, a hand edit), so nothing is trusted: unknown ids are dropped. */
export function parseAch(raw: string | null | undefined): AchState {
  if (!raw) return emptyAch()
  let v: unknown
  try { v = JSON.parse(raw) } catch { return emptyAch() }
  if (!v || typeof v !== 'object') return emptyAch()
  const e = (v as { earned?: unknown }).earned
  if (!e || typeof e !== 'object' || Array.isArray(e)) return emptyAch()
  const earned: Record<string, string> = {}
  for (const [id, day] of Object.entries(e as Record<string, unknown>)) if (BY_ID.has(id)) earned[id] = goodDay(day)
  return { earned }
}
export const serializeAch = (s: AchState): string => JSON.stringify(s)
export const hasAch = (s: AchState, id: string): boolean => Object.prototype.hasOwnProperty.call(s.earned, id)

/** a copy of the state with these earned (those already earned keep their day) */
function grant(s: AchState, list: Achievement[], day: string): AchState {
  const earned = { ...s.earned }
  for (const a of list) if (!hasAch({ earned }, a.id)) earned[a.id] = goodDay(day)
  return { earned }
}

/** the gem steps a cabinet of `found` gems has reached; `total` is how many gems the game has IF THE SERVER SAID SO (null = not known yet: "every gem" waits) */
function stepsReached(found: number, total: number | null): Achievement[] {
  return ACHIEVEMENTS.filter((a) => {
    if (a.group !== 'gems') return false
    if (a.goal === 'all') return total !== null && total > 0 && found >= total
    return typeof a.goal === 'number' && found >= a.goal
  })
}

export interface AwardResult { state: AchState; fresh: Achievement[] }

/**
 * An answer was scored at `tier` (0 to 6). `gemsFound` is how many different gems the cabinet holds NOW (after this answer was added)
 * and `gemTotal` how many gems the game has, when known. Returns the new state and what was earned just now, in the order to show them:
 * the rarity first, then the gem steps.
 */
export function awardAnswer(s: AchState, tier: number, gemsFound: number, gemTotal: number | null, day: string): AwardResult {
  const want: Achievement[] = []
  const first = Number.isInteger(tier) ? firstOfTier(tier) : null
  if (first) want.push(first)
  want.push(...stepsReached(gemsFound, gemTotal))
  const fresh = want.filter((a) => !hasAch(s, a.id))
  return { state: fresh.length ? grant(s, fresh, day) : s, fresh }
}

/**
 * Quietly records what the cabinet already proves (nothing is announced): the first gem, and every gem step reached, each dated with the day
 * of the gem that reached it. `gemDays` are the days the gems were found, in the order they were found.
 */
export function backfillFromCabinet(s: AchState, gemDays: readonly string[], gemTotal: number | null): AchState {
  let out = s
  const found = gemDays.length
  const dayOf = (n: number) => goodDay(gemDays[Math.max(0, Math.min(found - 1, n - 1))])
  if (found >= 1 && !hasAch(out, 'first-singularity')) out = grant(out, [BY_ID.get('first-singularity')!], dayOf(1))
  for (const a of stepsReached(found, gemTotal)) if (!hasAch(out, a.id)) out = grant(out, [a], dayOf(typeof a.goal === 'number' ? a.goal : found))
  return out
}

// ------------------------------------------------------------------ what the cabinet's achievements tab shows
export interface AchItem {
  a: Achievement
  earned: boolean
  /** the UTC day it was earned ('' when not known or not earned) */
  day: string
  /** gem steps not earned yet: how many gems the cabinet holds against the goal */
  progress: { have: number; goal: number } | null
}
export interface AchGroupView { id: AchGroup; title: string; items: AchItem[]; earned: number }
export interface AchView { earned: number; total: number; groups: AchGroupView[] }

export function achievementsView(s: AchState, gemsFound: number, gemTotal: number | null): AchView {
  const group = (id: AchGroup, title: string): AchGroupView => {
    const items = ACHIEVEMENTS.filter((a) => a.group === id).map((a): AchItem => {
      const earned = hasAch(s, a.id)
      const goal = a.goal === 'all' ? (gemTotal && gemTotal > 0 ? gemTotal : null) : typeof a.goal === 'number' ? a.goal : null
      return { a, earned, day: earned ? s.earned[a.id] : '', progress: !earned && goal ? { have: Math.min(gemsFound, goal), goal } : null }
    })
    return { id, title, items, earned: items.filter((i) => i.earned).length }
  }
  const groups = [group('firsts', 'Firsts · one for every rarity'), group('gems', 'Gem steps · how many different gems')]
  return { earned: groups.reduce((n, g) => n + g.earned, 0), total: ACHIEVEMENTS.length, groups }
}

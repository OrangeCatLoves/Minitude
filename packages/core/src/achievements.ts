/**
 * Achievements: forty-five small goals, kept on the player's own device only (there are no accounts, so the server never sees them), like the
 * gem cabinet. Pure maths: the browser reads and writes the storage.
 *
 *  - SEVEN "firsts": the first answer scored at each rarity (Common ... Mythic, then the SINGULARITY gem).
 *  - EIGHT "gem steps": how many DIFFERENT gems the cabinet holds (5, 10, 25, 50, 100, 250, 500, and every gem there is). A gem found
 *    again does not count twice, because the cabinet itself counts each question's gem once.
 *  - TWENTY-SIX more (approved by the owner on 22 Nov 2026 from drafts/draft-achievements/more.html): how far one run dives, runs played
 *    and how, moments during a question, the Daily and days in a row, multiplayer, and more about gems.
 *  - FOUR more (the owner picked them and their pictures on 22 Nov 2026 from drafts/draft-achievements/six.html): Full Spectrum, Explorer,
 *    Second Wind and Word of Mouth.
 *
 * They count in solo runs, the Daily and multiplayer (every place an answer is scored). The firsts cannot be worked out for answers
 * scored before this existed (the browser never stored them), so they are earned going forward; the gem steps are backfilled from the
 * cabinet, quietly, with the day the gem that reached the step was found.
 */
import { GEM_TIER, TIERS } from './tiers'

/** how many rarities there are (Common ... Mythic, and the gem): Full Spectrum needs one answer of each */
const TIER_COUNT = TIERS.length

export type AchGroup = 'firsts' | 'gems' | 'dive' | 'runs' | 'moments' | 'daily' | 'multi' | 'shelves'

export interface Achievement {
  id: string
  group: AchGroup
  /** the rarity it is about (0 COMMON ... 6 SINGULARITY): colours its picture and banner */
  tier: number
  name: string
  text: string
  /** a counted goal (gems, runs, days in a row, wins, gems in one run), or 'all' for every gem in the game */
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
  { id: 'gems-250', group: 'gems', tier: GEM_TIER, goal: 250, name: 'The Hoard', text: 'Find 250 different gems.' },
  { id: 'gems-500', group: 'gems', tier: GEM_TIER, goal: 500, name: 'Five Hundred Strong', text: 'Find 500 different gems.' },
  { id: 'gems-all', group: 'gems', tier: GEM_TIER, goal: 'all', name: 'Singularity Complete', text: 'Find every gem in the game.' },
  // the dive: how far one run goes (judged when the run ends, from its total)
  { id: 'uncharted', group: 'dive', tier: 2, name: 'Uncharted', text: 'Dive into the Unexplored: 600 points in a run.' },
  { id: 'so-close', group: 'dive', tier: 4, name: 'So Close', text: 'Finish a run less than 10 points short of Planck Foam.' },
  { id: 'planck', group: 'dive', tier: GEM_TIER, name: 'The Edge of Physics', text: 'Reach Planck Foam: 700 points in a run.' },
  { id: 'past-edge', group: 'dive', tier: GEM_TIER, name: 'Past the Edge', text: 'Finish a run 50 points past Planck Foam.' },
  // runs: how many (the logbook's count), and how
  { id: 'first-dive', group: 'runs', tier: 0, goal: 1, name: 'First Dive', text: 'Finish your first run.' },
  { id: 'ten-dives', group: 'runs', tier: 1, goal: 10, name: 'Getting Deeper', text: 'Finish 10 runs.' },
  { id: 'fifty-dives', group: 'runs', tier: 2, goal: 50, name: 'Deep Diver', text: 'Finish 50 runs.' },
  { id: 'hundred-dives', group: 'runs', tier: 3, goal: 100, name: 'Bottomless', text: 'Finish 100 runs.' },
  { id: 'clean', group: 'runs', tier: 1, name: 'Beat the Clock', text: 'Finish a run without a single time-out.' },
  { id: 'no-easy', group: 'runs', tier: 4, name: 'No Easy Answers', text: 'Finish a run with no Common answer.' },
  // moments during a question (judged when the answer is scored), and one for opening the screen of accepted answers
  { id: 'buzzer', group: 'moments', tier: 5, name: 'Buzzer Beater', text: 'Score an answer with under one second left.' },
  { id: 'quick-draw', group: 'moments', tier: 5, name: 'Quick Draw', text: 'Score an answer within 3 seconds of the question.' },
  { id: 'close-enough', group: 'moments', tier: 5, name: 'Close Enough', text: 'Say yes to a "Did you mean…?"' },
  { id: 'open-book', group: 'moments', tier: 3, name: 'Open Book', text: 'Read what counted on a finished run.' },
  // the Daily, and days in a row (the logbook's streak: a run of any kind finished on each day)
  { id: 'daily-debut', group: 'daily', tier: 4, name: 'Daily Debut', text: 'Finish your first Daily.' },
  { id: 'streak-3', group: 'daily', tier: 4, goal: 3, name: 'On a Roll', text: 'Finish a run 3 days in a row.' },
  { id: 'streak-7', group: 'daily', tier: 4, goal: 7, name: 'Full Week', text: 'Finish a run 7 days in a row.' },
  { id: 'streak-30', group: 'daily', tier: 4, goal: 30, name: 'Moon Cycle', text: 'Finish a run 30 days in a row.' },
  { id: 'streak-100', group: 'daily', tier: 4, goal: 100, name: 'Hundred Days', text: 'Finish a run 100 days in a row.' },
  // multiplayer (a match is not recorded on the server: judged in the browser from the final standings)
  { id: 'face-to-face', group: 'multi', tier: 3, name: 'Face to Face', text: 'Finish a multiplayer match.' },
  { id: 'room-champion', group: 'multi', tier: 3, name: 'Room Champion', text: 'Win a multiplayer match.' },
  { id: 'reigning', group: 'multi', tier: 3, goal: 10, name: 'Reigning Champion', text: 'Win 10 multiplayer matches.' },
  // more about gems
  { id: 'well-rounded', group: 'shelves', tier: GEM_TIER, name: 'Well Rounded', text: 'Find a gem in every category.' },
  { id: 'full-shelf', group: 'shelves', tier: GEM_TIER, name: 'Full Shelf', text: 'Find every gem of one category.' },
  { id: 'gem-hunter', group: 'shelves', tier: GEM_TIER, goal: 3, name: 'Gem Hunter', text: 'Find 3 gems in one run.' },
  { id: 'singularity-seven', group: 'shelves', tier: GEM_TIER, goal: 7, name: 'Singularity Seven', text: 'A gem in all 7 questions of one run.' },
  // four more (six.html, 22 Nov 2026): two about runs, two moments
  { id: 'full-spectrum', group: 'runs', tier: GEM_TIER, name: 'Full Spectrum', text: 'One answer of every rarity in a single run.' },
  { id: 'explorer', group: 'runs', tier: 3, name: 'Explorer', text: 'Score an answer in every category.' },
  { id: 'second-wind', group: 'moments', tier: 1, name: 'Second Wind', text: 'Score on a question after a wrong try.' },
  { id: 'word-of-mouth', group: 'moments', tier: 2, name: 'Word of Mouth', text: 'Share a result.' },
]

const BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]))
export const achievementById = (id: string): Achievement | undefined => BY_ID.get(id)
/** the "first" achievement of a rarity (null for a number that is not a rarity) */
export const firstOfTier = (tier: number): Achievement | null => ACHIEVEMENTS.find((a) => a.group === 'firsts' && a.tier === tier) ?? null

/**
 * Which achievements the player has, and the UTC day each was earned (YYYY-MM-DD, '' when it is not known). `wins` counts the multiplayer
 * matches this browser has won (for Reigning Champion; nothing else about a match is kept). It is left out while it is 0. `cats` are the
 * categories in which an answer has scored (for Explorer), left out while there are none.
 */
export interface AchState {
  earned: Record<string, string>
  wins?: number
  cats?: string[]
}

export const emptyAch = (): AchState => ({ earned: {} })
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/
const goodDay = (d: unknown): string => (typeof d === 'string' && DAY_RE.test(d) && !Number.isNaN(Date.parse(d)) ? d : '')
const count = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? Math.min(1e6, Math.floor(x)) : 0)
const winsOf = (s: AchState): number => count(s.wins)

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
  const wins = count((v as { wins?: unknown }).wins)
  const out: AchState = wins ? { earned, wins } : { earned }
  const rawCats = (v as { cats?: unknown }).cats
  if (Array.isArray(rawCats)) {
    const cats = [...new Set(rawCats.filter((c): c is string => typeof c === 'string' && c.length > 0 && c.length <= 60))].slice(0, MAX_CATS)
    if (cats.length) out.cats = cats
  }
  return out
}
/** categories kept for Explorer: far more than the game has (11), so a bigger bank fits, small enough to stay tiny */
const MAX_CATS = 50
/** a copy of the state with these categories added to those an answer has scored in (the same object when nothing is new) */
export function noteCategories(s: AchState, list: readonly string[]): AchState {
  const have = new Set(s.cats ?? [])
  const add = [...new Set(list.filter((c) => typeof c === 'string' && c.length > 0 && c.length <= 60 && !have.has(c)))]
  if (!add.length || have.size >= MAX_CATS) return s
  return { ...s, cats: [...have, ...add].slice(0, MAX_CATS) }
}
export const serializeAch = (s: AchState): string => JSON.stringify(s)
export const hasAch = (s: AchState, id: string): boolean => Object.prototype.hasOwnProperty.call(s.earned, id)

/** a copy of the state with these earned (those already earned keep their day) */
function grant(s: AchState, list: Achievement[], day: string): AchState {
  const earned = { ...s.earned }
  for (const a of list) if (!hasAch({ earned }, a.id)) earned[a.id] = goodDay(day)
  return { ...s, earned }
}
const byIds = (list: string[]): Achievement[] => list.map((id) => BY_ID.get(id)!)
const goalOf = (a: Achievement): number => (typeof a.goal === 'number' ? a.goal : 0)

/** the gem steps a cabinet of `found` gems has reached; `total` is how many gems the game has IF THE SERVER SAID SO (null = not known yet: "every gem" waits) */
function stepsReached(found: number, total: number | null): Achievement[] {
  return ACHIEVEMENTS.filter((a) => {
    if (a.group !== 'gems') return false
    if (a.goal === 'all') return total !== null && total > 0 && found >= total
    return typeof a.goal === 'number' && found >= a.goal
  })
}

// ------------------------------------------------------------------ what is kept on the device, as facts
/** one category of the cabinet: how many of its gems are found, and how many it holds (the server's counts) */
export interface Shelf { name: string; have: number; total: number }
/**
 * What the browser already keeps, as numbers. A field may be left out when it is not known; an achievement that needs it then waits.
 *  - gemsFound / gemTotal: different gems in the cabinet, and how many the game has IF THE SERVER SAID SO
 *  - runs: runs finished (the logbook); streak: the longest run of days in a row on record (the logbook's days)
 *  - shelves: the cabinet by category, only once the server's counts per category are known
 */
export interface AchFacts {
  gemsFound?: number
  gemTotal?: number | null
  runs?: number
  streak?: number
  shelves?: readonly Shelf[] | null
}

/** everything the facts prove, in the order to show it (gem steps, runs, days in a row, wins, shelves) */
function factsReached(s: AchState, f: AchFacts): Achievement[] {
  const out: Achievement[] = []
  if (typeof f.gemsFound === 'number') out.push(...stepsReached(f.gemsFound, f.gemTotal ?? null))
  const runs = count(f.runs), streak = count(f.streak), wins = winsOf(s)
  for (const a of ACHIEVEMENTS) {
    if (a.group === 'runs' && a.goal !== undefined && runs >= goalOf(a)) out.push(a)
    else if (a.group === 'daily' && a.goal !== undefined && streak >= goalOf(a)) out.push(a)
    else if (a.id === 'reigning' && wins >= goalOf(a)) out.push(a)
  }
  const shelves = (f.shelves ?? []).filter((c) => c.total > 0)
  if (shelves.length) {
    if (shelves.every((c) => c.have >= 1)) out.push(BY_ID.get('well-rounded')!)
    if (shelves.some((c) => c.have >= c.total)) out.push(BY_ID.get('full-shelf')!)
    // Explorer: an answer has scored in every category the server lists (the gem counts list every category: each question has a gem)
    const cats = new Set(s.cats ?? [])
    if (shelves.every((c) => cats.has(c.name))) out.push(BY_ID.get('explorer')!)
  }
  return out
}

export interface AwardResult { state: AchState; fresh: Achievement[] }
function award(s: AchState, want: Achievement[], day: string): AwardResult {
  const seen = new Set<string>()
  const fresh = want.filter((a) => {
    if (hasAch(s, a.id) || seen.has(a.id)) return false
    seen.add(a.id)
    return true
  })
  return { state: fresh.length ? grant(s, fresh, day) : s, fresh }
}

/** how an answer was given, for the moments: seconds left on the clock and seconds used when it was sent, and whether it was a "Did you mean…?" said yes to */
export interface AnswerMoment {
  secondsLeft?: number
  secondsUsed?: number
  confirmed?: boolean
  /** a try on the same question was turned down before (Second Wind) */
  afterWrongTry?: boolean
  /** the question's category (Explorer) */
  category?: string
}
/** Buzzer Beater: under this many seconds left; Quick Draw: sent within this many seconds */
export const BUZZER_SECONDS = 1
export const QUICK_SECONDS = 3

/**
 * An answer was scored at `tier` (0 to 6). `gemsFound` is how many different gems the cabinet holds NOW (after this answer was added)
 * and `gemTotal` how many gems the game has, when known. Returns the new state and what was earned just now, in the order to show them:
 * the rarity first, then the moments, then the gem steps and the shelves.
 */
export function awardAnswer(
  s: AchState, tier: number, gemsFound: number, gemTotal: number | null, day: string, moment: AnswerMoment = {}, shelves: readonly Shelf[] | null = null,
): AwardResult {
  const first = Number.isInteger(tier) ? firstOfTier(tier) : null
  if (!first) return { state: s, fresh: [] }
  const want: Achievement[] = [first]
  if (typeof moment.secondsLeft === 'number' && moment.secondsLeft >= 0 && moment.secondsLeft < BUZZER_SECONDS) want.push(BY_ID.get('buzzer')!)
  if (typeof moment.secondsUsed === 'number' && moment.secondsUsed >= 0 && moment.secondsUsed <= QUICK_SECONDS) want.push(BY_ID.get('quick-draw')!)
  if (moment.confirmed) want.push(BY_ID.get('close-enough')!)
  if (moment.afterWrongTry) want.push(BY_ID.get('second-wind')!)
  const base = moment.category ? noteCategories(s, [moment.category]) : s
  want.push(...factsReached(base, { gemsFound, gemTotal, shelves }))
  return award(base, want, day)
}

/** how a run ended: its mode, its total, each question's rarity (null for a time-out), and for a match whether this player came first (a tie counts) */
export interface RunEnd {
  mode: 'solo' | 'daily' | 'versus'
  total: number
  tiers: readonly (number | null)[]
  won?: boolean
}
/** the totals the dive achievements are about: the Unexplored starts at 600, Planck Foam at 700, and 750 is 50 past it */
export const DIVE_POINTS = { uncharted: 600, planck: 700, past: 750, close: 10 } as const

/**
 * A run has just ended (its report is opening). `facts` are what the logbook and the cabinet hold now, with this run already in the logbook.
 * A match won adds one to the wins kept for Reigning Champion. Returns what was earned, in the order to show it.
 */
export function awardRun(s: AchState, run: RunEnd, facts: AchFacts, day: string): AwardResult {
  const want: string[] = []
  const t = Number.isFinite(run.total) ? run.total : 0
  if (t >= DIVE_POINTS.uncharted) want.push('uncharted')
  if (t >= DIVE_POINTS.planck - DIVE_POINTS.close && t < DIVE_POINTS.planck) want.push('so-close')
  if (t >= DIVE_POINTS.planck) want.push('planck')
  if (t >= DIVE_POINTS.past) want.push('past-edge')
  const full = run.tiers.length >= 7
  const answered = run.tiers.filter((x): x is number => typeof x === 'number')
  const noMiss = full && answered.length === run.tiers.length
  if (noMiss) want.push('clean')
  if (noMiss && answered.every((x) => x >= 1)) want.push('no-easy')
  const gems = answered.filter((x) => x === GEM_TIER).length
  if (gems >= 3) want.push('gem-hunter')
  if (noMiss && gems === run.tiers.length) want.push('singularity-seven')
  // Full Spectrum: seven answers, seven different rarities (Common to Mythic, and a gem)
  if (noMiss && run.tiers.length === TIER_COUNT && new Set(answered.filter((x) => Number.isInteger(x) && x >= 0 && x < TIER_COUNT)).size === TIER_COUNT) want.push('full-spectrum')
  if (run.mode === 'daily') want.push('daily-debut')
  let base = s
  if (run.mode === 'versus') {
    want.push('face-to-face')
    if (run.won) { want.push('room-champion'); base = { ...s, wins: winsOf(s) + 1 } }
  }
  return award(base, [...byIds(want), ...factsReached(base, facts)], day)
}

/** something the player did that is not an answer or a run: opening the screen of everything that counted, or pressing SHARE */
export function awardEvent(s: AchState, id: 'open-book' | 'word-of-mouth', day: string): AwardResult {
  return award(s, byIds([id]), day)
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

/**
 * Quietly records what the logbook and the cabinet's categories already prove (runs played, days in a row, a gem in every category, a full
 * category). `streakDays` are the logbook's days: a streak goal is dated with the day it was reached. Runs and categories are not dated.
 * The gem steps are left to backfillFromCabinet (it knows each gem's day).
 */
export function backfillFacts(s: AchState, facts: AchFacts, streakDays: readonly string[] = []): AchState {
  let out = s
  const reachedOn = streakReachedOn(streakDays)
  for (const a of factsReached(s, { ...facts, gemsFound: undefined })) {
    if (hasAch(out, a.id)) continue
    out = grant(out, [a], a.group === 'daily' ? reachedOn(goalOf(a)) : '')
  }
  return out
}

// ------------------------------------------------------------------ days in a row
const DAY_MS = 86_400_000
const dayNum = (d: string): number => Math.round(Date.parse(d + 'T00:00:00Z') / DAY_MS)
const cleanDays = (days: readonly string[]): string[] => [...new Set(days.filter((d) => goodDay(d) !== ''))].sort()
/** the longest run of days in a row among these UTC days (any order, repeats allowed) */
export function longestStreak(days: readonly string[]): number {
  const d = cleanDays(days)
  let best = 0, run = 0
  for (let i = 0; i < d.length; i++) { run = i > 0 && dayNum(d[i]) === dayNum(d[i - 1]) + 1 ? run + 1 : 1; best = Math.max(best, run) }
  return best
}
/** the first day on which `n` days in a row were complete ('' if never) */
function streakReachedOn(days: readonly string[]): (n: number) => string {
  const d = cleanDays(days)
  return (n) => {
    let run = 0
    for (let i = 0; i < d.length; i++) {
      run = i > 0 && dayNum(d[i]) === dayNum(d[i - 1]) + 1 ? run + 1 : 1
      if (run >= n) return d[i]
    }
    return ''
  }
}

// ------------------------------------------------------------------ what the cabinet's achievements tab shows
export interface AchItem {
  a: Achievement
  earned: boolean
  /** the UTC day it was earned ('' when not known or not earned) */
  day: string
  /** a counted goal not earned yet: how far along it is, and what is counted ("gems", "runs", "days in a row", "wins", "categories") */
  progress: { have: number; goal: number; unit: string } | null
}
export interface AchGroupView { id: AchGroup; title: string; items: AchItem[]; earned: number }
export interface AchView { earned: number; total: number; groups: AchGroupView[] }

/** the groups in the order the tab lists them: the title in the tab and the word on the banner ('' = the rarity's name) */
export const ACH_GROUPS: readonly { id: AchGroup; title: string; label: string }[] = [
  { id: 'firsts', title: 'Firsts · one for every rarity', label: '' },
  { id: 'gems', title: 'Gem steps · how many different gems', label: 'GEMS' },
  { id: 'dive', title: 'The dive · how far one run goes', label: 'THE DIVE' },
  { id: 'runs', title: 'Runs · played, and how', label: 'RUNS' },
  { id: 'moments', title: 'Moments · during a question', label: 'MOMENTS' },
  { id: 'daily', title: 'The Daily · and days in a row', label: 'DAILY' },
  { id: 'multi', title: 'Multiplayer · rooms of two to four', label: 'MULTIPLAYER' },
  { id: 'shelves', title: 'More about gems', label: 'GEMS' },
]

/** `facts` are what the browser keeps (see AchFacts): they give the progress of the counted goals */
export function achievementsView(s: AchState, gemsFound: number, gemTotal: number | null, facts: AchFacts = {}): AchView {
  const shelves = (facts.shelves ?? []).filter((c) => c.total > 0)
  const progressOf = (a: Achievement): AchItem['progress'] => {
    if (a.group === 'gems') {
      const goal = a.goal === 'all' ? (gemTotal && gemTotal > 0 ? gemTotal : null) : goalOf(a) || null
      return goal ? { have: Math.min(gemsFound, goal), goal, unit: 'gems' } : null
    }
    const at = (have: number | undefined, unit: string) => (typeof have === 'number' ? { have: Math.min(count(have), goalOf(a)), goal: goalOf(a), unit } : null)
    if (a.group === 'runs' && a.goal) return at(facts.runs, 'runs')
    if (a.group === 'daily' && a.goal) return at(facts.streak, 'days in a row')
    if (a.id === 'reigning') return at(winsOf(s), 'wins')
    if (a.id === 'well-rounded' && shelves.length) return { have: shelves.filter((c) => c.have >= 1).length, goal: shelves.length, unit: 'categories' }
    if (a.id === 'explorer' && shelves.length) { const cats = new Set(s.cats ?? []); return { have: shelves.filter((c) => cats.has(c.name)).length, goal: shelves.length, unit: 'categories' } }
    if (a.id === 'full-shelf' && shelves.length) {
      const best = shelves.reduce((m, c) => (c.have / c.total > m.have / m.total ? c : m))
      return { have: Math.min(best.have, best.total), goal: best.total, unit: `gems of ${best.name}` }
    }
    return null
  }
  const groups = ACH_GROUPS.map(({ id, title }): AchGroupView => {
    const items = ACHIEVEMENTS.filter((a) => a.group === id).map((a): AchItem => {
      const earned = hasAch(s, a.id)
      return { a, earned, day: earned ? s.earned[a.id] : '', progress: earned ? null : progressOf(a) }
    })
    return { id, title, items, earned: items.filter((i) => i.earned).length }
  })
  return { earned: groups.reduce((n, g) => n + g.earned, 0), total: ACHIEVEMENTS.length, groups }
}

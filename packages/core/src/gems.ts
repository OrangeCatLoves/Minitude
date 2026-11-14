/**
 * The gem cabinet: every gem (SINGULARITY answer) a player has found, kept on their own device (there are no accounts, so the server
 * never sees it). Pure maths: the browser reads and writes the storage, like the logbook.
 *
 * A found gem stores what the player was shown when they found it (the question's category and prompt, the answer and its one-line
 * description). Slots that are not found yet are only counted, never described: the prompts of questions are not sent to the browser
 * before their question starts, so the cabinet knows only how many gems each category holds.
 */

export interface GemEntry {
  /** the question's id: one gem per question, so this is also the gem's id */
  id: string
  category: string
  prompt: string
  answer: string
  /** one line about the answer */
  desc: string
  /** the UTC day it was found, YYYY-MM-DD */
  day: string
}

export interface Cabinet {
  /** in the order they were found */
  gems: GemEntry[]
}

/** what the server says about the cabinet as a whole (no prompts, no answers) */
export interface GemSummary {
  total: number
  categories: { name: string; total: number }[]
}

export const emptyCabinet = (): Cabinet => ({ gems: [] })

/** more than any bank will ever have; a damaged or hand-edited store cannot grow without limit */
export const CABINET_MAX = 2000

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/
const str = (x: unknown, max: number): string | null => (typeof x === 'string' && x.trim() ? x.trim().slice(0, max) : null)

/** a gem found just now. `isNew` is false when the gem was already in the cabinet (the same question's gem found again). Returns a new cabinet. */
export function addGem(cab: Cabinet, e: GemEntry): { cabinet: Cabinet; isNew: boolean } {
  if (cab.gems.some((g) => g.id === e.id) || cab.gems.length >= CABINET_MAX) return { cabinet: cab, isNew: false }
  return { cabinet: { gems: [...cab.gems, e] }, isNew: true }
}

export const hasGem = (cab: Cabinet, id: string): boolean => cab.gems.some((g) => g.id === id)

/** Reads what storage gave back. Storage can hold anything (an old version, a hand edit), so nothing is trusted: bad entries are dropped. */
export function parseCabinet(raw: string | null | undefined): Cabinet {
  if (!raw) return emptyCabinet()
  let v: unknown
  try { v = JSON.parse(raw) } catch { return emptyCabinet() }
  if (!v || typeof v !== 'object' || !Array.isArray((v as { gems?: unknown }).gems)) return emptyCabinet()
  const seen = new Set<string>()
  const gems: GemEntry[] = []
  for (const x of (v as { gems: unknown[] }).gems) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    const id = str(o.id, 80), category = str(o.category, 60), prompt = str(o.prompt, 240), answer = str(o.answer, 160)
    if (!id || !category || !prompt || !answer || seen.has(id)) continue
    const desc = typeof o.desc === 'string' ? o.desc.trim().slice(0, 400) : ''
    const day = typeof o.day === 'string' && DAY_RE.test(o.day) && !Number.isNaN(Date.parse(o.day)) ? o.day : ''
    seen.add(id)
    gems.push({ id, category, prompt, answer, desc, day })
    if (gems.length >= CABINET_MAX) break
  }
  return { gems }
}

export const serializeCabinet = (cab: Cabinet): string => JSON.stringify(cab)

export interface CabinetCategory {
  name: string
  /** gems this category holds in all */
  total: number
  /** found, in the order they were found */
  found: GemEntry[]
  /** how many are still hidden (never below 0, even if the summary is out of date) */
  locked: number
}
export interface CabinetView {
  found: number
  total: number
  categories: CabinetCategory[]
}

/** The cabinet laid out by category. A found gem whose category the summary does not list (an older or newer bank) gets a category of its own, so nothing is lost. */
export function cabinetView(cab: Cabinet, summary: GemSummary | null): CabinetView {
  const cats: CabinetCategory[] = (summary?.categories ?? []).map((c) => ({ name: c.name, total: c.total, found: [], locked: c.total }))
  const by = new Map(cats.map((c) => [c.name, c]))
  for (const g of cab.gems) {
    let c = by.get(g.category)
    if (!c) { c = { name: g.category, total: 0, found: [], locked: 0 }; by.set(g.category, c); cats.push(c) }
    c.found.push(g)
  }
  for (const c of cats) { c.total = Math.max(c.total, c.found.length); c.locked = Math.max(0, c.total - c.found.length) }
  return { found: cab.gems.length, total: Math.max(summary?.total ?? 0, cab.gems.length), categories: cats }
}

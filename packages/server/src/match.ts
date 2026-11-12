import type { AnswerEntry, QuestionRecord } from './questions'
import { editDistance, looseKey, normalize, typoBudget } from './normalize'

/**
 * `one`        the nearest known form. distance 0 with `loose: true` means "the same answer written another way" (a hyphen, British
 *              spelling, a Roman numeral ...): that is not a misspelling, so it is accepted without asking.
 * `ambiguous`  two different answers are equally near: never guessed between.
 */
export type Fuzzy = { kind: 'one'; canon: string; distance: number; loose?: boolean } | { kind: 'ambiguous'; canons: string[] } | null

/**
 * Slips between what was typed and a known form. A wrong FIRST letter counts as two slips, because people rarely get the first
 * letter wrong (search engines treat it the same way). With thousands of names on a list this keeps a short unknown answer from
 * being "corrected" into some unrelated name that merely starts with a different letter.
 */
function slips(a: string, b: string, budget: number): number {
  const d = editDistance(a, b, budget)
  if (d > budget) return d
  return a[0] !== b[0] ? Math.min(d + 1, budget + 1) : d
}

/**
 * Find the known form closest to `norm`.
 * `forms` maps every known normalised form (a canonical name, an alias, a learned spelling) to the canonical answer it means, so the
 * aliases are matched too, not only the answers' own names.
 *
 *   1. The same answer written another way (see looseKey): accepted as is.
 *   2. Otherwise the fewest slips, within the typo budget (typoBudget in normalize.ts; a swapped pair of letters is one slip).
 *      Two different answers at the same distance are "ambiguous": we never guess between them.
 */
export function fuzzyFind(norm: string, forms: Map<string, string>): Fuzzy {
  if (!norm) return null
  const nl = looseKey(norm)
  const same = new Set<string>()
  for (const [form, canon] of forms) if (form !== norm && looseKey(form) === nl) same.add(canon)
  if (same.size === 1) return { kind: 'one', canon: [...same][0], distance: 0, loose: true }
  if (same.size > 1) return { kind: 'ambiguous', canons: [...same] }

  const budget = typoBudget(norm.length)
  if (budget === 0) return null
  let best: string | null = null
  let bestD = budget + 1
  let tied: string[] = []
  for (const [form, canon] of forms) {
    // compared as written, and as the loose keys (so "wing back" is also one slip from "wingbak")
    const lf = looseKey(form)
    const d = Math.min(slips(norm, form, budget), slips(nl, lf, budget))
    if (d > budget) continue
    if (d < bestD) { best = canon; bestD = d; tied = [canon] }
    else if (d === bestD && best !== canon && !tied.includes(canon)) tied.push(canon)
  }
  if (best === null) return null
  return tied.length > 1 ? { kind: 'ambiguous', canons: tied } : { kind: 'one', canon: best, distance: bestD }
}

/**
 * Look a typed answer up in a question written as JSON (the seed bank format): exact, alias, then one unambiguous near-miss.
 * Used by the bank tests and the importer's self-checks; the running game looks answers up in the database instead.
 */
export function lookup(q: QuestionRecord, text: string): AnswerEntry | 'ambiguous' | null {
  const n = normalize(text)
  if (!n) return null
  const forms = new Map<string, string>()
  const byCanon = new Map<string, AnswerEntry>()
  for (const a of q.answers) {
    const c = normalize(a.name)
    byCanon.set(c, a)
    forms.set(c, c)
    for (const al of a.aliases ?? []) forms.set(normalize(al), c)
  }
  const exact = forms.get(n)
  if (exact) return byCanon.get(exact)!
  const f = fuzzyFind(n, forms)
  if (!f) return null
  return f.kind === 'ambiguous' ? 'ambiguous' : byCanon.get(f.canon)!
}

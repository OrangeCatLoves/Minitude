import type { AnswerEntry, QuestionRecord } from './questions'
import { levenshtein, normalize, typoBudget } from './normalize'

export type Fuzzy = { kind: 'one'; canon: string; distance: number } | { kind: 'ambiguous'; canons: string[] } | null

/**
 * Find the known form closest to `norm`, within the typo budget (none for 4 letters or fewer, one up to 8, two beyond).
 * `forms` maps every known normalised form (a canonical name, an alias, a learned spelling) to the canonical answer it means.
 * Two different answers at the same distance are "ambiguous": we never guess between them.
 */
export function fuzzyFind(norm: string, forms: Map<string, string>): Fuzzy {
  const budget = typoBudget(norm.length)
  if (!norm || budget === 0) return null
  let best: string | null = null
  let bestD = budget + 1
  let tied: string[] = []
  for (const [form, canon] of forms) {
    if (Math.abs(form.length - norm.length) > budget) continue
    const d = levenshtein(norm, form)
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

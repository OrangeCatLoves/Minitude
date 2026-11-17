import { editDistance, looseKey, typoBudget } from '../normalize'

/**
 * Two written forms that mean DIFFERENT answers but sit within a slip of each other. Those are where "weird matches" come from:
 * an alias one letter off an unrelated phrase ("sea donkey" / "sea monkey") can turn a guess into
 * something the player did not expect. Here the player is always asked before a slip counts, but a close pair still makes a
 * correction ambiguous (two answers fit), so it is worth a look.
 */
export interface Near { a: string; b: string; canonA: string; canonB: string; distance: number }

export function nearForms(forms: Map<string, string>, limit = 200): Near[] {
  const byLen = new Map<number, string[]>()
  for (const f of forms.keys()) {
    const k = f.length
    const arr = byLen.get(k) ?? []
    arr.push(f)
    byLen.set(k, arr)
  }
  const out: Near[] = []
  const loose = new Map<string, string>()
  for (const f of forms.keys()) loose.set(f, looseKey(f))
  for (const [len, list] of byLen) {
    const budget = typoBudget(len)
    if (budget === 0) continue
    for (let l2 = len; l2 <= len + budget; l2++) {
      const other = byLen.get(l2)
      if (!other) continue
      for (let i = 0; i < list.length; i++) {
        for (let j = l2 === len ? i + 1 : 0; j < other.length; j++) {
          const a = list[i], b = other[j]
          if (forms.get(a) === forms.get(b)) continue // the same answer: harmless
          const d = Math.min(editDistance(a, b, budget), editDistance(loose.get(a)!, loose.get(b)!, budget))
          if (d <= budget) out.push({ a, b, canonA: forms.get(a)!, canonB: forms.get(b)!, distance: d })
        }
      }
    }
  }
  return out.sort((x, y) => x.distance - y.distance || x.a.localeCompare(y.a)).slice(0, limit)
}

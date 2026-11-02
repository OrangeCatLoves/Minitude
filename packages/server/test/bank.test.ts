import { describe, expect, it } from 'vitest'
import { loadBank } from '../src/questions'
import { normalize } from '../src/normalize'
import { lookup } from '../src/match'

const bank = loadBank()

describe('seed bank', () => {
  it('has at least seven questions from seven different categories', () => {
    expect(new Set(bank.questions.map((q) => q.category)).size).toBeGreaterThanOrEqual(7)
  })
  it('every question has answers in every tier', () => {
    for (const q of bank.questions) {
      const tiers = new Set(q.answers.map((a) => a.tier))
      expect([...tiers].sort().join(), q.id).toBe('0,1,2,3,4,5')
    }
  })
  it('no alias points to two different answers, and no reject is also an answer', () => {
    for (const q of bank.questions) {
      const seen = new Map<string, string>()
      for (const a of q.answers) {
        for (const n of [a.name, ...(a.aliases ?? [])]) {
          const k = normalize(n)
          if (seen.has(k) && seen.get(k) !== a.name) throw new Error(`${q.id}: "${n}" is claimed by ${seen.get(k)} and ${a.name}`)
          seen.set(k, a.name)
        }
      }
      for (const r of q.rejects ?? []) for (const n of r.names) expect(seen.has(normalize(n)), `${q.id}: reject "${n}" is also an answer`).toBe(false)
    }
  })
  it('every listed answer resolves to itself', () => {
    for (const q of bank.questions) for (const a of q.answers) expect((lookup(q, a.name) as any)?.name, `${q.id}: ${a.name}`).toBe(a.name)
  })
})

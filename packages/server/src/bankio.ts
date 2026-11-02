import type { Repo, QStatus } from './db/repo'
import { normalize } from './normalize'
import type { QuestionBank, QuestionRecord } from './questions'

export interface ImportOptions {
  status: QStatus
  /** questions.source: 'seed' | 'llm' | 'import' */
  source: string
  /** answers.source: 'seed' | 'draft' */
  answerSource: string
  model?: string | null
  notes?: string | null
  at: number
}

/** Writes one question with its answers, aliases and "does not count" list. Returns false if the id already exists (nothing is changed then). */
export function importQuestion(repo: Repo, q: QuestionRecord, o: ImportOptions): boolean {
  return repo.tx(() => {
    const made = repo.insertQuestion({ id: q.id, category: q.category, prompt: q.prompt, rules: q.rules, status: o.status, source: o.source, model: o.model, notes: o.notes, at: o.at })
    if (!made) return false
    const canon = new Set<string>()
    for (const a of q.answers) {
      const norm = normalize(a.name)
      if (!norm || canon.has(norm)) continue
      canon.add(norm)
      repo.insertAnswer({ questionId: q.id, norm, name: a.name, tier: a.tier, description: a.desc ?? null, source: o.answerSource, model: o.model, at: o.at, review: !!a.review, note: a.note ?? null })
    }
    for (const a of q.answers) {
      const c = normalize(a.name)
      for (const al of a.aliases ?? []) {
        const n = normalize(al)
        if (n && n !== c && !canon.has(n)) repo.insertSpelling({ questionId: q.id, norm: n, verdict: 'valid', canonNorm: c, source: 'alias', at: o.at })
      }
    }
    for (const r of q.rejects ?? []) {
      for (const name of r.names) {
        const n = normalize(name)
        if (n && !canon.has(n)) repo.insertSpelling({ questionId: q.id, norm: n, verdict: 'invalid', message: r.message, source: 'seed', at: o.at })
      }
    }
    return true
  })
}

/** Imports every question of a bank file that is not in the database yet. Returns how many were added. */
export function importBank(repo: Repo, bank: QuestionBank, o: ImportOptions): number {
  let n = 0
  for (const q of bank.questions) if (importQuestion(repo, q, o)) n++
  return n
}

/** The very first start: put the seed questions in (approved) so the game has something to play. */
export function seedIfEmpty(repo: Repo, bank: QuestionBank, at: number): number {
  if (repo.listQuestions().length > 0) return 0
  return importBank(repo, bank, { status: 'approved', source: 'seed', answerSource: 'seed', at })
}

/** The database back out as a bank file (for backups and for keeping approved questions in git). */
export function exportBank(repo: Repo, statuses: QStatus[], note: string): QuestionBank {
  const questions: QuestionRecord[] = []
  const categories = new Set<string>()
  for (const row of repo.listQuestions()) {
    if (!statuses.includes(row.status)) continue
    categories.add(row.category)
    const aliases = repo.aliasesOf(row.id)
    const byMessage = new Map<string, string[]>()
    for (const r of repo.rejectsOf(row.id)) byMessage.set(r.message, [...(byMessage.get(r.message) ?? []), r.norm])
    questions.push({
      id: row.id, category: row.category, prompt: row.prompt, rules: row.rules,
      answers: repo.answersOf(row.id).map((a) => ({
        name: a.name, tier: a.tier, ...(a.description ? { desc: a.description } : {}),
        ...(aliases.get(a.norm)?.length ? { aliases: aliases.get(a.norm) } : {}),
      })),
      ...(byMessage.size ? { rejects: [...byMessage].map(([message, names]) => ({ names, message })) } : {}),
    })
  }
  return { version: 'export-' + new Date().toISOString().slice(0, 10), note, categories: [...categories], questions }
}

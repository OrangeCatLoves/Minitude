import type { QStatus, Repo } from '../db/repo'
import { importQuestion } from '../bankio'
import { clean } from '../judge/prompt'
import { LlmError, type LlmClient } from '../llm/types'
import { normalize } from '../normalize'
import type { AnswerEntry } from '../questions'
import { categoryByName, CATEGORIES } from './categories'
import {
  ANSWERS_SCHEMA, ANSWERS_SYSTEM, answersPrompt, AUDIT_SCHEMA, AUDIT_SYSTEM, auditPrompt, PROPOSE_SCHEMA, PROPOSE_SYSTEM, proposePrompt,
} from './prompts'

/** a draft must have at least this many answers, and at least this many in every tier, or it is rejected automatically */
export const MIN_TOTAL = 30
export const MIN_PER_TIER = 4
/** if the audit throws out more than this share of the answers, the whole question is rejected */
export const MAX_DROPPED_SHARE = 0.3

export interface Proposal { prompt: string; rules: string }
export interface DraftAnswer { name: string; tier: number; desc: string; aliases: string[]; review?: boolean; note?: string }
export interface Problem { name: string; issue: string; note: string }
export interface Audit { questionOk: boolean; questionNote: string; problems: Problem[] }

const arr = (x: unknown): unknown[] => (Array.isArray(x) ? x : [])
const obj = (x: unknown): Record<string, unknown> => (x && typeof x === 'object' ? (x as Record<string, unknown>) : {})

export function parseProposals(raw: unknown): Proposal[] {
  return arr(obj(raw).questions).map((q) => ({ prompt: clean(obj(q).prompt, 140), rules: clean(obj(q).rules, 500) })).filter((p) => p.prompt.length >= 8 && p.rules.length >= 8)
}

export function parseAnswers(raw: unknown): DraftAnswer[] {
  const out: DraftAnswer[] = []
  for (const a of arr(obj(raw).answers)) {
    const o = obj(a)
    const name = clean(o.name, 80)
    const tier = typeof o.tier === 'number' ? Math.round(o.tier) : NaN
    if (!name || !(tier >= 0 && tier <= 5)) continue
    out.push({ name, tier, desc: clean(o.desc, 120), aliases: arr(o.aliases).map((x) => clean(x, 80)).filter(Boolean) })
  }
  return out
}

export function parseAudit(raw: unknown): Audit | null {
  const o = obj(raw)
  if (typeof o.question_ok !== 'boolean') return null
  return {
    questionOk: o.question_ok,
    questionNote: clean(o.question_note, 300),
    problems: arr(o.problems).map((p) => ({ name: clean(obj(p).name, 80), issue: clean(obj(p).issue, 30), note: clean(obj(p).note, 200) })).filter((p) => p.name && p.issue),
  }
}

/** Removes empty names, duplicates and clashing aliases. Returns what is left, what was dropped and why a draft cannot be used (if it cannot). */
export function checkAnswers(input: DraftAnswer[]): { answers: DraftAnswer[]; dropped: string[]; failures: string[] } {
  const seen = new Set<string>()
  const answers: DraftAnswer[] = []
  const dropped: string[] = []
  for (const a of input) {
    const n = normalize(a.name)
    if (!n) { dropped.push(`${a.name} (empty)`); continue }
    if (seen.has(n)) { dropped.push(`${a.name} (duplicate)`); continue }
    seen.add(n)
    answers.push({ ...a, aliases: [] })
  }
  const claimed = new Set(seen)
  for (let i = 0; i < answers.length; i++) {
    for (const al of input.find((x) => normalize(x.name) === normalize(answers[i].name))?.aliases ?? []) {
      const n = normalize(al)
      if (!n || claimed.has(n) || answers[i].aliases.length >= 3) continue
      claimed.add(n)
      answers[i].aliases.push(al)
    }
  }
  const failures: string[] = []
  if (answers.length < MIN_TOTAL) failures.push(`only ${answers.length} usable answers (need ${MIN_TOTAL})`)
  for (let t = 0; t <= 5; t++) {
    const n = answers.filter((a) => a.tier === t).length
    if (n < MIN_PER_TIER) failures.push(`tier ${t} has ${n} answers (need ${MIN_PER_TIER})`)
  }
  return { answers, dropped, failures }
}

/** Applies the auditor's findings: broken answers are dropped, doubtful ones are flagged for a person. */
export function applyAudit(answers: DraftAnswer[], audit: Audit): { answers: DraftAnswer[]; dropped: string[]; flagged: string[] } {
  const byName = new Map<string, DraftAnswer>()
  for (const a of answers) byName.set(normalize(a.name), a)
  const drop = new Set<DraftAnswer>()
  const dropped: string[] = []
  const flagged: string[] = []
  for (const p of audit.problems) {
    const a = byName.get(normalize(p.name))
    if (!a || drop.has(a)) continue
    if (p.issue === 'not_valid' || p.issue === 'duplicate' || p.issue === 'misspelled') {
      drop.add(a)
      dropped.push(`${a.name} (${p.issue}${p.note ? ': ' + p.note : ''})`)
    } else {
      a.review = true
      a.note = `${p.issue}${p.note ? ': ' + p.note : ''}`
      flagged.push(`${a.name} (${a.note})`)
    }
  }
  return { answers: answers.filter((a) => !drop.has(a)), dropped, flagged }
}

const words = (s: string) => new Set(normalize(s).split(' ').filter((w) => w.length > 2 && !['name', 'the', 'and', 'kind', 'type', 'that'].includes(w)))
/** two prompts that are about the same thing */
export function similarPrompts(a: string, b: string): boolean {
  const A = words(a), B = words(b)
  if (!A.size || !B.size) return false
  let inter = 0
  for (const w of A) if (B.has(w)) inter++
  return inter / (A.size + B.size - inter) >= 0.7
}

const slug = (s: string) => normalize(s).replace(/ /g, '-')
export function makeId(category: string, prompt: string, taken: (id: string) => boolean): string {
  const core = normalize(prompt).replace(/^name (a |an |the )?/, '').replace(/^(kind|type|species|variety|style|brand|form) of /, '')
  const base = `${slug(category).split('-')[0]}-${slug(core.split(' ').slice(0, 3).join(' ')) || 'q'}`
  let id = base, i = 2
  while (taken(id)) id = `${base}-${i++}`
  return id
}

export interface GenerateOptions {
  /** category names; default all eleven */
  categories?: string[]
  /** aim for this many questions (not counting rejected ones) per category. Default 2. */
  perCategory?: number
  /** or: write exactly this many new questions per category */
  count?: number
  log?: (line: string) => void
  now?: () => number
}

export interface GenerateReport {
  drafted: string[]
  rejected: string[]
  skipped: string[]
  /** why it stopped early, if it did */
  stopped?: string
}

/**
 * Has the language model write questions ahead of play. Everything it writes is saved as a DRAFT (or as rejected, when the
 * automatic checks fail): nothing is played until a person approves it. Three calls per question: propose, answer list, audit.
 */
export async function generateQuestions(repo: Repo, llm: LlmClient, o: GenerateOptions = {}): Promise<GenerateReport> {
  const log = o.log ?? (() => {})
  const now = o.now ?? Date.now
  const report: GenerateReport = { drafted: [], rejected: [], skipped: [] }
  const cats = (o.categories?.length ? o.categories : CATEGORIES.map((c) => c.name)).map((n) => {
    const c = categoryByName(n)
    if (!c) throw new Error(`Unknown category "${n}". Categories: ${CATEGORIES.map((x) => x.name).join(', ')}`)
    return c
  })
  try {
    for (const cat of cats) {
      const existing = repo.listQuestions().filter((q) => q.category === cat.name)
      const need = o.count ?? Math.max(0, (o.perCategory ?? 2) - existing.filter((q) => q.status !== 'rejected').length)
      if (need <= 0) { log(`${cat.name}: already has enough, skipping`); continue }
      log(`${cat.name}: writing ${need} question${need === 1 ? '' : 's'}`)
      let proposals: Proposal[]
      try {
        proposals = parseProposals(await llm.generateJson({
          purpose: 'generate', system: PROPOSE_SYSTEM, prompt: proposePrompt(cat.name, cat.scope, cat.example, existing.map((q) => q.prompt), need + 1),
          schema: PROPOSE_SCHEMA, temperature: 0.9, maxOutputTokens: 2048, timeoutMs: 60_000, retries: 2,
        }))
      } catch (e) {
        if (e instanceof LlmError && e.kind === 'budget') throw e
        log(`  could not get prompts: ${(e as Error).message}`)
        report.skipped.push(`${cat.name}: ${(e as Error).message}`)
        continue
      }
      let made = 0
      for (const p of proposals) {
        if (made >= need) break
        const all = repo.listQuestions().map((q) => q.prompt)
        if (all.some((x) => similarPrompts(x, p.prompt))) { log(`  skipped (too similar to an existing one): ${p.prompt}`); report.skipped.push(p.prompt); continue }
        const id = makeId(cat.name, p.prompt, (x) => !!repo.getQuestion(x))
        log(`  ${id}: ${p.prompt}`)
        try {
          const status = await draftOne(repo, llm, cat.name, id, p, now, log)
          made++
          ;(status === 'draft' ? report.drafted : report.rejected).push(id)
        } catch (e) {
          if (e instanceof LlmError && e.kind === 'budget') throw e
          log(`    failed: ${(e as Error).message}`)
          report.skipped.push(`${id}: ${(e as Error).message}`)
        }
      }
    }
  } catch (e) {
    if (e instanceof LlmError && e.kind === 'budget') report.stopped = `model budget used up (${e.message}). Run the command again later; finished questions are kept.`
    else throw e
  }
  return report
}

async function draftOne(repo: Repo, llm: LlmClient, category: string, id: string, p: Proposal, now: () => number, log: (s: string) => void): Promise<QStatus> {
  const raw = await llm.generateJson({
    purpose: 'generate', system: ANSWERS_SYSTEM, prompt: answersPrompt(p.prompt, p.rules), schema: ANSWERS_SCHEMA,
    temperature: 0.4, maxOutputTokens: 8192, timeoutMs: 120_000, retries: 2,
  })
  const checked = checkAnswers(parseAnswers(raw))
  const notes: string[] = []
  let answers = checked.answers
  let status: QStatus = 'draft'
  if (checked.dropped.length) notes.push(`Dropped before saving: ${checked.dropped.join('; ')}`)
  if (checked.failures.length) {
    status = 'rejected'
    notes.push(`REJECTED by the automatic checks: ${checked.failures.join('; ')}`)
    log(`    rejected: ${checked.failures.join('; ')}`)
  } else {
    const audit = parseAudit(await llm.generateJson({
      purpose: 'audit', system: AUDIT_SYSTEM, prompt: auditPrompt(p.prompt, p.rules, answers), schema: AUDIT_SCHEMA,
      temperature: 0, maxOutputTokens: 4096, timeoutMs: 90_000, retries: 2,
    }))
    if (!audit) {
      notes.push('The audit step gave an unusable reply, so this question has NOT been audited. Check it carefully.')
    } else {
      const applied = applyAudit(answers, audit)
      const before = answers.length
      answers = applied.answers
      if (applied.dropped.length) notes.push(`Dropped by the audit: ${applied.dropped.join('; ')}`)
      if (applied.flagged.length) notes.push(`Flagged by the audit (check these): ${applied.flagged.join('; ')}`)
      notes.push(audit.questionOk ? 'Audit: the question looks fine.' : `Audit says the QUESTION has a problem: ${audit.questionNote}`)
      if (applied.dropped.length / before > MAX_DROPPED_SHARE) {
        status = 'rejected'
        notes.push(`REJECTED: the audit threw out ${applied.dropped.length} of ${before} answers.`)
        log('    rejected: the audit threw out too many answers')
      } else {
        const again = checkAnswers(answers)
        if (again.failures.length) {
          status = 'rejected'
          notes.push(`REJECTED after the audit: ${again.failures.join('; ')}`)
          log(`    rejected: ${again.failures.join('; ')}`)
        }
      }
    }
  }
  const entries: AnswerEntry[] = answers.map((a) => ({
    name: a.name, tier: a.tier, ...(a.desc ? { desc: a.desc } : {}), ...(a.aliases.length ? { aliases: a.aliases } : {}),
    ...(a.review ? { review: true, note: a.note } : {}),
  }))
  importQuestion(repo, { id, category, prompt: p.prompt, rules: p.rules, answers: entries }, {
    status, source: 'llm', answerSource: 'draft', model: llm.model, notes: notes.join('\n') || null, at: now(),
  })
  if (status === 'draft') log(`    saved as a draft with ${entries.length} answers (${entries.filter((e) => e.review).length} flagged)`)
  return status
}

/**
 * The bank sheet: ONE searchable page with every question and every answer (the live game, the drafts, the rejected ones),
 * for the owner to read. It is regenerated from the data, never edited by hand: see docs/BANK_SHEET.md.
 *
 *   npx tsx src/cli/banksheet.ts --db <database file> [--drafts <bank.json>[=Label]] ... --out <page.html> [--asof "12 Nov 2026"]
 *
 * --db      a COPY of the live database (download one from Fly, docs/BANK_SHEET.md) or any database file; it is only read
 * --drafts  a bank file from the new-question builder (expand/newq.ts); the label (for example "Batch 1") is shown next to its questions.
 *           A question that is already in the database is taken from the database.
 */
import Database from 'better-sqlite3'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exportBank } from '../bankio'
import { normalize } from '../normalize'
import { Repo } from '../db/repo'
import type { QuestionBank, QuestionRecord } from '../questions'

type Status = 'live' | 'draft' | 'rejected'

interface SheetQuestion {
  id: string
  category: string
  prompt: string
  rules: string
  status: Status
  /** where it comes from: "Live game", "Batch 1" ... */
  origin: string
  /** a plain sentence on where the answers came from (when known) */
  source?: string
  /** answers by tier 0..5; each entry is [name, ...other ways to write it] */
  t: string[][][]
  /** the question's SINGULARITY gem (scores 120 points; the answer keeps its own tier in the lists above) */
  gem?: { name: string; line: string }
}

const MAX_ALIASES = 5
const TIER_COUNT = 6

function toSheet(q: QuestionRecord, status: Status, origin: string, source?: string): SheetQuestion {
  const t: string[][][] = Array.from({ length: TIER_COUNT }, () => [])
  for (const a of q.answers) {
    const tier = Math.min(TIER_COUNT - 1, Math.max(0, a.tier))
    t[tier].push([a.name, ...(a.aliases ?? []).slice(0, MAX_ALIASES)])
  }
  return { id: q.id, category: q.category, prompt: q.prompt, rules: q.rules, status, origin, ...(source ? { source } : {}), t }
}

export function buildSheetData(dbFile: string, drafts: { file: string; label: string }[], asOf: string, gemFiles: string[] = []) {
  const questions: SheetQuestion[] = []
  const have = new Set<string>()

  const db = new Database(dbFile, { readonly: true, fileMustExist: true })
  try {
    const repo = new Repo(db)
    const all = exportBank(repo, ['approved', 'draft', 'rejected'], 'sheet')
    const statusOf = new Map(repo.listQuestions().map((r) => [r.id, r.status]))
    for (const q of all.questions) {
      const s = statusOf.get(q.id)
      const status: Status = s === 'approved' ? 'live' : s === 'rejected' ? 'rejected' : 'draft'
      const sheet = toSheet(q, status, status === 'live' ? 'Live game' : status === 'draft' ? 'Draft in the database' : 'Rejected')
      const gem = repo.gemOf(q.id)
      const gemAnswer = gem ? q.answers.find((a) => normalize(a.name) === gem.answerNorm) : undefined
      if (gem && gemAnswer) sheet.gem = { name: gemAnswer.name, line: gem.description ?? '' }
      questions.push(sheet)
      have.add(q.id)
    }
  } finally {
    db.close()
  }

  // proposed gems of questions that are not in the database yet (the file has the same shape as data/gems.json)
  const proposed = new Map<string, { answer: string; description?: string }>()
  for (const g of gemFiles) for (const x of (JSON.parse(readFileSync(g, 'utf8')) as { gems: { question: string; answer: string; description?: string }[] }).gems) proposed.set(x.question, x)

  for (const d of drafts) {
    const bank = JSON.parse(readFileSync(d.file, 'utf8')) as QuestionBank
    for (const q of bank.questions) {
      if (have.has(q.id)) continue
      have.add(q.id)
      const sheet = toSheet(q, 'draft', d.label, bank.sources?.[q.id])
      const pg = proposed.get(q.id)
      const pa = pg ? q.answers.find((a) => normalize(a.name) === normalize(pg.answer)) : undefined
      if (pg && pa) sheet.gem = { name: pa.name, line: pg.description ?? '' }
      questions.push(sheet)
    }
  }

  const order: Record<Status, number> = { live: 0, draft: 1, rejected: 2 }
  questions.sort((a, b) => order[a.status] - order[b.status] || a.origin.localeCompare(b.origin) || a.category.localeCompare(b.category) || a.prompt.localeCompare(b.prompt))
  return { asOf, questions }
}

/** the data goes inside a <script>: nothing in it may end the script or break a JavaScript string */
export function embed(data: unknown): string {
  // < would end the script (as </script>); the two line-separator characters are legal in JSON but not in a JavaScript string
  return JSON.stringify(data).split('<').join('\\u003c').split(String.fromCharCode(0x2028)).join('\\u2028').split(String.fromCharCode(0x2029)).join('\\u2029')
}

export function renderSheet(data: unknown): string {
  const template = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'banksheet.template.html'), 'utf8')
  if (!template.includes('/*DATA*/null')) throw new Error('banksheet.template.html has lost its /*DATA*/null placeholder')
  return template.replace('/*DATA*/null', () => embed(data))
}

function main(): void {
  const args = process.argv.slice(2)
  const all = (name: string) => args.flatMap((a, i) => (a === '--' + name && args[i + 1] ? [args[i + 1]] : []))
  const one = (name: string) => all(name)[0]
  const dbFile = one('db')
  const out = one('out')
  if (!dbFile || !out) {
    console.error('usage: banksheet --db <database file> [--drafts <bank.json>[=Label]] ... [--gems <gems.json>] ... --out <page.html> [--asof "12 Nov 2026"]')
    process.exit(1)
  }
  const drafts = all('drafts').map((s) => {
    const i = s.indexOf('=') // "path/bank.json=Batch 1"
    return i > 0 ? { file: s.slice(0, i), label: s.slice(i + 1) } : { file: s, label: 'Drafts' }
  })
  const asOf = one('asof') ?? new Date().toISOString().slice(0, 10)
  const data = buildSheetData(dbFile, drafts, asOf, all('gems'))
  writeFileSync(out, renderSheet(data))
  const count = (s: Status) => data.questions.filter((q) => q.status === s)
  const answers = (qs: SheetQuestion[]) => qs.reduce((n, q) => n + q.t.reduce((m, t) => m + t.length, 0), 0)
  for (const s of ['live', 'draft', 'rejected'] as Status[]) console.log(`${s.padEnd(9)} ${String(count(s).length).padStart(3)} questions, ${String(answers(count(s))).padStart(6)} answers`)
  console.log(`wrote ${out} (${(readFileSync(out).length / 1e6).toFixed(1)} MB)`)
}

// run only when started as a command, not when a test imports it
if (process.argv[1]?.endsWith('banksheet.ts')) main()

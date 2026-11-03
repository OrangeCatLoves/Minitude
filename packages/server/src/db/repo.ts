import { randomUUID } from 'node:crypto'
import type { Statement } from 'better-sqlite3'
import type { Db } from './open'
import type { QuestionHead, QuestionRecord } from '../questions'
import { fuzzyFind, type Fuzzy } from '../match'

/** Version of the scoring rules stored with questions and runs. Bump it when tier meaning changes. */
export const POLICY_VERSION = 'v1'

export type QStatus = 'draft' | 'approved' | 'rejected'

export interface QuestionRow extends QuestionHead {
  status: QStatus
  source: string
  model: string | null
  policyVersion: string
  notes: string | null
  createdAt: number
  decidedAt: number | null
}

export interface AnswerRow {
  questionId: string
  norm: string
  name: string
  tier: number
  description: string | null
  source: string
  model: string | null
  review: boolean
  note: string | null
  timesGiven: number
  createdAt: number
}

export interface NewAnswer {
  questionId: string
  norm: string
  name: string
  tier: number
  description?: string | null
  source: string
  model?: string | null
  review?: boolean
  note?: string | null
  at: number
}

/** `via` (valid only) = how the text reached the answer: absent when it IS the answer, else the source of the spelling that points to it ('alias', 'typo', 'llm') */
export type Stored = { kind: 'valid'; answer: AnswerRow; via?: string } | { kind: 'invalid'; message: string }

export interface RunQuestionRow extends QuestionHead {
  idx: number
  startedAt: number | null
  busyMs: number
  result: 'valid' | 'miss' | null
  answer: string | null
  tier: number | null
  points: number | null
  finishedAt: number | null
}
export interface RunRow {
  id: string
  createdAt: number
  checker: string
  mode: 'solo' | 'daily'
  questions: RunQuestionRow[]
}

export interface DailyPlayRow {
  day: string
  guestId: string
  runId: string
  startedAt: number
  finishedAt: number | null
  total: number | null
}

export function runTotal(run: RunRow): number {
  return run.questions.reduce((a, q) => a + (q.result === 'valid' ? q.points ?? 0 : 0), 0)
}

type Row = Record<string, any>
const toQuestion = (r: Row): QuestionRow => ({
  id: r.id, category: r.category, prompt: r.prompt, rules: r.rules, status: r.status, source: r.source, model: r.model,
  policyVersion: r.policy_version, notes: r.notes, createdAt: r.created_at, decidedAt: r.decided_at,
})
const toAnswer = (r: Row): AnswerRow => ({
  questionId: r.question_id, norm: r.norm, name: r.name, tier: r.tier, description: r.description, source: r.source, model: r.model,
  review: !!r.review, note: r.note, timesGiven: r.times_given, createdAt: r.created_at,
})

const toPlay = (r: Row): DailyPlayRow => ({
  day: r.day, guestId: r.guest_id, runId: r.run_id, startedAt: r.started_at, finishedAt: r.finished_at, total: r.total,
})

/** All reads and writes of the database. Plain synchronous SQL; no cleverness. */
export class Repo {
  private cache = new Map<string, Statement<any[], any>>()
  constructor(readonly db: Db) {}

  private st(sql: string) {
    let s = this.cache.get(sql)
    if (!s) { s = this.db.prepare(sql); this.cache.set(sql, s) }
    return s
  }
  tx<T>(fn: () => T): T { return this.db.transaction(fn)() }

  // ---------------------------------------------------------------- questions
  /** false if a question with this id already exists */
  insertQuestion(q: QuestionHead & { status: QStatus; source: string; model?: string | null; notes?: string | null; at: number }): boolean {
    const r = this.st(`INSERT OR IGNORE INTO questions (id, category, prompt, rules, status, source, model, policy_version, notes, created_at, decided_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(q.id, q.category, q.prompt, q.rules, q.status, q.source, q.model ?? null, POLICY_VERSION, q.notes ?? null, q.at, q.status === 'draft' ? null : q.at)
    return r.changes > 0
  }
  getQuestion(id: string): QuestionRow | undefined {
    const r = this.st('SELECT * FROM questions WHERE id = ?').get(id) as Row | undefined
    return r ? toQuestion(r) : undefined
  }
  listQuestions(status?: QStatus): QuestionRow[] {
    const rows = (status ? this.st('SELECT * FROM questions WHERE status = ? ORDER BY category, created_at, id').all(status) : this.st('SELECT * FROM questions ORDER BY category, created_at, id').all()) as Row[]
    return rows.map(toQuestion)
  }
  approvedHeads(): QuestionHead[] {
    return (this.st("SELECT id, category, prompt, rules FROM questions WHERE status = 'approved'").all() as Row[]).map((r) => ({ id: r.id, category: r.category, prompt: r.prompt, rules: r.rules }))
  }
  countByStatus(): Record<QStatus, number> {
    const out: Record<QStatus, number> = { draft: 0, approved: 0, rejected: 0 }
    for (const r of this.st('SELECT status, COUNT(*) n FROM questions GROUP BY status').all() as Row[]) out[r.status as QStatus] = r.n
    return out
  }
  setQuestionStatus(id: string, status: QStatus, at: number, note?: string): boolean {
    const before = this.getQuestion(id)
    if (!before) return false
    this.st('UPDATE questions SET status = ?, decided_at = ?, notes = COALESCE(?, notes) WHERE id = ?').run(status, at, note ?? null, id)
    this.logChange(id, null, 'question status', before.status, status, note ?? null, at)
    return true
  }

  // ---------------------------------------------------------------- answers and spellings
  getAnswer(questionId: string, norm: string): AnswerRow | undefined {
    const r = this.st('SELECT * FROM answers WHERE question_id = ? AND norm = ?').get(questionId, norm) as Row | undefined
    return r ? toAnswer(r) : undefined
  }
  answersOf(questionId: string): AnswerRow[] {
    return (this.st('SELECT * FROM answers WHERE question_id = ? ORDER BY tier, name').all(questionId) as Row[]).map(toAnswer)
  }
  /** inserts unless the canonical answer already exists; returns the row that is in the database either way */
  insertAnswer(a: NewAnswer): { row: AnswerRow; created: boolean } {
    const r = this.st(`INSERT OR IGNORE INTO answers (question_id, norm, name, tier, description, source, model, review, note, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(a.questionId, a.norm, a.name, a.tier, a.description ?? null, a.source, a.model ?? null, a.review ? 1 : 0, a.note ?? null, a.at)
    return { row: this.getAnswer(a.questionId, a.norm)!, created: r.changes > 0 }
  }
  insertSpelling(s: { questionId: string; norm: string; verdict: 'valid' | 'invalid'; canonNorm?: string | null; message?: string | null; source: string; model?: string | null; at: number }): boolean {
    const r = this.st(`INSERT OR IGNORE INTO spellings (question_id, norm, verdict, canon_norm, message, source, model, created_at)
      VALUES (?,?,?,?,?,?,?,?)`).run(s.questionId, s.norm, s.verdict, s.canonNorm ?? null, s.message ?? null, s.source, s.model ?? null, s.at)
    return r.changes > 0
  }
  /** What is already decided for this exact (normalised) text: a canonical answer, a spelling of one, or a stored "does not count". */
  findStored(questionId: string, norm: string): Stored | null {
    const a = this.getAnswer(questionId, norm)
    if (a) return { kind: 'valid', answer: a }
    const s = this.st('SELECT verdict, canon_norm, message, source FROM spellings WHERE question_id = ? AND norm = ?').get(questionId, norm) as Row | undefined
    if (!s) return null
    this.st('UPDATE spellings SET hits = hits + 1 WHERE question_id = ? AND norm = ?').run(questionId, norm)
    if (s.verdict === 'invalid') return { kind: 'invalid', message: s.message ?? "That doesn't count." }
    const canon = this.getAnswer(questionId, s.canon_norm)
    return canon ? { kind: 'valid', answer: canon, via: s.source } : null
  }
  /** the canonical answer a learned spelling points to (does not count as a use of the spelling) */
  findStoredSpellingTarget(questionId: string, norm: string, onlyAliases = false): AnswerRow | null {
    const s = this.st(`SELECT canon_norm FROM spellings WHERE question_id = ? AND norm = ? AND verdict = 'valid'${onlyAliases ? " AND source = 'alias'" : ''}`).get(questionId, norm) as Row | undefined
    return s ? this.getAnswer(questionId, s.canon_norm) ?? null : null
  }
  /** nearest known form within the typo budget, as canonical answers */
  fuzzy(questionId: string, norm: string): { kind: 'one'; answer: AnswerRow } | { kind: 'ambiguous'; answers: AnswerRow[] } | null {
    const forms = new Map<string, string>()
    for (const r of this.st('SELECT norm FROM answers WHERE question_id = ?').all(questionId) as Row[]) forms.set(r.norm, r.norm)
    for (const r of this.st("SELECT norm, canon_norm FROM spellings WHERE question_id = ? AND verdict = 'valid'").all(questionId) as Row[]) forms.set(r.norm, r.canon_norm)
    const f: Fuzzy = fuzzyFind(norm, forms)
    if (!f) return null
    if (f.kind === 'one') return { kind: 'one', answer: this.getAnswer(questionId, f.canon)! }
    return { kind: 'ambiguous', answers: f.canons.map((c) => this.getAnswer(questionId, c)!) }
  }
  bumpGiven(questionId: string, canonNorm: string): void {
    this.st('UPDATE answers SET times_given = times_given + 1 WHERE question_id = ? AND norm = ?').run(questionId, canonNorm)
  }
  aliasesOf(questionId: string): Map<string, string[]> {
    const m = new Map<string, string[]>()
    for (const r of this.st("SELECT norm, canon_norm FROM spellings WHERE question_id = ? AND verdict = 'valid' AND source = 'alias' ORDER BY norm").all(questionId) as Row[]) {
      m.set(r.canon_norm, [...(m.get(r.canon_norm) ?? []), r.norm])
    }
    return m
  }
  rejectsOf(questionId: string): { norm: string; message: string }[] {
    return (this.st("SELECT norm, message FROM spellings WHERE question_id = ? AND verdict = 'invalid' AND source IN ('seed','admin') ORDER BY norm").all(questionId) as Row[]).map((r) => ({ norm: r.norm, message: r.message }))
  }
  answersToReview(): AnswerRow[] {
    return (this.st('SELECT * FROM answers WHERE review = 1 ORDER BY times_given DESC, question_id, name').all() as Row[]).map(toAnswer)
  }
  setTier(questionId: string, norm: string, tier: number, reason: string | null, at: number): boolean {
    const a = this.getAnswer(questionId, norm)
    if (!a) return false
    this.st('UPDATE answers SET tier = ?, review = 0, source = ? WHERE question_id = ? AND norm = ?').run(tier, 'admin', questionId, norm)
    this.logChange(questionId, norm, 'tier', String(a.tier), String(tier), reason, at)
    return true
  }
  clearReview(questionId: string, norm: string): boolean {
    return this.st('UPDATE answers SET review = 0 WHERE question_id = ? AND norm = ?').run(questionId, norm).changes > 0
  }
  /** take an answer out and store a "does not count" for it (spellings that pointed at it go too) */
  invalidateAnswer(questionId: string, norm: string, message: string, reason: string | null, at: number): boolean {
    const a = this.getAnswer(questionId, norm)
    if (!a) return false
    this.tx(() => {
      this.st('DELETE FROM answers WHERE question_id = ? AND norm = ?').run(questionId, norm)
      this.insertSpelling({ questionId, norm, verdict: 'invalid', message, source: 'admin', at })
      this.logChange(questionId, norm, 'answer removed', `${a.name} (tier ${a.tier})`, null, reason, at)
    })
    return true
  }

  // ---------------------------------------------------------------- runs
  createRun(questions: QuestionHead[], checker: string, at: number, mode: 'solo' | 'daily' = 'solo'): RunRow {
    const id = randomUUID()
    this.tx(() => {
      this.st('INSERT INTO runs (id, created_at, checker, policy_version, mode) VALUES (?,?,?,?,?)').run(id, at, checker, POLICY_VERSION, mode)
      questions.forEach((q, i) => this.st('INSERT INTO run_questions (run_id, idx, question_id) VALUES (?,?,?)').run(id, i, q.id))
    })
    return this.getRun(id)!
  }
  getRun(id: string): RunRow | undefined {
    const r = this.st('SELECT * FROM runs WHERE id = ?').get(id) as Row | undefined
    if (!r) return undefined
    const rows = this.st(`SELECT rq.*, q.category, q.prompt, q.rules FROM run_questions rq JOIN questions q ON q.id = rq.question_id
      WHERE rq.run_id = ? ORDER BY rq.idx`).all(id) as Row[]
    return {
      id: r.id, createdAt: r.created_at, checker: r.checker, mode: r.mode,
      questions: rows.map((x) => ({
        id: x.question_id, category: x.category, prompt: x.prompt, rules: x.rules, idx: x.idx, startedAt: x.started_at, busyMs: x.busy_ms,
        result: x.result, answer: x.answer, tier: x.tier, points: x.points, finishedAt: x.finished_at,
      })),
    }
  }
  /** the first call wins; later calls change nothing */
  markStarted(runId: string, idx: number, at: number): void {
    this.st('UPDATE run_questions SET started_at = ? WHERE run_id = ? AND idx = ? AND started_at IS NULL').run(at, runId, idx)
  }
  addBusy(runId: string, idx: number, ms: number): void {
    this.st('UPDATE run_questions SET busy_ms = busy_ms + ? WHERE run_id = ? AND idx = ?').run(Math.max(0, Math.round(ms)), runId, idx)
  }
  /** false if the question was already finished */
  finishValid(runId: string, idx: number, r: { answer: string; tier: number; points: number }, at: number): boolean {
    return this.st("UPDATE run_questions SET result = 'valid', answer = ?, tier = ?, points = ?, finished_at = ? WHERE run_id = ? AND idx = ? AND result IS NULL")
      .run(r.answer, r.tier, r.points, at, runId, idx).changes > 0
  }
  finishMiss(runId: string, idx: number, at: number): boolean {
    return this.st("UPDATE run_questions SET result = 'miss', points = 0, finished_at = ? WHERE run_id = ? AND idx = ? AND result IS NULL").run(at, runId, idx).changes > 0
  }
  /** Closes every question of a run that has no result yet as a miss. Returns how many it closed. */
  closeRun(runId: string, at: number): number {
    return this.st("UPDATE run_questions SET result = 'miss', points = 0, finished_at = ? WHERE run_id = ? AND result IS NULL").run(at, runId).changes
  }
  /** the latest moment anything happened in a run: it was created, a question started, or a question finished */
  lastActivity(runId: string): number {
    const r = this.st(`SELECT MAX(
        (SELECT created_at FROM runs WHERE id = ?),
        COALESCE((SELECT MAX(started_at) FROM run_questions WHERE run_id = ?), 0),
        COALESCE((SELECT MAX(finished_at) FROM run_questions WHERE run_id = ?), 0)) m`).get(runId, runId, runId) as Row
    return r.m
  }
  attemptCount(runId: string, idx: number): number {
    return (this.st('SELECT COUNT(*) n FROM attempts WHERE run_id = ? AND idx = ?').get(runId, idx) as Row).n
  }
  logAttempt(a: { runId: string; idx: number; text: string; status: string; answer?: string | null; tier?: number | null; message?: string | null; via: string; ms: number; at: number }): void {
    this.st('INSERT INTO attempts (run_id, idx, text, status, answer, tier, message, via, ms, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(a.runId, a.idx, a.text, a.status, a.answer ?? null, a.tier ?? null, a.message ?? null, a.via, a.ms, a.at)
  }

  // ---------------------------------------------------------------- the daily challenge
  getMeta(key: string): string | undefined {
    return (this.st('SELECT value FROM meta WHERE key = ?').get(key) as Row | undefined)?.value
  }
  /** keeps the first value written */
  setMetaOnce(key: string, value: string): void {
    this.st('INSERT OR IGNORE INTO meta (key, value) VALUES (?, ?)').run(key, value)
  }
  /** the questions of a day's set, in play order; undefined when no set exists for that day */
  dailySet(day: string): QuestionHead[] | undefined {
    if (!this.st('SELECT 1 FROM daily_sets WHERE day = ?').get(day)) return undefined
    return (this.st(`SELECT q.id, q.category, q.prompt, q.rules FROM daily_set_questions d JOIN questions q ON q.id = d.question_id
      WHERE d.day = ? ORDER BY d.idx`).all(day) as Row[]).map((r) => ({ id: r.id, category: r.category, prompt: r.prompt, rules: r.rules }))
  }
  /** false if a set already exists for that day (the first one wins) */
  insertDailySet(day: string, questionIds: string[], at: number): boolean {
    return this.tx(() => {
      const r = this.st('INSERT OR IGNORE INTO daily_sets (day, created_at) VALUES (?, ?)').run(day, at)
      if (r.changes === 0) return false
      questionIds.forEach((id, i) => this.st('INSERT INTO daily_set_questions (day, idx, question_id) VALUES (?,?,?)').run(day, i, id))
      return true
    })
  }
  /** removes a day's set so that it is chosen again; refuses (false) once anybody has played it */
  deleteDailySet(day: string): boolean {
    if (this.dailyPlayCount(day) > 0) return false
    return this.st('DELETE FROM daily_sets WHERE day = ?').run(day).changes > 0
  }
  /** the days that have a set, from `fromDay` on, oldest first */
  dailyDays(fromDay: string): string[] {
    return (this.st('SELECT day FROM daily_sets WHERE day >= ? ORDER BY day').all(fromDay) as Row[]).map((r) => r.day)
  }
  /** for each question, the latest day it was in a daily set */
  lastDailyUse(): Map<string, string> {
    const m = new Map<string, string>()
    for (const r of this.st('SELECT question_id, MAX(day) d FROM daily_set_questions GROUP BY question_id').all() as Row[]) m.set(r.question_id, r.d)
    return m
  }
  dailyPlay(day: string, guestId: string): DailyPlayRow | undefined {
    const r = this.st('SELECT * FROM daily_plays WHERE day = ? AND guest_id = ?').get(day, guestId) as Row | undefined
    return r ? toPlay(r) : undefined
  }
  dailyPlayByRun(runId: string): DailyPlayRow | undefined {
    const r = this.st('SELECT * FROM daily_plays WHERE run_id = ?').get(runId) as Row | undefined
    return r ? toPlay(r) : undefined
  }
  /** opens the single daily attempt of a guest: a daily run plus its play row, together */
  startDailyPlay(day: string, guestId: string, questions: QuestionHead[], checker: string, ipHash: string | null, at: number): RunRow {
    return this.tx(() => {
      const run = this.createRun(questions, checker, at, 'daily')
      this.st('INSERT INTO daily_plays (day, guest_id, run_id, ip_hash, started_at) VALUES (?,?,?,?,?)').run(day, guestId, run.id, ipHash, at)
      return run
    })
  }
  /** marks the play of this run as finished with its total. The first call wins. */
  finishDailyPlay(runId: string, total: number, at: number): boolean {
    return this.st('UPDATE daily_plays SET finished_at = ?, total = ? WHERE run_id = ? AND finished_at IS NULL').run(at, total, runId).changes > 0
  }
  dailyPlayCount(day: string): number {
    return (this.st('SELECT COUNT(*) n FROM daily_plays WHERE day = ?').get(day) as Row).n
  }
  /** how many daily runs started from one network on one day */
  dailyPlaysFromIp(day: string, ipHash: string): number {
    return (this.st('SELECT COUNT(*) n FROM daily_plays WHERE day = ? AND ip_hash = ?').get(day, ipHash) as Row).n
  }
  /** where a total stands among the runs finished on `day` */
  dailyStandings(day: string, total: number): { players: number; rank: number; below: number; best: number } {
    const one = (sql: string, ...args: unknown[]) => this.st(sql).get(...args) as Row
    const players = one('SELECT COUNT(*) n FROM daily_plays WHERE day = ? AND finished_at IS NOT NULL', day).n as number
    const above = one('SELECT COUNT(*) n FROM daily_plays WHERE day = ? AND finished_at IS NOT NULL AND total > ?', day, total).n as number
    const below = one('SELECT COUNT(*) n FROM daily_plays WHERE day = ? AND finished_at IS NOT NULL AND total < ?', day, total).n as number
    const best = (one('SELECT MAX(total) m FROM daily_plays WHERE day = ? AND finished_at IS NOT NULL', day).m as number | null) ?? 0
    return { players, rank: above + 1, below, best }
  }
  /** every day this guest finished the daily */
  finishedDaysOf(guestId: string): string[] {
    return (this.st('SELECT day FROM daily_plays WHERE guest_id = ? AND finished_at IS NOT NULL ORDER BY day DESC LIMIT 400').all(guestId) as Row[]).map((r) => r.day)
  }

  // ---------------------------------------------------------------- language model log and corrections
  /** note a model call before it is made, so that calls running at the same moment all count against the budget */
  startLlm(at: number, purpose: string, model: string): number {
    return Number(this.st("INSERT INTO llm_log (at, purpose, model, ok, ms, error) VALUES (?,?,?,0,0,'running')").run(at, purpose, model).lastInsertRowid)
  }
  /** `model` = the model that really answered, when it was not the one the call started with (a fallback) */
  finishLlm(id: number, ok: boolean, ms: number, error?: string | null, model?: string): void {
    this.st('UPDATE llm_log SET ok = ?, ms = ?, error = ?, model = COALESCE(?, model) WHERE id = ?').run(ok ? 1 : 0, Math.round(ms), error ?? null, model ?? null, id)
  }
  llmCallsSince(since: number): number {
    return (this.st('SELECT COUNT(*) n FROM llm_log WHERE at > ?').get(since) as Row).n
  }
  logChange(questionId: string, norm: string | null, what: string, before: string | null, after: string | null, reason: string | null, at: number): void {
    this.st('INSERT INTO changes (at, question_id, norm, what, before, after, reason) VALUES (?,?,?,?,?,?,?)').run(at, questionId, norm, what, before, after, reason)
  }

  stats(): Record<string, number> {
    const n = (sql: string) => (this.st(sql).get() as Row).n as number
    return {
      questionsApproved: n("SELECT COUNT(*) n FROM questions WHERE status = 'approved'"),
      questionsDraft: n("SELECT COUNT(*) n FROM questions WHERE status = 'draft'"),
      questionsRejected: n("SELECT COUNT(*) n FROM questions WHERE status = 'rejected'"),
      answers: n('SELECT COUNT(*) n FROM answers'),
      answersFromPlayers: n("SELECT COUNT(*) n FROM answers WHERE source = 'live'"),
      answersToReview: n('SELECT COUNT(*) n FROM answers WHERE review = 1'),
      spellings: n('SELECT COUNT(*) n FROM spellings'),
      runs: n('SELECT COUNT(*) n FROM runs'),
      dailyPlays: n('SELECT COUNT(*) n FROM daily_plays'),
      attempts: n('SELECT COUNT(*) n FROM attempts'),
      llmCalls: n('SELECT COUNT(*) n FROM llm_log'),
      llmFailures: n('SELECT COUNT(*) n FROM llm_log WHERE ok = 0'),
    }
  }
}

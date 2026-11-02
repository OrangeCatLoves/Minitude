import { Hono, type Context } from 'hono'
import { cors } from 'hono/cors'
import {
  RUN_LENGTH, dayNumber, msToReset, streakOf, utcDay,
  type DailyState, type StartQuestionResponse, type StartRunResponse,
} from '@minitude/core'
import type { QuestionHead } from './questions'
import type { Judge } from './judge/types'
import { ipFingerprint, isLoopback } from './clientip'
import { ensureDailySet, epochDay } from './daily'
import { POLICY_VERSION, runTotal, type DailyPlayRow, type Repo, type RunQuestionRow } from './db/repo'

export const QUESTION_SECONDS = 30
/** the browser starts each question's clock this long after the question appears on screen */
export const START_DELAY_MS = 550
/** allowance for network delay: an answer may arrive this late and still count */
export const GRACE_MS = 3000
/** most answers one question accepts (every unknown answer can cost a model call) */
export const MAX_ATTEMPTS_PER_QUESTION = 12
/** a daily run with nothing happening for this long is treated as abandoned and closed (unanswered questions score 0) */
export const STALE_RUN_MS = 120_000
/** most daily runs one network may start per day (0 = no limit). Shared networks (schools, offices) need room. */
export const DAILY_PER_IP = 10
const MAX_ANSWER_CHARS = 80
/** the browser makes this up once and keeps it: the only "account" there is */
const GUEST_RE = /^[A-Za-z0-9_-]{16,64}$/

export interface AppDeps {
  repo: Repo
  judge: Judge
  /** requests per minute per client address (answers and starting runs) */
  rateLimitPerMinute?: number
  /** inject randomness in tests */
  rand?: () => number
  /** inject the clock in tests (milliseconds) */
  now?: () => number
  questionSeconds?: number
  /** who is calling (see clientip.ts). Default: the first address in X-Forwarded-For, else 'local'. */
  clientIp?: (c: Context) => string
  dailyPerIp?: number
  staleRunMs?: number
}

function shuffle<T>(a: T[], rand: () => number): T[] {
  const b = a.slice()
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

/** Seven questions from seven different categories when the bank allows (never two from the same category if it can be avoided). */
export function pickRun<T extends QuestionHead>(questions: T[], rand: () => number): T[] {
  const byCat = new Map<string, T[]>()
  for (const q of questions) byCat.set(q.category, [...(byCat.get(q.category) ?? []), q])
  const cats = shuffle([...byCat.keys()], rand).slice(0, RUN_LENGTH)
  const picked = cats.map((c) => {
    const qs = byCat.get(c)!
    return qs[Math.floor(rand() * qs.length)]
  })
  if (picked.length < RUN_LENGTH) {
    const rest = shuffle(questions.filter((q) => !picked.includes(q)), rand)
    while (picked.length < RUN_LENGTH && rest.length) picked.push(rest.pop()!)
  }
  return shuffle(picked, rand)
}

export function createApp(deps: AppDeps) {
  const { repo, judge } = deps
  const rand = deps.rand ?? Math.random
  const now = deps.now ?? Date.now
  const seconds = deps.questionSeconds ?? QUESTION_SECONDS
  const limit = deps.rateLimitPerMinute ?? 90
  const perIp = deps.dailyPerIp ?? DAILY_PER_IP
  const staleMs = deps.staleRunMs ?? STALE_RUN_MS
  const clientIp = deps.clientIp ?? ((c: Context) => (c.req.header('x-forwarded-for') ?? 'local').split(',')[0].trim())
  const hits = new Map<string, number[]>()
  const app = new Hono()
  app.use('/api/*', cors())
  app.use('/api/*', async (c, next) => {
    await next()
    c.header('cache-control', 'no-store')
  })

  const limited = (ip: string) => {
    const t = now()
    const arr = (hits.get(ip) ?? []).filter((x) => t - x < 60_000)
    arr.push(t)
    hits.set(ip, arr)
    if (hits.size > 5000) for (const [k, v] of hits) if (v.every((x) => t - x >= 60_000)) hits.delete(k)
    return arr.length > limit
  }
  const fail = (c: Context, status: 400 | 404 | 409 | 429 | 503, error: string, code?: string) => c.json({ error, ...(code ? { code } : {}) }, status)
  /** time the player has in total for this question: the clock, the browser's start delay, a grace period, and the time spent checking */
  const allowedMs = (q: RunQuestionRow) => seconds * 1000 + START_DELAY_MS + GRACE_MS + q.busyMs
  const isLate = (q: RunQuestionRow, t: number) => q.startedAt !== null && t - q.startedAt > allowedMs(q)

  // ------------------------------------------------------------------ the daily challenge
  const guestOf = (c: Context): string | null => {
    const g = c.req.header('x-guest')
    return g && GUEST_RE.test(g) ? g : null
  }

  /** a daily run whose every question is finished is finished: its total is written down once */
  const finishIfComplete = (runId: string) => {
    const run = repo.getRun(runId)
    if (!run || run.mode !== 'daily' || run.questions.some((q) => !q.result)) return
    repo.finishDailyPlay(runId, runTotal(run), now())
  }

  /** Closes the daily run of a guest who left it open: nothing happened in it for a while. Unanswered questions score 0. */
  const settle = (play: DailyPlayRow): DailyPlayRow => {
    if (play.finishedAt !== null) return play
    const run = repo.getRun(play.runId)
    if (!run) return play
    const t = now()
    const open = run.questions.some((q) => !q.result)
    if (open && t - repo.lastActivity(run.id) <= staleMs) return play
    if (open) repo.closeRun(run.id, t)
    repo.finishDailyPlay(run.id, runTotal(repo.getRun(run.id)!), t)
    return repo.dailyPlay(play.day, play.guestId)!
  }

  const dailyState = (day: string, guest: string): DailyState => {
    const t = now()
    let play = repo.dailyPlay(day, guest)
    if (play) play = settle(play)
    const base = {
      day,
      number: dayNumber(epochDay(repo, day), day),
      resetsInMs: msToReset(t),
      streak: streakOf(repo.finishedDaysOf(guest), day),
    }
    if (!play) return { ...base, status: 'new' }
    if (play.finishedAt === null) return { ...base, status: 'playing' }
    const run = repo.getRun(play.runId)!
    const total = play.total ?? runTotal(run)
    return {
      ...base,
      status: 'done',
      items: run.questions.map((q) => ({ miss: q.result !== 'valid', answer: q.result === 'valid' ? q.answer : null, tier: q.result === 'valid' ? q.tier : null, points: q.result === 'valid' ? q.points ?? 0 : 0 })),
      total,
      standings: repo.dailyStandings(day, total),
    }
  }

  app.get('/api/health', (c) => c.json({ ok: true, checker: judge.kind, questions: repo.countByStatus().approved, policy: POLICY_VERSION }))

  app.get('/api/daily', (c) => {
    const guest = guestOf(c)
    if (!guest) return fail(c, 400, 'Missing guest id.', 'guest')
    const day = utcDay(now())
    if (!ensureDailySet(repo, day, now())) return fail(c, 503, 'There are not enough questions yet.', 'no_questions')
    return c.json(dailyState(day, guest))
  })

  /** Opens today's single attempt. The questions themselves are not sent: each prompt arrives when its question starts. */
  app.post('/api/daily/start', (c) => {
    const ip = clientIp(c)
    if (limited(ip)) return fail(c, 429, 'Too many requests. Slow down.', 'rate')
    const guest = guestOf(c)
    if (!guest) return fail(c, 400, 'Missing guest id.', 'guest')
    const t = now()
    const day = utcDay(t)
    const set = ensureDailySet(repo, day, t)
    if (!set) return fail(c, 503, 'There are not enough questions yet.', 'no_questions')
    const existing = repo.dailyPlay(day, guest)
    if (existing) {
      const play = settle(existing)
      return play.finishedAt !== null
        ? fail(c, 409, "You already played today's daily.", 'played')
        : fail(c, 409, 'Your daily run is still open in another window.', 'in_progress')
    }
    const fp = ipFingerprint(day, ip)
    if (perIp > 0 && !isLoopback(ip) && repo.dailyPlaysFromIp(day, fp) >= perIp) {
      return fail(c, 429, 'Too many daily runs from this network today.', 'ip_limit')
    }
    const run = repo.startDailyPlay(day, guest, set.questions, judge.kind, isLoopback(ip) ? null : fp, t)
    const body: StartRunResponse = {
      runId: run.id, count: run.questions.length, seconds, checker: judge.kind, mode: 'daily', day, number: dayNumber(epochDay(repo, day), day),
    }
    return c.json(body)
  })

  // ------------------------------------------------------------------ a run
  app.post('/api/run', (c) => {
    if (limited(clientIp(c))) return fail(c, 429, 'Too many requests. Slow down.', 'rate')
    const pool = repo.approvedHeads()
    if (pool.length < RUN_LENGTH) return fail(c, 503, 'There are not enough questions yet.', 'no_questions')
    const picked = pickRun(pool, rand)
    const run = repo.createRun(picked, judge.kind, now())
    const body: StartRunResponse = { runId: run.id, count: run.questions.length, seconds, checker: judge.kind, mode: 'solo' }
    return c.json(body)
  })

  /**
   * The browser says question `index` is on screen: this is when its clock starts, and the first time the player gets the prompt.
   * Questions must be started in order. Asking again for the same question gives the same prompt and does not restart the clock.
   */
  app.post('/api/run/:id/start', async (c) => {
    const run = repo.getRun(c.req.param('id'))
    if (!run) return fail(c, 404, 'Unknown run.')
    let body: { index?: unknown }
    try { body = await c.req.json() } catch { return fail(c, 400, 'Bad request.') }
    const index = Number(body.index)
    if (!Number.isInteger(index) || index < 0 || index >= run.questions.length) return fail(c, 400, 'Bad question number.')
    const q = run.questions[index]
    if (q.result) return fail(c, 409, 'That question is already finished.', 'finished')
    if (index > 0 && !run.questions[index - 1].result) return fail(c, 409, 'Finish the earlier question first.', 'order')
    const t = now()
    repo.markStarted(run.id, index, t)
    const after = repo.getRun(run.id)!.questions[index]
    const reply: StartQuestionResponse = {
      ok: true,
      secondsLeft: Math.max(0, (allowedMs(after) - (t - (after.startedAt ?? t))) / 1000),
      question: { id: after.id, category: after.category, prompt: after.prompt },
    }
    return c.json(reply)
  })

  app.post('/api/run/:id/answer', async (c) => {
    if (limited(clientIp(c))) return fail(c, 429, 'Too many answers. Slow down.', 'rate')
    const run = repo.getRun(c.req.param('id'))
    if (!run) return fail(c, 404, 'Unknown run.')
    let body: { index?: unknown; text?: unknown }
    try { body = await c.req.json() } catch { return fail(c, 400, 'Bad request.') }
    const index = Number(body.index)
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    if (!Number.isInteger(index) || index < 0 || index >= run.questions.length) return fail(c, 400, 'Bad question number.')
    if (!text || text.length > MAX_ANSWER_CHARS) return fail(c, 400, 'Answer must be 1 to 80 characters.')
    const q = run.questions[index]
    if (q.result) return fail(c, 409, 'That question is already finished.', 'finished')
    if (q.startedAt === null) return fail(c, 409, 'That question has not started.', 'not_started')
    const t0 = now()
    if (isLate(q, t0)) {
      repo.finishMiss(run.id, index, t0)
      finishIfComplete(run.id)
      return fail(c, 409, 'Time is up for this question.', 'late')
    }
    if (repo.attemptCount(run.id, index) >= MAX_ATTEMPTS_PER_QUESTION) return fail(c, 429, 'Too many tries on this question.', 'too_many')

    const { res, via } = await judge.judge(q, text)
    const t1 = now()
    repo.addBusy(run.id, index, t1 - t0)
    repo.logAttempt({ runId: run.id, idx: index, text, status: res.status, answer: res.answer, tier: res.tier, message: res.message, via, ms: t1 - t0, at: t1 })
    if (res.status === 'valid') {
      if (!repo.finishValid(run.id, index, { answer: res.answer ?? text, tier: res.tier ?? 0, points: res.points ?? 0 }, t1)) {
        return fail(c, 409, 'That question is already finished.', 'finished')
      }
      finishIfComplete(run.id)
    }
    return c.json(res)
  })

  /** The browser says time ran out. Idempotent; a finished question stays as it was. */
  app.post('/api/run/:id/miss', async (c) => {
    const run = repo.getRun(c.req.param('id'))
    if (!run) return fail(c, 404, 'Unknown run.')
    let body: { index?: unknown }
    try { body = await c.req.json() } catch { return fail(c, 400, 'Bad request.') }
    const index = Number(body.index)
    if (!Number.isInteger(index) || index < 0 || index >= run.questions.length) return fail(c, 400, 'Bad question number.')
    repo.finishMiss(run.id, index, now())
    finishIfComplete(run.id)
    return c.json({ ok: true })
  })

  /**
   * The player left (closed the tab, reloaded). A daily run ends there: what is not answered scores 0.
   * Solo runs are not tracked, so there is nothing to do. The browser sends this with sendBeacon, which cannot read the reply.
   */
  app.post('/api/run/:id/abandon', (c) => {
    const run = repo.getRun(c.req.param('id'))
    if (!run) return fail(c, 404, 'Unknown run.')
    if (run.mode === 'daily' && run.questions.some((q) => !q.result)) {
      repo.closeRun(run.id, now())
      finishIfComplete(run.id)
    }
    return c.json({ ok: true })
  })

  app.get('/api/run/:id', (c) => {
    const run = repo.getRun(c.req.param('id'))
    if (!run) return fail(c, 404, 'Unknown run.')
    return c.json({ total: runTotal(run), answered: run.questions.filter((q) => q.result).length })
  })

  return app
}

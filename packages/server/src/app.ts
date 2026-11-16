import { Hono, type Context } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import {
  MAX_POINTS, RUN_LENGTH, dayNumber, msToReset, streakOf, utcDay,
  type AnswerListItem, type AnswerListPage, type AnswersSummary, type DailyState, type RankResponse, type StartQuestionResponse, type StartRunResponse,
} from '@minitude/core'
import type { QuestionHead } from './questions'
import type { Judge, JudgeMode } from './judge/types'
import { ipFingerprint, isLoopback } from './clientip'
import { DAILY_MIN_FREE_BYTES, SOLO_MIN_FREE_BYTES } from './diskguard'
import { tidyTyped } from './sanitize'
import { normalize } from './normalize'
import { ensureDailySet, epochDay } from './daily'
import { POLICY_VERSION, runTotal, type DailyPlayRow, type Repo, type RunQuestionRow } from './db/repo'
import { VersusHub } from './versus'
import { mountVersus } from './versusRoutes'
import { mountSite } from './siteRoutes'

import { GRACE_MS, MAX_ATTEMPTS_PER_QUESTION, QUESTION_SECONDS, START_DELAY_MS } from './clock'
export { GRACE_MS, MAX_ATTEMPTS_PER_QUESTION, QUESTION_SECONDS, START_DELAY_MS }
/** a daily run with nothing happening for this long is treated as abandoned and closed (unanswered questions score 0) */
export const STALE_RUN_MS = 120_000
/** most daily runs one network may start per day (0 = no limit). Shared networks (schools, offices) need room. */
export const DAILY_PER_IP = 10
const MAX_ANSWER_CHARS = 80
/** the biggest request body the API reads. The largest real one is an answer or an idea (a few hundred bytes); a bigger one is an attack:
 *  the body is read into memory whole, and 80 MB sent to an earlier version of this server took it from 83 MB to 2.3 GB. */
export const MAX_BODY_BYTES = 8 * 1024
/** new solo runs the whole server starts in one UTC day. Each one adds about 1 KB to the database once SQLite has merged its journal (measured: 1,079 bytes), and anyone may ask for one. */
export const MAX_RUNS_PER_DAY = 20_000
/** new solo runs ONE network may start in a UTC day (0 = no limit), so that one person cannot use up the allowance above for everybody. A school
 *  or an office shares one address, hence generous: a real run takes minutes, so 300 is a whole classroom playing for hours. */
export const MAX_RUNS_PER_NETWORK_PER_DAY = 300
/** the routes that only move a run along (start, miss, abandon) are called a few times a minute by a real player; they get this many times the
 *  per-minute limit of the answer route, so a class on one address is fine, but a script is not */
const LIGHT_LIMIT_FACTOR = 3
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
  /** free bytes on the database's disk (see diskguard.ts); the default says "plenty" (tests and a database in memory) */
  freeBytes?: () => number
  /** new solo runs allowed per UTC day, for the whole server (0 = no limit) */
  maxRunsPerDay?: number
  /** new solo runs allowed per UTC day from one network (0 = no limit) */
  maxRunsPerNetworkPerDay?: number
  /** the multiplayer rooms. The server passes its own so it can move their clock along (`tick`); without one the app makes a private hub. */
  versus?: VersusHub
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
  const freeBytes = deps.freeBytes ?? (() => Infinity)
  const maxRunsPerDay = deps.maxRunsPerDay ?? MAX_RUNS_PER_DAY
  const runsToday = { day: '', n: 0 }
  const maxRunsPerNetwork = deps.maxRunsPerNetworkPerDay ?? MAX_RUNS_PER_NETWORK_PER_DAY
  const networkRuns = { day: '', by: new Map<string, number>() }
  const app = new Hono()
  // No CORS header on purpose: the game is served by this same server, so only its own pages ever call the API. (An earlier version let
  // every website call it from a visitor's browser.)
  app.use('/api/*', bodyLimit({ maxSize: MAX_BODY_BYTES, onError: (c) => c.json({ error: 'That request is too big.', code: 'too_big' }, 413) }))
  app.use('/api/*', async (c, next) => {
    await next()
    c.header('cache-control', 'no-store')
  })

  /** a limiter: true when this network has made more than `perMinute` calls in the last minute (each limiter counts for itself) */
  const makeLimiter = (perMinute: number) => {
    const hits = new Map<string, number[]>()
    return (ip: string): boolean => {
      const t = now()
      const arr = (hits.get(ip) ?? []).filter((x) => t - x < 60_000)
      arr.push(t)
      hits.set(ip, arr)
      if (hits.size > 5000) for (const [k, v] of hits) if (v.every((x) => t - x >= 60_000)) hits.delete(k)
      return arr.length > perMinute
    }
  }
  const limited = makeLimiter(limit)
  const limitedLight = makeLimiter(limit * LIGHT_LIMIT_FACTOR)
  const fail = (c: Context, status: 400 | 403 | 404 | 409 | 429 | 503, error: string, code?: string) => c.json({ error, ...(code ? { code } : {}) }, status)
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

  // Public, so it says nothing about how answers are checked (no model, no mock/real, no fallback): that stays on the server.
  app.get('/api/health', (c) => c.json({ ok: true, questions: repo.countByStatus().approved, policy: POLICY_VERSION }))

  /** how many gems each category holds (for the cabinet). Counts only: no prompts, no answers. */
  app.get('/api/gems', (c) => c.json(repo.gemSummary()))

  /**
   * Where a score ranks among every finished solo and Daily run on record (counts only, nothing about anyone). Equal scores share a rank.
   * `mine=1` says the score is already one of those runs; without it the score is counted as one more (a multiplayer match is not stored).
   */
  app.get('/api/rank', (c) => {
    if (limited(clientIp(c))) return fail(c, 429, 'Too many requests. Slow down.', 'rate')
    const raw = c.req.query('points') ?? ''
    const points = Number(raw)
    if (!/^\d{1,4}$/.test(raw) || points > MAX_POINTS) return fail(c, 400, 'Bad request.')
    const { runs, above } = repo.runsRank(points)
    const rank = above + 1
    const body: RankResponse = { rank, total: Math.max(rank, c.req.query('mine') === '1' ? runs : runs + 1) }
    return c.json(body)
  })

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
    // the Daily is the last thing to be refused when the disk fills up (new solo runs are refused much earlier)
    if (freeBytes() < DAILY_MIN_FREE_BYTES) return fail(c, 503, 'We are very busy right now. Please try again in a little while.', 'busy')
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
      runId: run.id, count: run.questions.length, seconds, mode: 'daily', day, number: dayNumber(epochDay(repo, day), day),
    }
    return c.json(body)
  })

  // ------------------------------------------------------------------ "what counted": every accepted answer of a Daily question, for the player who finished that Daily
  /**
   * The question `index` of the Daily `day` that this guest has FINISHED, or the error reply. Nothing about a question's answers is given before the
   * player has finished (and a guest only ever sees the Daily they played themselves).
   */
  const finishedDailyQuestion = (c: Context): { q: RunQuestionRow } | { err: Response } => {
    if (limited(clientIp(c))) return { err: fail(c, 429, 'Too many requests. Slow down.', 'rate') }
    const guest = guestOf(c)
    if (!guest) return { err: fail(c, 400, 'Missing guest id.', 'guest') }
    const day = c.req.query('day') ?? ''
    const index = Number(c.req.query('index'))
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isInteger(index) || index < 0 || index >= RUN_LENGTH) return { err: fail(c, 400, 'Bad request.') }
    let play = repo.dailyPlay(day, guest)
    if (!play) return { err: fail(c, 404, 'You did not play that Daily.', 'no_play') }
    play = settle(play)
    if (play.finishedAt === null) return { err: fail(c, 403, 'Finish your Daily first.', 'not_finished') }
    const q = repo.getRun(play.runId)?.questions[index]
    if (!q) return { err: fail(c, 404, 'Unknown question.') }
    return { q }
  }

  /** how many accepted answers each rarity holds for the question, and its gem */
  app.get('/api/daily/answers', (c) => {
    const found = finishedDailyQuestion(c)
    if ('err' in found) return found.err
    const q = found.q
    const counts = repo.answerTierCounts(q.id)
    const gem = repo.gemOf(q.id)
    const gemRow = gem ? repo.getAnswer(q.id, gem.answerNorm) : undefined
    if (gemRow) counts[gemRow.tier] = Math.max(0, counts[gemRow.tier] - 1)   // the gem is counted under SINGULARITY, not under its stored rarity
    const tiers = [...counts, gemRow ? 1 : 0].map((count, tier) => ({ tier, count }))
    const body: AnswersSummary = {
      question: { id: q.id, category: q.category, prompt: q.prompt },
      total: tiers.reduce((a, t) => a + t.count, 0),
      tiers,
      gem: gemRow ? { name: gemRow.name, description: gem?.description ?? gemRow.description ?? '' } : null,
    }
    return c.json(body)
  })

  /** a page of the accepted answers: one rarity (`tier`), or a search across all of them (`q`); A to Z, 100 at a time */
  app.get('/api/daily/answers/list', (c) => {
    const found = finishedDailyQuestion(c)
    if ('err' in found) return found.err
    const q = found.q
    const tierText = c.req.query('tier')
    const tier = tierText === undefined || tierText === '' ? null : Number(tierText)
    const text = (c.req.query('q') ?? '').trim()
    const offset = Math.max(0, Math.floor(Number(c.req.query('offset') ?? 0)) || 0)
    const limit = Math.min(200, Math.max(1, Math.floor(Number(c.req.query('limit') ?? 100)) || 100))
    if ((tier !== null && (!Number.isInteger(tier) || tier < 0 || tier > 6)) || text.length > 60 || (tier === null && !text)) return fail(c, 400, 'Bad request.')
    const gem = repo.gemOf(q.id)
    const gemRow = gem ? repo.getAnswer(q.id, gem.answerNorm) : undefined
    let page: AnswerListPage
    if (tier === 6) {
      // the gem alone
      const matches = !!gemRow && (!text || normalize(gemRow.name).includes(normalize(text)))
      page = { total: matches ? 1 : 0, offset: 0, items: matches && gemRow ? [{ name: gemRow.name, tier: 6 }] : [] }
    } else {
      // a rarity's own list leaves the gem out (it is under SINGULARITY); a search shows it, marked as the gem
      const { total, rows } = repo.answerPage(q.id, { tier, q: text, excludeNorm: tier !== null && gemRow ? gemRow.norm : null, offset, limit })
      const also = repo.aliasesFor(q.id, rows.map((r) => r.norm))
      const items: AnswerListItem[] = rows.map((r) => ({ name: r.name, tier: gemRow && r.norm === gemRow.norm ? 6 : r.tier, ...(also.get(r.norm) ? { also: also.get(r.norm) } : {}) }))
      page = { total, offset, items }
    }
    return c.json(page)
  })

  // ------------------------------------------------------------------ a run
  app.post('/api/run', (c) => {
    const ip = clientIp(c)
    if (limited(ip)) return fail(c, 429, 'Too many requests. Slow down.', 'rate')
    const pool = repo.approvedHeads()
    if (pool.length < RUN_LENGTH) return fail(c, 503, 'There are not enough questions yet.', 'no_questions')
    // Every solo run is a few rows in the database and anyone may ask for one, so there is a limit for the whole server per day, a limit
    // for each network (so one person cannot spend everybody's allowance), and a stop when the disk is nearly full: otherwise a script
    // could fill the disk and take the Daily down with it.
    const day = utcDay(now())
    if (runsToday.day !== day) { runsToday.day = day; runsToday.n = 0 }
    if ((maxRunsPerDay > 0 && runsToday.n >= maxRunsPerDay) || freeBytes() < SOLO_MIN_FREE_BYTES) {
      return fail(c, 503, 'We are very busy right now. Please try again in a little while.', 'busy')
    }
    if (maxRunsPerNetwork > 0 && !isLoopback(ip)) {
      if (networkRuns.day !== day) { networkRuns.day = day; networkRuns.by.clear() }
      const n = networkRuns.by.get(ip) ?? 0
      if (n >= maxRunsPerNetwork) return fail(c, 429, 'That is a lot of games from one network today. Please come back tomorrow.', 'ip_limit')
      if (n > 0 || networkRuns.by.size < 100_000) networkRuns.by.set(ip, n + 1) // the table is bounded: past 100,000 new networks a day it stops counting new ones
    }
    runsToday.n++
    const picked = pickRun(pool, rand)
    const run = repo.createRun(picked, judge.kind, now())
    const body: StartRunResponse = { runId: run.id, count: run.questions.length, seconds, mode: 'solo' }
    return c.json(body)
  })

  /**
   * The browser says question `index` is on screen: this is when its clock starts, and the first time the player gets the prompt.
   * Questions must be started in order. Asking again for the same question gives the same prompt and does not restart the clock.
   */
  app.post('/api/run/:id/start', async (c) => {
    if (limitedLight(clientIp(c))) return fail(c, 429, 'Too many requests. Slow down.', 'rate')
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
    let body: { index?: unknown; text?: unknown; confirm?: unknown }
    try { body = await c.req.json() } catch { return fail(c, 400, 'Bad request.') }
    const index = Number(body.index)
    const text = typeof body.text === 'string' ? tidyTyped(body.text) : '' // no control characters: the owner reads these in a terminal
    // 'yes' / 'no' answer the checker's "did you mean ...?"; without it a correction is only ever suggested, never applied
    const mode: JudgeMode = body.confirm === 'yes' ? 'confirmed' : body.confirm === 'no' ? 'literal' : 'ask'
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

    const { res, via } = await judge.judge(q, text, mode)
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
    if (limitedLight(clientIp(c))) return fail(c, 429, 'Too many requests. Slow down.', 'rate')
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
    if (limitedLight(clientIp(c))) return fail(c, 429, 'Too many requests. Slow down.', 'rate')
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

  // ------------------------------------------------------------------ multiplayer rooms (see versus.ts)
  const hub = deps.versus ?? new VersusHub({ judge, heads: () => repo.approvedHeads(), pick: pickRun, now, rand, seconds })
  mountVersus(app, { hub, guestOf, clientIp, now })

  // ------------------------------------------------------------------ the forms under the end-of-run report (see siteRoutes.ts)
  mountSite(app, { repo, clientIp, now })

  // an address under /api that does not exist (or a method that a route does not take) is an error, not the game's front page
  app.all('/api/*', (c) => c.json({ error: 'Not found.' }, 404))

  return app
}

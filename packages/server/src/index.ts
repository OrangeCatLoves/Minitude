import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { compress } from 'hono/compress'
import { addDays, utcDay } from '@minitude/core'
import { freeBytesOf } from './diskguard'
import { securityHeaders } from './securityHeaders'
import { createApp, pickRun, QUESTION_SECONDS } from './app'
import { VersusHub } from './versus'
import { backupIfDue } from './backup'
import { makeClientIp } from './clientip'
import { ensureDailySet } from './daily'
import { loadEnv } from './env'
import { defaultDbFile, openDb } from './db/open'
import { Repo } from './db/repo'
import { seedIfEmpty } from './bankio'
import { loadBank } from './questions'
import { PipelineJudge } from './judge/pipeline'

loadEnv()
const port = Number(process.env.PORT ?? 8787)
const file = defaultDbFile()
const repo = new Repo(openDb(file))
const seeded = seedIfEmpty(repo, loadBank(), Date.now())
// The live game never calls a language model: answers are checked against the answer lists built ahead of time (stored answers,
// their aliases, other ways of writing them, and slips that the player is asked about). test/nomodel.test.ts guards this.
const judge = new PipelineJudge(repo, null)

const clientIpHeader = process.env.CLIENT_IP_HEADER || undefined
/** a number from the environment, or undefined when it is not set (or not a number): the code's own default then applies. 0 usually means "no limit". */
const envNumber = (name: string): number | undefined => {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}
const versus = new VersusHub({ judge, heads: () => repo.approvedHeads(), pick: pickRun, now: Date.now, rand: Math.random, seconds: QUESTION_SECONDS })
const dbFolder = dirname(resolve(file))
const freeBytes = (): number => freeBytesOf(dbFolder)
// every limit below can be raised (or switched off with 0) on Fly with `fly secrets`-free settings in fly.toml [env]: see docs/SECURITY.md, "When you scale"
const api = createApp({
  repo, judge, versus, clientIp: makeClientIp(clientIpHeader), freeBytes,
  dailyPerIp: envNumber('DAILY_PER_IP'),
  maxRunsPerDay: envNumber('MAX_RUNS_PER_DAY'),
  maxRunsPerNetworkPerDay: envNumber('MAX_RUNS_PER_NETWORK_PER_DAY'),
  rateLimitPerMinute: envNumber('RATE_LIMIT_PER_MINUTE'),
})
const root = new Hono()
root.use('*', securityHeaders())
root.use('*', compress())
root.route('/', api)

// In production the built game is served from the same process.
const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'web', 'dist')
if (existsSync(join(dist, 'index.html'))) {
  // hashed scripts never change (cache for a year); the page itself must always be fresh; pictures and fonts for a day
  root.use('*', async (c, next) => {
    await next()
    const p = c.req.path
    if (p.startsWith('/api/') || c.res.status !== 200) return
    if (/-[A-Za-z0-9_-]{8}\.(js|css)$/.test(p)) c.header('cache-control', 'public, max-age=31536000, immutable')
    else if (!/\.[A-Za-z0-9]+$/.test(p) || p.endsWith('.html')) c.header('cache-control', 'no-cache')
    else c.header('cache-control', 'public, max-age=86400')
  })
  root.use('/*', serveStatic({ root: './' + join('..', 'web', 'dist').replace(/\\/g, '/') }))
  // the plain pages live at /privacy, /how-to-play and /about (the built files are privacy.html and so on); every other unknown address is the game
  for (const page of ['privacy', 'how-to-play', 'about']) {
    const served = serveStatic({ path: './' + join('..', 'web', 'dist', page + '.html').replace(/\\/g, '/') })
    root.get('/' + page, served)
    root.get('/' + page + '/', served)
  }
  root.get('*', serveStatic({ path: './' + join('..', 'web', 'dist', 'index.html').replace(/\\/g, '/') }))
}

/** a solo run left half way this long ago is deleted (a real run takes minutes) */
const ABANDONED_RUN_MS = 6 * 3_600_000
/** a solo run with no typed answer and no point, this old, is deleted */
const EMPTY_RUN_MS = 24 * 3_600_000
/** every hour: today's and tomorrow's daily sets exist (so the questions are fixed ahead of time), abandoned solo runs are cleared, and today's backup exists */
const backupDir = process.env.BACKUP_DIR || undefined
const keepBackups = Number(process.env.BACKUP_KEEP ?? 7)
async function housekeeping(): Promise<void> {
  const t = Date.now()
  try {
    ensureDailySet(repo, utcDay(t), t)
    ensureDailySet(repo, addDays(utcDay(t), 1), t)
  } catch (e) { console.error('daily set:', e instanceof Error ? e.message : e) }
  try {
    // solo runs that were started and left half way more than 6 hours ago (nobody plays on; the rank statistic does not count them)
    const gone = repo.purgeAbandonedRuns(t - ABANDONED_RUN_MS)
    if (gone > 0) console.log(`removed ${gone} abandoned solo runs`)
    // and solo runs from more than a day ago in which nothing was typed and nothing scored (see Repo.purgeEmptyRuns)
    const empty = repo.purgeEmptyRuns(t - EMPTY_RUN_MS)
    if (empty > 0) console.log(`removed ${empty} empty solo runs`)
  } catch (e) { console.error('run clean-up:', e instanceof Error ? e.message : e) }
  if (backupDir) {
    try {
      const made = await backupIfDue(repo.db, backupDir, t, Number.isFinite(keepBackups) && keepBackups > 0 ? keepBackups : 7, undefined, freeBytes)
      if (made) console.log(`backup written: ${made}`)
    } catch (e) { console.error('backup failed:', e instanceof Error ? e.message : e) }
  }
}

const server = serve({ fetch: root.fetch, port }, (info) => {
  const s = repo.stats()
  console.log(`Minitude server on http://localhost:${info.port}`)
  console.log(`  database: ${file}${seeded ? `  (new: ${seeded} seed questions added)` : ''}`)
  console.log(`  questions: ${s.questionsApproved} approved, ${s.questionsDraft} draft`)
  console.log('  answer checker: answer lists only (no language model in the live game)')
  console.log(`  client address from: ${clientIpHeader ? `header ${clientIpHeader}` : 'the connection'}`)
  console.log(`  backups: ${backupDir ? `${backupDir} (keeps ${keepBackups})` : 'off (set BACKUP_DIR)'}`)
})
void housekeeping()
setInterval(() => void housekeeping(), 3_600_000).unref()
// multiplayer: deadlines, slow reveals, vanished players (twice a second)
setInterval(() => { try { versus.tick() } catch (e) { console.error('versus tick:', e instanceof Error ? e.message : e) } }, 500).unref()

// Close the database cleanly when the host stops the machine (Fly sends SIGINT, Docker sends SIGTERM).
function stop(): void {
  console.log('stopping')
  setTimeout(() => process.exit(0), 4000).unref()
  server.close(() => {
    try { repo.db.close() } catch { /* already closed */ }
    process.exit(0)
  })
}
process.on('SIGTERM', stop)
process.on('SIGINT', stop)

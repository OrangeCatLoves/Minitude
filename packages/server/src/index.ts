import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { compress } from 'hono/compress'
import { secureHeaders } from 'hono/secure-headers'
import { addDays, utcDay } from '@minitude/core'
import { createApp } from './app'
import { backupIfDue } from './backup'
import { makeClientIp } from './clientip'
import { ensureDailySet } from './daily'
import { loadEnv } from './env'
import { defaultDbFile, openDb } from './db/open'
import { Repo } from './db/repo'
import { seedIfEmpty } from './bankio'
import { loadBank } from './questions'
import { PipelineJudge } from './judge/pipeline'
import { makeLlm } from './llm/factory'

loadEnv()
const port = Number(process.env.PORT ?? 8787)
const file = defaultDbFile()
const repo = new Repo(openDb(file))
const seeded = seedIfEmpty(repo, loadBank(), Date.now())
const { llm, describe } = makeLlm(repo)
const judge = new PipelineJudge(repo, llm)

const clientIpHeader = process.env.CLIENT_IP_HEADER || undefined
const dailyPerIp = process.env.DAILY_PER_IP !== undefined && process.env.DAILY_PER_IP !== '' ? Number(process.env.DAILY_PER_IP) : undefined
const api = createApp({ repo, judge, clientIp: makeClientIp(clientIpHeader), dailyPerIp: Number.isFinite(dailyPerIp) ? dailyPerIp : undefined })
const root = new Hono()
root.use('*', secureHeaders())
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
  root.get('*', serveStatic({ path: './' + join('..', 'web', 'dist', 'index.html').replace(/\\/g, '/') }))
}

/** every hour: today's and tomorrow's daily sets exist (so the questions are fixed ahead of time), and today's backup exists */
const backupDir = process.env.BACKUP_DIR || undefined
const keepBackups = Number(process.env.BACKUP_KEEP ?? 7)
async function housekeeping(): Promise<void> {
  const t = Date.now()
  try {
    ensureDailySet(repo, utcDay(t), t)
    ensureDailySet(repo, addDays(utcDay(t), 1), t)
  } catch (e) { console.error('daily set:', e instanceof Error ? e.message : e) }
  if (backupDir) {
    try {
      const made = await backupIfDue(repo.db, backupDir, t, Number.isFinite(keepBackups) && keepBackups > 0 ? keepBackups : 7)
      if (made) console.log(`backup written: ${made}`)
    } catch (e) { console.error('backup failed:', e instanceof Error ? e.message : e) }
  }
}

const server = serve({ fetch: root.fetch, port }, (info) => {
  const s = repo.stats()
  console.log(`Minitude server on http://localhost:${info.port}`)
  console.log(`  database: ${file}${seeded ? `  (new: ${seeded} seed questions added)` : ''}`)
  console.log(`  questions: ${s.questionsApproved} approved, ${s.questionsDraft} draft`)
  console.log(`  answer checker: ${describe}`)
  console.log(`  client address from: ${clientIpHeader ? `header ${clientIpHeader}` : 'the connection'}`)
  console.log(`  backups: ${backupDir ? `${backupDir} (keeps ${keepBackups})` : 'off (set BACKUP_DIR)'}`)
})
void housekeeping()
setInterval(() => void housekeeping(), 3_600_000).unref()

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

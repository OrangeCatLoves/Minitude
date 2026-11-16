import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { addDays, utcDay } from '@minitude/core'
import { BACKUP_MIN_SPARE_BYTES } from './diskguard'
import type { Db } from './db/open'

const PREFIX = 'minitude-'
const SUFFIX = '.db'
const NAME = /^minitude-\d{4}-\d{2}-\d{2}\.db$/
/** the copies made by hand with `db backup` (minitude-YYYYMMDD-HHMMSS.db) */
const MANUAL = /^minitude-\d{8}-\d{6}\.db$/
/** how many hand-made copies are kept: a safety copy before a release is only needed until the release has been checked */
export const KEEP_MANUAL = 2

/**
 * Keeps a copy of the database per UTC day in `dir` (minitude-YYYY-MM-DD.db) and deletes all but the newest `keep`.
 * Does nothing (returns null) when today's copy already exists. The copy is made with SQLite's own backup, so it is
 * consistent even while the game is running. Copies made by hand (`db backup`: minitude-YYYYMMDD-HHMMSS.db) are pruned
 * too, so that only the newest `keepManual` stay (four of them once took 334 MB of a 974 MB volume). Only files named
 * exactly like one of those two patterns are ever deleted. A copy as big as the database is only started when the disk would still have
 * `BACKUP_MIN_SPARE_BYTES` free afterwards: a copy that fills the disk would stop the game (it throws instead, and the caller logs it).
 */
export async function backupIfDue(db: Db, dir: string, now: number, keep = 7, keepManual = KEEP_MANUAL, freeBytes: () => number = () => Infinity): Promise<string | null> {
  mkdirSync(dir, { recursive: true })
  const dest = join(dir, `${PREFIX}${utcDay(now)}${SUFFIX}`)
  let made: string | null = null
  if (!existsSync(dest)) {
    let dbBytes = 0
    try { dbBytes = statSync(db.name).size } catch { /* a database in memory has no file */ }
    if (freeBytes() < dbBytes + BACKUP_MIN_SPARE_BYTES) throw new Error(`not enough free disk to copy the ${Math.round(dbBytes / 1e6)} MB database (${Math.round(freeBytes() / 1e6)} MB free)`)
    await db.backup(dest)
    made = dest
  }
  const old = readdirSync(dir).filter((f) => NAME.test(f)).sort().reverse().slice(Math.max(1, keep))
  for (const f of old) rmSync(join(dir, f), { force: true })
  const oldManual = readdirSync(dir).filter((f) => MANUAL.test(f)).sort().reverse().slice(Math.max(1, keepManual))
  for (const f of oldManual) rmSync(join(dir, f), { force: true })
  return made
}

/** the oldest day that is kept when `keep` copies are made one per day (for messages) */
export function oldestKept(now: number, keep: number): string {
  return addDays(utcDay(now), -(keep - 1))
}

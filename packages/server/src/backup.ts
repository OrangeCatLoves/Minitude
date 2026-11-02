import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { addDays, utcDay } from '@minitude/core'
import type { Db } from './db/open'

const PREFIX = 'minitude-'
const SUFFIX = '.db'
const NAME = /^minitude-\d{4}-\d{2}-\d{2}\.db$/

/**
 * Keeps a copy of the database per UTC day in `dir` (minitude-YYYY-MM-DD.db) and deletes all but the newest `keep`.
 * Does nothing (returns null) when today's copy already exists. The copy is made with SQLite's own backup, so it is
 * consistent even while the game is running. Only files named exactly like that are ever deleted.
 */
export async function backupIfDue(db: Db, dir: string, now: number, keep = 7): Promise<string | null> {
  mkdirSync(dir, { recursive: true })
  const dest = join(dir, `${PREFIX}${utcDay(now)}${SUFFIX}`)
  let made: string | null = null
  if (!existsSync(dest)) {
    await db.backup(dest)
    made = dest
  }
  const old = readdirSync(dir).filter((f) => NAME.test(f)).sort().reverse().slice(Math.max(1, keep))
  for (const f of old) rmSync(join(dir, f), { force: true })
  return made
}

/** the oldest day that is kept when `keep` copies are made one per day (for messages) */
export function oldestKept(now: number, keep: number): string {
  return addDays(utcDay(now), -(keep - 1))
}

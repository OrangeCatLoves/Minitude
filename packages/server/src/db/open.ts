import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MIGRATIONS } from './schema'

export type Db = Database.Database

/** where the database file lives unless DATABASE_FILE says otherwise */
export function defaultDbFile(): string {
  return process.env.DATABASE_FILE ?? join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'minitude.db')
}

export function migrate(db: Db): void {
  const current = Number(db.pragma('user_version', { simple: true }))
  if (current > MIGRATIONS.length) {
    throw new Error(`This database is from a newer version of Minitude (schema ${current}, this code knows ${MIGRATIONS.length}).`)
  }
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v])
      db.pragma(`user_version = ${v + 1}`)
    })()
  }
}

/** Open (and create / upgrade) the database. ':memory:' gives a throw-away database for tests. */
export function openDb(file: string = defaultDbFile()): Db {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true })
  const db = new Database(file)
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  if (file !== ':memory:') db.pragma('journal_mode = WAL')
  migrate(db)
  return db
}

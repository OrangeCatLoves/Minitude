import { describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { migrate } from '../src/db/open'
import { MIGRATIONS } from '../src/db/schema'

/**
 * Migration 6 (18 Nov 2026): Common 10 -> 20 and Uncommon 20 -> 30. Answers already scored are rescaled once by their tier, and the Daily totals are added up again,
 * so the rank statistic and the standings compare like with like.
 */
describe('the scoring migration', () => {
  it('rescales Common and Uncommon answers already stored, leaves the rest, and re-adds the Daily totals', () => {
    const db = new Database(':memory:')
    db.pragma('foreign_keys = OFF')
    for (let i = 0; i < 5; i++) db.exec(MIGRATIONS[i])
    db.pragma('user_version = 5')
    db.prepare("INSERT INTO runs (id, created_at, checker, policy_version, mode) VALUES ('r1', 1, 'x', 'v1', 'daily'), ('r2', 2, 'x', 'v1', 'solo')").run()
    const ins = db.prepare("INSERT INTO run_questions (run_id, idx, question_id, result, answer, tier, points) VALUES (?, ?, 'q', ?, 'a', ?, ?)")
    // r1: Common, Uncommon, Rare, Mythic, a miss, a gem, Exotic = 10 + 20 + 40 + 100 + 0 + 120 + 60
    ;[['valid', 0, 10], ['valid', 1, 20], ['valid', 2, 40], ['valid', 5, 100], ['miss', null, 0], ['valid', 6, 120], ['valid', 3, 60]].forEach(([r, t, p], i) => ins.run('r1', i, r, t, p))
    ;[['valid', 0, 10], ['valid', 0, 10]].forEach(([r, t, p], i) => ins.run('r2', i, r, t, p))
    db.prepare("INSERT INTO daily_sets (day, created_at) VALUES ('2026-11-17', 1)").run()
    db.prepare("INSERT INTO daily_plays (day, guest_id, run_id, started_at, finished_at, total) VALUES ('2026-11-17', 'g1', 'r1', 1, 2, 350)").run()
    migrate(db)
    expect(db.pragma('user_version', { simple: true })).toBe(MIGRATIONS.length)
    const pts = (run: string) => (db.prepare('SELECT points FROM run_questions WHERE run_id = ? ORDER BY idx').all(run) as { points: number }[]).map((r) => r.points)
    expect(pts('r1')).toEqual([20, 30, 40, 100, 0, 120, 60])
    expect(pts('r2')).toEqual([20, 20])
    expect((db.prepare("SELECT total FROM daily_plays WHERE run_id = 'r1'").get() as { total: number }).total).toBe(370)
    db.close()
  })
  it('is harmless on an empty database', () => {
    const db = new Database(':memory:')
    migrate(db)
    expect(db.pragma('user_version', { simple: true })).toBe(MIGRATIONS.length)
    db.close()
  })
})

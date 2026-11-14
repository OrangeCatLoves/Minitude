import { describe, expect, it } from 'vitest'
import { MAX_POINTS } from '@minitude/core'
import { createApp } from '../src/app'
import type { Repo } from '../src/db/repo'
import { PipelineJudge } from '../src/judge/pipeline'
import { testRepo } from './helpers'

function setup() {
  const repo: Repo = testRepo()
  const app = createApp({ repo, judge: new PipelineJudge(repo, null, () => 5_000), now: () => 5_000, rand: () => 0.3, rateLimitPerMinute: 10_000, clientIp: () => 'local' })
  const rank = async (query: string) => {
    const r = await app.request('/api/rank?' + query)
    return { status: r.status, json: (await r.json()) as any }
  }
  /** a run whose questions are all finished: a number is the points of a valid answer, null is a time-out */
  const run = (points: (number | null)[], mode: 'solo' | 'daily' = 'solo') => {
    const heads = repo.approvedHeads().slice(0, 7)
    const r = repo.createRun(heads, 'list', 1_000, mode)
    points.forEach((p, i) => { if (p === null) repo.finishMiss(r.id, i, 2_000); else repo.finishValid(r.id, i, { answer: 'x', tier: 0, points: p }, 2_000) })
    return r
  }
  /** a run with its first `n` questions finished and the rest not */
  const partial = (n: number) => {
    const r = run([])
    for (let i = 0; i < n; i++) repo.finishValid(r.id, i, { answer: 'x', tier: 5, points: 100 }, 2_000)
    return r
  }
  return { repo, rank, run, partial }
}
const seven = (total: number): (number | null)[] => [total, null, null, null, null, null, null]

describe('the rank of a score', () => {
  it('is first of one when nothing is on record yet', async () => {
    const { rank } = setup()
    expect((await rank('points=300&mine=1')).json).toEqual({ rank: 1, total: 1 })
    expect((await rank('points=300')).json).toEqual({ rank: 1, total: 1 })
  })
  it('counts the runs that scored more, and equal scores share a rank', async () => {
    const { rank, run } = setup()
    for (const t of [100, 300, 300, 500]) run(seven(t))
    expect((await rank('points=300&mine=1')).json).toEqual({ rank: 2, total: 4 })     // only the 500 is above
    expect((await rank('points=500&mine=1')).json).toEqual({ rank: 1, total: 4 })
    expect((await rank('points=100&mine=1')).json).toEqual({ rank: 4, total: 4 })     // three above
    expect((await rank('points=0&mine=1')).json).toEqual({ rank: 5, total: 5 })     // the total is never below the rank
  })
  it('a score that is not among the runs (a multiplayer match) is counted as one more', async () => {
    const { rank, run } = setup()
    for (const t of [100, 300, 300, 500]) run(seven(t))
    expect((await rank('points=300')).json).toEqual({ rank: 2, total: 5 })
    expect((await rank('points=600')).json).toEqual({ rank: 1, total: 5 })
    expect((await rank('points=50')).json).toEqual({ rank: 5, total: 5 })
  })
  it('adds up a run from every question (a time-out counts 0) and counts solo and Daily runs alike', async () => {
    const { rank, run } = setup()
    run([100, 80, 60, null, null, 10, 20])                    // 270
    run([10, 10, 10, 10, 10, 10, 10], 'daily')                // 70
    run([120, 120, 120, 120, 120, 120, 120])                  // 840
    expect((await rank('points=270&mine=1')).json).toEqual({ rank: 2, total: 3 })
    expect((await rank('points=70&mine=1')).json).toEqual({ rank: 3, total: 3 })
    expect((await rank('points=840&mine=1')).json).toEqual({ rank: 1, total: 3 })
  })
  it('does not count a run that was left half way', async () => {
    const { rank, run, partial } = setup()
    run(seven(200))
    partial(3)
    partial(6)
    partial(0)
    expect((await rank('points=200&mine=1')).json).toEqual({ rank: 1, total: 1 })
    expect((await rank('points=150&mine=1')).json).toEqual({ rank: 2, total: 2 })
  })
  it('refuses a score that is not a whole number from 0 to the most a run can score', async () => {
    const { rank } = setup()
    for (const bad of ['', 'points=', 'points=abc', 'points=-1', 'points=1.5', `points=${MAX_POINTS + 1}`, 'points=99999']) expect((await rank(bad)).status, bad).toBe(400)
    expect((await rank(`points=${MAX_POINTS}&mine=1`)).status).toBe(200)
    expect((await rank('points=0&mine=1')).status).toBe(200)
  })
  it('says nothing about anyone: only a rank and a count', async () => {
    const { rank, run } = setup()
    run(seven(300))
    const r = await rank('points=300&mine=1')
    expect(Object.keys(r.json).sort()).toEqual(['rank', 'total'])
  })
})

/**
 * "Where did my score rank among everyone's?": the words for the statistic on the page after a run. The count itself is the server's
 * (every finished solo and Daily run it has recorded): there are no accounts, so it counts dives, not people.
 */

/** the reply to "how does a score rank": equal scores share a rank (rank 1 = nobody scored more); `total` counts every finished dive, this one included */
export interface RankResponse {
  rank: number
  total: number
}

export interface RankText {
  /** the big part, e.g. "#12" */
  main: string
  /** the small line under it, e.g. "of 340 dives · top 4%" */
  sub: string
}

/** below this many dives a percentage says nothing */
export const RANK_PERCENT_FROM = 20

/** "top 4%": the share of dives that did at least as well, rounded up, never 0 */
export function topPercent(rank: number, total: number): number {
  if (total <= 0) return 100
  return Math.min(100, Math.max(1, Math.ceil((rank / total) * 100)))
}

const n = (x: number): string => x.toLocaleString('en-US')

export function rankText(rank: number, total: number): RankText {
  const r = Math.max(1, Math.floor(rank))
  const t = Math.max(r, Math.floor(total))
  const main = '#' + n(r)
  if (t <= 1) return { main, sub: 'the first dive recorded' }
  if (r === 1) return { main, sub: `the best of ${n(t)} dives so far` }
  return { main, sub: `of ${n(t)} dives` + (t >= RANK_PERCENT_FROM ? ` · top ${topPercent(r, t)}%` : '') }
}

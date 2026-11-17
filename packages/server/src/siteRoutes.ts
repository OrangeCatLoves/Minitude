/**
 * The two forms on the page under the end-of-run report: "how was that dive?" (a rating from 1 to 5) and "got an idea for a question?"
 * (a line of text). Both are open to anybody, so both are small, validated, and limited per network. Neither takes a name or an account,
 * and neither says anything about how the game works inside.
 */
import type { Context, Hono } from 'hono'
import { utcDay } from '@minitude/core'
import { ipFingerprint, isLoopback } from './clientip'
import type { Repo } from './db/repo'
import { cleanZone } from './regions'

export interface SiteRouteDeps {
  repo: Repo
  clientIp: (c: Context) => string
  now: () => number
  /** ideas one network may send per day (0 = no limit) */
  ideasPerDay?: number
  /** ratings one network may send per day (0 = no limit); generous, because a whole school can share one address */
  ratingsPerDay?: number
  /** unread ideas the database will hold before it asks people to come back later */
  maxUnread?: number
  /** visits one network may add to the count per day (0 = no limit); generous, because a school or an office shares one address */
  visitsPerNetworkPerDay?: number
}

export const VISITS_PER_NETWORK_PER_DAY = 300

/** programs that say what they are in their user agent: search crawlers, link previews, scripts, monitors, headless browsers. People are not them. */
const NOT_A_PERSON = /bot\b|crawl|spider|slurp|facebookexternalhit|preview|headless|phantom|lighthouse|pingdom|uptime|monitor|python|curl\/|wget|java\/|go-http|okhttp|axios|node-fetch|libwww|scrapy|httpclient|postman|insomnia/i

export const IDEA_MIN = 5
export const IDEA_MAX = 140
export const IDEAS_PER_DAY = 5
export const RATINGS_PER_DAY = 200
export const MAX_UNREAD_IDEAS = 5000

/** control characters and the two line-separator characters: none of them belongs in one line of text */
const CONTROL = new RegExp('[' + String.fromCharCode(0) + '-' + String.fromCharCode(31) + String.fromCharCode(127) + '-' + String.fromCharCode(159) + String.fromCharCode(8232) + String.fromCharCode(8233) + ']', 'g')

/** the text of an idea as it will be stored: no control characters, one space between words, no ends. Returns '' when nothing is left. */
export function tidyIdea(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw.normalize('NFC').replace(CONTROL, ' ').replace(/\s+/g, ' ').trim()
}

/** a link in an idea is almost always an advertisement */
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]{2,}\.(com|net|org|io|co|ru|cn|xyz|info|biz|shop|top|site|online)\b)/i

export function mountSite(app: Hono, d: SiteRouteDeps): void {
  const { repo } = d
  const ideasPerDay = d.ideasPerDay ?? IDEAS_PER_DAY
  const ratingsPerDay = d.ratingsPerDay ?? RATINGS_PER_DAY
  const maxUnread = d.maxUnread ?? MAX_UNREAD_IDEAS
  const hits = new Map<string, number[]>()
  /** at most 20 calls a minute from one address, for both forms together */
  const limited = (ip: string): boolean => {
    const t = d.now()
    const arr = (hits.get(ip) ?? []).filter((x) => t - x < 60_000)
    arr.push(t)
    hits.set(ip, arr)
    if (hits.size > 5000) for (const [k, v] of hits) if (v.every((x) => t - x >= 60_000)) hits.delete(k)
    return arr.length > 20
  }
  const fail = (c: Context, status: 400 | 404 | 429 | 503, error: string, code: string) => c.json({ error, code }, status)
  const body = async (c: Context): Promise<Record<string, unknown> | null> => {
    try {
      const b = (await c.req.json()) as unknown
      return b && typeof b === 'object' && !Array.isArray(b) ? (b as Record<string, unknown>) : null
    } catch {
      return null
    }
  }

  app.post('/api/rating', async (c) => {
    const ip = d.clientIp(c)
    if (limited(ip)) return fail(c, 429, 'Too many requests. Slow down.', 'rate')
    const b = await body(c)
    if (!b) return fail(c, 400, 'Bad request.', 'bad')
    const score = b.score
    if (typeof score !== 'number' || !Number.isInteger(score) || score < 1 || score > 5) return fail(c, 400, 'The score is a whole number from 1 to 5.', 'score')
    const t = d.now()
    const day = utcDay(t)
    const fp = isLoopback(ip) ? null : ipFingerprint(day, ip)
    if (fp && ratingsPerDay > 0 && repo.ratingsFrom(day, fp) >= ratingsPerDay) return fail(c, 429, 'Thanks, that is plenty for today.', 'limit')

    let runId: string | null = null
    let mode: 'solo' | 'daily' | 'versus'
    if (typeof b.runId === 'string' && b.runId) {
      // a solo or daily run: it must be a real run, and its own record says which kind it was
      const run = repo.getRun(b.runId)
      if (!run) return fail(c, 404, 'No such run.', 'run')
      runId = run.id
      mode = run.mode === 'daily' ? 'daily' : 'solo'
    } else {
      // a multiplayer match has no run of its own
      if (b.mode !== 'versus') return fail(c, 400, 'Bad request.', 'bad')
      mode = 'versus'
    }
    repo.addRating({ runId, mode, score, day, ipHash: fp, at: t })
    return c.json({ ok: true })
  })

  app.post('/api/suggest', async (c) => {
    const ip = d.clientIp(c)
    if (limited(ip)) return fail(c, 429, 'Too many requests. Slow down.', 'rate')
    const b = await body(c)
    if (!b) return fail(c, 400, 'Bad request.', 'bad')
    // a field that people cannot see: only a program fills it in. It is told "thanks" and nothing is kept.
    if (typeof b.website === 'string' && b.website.trim() !== '') return c.json({ ok: true })
    const text = tidyIdea(b.text)
    if ([...text].length < IDEA_MIN || !/\p{L}.*\p{L}.*\p{L}/u.test(text)) return fail(c, 400, 'Tell us a little more: what should the question ask?', 'short')
    if ([...text].length > IDEA_MAX) return fail(c, 400, `Please keep it under ${IDEA_MAX} characters.`, 'long')
    if (LINK.test(text)) return fail(c, 400, 'Please describe the question without a link.', 'link')
    const t = d.now()
    const day = utcDay(t)
    const fp = isLoopback(ip) ? null : ipFingerprint(day, ip)
    if (fp && ideasPerDay > 0 && repo.suggestionsFrom(day, fp) >= ideasPerDay) return fail(c, 429, 'You have sent a few already today. Come back tomorrow with more.', 'limit')
    if (repo.hasSuggestion(text)) return c.json({ ok: true }) // already have it: no need to say so
    if (repo.countSuggestions('new') >= maxUnread) return fail(c, 503, 'We are catching up on ideas. Please try again in a few days.', 'busy')
    repo.addSuggestion({ text, day, ipHash: fp, at: t })
    return c.json({ ok: true })
  })

  // The visit count (docs/TRAFFIC.md). The game calls this once per visit, after the page has been in view for a few seconds or the visitor has
  // touched it. Only a total per day and time zone is kept. The reply is always the same, so a program learns nothing about whether it was counted.
  const visitsPerNetwork = d.visitsPerNetworkPerDay ?? VISITS_PER_NETWORK_PER_DAY
  let countDay = ''
  let perNetwork = new Map<string, number>()
  app.post('/api/visit', async (c) => {
    const ip = d.clientIp(c)
    if (limited(ip)) return fail(c, 429, 'Too many requests. Slow down.', 'rate')
    const b = await body(c)
    if (!b) return fail(c, 400, 'Bad request.', 'bad')
    const t = d.now()
    const day = utcDay(t)
    const ua = c.req.header('user-agent') ?? ''
    // not counted, quietly: no user agent, a program that says it is one, or the developer's own machine
    if (!ua || NOT_A_PERSON.test(ua) || isLoopback(ip)) return c.json({ ok: true })
    // not counted once a network has added a lot today (one script on one address cannot inflate the numbers)
    if (day !== countDay) { countDay = day; perNetwork = new Map() }
    const fp = ipFingerprint(day, ip)
    const used = perNetwork.get(fp) ?? 0
    if (visitsPerNetwork > 0 && used >= visitsPerNetwork) return c.json({ ok: true })
    perNetwork.set(fp, used + 1)
    repo.addVisit(day, cleanZone(b.tz))
    return c.json({ ok: true })
  })
}

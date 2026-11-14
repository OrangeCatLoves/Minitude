/** Talks to the Minitude API. In development Vite proxies /api to the server; in production set VITE_API_BASE if it lives elsewhere. */
import type { AnswerListPage, AnswerResponse, AnswersSummary, DailyState, GemSummary, RankResponse, StartQuestionResponse, StartRunResponse, VEvent, VPublicRoom, VRoom, Visibility } from '@minitude/core'

const BASE: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''

async function call<T>(path: string, body?: unknown, timeoutMs = 20000, headers?: Record<string, string>): Promise<T> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const h: Record<string, string> = { ...headers }
    if (body !== undefined) h['content-type'] = 'application/json'
    const r = await fetch(BASE + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: h,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl.signal,
    })
    if (!r.ok) {
      let msg = `HTTP ${r.status}`
      let code: string | undefined
      try {
        const j = (await r.json()) as { error?: string; code?: string }
        msg = j.error ?? msg
        code = j.code
      } catch { /* not json */ }
      throw new ApiError(msg, r.status, code)
    }
    return (await r.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

export class ApiError extends Error {
  /** `code` is the server's short reason: 'late' (time is up), 'finished', 'not_started', 'too_many', 'played', 'in_progress', 'ip_limit', ... */
  constructor(message: string, readonly status: number, readonly code?: string) { super(message) }
}

// ------------------------------------------------------------------ the guest: a random id this browser keeps (no account, no name)
const GUEST_KEY = 'minitude.guest'
const GUEST_OK = /^[A-Za-z0-9_-]{16,64}$/
let memoryGuest: string | null = null

function makeGuestId(): string {
  const c = globalThis.crypto
  if (c?.randomUUID) return c.randomUUID()
  const b = new Uint8Array(16)
  if (c?.getRandomValues) c.getRandomValues(b)
  else for (let i = 0; i < b.length; i++) b[i] = Math.floor(Math.random() * 256)
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

/** The id is kept in this browser's storage. If storage is blocked it lasts until the page is closed. */
export function guestId(): string {
  try {
    const have = localStorage.getItem(GUEST_KEY)
    if (have && GUEST_OK.test(have)) return have
    const made = makeGuestId()
    localStorage.setItem(GUEST_KEY, made)
    return made
  } catch {
    return (memoryGuest ??= makeGuestId())
  }
}
const guestHeader = (): Record<string, string> => ({ 'x-guest': guestId() })

// ------------------------------------------------------------------ calls
/** where a score ranks among every finished solo and Daily run. `mine`: the score is already one of those runs (false for a multiplayer match, which is not stored). */
export const getRank = (points: number, mine: boolean): Promise<RankResponse> => call(`/api/rank?points=${Math.max(0, Math.round(points))}${mine ? '&mine=1' : ''}`, undefined, 8000)
export const startRun = (): Promise<StartRunResponse> => call('/api/run', {})
/** how many gems each category holds (counts only: no questions, no answers) */
export const getGemSummary = (): Promise<GemSummary> => call('/api/gems', undefined, 8000)
export const getDaily = (): Promise<DailyState> => call('/api/daily', undefined, 8000, guestHeader())
/** after finishing a Daily: how many accepted answers each rarity holds for question `index`, and its gem */
export const getDailyAnswers = (day: string, index: number): Promise<AnswersSummary> =>
  call(`/api/daily/answers?day=${encodeURIComponent(day)}&index=${index}`, undefined, 10000, guestHeader())
/** a page of the accepted answers of that question: one rarity (`tier`) or a search (`q`), A to Z */
export const getDailyAnswerList = (day: string, index: number, p: { tier?: number; q?: string; offset?: number; limit?: number }): Promise<AnswerListPage> => {
  const qs = new URLSearchParams({ day, index: String(index) })
  if (p.tier !== undefined) qs.set('tier', String(p.tier))
  if (p.q) qs.set('q', p.q)
  if (p.offset) qs.set('offset', String(p.offset))
  if (p.limit) qs.set('limit', String(p.limit))
  return call(`/api/daily/answers/list?${qs.toString()}`, undefined, 15000, guestHeader())
}
export const startDaily = (): Promise<StartRunResponse> => call('/api/daily/start', {}, 20000, guestHeader())
/** tells the server that question `index` is on screen: its clock starts now, and the prompt comes back in the reply */
export const sendStart = (runId: string, index: number): Promise<StartQuestionResponse> =>
  call(`/api/run/${encodeURIComponent(runId)}/start`, { index }, 8000)
/** `confirm` answers the checker's "did you mean ...?": 'yes' accepts the suggested answer, 'no' says the text is meant as typed */
export const sendAnswer = (runId: string, index: number, text: string, confirm?: 'yes' | 'no'): Promise<AnswerResponse> =>
  call(`/api/run/${encodeURIComponent(runId)}/answer`, confirm ? { index, text, confirm } : { index, text }, 35000)
/** "how was that dive?": a score from 1 to 5. A solo or daily run is rated by its id; a multiplayer match has none (mode 'versus'). */
export const sendRating = (score: number, runId: string | null): Promise<{ ok: boolean }> =>
  call('/api/rating', runId ? { runId, score } : { mode: 'versus', score }, 10000)
/** "got an idea for a question?": one line of text. `website` is a field people cannot see; it stays empty. */
export const sendIdea = (text: string, website = ''): Promise<{ ok: boolean }> => call('/api/suggest', { text, website }, 10000)
export const sendMiss = (runId: string, index: number): Promise<unknown> =>
  call(`/api/run/${encodeURIComponent(runId)}/miss`, { index }, 8000)

// ------------------------------------------------------------------ multiplayer rooms (the server's side: packages/server/src/versus.ts)
const vpath = (code: string, what: string) => `/api/versus/${encodeURIComponent(code)}/${what}`
export const vRooms = (): Promise<{ rooms: VPublicRoom[] }> => call('/api/versus/rooms', undefined, 8000)
export const vCreate = (name: string, visibility: Visibility): Promise<{ room: VRoom }> => call('/api/versus/create', { name, visibility }, 10000, guestHeader())
export const vJoin = (code: string, name: string): Promise<{ room: VRoom }> => call('/api/versus/join', { code, name }, 10000, guestHeader())
export const vLeave = (code: string): Promise<unknown> => call(vpath(code, 'leave'), {}, 8000, guestHeader())
export const vVisibility = (code: string, visibility: Visibility): Promise<{ room: VRoom }> => call(vpath(code, 'visibility'), { visibility }, 8000, guestHeader())
export const vStart = (code: string): Promise<{ room: VRoom }> => call(vpath(code, 'start'), {}, 8000, guestHeader())
export const vRematch = (code: string): Promise<{ room: VRoom }> => call(vpath(code, 'rematch'), {}, 8000, guestHeader())
export const vReady = (code: string, round: number): Promise<unknown> => call(vpath(code, 'ready'), { round }, 8000, guestHeader())
export const vMiss = (code: string, round: number): Promise<unknown> => call(vpath(code, 'miss'), { round }, 8000, guestHeader())
/** "my roll animation is over": only now does the server show my rarity to the other players */
export const vRevealed = (code: string, round: number): Promise<unknown> => call(vpath(code, 'revealed'), { round }, 8000, guestHeader())
export const vAnswer = (code: string, round: number, text: string, confirm?: 'yes' | 'no'): Promise<AnswerResponse> =>
  call(vpath(code, 'answer'), confirm ? { round, text, confirm } : { round, text }, 35000, guestHeader())

/** The page is closing: leave the room (works while the page unloads). The server also notices a vanished player by itself after a while. */
export function vLeaveBeacon(code: string): void {
  const url = `${BASE}${vpath(code, 'leave')}`
  try { void fetch(url, { method: 'POST', keepalive: true, headers: { ...guestHeader(), 'content-type': 'application/json' }, body: '{}' }) } catch { /* nothing more to try */ }
}

export type StreamState = 'open' | 'retrying' | 'closed'

/**
 * Opens the player's live connection to a room. The server first sends everything it knows (`sync`), then every change as it happens.
 * It uses fetch, not EventSource, because the player's id must travel in a header and EventSource cannot send one. If the connection
 * drops it opens again (the server then sends `sync` again, so nothing is lost). It stops for good when the server says the player is
 * not in the room any more. Returns the function that closes it.
 */
export function openRoomStream(code: string, onEvent: (e: VEvent) => void, onState: (s: StreamState) => void): () => void {
  let stopped = false
  let ctl: AbortController | null = null
  let lastByte = Date.now()
  const watchdog = setInterval(() => { if (!stopped && Date.now() - lastByte > 40_000) ctl?.abort() }, 10_000)
  const finish = (): void => { stopped = true; clearInterval(watchdog); ctl?.abort(); onState('closed') }
  const run = async (): Promise<void> => {
    let tries = 0
    while (!stopped) {
      ctl = new AbortController()
      try {
        const r = await fetch(BASE + vpath(code, 'events'), { headers: guestHeader(), signal: ctl.signal, cache: 'no-store' })
        if (r.status === 404 || r.status === 400) { finish(); return }
        if (!r.ok || !r.body) throw new Error('stream refused')
        tries = 0
        lastByte = Date.now()
        onState('open')
        const reader = r.body.getReader()
        const dec = new TextDecoder()
        let buf = ''
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          lastByte = Date.now()
          buf += dec.decode(value, { stream: true })
          let i: number
          while ((i = buf.indexOf('\n\n')) >= 0) {
            const block = buf.slice(0, i)
            buf = buf.slice(i + 2)
            const name = /^event: (.*)$/m.exec(block)?.[1]
            const data = /^data: (.*)$/m.exec(block)?.[1]
            if (!name || name === 'ping' || data === undefined) continue
            let ev: VEvent
            try { ev = JSON.parse(data) as VEvent } catch { continue }
            onEvent(ev)
            if (ev.type === 'closed') { finish(); return }
          }
        }
      } catch { /* dropped or refused: try again below */ }
      if (stopped) return
      onState('retrying')
      await new Promise((res) => setTimeout(res, Math.min(5000, 500 * 2 ** tries++)))
    }
  }
  void run()
  return () => { if (!stopped) { stopped = true; clearInterval(watchdog); ctl?.abort() } }
}

/** The page is closing: tell the server the daily run is over (works while the page unloads). */
export function sendAbandon(runId: string): void {
  const url = `${BASE}/api/run/${encodeURIComponent(runId)}/abandon`
  try {
    if (navigator.sendBeacon?.(url)) return
  } catch { /* fall through */ }
  try { void fetch(url, { method: 'POST', keepalive: true }) } catch { /* nothing more to try */ }
}

/** Talks to the Minitude API. In development Vite proxies /api to the server; in production set VITE_API_BASE if it lives elsewhere. */
import type { AnswerResponse, DailyState, StartQuestionResponse, StartRunResponse } from '@minitude/core'

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
export const startRun = (): Promise<StartRunResponse> => call('/api/run', {})
export const getDaily = (): Promise<DailyState> => call('/api/daily', undefined, 8000, guestHeader())
export const startDaily = (): Promise<StartRunResponse> => call('/api/daily/start', {}, 20000, guestHeader())
/** tells the server that question `index` is on screen: its clock starts now, and the prompt comes back in the reply */
export const sendStart = (runId: string, index: number): Promise<StartQuestionResponse> =>
  call(`/api/run/${encodeURIComponent(runId)}/start`, { index }, 8000)
/** `confirm` answers the checker's "did you mean ...?": 'yes' accepts the suggested answer, 'no' says the text is meant as typed */
export const sendAnswer = (runId: string, index: number, text: string, confirm?: 'yes' | 'no'): Promise<AnswerResponse> =>
  call(`/api/run/${encodeURIComponent(runId)}/answer`, confirm ? { index, text, confirm } : { index, text }, 35000)
export const sendMiss = (runId: string, index: number): Promise<unknown> =>
  call(`/api/run/${encodeURIComponent(runId)}/miss`, { index }, 8000)

/** The page is closing: tell the server the daily run is over (works while the page unloads). */
export function sendAbandon(runId: string): void {
  const url = `${BASE}/api/run/${encodeURIComponent(runId)}/abandon`
  try {
    if (navigator.sendBeacon?.(url)) return
  } catch { /* fall through */ }
  try { void fetch(url, { method: 'POST', keepalive: true }) } catch { /* nothing more to try */ }
}

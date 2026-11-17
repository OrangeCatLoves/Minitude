/**
 * The visit count (docs/TRAFFIC.md): tells the server, once per visit, that somebody has the game open, and from which time zone.
 * It sends the browser's time zone ("Asia/Singapore") and nothing else, to this site's own server only. No cookie, no storage, no identifier.
 *
 * It waits until the page has really been in view for a few seconds, or the visitor touches it, so that a page that opens in a background tab and
 * closes at once is not counted. A browser that says it is automated (navigator.webdriver) sends nothing. Counting happens once per page load.
 */
import { sendVisit } from './api'

/** seconds the page must have been in view (or the visitor touches it first) before the visit is counted */
export const VISIT_AFTER_SECONDS = 5

/** the time zone this browser reports, or '' when it will not say */
export function browserZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || '' } catch { return '' }
}

/** starts the count for this page load; returns a function that stops it (used by tests) */
export function trackVisit(send: (tz: string) => Promise<unknown> = sendVisit): () => void {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined
  if (nav?.webdriver) return () => {}
  let seen = 0           // seconds in view so far
  let done = false
  const stops: (() => void)[] = []
  const finish = (): void => {
    if (done) return
    done = true
    stops.forEach((s) => s())
    void Promise.resolve(send(browserZone())).catch(() => { /* a missed count is nothing to tell the visitor */ })
  }
  const events = ['pointerdown', 'keydown', 'touchstart', 'wheel']
  for (const e of events) { window.addEventListener(e, finish, { passive: true, once: true }); stops.push(() => window.removeEventListener(e, finish)) }
  const timer = setInterval(() => {
    if (document.visibilityState === 'visible') seen += 1
    if (seen >= VISIT_AFTER_SECONDS) finish()
  }, 1000)
  stops.push(() => clearInterval(timer))
  return () => { done = true; stops.forEach((s) => s()) }
}

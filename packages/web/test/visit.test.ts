import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { browserZone, trackVisit, VISIT_AFTER_SECONDS } from '../src/visit'

// The visit count (docs/TRAFFIC.md) in a pretend browser: a page that has been in view for a few seconds, or has been touched, counts once;
// a hidden page, an automated browser and a page that is left at once do not.
let listeners: Map<string, Set<() => void>>
let doc: { visibilityState: string }
let nav: { webdriver: boolean }

beforeEach(() => {
  vi.useFakeTimers()
  listeners = new Map()
  doc = { visibilityState: 'visible' }
  nav = { webdriver: false }
  vi.stubGlobal('window', {
    addEventListener: (e: string, f: () => void) => { (listeners.get(e) ?? listeners.set(e, new Set()).get(e)!).add(f) },
    removeEventListener: (e: string, f: () => void) => { listeners.get(e)?.delete(f) },
  })
  vi.stubGlobal('document', doc)
  vi.stubGlobal('navigator', nav)
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

const fire = (e: string): void => { for (const f of [...(listeners.get(e) ?? [])]) f() }

describe('the visit count in the browser', () => {
  it('counts a visit once the page has been in view for a few seconds, and only once', async () => {
    const send = vi.fn(async () => ({ ok: true }))
    trackVisit(send)
    vi.advanceTimersByTime((VISIT_AFTER_SECONDS - 1) * 1000)
    expect(send).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(send).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(120_000)
    fire('pointerdown')
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('sends the browser time zone and nothing else', () => {
    const send = vi.fn(async () => ({ ok: true }))
    trackVisit(send)
    fire('keydown')
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0]).toEqual([browserZone()])
    expect(browserZone()).toMatch(/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$|^$/)
  })

  it('counts at once when the visitor touches the page, whichever way', () => {
    for (const e of ['pointerdown', 'keydown', 'touchstart', 'wheel']) {
      const send = vi.fn(async () => ({ ok: true }))
      const stop = trackVisit(send)
      fire(e)
      expect(send, e).toHaveBeenCalledTimes(1)
      stop()
    }
  })

  it('does not count time while the page is hidden (a background tab)', () => {
    const send = vi.fn(async () => ({ ok: true }))
    trackVisit(send)
    doc.visibilityState = 'hidden'
    vi.advanceTimersByTime(60_000)
    expect(send).not.toHaveBeenCalled()
    doc.visibilityState = 'visible'
    vi.advanceTimersByTime(VISIT_AFTER_SECONDS * 1000)
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('sends nothing from a browser that says it is automated', () => {
    nav.webdriver = true
    const send = vi.fn(async () => ({ ok: true }))
    trackVisit(send)
    vi.advanceTimersByTime(60_000)
    fire('pointerdown')
    expect(send).not.toHaveBeenCalled()
  })

  it('does not count a page that is left before the wait is over, and can be stopped', () => {
    const send = vi.fn(async () => ({ ok: true }))
    const stop = trackVisit(send)
    vi.advanceTimersByTime(2000)
    stop()
    vi.advanceTimersByTime(60_000)
    fire('pointerdown')
    expect(send).not.toHaveBeenCalled()
  })

  it('does not bother the visitor when the count cannot be sent', async () => {
    const send = vi.fn(async () => { throw new Error('offline') })
    trackVisit(send)
    fire('pointerdown')
    await Promise.resolve()
    await Promise.resolve()
    expect(send).toHaveBeenCalledTimes(1)
  })
})

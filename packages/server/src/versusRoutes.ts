/** The HTTP side of multiplayer. Plain requests for actions, one Server-Sent Events stream per player for everything the server pushes. */
import type { Context, Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { VEvent } from '@minitude/core'
import { VersusError, type VersusHub } from './versus'

export interface VersusRouteDeps {
  hub: VersusHub
  guestOf: (c: Context) => string | null
  clientIp: (c: Context) => string
  now: () => number
  /** requests per minute per network address across all multiplayer calls (the list of rooms is polled, so this is generous) */
  perMinute?: number
}

/** how often a quiet connection is sent a keep-alive, so proxies do not close it */
export const KEEPALIVE_MS = 15_000

export function mountVersus(app: Hono, d: VersusRouteDeps): void {
  const limit = d.perMinute ?? 300
  const hits = new Map<string, number[]>()
  const limited = (ip: string): boolean => {
    const t = d.now()
    const arr = (hits.get(ip) ?? []).filter((x) => t - x < 60_000)
    arr.push(t)
    hits.set(ip, arr)
    if (hits.size > 5000) for (const [k, v] of hits) if (v.every((x) => t - x >= 60_000)) hits.delete(k)
    return arr.length > limit
  }

  /** runs one action: needs a guest id, is rate limited, and turns the hub's refusals into a JSON error */
  const act = async (c: Context, fn: (guest: string, body: Record<string, unknown>) => unknown | Promise<unknown>, withBody = true): Promise<Response> => {
    const guest = d.guestOf(c)
    if (!guest) return c.json({ error: 'Missing guest id.', code: 'guest' }, 400)
    if (limited(d.clientIp(c))) return c.json({ error: 'Too many requests. Slow down.', code: 'rate' }, 429)
    let body: Record<string, unknown> = {}
    if (withBody) {
      try { body = ((await c.req.json()) ?? {}) as Record<string, unknown> } catch { return c.json({ error: 'Bad request.' }, 400) }
      if (typeof body !== 'object' || Array.isArray(body)) return c.json({ error: 'Bad request.' }, 400)
    }
    try {
      return c.json((await fn(guest, body)) ?? { ok: true })
    } catch (e) {
      if (e instanceof VersusError) return c.json({ error: e.message, code: e.code }, e.status)
      throw e
    }
  }
  const round = (b: Record<string, unknown>): number => {
    const n = Number(b.round)
    if (!Number.isInteger(n) || n < 0 || n > 20) throw new VersusError('Bad question number.', 400, 'round')
    return n
  }

  app.get('/api/versus/rooms', (c) => {
    if (limited(d.clientIp(c))) return c.json({ error: 'Too many requests. Slow down.', code: 'rate' }, 429)
    return c.json({ rooms: d.hub.listPublic() })
  })
  app.post('/api/versus/create', (c) => act(c, (g, b) => ({ room: d.hub.create(g, b.name, b.visibility) })))
  app.post('/api/versus/join', (c) => act(c, (g, b) => ({ room: d.hub.join(g, b.code, b.name) })))
  app.post('/api/versus/:code/leave', (c) => act(c, (g) => { d.hub.leave(g, c.req.param('code')) }, false))
  app.post('/api/versus/:code/visibility', (c) => act(c, (g, b) => ({ room: d.hub.setVisibility(g, c.req.param('code'), b.visibility) })))
  app.post('/api/versus/:code/start', (c) => act(c, (g) => ({ room: d.hub.start(g, c.req.param('code')) }), false))
  app.post('/api/versus/:code/rematch', (c) => act(c, (g) => ({ room: d.hub.rematch(g, c.req.param('code')) }), false))
  app.post('/api/versus/:code/ready', (c) => act(c, (g, b) => { d.hub.ready(g, c.req.param('code'), round(b)) }))
  app.post('/api/versus/:code/miss', (c) => act(c, (g, b) => { d.hub.miss(g, c.req.param('code'), round(b)) }))
  app.post('/api/versus/:code/answer', (c) => act(c, async (g, b) => {
    const text = typeof b.text === 'string' ? b.text.trim() : ''
    if (!text || text.length > 80) throw new VersusError('Answer must be 1 to 80 characters.', 400, 'text')
    const confirm = b.confirm === 'yes' || b.confirm === 'no' ? b.confirm : undefined
    return d.hub.answer(g, c.req.param('code'), round(b), text, confirm)
  }))

  /** the player's live connection: first `sync` (the whole state), then every change, and a keep-alive while it is quiet */
  app.get('/api/versus/:code/events', (c) => {
    const guest = d.guestOf(c)
    if (!guest) return c.json({ error: 'Missing guest id.', code: 'guest' }, 400)
    if (limited(d.clientIp(c))) return c.json({ error: 'Too many requests. Slow down.', code: 'rate' }, 429)
    const code = c.req.param('code')
    if (!d.hub.hasSeat(guest, code)) return c.json({ error: 'You are not in that room.', code: 'no_room' }, 404)
    c.header('x-accel-buffering', 'no')
    return streamSSE(c, async (stream) => {
      let open = true
      let chain: Promise<void> = Promise.resolve()
      // writes are queued one after another so events arrive in order
      const write = (event: string, data: string): void => {
        chain = chain.then(() => (open ? stream.writeSSE({ event, data }) : undefined)).catch(() => { open = false })
      }
      const send = (ev: VEvent): void => write(ev.type, JSON.stringify(ev))
      const close = d.hub.subscribe(guest, code, send)
      const done = new Promise<void>((resolve) => stream.onAbort(() => { open = false; resolve() }))
      void done.then(close)
      while (open) {
        await Promise.race([stream.sleep(KEEPALIVE_MS), done])
        if (open) write('ping', '1')   // the browser ignores it; it only keeps proxies from closing a quiet connection
      }
      close()
    })
  })
}

import { createHash } from 'node:crypto'
import { getConnInfo } from '@hono/node-server/conninfo'
import type { Context } from 'hono'

/** addresses of the machine itself (development): never counted against the per-network limits */
export function isLoopback(ip: string): boolean {
  return ip === 'local' || ip === '::1' || ip.startsWith('127.') || ip.startsWith('::ffff:127.')
}

/**
 * Who is calling? `headerName` is the header the host's front door sets to the real address (CLIENT_IP_HEADER):
 * 'fly-client-ip' on Fly.io, 'cf-connecting-ip' behind Cloudflare. Without it the address of the connection is used.
 * Only name a header that the front door overwrites: a header the visitor can set themselves would let them pick their own address.
 */
export function makeClientIp(headerName: string | undefined): (c: Context) => string {
  const h = headerName?.trim().toLowerCase() || undefined
  return (c) => {
    if (h) {
      const v = c.req.header(h)
      if (v) return v.split(',')[0].trim()
    }
    try {
      return getConnInfo(c).remote.address ?? 'local'
    } catch {
      return 'local'
    }
  }
}

/** a short fingerprint of (day, address): enough to count runs per network, no address is kept, and it cannot be followed across days */
export function ipFingerprint(day: string, ip: string): string {
  return createHash('sha256').update(`${day}|${ip}`).digest('hex').slice(0, 16)
}

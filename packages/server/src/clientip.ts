import { createHash } from 'node:crypto'
import { getConnInfo } from '@hono/node-server/conninfo'
import type { Context } from 'hono'

/** addresses of the machine itself (development): never counted against the per-network limits */
export function isLoopback(ip: string): boolean {
  return ip === 'local' || ip === '::1' || ip.startsWith('127.') || ip.startsWith('::ffff:127.')
}

/**
 * The "network" an address belongs to, as the limits count it. An IPv4 address is its own network. An IPv6 address is cut to its first
 * 64 bits (the /64 that an ISP gives to one home or office): a visitor on IPv6 can use billions of addresses inside it, so counting
 * whole addresses would give them a fresh quota on every request. An IPv4-mapped IPv6 address ("::ffff:1.2.3.4") is the IPv4 one.
 * Anything it cannot read is returned as it came.
 */
export function networkOf(ip: string): string {
  const s = ip.trim().toLowerCase().replace(/%.*$/, '') // a zone id ("fe80::1%eth0") is not part of the address
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(s)
  if (mapped) return mapped[1]
  if (!s.includes(':') || s.includes('.')) return s // IPv4, "local", or an odd form we leave alone
  const halves = s.split('::')
  if (halves.length > 2) return s
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  let groups: string[]
  if (halves.length === 2) groups = [...head, ...Array<string>(Math.max(0, 8 - head.length - tail.length)).fill('0'), ...tail]
  else groups = head
  if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return s
  return groups.slice(0, 4).map((g) => g.padStart(4, '0')).join(':') + '::/64'
}

/**
 * Who is calling? `headerName` is the header the host's front door sets to the real address (CLIENT_IP_HEADER):
 * 'fly-client-ip' on Fly.io, 'cf-connecting-ip' behind Cloudflare. Without it the address of the connection is used.
 * The result is the caller's network (`networkOf`), except for the machine itself, which keeps its address (see `isLoopback`).
 * Only name a header that the front door overwrites: a header the visitor can set themselves would let them pick their own address.
 */
export function makeClientIp(headerName: string | undefined): (c: Context) => string {
  const h = headerName?.trim().toLowerCase() || undefined
  const network = (ip: string): string => (isLoopback(ip) ? ip : networkOf(ip))
  return (c) => {
    if (h) {
      const v = c.req.header(h)
      if (v) return network(v.split(',')[0].trim())
    }
    try {
      return network(getConnInfo(c).remote.address ?? 'local')
    } catch {
      return 'local'
    }
  }
}

/** a short fingerprint of (day, address): enough to count runs per network, no address is kept, and it cannot be followed across days */
export function ipFingerprint(day: string, ip: string): string {
  return createHash('sha256').update(`${day}|${ip}`).digest('hex').slice(0, 16)
}

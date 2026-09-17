import { isIP } from 'node:net'

import { json } from './http'

/** A bounded per-instance backstop; distributed limits live in function config. */
const WINDOW_MS = 60_000
const MAX_CLIENTS = 5000
const requests = new Map<string, { count: number; expires: number }>()
let nextSweep = 0

/** Never use client-controlled X-Forwarded-For to identify a rate-limit bucket. */
export function getClientIp(req: Request, platformIp?: string): string {
  const ip = platformIp || req.headers.get('x-nf-client-connection-ip') || ''
  return isIP(ip) ? ip : ''
}

/** The unit a limit is counted against.
 *
 *  IPv6 IS BUCKETED BY /64, NOT BY ADDRESS. A residential IPv6 allocation is a
 *  /64 at minimum and usually a /56 — one household, one phone, one VPS, all
 *  holding 2^64 addresses they can source traffic from at will. Counting per
 *  address therefore gives an IPv6 client an effectively unlimited supply of
 *  fresh buckets, which is not a limit at all; the same attacker over IPv4
 *  would have to find real addresses. The /64 is the smallest block that is
 *  reliably one subscriber, so it is the honest unit. IPv4 is used whole. */
export function rateLimitKey(ip: string): string {
  if (isIP(ip) !== 6) return ip
  const address = ip.toLowerCase().split('%')[0]
  // An IPv4-mapped or IPv4-compatible address (::ffff:203.0.113.10) is one IPv4
  // host wearing IPv6 notation. Its top four hextets are all zero, so bucketing
  // it by /64 would file every such address under a single key — the exact
  // collapse this function exists to prevent. Count the embedded address.
  const embedded = /(\d{1,3}(?:\.\d{1,3}){3})$/.exec(address)
  if (embedded) return embedded[1]
  // `::` stands for an unknown number of zero groups, so the address has to be
  // expanded to its eight hextets before the first four can be taken.
  const [head, tail = ''] = address.split('::')
  const left = head ? head.split(':') : []
  const right = tail ? tail.split(':') : []
  const groups = address.includes('::')
    ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right]
    : left
  return `${groups.slice(0, 4).map(group => group.replace(/^0+(?=.)/, '')).join(':')}::/64`
}

/** Free a slot so one new client can be tracked.
 *
 *  THE TABLE MUST NEVER REFUSE ON BEHALF OF SOMEONE ELSE. Rejecting whoever
 *  arrives once the map is full turns a memory bound into a denial of service:
 *  an attacker rotating source addresses fills 5000 slots in one window, and
 *  every genuine visitor after that is told to come back later. Evicting the
 *  oldest bucket instead keeps the bound and keeps the site up. The cost of
 *  eviction is that a flooder can age out a legitimate counter — far cheaper
 *  than the alternative, and the distributed limits in each function's config
 *  are what actually hold the line under that kind of load.
 *
 *  Eviction is O(1) because a Map iterates in insertion order and `set` on an
 *  existing key does not reorder it: with one fixed window length, first-seen
 *  order and expiry order are the same order. */
function pruneClients(now: number): void {
  if (now >= nextSweep) {
    for (const [key, entry] of requests) if (entry.expires <= now) requests.delete(key)
    nextSweep = now + WINDOW_MS
  }
  while (requests.size >= MAX_CLIENTS) {
    const oldest = requests.keys().next()
    if (oldest.done) break
    requests.delete(oldest.value)
  }
}

function tooManyRequests(retryAt: number, now: number): Response {
  const response = json({ error: 'Too many requests. Please wait a moment and try again.' }, 429)
  response.headers.set('retry-after', String(Math.max(1, Math.ceil((retryAt - now) / 1000))))
  return response
}

/** THE PATHNAME IS NOT PART OF THE KEY, AND MUST NOT BECOME PART OF IT AGAIN.
 *
 *  It used to be, and that was a bypass: the request path is attacker-supplied
 *  text, so `/API/request-quote`, `/api/request-quote/` and
 *  `/api/request-quote//` each minted a FRESH counter for the same caller —
 *  verified, three of four tried variants sailed past an exhausted limit. Any
 *  hop that routes case-insensitively or tolerates a trailing slash turns the
 *  limit off for whoever noticed.
 *
 *  Nothing is lost by dropping it. Netlify's esbuild bundles each function
 *  separately, so this module — and this Map — already exist once per function,
 *  and the path was never distinguishing anything within one of them. */
export function checkRateLimit(req: Request, platformIp?: string, limit = 10): Response | null {
  const now = Date.now()
  const client = getClientIp(req, platformIp)
  // An unidentifiable caller shares one bucket with every other unidentifiable
  // caller. That is deliberately harsh: it cannot be widened by withholding the
  // address, which is the only thing an attacker could do to reach this branch.
  const key = client ? rateLimitKey(client) : 'unknown'
  let entry = requests.get(key)
  if (entry && entry.expires <= now) { requests.delete(key); entry = undefined }
  if (!entry) {
    pruneClients(now)
    entry = { count: 0, expires: now + WINDOW_MS }
  }
  if (entry.count >= limit) return tooManyRequests(entry.expires, now)
  entry.count++
  requests.set(key, entry)
  return null
}

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

function clearExpired(now: number): void {
  if (now >= nextSweep) {
    for (const [key, entry] of requests) if (entry.expires <= now) requests.delete(key)
    nextSweep = now + WINDOW_MS
  }
}

function tooManyRequests(retryAt: number, now: number): Response {
  const response = json({ error: 'Too many requests. Please wait a moment and try again.' }, 429)
  response.headers.set('retry-after', String(Math.max(1, Math.ceil((retryAt - now) / 1000))))
  return response
}

export function checkRateLimit(req: Request, platformIp?: string, limit = 10): Response | null {
  const now = Date.now()
  clearExpired(now)
  const key = `${new URL(req.url).pathname}:${getClientIp(req, platformIp) || 'unknown'}`
  let entry = requests.get(key)
  if (entry && entry.expires <= now) { requests.delete(key); entry = undefined }
  if (!entry) {
    if (requests.size >= MAX_CLIENTS) return tooManyRequests(now + WINDOW_MS, now)
    entry = { count: 0, expires: now + WINDOW_MS }
  }
  if (entry.count >= limit) return tooManyRequests(entry.expires, now)
  entry.count++
  requests.set(key, entry)
  return null
}

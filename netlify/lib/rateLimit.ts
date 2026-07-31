// ---------------------------------------------------------------------------
// Simple in-memory rate limiter for POST endpoints.
//
// Netlify functions are stateless across invocations, so this uses a time-decay
// approach: store the timestamp of each request in a map, and reject if too many
// fall within the window. The map is scoped to a single function instance, which
// means it resets on cold starts — but that is acceptable for abuse prevention
// (not authentication), and avoids the complexity of an external store.
//
// For production high-traffic sites, consider Netlify's built-in rate limiting
// or an external service like Upstash Redis.
// ---------------------------------------------------------------------------

const WINDOW_MS = 60_000
const MAX_REQUESTS = 5

const requests = new Map<string, number[]>()

/** Returns the client IP from the request, falling back to a default. */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

/** Check if a request should be rate-limited. Returns null if allowed, or a
 *  Response with 429 and Retry-After header if blocked. */
export function checkRateLimit(req: Request): Response | null {
  const ip = getClientIp(req)
  const now = Date.now()

  const timestamps = requests.get(ip) ?? []
  const recent = timestamps.filter((t) => now - t < WINDOW_MS)

  if (recent.length >= MAX_REQUESTS) {
    const oldestInWindow = Math.min(...recent)
    const retryAfter = Math.ceil((oldestInWindow + WINDOW_MS - now) / 1000)
    return new Response(
      JSON.stringify({
        error: 'Too many requests. Please wait a moment and try again.',
      }),
      {
        status: 429,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'retry-after': String(Math.max(1, retryAfter)),
          'cache-control': 'no-store',
        },
      },
    )
  }

  recent.push(now)
  requests.set(ip, recent)

  if (requests.size > 10_000) {
    const cutoff = now - WINDOW_MS
    for (const [k, v] of requests) {
      const live = v.filter((t) => t > cutoff)
      if (live.length === 0) requests.delete(k)
      else requests.set(k, live)
    }
  }

  return null
}

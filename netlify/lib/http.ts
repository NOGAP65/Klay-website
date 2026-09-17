import { randomUUID } from 'node:crypto'

const responseHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  // An API response is data, never a document. If a bug — or a proxy — ever
  // causes one of these bodies to be treated as HTML, this denies it every
  // capability it would need to matter: no script, no subresources, no framing.
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'; sandbox",
  'x-frame-options': 'DENY',
}

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: responseHeaders })

export const badRequest = (message: string, fields?: Record<string, string>) =>
  json({ error: message, fields }, 400)

export const methodNotAllowed = (allow: string) =>
  new Response(JSON.stringify({ error: `Method not allowed. Use ${allow}.` }), {
    status: 405, headers: { ...responseHeaders, allow },
  })

export function notConfigured(missingVars: string[]): Response {
  console.error('[configuration] missing required settings', missingVars.join(', '))
  return json({ error: 'This service is temporarily unavailable. Please contact us or try again later.' }, 503)
}

/** Do not log raw SDK errors: they can contain request bodies, addresses or tokens. */
export function serverError(where: string, _err: unknown): Response {
  const ref = randomUUID()
  console.error(`[${where}] ref=${ref}`)
  return json({ error: 'Something went wrong on our end. Please try again.', ref }, 500)
}

/** Origins this deployment will accept form posts from.
 *
 *  DERIVED FROM CONFIGURATION, NOT FROM THE REQUEST. Comparing `Origin` against
 *  `new URL(req.url).origin` alone is a Host-header trust: `req.url` is built
 *  from the incoming Host (or X-Forwarded-Host), so an attacker who can get a
 *  forged Host through any hop makes the two sides of the comparison agree with
 *  each other and the check passes on a request that came from their page.
 *  Pinning to the site's own configured addresses removes the request from both
 *  sides of the comparison. Netlify sets URL and DEPLOY_PRIME_URL itself, so
 *  branch and preview deploys keep working without anyone widening this.
 *
 *  The request's own origin is used only when nothing is configured at all,
 *  which is the local `netlify dev` case. */
function allowedOrigins(req: Request): Set<string> {
  const origins = new Set<string>()
  for (const key of ['SITE_URL', 'URL', 'DEPLOY_PRIME_URL', 'DEPLOY_URL']) {
    const configured = process.env[key]?.trim()
    if (!configured) continue
    try { origins.add(new URL(configured).origin) } catch { /* Unparseable configuration grants nothing. */ }
  }
  if (origins.size === 0) origins.add(new URL(req.url).origin)
  return origins
}

/** CSRF defence for browser form APIs. Webhooks authenticate with signatures instead. */
export function checkSameOrigin(req: Request): Response | null {
  const refuse = json({ error: 'Please submit this form from the Klay website.' }, 403)
  // Every browser that can reach this endpoint sends Sec-Fetch-Site. When it is
  // present it is authoritative and unforgeable from script, so anything but a
  // first-party fetch is refused before the Origin comparison is even reached.
  const site = req.headers.get('sec-fetch-site')
  if (site !== null && site !== 'same-origin') return refuse
  const origin = req.headers.get('origin')
  if (origin === null || !allowedOrigins(req).has(origin)) return refuse
  return null
}

export const MAX_JSON_BYTES = 256 * 1024

function checkBodyHeaders(req: Request, maxBytes: number): Response | null {
  const declared = req.headers.get('content-length')
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) {
    return json({ error: 'The submitted request is too large.' }, 413)
  }
  if (req.headers.get('content-encoding') && req.headers.get('content-encoding') !== 'identity') {
    return json({ error: 'Unsupported request encoding.' }, 415)
  }
  return null
}

/** Count actual streamed bytes; Content-Length alone can be absent or dishonest. */
export async function readBody(req: Request, maxBytes = MAX_JSON_BYTES): Promise<string | Response> {
  const error = checkBodyHeaders(req, maxBytes)
  if (error) return error
  if (!req.body) return ''
  const reader = req.body.getReader()
  const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })
  let size = 0
  let text = ''
  let timedOut = false
  const timeout = setTimeout(() => { timedOut = true; void reader.cancel().catch(() => undefined) }, 10_000)
  try {
    for (;;) {
      const chunk = await reader.read()
      if (timedOut) return json({ error: 'The request took too long. Please try again.' }, 408)
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > maxBytes) {
        void reader.cancel().catch(() => undefined)
        return json({ error: 'The submitted request is too large.' }, 413)
      }
      text += decoder.decode(chunk.value, { stream: true })
    }
    return text + decoder.decode()
  } catch {
    return badRequest('Could not read the submitted request.')
  } finally { clearTimeout(timeout); reader.releaseLock() }
}

export async function readJson(req: Request): Promise<Record<string, unknown> | Response> {
  if (req.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return json({ error: 'Please submit JSON data.' }, 415)
  }
  const raw = await readBody(req)
  if (raw instanceof Response) return raw
  try {
    const body: unknown = JSON.parse(raw)
    if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>
  } catch { /* Malformed JSON is a client error, never a server crash. */ }
  return badRequest('Expected a JSON object.')
}

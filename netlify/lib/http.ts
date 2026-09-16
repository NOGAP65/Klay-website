import { randomUUID } from 'node:crypto'

const responseHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
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

/** CSRF defence for browser form APIs. Webhooks authenticate with signatures instead. */
export function checkSameOrigin(req: Request): Response | null {
  const origin = req.headers.get('origin')
  if (req.headers.get('sec-fetch-site') === 'cross-site' || origin !== new URL(req.url).origin) {
    return json({ error: 'Please submit this form from the Klay website.' }, 403)
  }
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

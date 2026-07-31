// ---------------------------------------------------------------------------
// Small HTTP helpers shared by the functions.
//
// These endpoints are same-origin (the SPA and the functions are served from
// one Netlify site), so there is deliberately no permissive CORS here — adding
// `Access-Control-Allow-Origin: *` to an endpoint that writes to the database
// would let any site on the internet post through it.
// ---------------------------------------------------------------------------

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })

export const badRequest = (message: string, fields?: Record<string, string>) =>
  json({ error: message, fields }, 400)

export const methodNotAllowed = (allow: string) =>
  new Response(JSON.stringify({ error: `Method not allowed. Use ${allow}.` }), {
    status: 405,
    headers: { 'content-type': 'application/json; charset=utf-8', allow },
  })

/** A capability is not configured on this deploy. 503 rather than 500 — the
 *  code is fine, the deploy is incomplete, and the message says what to add. */
export const notConfigured = (missingVars: string[]) =>
  json(
    {
      error: 'This feature is not configured yet.',
      detail: `Set ${missingVars.join(', ')} in the Netlify environment variables.`,
    },
    503,
  )

/** Never leak an internal error message to the browser. Log the real one and
 *  hand back something generic with an id the logs can be searched for. */
export function serverError(where: string, err: unknown): Response {
  const ref = Math.random().toString(36).slice(2, 8)
  console.error(`[${where}] ref=${ref}`, err)
  return json({ error: 'Something went wrong on our end. Please try again.', ref }, 500)
}

/** Parse a JSON body without letting a malformed one throw past the handler. */
export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json()
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null
  } catch {
    return null
  }
}

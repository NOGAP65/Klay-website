import { json, notConfigured } from './http'

export function checkHoneypot(body: Record<string, unknown>): Response | null {
  return typeof body.website === 'string' && body.website.trim()
    ? json({ ok: true, id: 'dropped' }) : null
}

const loopback = (hostname: string) => ['localhost', '127.0.0.1', '[::1]'].includes(hostname)

function allowedHostnames(): Set<string> {
  const configured = process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? ''
  const hosts = new Set(configured.split(',').map(h => h.trim().toLowerCase()).filter(Boolean))
  for (const key of ['SITE_URL', 'URL', 'DEPLOY_PRIME_URL']) {
    try { if (process.env[key]) hosts.add(new URL(process.env[key]!).hostname) } catch { /* Invalid configuration stays denied. */ }
  }
  return hosts
}

function verificationConfig(hostname: string): { secret: string } | Response | null {
  const isHosted = process.env.NETLIFY === 'true' || process.env.NODE_ENV === 'production'
  const isLocal = !isHosted && loopback(hostname)
  if (isLocal && process.env.TURNSTILE_LOCAL_BYPASS === 'true') return null
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim()
  if (!secret || (isHosted && /^[123]x0{10,}/.test(secret))) return notConfigured(['TURNSTILE_SECRET_KEY'])
  if (!isLocal && !allowedHostnames().has(hostname)) return notConfigured(['TURNSTILE_ALLOWED_HOSTNAMES'])
  return { secret }
}

function isVerified(result: unknown, hostname: string): boolean {
  if (!result || typeof result !== 'object') return false
  const verified = result as Record<string, unknown>
  return verified.success === true && verified.hostname === hostname && verified.action === 'customer_form'
}

/** Verification is mandatory on hosted deployments, including Netlify previews.
 * Only an explicit local-development flag on a loopback URL permits a bypass. */
export async function verifyTurnstile(
  body: Record<string, unknown>, clientIp: string, req: Request,
): Promise<Response | null> {
  const hostname = new URL(req.url).hostname
  const settings = verificationConfig(hostname)
  if (settings === null || settings instanceof Response) return settings

  const token = body.turnstileToken
  if (typeof token !== 'string' || token.length < 1 || token.length > 2048) {
    return json({ error: 'Please complete the verification challenge.' }, 400)
  }
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', signal: AbortSignal.timeout(8_000),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: settings.secret, response: token, ...(clientIp ? { remoteip: clientIp } : {}) }),
    })
    if (!response.ok) throw new Error('Verification service unavailable')
    const result: unknown = await response.json()
    if (!isVerified(result, hostname)) {
      return json({ error: 'Verification expired or failed. Please try again.' }, 400)
    }
    return null
  } catch {
    console.error('[antispam] verification unavailable; request refused')
    return json({ error: 'We could not verify your request just now. Please try again in a moment.' }, 503)
  }
}

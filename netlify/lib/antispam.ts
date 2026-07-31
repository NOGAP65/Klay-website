// ---------------------------------------------------------------------------
// Anti-spam measures: honeypot and Cloudflare Turnstile verification.
//
// The honeypot is a hidden field that bots typically fill in. If populated, we
// silently drop the request (returning success so the bot doesn't know).
//
// Turnstile is Cloudflare's privacy-preserving CAPTCHA alternative. The client
// includes a token in the request, and we verify it server-side before
// processing. If the site key is not configured, verification is skipped —
// this allows development without Turnstile but production should have it.
// ---------------------------------------------------------------------------

import { json } from './http'

/** Check if the honeypot field was filled (indicates a bot). Returns a fake
 *  success response if so, null otherwise. */
export function checkHoneypot(body: Record<string, unknown>): Response | null {
  if (typeof body.website === 'string' && body.website.trim().length > 0) {
    console.log('[antispam] honeypot triggered, silently dropping request')
    return json({ ok: true, id: 'dropped' })
  }
  return null
}

/** Verify a Cloudflare Turnstile token. Returns null if valid, or an error
 *  Response if invalid. Skips verification if TURNSTILE_SECRET_KEY is not set. */
export async function verifyTurnstile(
  body: Record<string, unknown>,
  clientIp: string,
): Promise<Response | null> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim()
  if (!secret) {
    return null
  }

  const token = typeof body.turnstileToken === 'string' ? body.turnstileToken : ''
  if (!token) {
    return json({ error: 'Please complete the verification challenge.' }, 400)
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: clientIp,
      }),
    })

    const result = (await response.json()) as { success: boolean; 'error-codes'?: string[] }
    if (!result.success) {
      console.log('[antispam] turnstile verification failed', result['error-codes'])
      return json({ error: 'Verification failed. Please try again.' }, 400)
    }

    return null
  } catch (err) {
    console.error('[antispam] turnstile verification error', err)
    return null
  }
}

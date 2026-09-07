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
//
// WHAT HAPPENS WHEN CLOUDFLARE ITSELF CANNOT BE REACHED IS NOW A DECISION THE
// CALLER MAKES, and it used to be a silent `return null` — a pass — buried in a
// catch block. That is CWE-636, Not Failing Securely, and OWASP gave the whole
// family its own category in 2025: A10, Mishandling of Exceptional Conditions.
// A network blip between here and challenges.cloudflare.com turned the captcha
// off for the duration, and nothing anywhere said so.
//
// There is no single correct answer to it, which is exactly why it is a
// parameter rather than a default:
//
//   'closed'  refuse the request. Correct where the downside of a bot getting
//             through is worse than the downside of a real customer being told
//             to try again — anything that touches money.
//   'open'    allow the request, and log it loudly. Correct where losing the
//             submission is the greater harm. A blocked enquiry is a customer
//             who goes elsewhere and never tells you.
//
// Both are honest; neither is safe in the abstract. The point is that the
// choice is now written at each call site instead of being inherited from
// whatever the catch block happened to do.
// ---------------------------------------------------------------------------

import { json } from './http'

/** What to do when the verification service cannot be reached at all. This is
 *  NOT about a failed challenge — a token that Cloudflare rejects is always a
 *  refusal. It is only about being unable to ask. */
export type OnVerifyUnavailable = 'closed' | 'open'

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
  onUnavailable: OnVerifyUnavailable,
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
    // COULD NOT ASK. Not a failed challenge — a failed conversation.
    console.error(
      `[antispam] turnstile unreachable, failing ${onUnavailable.toUpperCase()}`,
      err,
    )
    if (onUnavailable === 'open') return null
    return json(
      { error: 'We could not verify your request just now. Please try again in a moment.' },
      503,
    )
  }
}

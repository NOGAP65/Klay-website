// ---------------------------------------------------------------------------
// Server-side environment, read once and checked before use.
//
// Everything here is secret and lives only in Netlify's env vars — none of it
// is prefixed VITE_, so Vite will not inline any of it into the browser bundle.
// That distinction is the whole security boundary: VITE_* is public, these are
// not. Do not rename one of these to VITE_ANYTHING.
//
// Missing configuration is reported as a clear 503 by the callers rather than
// throwing at import time, because a half-configured deploy should still serve
// a diagnosable error instead of a blank 502.
// ---------------------------------------------------------------------------

export interface ServerEnv {
  supabaseUrl: string
  supabaseServiceKey: string
  stripeSecretKey: string
  stripeWebhookSecret: string
  resendApiKey: string
  notifyTo: string
  notifyFrom: string
  siteUrl: string
}

const read = (key: string): string => process.env[key]?.trim() ?? ''

/** Names of the vars that must be set for a given capability, so the error
 *  message can say precisely what to add in Netlify rather than "misconfigured". */
export const REQUIRED = {
  database: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  payments: ['STRIPE_SECRET_KEY'],
  webhook: ['STRIPE_WEBHOOK_SECRET'],
  email: ['RESEND_API_KEY'],
} as const

export function env(): ServerEnv {
  return {
    supabaseUrl: read('SUPABASE_URL'),
    supabaseServiceKey: read('SUPABASE_SERVICE_ROLE_KEY'),
    stripeSecretKey: read('STRIPE_SECRET_KEY'),
    stripeWebhookSecret: read('STRIPE_WEBHOOK_SECRET'),
    resendApiKey: read('RESEND_API_KEY'),
    // Where the internal "new enquiry" alerts land.
    notifyTo: read('KLAY_NOTIFY_TO') || 'vedant@nogap.net.au',
    // Must be on a domain verified in Resend, or sends are rejected.
    notifyFrom: read('KLAY_NOTIFY_FROM') || 'Klay Interiors <onboarding@resend.dev>',
    // Used to build Stripe's success/cancel URLs. URL is injected by Netlify.
    siteUrl: read('SITE_URL') || read('URL') || 'http://localhost:8888',
  }
}

/** Returns the list of missing var names for a capability — empty means good. */
export function missing(e: ServerEnv, capability: keyof typeof REQUIRED): string[] {
  const map: Record<string, string> = {
    SUPABASE_URL: e.supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: e.supabaseServiceKey,
    STRIPE_SECRET_KEY: e.stripeSecretKey,
    STRIPE_WEBHOOK_SECRET: e.stripeWebhookSecret,
    RESEND_API_KEY: e.resendApiKey,
  }
  return REQUIRED[capability].filter((k) => !map[k])
}

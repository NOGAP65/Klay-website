// ---------------------------------------------------------------------------
// THE ONLY FILE IN src/ THAT READS import.meta.env.
//
// SPECIFICATION.md §3 and §7. Everything else imports a named, typed constant
// from here, so there is exactly one file to read to know what ships to the
// browser. Enforced by `klay/no-direct-env-access`, which is off for this file
// and on everywhere else.
//
// WHY THAT BOUNDARY IS WORTH A FILE. Vite inlines `import.meta.env.VITE_*` at
// build time and nothing else. A variable read directly in a component fails
// silently when it turns out not to be VITE_-prefixed — `undefined` at runtime
// rather than an error at build — and once twenty files read the environment
// directly, nobody can answer "what does the browser know?" without grepping.
//
// ---------------------------------------------------------------------------
// ON VALIDATION, AND WHY NOTHING THROWS TODAY.
//
// §3 says this file "validates on module load and throws loudly if a required
// variable is missing". `requireEnv` below is that mechanism, and REQUIRED is
// currently empty — deliberately, and not as an oversight.
//
// There is exactly one client-side environment variable in this application,
// VITE_TURNSTILE_SITE_KEY, and it is OPTIONAL BY DESIGN. The Turnstile widget
// returns null without it (components/Turnstile.tsx), and the server skips
// verification to match (netlify/lib/antispam.ts:31-34). That pairing is what
// lets the site run locally, and on a preview deploy, without a captcha.
//
// Throwing on it would turn a deliberate configuration into a white screen.
// So it is exposed as `string | undefined` alongside an explicit
// `isTurnstileEnabled`, and callers branch on the boolean rather than on a
// truthiness check against a secret-shaped string.
//
// WHEN A GENUINELY REQUIRED CLIENT VARIABLE APPEARS, add it to REQUIRED and it
// will throw at module load with its own name in the message — which is the
// first thing anyone will read when the app fails to boot.
// ---------------------------------------------------------------------------

/** Client variables that must be present for the app to function at all.
 *
 *  Empty today. See the note above: the only client variable this application
 *  has is optional by design, and the server is configured to agree with that. */
const REQUIRED: readonly string[] = [];

/** Reads a variable, or throws naming it. Only used for REQUIRED entries. */
function requireEnv(name: string): string {
  const value = import.meta.env[name as keyof ImportMetaEnv] as string | undefined;
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Set it in .env for local work and in Netlify → Site configuration → ` +
        `Environment variables for a deploy. See .env.example.`,
    );
  }
  return value.trim();
}

/** Reads a variable that is allowed to be absent. Empty string is treated as
 *  absent — an unset Netlify variable and a variable set to nothing should not
 *  behave differently. */
function optionalEnv(name: string): string | undefined {
  const value = import.meta.env[name as keyof ImportMetaEnv] as string | undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

// Runs at module load. With REQUIRED empty this is a no-op; it is here so that
// adding a name to REQUIRED is the only edit needed to make it enforced.
for (const name of REQUIRED) requireEnv(name);

// --- the client environment -------------------------------------------------

/** Cloudflare Turnstile site key. PUBLIC by design — a site key is meant to be
 *  in the page, and the widget cannot render without it being there. The
 *  matching secret key is server-side only and lives in netlify/lib/antispam. */
export const turnstileSiteKey: string | undefined = optionalEnv('VITE_TURNSTILE_SITE_KEY');

/** Whether the captcha is configured on this deploy.
 *
 *  Prefer this to checking `turnstileSiteKey` for truthiness at a call site:
 *  the question a component is asking is "is verification switched on?", not
 *  "is this string non-empty", and the two only happen to coincide. */
export const isTurnstileEnabled: boolean = turnstileSiteKey !== undefined;

/** Vite's own mode flags, re-exported so that nothing else needs to reach for
 *  `import.meta.env` to ask what environment it is running in. */
export const isDevelopment: boolean = import.meta.env.DEV;
export const isProduction: boolean = import.meta.env.PROD;

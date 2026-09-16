// This is the only browser module that reads environment configuration.
// Use explicit property access: dynamic import.meta.env[name] can bundle every
// VITE_ variable, including one mistakenly added by a deploy administrator.
const configuredSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();

/** Public widget key. Its absence must not stop browsing; hosted form APIs
 * independently refuse submissions when verification is unconfigured. */
export const turnstileSiteKey: string | undefined = configuredSiteKey || undefined;
export const isTurnstileEnabled: boolean = turnstileSiteKey !== undefined;

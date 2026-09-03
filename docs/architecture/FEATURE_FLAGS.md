# FEATURE FLAGS, KILL SWITCHES AND READY-STYLE CONSTANTS

**Audited 3 September 2026, after the wardrobe path bug** — a defect that sat behind
`ROOM_VIEW_READY = false` and could not be seen by any check in the project, because nothing
executed the code. Instance 9 in `docs/runbooks/verifying-source-transforms.md` sets out the class.

> **The question this document exists to answer: what else is waiting?**
>
> **Code behind an off flag is unverified code**, however green the build. Every entry below
> records what the flag gates, whether the code behind it has ever run, and what checks it while
> it waits.

---

## THE INVENTORY

**Five gates. One is a true feature flag; the rest are configuration-derived.**

| # | Gate | Kind | Where | Has the code behind it run? |
|---:|---|---|---|---|
| **F-1** | `ROOM_VIEW_READY` | **Feature flag, hardcoded `false`** | `visualiser/KlayConfigurator.tsx:30` | **NO — never, in production or dev** |
| **F-2** | `isTurnstileEnabled` | Config-derived, client | `config/env.ts:82` | **Locally no. In production, unknown — see below** |
| **F-3** | `TURNSTILE_SECRET_KEY` | **Fail-open kill switch, server** | `netlify/lib/antispam.ts:31` | **Locally no. In production, unknown** |
| **F-4** | `REQUIRED` / `missing()` | Capability gates, server | `netlify/lib/env.ts:29` | Yes — these are the live paths |
| **F-5** | `isDevelopment` / `isProduction` | Config-derived | `config/env.ts:86-87` | **Neither is read anywhere** |

---

## F-1 — `ROOM_VIEW_READY`, the one that caused the bug

```js
const ROOM_VIEW_READY = false;
```

**The only hardcoded feature flag in the codebase.** It gates the wardrobe "in your room" view:
with it off, `isJoinery` categories always render `Wardrobe3D`, the footer shows a disabled
**"In your room — coming soon"**, and `WardrobeRoomRenderer` is never mounted.

### What is behind it

| | Lines | Notes |
|---|---:|---|
| `WardrobeRoomRenderer.tsx` | 405 | Mounted only when the flag is on |
| `wardrobeCutouts.ts` | 160 | Generated manifest, read only by the flagged path |
| `Canvas2DWardrobeRenderer.tsx` | 1,533 | **Not mounted at all** — its one importer takes `buildCarcass` off it |
| **Total** | **2,098** | Plus **27 MB / 10 PNGs** of photographic cut-outs |

**Roughly 2,100 lines and 27 MB of assets have never executed as a unit.** The defect found on
3 September was in a one-line path builder inside it.

### It has no owner and no date

Its comment names a condition — *"flip it when the trace is trustworthy"* — which is honest about
the reason and silent on who decides, and when. **That is the same shape §12 rejected in
`"on unfreeze"`**: a phrase that sounds like a condition while naming no date, no trigger and no
owner. It has been off long enough for a naming convention to diverge underneath it.

> **Wants a decision from V:** who owns the trace work, and is there a date? Absent one, this is a
> permanent flag and should say so, exactly as E-01–E-04 do.

### What checks it while it waits

`npm run check:wardrobe-assets` — reads the manifest and the model table as data and asserts every
file they name is on disk. **Static question, runtime fact, no feature required.** Proven to exit 1.

**It does not cover the renderer**, only the assets. Nothing does, and nothing can until the flag
flips. Treat flipping it as shipping unreviewed work.

---

## F-2 and F-3 — Turnstile, and a fail-open pair worth looking at together

**These are two halves of one control and they can disagree.**

| | Reads | When absent |
|---|---|---|
| **F-2 client** | `VITE_TURNSTILE_SITE_KEY` | Widget is not rendered; the form's "complete the challenge" guard is skipped |
| **F-3 server** | `TURNSTILE_SECRET_KEY` | `verifyTurnstile` **returns `null` — accepted, unverified** |

```ts
const secret = process.env.TURNSTILE_SECRET_KEY?.trim()
if (!secret) {
  return null            // verification skipped entirely
}
```

**This is deliberate and documented** — the file's header says so, and it is what lets the site run
locally without Cloudflare. It is recorded here because **the failure direction is open**: absent
configuration silently disables a spam control rather than blocking a form. Nothing logs when it
happens, so a production deploy missing the variable looks identical to one that has it.

### And a second fail-open, this one probably not deliberate

```ts
} catch (err) {
  console.error('[antispam] turnstile verification error', err)
  return null            // network failure => request accepted
}
```

**If Cloudflare's `siteverify` is unreachable, every submission passes.** That is a defensible
choice — a captcha outage should not take down the contact form — but it is a choice, and it is
currently made by a bare `return null` in a catch block rather than stated anywhere.

> **Wants a decision from V:** is fail-open on a verification outage intended? If yes it should say
> so in the comment. If no, it should fail closed with a message. It is one line either way.

### Has the verification body ever run?

**Locally, no** — there is no `.env`, only `.env.example`, so both halves are off and every request
takes the skip path. **In production, unknown from this repository**; the answer lives in the
Netlify environment. **This is checkable and worth checking**, because if the variables are unset
in production then the entire Turnstile integration — client widget, token plumbing, server
verification — has never run anywhere, and would be F-1's situation with a security control inside
it.

---

## F-4 — the server capability gates

`REQUIRED` names the variables each capability needs, and `missing()` returns what is absent so an
error can say *"add `STRIPE_SECRET_KEY` in Netlify"* rather than *"misconfigured"*:

```
database  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
payments  STRIPE_SECRET_KEY
webhook   STRIPE_WEBHOOK_SECRET
email     RESEND_API_KEY
```

**Not a latent-code risk.** These gate live paths that run in production, and they **fail closed** —
a missing variable produces an error naming it, which is the opposite of F-3. Listed for
completeness, and as the model the others should follow.

**One thing to note:** `notifyTo`, `notifyFrom` and `siteUrl` fall back to hardcoded defaults
(`vedant@nogap.net.au`, `onboarding@resend.dev`, `localhost:8888`) rather than appearing in
`REQUIRED`. Those defaults are silent — a production deploy that forgot `KLAY_NOTIFY_TO` sends
alerts to the fallback address and reports success.

---

## F-5 — `isDevelopment` and `isProduction`, read by nothing

```ts
export const isDevelopment: boolean = import.meta.env.DEV;
export const isProduction: boolean = import.meta.env.PROD;
```

Exported from `config/env.ts`, re-exported through `config/index.ts`, and **read by no file in the
project.** Not a latent path — there is no code behind them at all.

**This is D-11's shape** — the five design-system primitives with zero consumers — and it takes the
same question: *what do these contain that nothing else does?* The answer is nothing;
`import.meta.env.DEV` is available wherever it is wanted, subject to §3's rule that `config/` is
the only file allowed to read it.

**They are not deleted here.** §3 makes `config/env.ts` the sanctioned boundary for exactly this,
so an unused export in that file is a *provision*, not a duplication. Recorded so the next audit
knows the zero-consumer count is known and deliberate.

---

## WHAT THIS AUDIT DID NOT FIND, STATED SO NOBODY RE-RUNS IT

- **No `if (false)`, no `&& false`, no commented-out branches** anywhere in `src/`.
- **No environment-based feature toggles beyond the five above.** `config/env.ts` is genuinely the
  only file in `src/` that reads `import.meta.env`, as its header claims — verified, not assumed.
- **`SHELVING` is not a flag.** The tab is live; `isJoinery` routes it through the wardrobe path,
  so it renders the same `Wardrobe3D` surface. Not a waiting feature.
- **The disabled-button pattern in the visualiser** (`disabled` props on `Button`) is per-instance
  UI state, not a gate on a code path.

## THE STANDING RULE THIS AUDIT ADDS

> **A flag gets a row in this table, a named owner, and a data-level check — or it gets deleted.**
>
> A flag with none of those is not a paused feature. It is unverified code with a comment claiming
> otherwise, and `ROOM_VIEW_READY`'s comment claimed exactly that: *"the code beneath cannot rot in
> the meantime."* It rotted.

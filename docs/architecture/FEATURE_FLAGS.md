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
| **F-1** | `ROOM_VIEW_READY` | **Feature flag, hardcoded `false`** | `visualiser/KlayConfigurator.tsx:30` | **NO — never.** Owner **V**, no date. See below |
| **F-2** | `isTurnstileEnabled` | Config-derived, client | `config/env.ts:82` | **Locally no. In production, unknown — see below** |
| **F-3** | `TURNSTILE_SECRET_KEY` | **Fail-open kill switch, server** | `netlify/lib/antispam.ts:31` | **Locally no. In production, unknown.** → **S-1, security pass** |
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

### It had no owner and no date. It has an owner now

Its comment names a condition — *"flip it when the trace is trustworthy"* — which is honest about
the reason and silent on who decides, and when. **That is the same shape §12 rejected in
`"on unfreeze"`**: a phrase that sounds like a condition while naming no date, no trigger and no
owner. It had been off long enough for a naming convention to diverge underneath it — which is exactly
what happened, and is the whole of instance 9.

> **DECIDED, 3 September: owner V, no date.** Treated as E-08 was — a documented decision with a
> named person, reviewed when its trigger fires rather than on a calendar. The full record, and the
> ordering rule it now carries, is at the end of this file.

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

> **ROUTED, 3 September: this is S-1, and it goes to the top of the SECURITY PASS — not the
> unfreeze.** It is not to be changed inside a migration phase. Recorded in full at the end of this
> file, with the note that the current behaviour is chosen by a `return null` rather than declared
> anywhere.

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

**One thing to note, and it is S-2 below:** `notifyTo`, `notifyFrom` and `siteUrl` fall back to hardcoded defaults
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

---

# STATED FINDINGS — DECISIONS REQUIRED

**Recorded 3 September 2026, decided by V. Two of these are not unfreeze work and must not be
fixed inside a migration phase.**

## S-1 — TURNSTILE FAILS OPEN TWICE → **THE SECURITY PASS, NOT THE UNFREEZE**

> **V's decision: this goes to the top of the security pass. Do not change it during the unfreeze.**

**Two independent fail-open paths, and neither is declared as a choice.**

| | Trigger | Result |
|---|---|---|
| **First** | `TURNSTILE_SECRET_KEY` absent | `verifyTurnstile` returns `null` — the submission is accepted, unverified |
| **Second** | `siteverify` unreachable or throwing | **A Cloudflare outage accepts every submission** |

```ts
const secret = process.env.TURNSTILE_SECRET_KEY?.trim()
if (!secret) {
  return null                       // first
}
// ...
} catch (err) {
  console.error('[antispam] turnstile verification error', err)
  return null                       // second
}
```

### The finding is not "it fails open". It is that nothing says so.

**The current behaviour is chosen by a `return null`, not declared anywhere.** The file header
documents the first path — *"if the site key is not configured, verification is skipped"* — and
says nothing about the second. Neither is expressed as a decision with a reason; both are the
default consequence of a bare return in a function whose contract is *"null means fine"*.

**That is what makes it a finding rather than a bug.** Fail-open on a captcha outage is defensible:
a Cloudflare incident should probably not take the contact form down with it. Fail-open on missing
configuration is what lets the site run locally. **Both may be right. Neither is written down**, so
nobody can tell a deliberate trade-off from an oversight, and the code reads identically either
way.

### What the decision has to cover, when the security pass reaches it

- **Missing key:** is silence correct in production, or should the absence log loudly / refuse to
  boot? Right now a production deploy missing the variable is indistinguishable from one that has
  it.
- **Verification outage:** open or closed? If open, say so in the comment with the reason. If
  closed, return the 400 the invalid-token path already returns.
- Either way, **declare it** — the fix here is at least half a sentence of prose, not only a
  branch.

---

## S-2 — `KLAY_NOTIFY_TO` FALLS BACK SILENTLY → **SAME PASS, SAME SHAPE**

```ts
notifyTo: read('KLAY_NOTIFY_TO') || 'vedant@nogap.net.au',
notifyFrom: read('KLAY_NOTIFY_FROM') || 'Klay Interiors <onboarding@resend.dev>',
siteUrl: read('SITE_URL') || read('URL') || 'http://localhost:8888',
```

**A deploy that forgets `KLAY_NOTIFY_TO` mails a hardcoded fallback and reports success.** Bookings
arrive at an address nobody reads, the function returns 200, the customer sees a confirmation, and
**nothing looks wrong from any angle** — no error, no log, no failing check. It is the same silent
class as the wardrobe path bug, with a booking on the end of it instead of a picture.

`notifyFrom` is worse in one specific way: `onboarding@resend.dev` is Resend's shared sandbox
sender. A deploy on that fallback is not merely mailing the wrong place — it is sending from a
domain the business does not control.

`siteUrl` falling back to `http://localhost:8888` would put a localhost URL into Stripe's
success and cancel links.

---

## F-4 IS THE MODEL BOTH SHOULD FOLLOW

> ### Fail closed, and name the missing variable.

```
database  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
payments  STRIPE_SECRET_KEY
webhook   STRIPE_WEBHOOK_SECRET
email     RESEND_API_KEY
```

`REQUIRED` and `missing()` already do exactly the right thing, in the same file as S-2's defaults:
a missing variable produces an error that **names it**, so the operator is told to add
`STRIPE_SECRET_KEY` in Netlify rather than told the system is "misconfigured".

**S-1 and S-2 are the same file's other half, built the opposite way.** The pattern to copy is
three lines away from the pattern to fix, which is the strongest argument that the divergence was
never a decision — nobody who had chosen fail-open would have written fail-closed beside it.

**The three defaulted values belong in `REQUIRED` or in a deliberate `OPTIONAL` list that logs when
it fires.** Not decided here; recorded so the security pass has the shape of the answer.

---

# F-1 — `ROOM_VIEW_READY`: OWNER **V**, NO DATE

> **V's decision: an owner and no date, treated exactly as E-08 was.**

**This is the resolution of the "no owner, no date" finding, and it resolves it by supplying the
half that matters.** §12 rejected `"on unfreeze"` because it named **no date, no trigger and no
owner** — three missing things, and the ruling was never that all three are required. **An owner
can decide. A date without an owner cannot.**

| | Before | Now |
|---|---|---|
| Owner | — | **V** |
| Date | — | None, deliberately |
| Trigger | "when the trace is trustworthy" | Unchanged — V judges when |

**Same treatment as E-08**: a documented decision with a named person, reviewed when its trigger
fires rather than on a calendar. It is not rot, and it is not a permanent flag either — it is
V's to flip.

## THE ORDERING RULE THIS FLAG NOW CARRIES

> ### The wardrobe path bug is fixed BEFORE the flag flips, not after.
>
> **It is already fixed — U1, 3 September.** This records why that order was necessary, so the
> next flag is handled the same way.

**The flag is the only reason that bug was not live.** Seven of ten wardrobe models resolved to a
filename that has never existed; every one would have fallen back to the legacy sticker the moment
`ROOM_VIEW_READY` became `true`. Not a crash, not a 404 — ten built-in wardrobes quietly drawing
the wrong artwork on a customer's photograph.

**Flipping the flag first would have shipped that defect and called it a release.** And it would
have been diagnosed as a regression in the newly-enabled feature, because that is what the timeline
would have shown, when in fact the defect had been sitting still for months and only the audience
changed.

**So the rule is general, and it is the practical form of instance 9:**

> **Code behind an off flag is unverified code. Verify it — at the data level, since you cannot
> verify the behaviour — and fix what that finds BEFORE the flip. Turning a flag on is shipping
> unreviewed work, and the review has to precede the ship.**

`npm run check:wardrobe-assets` is what stands in for a render check while the flag is off. It
would have caught this on the day the naming diverged.

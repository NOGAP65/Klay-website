# THE TEST

> ## What would this output if it were broken?
>
> ### If the answer is "the same thing", it is not a check.

**This is the general test, and it applies to everything that reports.** Not to lint rules
specifically, not as the lesson of any one incident. Ask it of anything whose output you are about
to believe.

| Signal | What it outputs when it works | What it outputs when it is broken | Same? |
|---|---|---|---|
| **A lint rule** | Zero findings | Zero findings | **Yes** |
| **A grep** | No matches | No matches, because the thing is shaped differently | **Yes** |
| **A guard's test** | Passes | Passes — the failure branch never ran | **Yes** |
| **A typecheck over the wrong project** | No errors | No errors, having compiled nothing | **Yes** |
| **A browser check on a route that 404s** | No console errors | No console errors, on a page that isn't the one you meant | **Yes** |
| **A `git push`** | Silence, then a ref update | Silence, waiting on a prompt you cannot see | **Yes** |

**Every row is a real occurrence in this project**, and every one was believed at the time.

## THE STANDING EXPECTATION, BEFORE ANY OF IT

> ### Anything built to check something needs checking, and it will be inert the first time.
>
> **Assume it. Do not wait to be surprised by it.**

**Nine instances is a property of the work, not a run of bad luck.** They are not nine unrelated
slips that happened to land in one project. They are one thing arriving repeatedly: **a check is
written by the same person, in the same sitting, holding the same belief about the world as the
code it checks.** If that belief is wrong, both halves are wrong together and they agree with each
other. The check does not fail. It concurs.

So the expectation is not "be careful and this will be rare". It is **"the first version is inert,
plan the five minutes to prove otherwise"** — the same way you would not ship a function without
running it once.

### And twice now the verifier has been the last place looked, for the same reason

| | |
|---|---|
| **Instance 7** | `verify-scope-guard.mjs` reported a refusal while having written a real file |
| **Instance 8** | `legacy-countdown.mjs` reported a floor that had been demolished that morning |

Both were the tool everything else was being judged against, and both were the last thing anyone
thought to doubt. **That is not a coincidence, it is the mechanism**: the verifier is the thing that
looks, so nothing is looking at it. Every other file in the project has something pointed at it —
that is what the verifier is for. The verifier has whatever you deliberately point at it, and
nothing else.

**Which means the order is backwards from the intuitive one.** The instinct is to verify the risky
code first and the checking tools last, because the tools are small and boring. But an unverified
tool silently vouches for everything downstream of it, so **it is the highest-leverage thing in the
project to be wrong**, and it is the cheapest to test. Prove the tool, then use it.

---

## What to do when the answer is "the same thing"

**Make it fail on purpose, once.** That is the entire remedy and it is usually five minutes.

- A rule gets a fixture that violates it — `npm run verify:rules`.
- A guard gets a probe it must refuse — `npm run verify:scope-guard`.
- A search gets run against a case you know exists, before you trust it finding nothing.
- A typecheck gets checked for what it *covered*, not just its exit code.
- A browser check asserts something positive — that the page rendered, that the image loaded —
  not merely that nothing threw.

**A signal you have never seen fail is not evidence. It is a habit.**

## Why this is at the top of the runbook

Seven separate incidents in one migration, each looking like a different bug, all reducible to
this question going unasked. The remainder of this file is those seven in detail — worth reading
as a set, because the individual bugs are all obvious in hindsight and the pattern is not.

---

# Verification — one shape, three faces

> **ADR-022's standard was applied to everything except the thing applying it.**
>
> **The verifier is the last place anyone looks, because it is the thing that looks.**

Seven times in one migration a tool reported success while being wrong. They arrived as seven
different-looking bugs and they are one shape: **a signal whose failure state had never been
observed.**

| Face | What it looks like | Why it is invisible |
|---|---|---|
| **A rule never shown to fire** | `import/no-cycle` — configured, loaded, schema-validated, reporting zero for two phases while a real cycle shipped | A zero from a working rule and a zero from an inert one are the same zero |
| **A search whose empty result means nothing** | A `grep` for three contact details that missed a fourth, because the fourth was a named constant rather than an inline literal | An empty result reads as "none exist" when it means "none matched how I asked" |
| **A check never shown to behave correctly when it FAILS** | The scope-guard verifier, whose write test used a real protected file — so the day the guard let it through, the test wrote to disk | Every run had been a passing run. The destructive line had never executed |

**All three fail THE TEST at the top of this file** — each outputs the same thing broken as
working:

`import/no-cycle` outputs zero whether it works or not. A grep outputs nothing whether the thing
is absent or merely differently shaped. A guard's test passes whether the guard holds or the test
never reaches its assertion.

**And the third face is the one that catches everyone**, because a verifier is what you reach for
when you distrust something else. Nothing sits behind it. ADR-022 exists to say that a rule is not
enforcement until it has been shown to fail — and the tool written to apply that standard had
never had it applied to itself, because applying it would have meant distrusting the thing whose
job is distrust.

**The seven instances are listed in full below.** They are worth reading as a set rather than
individually: the individual bugs are all avoidable in hindsight, and the pattern is not.

---

# A tool that transforms source is verified per operation, not per batch

**Symptom class:** a tool reports success and is structurally wrong. Nothing errors. The output
looks right. The failure is only visible to something that understands the code rather than the
text.

**This is the second instance in this project.** The first was `import/no-cycle` — configured,
loaded, schema-validated, and inert, reporting zero for two phases while a real cycle shipped
(ADR-022). The second was Phase 7's rename tool, which produced a plausible diff while renaming
the wrong things.

They look unrelated and they are the same shape: **a green result that was never asked to prove
it could be red.**

---

## The rule

> **Run the typechecker after each operation, not after the batch.**

`tools/codemod.mjs`'s `renameAll` does this by default. It typechecks after every rename and
**reverts the one that broke**, so a bad operation is reported by name rather than diagnosed
through the wreckage of the forty after it.

It is slower. That is the whole cost, and it is worth paying: a batch of 41 checked once at the
end tells you *something* broke, and the failures interact — a rename that shadows an identifier
produces errors at the shadowing site, the shadowed site, and every consumer of both.

## What went wrong in Phase 7, precisely

Both faults were in the same 60-line script and neither was careless.

**1. The comment mask collapsed line count.**

ADR-018 requires a scripted substitution to operate on code only, so the tool masked every
comment before running. The first version replaced each comment with a single placeholder token
— so a twelve-line block comment became **one line**, and every line number after it shifted.

Line-range-scoped edits were then computed against source line numbers and applied to masked
ones. They landed in the wrong scope.

**In `VisualiserShowcase.tsx` that meant renaming a variable called `active` that was a NUMBER**
— the window index, a prop — **into `isActive`, where an `isActive` already existed two lines
below.** The rename was mechanically correct, applied cleanly, and produced a diff that read
perfectly.

*Fixed:* the placeholder carries its own newlines **and the count of them**, so masked line
numbers equal source line numbers and unmasking restores exactly what it removed.

**2. A rename hit an object key.**

`NAV_PAD.compressed` is a padding map keyed by nav state. The pattern excluded property accesses
(`(?<![.\w$])`), so it renamed the key in the object literal — where nothing precedes it — and
left `NAV_PAD.compressed` at the call site. Half a rename.

*No fix in the tool.* This one is a judgement: §6's boolean-prefix rule is about variables, and a
map keyed by state name is not one. **A tool cannot tell you which identifiers should be renamed,
only that a rename was applied consistently.** The typechecker is what noticed.

## Why review would not have caught either

Both produce diffs that look correct in isolation:

```diff
-  const active = productCategory === tab.id;
+  const isActive = productCategory === tab.id;
```

Nothing in that hunk is wrong. What is wrong is *which* `active` it landed on, and that is only
visible with the whole file in view and the other two bindings of the same name in mind.

**Do not rely on reading the diff to catch a transform error.** Read the diff to catch a
*judgement* error — a rename that is consistent but wrong, like `NAV_PAD.compressed`. Use the
typechecker to catch the mechanical ones, because it can hold the whole program and a reviewer
cannot.

## The checklist

1. **Verify per operation.** `renameAll(..., { verify: true })` — the default.
2. **Mask comments, and preserve line count while doing it.** ADR-018.
3. **Prove no comment was rewritten**, afterwards, not by assumption:
   ```
   git diff -U0 | grep '^+' | grep -E '^\+\s*(//|\*)' | grep '<new-identifier>'
   ```
   Empty is the pass. `commentsTouchedBy()` does the same thing.
4. **Read the surviving comments.** Prose about a concept ("deepens on hover") is correct English
   and stays. Only a stale reference to a renamed *identifier* is a finding — and where a comment
   is *about* the old name, ADR-018 says keep it and add the new one.
5. **Check nothing was un-suppressed:**
   ```
   git diff | grep -E '^-.*(eslint-disable|ts-expect-error|ts-ignore)'
   ```
6. **Run the thing in a browser** if it touched anything the user sees. A rename should be
   invisible; if a page changed, the transform did more than rename.


---

# THE STANDING VERIFICATION RULE

> **Read the diff for judgement errors. Use the typechecker for mechanical ones.**
>
> **The typechecker holds the whole file. A reviewer holds a fragment.**

This is not advice about renames. It is how change in this repository is verified, and it
supersedes "read the diff carefully" as the default — because reading carefully is exactly what
fails here, and failing harder at it does not help.

**The two kinds of error are not equally visible, and the asymmetry is the whole point.**

| | Judgement error | Mechanical error |
|---|---|---|
| **What it is** | The change was applied correctly and should not have been | The change was applied to the wrong thing |
| **Example** | `NAV_PAD.compressed` — a padding map keyed by state name, renamed as though it were a boolean | `active` — renamed in a scope where an `isActive` already existed two lines below |
| **Visible in a diff?** | **Yes.** This is what a reviewer is for | **No.** The hunk is correct in isolation; what is wrong is which binding it landed on |
| **Visible to `tsc -b`?** | **No.** It compiles perfectly | **Yes. In seconds** |
| **Caught by** | A person who knows what the code means | A tool that holds the whole program |

A reviewer reads a hunk with three lines of context. The information needed to catch a mechanical
error is usually **outside that window** — another binding of the same name ninety lines down, a
consumer in a different file, a type that turns out to be a number rather than a boolean. Asking
a reviewer to catch it is asking them to hold the whole file in their head, which they cannot do
and the compiler does for free.

The inverse is just as firm: **the typechecker cannot tell you that a correct change was the
wrong change.** Renaming a state-keyed map to look like a boolean compiles. Renaming a variable
to a worse name compiles. Deleting a component nothing imports compiles. Every judgement in this
migration — which primitive earns its place, whether a duplicate should be removed rather than
renamed, whether `stacked` means two different things — was made by reading, and none of them
could have been made by a tool.

**So the split is a division of labour, not a ranking.** Run both. Give each the class of error it
can actually see, and stop spending scarce review attention on the class it cannot.

## The corollary for tools

**Anything that transforms source runs the typechecker per operation** — `tools/codemod.mjs`, and
the reasoning at the top of this file. **Anything that makes a decision gets read by a person.**

A tool reporting its own success is evidence of neither.

---

---

# READ BACK AFTER EVERY SHELL-MEDIATED WRITE

> **A write that passes through a shell is verified by reading the file, not by the command
> exiting zero.**

**SEVEN instances in one migration. That is a property of the environment, not seven accidents.**

| # | What reported success | What was actually true |
|---|---|---|
| 1 | `import/no-cycle` — configured, loaded, schema-validated | Inert. Reported zero against a two-file `a → b → a` fixture built to violate it. ADR-022 |
| 2 | The rename script — *"41 renames applied"* | True, and silent about whether they were the right 41. Two landed in the wrong scope |
| 3 | The NUL comment mask — round-tripped in tests | Collapsed multi-line comments to one line, shifting every line number after them |
| 4 | **`git commit` with a heredoc body** | Backticks inside the shell string were **executed as command substitution** and their content silently deleted from the document |
| 5 | A codemod's directory filter | Skipped directories named `visualiser` and edited `src/pages/VisualizerLabPage.tsx` — a **file**, spelled with a z, protected by E-08 |
| 6 | `String.replace(anchor, add + anchor)` while writing THIS SECTION | The replacement string contained a `$` before a backtick — a special pattern meaning "everything before the match" — and duplicated 130 lines of this file into itself |
| 7 | **The scope-guard verifier** | Its write test used a REAL protected path. When a retired exception made the guard correctly allow it, the test WROTE to disk — reporting the failure and causing it in the same breath. The verifier had never been exercised in its own failure case |

**Four, five and six are the ones this section is about, and they are the same shape as one to
three: the operation completed, reported success, and did something other than what was asked.**

**Six is the one to read first.** It happened while this section was being written, to this
section, and the rule being introduced caught it one command later.

## Instance 4, precisely, because it happened twice in a day

Writing a document through a shell heredoc:

```bash
node -e "s = s.replace('...', '... `/products` referenced nine times ...')"
```

The backticks around `/products` are **command substitution**. The shell ran `/products`, got
`No such file or directory`, substituted the empty result, and the sentence went into the
committed file as `( referenced nine times)`. Exit code zero. No warning that meant anything.

It happened again in the same session with `` `error (in-scope)` `` and `` `warn` `` inside a
table cell, which produced a syntax error on one and silent deletion on the other.

**Markdown is made of backticks.** Every inline code span in a document written through a shell
is a substitution waiting to happen, and the failure is invisible precisely because the result
is *removal* — there is nothing left to notice.

## Instance 5, and why it is worse than it looks

The route-consolidation codemod filtered scope with an ad-hoc test on **directory names**:

```js
if (e.isDirectory()) { if (!/visualiser/.test(e.name)) walk(p, acc); }
```

`src/pages/VisualizerLabPage.tsx` is a file, not a directory, and is spelled with a `z`. It was
edited. It is E-08 — out of the migration, not to be touched for any reason, an import rewrite
included.

**`tools/scope.mjs` exists to answer exactly this question**, computes the answer from the
exception register, and handles individual files. It was not used, because writing a two-line
filter felt faster than importing one.

**That is the second time in this migration that the correct check already existed and an ad-hoc
substitute was written instead** — the first being `tsc -b` run per batch rather than per
operation. The rule that falls out:

> **If a check for this already exists in `tools/`, use it. A filter written inline is a second
> implementation of a rule, and §13 has a name for that.**

Caught by reading the tool's output — the file was listed among fifteen — and reverted before the
commit. It would not have been caught by the typechecker: the edit was valid TypeScript.

## Instance 6 — which happened while writing this section, and proves it

The section you are reading was spliced into this file with:

    s.replace(anchor, add + anchor)

`add` contained the sentence *"anything containing backticks, `$`, `!` or quotes"*. In a
replacement **string**, `$` followed by a backtick is a special pattern meaning **"everything
before the match"** — so `replace` inserted the entire first half of this document into the
middle of it. 130 duplicated lines. Exit code zero.

**The read-back rule caught it on its first use, one command after being written.** The check was
`grep -n '^# '` on the file just modified; two headings appeared where one should.

**The fix is to stop using a replacement string.** Slice the file and concatenate:

```js
const i = s.indexOf(anchor);
fs.writeFileSync(p, s.slice(0, i) + add + s.slice(i));
```

`String.replace` with a string replacement interprets `$&`, `` $` ``, `$'` and `$1`. **A slice
interprets nothing.** For inserting prose — which is full of `$` and backticks — that is the only
safe form, and `replace(anchor, () => add)` with a *function* is the other, because a function's
return value is used verbatim.

**Six instances now.** Five were tools reporting success while wrong; this one was a document
being written *about* tools reporting success while wrong, corrupted by the same class of fault
it describes, and caught by the rule it was introducing.

## Instance 7 — the verifier was itself unverified

**A test that proves refusal must not perform the act it is testing.**

`tools/verify-scope-guard.mjs` proves the scope guard refuses out-of-scope writes. Its write test
was:

```js
writeInScope('src/pages/VisualizerLabPage.tsx', 'x')   // expect: throws
```

A **real protected file**, with real content, expecting to be stopped.

On 3 September, retiring E-07 correctly removed that path from the exception register. The guard
correctly allowed it. **And the test wrote its payload to disk** — a one-byte file called
`VisualizerLabPage.tsx`, recreated seconds after the real one had been deleted.

**It reported the failure and caused it in the same breath.** The console said `WROTE — FAIL`,
which was accurate, and the file was on disk, which was the failure it was describing.

### Why it belongs in this list rather than being a silly bug

**It is the third face of the shape at the top of this file**, and the one that catches everyone.

**It is the same family as instances 1 and 4, and the family is what matters:**

| | The mechanism | What made it invisible |
|---|---|---|
| **1** | `import/no-cycle` | A rule that had never been shown to fire |
| **4** | Backticks in a shell heredoc | A search whose empty result meant nothing |
| **7** | **The verifier** | **A check that had never been shown to behave correctly when it fails** |

ADR-022 says a rule is not enforcement until it has been shown to fail. **The verifier existed
to apply that standard to the scope guard — and had never had it applied to itself.** It was
exercised only in the passing case, where the guard refuses and the destructive line never runs.
Its failure path had never executed once, in any test, ever.

**A check written to catch unverified things is not exempt from being unverified.** That is the
whole finding, and it generalises past this file: the last thing anyone tests is the test.

### The fix

The probe now names a path that has never existed:

```js
const PROBE = 'src/visualiser/__scope_guard_probe__.ts';
```

Out of scope, so it must be refused; nonexistent, so a write that gets through creates something
identifiable rather than overwriting something real. And the test cleans up after itself:

```js
if (fs.existsSync(PROBE)) { fs.unlinkSync(PROBE); failures++; }
```

**Design a destructive test so that its failure is survivable**, because the failure case is
exactly the one nobody rehearsed.

## The rule

**After any write that passed through a shell — a heredoc, a `node -e`, a `sed -i`, a `perl -pi`
— read the changed region back before moving on.**

```bash
grep -n '<a phrase from what you just wrote>' <file>
```

If the phrase is not there, or is there with a gap in it, the write did not do what the command
said it did.

**Prefer a writer that does not go through a shell** for prose and for anything containing
backticks, `$`, `!` or quotes. Use the shell for *finding* and a file-writing tool for *writing*.
This project's own transforms (`tools/codemod.mjs`) read and write with `node:fs` for exactly
this reason — the shell is not in the path at all.

---

## THE CONSOLIDATION IS THE SEARCH

**Copies of a value cannot be fully enumerated until the visible ones are replaced.**

The remainder are shaped differently from the query — that is *why* they survived the first
search, and it is not a coincidence that can be designed around by grepping harder.

**The worked example: four Instagram URLs, not three.**

D-12 was logged as three copies of the business's contact details, found with a grep for the
phone number, the email and the street address. All three were inline string literals in JSX, so
a search for the literal text found all three.

The fourth was:

```ts
const INSTAGRAM = 'https://www.instagram.com/klayinteriors';
```

A named constant in `SocialProof.tsx`. The original search had asked for phone, email and
address, because those were the facts the trigger named — and the Instagram URL is a business
fact of the same kind that nobody had thought to list. It only surfaced when the *other* three
were replaced and the same search was run again against a codebase where every legitimate copy
had gone.

**Why this generalises.** The copies that a first search misses are, by definition, the ones
that do not match how you framed the question:

| Missed because | Example |
|---|---|
| Assigned to a constant, not written inline | `const INSTAGRAM = '…'` |
| Formatted differently | `Mon–Fri 8am–6pm` vs `Monday – Friday, 8am – 6pm` — one fact, two renderings, and neither grep finds the other |
| Split across the query | An address as three fields rather than one string |
| A fact of the same kind you did not enumerate | Instagram, when you searched for phone, email and address |

**Every one of those becomes findable once the known copies are gone**, because then any
remaining occurrence of the *concept* stands alone rather than hiding among legitimate ones.

## The rule

**After consolidating, search again — and search for the concept, not the string you replaced.**

```bash
# not: grep '1300 00 KLAY'
# but: everything that looks like a business fact, once site.ts is the only legitimate home
grep -rn "klayinteriors\|1300\|Maltings\|ABN\|instagram" src --include=*.ts --include=*.tsx \
  | grep -v 'config/site.ts'
```

**The `grep -v` on the new home is the important half.** It turns the search from *"where is this
value"* into *"where is this value somewhere it should no longer be"*, and only the second
question has a meaningful empty result.

**Treat the first count as a lower bound.** D-12 was logged as three and closed as four. A
divergence count taken before consolidation is a floor, not a total — and saying so in the log
is better than quietly correcting the number later.

---

# A DEBUGGING SENTINEL MUST BE VISIBLE IN A TERMINAL, A DIFF AND AN EDITOR

**Specific, small, and it cost two failed attempts at fixing a five-line function.**

`tools/codemod.mjs` masks comments before substituting, and the mask needs a sentinel that cannot
occur in source. The obvious choice is **U+0000, NUL** — and it is the wrong one.

**A NUL survives a string round-trip perfectly and renders as nothing everywhere a human looks.**
When the mask needed fixing:

- `sed -n` printed the tokens as blank space, so the file appeared to contain a plain
  `` `​ ${index} ` `` with ordinary spaces.
- `cat -A` printed `^@`, which is the only reason the bytes were ever found at all.
- A patch matching on the apparent text failed with no explanation, twice, because the string
  being matched was not the string on screen.
- Reading the file back through a tool that normalises control characters returned spaces, so an
  exact-match edit could not be constructed from what had just been read.

**The file was correct and the patch was correct, and they could not be made to meet** — because
the only thing distinguishing them was invisible in every representation available.

**Use a Unicode private-use-area character instead — U+E000.** It cannot occur in TypeScript
source for the same reason NUL cannot, and it *shows up*: a visible replacement glyph in a
terminal, a distinct character in a diff, something an editor will find. `codemod.mjs` now uses
it.

**The general form:** a value that exists to make a problem findable must itself be findable. A
sentinel, a placeholder, a debug marker, a test fixture's magic number — **if it renders as
nothing, it is working against the only situation it exists for.**

## Instance 8 — the countdown that kept reporting a floor that had been demolished

**The first one on this list found by asking THE TEST of a tool that had not misled anyone yet.**
Every instance above was written after being caught out. This one was written before.

`tools/legacy-countdown.mjs` answers the question the whole migration is measured by: how many
imports still reach out of `src/features/` into a file with no layer. On the morning of the
unfreeze it said:

```
  of which CLEARABLE          : 10   <- this is the countdown
  of which PERMANENT          : 13   <- ADR-020, will not fall
```

**All thirteen had become clearable hours earlier.** The visualiser was in scope; the thing holding
them down no longer existed. The correct output was `23 clearable, 0 permanent`.

### The shape, which is the same shape as instance 6

The tool held **its own copy of a fact the register owns**:

```js
const isOutOfScope = (p) => p.startsWith('src/visualiser/') || ...
const PERMANENT = {
  'src/data/products.ts': 'six visualiser files import it; decision H lost its slot',
  'src/theme.ts': 'the visualiser imports the deprecated aliases',
};
```

Instance 6 was `codemod.mjs` filtering by directory instead of asking `isInScope`, and it edited a
protected file. This is the same bypass with a slower fuse: **the codemod acted on the stale copy,
the countdown only reported from it.** A wrong number does no damage the day it appears, which is
precisely why it survives — nobody reverts a report.

### The distinction that matters: it had never been right, not gone stale

**"Stale" is the flattering reading and it is the wrong one.** Stale means it was true once and the
world moved. That is ordinary, forgivable, and it would have made this a smaller finding.

**It had been wrong from the day it was written.** `products.ts` was listed as held by *six*
visualiser files; it was held by three. `lib/pricing.ts` was held by two and **was not in the table
at all**. Neither number described any state the project has ever been in. The unfreeze did not
make the table wrong — the unfreeze is merely what finally made someone ask.

**Deriving the answer is what exposed it, and that is the reusable part.** Nobody re-counted the
importers and found a discrepancy; nobody would have. The count only surfaced because the hardcoded
table was replaced with a computation and the two could be compared. **A wrong constant and a right
constant are indistinguishable until something else computes the same thing** — which is the
argument for deriving even where a literal would be simpler and faster.

### A tool that misinforms is more durable than one that misbehaves

**This is the same bypass as instance 6, and it survived far longer for a reason that is worth
stating on its own.**

| | Instance 6 — the codemod | Instance 8 — the countdown |
|---|---|---|
| Held | Its own directory filter instead of `isInScope` | Its own copy of ADR-020 |
| Did what with it | **Acted** — edited a protected file | **Reported** — printed a wrong number |
| Detected | Same session, within minutes | Never, until the tool was rewritten for other reasons |

**An action leaves evidence. A report leaves a belief.** The codemod's stale copy produced a
modified file, a diff, a hash that had changed — artefacts that sit in the repository being wrong
at you until somebody looks. The countdown's stale copy produced a sentence on a terminal that
scrolled away, and left behind only the impression that thirteen edges would never clear.

**Nobody reverts a report.** There is no diff to notice, no failing check, no hash to compare. The
wrong number is not stored anywhere it can be caught — it is stored in whoever read it, and it
gets re-derived, identically wrong, on every run.

**So the durability is inverted from the severity.** A tool that misbehaves is dangerous and
short-lived. A tool that misinforms is harmless in any single instant and can run for the length of
a project, quietly shaping every decision made downstream of it. **The countdown decides whether the
migration is finished.** It said there was a floor. There was no floor.

**Which is why reporting tools deserve the verification that acting tools get, not less of it.**
The instinct is the reverse — a tool that only prints seems safe to leave unproven — and that
instinct is what bought this one its long run.

### The fix is not a better list. It is no list.

Scope is defined once, in `exceptions.json`, and `tools/scope.mjs` is the only thing that reads it.
`PERMANENT` is now **derived**: a legacy module is unmovable exactly when something out of scope
imports it — a question you can ask the file system every time, rather than answer once in a
comment and never revisit.

### Proving the rewrite, since a tool that always prints zero also prints zero

`0 permanent` is the right answer today and is indistinguishable from a tool that has stopped
looking. So the register was perturbed — one temporary exception excluding `src/visualiser/**` —
and the countdown moved to `7 clearable, 16 permanent`, naming the importers holding each module
down. Reverted; `exceptions.json` hashed identical either side; `verify-exceptions` green.

**The output that mattered was not the zero. It was that the zero moved when the fact under it
moved.**

### The rule

**A tool that reports on policy must read the policy, not a copy of it.** If a fact has an owner —
a register, a config, a single source file — then every other place that states it is a cache with
no invalidation. The countdown had one, the codemod had one, and `lint:fix`'s ignore list had one.

**And a derived zero must be shown to be capable of being non-zero.** Otherwise "the floor is gone"
and "the tool stopped measuring the floor" produce identical output, and one of those is the thing
you were trying to detect.

## Instance 9 — A NEW CLASS: the latent defect behind a feature flag

**Every instance before this one was a check that could not see. This one is a check that could
not run.** It is a different failure and it needs its own name, because the remedy for the others
does not touch it.

### What it was

`wardrobeAssetPath` built `<model.id>-<finish>-<view>.png`. The cut-out files are named by
**artwork id** — `4.0`, the layout that was photographed — while a model carries the supplier's
own code, `SRSTDH02`. Those two agree for the three walk-ins and for nothing else.

**Seven of the ten models could only ever have requested a file that has never existed.** Not "did
not exist yet" — has never existed, under any name, at any point in the project.

### Why nothing caught it, and why nothing could have

Not one of the project's checks was capable of seeing it:

| Check | Why it was silent |
|---|---|
| `tsc -b` | Every reference resolves. The bug is in the *value* of a string |
| `eslint` | No rule violated |
| The route check | The page renders |
| The image check | **No `<img>` is involved.** The path goes to `new Image()` in `loadAsset` |
| The console watch | `loadAsset` resolves `null` by design. Nothing throws |
| **The render baseline** | **The pixels are correct** — the fallback draws, and the fallback is what the baseline recorded |
| **The network trace** | **Six requests, all 200.** No 404 to find |

The last two are the ones that matter, because they are the checks specifically built to catch
silent render failures, and both were **green and correct**. There was no 404 because there was no
request. There was no wrong pixel because there was no draw.

### THE GENERAL FORM

> ### Asking THE TEST of a flagged code path returns nothing either way.
>
> **The flag defeats every check by preventing execution.** A check distinguishes working from
> broken by observing behaviour. Behind an off flag there is no behaviour, so there is nothing to
> observe and every check agrees — correctly, and uselessly.

THE TEST asks *what would this output if it were broken?* For flagged code the honest answer is
**"exactly what it outputs now, because it outputs nothing"** — and unlike every earlier instance,
that is not a defect in the check. The check is fine. It is pointed at a thing that is not
happening.

**So this class cannot be fixed by improving checks.** Adding cases, tightening thresholds, making
a rule fire — none of it reaches code that does not run. The remedy is different in kind.

### The flag's own comment claimed the opposite, and that is the sharpest part

```js
/* Kept as one named constant rather than deleted branches so turning it back on
 * is a one-line change and the code beneath cannot rot in the meantime. */
const ROOM_VIEW_READY = false;
```

**"The code beneath cannot rot in the meantime" is the belief this bug disproves.** The reasoning
is sound as far as it goes: a named constant keeps the branch compiling, so it cannot break the way
commented-out code breaks — no stale syntax, no undefined identifiers, no drift in the type
signature. `tsc` really does keep looking at it.

**But `tsc` is exactly the check that could not see this.** The defect lives in agreement between a
runtime string and a set of filenames, which is the class of thing no compiler checks and only
execution reveals. The constant preserved everything a compiler can protect and nothing else, and
the comment mistook the first for the whole.

**A flag does not preserve code. It preserves the syntax of code and suspends every guarantee that
comes from running it.**

### What actually works

**Give the flagged path a check that does not require the feature to be on.**

That is what `check:wardrobe-assets` is. It does not render, does not navigate, does not need
`ROOM_VIEW_READY` to be `true`. It reads the manifest and the model table as data and asserts that
every file they name is on disk — a *static* question about a *runtime* fact. It would have caught
this on the day the naming diverged.

The pattern generalises: **behind a flag, verify the data, because you cannot verify the
behaviour.** Filenames, ids, routes, config keys, the correspondence between two tables — these can
all be checked without executing anything.

**And date the flag.** A flag with no owner and no expected flip date is the "on unfreeze" problem
from §12 in a different costume: a word that sounds like a condition while naming no date, no
trigger and no owner. `docs/architecture/FEATURE_FLAGS.md` now carries every one in the project,
what it gates, and whether the code behind it has ever run.

### The rule

**Code behind an off flag is unverified code, however good it looks and however green the build
is.** Treat flipping a flag as shipping unreviewed work — because that is what it is — and check
its data while it waits.

## The general lesson, which is not about renames

**A tool's own report is not evidence that it worked.** `import/no-cycle` reported zero because
it could not see; the rename script reported "41 renames applied" because it had applied 41
substitutions, which was true and told us nothing about whether they were the right ones.

Ask what the tool would output if it were broken. If the answer is "the same thing", the output
is not a check — and something that *can* fail has to be put underneath it.

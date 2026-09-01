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

## The general lesson, which is not about renames

**A tool's own report is not evidence that it worked.** `import/no-cycle` reported zero because
it could not see; the rename script reported "41 renames applied" because it had applied 41
substitutions, which was true and told us nothing about whether they were the right ones.

Ask what the tool would output if it were broken. If the answer is "the same thing", the output
is not a check — and something that *can* fail has to be put underneath it.

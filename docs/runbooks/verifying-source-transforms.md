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

## The general lesson, which is not about renames

**A tool's own report is not evidence that it worked.** `import/no-cycle` reported zero because
it could not see; the rename script reported "41 renames applied" because it had applied 41
substitutions, which was true and told us nothing about whether they were the right ones.

Ask what the tool would output if it were broken. If the answer is "the same thing", the output
is not a check — and something that *can* fail has to be put underneath it.

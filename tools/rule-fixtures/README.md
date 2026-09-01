# Rule fixtures — proof that each rule fires

Every file here is a deliberate violation. ADR-022: **a lint rule is not trusted
until it has been demonstrated to fire.** `import/no-cycle` reported green for
two phases while structurally unable to see the only cycle shape this codebase
can produce, and nothing noticed, because a rule reporting zero looks exactly
like a rule finding nothing wrong.

Run `npm run verify:rules`. It loads the real `eslint.config.js` with ignores
disabled, lints this directory, and asserts each rule below produced at least
one finding. A rule that reports zero here is broken, not clean.

Do not fix the violations in this directory. That is what they are for.

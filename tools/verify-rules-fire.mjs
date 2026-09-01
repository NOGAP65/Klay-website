// ---------------------------------------------------------------------------
// PROOF THAT EACH LINT RULE FIRES — SPECIFICATION.md §11, ADR-022.
//
// A rule that reports zero looks exactly like a rule that finds nothing wrong.
// `import/no-cycle` was configured, schema-validated and loaded, and reported
// green for two phases while a real cycle shipped — because nothing had ever
// asked it to prove it could fail.
//
// So: every rule the project relies on is shown to report against something
// built to violate it. This loads the REAL eslint.config.js, because the thing
// under test is the configuration as shipped, not a stub of it.
//
//   npm run verify:rules
//
// A rule listed in EXPECTED or PROBES that reports zero is a FAILURE.
//
// TWO MECHANISMS, because the rules need different things:
//
//   FIXTURES  tools/rule-fixtures/**, real files with real violations. Excluded
//             from `eslint .` so they cannot pollute the baseline; linted here
//             with ignores off. Carries its own tsconfig so typed linting works
//             — @typescript-eslint/naming-convention can only know a variable
//             is a boolean by asking the typechecker.
//
//   PROBES    lintText against a virtual path under src/. eslint-plugin-boundaries
//             classifies a file by WHERE IT IS, so a fixture in tools/ is not a
//             design-system file no matter what it contains, and putting one in
//             src/design-system/ would pollute the tree it is meant to protect.
//             The probes run with the project service off, since boundaries needs
//             no type information and a virtual file has no project.
// ---------------------------------------------------------------------------

import { ESLint } from 'eslint';

/** Rules that must report against tools/rule-fixtures/. */
const EXPECTED = [
  'klay/no-hardcoded-style-values',
  'klay/no-pure-black',
  'klay/no-direct-env-access',
  'import/no-internal-modules',
  'import/order',
  'no-restricted-imports',
  'max-lines',
  'max-lines-per-function',
  'complexity',
  'max-depth',
  'max-params',
  '@typescript-eslint/no-unused-vars',
  '@typescript-eslint/naming-convention',
];

/** Rules verified by linting a virtual file at a path that means something. */
const PROBES = [
  {
    rule: 'boundaries/dependencies',
    filePath: 'src/design-system/probe.ts',
    code: "import { useCartStore } from '@/features/cart';\nexport const x = useCartStore;\n",
    why: '§2: the design system may import nothing but itself.',
  },
  {
    rule: 'boundaries/dependencies',
    filePath: 'src/shared/probe.ts',
    code: "import { useCartStore } from '@/features/cart';\nexport const x = useCartStore;\n",
    why: '§2: shared may import config and other shared, never a feature.',
  },
];

/**
 * Configured, loaded, schema-validated — and inert. Listed so the gap has a
 * name. A known-blind rule is a liability you can see; an unlisted one is just
 * a green tick.
 */
const KNOWN_BLIND = [
  {
    rule: 'import/no-cycle',
    why: 'Reports nothing against tools/rule-fixtures/cycle-simple (a two-file a->b->a relative cycle) OR cycle-barrel. Not a barrel-traversal gap — the rule is inert in this setup. §11 has been unenforced since it was written. Covered by tools/cycle-check.mjs.',
  },
];

const typedLint = new ESLint({ ignore: false, errorOnUnmatchedPattern: false });
const results = await typedLint.lintFiles(['tools/rule-fixtures/**/*.{ts,tsx}']);

const counts = new Map();
for (const r of results) {
  for (const m of r.messages) {
    const id = m.ruleId ?? '(parse error: ' + m.message.slice(0, 60) + ')';
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
}

const missing = [];

console.log('\n=== fixtures: rules proven to fire ===');
for (const rule of EXPECTED) {
  const n = counts.get(rule) ?? 0;
  if (n > 0) console.log(`  FIRES (${String(n).padStart(3)})  ${rule}`);
  else {
    console.log(`  SILENT      ${rule}   <-- configured but did not report`);
    missing.push(rule);
  }
}

for (const [id, n] of counts) {
  if (id.startsWith('(parse error')) console.log(`  WARNING     ${n} × ${id} — a fixture is not being parsed, so it proves nothing`);
}

// Probes: boundaries classifies by path, and needs no type information.
const probeLint = new ESLint({
  ignore: false,
  overrideConfig: {
    languageOptions: { parserOptions: { projectService: false } },
    rules: { '@typescript-eslint/naming-convention': 'off' },
  },
});

console.log('\n=== probes: rules proven to fire at a path that means something ===');
for (const probe of PROBES) {
  const [res] = await probeLint.lintText(probe.code, { filePath: probe.filePath });
  const n = res.messages.filter((m) => m.ruleId === probe.rule).length;
  if (n > 0) console.log(`  FIRES (${String(n).padStart(3)})  ${probe.rule}  @ ${probe.filePath}`);
  else {
    console.log(`  SILENT      ${probe.rule}  @ ${probe.filePath}   <-- ${probe.why}`);
    missing.push(`${probe.rule} @ ${probe.filePath}`);
  }
}

console.log('\n=== known blind, recorded rather than hidden ===');
for (const k of KNOWN_BLIND) {
  const n = counts.get(k.rule) ?? 0;
  console.log(`  ${k.rule}: ${n > 0 ? `NOW FIRES (${n}) — re-test and promote to EXPECTED` : 'still blind'}`);
  console.log(`      ${k.why}`);
}

if (missing.length) {
  console.error(`\nFAIL: ${missing.length} rule(s) did not fire against something built to violate them.`);
  console.error('Either the fixture no longer violates the rule, or the rule is not doing anything.');
  process.exit(1);
}
console.log(`\nOK: ${EXPECTED.length} rules proven by fixture, ${PROBES.length} by probe, ${KNOWN_BLIND.length} recorded blind.`);

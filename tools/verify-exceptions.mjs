// ---------------------------------------------------------------------------
// THE EXCEPTION REGISTER HAS TWO HALVES AND THEY MUST AGREE — ADR-023.
//
// SPECIFICATION.md §12 is the prose register: what the exception is, why, and
// when it is reviewed. docs/architecture/exceptions.json is the machine-readable
// half that tools/scope.mjs computes the promotion count from.
//
// IT COMPARED E-NUMBERS AND NOTHING ELSE, AND THAT WAS THE DEFECT.
//
// Two identifier sets agreeing proves only that both halves know the same
// exceptions EXIST. It says nothing about what they exempt. So the halves could
// — and did — disagree about WHICH FILES ARE PROTECTED while this reported
// "both halves agree" every time it ran.
//
// It had a consequence, which is what separates it from the other instances in
// the runbook. §12 named four protected files; a paragraph at §11 named a fifth,
// Canvas2DCurtainRenderer.tsx, and called it one "that may not be edited at
// all". The register did not protect it. Both statements sat in the constitution
// for weeks, the check could not see the contradiction because the contradiction
// was in a field it never read, and the file was edited repeatedly — with the
// owner's authorisation, because the owner was reading the half that was right.
// The claim was withdrawn on 7 September 2026. See instance 10 in
// docs/runbooks/verifying-source-transforms.md.
//
// SO IT COMPARES PATHS NOW, in both directions:
//
//   1. per exception, the files §12's row names must be the files
//      exceptions.json lists — matched on basename, because §12 writes
//      `homography.ts` where the JSON writes the full path
//   2. any file the specification calls PROTECTED anywhere in its prose must
//      appear in the register. Check 1 keeps the table honest; only check 2
//      would have caught the paragraph, because the paragraph is not in a table
//
//   npm run check:exceptions
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');

const json = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/architecture/exceptions.json'), 'utf8'));
const spec = fs.readFileSync(path.join(ROOT, 'docs/architecture/SPECIFICATION.md'), 'utf8');

const inJson = new Set(json.exceptions.map((e) => e.id));
// §12's table rows begin `| E-NN |`.
const rows = new Map(
  [...spec.matchAll(/^\|\s*(E-\d{2})\s*\|([^\n]*)$/gm)].map((m) => [m[1], m[2]]),
);
const inSpec = new Set(rows.keys());

const missingFromSpec = [...inJson].filter((id) => !inSpec.has(id));
const missingFromJson = [...inSpec].filter((id) => !inJson.has(id));

console.log(`exceptions.json : ${[...inJson].sort().join(', ')}`);
console.log(`SPECIFICATION §12: ${[...inSpec].sort().join(', ')}`);

let failed = false;
if (missingFromSpec.length) {
  console.error(`\nFAIL: in exceptions.json but not in §12: ${missingFromSpec.join(', ')}`);
  console.error('An exception without an ADR and a §12 row is a violation. §12.');
  failed = true;
}
if (missingFromJson.length) {
  console.error(`\nFAIL: in §12 but not in exceptions.json: ${missingFromJson.join(', ')}`);
  console.error('Tooling cannot see this exception, so the promotion count is wrong.');
  failed = true;
}

// --- CHECK 1: the files each half names, per exception ----------------------
//
// A file token is anything in a code span that carries a source extension, or a
// path glob. `style-src 'unsafe-inline'` and prose are neither, so an exception
// that exempts no file (E-05) compares an empty set against an empty set and
// passes — correctly.
const FILE_TOKEN = /`([^`]*(?:\.tsx?|\.jsx?|\/\*+))`/g;
const filesIn = (text) =>
  new Set([...text.matchAll(FILE_TOKEN)].map((m) => path.basename(m[1]).replace(/\/?\*+$/, '')));

let pathsChecked = 0;
for (const e of json.exceptions) {
  const row = rows.get(e.id);
  if (row === undefined) continue; // already reported above
  const specFiles = filesIn(row);
  const jsonFiles = new Set((e.paths ?? []).map((p) => path.basename(p).replace(/\/?\*+$/, '')));
  pathsChecked += jsonFiles.size;

  const onlySpec = [...specFiles].filter((f) => !jsonFiles.has(f));
  const onlyJson = [...jsonFiles].filter((f) => !specFiles.has(f));
  if (onlySpec.length || onlyJson.length) {
    console.error(`\nFAIL: ${e.id} exempts different files in each half.`);
    if (onlySpec.length) console.error(`  §12 names, register does not: ${onlySpec.join(', ')}`);
    if (onlyJson.length) console.error(`  register names, §12 does not: ${onlyJson.join(', ')}`);
    console.error('  The identifiers matching is not agreement. What they exempt is.');
    failed = true;
  }
}

// --- CHECK 2: every file the prose calls protected is in the register --------
//
// The one that would have caught the paragraph. A file can be declared
// untouchable in a sentence, and a sentence is not a table row.
const registered = new Set(
  json.exceptions.flatMap((e) => (e.paths ?? []).map((p) => path.basename(p))),
);
// A code-spanned filename within 240 characters of the words "protected IP".
//
// WITH AN EXPLICIT OPT-OUT, because prose that WITHDRAWS a claim necessarily
// restates it. The §11 note recording that Canvas2DCurtainRenderer.tsx is not
// protected contains both the phrase and the filename, and a matcher cannot tell
// an assertion from its own retraction without guessing at negation — which is
// how a check starts having opinions about English.
//
// So the escape is declared rather than inferred: a window carrying the marker
// below is a statement ABOUT the register, not an entry in it. Same shape as an
// eslint-disable with a reason written beside it — visible in the diff, greppable,
// and it costs a deliberate act to add.
const OPT_OUT = 'check:exceptions ignore';
const claims = new Set();
for (const m of spec.matchAll(/protected IP/g)) {
  const window = spec.slice(Math.max(0, m.index - 240), m.index + 240);
  if (window.includes(OPT_OUT)) continue;
  for (const f of window.matchAll(FILE_TOKEN)) {
    const base = path.basename(f[1]);
    if (/\.(tsx?|jsx?)$/.test(base)) claims.add(base);
  }
}
const unregistered = [...claims].filter((f) => !registered.has(f));
if (unregistered.length) {
  console.error(`\nFAIL: called "protected IP" in the specification but absent from the register:`);
  for (const f of unregistered) console.error(`  ${f}`);
  console.error('  Either give it an E-number and a §12 row, or stop calling it protected.');
  console.error('  A file the constitution calls untouchable and the register does not protect');
  console.error('  is the shape that let Canvas2DCurtainRenderer.tsx be edited for weeks.');
  failed = true;
}

if (failed) process.exit(1);

console.log(`\nOK: ${inJson.size} exceptions, both halves agree on identifiers AND on paths.`);
console.log(`     ${pathsChecked} exempted path(s) matched between §12 and the register.`);
console.log(`     ${claims.size} file(s) called "protected IP" in prose, all registered.`);
const scoped = json.exceptions.filter((e) => e.excludesFromScope);
console.log(`     ${scoped.length} remove paths from the promotion count: ${scoped.map((e) => e.id).join(', ')}`);

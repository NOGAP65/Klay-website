// ---------------------------------------------------------------------------
// THE EXCEPTION REGISTER HAS TWO HALVES AND THEY MUST AGREE — ADR-023.
//
// SPECIFICATION.md §12 is the prose register: what the exception is, why, and
// when it is reviewed. docs/architecture/exceptions.json is the machine-readable
// half that tools/scope.mjs computes the promotion count from.
//
// Two copies of one list is the silent divergence §13 names, so this asserts
// they carry the same E-numbers. It does not compare the prose — that would be
// a spelling check on a constitution. It compares the set of identifiers, which
// is the part a tool depends on.
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
const inSpec = new Set([...spec.matchAll(/^\|\s*(E-\d{2})\s*\|/gm)].map((m) => m[1]));

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
if (failed) process.exit(1);

console.log(`\nOK: ${inJson.size} exceptions, both halves agree.`);
const scoped = json.exceptions.filter((e) => e.excludesFromScope);
console.log(`     ${scoped.length} remove paths from the promotion count: ${scoped.map((e) => e.id).join(', ')}`);

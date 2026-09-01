// ---------------------------------------------------------------------------
// THE IN-SCOPE LINT COUNT — the number that gates promotion. ADR-023.
//
//   npm run check:scope              counts by rule
//   npm run check:scope -- --cluster @typescript-eslint/naming-convention
//                                   groups one rule's findings by identifier,
//                                   which is how a rename cluster is sized
//
// Scope comes from tools/scope.mjs, which computes it from the exception
// register. It is not a list maintained here.
// ---------------------------------------------------------------------------

import { ESLint } from 'eslint';
import { isInScope, normalise, excludedBy, scopeExceptions } from './scope.mjs';

const clusterOf = process.argv.includes('--cluster')
  ? process.argv[process.argv.indexOf('--cluster') + 1]
  : null;

const eslint = new ESLint();
const results = await eslint.lintFiles(['.']);

const inScope = {};
const outOfScope = {};
const byException = {};
const cluster = {};
let totalIn = 0;
let totalAll = 0;

for (const r of results) {
  const rel = normalise(r.filePath);
  const keep = isInScope(r.filePath);
  const why = rel.startsWith('src/') ? excludedBy(rel) : 'not-src';
  for (const m of r.messages) {
    const id = m.ruleId ?? '(directive)';
    totalAll++;
    if (keep) {
      inScope[id] = (inScope[id] ?? 0) + 1;
      totalIn++;
      if (clusterOf && id === clusterOf) {
        const name = (m.message.match(/name `([^`]+)`/) ?? [])[1] ?? m.message.slice(0, 40);
        (cluster[name] = cluster[name] ?? new Set()).add(rel);
      }
    } else {
      outOfScope[id] = (outOfScope[id] ?? 0) + 1;
      if (why && why !== 'not-src') byException[why] = (byException[why] ?? 0) + 1;
    }
  }
}

console.log(`\nALL findings: ${totalAll}    IN-SCOPE: ${totalIn}\n`);
console.log('| Rule | in-scope | out-of-scope | promotable on in-scope zero? |');
console.log('|---|---:|---:|---|');
for (const [id, n] of Object.entries(inScope).sort((a, b) => b[1] - a[1])) {
  console.log(`| \`${id}\` | ${n} | ${outOfScope[id] ?? 0} | no — ${n} to clear |`);
}
for (const id of Object.keys(outOfScope).filter((k) => !(k in inScope)).sort()) {
  const marker = outOfScope[id] ? '**YES — in-scope zero**' : 'YES';
  console.log(`| \`${id}\` | **0** | ${outOfScope[id]} | ${marker} |`);
}

console.log('\nOut-of-scope findings by exception:');
for (const e of scopeExceptions) {
  console.log(`  ${e.id}  ${byException[e.id] ?? 0}`);
}

if (clusterOf) {
  console.log(`\n=== ${clusterOf}, clustered by identifier ===`);
  const rows = Object.entries(cluster).sort((a, b) => b[1].size - a[1].size);
  for (const [name, files] of rows) {
    console.log(`  ${String(files.size).padStart(3)} files  ${name}`);
  }
  console.log(`  (${rows.length} distinct identifiers)`);
}

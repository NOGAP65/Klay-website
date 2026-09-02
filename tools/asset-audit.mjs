// ---------------------------------------------------------------------------
// WHAT IS IN public/, WHAT REFERENCES IT, AND FROM WHERE.
//
// The last question is the one that matters. An asset referenced only from an
// E-08 file CANNOT BE MOVED — ADR-020 forbids editing those files for any
// reason, an import or a path rewrite included — so it stays where it is and
// goes on the demolition log instead.
//
// There is no typechecker for a string path. A renamed asset breaks a page
// silently, so this reports and moves nothing.
//
//   npm run audit:assets
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { isInScope, normalise } from './scope.mjs';

process.chdir(path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..'));

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

/** Every file that could name an asset. */
const sources = [
  ...walk('src'),
  ...walk('netlify'),
  ...(fs.existsSync('scripts') ? walk('scripts') : []),
  'index.html',
  'netlify.toml',
  'package.json',
].filter((f) => /\.(ts|tsx|js|mjs|css|html|json|toml)$/.test(f) && fs.existsSync(f));

const text = new Map();
for (const f of sources) text.set(f, fs.readFileSync(f, 'utf8'));

const assets = walk('public');
const rows = [];

for (const file of assets) {
  const rel = file.replace(/^public/, '');          // the URL path
  const base = path.basename(file);
  const size = fs.statSync(file).size;

  const referencedBy = [];
  for (const [src, body] of text) {
    // Match the URL path, or the bare filename (covers built paths and
    // %20-encoded names, which is how several of these are written).
    if (body.includes(rel) || body.includes(base) || body.includes(encodeURI(rel))) {
      referencedBy.push(src);
    }
  }

  const frozenRefs = referencedBy.filter((s) => s.startsWith('src/') && !isInScope(s));
  const liveRefs = referencedBy.filter((s) => !frozenRefs.includes(s));

  rows.push({ file, rel, size, referencedBy, frozenRefs, liveRefs });
}

const kb = (n) => (n / 1024).toFixed(0).padStart(6) + ' KB';
const total = rows.reduce((n, r) => n + r.size, 0);

console.log(`\npublic/ — ${rows.length} files, ${(total / 1048576).toFixed(1)} MB\n`);

const unreferenced = rows.filter((r) => r.referencedBy.length === 0);
const frozenOnly = rows.filter((r) => r.referencedBy.length > 0 && r.liveRefs.length === 0);
const live = rows.filter((r) => r.liveRefs.length > 0);

console.log(`  live (referenced from in-scope code) : ${live.length}  ${(live.reduce((n, r) => n + r.size, 0) / 1048576).toFixed(1)} MB`);
console.log(`  E-08 ONLY — CANNOT BE MOVED          : ${frozenOnly.length}  ${(frozenOnly.reduce((n, r) => n + r.size, 0) / 1048576).toFixed(1)} MB`);
console.log(`  unreferenced                         : ${unreferenced.length}  ${(unreferenced.reduce((n, r) => n + r.size, 0) / 1048576).toFixed(1)} MB`);

console.log('\n\n=== E-08 ONLY — these stay at their current path (ADR-020) ===');
for (const r of frozenOnly.sort((a, b) => b.size - a.size)) {
  console.log(`${kb(r.size)}  ${r.rel}`);
  console.log(`          <- ${r.frozenRefs.join(', ')}`);
}

console.log('\n\n=== UNREFERENCED — candidates for assets-source/ ===');
for (const r of unreferenced.sort((a, b) => b.size - a.size)) console.log(`${kb(r.size)}  ${r.rel}`);

console.log('\n\n=== LIVE — referenced from in-scope code, movable with their reference ===');
for (const r of live.sort((a, b) => a.rel.localeCompare(b.rel))) {
  console.log(`${kb(r.size)}  ${r.rel}`);
  console.log(`          <- ${r.liveRefs.map((s) => normalise(s)).join(', ')}`);
}

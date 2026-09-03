// ---------------------------------------------------------------------------
// THE FEATURE -> LEGACY COUNTDOWN.
//
// How many imports still reach out of src/features/ into a file that has not
// been given a layer yet. It goes to zero or the migration is not finished.
//
// IT ASKS THE REGISTER WHAT IS IN SCOPE. IT USED TO KNOW.
//
// This file carried its own copy of ADR-020 -- a hardcoded list of visualiser
// paths, and a hardcoded table saying which legacy modules could never move
// because out-of-scope files imported them, annotated "six visualiser files
// import it". When the visualiser was unfrozen on 3 September 2026 every one of
// those facts became false, and this tool went on reporting THIRTEEN PERMANENT
// EDGES THAT WILL NOT FALL. They had all become clearable that morning.
//
// A number that is wrong is worse than no number, because the countdown is the
// thing that says whether the migration is progressing. It would have kept
// saying "13 will never clear" until someone thought to doubt it.
//
// THE FIX IS NOT A BETTER LIST, IT IS NO LIST. Scope is defined once, in
// docs/architecture/exceptions.json, and tools/scope.mjs is the only thing that
// reads it. PERMANENT is now DERIVED: a legacy module is unmovable exactly when
// something out of scope imports it, which is a question that can be asked of
// the file system every time rather than answered once in a comment.
//
// This is the eighth instance in docs/runbooks/verifying-source-transforms.md
// and the first found by asking THE TEST of a tool that had not misled anyone
// yet. Same shape as the codemod's directory filter: a tool keeping a private
// copy of a fact the register owns.
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isInScope } from './scope.mjs';

process.chdir(path.resolve(fileURLToPath(import.meta.url), '../..'));

const LAYERS = ['app', 'config', 'design-system', 'features', 'shared'];

/** In src/, but not yet given a layer. */
const isLegacy = (p) => p.startsWith('src/') && !LAYERS.some((l) => p.startsWith('src/' + l + '/'))
  && p !== 'src/main.tsx' && p !== 'src/vite-env.d.ts';

function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(e.name)) acc.push(p.split(path.sep).join('/'));
  }
  return acc;
}

function resolve(from, spec) {
  if (spec.startsWith('@/')) {
    const map = { '@/app': 'src/app', '@/config': 'src/config', '@/ds': 'src/design-system',
      '@/features': 'src/features', '@/shared': 'src/shared' };
    for (const [a, real] of Object.entries(map)) {
      if (spec === a || spec.startsWith(a + '/')) {
        const rest = spec.slice(a.length).replace(/^\//, '');
        const base = rest ? real + '/' + rest : real + '/index';
        for (const c of [base + '.tsx', base + '.ts', base + '/index.tsx', base + '/index.ts'])
          if (fs.existsSync(c)) return c;
        return null;
      }
    }
    return null;
  }
  if (!spec.startsWith('.')) return null;
  const p = path.posix.normalize(path.posix.join(path.posix.dirname(from), spec)).replace(/\.tsx?$/, '');
  for (const c of [p + '.tsx', p + '.ts', p + '/index.tsx', p + '/index.ts']) if (fs.existsSync(c)) return c;
  return null;
}

const imports = (f) => [...fs.readFileSync(f, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)]
  .map((m) => resolve(f, m[1]))
  .filter(Boolean);

const all = walk('src');

// WHAT CANNOT MOVE, ASKED RATHER THAN REMEMBERED. A legacy module is stuck when
// something out of scope imports it: that importer will not be rewritten, so the
// edge onto the module never clears and the module cannot take a layer. With
// nothing under src/ excluded any more this set is empty, and the countdown says
// so out loud rather than printing a bare zero nobody can interpret.
const outOfScope = all.filter((f) => !isInScope(f));
const stuck = new Map();
for (const f of outOfScope) {
  for (const target of imports(f)) {
    if (!isLegacy(target) || target === f) continue;
    if (!stuck.has(target)) stuck.set(target, []);
    stuck.get(target).push(f);
  }
}
const isPermanent = (p) => !isInScope(p) || stuck.has(p);

const edges = [];
for (const f of all.filter((x) => x.startsWith('src/features/'))) {
  for (const target of imports(f)) if (isLegacy(target)) edges.push({ from: f, to: target });
}

const stillNeeded = new Map();
for (const e of edges) stillNeeded.set(e.to, (stillNeeded.get(e.to) || 0) + 1);

const clearable = edges.filter((e) => !isPermanent(e.to));
const permanent = edges.filter((e) => isPermanent(e.to));

console.log('=== feature -> legacy COUNTDOWN ===');
console.log('feature files reaching legacy : ' + new Set(edges.map((e) => e.from)).size);
console.log('distinct legacy targets       : ' + stillNeeded.size);
console.log('total edges                   : ' + edges.length);
console.log('  of which CLEARABLE          : ' + clearable.length + '   <- this is the countdown');
console.log('  of which PERMANENT          : ' + permanent.length
  + (permanent.length ? '   <- held down by an out-of-scope importer' : ''));

console.log('\nout-of-scope files under src/  : ' + outOfScope.length
  + (outOfScope.length ? '' : '   (nothing is excluded — so nothing is permanent)'));

console.log('\n--- legacy files still reachable through the allowance ---');
for (const [f, n] of [...stillNeeded].sort((a, b) => b[1] - a[1])) {
  const held = stuck.get(f);
  const tag = !isInScope(f) ? '   [OUT OF SCOPE]'
    : held ? '   [PERMANENT — held by ' + held.length + ': ' + held[0] + (held.length > 1 ? ' +' + (held.length - 1) : '') + ']'
    : '';
  console.log('  ' + String(n).padStart(3) + '  ' + f + tag);
}

console.log('\n--- which feature reaches what ---');
for (const e of edges.sort((a, b) => a.from.localeCompare(b.from))) {
  console.log('  ' + e.from.replace('src/features/', '') + '  ->  ' + e.to);
}

console.log('\n=== remaining legacy surface ===');
const legacyFiles = all.filter(isLegacy);
console.log('files still in src/ outside a layer: ' + legacyFiles.length);
const byDir = new Map();
for (const f of legacyFiles) {
  const d = f.split('/').slice(0, 2).join('/');
  byDir.set(d, (byDir.get(d) || 0) + 1);
}
for (const [d, n] of [...byDir].sort((a, b) => b[1] - a[1])) console.log('  ' + String(n).padStart(3) + '  ' + d + '/');

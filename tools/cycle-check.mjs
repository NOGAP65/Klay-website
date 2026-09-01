// ---------------------------------------------------------------------------
// RUNTIME IMPORT CYCLES — the check `import/no-cycle` is not performing.
//
// SPECIFICATION.md §11 lists "No circular imports -> import/no-cycle" as an
// enforced rule. The rule is configured in eslint.config.js, the TypeScript
// resolver is installed and resolving (import/no-unresolved is silent on every
// `@/` specifier), and it still reports ZERO against cycles that demonstrably
// exist. It does not traverse a barrel's `export ... from` re-exports, so every
// cycle that closes through a feature's index.ts is invisible to it — which is
// the only shape of cycle this architecture can now produce.
//
// That is the same failure mode Phase 2 found in eslint-plugin-boundaries: a
// rule that is switched on, believed, and silently checking nothing. §11's
// whole argument is that a rule relying on someone remembering it is a hope
// rather than a rule; a rule that reports zero because it cannot see is worse,
// because it also reports success.
//
// So this exists until import/no-cycle can be made to work. It is a plain DFS
// over the same alias map the countdown uses.
//
//   node tools/cycle-check.mjs         list cycles, exit 1 if any
//   node tools/cycle-check.mjs --count print the count only
//
// TYPE-ONLY EDGES ARE NOT CYCLES. `import type` and `export type` are erased
// before anything runs, and so is a braced import whose every specifier is
// `type`-prefixed. Counting those would report cycles that cannot exist at
// runtime, and a checker with false positives gets switched off.
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
process.chdir(ROOT);

const ALIAS = {
  '@/app': 'src/app',
  '@/config': 'src/config',
  '@/ds': 'src/design-system',
  '@/features': 'src/features',
  '@/shared': 'src/shared',
  '@/core': 'shared-core',
};

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(p.split(path.sep).join('/'));
  }
  return acc;
}

function tryFiles(base) {
  for (const c of [base + '.tsx', base + '.ts', base + '/index.tsx', base + '/index.ts']) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function resolve(from, spec) {
  if (spec.startsWith('@/')) {
    for (const [alias, real] of Object.entries(ALIAS)) {
      if (spec === alias || spec.startsWith(alias + '/')) {
        const rest = spec.slice(alias.length).replace(/^\//, '');
        return tryFiles(rest ? real + '/' + rest : real + '/index');
      }
    }
    return null;
  }
  if (!spec.startsWith('.')) return null;
  const p = path.posix
    .normalize(path.posix.join(path.posix.dirname(from), spec))
    .replace(/\.tsx?$/, '');
  return tryFiles(p);
}

/** True when the statement is erased before runtime and cannot form a cycle. */
function isTypeOnly(statement, clause) {
  if (/^\s*(?:import|export)\s+type\b/.test(statement)) return true;
  const braced = clause.match(/\{([^}]*)\}/);
  if (!braced) return false;
  const specifiers = braced[1].split(',').map((s) => s.trim()).filter(Boolean);
  return specifiers.length > 0 && specifiers.every((s) => /^type\s/.test(s));
}

const files = walk('src');
const graph = new Map();
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const deps = [];
  for (const m of text.matchAll(/(?:^|\n)(\s*(?:import|export)(?:[^;'"]|'[^']*'|"[^"]*")*?from\s+['"]([^'"]+)['"])/g)) {
    if (isTypeOnly(m[1], m[1])) continue;
    const target = resolve(file, m[2]);
    if (target) deps.push(target);
  }
  graph.set(file, deps);
}

const state = new Map();
const stack = [];
const cycles = [];
function visit(node) {
  state.set(node, 1);
  stack.push(node);
  for (const dep of graph.get(node) ?? []) {
    if (state.get(dep) === 1) cycles.push([...stack.slice(stack.indexOf(dep)), dep]);
    else if (!state.has(dep)) visit(dep);
  }
  stack.pop();
  state.set(node, 2);
}
for (const f of files) if (!state.has(f)) visit(f);

if (process.argv.includes('--count')) {
  console.log(cycles.length);
} else if (cycles.length === 0) {
  console.log(`ZERO runtime import cycles across ${files.length} files in src/.`);
} else {
  console.log(`${cycles.length} runtime import cycle(s):\n`);
  for (const c of cycles) console.log('  ' + c.join('\n    -> ') + '\n');
}
process.exit(cycles.length === 0 ? 0 : 1);

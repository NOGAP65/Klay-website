// ---------------------------------------------------------------------------
// WHAT IS IN SCOPE — the definition that gates `warn` -> `error`. ADR-023.
//
//   in-scope = every file under src/, MINUS the paths named by any exception in
//              docs/architecture/exceptions.json carrying excludesFromScope,
//              MINUS netlify/, scripts/, tools/, assets-source/.
//
// THE SET IS COMPUTED FROM THE EXCEPTION REGISTER, NOT HAND-MAINTAINED. That is
// the whole point: a second, hand-kept list of "things we are not counting" is
// the silent divergence §13 names, and it would drift the moment an exception
// retired. When one retires, its files re-enter scope on the next run without
// anybody remembering to delete a line here.
//
// The four flat exclusions are not exceptions and deliberately do not live in
// the register. netlify/ is a separate runtime on a separate tsconfig; tools/
// and scripts/ are build-time; assets-source/ holds no code. None of them is a
// concession about src/, which is what §12 is for.
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');

/** Not exceptions — whole trees that were never governed by §12. */
export const NON_SRC_EXCLUSIONS = ['netlify/', 'scripts/', 'tools/', 'assets-source/'];

const register = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs/architecture/exceptions.json'), 'utf8'),
);

/** Every exception that removes its paths from the promotion count. */
export const scopeExceptions = register.exceptions.filter((e) => e.excludesFromScope);

/** `src/a/**` -> matches anything under src/a. `src/a/b.ts` -> exact. */
function toMatcher(pattern) {
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -2);
    return (p) => p.startsWith(prefix);
  }
  return (p) => p === pattern;
}

const excluded = scopeExceptions.flatMap((e) =>
  e.paths.map((p) => ({ id: e.id, pattern: p, match: toMatcher(p) })),
);

/** Repo-relative, forward-slashed. */
export function normalise(filePath) {
  const s = filePath.split(path.sep).join('/');
  const i = s.indexOf('Klay-website-new/');
  return i >= 0 ? s.slice(i + 'Klay-website-new/'.length) : s.replace(/^\.\//, '');
}

/** Which exception removes this path from scope, or null if it is in scope. */
export function excludedBy(relPath) {
  if (!relPath.startsWith('src/')) return 'not-src';
  for (const e of excluded) if (e.match(relPath)) return e.id;
  return null;
}

export function isInScope(filePath) {
  const rel = normalise(filePath);
  if (NON_SRC_EXCLUSIONS.some((x) => rel.startsWith(x))) return false;
  return excludedBy(rel) === null;
}

if (process.argv[1] && process.argv[1].endsWith('scope.mjs')) {
  console.log('Scope-excluding exceptions, read from docs/architecture/exceptions.json:\n');
  for (const e of scopeExceptions) {
    console.log(`  ${e.id}  ${e.summary}`);
    for (const p of e.paths) console.log(`        ${p}`);
    console.log(`        retires: ${e.retiresWhen ?? '—'}\n`);
  }
  console.log('Flat non-src exclusions (not exceptions): ' + NON_SRC_EXCLUSIONS.join(', '));
}

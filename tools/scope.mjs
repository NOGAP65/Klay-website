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

/**
 * THE FILE LIST. Every in-scope source file, walked once, filtered here.
 *
 * This exists so that no tool ever has a reason to write its own walker, and
 * that is the point rather than a convenience. Twice in this migration the
 * correct scope check already existed and an ad-hoc substitute was written
 * anyway — once a `tsc` run per batch instead of per operation, once a
 * directory-name filter that missed `src/pages/VisualizerLabPage.tsx` because
 * it is a file and spelled with a z. E-08 was edited.
 *
 * **The cause was an asymmetry: two lines of `readdirSync` is faster to write
 * than an import is to look up.** Making the correct path mandatory does not
 * fix that; making it FASTER does. So the list is one import and no arguments.
 */
export function inScopeFiles({ root = 'src', extensions = /\.(ts|tsx)$/ } = {}) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (extensions.test(entry.name) && isInScope(rel)) out.push(rel);
    }
  };
  walk(root);
  return out;
}

/**
 * Throws rather than returning false. For the write path, where a wrong answer
 * that is merely reported gets ignored by the next line of code.
 */
export function assertInScope(filePath) {
  const rel = normalise(filePath);
  if (isInScope(rel)) return rel;
  const why = NON_SRC_EXCLUSIONS.find((x) => rel.startsWith(x))
    ? `outside src/ (${NON_SRC_EXCLUSIONS.find((x) => rel.startsWith(x))})`
    : `exception ${excludedBy(rel)}`;
  throw new Error(
    `REFUSED: ${rel} is out of scope — ${why}.\n` +
      `  Nothing in tools/ may modify it. If it genuinely must change, the exception ` +
      `has to be retired first, in docs/architecture/exceptions.json and SPECIFICATION.md §12, ` +
      `with an ADR. That is the whole point of the register.`,
  );
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

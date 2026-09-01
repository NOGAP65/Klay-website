// ---------------------------------------------------------------------------
// SOURCE TRANSFORMS, WITH THE TWO SAFEGUARDS PHASE 7 LEARNED THE HARD WAY.
//
// Phase 7 renamed 41 identifiers. The transform was written inline and was
// subtly wrong twice, both times producing a plausible-looking diff. `tsc -b`
// caught both in seconds. Neither would have survived review, because both
// LOOKED right.
//
// This exists so the next naming pass — there is one waiting, 127 findings
// arrive when E-08 retires — starts from the fixed version.
//
//   1. THE COMMENT MASK PRESERVES LINE COUNT.
//
//      The first version replaced each comment with a single placeholder token.
//      A twelve-line block comment became one line, every line number after it
//      shifted, and line-range-scoped edits landed in the wrong scope. In
//      VisualiserShowcase that meant renaming a NUMBER prop called `active`
//      into `isActive`, colliding with a real `isActive` two lines below.
//
//      Masking is still necessary — ADR-018: a scripted substitution operates
//      on code only, because a rename that rewrites a comment can turn it into
//      confident misinformation. So the mask keeps the newlines.
//
//   2. VERIFY PER OPERATION, NOT PER BATCH.
//
//      `renameAll` typechecks after EACH rename by default and reverts the one
//      that broke. A batch of 41 checked once at the end tells you something
//      broke; it does not tell you which, and the failures interact. See
//      docs/runbooks/verifying-source-transforms.md.
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

/**
 * A sentinel that cannot occur in TypeScript source. Unicode private-use area
 * rather than NUL: a NUL byte survives a string round-trip but renders as
 * nothing in a terminal, a diff or an editor, which makes a mistake in here
 * invisible exactly when you are debugging one.
 */
const MARK = '';

/**
 * Replace every comment with a placeholder OF THE SAME LINE COUNT, so line
 * numbers in the masked text match line numbers in the source.
 */
export function maskComments(source) {
  const stash = [];
  const masked = source.replace(/\/\*[\s\S]*?\*\/|(^|[^:])\/\/[^\n]*/g, (match) => {
    const index = stash.push(match) - 1;
    const newlines = (match.match(/\n/g) ?? []).length;
    // The token carries its own newlines back, so nothing downstream shifts —
    // and it carries the COUNT, so unmasking restores exactly the newlines it
    // injected rather than swallowing one belonging to the code after it.
    return `${MARK}${index}:${newlines}${MARK}` + '\n'.repeat(newlines);
  });
  return { masked, stash };
}

export function unmaskComments(masked, stash) {
  const pattern = new RegExp(`${MARK}(\\d+):(\\d+)${MARK}\\n*`, 'g');
  return masked.replace(pattern, (whole, index, injected) => {
    const surplus = (whole.match(/\n/g) ?? []).length - Number(injected);
    return stash[Number(index)] + '\n'.repeat(Math.max(0, surplus));
  });
}

/** Whole-word, never a property access, never part of a longer identifier. */
export function identifierPattern(name) {
  return new RegExp(`(?<![.\\w$])${name}(?![\\w$])`, 'g');
}

export function typecheck() {
  try {
    execFileSync('npx', ['tsc', '-b'], { encoding: 'utf8', stdio: 'pipe', shell: true });
    return { ok: true, errors: [] };
  } catch (e) {
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    const errors = out.split('\n').filter((l) => /error TS/.test(l));
    return { ok: errors.length === 0, errors };
  }
}

/**
 * One rename, in one file, optionally scoped to a line range (1-indexed,
 * inclusive) — and the range means SOURCE lines, which is the whole point of
 * the line-preserving mask above.
 */
export function renameInFile(file, oldName, newName, { from, to } = {}) {
  const source = fs.readFileSync(file, 'utf8');
  const { masked, stash } = maskComments(source);
  const lines = masked.split('\n');
  const start = from ? from - 1 : 0;
  const end = to ?? lines.length;
  const pattern = identifierPattern(oldName);
  let hits = 0;
  for (let i = start; i < end; i++) {
    lines[i] = lines[i].replace(pattern, () => { hits++; return newName; });
  }
  if (hits) fs.writeFileSync(file, unmaskComments(lines.join('\n'), stash));
  return hits;
}

/**
 * A batch, verified per operation. Any rename that breaks the typecheck is
 * reverted immediately and reported, so one bad rename cannot be diagnosed
 * through the wreckage of the forty after it.
 */
export function renameAll(renames, { verify = true } = {}) {
  const applied = [];
  const failed = [];
  for (const rename of renames) {
    const { file, from: oldName, to: newName, fromLine, toLine } = rename;
    const before = fs.readFileSync(file, 'utf8');
    const hits = renameInFile(file, oldName, newName, { from: fromLine, to: toLine });
    if (!hits) {
      failed.push({ ...rename, why: 'no occurrences' });
      console.error(`  NO MATCH  ${oldName} in ${file}`);
      continue;
    }
    if (verify) {
      const { ok, errors } = typecheck();
      if (!ok) {
        fs.writeFileSync(file, before);
        failed.push({ ...rename, why: errors.slice(0, 3).join(' | ') });
        console.error(`  REVERTED  ${oldName} -> ${newName}  ${file}`);
        for (const e of errors.slice(0, 3)) console.error(`            ${e}`);
        continue;
      }
    }
    applied.push({ ...rename, hits });
    console.log(`  ${String(hits).padStart(3)}x  ${oldName} -> ${newName}   ${file}`);
  }
  return { applied, failed };
}

/** ADR-018: prove no comment was rewritten. Any output is a comment to review. */
export function commentsTouchedBy(newNames) {
  const diff = execFileSync('git', ['diff', '-U0'], { encoding: 'utf8', shell: true });
  return diff
    .split('\n')
    .filter((l) => l.startsWith('+') && /^\+\s*(\/\/|\*|\/\*)/.test(l))
    .filter((l) => newNames.some((n) => l.includes(n)));
}

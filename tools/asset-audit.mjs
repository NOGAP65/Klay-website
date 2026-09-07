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

/** ASSERT THAT A PATH-SCOPED PREFIX STILL MATCHES SOMETHING.
 *
 * THE RULE, and it is general: a guard scoped by a path prefix must assert the
 * prefix matches at least one file, or fail. A selector that matches nothing is
 * a failing check, not a passing one.
 *
 * This exists because the constructed-path guard below silently stopped working.
 * It tested `/images/Textures/wardrobes/`; U4 moved those files to
 * `/images/visualiser/textures/wardrobes/` and did not move the guard. The
 * prefix matched nothing, so every wardrobe asset addressed by expression was
 * classified by static reference count — the exact failure the guard exists to
 * prevent — and the tool reported "UNSAFE TO CLASSIFY: 0" as though that were
 * good news.
 *
 * A zero from a filter is ambiguous: it means either "nothing qualifies" or
 * "the question was malformed". Those two readings need different responses and
 * a bare count cannot tell them apart, so the tool must not be allowed to print
 * one without having checked which it is.
 */
function assertPrefixMatches(prefix, paths, what) {
  if (paths.some((p) => p.startsWith(prefix))) return;
  console.error(`\nFAIL: ${what} is scoped to '${prefix}', which matches no file.`);
  console.error('A prefix that matches nothing is a guard that has stopped guarding.');
  console.error('Either the files moved and the scope did not follow, or the scope is a typo.');
  process.exit(1);
}

/** WHERE THE CONSTRUCTED WARDROBE PATHS POINT — read from the source, not typed
 * here.
 *
 * The literal is what went stale. verify-wardrobe-manifest.mjs has always read
 * this same constant out of wardrobes.ts and fails loudly when it cannot find
 * it, which is exactly why that tool survived U4 untouched while this one did
 * not. Same technique, same reason.
 */
const WARDROBE_DIR = (() => {
  const models = fs.readFileSync('src/features/visualiser/wardrobes.ts', 'utf8');
  const dir = models.match(/^const DIR = '([^']+)';/m)?.[1];
  if (!dir) {
    console.error("FAIL: could not read DIR from wardrobes.ts. The constant moved or was renamed.");
    console.error('This tool cannot identify constructed asset paths without it, and guessing');
    console.error('is what put it in this state before. Fix the read rather than hardcoding.');
    process.exit(1);
  }
  return dir.endsWith('/') ? dir : dir + '/';
})();

const assets = walk('public');

// THE RULE, APPLIED TO EVERY PREFIX THIS TOOL SCOPES BY. Each of these silently
// changes the tool's answer if it stops matching, and none of them would say so.
const assetPaths = assets.map((f) => f.replace(/^public/, ''));
const sourcePaths = [...text.keys()];
assertPrefixMatches(WARDROBE_DIR, assetPaths, 'the constructed-path guard');
assertPrefixMatches('src/', sourcePaths, 'the in-scope reference filter');
assertPrefixMatches('netlify/', sourcePaths, 'the build-input reference filter');
assertPrefixMatches('scripts/', sourcePaths, 'the build-input reference filter');

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
  // scripts/ and netlify/ are NOT the browser. An asset named only by a build
  // script is a build input, not a web asset — and counting those as "live"
  // once hid two wardrobe renders that wardrobeCutouts.ts (E-08) also names.
  const buildRefs = referencedBy.filter((s) => s.startsWith('scripts/') || s.startsWith('netlify/'));
  const liveRefs = referencedBy.filter(
    (s) => !frozenRefs.includes(s) && !buildRefs.includes(s),
  );

  // CONSTRUCTED PATHS DEFEAT ALL OF THIS. wardrobes.ts builds every render's
  // path as `${model.id}-${colourSlug}-${view}.png`, so a file can be loaded at
  // runtime while appearing in no source file at all. Anything under this
  // directory is therefore UNSAFE TO CLASSIFY and must not be moved on the
  // strength of a static count.
  const constructedPath = rel.startsWith(WARDROBE_DIR);

  rows.push({ file, rel, size, referencedBy, frozenRefs, buildRefs, liveRefs, constructedPath });
}

const kb = (n) => (n / 1024).toFixed(0).padStart(6) + ' KB';
const total = rows.reduce((n, r) => n + r.size, 0);

console.log(`\npublic/ — ${rows.length} files, ${(total / 1048576).toFixed(1)} MB\n`);

// Ordered: the unsafe class is taken out FIRST, so nothing under it can be
// reported as movable by any later rule.
const unsafe = rows.filter((r) => r.constructedPath);
const rest = rows.filter((r) => !r.constructedPath);

const unreferenced = rest.filter((r) => r.referencedBy.length === 0);
const buildOnly = rest.filter((r) => r.referencedBy.length > 0 && r.liveRefs.length === 0 && r.frozenRefs.length === 0);
const frozenOnly = rest.filter((r) => r.liveRefs.length === 0 && r.frozenRefs.length > 0);
const live = rest.filter((r) => r.liveRefs.length > 0);

console.log(`  UNSAFE TO CLASSIFY (constructed paths)  : ${unsafe.length}  ${(unsafe.reduce((n, r) => n + r.size, 0) / 1048576).toFixed(1)} MB`);
console.log(`  build-input only (scripts/, netlify/)   : ${buildOnly.length}  ${(buildOnly.reduce((n, r) => n + r.size, 0) / 1048576).toFixed(1)} MB`);

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

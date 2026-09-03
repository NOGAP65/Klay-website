// ---------------------------------------------------------------------------
// EVERY LITERAL ASSET PATH IN THE SOURCE RESOLVES TO A FILE IN public/.
//
// THE DIRECTION asset-audit.mjs DOES NOT GO. That tool asks, of each file in
// public/, what references it — which finds assets nobody uses. This asks the
// reverse: of each path the code names, does the file exist? Those are
// different questions and only the second one catches a broken picture.
//
// WHY THE BROWSER CHECK COULD NOT DO IT. The image check counted non-200
// responses, and in a single-page app THERE ARE NONE. Vite and Netlify both
// fall back to index.html for any unmatched path, so a missing image returns
// 200 with 9 KB of HTML in it. The <img> fails to decode and renders broken,
// while every status code in the trace says success.
//
// That is THE TEST's first row exactly: a check whose output is identical
// whether or not the thing it checks is broken. It ran for months and reported
// zero, and three preset room photographs were broken the whole time:
//
//     /images/room-3.png    the files are at /images/rooms/room-N.png
//     /images/room-4.png
//     /images/room-5.png
//
// A page requesting them got HTML, decoded nothing, and showed three empty
// frames on "Visualise in your own room".
//
// SO THIS CHECK IS STATIC, AND THAT IS THE POINT. It never starts a browser,
// never makes a request, and cannot be fooled by a fallback: it reads the
// source, takes every string that looks like a public asset, and asks the file
// system. A missing file is an exit code.
//
// CONSTRUCTED PATHS ARE REPORTED, NOT CHECKED. A template literal with an
// expression in it does not name one file, so this cannot verify it — see
// SPECIFICATION.md §12 on runtime-assembled paths, and check:wardrobe-assets
// for how the wardrobe set is covered instead. They are listed so the count of
// unverifiable references is visible rather than assumed to be zero.
//
//   npm run check:asset-paths
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { maskComments } from './codemod.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
process.chdir(ROOT);

/** Everything served from public/ at the web root. */
const PUBLIC = 'public';

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx|js|jsx|html|css)$/.test(entry.name)) acc.push(p.split(path.sep).join('/'));
  }
  return acc;
}

const sources = [...walk('src'), 'index.html'].filter((f) => fs.existsSync(f));

/** A quoted string starting with a slash and ending in an asset extension. */
const LITERAL = /['"`](\/[^'"`\n]*\.(?:png|jpe?g|gif|svg|webp|avif|mp4|webm|woff2?|ttf|otf|pdf|ico))['"`]/gi;
/** The same, but carrying a ${...} — one reference that names many files. */
const CONSTRUCTED = /[`]([^`\n]*\$\{[^`\n]*\.(?:png|jpe?g|gif|svg|webp|avif|mp4|webm))[`]/gi;

const missing = [];
const constructed = [];
let checked = 0;

for (const file of sources) {
  // COMMENTS ARE NOT REFERENCES, and this tool proved it the hard way: the
  // comment written above the fix it had just prompted named /images/room-N.png
  // as an illustration, and the next run failed on it. A gate that reports
  // prose as a broken asset is a gate people learn to argue with.
  //
  // It masks with codemod.mjs's mask rather than a second regex of its own —
  // that one already handles the case a naive strip gets wrong, a // inside a
  // string literal such as an https:// URL, and instance 8 is about tools
  // keeping private copies of things another tool owns.
  const { masked: text } = maskComments(fs.readFileSync(file, 'utf8'));

  for (const m of text.matchAll(LITERAL)) {
    const raw = m[1];
    // Percent-encoded at the source is normal — a filename with a space is not
    // a URL the browser will fetch otherwise. Decode before hitting the disk.
    let rel;
    try { rel = decodeURIComponent(raw); } catch { rel = raw; }
    checked++;
    if (!fs.existsSync(path.join(PUBLIC, rel.replace(/^\//, '').split('?')[0].split('#')[0]))) {
      missing.push({ file, raw, rel });
    }
  }

  for (const m of text.matchAll(CONSTRUCTED)) constructed.push({ file, expr: m[1] });
}

console.log(`\nliteral asset paths checked : ${checked}  across ${sources.length} source files`);
console.log(`constructed paths (not checkable here) : ${constructed.length}`);
for (const c of constructed) console.log(`    ${c.file}  ${c.expr.length > 70 ? c.expr.slice(0, 70) + '…' : c.expr}`);

if (missing.length) {
  console.error(`\nFAIL: ${missing.length} path(s) name a file that is not in ${PUBLIC}/.`);
  for (const m of missing) console.error(`    ${m.file}\n        ${m.rel}`);
  console.error(`
These do NOT 404. The dev server and Netlify both fall back to index.html, so
the request returns 200 with HTML in it and the <img> renders broken while every
status code says success. That is why this check reads the file system instead
of the network.`);
  process.exit(1);
}
console.log(`\nOK: every literal asset path resolves to a file in ${PUBLIC}/.`);

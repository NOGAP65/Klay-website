// ---------------------------------------------------------------------------
// EVERY WARDROBE FILE THE CODE NAMES EXISTS, AND EVERY ARTWORK ID RESOLVES.
//
// WHY THIS EXISTS. Wardrobe artwork is reached through a path assembled at
// runtime -- a directory constant plus a name out of the manifest -- so no
// static check can see it. Worse, a miss is SILENT BY DESIGN: loadAsset
// resolves null on a 404 and the renderer substitutes the legacy sticker. The
// page renders, the console is clean, and the picture is wrong.
//
// That is R1 in UNFREEZE_MAP.md, in the one area the render baseline does not
// yet cover. Until the wardrobe baseline cases exist, THIS is what stands
// between U4 and a silently degraded wardrobe. It converts a 404 that whispers
// into an exit code.
//
// It reads the manifest and the model table as TEXT rather than importing them,
// because they are .ts and this runs in node without a build step. That is a
// weaker coupling than an import and it is the right one here: the check should
// keep working while the module graph around it is being moved.
//
//   npm run check:wardrobe-assets
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const cutouts = read('src/visualiser/wardrobeCutouts.ts');
const models = read('src/visualiser/wardrobes.ts');

/** The directory constant, read from the source rather than repeated here --
 * a second copy of it is exactly the drift this check is meant to catch. */
const dir = models.match(/^const DIR = '([^']+)';/m)?.[1];
if (!dir) {
  console.error('FAIL: could not read DIR from wardrobes.ts. The constant moved or was renamed.');
  process.exit(1);
}
const onDisk = (file) => fs.existsSync(path.join(ROOT, 'public', dir.replace(/^\//, ''), file));

const problems = [];

// 1. Every file the manifest names is on disk.
const files = [...cutouts.matchAll(/^\s+file: "([^"]+)",$/gm)].map((m) => m[1]);
if (!files.length) problems.push('the manifest yielded no files — the shape of wardrobeCutouts.ts changed');
for (const file of files) if (!onDisk(file)) problems.push(`manifest names a missing file: ${dir}/${file}`);

// 2. Every artworkId a model claims has a manifest entry.
const ids = new Set([...cutouts.matchAll(/^\s+id: "([^"]+)",$/gm)].map((m) => m[1]));
const claimed = [...models.matchAll(/artworkId: '([^']+)'/g)].map((m) => m[1]);
for (const id of claimed) if (!ids.has(id)) problems.push(`a model claims artworkId "${id}", which the manifest does not have`);

// 3. Every legacy sticker a model falls back to is on disk.
const legacy = [...models.matchAll(/legacyFile: '([^']+)'/g)].map((m) => m[1]);
for (const file of legacy) if (!onDisk(file)) problems.push(`a model names a missing legacy sticker: ${dir}/${file}`);

console.log(`\nwardrobe assets under ${dir}`);
console.log(`  ${files.length} cut-outs in the manifest`);
console.log(`  ${claimed.length} models claiming artwork, ${ids.size} artwork ids available`);
console.log(`  ${legacy.length} legacy stickers referenced`);

if (problems.length) {
  console.error(`\nFAIL: ${problems.length} problem(s).`);
  for (const p of problems) console.error('  ' + p);
  console.error('\nA missing wardrobe file does not 404 loudly — it falls back to the legacy');
  console.error('sticker and every other check stays green. That is why this one exits 1.');
  process.exit(1);
}
console.log('\nOK: every wardrobe file the code names is on disk.');

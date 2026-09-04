// ASSERTS EVERY FILE fabricShots.ts NAMES IS ON DISK.
//
// This is the half that makes the manifest worth having. Enumerating the set
// only helps if something checks the enumeration against reality; without this,
// a renamed or deleted photograph is a broken image a customer finds, which is
// exactly the failure the specification records for the wardrobe renders.
//
// It also checks the other direction -- a file in the directory that no entry
// names -- because an unreferenced photograph is either a naming mistake or a
// forgotten `npm run gen:fabric-shots`, and both are worth knowing about.
//
// Run: node tools/verify-fabric-shots.mjs
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Both layouts — see the note in generate-fabric-shots.mjs.
const DIR = 'public/images/fabrics';
const MANIFEST = ['src/features/catalogue/fabricShots.ts', 'src/data/fabricShots.ts']
  .find(p => existsSync(p)) ?? 'src/features/catalogue/fabricShots.ts';

if (!existsSync(MANIFEST)) {
  console.log('  no fabricShots.ts yet — nothing to verify.');
  process.exit(0);
}

const src = readFileSync(MANIFEST, 'utf8');
const entries = [...src.matchAll(
  /\{ product: '([^']+)', fabric: '([^']+)', file: '([^']+)', mask: (null|'[^']+'), hardware: (null|'[^']+') \},/g,
)].map(m => ({
  product: m[1],
  fabric: m[2],
  file: m[3],
  mask: m[4] === 'null' ? null : m[4].slice(1, -1),
  hardware: m[5] === 'null' ? null : m[5].slice(1, -1),
}));

if (!entries.length) {
  console.error('  fabricShots.ts parsed to zero entries — the format has changed.');
  process.exit(1);
}

const missing = [];
const named = new Set();
for (const e of entries) {
  named.add(e.file);
  if (!existsSync(join(DIR, e.file))) missing.push(`${e.file}  (${e.product} / ${e.fabric})`);
  for (const [kind, f] of [['mask', e.mask], ['hardware', e.hardware]]) {
    if (!f) continue;
    named.add(f);
    if (!existsSync(join(DIR, f))) missing.push(`${f}  (${kind} for ${e.product})`);
  }
}

const onDisk = existsSync(DIR) ? readdirSync(DIR).filter(f => /\.(webp|png|jpe?g)$/i.test(f)) : [];
const orphans = onDisk.filter(f => !named.has(f));

if (missing.length) {
  console.error('  NAMED BUT NOT ON DISK:');
  for (const m of missing) console.error('    ' + m);
}
if (orphans.length) {
  console.error('  ON DISK BUT NAMED BY NOTHING:');
  for (const o of orphans) console.error('    ' + o);
  console.error('    (run `npm run gen:fabric-shots`, or check the file name against the catalogue)');
}
if (missing.length || orphans.length) process.exit(1);

console.log(`  ${entries.length} shot${entries.length === 1 ? '' : 's'}, every file present.`);

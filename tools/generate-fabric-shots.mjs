// GENERATES src/features/catalogue/fabricShots.ts FROM WHAT IS ON DISK.
//
// The shop card needs to find the photograph for a given product and fabric.
// The obvious way to do that is to build the name — `${product}-${fabric}.webp`
// — and the specification forbids it, for a reason it paid to learn:
//
//   > Twenty-eight files loaded through that expression and appeared in no
//   > source file at all... the unauditable version was concealing a defect the
//   > whole time. The built name used `model.id` where the files are named by
//   > `artworkId`, so seven of ten models could only ever have requested a file
//   > that has never existed.
//
// So the set is enumerated instead. This script reads the directory, checks each
// name against the catalogue's own product and variant ids, and writes a module
// carrying every file's own string. `npm run check:fabric-shots` then asserts
// that every file the module names is still on disk — which is the half that
// makes a rename fail loudly rather than silently.
//
// A SHOT IS DYED IF ITS PRODUCT HAS A MASK. One mask per product, not per
// fabric: the four roller fabrics are the same window in the same room, so the
// blind occupies the same pixels in all of them and one cut serves all four.
//
// Run: node tools/generate-fabric-shots.mjs
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// TWO LAYOUTS, ONE TOOL. This repository is mid-migration: `main` still keeps
// the catalogue in src/data, the refactor branch has it in a feature. Detecting
// which is present beats maintaining two copies of a generator that would
// otherwise drift apart silently.
const DIR = 'public/images/fabrics';
const LAYOUTS = [
  { opts: 'src/features/catalogue/configOptions.ts', out: 'src/features/catalogue/fabricShots.ts' },
  { opts: 'src/data/configOptions.ts', out: 'src/data/fabricShots.ts' },
];
const layout = LAYOUTS.find(l => existsSync(l.opts));
if (!layout) {
  console.error('  found neither configOptions.ts — is this the right directory?');
  process.exit(1);
}
const { opts: OPTS, out: OUT } = layout;

if (!existsSync(DIR)) {
  console.error(`  ${DIR} does not exist — nothing to generate.`);
  process.exit(1);
}

// --- what the catalogue actually offers ------------------------------------
const src = readFileSync(OPTS, 'utf8');
const block = src.slice(src.indexOf('const PRODUCT_OPTIONS'));
const known = new Map();
for (const m of block.matchAll(/^  '?([a-z0-9-]+)'?:\s*\{([\s\S]*?)\n  \},/gm)) {
  const [, id, body] = m;
  // Products with no variants are known too — they are exactly the ones whose
  // photograph is named for the product alone.
  known.set(id, [...body.matchAll(/v\('([a-z0-9-]+)'/g)].map(v => v[1]));
}

// --- what is on disk --------------------------------------------------------
// A SHOT IS A PHOTOGRAPH, not one of the masks cut from it. `.mask.` and
// `.hardware.` are companions to a shot and are found by name from the product
// id, so scanning them as shots would try to read "hardware" as a fabric.
const COMPANION = /\.(mask|hardware|overlay)\./;
const files = readdirSync(DIR).filter(f => /\.(webp|png|jpe?g)$/i.test(f) && !COMPANION.test(f));
const shots = [];
const problems = [];

for (const file of files.sort()) {
  const stem = file.replace(/\.[^.]+$/, '');
  // Longest matching product id wins — 'roller-blinds' and 'roller-shutters'
  // share a prefix, and a product id may itself contain hyphens.
  let product = null;
  for (const id of known.keys()) {
    if (stem === id || stem.startsWith(id + '-')) {
      if (!product || id.length > product.length) product = id;
    }
  }
  if (!product) { problems.push(`${file}: no catalogue product matches its name`); continue; }

  // A FILE NAMED FOR THE PRODUCT ALONE IS THE PRODUCT'S ONE PHOTOGRAPH. Some
  // products have no fabric type — a venetian is a venetian — so there is
  // nothing to put after the id, and the card shows this whatever else is
  // selected.
  const fabric = stem === product ? null : stem.slice(product.length + 1);
  if (fabric !== null && !known.get(product).includes(fabric)) {
    const has = known.get(product);
    problems.push(has.length
      ? `${file}: "${fabric}" is not a variant of ${product} (has ${has.join(', ')})`
      : `${file}: ${product} has no fabric types — name the file "${product}.webp"`);
    continue;
  }

  const maskName = `${product}.mask.png`;
  const hwName = `${product}.hardware.png`;
  shots.push({
    product,
    fabric,
    file,
    mask: existsSync(join(DIR, maskName)) ? maskName : null,
    hardware: existsSync(join(DIR, hwName)) ? hwName : null,
  });
}

if (problems.length) {
  console.error('  NAMES THAT DO NOT MATCH THE CATALOGUE:');
  for (const p of problems) console.error('    ' + p);
  console.error('\n  Nothing written. Fix the names and run again.');
  process.exit(1);
}

// HOW FULLY A FABRIC TAKES ITS DYE, by fabric id.
//
// A blockout is opaque, so its colour is the colour: Black is black. A sheer is
// mostly air with daylight coming through it, so the same dye lands pale —
// which is not an artistic choice, it is what the customer would see, and it is
// the difference between the fabrics they are being asked to choose between.
// Without it, Black blockout and Black sheer render identically and the fabric
// row appears to do nothing on exactly the colours where it matters most.
//
// The numbers follow the openness the visualiser's renderer already uses for
// the same fabrics — blockout 1, lightfilter 0.82, sunscreen 0.65, sheer 0.38 —
// pulled toward the light end, because a photograph of a lit window shows more
// transmission than a flat swatch does.
const DYE_STRENGTH = {
  blockout: 1,
  dual: 0.88,
  lightfilter: 0.7,
  sunscreen: 0.55,
  sheer: 0.38,
};

const body = shots.map(s =>
  `  { product: '${s.product}', fabric: ${s.fabric ? `'${s.fabric}'` : 'null'}, file: '${s.file}', ` +
  `mask: ${s.mask ? `'${s.mask}'` : 'null'}, ` +
  `hardware: ${s.hardware ? `'${s.hardware}'` : 'null'}, ` +
  `dye: ${DYE_STRENGTH[s.fabric] ?? 1} },`).join('\n');

writeFileSync(OUT, `// GENERATED by tools/generate-fabric-shots.mjs -- do not edit by hand.
//
// One photograph per product and fabric. Together these cover every
// configuration the shop offers, because the dimensions that do not change the
// picture -- window size, operation, hardware colour -- are not multiplied into
// the file set, and colour is applied as a dye in the browser rather than baked.
//
// ENUMERATED, NOT CONSTRUCTED, and that is the point of the file. A path built
// at runtime is invisible to every audit in the repository; see the
// specification's note on why, and what it cost the wardrobe renders to learn.
// Because each entry carries its own \`file\` string, \`npm run check:fabric-shots\`
// can assert that all of them are still on disk.
//
// A shot with a \`mask\` is DYED: the fabric in it has been normalised to white,
// and the card multiplies the chosen colour through the mask. One mask serves
// every fabric of a product -- they are the same window in the same room, so the
// blind occupies the same pixels in all of them.

export interface FabricShot {
  /** Catalogue item id. */
  product: string;
  /** Variant id within that product -- its 'Fabric type' or equivalent. Null
   * where the product has no fabric type and this is its one photograph. */
  fabric: string | null;
  /** File name within /images/fabrics. */
  file: string;
  /** Mask file name, or null where the variant IS the material and there is
   * nothing to dye -- timber is timber-coloured. */
  mask: string | null;
  /** The headrail and bottom bar, cut separately so the hardware colour can
   * paint them. Metal must not take the fabric's dye, and it has a colour card
   * of its own. */
  hardware: string | null;
  /** How fully this fabric takes its dye, 0..1. A blockout is opaque so its
   * colour is the colour; a sheer is mostly air with daylight through it, so
   * the same dye lands pale. Without this, Black blockout and Black sheer
   * render identically and the fabric row appears to do nothing on exactly the
   * colours where it matters most. */
  dye: number;
}

export const FABRIC_SHOT_DIR = '/images/fabrics';

export const FABRIC_SHOTS: FabricShot[] = [
${body}
];

/** The shot for a configuration, or undefined where none has been photographed
 * yet -- the card falls back to the product's own hero image.
 *
 * THREE STEPS DOWN. The exact fabric first. Then the product's fabric-less
 * photograph, for a product that has no fabric type. Then ANY shot of that
 * product -- because a venetian photographed in aluminium is still a photograph
 * of a venetian, and showing it when someone picks Timber beats falling back to
 * a hero image of a different room. What it costs is that the picture does not
 * follow that one choice; what it buys is that the card keeps its product. */
export const fabricShot = (product: string, fabric: string | undefined): FabricShot | undefined =>
  FABRIC_SHOTS.find(s => s.product === product && s.fabric === fabric)
  ?? FABRIC_SHOTS.find(s => s.product === product && s.fabric === null)
  ?? FABRIC_SHOTS.find(s => s.product === product);
`);

console.log(`  ${shots.length} shot${shots.length === 1 ? '' : 's'} -> ${OUT}`);
for (const s of shots) {
  console.log(`    ${s.product.padEnd(24)} ${(s.fabric ?? '—').padEnd(12)} ${s.mask ? 'dyed' : 'as shot'}`);
}

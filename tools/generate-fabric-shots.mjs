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
//
// A SHEER IS THE EXCEPTION, AND MULTIPLY IS THE WRONG TOOL FOR MOST OF WHAT IT
// DOES. Nearly everything you see in a sheer is light coming THROUGH it, and
// multiply dims that as hard as it dims the cloth. Measured: the sheer's own
// cloth photographs at a median of 234, so at 0.62 a Truffle drags it to 187,
// and the picture stops being a lit window with fabric across it and becomes a
// heavy murky linen with the garden going out behind it. Two passes were spent
// moving this one number — 0.38 was too little colour, 0.62 too much dimming —
// before it was clear that no single number can be both.
//
// So a sheer's colour arrives in two parts. `dye` at 0.5 carries only the value:
// enough that Black is visibly darker than White, and still scaling with the
// swatch, because that much a real sheer does do. `tint` carries the colour
// itself, and costs no light at all.
const DYE_STRENGTH = {
  blockout: 1,
  dual: 0.88,
  lightfilter: 0.7,
  sunscreen: 0.55,
  sheer: 0.5,
};

// THE PART OF A COLOUR THAT COSTS NO LIGHT, by fabric.
//
// A CSS `color` blend takes the swatch's hue and chroma and leaves the
// luminosity underneath exactly as it was. That is what lets Ivory, Sand and
// Truffle read as three different fabrics without any of them putting the window
// out — chroma is plainly visible at high luminance, where a difference in value
// is not.
//
// ONLY THE SHEER TAKES ANY. An opaque cloth's colour IS its value, and multiply
// is exactly right for it: a Black blockout should be black, not a black-hued
// photograph of a bright one. It is the cloth you can see through that needs its
// colour separated from its brightness.
//
// 0.9 rather than 1, so a trace of the photograph's own warmth survives and a
// White sheer does not come out colder than the room it hangs in.
const TINT_STRENGTH = {
  sheer: 0.9,
};

// THE SAME TWO NUMBERS, KEYED BY PRODUCT, and they win where they are given.
//
// DYE_STRENGTH and TINT_STRENGTH are keyed by FABRIC, which is the right grain
// for a product sold in several: a roller's blockout and its sunscreen take
// their colour differently and both are rollers. A product sold in one fabric
// has no fabric id to key on -- its shot records `fabric: null` -- so its
// numbers go here.
//
// THE ZIP SCREEN IS THE CASE, and it needs the sheer's treatment for the same
// reason: it is a cloth you look THROUGH. Its mesh photographs at a median of
// 164, darker than a sheer's 234 because the garden behind it is in it, so a
// full multiply takes Charcoal to 48 and the view goes out with the light. At
// 0.5 the value still separates Bone from Black, and `tint` at 0.9 carries the
// colour without costing any more of the view -- which is the whole argument
// for splitting them, made once for the sheer and holding here.
//
// It matters more on a screen than anywhere else in the range. A mesh is bought
// to be seen through: a render that closes the view is not a darker version of
// the product, it is a different product.
const PRODUCT_DYE = {
  'zip-guide-systems': 0.5,
};
const PRODUCT_TINT = {
  'zip-guide-systems': 0.9,
};

// HOW MUCH OF THE CLOTH'S OWN MODELLING THE CARD HAS TO PAINT BACK, by product.
//
// Multiplying by a dark colour does not darken a photograph, it flattens it. The
// curtain's folds run 157 to 225 in the shot; multiplied by Black they come out
// 12 to 17, and a five-level range is a black rectangle with a curtain's
// outline. The card puts the shot back over itself in soft-light to return the
// sheen — see sheenStrength in ShopCard for the whole argument and for why the
// strength scales with the swatch's darkness.
//
// IT IS PER PRODUCT BECAUSE IT DEPENDS ON HOW BRIGHT THE CLOTH WAS PHOTOGRAPHED.
// Soft-light lifts everything above mid-grey, so on a cloth that is already
// near-white it buys little restored shadow and costs a lot of unwanted lift.
// Measured medians under each mask: curtains 200, plantation shutters 197,
// roller blinds 222, venetian 227, curtain sheer 234. At 227 the venetian goes
// from charcoal to mid-grey and gains nothing, so it gets none.
//
// 0.5 for the curtains, from the rendered card: Black keeps its folds and stays
// black, Truffle picks up 0.16 of a pass and moves hardly at all, White gets
// 0.05 and is the same picture it was. Both curtain fabrics take it — the sheer
// loses its pleats to a dark colour exactly as the blockout loses its folds.
//
// Anything not named here is 0, which is the behaviour every card had before
// this existed. A product earns a number by being looked at, not by default.
const SHEEN = {
  curtains: 0.5,
  // 0.7, AND AN AWNING NEEDS MORE THAN A CURTAIN RATHER THAN LESS. It was 0 on
  // the reasoning that an awning is a taut sheet, so flatness is truthful. That
  // was wrong about what flatness costs: the cloth photographs across 208-229,
  // multiply by Navy takes it to 46-50, and a four-level range is not a taut
  // sheet — it is a navy shape pasted onto a photograph, with the arms collapsed
  // into it and the light falling across it gone. What a real awning has, and
  // what 0.7 puts back, is the gradient from the cassette out to the front bar,
  // the weave, and the shadow each arm casts on the cloth above it.
  //
  // 0.8 was tried and greys the colour out; at 0.6 the arms are still soft
  // against the canopy.
  'folding-arm-awnings': 0.7,
};

// HOW MUCH OF THE METAL'S OWN HIGHLIGHT GOES BACK OVER THE PAINT, by product.
//
// The hardware layer paints the swatch at full strength and then soft-lights the
// photograph over it, because metal is anodised or powder-coated: the surface IS
// the colour, and a highlight on it is a reflection rather than a lighter shade
// of the paint.
//
// 0.4 IS THE ROLLER'S NUMBER AND IT IS ABOUT A CHROME TUBE. A headrail
// photographs as bright chrome, so soft-lighting it over a dark swatch lifts the
// dark badly — at 0.85, Black came out rgb 99, which is grey and barely separable
// from chrome. A small bright cylinder needs very little of itself back.
//
// AN AWNING'S METALWORK IS NOT THAT. The cassette and both arms are large matte
// powder-coated extrusions, and at 0.4 they render as flat dark shapes that read
// as cut-out rather than as parts of the machine. 0.7 restores the shading down
// the length of each arm and the roundness of the cassette drum, which is what
// separates them from the cloth behind them.
const SPECULAR = {
  'folding-arm-awnings': 0.7,
};

const body = shots.map(s =>
  `  { product: '${s.product}', fabric: ${s.fabric ? `'${s.fabric}'` : 'null'}, file: '${s.file}', ` +
  `mask: ${s.mask ? `'${s.mask}'` : 'null'}, ` +
  `hardware: ${s.hardware ? `'${s.hardware}'` : 'null'}, ` +
  `dye: ${PRODUCT_DYE[s.product] ?? DYE_STRENGTH[s.fabric] ?? 1}, ` +
  `tint: ${PRODUCT_TINT[s.product] ?? TINT_STRENGTH[s.fabric] ?? 0}, ` +
  `sheen: ${SHEEN[s.product] ?? 0}, ` +
  `spec: ${SPECULAR[s.product] ?? 0.4} },`).join('\n');

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
  /** How much of the swatch's hue and chroma is laid on WITHOUT touching how
   * bright the cloth is, 0..1 -- a CSS color blend rather than a multiply. Only
   * a sheer takes any. Almost everything you see in one is light coming through
   * it, and multiply dims that as hard as it dims the fabric, so a Truffle sheer
   * turns into a murky linen with the garden going out behind it. This carries
   * the colour; dye carries only the value. */
  tint: number;
  /** How much of the photograph's own modelling the card paints back over the
   * dye, 0..1, scaled there by how dark the chosen colour is. Multiplying by a
   * dark colour flattens a cloth as well as darkening it, and this returns the
   * sheen -- a reflection off the surface, which was never the dye's to take.
   * 0 where the cloth was photographed near-white and a soft-light pass would
   * lift more than it restores. */
  sheen: number;
  /** How much of the metal's own highlight is soft-lit back over the painted
   * hardware, 0..1. 0.4 suits a roller's chrome headrail -- a small bright
   * cylinder that lifts a dark swatch badly if given more. An awning's cassette
   * and arms are large matte extrusions and need 0.7, or they render as flat
   * cut-out shapes rather than parts of the machine. */
  spec: number;
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

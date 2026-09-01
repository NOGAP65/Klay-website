// ---------------------------------------------------------------------------
// PROOF THAT THE SCOPE GUARD REFUSES — ADR-022, applied to the toolchain.
//
// §11: "no rule counts as enforcement until it has been shown to fail." A guard
// that has never been seen to throw is indistinguishable from a guard that
// cannot, and the whole reason this one exists is that a codemod once edited an
// E-08 file while reporting success.
//
// So: try to write to every out-of-scope shape there is, and require a refusal
// each time. A pass here means the bypass is closed, not that nobody used it.
//
//   npm run verify:scope-guard
// ---------------------------------------------------------------------------

import { assertInScope, inScopeFiles } from './scope.mjs';
import { renameInFile, writeInScope } from './codemod.mjs';

/** Every path shape that must be refused, and why it is the interesting one. */
const MUST_REFUSE = [
  ['src/visualiser/homography.ts', 'E-08 directory — protected IP'],
  ['src/visualiser-lab/wardrobes.ts', 'E-08 directory — the active fork'],
  ['src/pages/VisualiserPage.tsx', 'E-08 FILE, not a directory'],
  ['src/pages/VisualizerLabPage.tsx', 'E-08 file spelled with a z — THE ONE THAT GOT EDITED'],
  ['src/lib/pricing.ts', 'E-09 — the pricing shim'],
  ['src/data/products.ts', 'E-10'],
  ['src/theme.ts', 'E-10'],
  ['src/components/Nav.tsx', 'E-11 — the Nav shim'],
  ['netlify/functions/create-checkout-session.ts', 'a different runtime'],
  ['scripts/cut-wardrobe-stickers.mjs', 'parallel wardrobe tooling'],
  ['tools/codemod.mjs', 'the toolchain itself'],
];

/** Sanity: the guard must not refuse everything, or it proves nothing. */
const MUST_ALLOW = [
  'src/features/cart/components/CartPage.tsx',
  'src/app/layouts/Nav.tsx',
  'src/design-system/primitives/useHover.ts',
];

let failures = 0;

console.log('\n=== the guard must REFUSE ===');
for (const [path, why] of MUST_REFUSE) {
  let refused = false;
  try {
    assertInScope(path);
  } catch {
    refused = true;
  }
  console.log(`  ${refused ? 'REFUSED' : 'ALLOWED — FAIL'}  ${path.padEnd(48)} ${why}`);
  if (!refused) failures++;
}

console.log('\n=== and must ALLOW ===');
for (const path of MUST_ALLOW) {
  let allowed = true;
  try {
    assertInScope(path);
  } catch {
    allowed = false;
  }
  console.log(`  ${allowed ? 'ALLOWED' : 'REFUSED — FAIL'}  ${path}`);
  if (!allowed) failures++;
}

// The write path, not just the predicate — a guard that is only consulted is
// not a guard. These must throw before touching the disk.
console.log('\n=== the WRITE path refuses too ===');
for (const [fn, label] of [
  [() => writeInScope('src/pages/VisualizerLabPage.tsx', 'x'), 'writeInScope'],
  [() => renameInFile('src/visualiser/homography.ts', 'a', 'b'), 'renameInFile'],
]) {
  let refused = false;
  try { fn(); } catch { refused = true; }
  console.log(`  ${refused ? 'REFUSED' : 'WROTE — FAIL'}  ${label}`);
  if (!refused) failures++;
}

// And the file list must never contain anything the guard would refuse.
const listed = inScopeFiles();
const leaked = listed.filter((f) => {
  try { assertInScope(f); return false; } catch { return true; }
});
console.log(`\n=== inScopeFiles() — ${listed.length} files, ${leaked.length} that the guard would refuse ===`);
for (const f of leaked) console.log(`  LEAKED  ${f}`);
failures += leaked.length;

if (failures) {
  console.error(`\nFAIL: ${failures} case(s). The bypass is open.`);
  process.exit(1);
}
console.log('\nOK: the scope guard refuses every out-of-scope shape, allows in-scope, and the file list agrees with it.');

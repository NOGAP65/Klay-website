import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync('src/features/visualiser/curtainCloth.ts','utf8'), {
  compilerOptions: { module:ts.ModuleKind.ESNext, target:ts.ScriptTarget.ES2022 },
}).outputText;
const { foldDepth, foldLean, foldSection, FOLD_LEAN, FABRIC_FULLNESS, MIN_FOLD_PITCH } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

// Independently measure the curve as short line segments. The renderer must
// gather the same amount of cloth instead of shrinking it as the track opens.
function measuredLength(pitch, depth, lean) {
  let lastX=0, lastZ=-depth, length=0;
  for(let i=1;i<=4096;i++) {
    const t=i/4096, z=depth*foldSection(t);
    const x=pitch*t+lean*(z+depth);
    length+=Math.hypot(x-lastX,z-lastZ);
    lastX=x; lastZ=z;
  }
  return length;
}
for (const extended of [8,24,70,160]) {
  for(let i=0;i<=100;i++) {
    const ratio=1-i/100*(1-MIN_FOLD_PITCH);
    const depth=foldDepth(extended*ratio,extended);
    assert.ok(Number.isFinite(depth) && depth>0);
    const measured=measuredLength(extended*ratio,depth,foldLean(extended*ratio,extended));
    assert.ok(Math.abs(measured/(extended*FABRIC_FULLNESS)-1)<0.002,'Cloth length changes by less than 0.2%');
  }
  const relaxed=foldDepth(extended,extended);
  assert.ok(2*Math.PI*relaxed*foldLean(extended,extended)<extended*0.5,'Extended folds have rounded open lobes without backtracking');
  const packed=foldDepth(extended*MIN_FOLD_PITCH,extended);
  assert.ok(packed>relaxed,'Gathered cloth is deeper than extended cloth');
  assert.ok(2*Math.PI*packed*FOLD_LEAN>extended*MIN_FOLD_PITCH,'Packed cloth has real return faces');
  assert.equal(foldDepth(0,extended),packed,'Carriers cannot collapse beyond the fabric stack');
  assert.equal(foldDepth(extended*2,extended),foldDepth(extended,extended),'Fabric cannot stretch past its extended width');
}
console.log('Curtain cloth: fixed fabric length, deeper gathered folds, real return faces and bounded travel pass.');

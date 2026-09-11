import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const transpile=text=>ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const url=text=>`data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
const source=name=>readFileSync(`src/features/visualiser/${name}.ts`,'utf8');
const homography=url(transpile(source('homography')));
const load=name=>import(url(transpile(source(name)).replace("'./homography'",JSON.stringify(homography))));
const {curtainPlane,curtainScale}=await load('curtainPlane');
const {curtainRoomLight}=await load('curtainRoomLight');
let cases=0;
for(const wide of [600,1800,3200,4800])for(const drop of [1200,2400,3000])
for(const distance of [4000,8000])for(const yaw of [-0.7,0,0.7])for(const focal of [1040,1280,1920]) {
  const project=(x,y)=>[800+focal*x*Math.cos(yaw)/(distance-x*Math.sin(yaw)),600+focal*y/(distance-x*Math.sin(yaw))];
  const quad=[project(-wide/2,-drop/2),project(wide/2,-drop/2),project(wide/2,drop/2),project(-wide/2,drop/2)];
  const plane=curtainPlane(quad,1600,1200,focal);
  const scale=curtainScale(plane.width,plane.top-plane.bottom,drop);
  assert.ok(Math.abs(scale.widthMm-wide)<1e-6,'Camera distance and yaw must not change the physical width');
  assert.equal(scale.waves,Math.max(2,Math.min(28,Math.round(wide/320))));
  cases++;
}
const makePixels=colour=>new Uint8ClampedArray(Array.from({length:96*96},()=>[...colour,255]).flat());
const quad=[[.25,.2],[.75,.2],[.75,.8],[.25,.8]];
const daylight=curtainRoomLight(makePixels([220,220,220]),96,96,quad);
const evening=curtainRoomLight(makePixels([100,75,45]),96,96,quad);
assert.ok(evening.exposure<daylight.exposure,'Fabric responds to dim room lighting');
assert.ok(evening.tint[0]>evening.tint[2],'Warm room light warms the cloth');
assert.deepEqual(daylight.tint,[1,1,1]);
const pixels=makePixels([220,220,220]);
for(let y=20;y<76;y++)for(let x=25;x<71;x++)pixels.set([0,190,10,255],(y*96+x)*4);
assert.deepEqual(curtainRoomLight(pixels,96,96,quad),daylight,'Greenery through the opening must not dye the fabric');
assert.ok(Number.isFinite(curtainRoomLight(makePixels([0,0,0]),96,96,quad).exposure));
console.log(`Curtain scale: ${cases} physical size/distance/lens/angle cases; neutral, warm, green-background and dark-room lighting pass.`);

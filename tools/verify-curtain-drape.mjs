import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const transpile = text => ts.transpileModule(text, { compilerOptions: {
  module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React,
} }).outputText;
const url = text => `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
const source = name => readFileSync(`src/features/visualiser/${name}`, 'utf8');
const hUrl = url(transpile(source('homography.ts')));
const planeUrl = url(transpile(source('curtainPlane.ts')).replace("'./homography'", JSON.stringify(hUrl)));
const { curtainPlane } = await import(planeUrl);
const clothUrl = url(transpile(source('curtainCloth.ts')));
// Exercise the actual geometry writer without mounting React or a browser.
const imports = `import * as THREE from ${JSON.stringify(pathToFileURL(`${process.cwd()}/node_modules/three/build/three.module.js`).href)};
  import { foldLean, foldDepth, foldSection, MIN_FOLD_PITCH } from ${JSON.stringify(clothUrl)};
  import { hangingDrop } from ${JSON.stringify(planeUrl)};
  const CURTAIN_SCREEN_SPACE_GLSL = '';
`;
const renderer = transpile(source('Canvas2DCurtainRenderer.tsx')).replace(/^import .*?;\r?\n/gm, '');
const { createPanelMesh, writePanelMesh, panelLayout, ROWS } = await import(url(imports + renderer
  + '\nexport { createPanelMesh, writePanelMesh, panelLayout, ROWS };'));

const width=1600, height=1200, focal=1920, distance=2800;
let views=0, strips=0;
for (const yaw of [-0.95,0,0.95]) for (const tilt of [-0.3,0,0.3]) for (const roll of [-0.4,0,0.4]) {
  const project = (x,y,z=0) => {
    const a=x*Math.cos(yaw)-z*Math.sin(yaw), b=-x*Math.sin(yaw)-z*Math.cos(yaw);
    const c=y*Math.cos(tilt)-b*Math.sin(tilt), d=y*Math.sin(tilt)+b*Math.cos(tilt);
    return [width/2+focal*(a*Math.cos(roll)-c*Math.sin(roll))/(distance+d),
      height/2+focal*(a*Math.sin(roll)+c*Math.cos(roll))/(distance+d)];
  };
  const plane=curtainPlane([project(-1200,1100),project(1200,1100),project(1200,-1100),project(-1200,-1100)],width,height,focal);
  assert.ok(Math.abs(plane.width/(plane.top-plane.bottom)-2400/2200)<1e-8,
    'Camera roll and yaw must not distort physical width, drop or fold depth');
  const h=plane.homography, depth=plane.projection.depth, metric=plane.width/2400;
  for (const [x,y,z] of [[-950,-1100,60],[850,-1100,-40],[0,400,100]]) {
    const X=width/2+x*metric,Y=height/2+y*metric,Z=z*metric;
    const w=h[6]*X+h[7]*Y+h[8]+depth[2]*Z;
    const actual=[(h[0]*X+h[1]*Y+h[2]+depth[0]*Z)/w,(h[3]*X+h[4]*Y+h[5]+depth[1]*Z)/w];
    const expected=project(x,y,z);
    assert.ok(Math.hypot(actual[0]-expected[0],actual[1]-expected[1])<1e-7,
      'Hem depth projects onto the real horizontal floor at oblique camera angles');
  }
  const pitch=plane.width/24, drop=plane.top-plane.bottom;
  for (const open of [0,0.5,1]) for (const direction of [-1,1]) for (const soft of [false,true]) {
    const mesh=createPanelMesh(12,soft);
    writePanelMesh(mesh,{layout:panelLayout(12,pitch,open),wallX:direction===1?plane.left:plane.right,
      towardCentre:direction,topY:plane.top,bottomY:plane.bottom,sway:open===0.5?pitch*0.4:0});
    for (let c=0;c<=mesh.cols;c++) {
      let length=0;
      for (let row=1;row<=ROWS;row++) {
        const i=(row*(mesh.cols+1)+c)*3, above=i-(mesh.cols+1)*3;
        const dx=mesh.positions[i]-mesh.positions[above],dy=mesh.positions[i+1]-mesh.positions[above+1],dz=mesh.positions[i+2]-mesh.positions[above+2];
        assert.ok(dy<0,'Cloth always falls under gravity');
        length+=Math.hypot(dx,dy,dz);
      }
      assert.ok(Math.abs(length/drop-1)<0.0013,'Each hanging strip retains its cut length when moving');
      const hem=(ROWS*(mesh.cols+1)+c)*3;
      assert.ok(Math.abs(mesh.positions[hem+1]-plane.bottom)<drop*0.004,
        'Weighted hem stays level in the room without an artificial scallop');
      strips++;
    }
    mesh.geometry.dispose();
  }
  views++;
}
console.log(`Curtain drape: ${views} tilted/rolled views and ${strips} hanging strips preserve gravity, cut length and projected hem depth.`);

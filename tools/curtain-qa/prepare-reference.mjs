import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const ref='b6579ce';
for(const [source,target] of [['Canvas2DCurtainRenderer.tsx','PreviousCurtain.tsx'],['curtainCloth.ts','PreviousCloth.ts'],['curtainLighting.ts','PreviousLighting.ts']]) {
  let text=execFileSync('git',['show',`${ref}:src/features/visualiser/${source}`],{encoding:'utf8'});
  text=text.replace(/from '(.\/.+?)'/g,(_,name)=>{
    if(name==='./curtainCloth')return "from './PreviousCloth'";
    if(name==='./curtainLighting')return "from './PreviousLighting'";
    if(name.startsWith('./'))return `from '../../src/features/visualiser/${name.slice(2)}'`;
    return `from '../../src/features/visualiser/${name}'`;
  });
  writeFileSync(`tools/curtain-qa/${target}`,text);
}
console.log(`Prepared comparison renderer from ${ref}.`);

import { dependencyGraph, runtimeCycles } from './dependency-graph.mjs';

function layer(file) {
  if(file.startsWith('shared-core/'))return 'core';
  if(file.startsWith('netlify/'))return 'server';
  if(file.startsWith('src/features/'))return 'feature';
  if(file.startsWith('src/design-system/'))return 'design';
  if(file.startsWith('src/shared/'))return 'shared';
  if(file.startsWith('src/config/'))return 'config';
  if(file.startsWith('src/app/')||file==='src/main.tsx')return 'app';
  return 'unknown';
}
const allowed = {
  app: ['app','feature','design','shared','config','core'],
  feature: ['feature','design','shared','config','core'],
  shared: ['shared','design','config'], design: ['design','config'],
  config: ['config'], core: ['core'], server: ['server','core'],
};
export function invalidEdge(from, edge) {
  const to=edge.target, a=layer(from), b=layer(to);
  if(!allowed[a]?.includes(b))return `${a} cannot depend on ${b}`;
  if(b==='feature' && from.split('/')[2]!==to.split('/')[2] && !/^src\/features\/[^/]+\/index\.ts$/.test(to)) {
    // Route modules are explicit asynchronous entry points, not eager exports.
    if(from==='src/app/router.tsx' && edge.isDynamic && /(?:\/components\/\w+Page|\/VisualiserPage)\.tsx$/.test(to))return null;
    return 'Cross-feature imports must use the public index';
  }
  return null;
}
const graph=dependencyGraph(), problems=[];
for(const [from,edges] of graph)for(const edge of edges){const error=invalidEdge(from,edge);if(error)problems.push(`${from} -> ${edge.target}: ${error}`);}
for(const cycle of runtimeCycles(graph))problems.push(`Runtime cycle: ${cycle.join(' -> ')}`);
// Prove the guard rejects forbidden dependencies, including type-only edges.
for(const [from,to] of [['shared-core/bad.ts','netlify/lib/db.ts'],['src/shared/bad.ts','src/features/cart/index.ts'],['src/features/cart/bad.ts','src/app/router.tsx'],['src/features/cart/bad.ts','src/features/booking/api.ts']]) {
  if(!invalidEdge(from,{target:to,isDynamic:false,isTypeOnly:true}))problems.push(`Guard failed self-test: ${from} -> ${to}`);
}
if(problems.length){console.error(problems.join('\n'));process.exitCode=1;}
else console.log(`Architecture passes: ${graph.size} modules; one-way layers, public feature APIs and zero runtime cycles.`);

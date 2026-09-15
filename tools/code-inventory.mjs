import fs from 'node:fs';
import { dependencyGraph } from './dependency-graph.mjs';
const graph=dependencyGraph(), reachable=new Set();
function visit(file){if(reachable.has(file))return;reachable.add(file);for(const edge of graph.get(file)??[])visit(edge.target);}
visit('src/main.tsx');
const files=[...graph.keys()].filter(f=>f.startsWith('src/'));
console.log(JSON.stringify({files:files.length,unreachable:files.filter(f=>!reachable.has(f)),largest:files.map(file=>({file,bytes:fs.statSync(file).size})).sort((a,b)=>b.bytes-a.bytes).slice(0,12)},null,2));

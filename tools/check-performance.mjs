import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const manifest=JSON.parse(fs.readFileSync('dist/.vite/manifest.json','utf8'));
const policy=JSON.parse(fs.readFileSync('tools/performance-budgets.json','utf8'));
const entry=new Set();
function visit(key){if(entry.has(key))return;entry.add(key);for(const dep of manifest[key].imports??[])visit(dep);}
for(const [key,value] of Object.entries(manifest))if(value.isEntry)visit(key);
const bytes=file=>gzipSync(fs.readFileSync(path.join('dist',file))).length;
const jsFiles=[...new Set(Object.values(manifest).map(v=>v.file).filter(f=>f.endsWith('.js')))];
const entryFiles=[...entry].map(k=>manifest[k].file);
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const actual={
  entryJavaScriptGzip:entryFiles.reduce((n,f)=>n+bytes(f),0),
  totalJavaScriptGzip:jsFiles.reduce((n,f)=>n+bytes(f),0),
  largestJavaScriptGzip:Math.max(...jsFiles.map(bytes)),
  publishedAssets:walk('public').reduce((n,f)=>n+fs.statSync(f).size,0),
};
const failures=[];
for(const [name,value] of Object.entries(actual))if(value>policy[name])failures.push(`${name}: ${value} > ${policy[name]} bytes`);
for(const file of entryFiles)if(/(?:three\.module|wardrobeScene|Canvas2D|KlayConfigurator|visualiser-|ShopCard-)/.test(file))failures.push(`Heavy renderer/shop code in startup: ${file}`);
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/performance.json',JSON.stringify({actual,limits:policy,entryFiles},null,2)+'\n');
console.log(JSON.stringify(actual,null,2));
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}

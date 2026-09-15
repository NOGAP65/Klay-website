import fs from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';

const results=await new ESLint().lintFiles(['.']);
const counts={},errors=[];
for(const result of results)for(const message of result.messages){
  const key=path.relative(process.cwd(),result.filePath).replaceAll('\\','/')+' | '+(message.ruleId??'parse');
  if(message.severity===2)errors.push(`${key}:${message.line} ${message.message}`);
  else counts[key]=(counts[key]??0)+1;
}
const baselinePath='tools/lint-baseline.json';
if(process.argv.includes('--record') && !errors.length){
  fs.writeFileSync(baselinePath,JSON.stringify(Object.fromEntries(Object.entries(counts).sort()),null,2)+'\n');
}else{
  const baseline=JSON.parse(fs.readFileSync(baselinePath,'utf8'));
  for(const [key,n] of Object.entries(counts))if(n>(baseline[key]??0))errors.push(`${key}: ${n} findings (allowance ${baseline[key]??0})`);
}
console.log(`${results.length} files: ${Object.values(counts).reduce((a,b)=>a+b,0)} recorded warnings; ${errors.length} errors/regressions.`);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}

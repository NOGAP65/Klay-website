import {createRequire} from 'node:module';
import {readdir} from 'node:fs/promises';
const runtime=process.env.CODEX_DEPENDENCIES_NODE||'C:/Users/lathv/.cache/codex-runtimes/codex-primary-runtime/dependencies/node';
const sharp=createRequire(`${runtime}/package.json`)('sharp');
const folder=process.argv[2]||'final';
const root=`tools/curtain-qa/output/${folder}`;
const files=(await readdir(root)).filter(x=>x.endsWith('.png'));
const composite=[];
for(const [index,file] of files.entries()){
  const left=index%3*450,top=Math.floor(index/3)*330;
  composite.push({input:await sharp(`${root}/${file}`).resize(450,300,{fit:'contain',background:'#ddd'}).png().toBuffer(),left,top});
  composite.push({input:Buffer.from(`<svg width="450" height="30"><rect width="450" height="30" fill="white"/><text x="12" y="21" font-family="Arial" font-size="16">${folder}: ${file.replace('.png','')}</text></svg>`),left,top:top+300});
}
await sharp({create:{width:1350,height:Math.ceil(files.length/3)*330,channels:3,background:'white'}}).composite(composite).png().toFile(`tools/curtain-qa/output/${folder}-sheet.png`);

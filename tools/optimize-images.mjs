// Run with --apply to convert large PNGs. Textures/masks keep lossless pixels;
// room/process photographs use high-quality WebP at their original dimensions.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const apply = process.argv.includes('--apply');
const sourceFiles = [];
for (const directory of ['src', 'tools', 'scripts']) {
  for (const entry of await fs.readdir(directory, {recursive: true})) {
    if (/\.(tsx?|mjs|json|css)$/.test(entry)) sourceFiles.push(path.join(directory, entry));
  }
}
sourceFiles.push('index.html');
const changes = [];
for (const relative of await fs.readdir('public', {recursive:true})) {
  const original = path.resolve('public', relative);
  if (!original.startsWith(path.join(root, 'public') + path.sep)) throw new Error('Outside public');
  if (!/\.png$/i.test(relative) || relative.includes('Cw_fabrics')) continue;
  const before = (await fs.stat(original)).size;
  if (before < 65_536) continue;
  const photo = /images[\\/](rooms|process)[\\/]/.test(relative);
  const encoded = await sharp(original).webp(photo ? {quality:92, effort:6} : {lossless:true, effort:6}).toBuffer();
  if (encoded.length > before * .9) continue;
  if (!photo) {
    const a = await sharp(original).ensureAlpha().raw().toBuffer();
    const b = await sharp(encoded).ensureAlpha().raw().toBuffer();
    if (a.length !== b.length) throw new Error(`Dimension change: ${relative}`);
    for (let i=0; i<a.length; i+=4) {
      if (a[i+3] !== b[i+3] || a[i+3] && (a[i] !== b[i] || a[i+1] !== b[i+1] || a[i+2] !== b[i+2])) {
        throw new Error(`Lossless verification failed: ${relative}`);
      }
    }
  }
  const destination = original.replace(/\.png$/i, '.webp');
  const from = path.basename(original), to = path.basename(destination);
  changes.push({file:relative.replaceAll('\\','/'), before, after:encoded.length, mode:photo?'photo-quality-92':'lossless'});
  if (!apply) continue;
  try {
    const existing = await fs.readFile(destination);
    if (!existing.equals(encoded)) throw new Error(`Different destination exists: ${destination}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await fs.writeFile(destination, encoded);
  }
  for (const file of sourceFiles) {
    const text = await fs.readFile(file,'utf8');
    if (text.includes(from)) {
      for (let attempt=0; ;attempt++) {
        try { await fs.writeFile(file, text.replaceAll(from, to)); break; }
        catch (error) {
          if (attempt >= 10 || !['UNKNOWN','EBUSY','EPERM'].includes(error.code)) throw error;
          await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
        }
      }
    }
  }
  await fs.unlink(original);
}
const report = {apply, before:changes.reduce((n,x)=>n+x.before,0), after:changes.reduce((n,x)=>n+x.after,0), changes};
await fs.mkdir('test-results', {recursive:true});
await fs.writeFile('test-results/image-optimization.json', JSON.stringify(report,null,2));
console.log(JSON.stringify({apply, files:changes.length, before:report.before, after:report.after}));

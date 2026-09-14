// Build small, colour-sampled web assets from the supplied originals. Originals stay untouched.
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const root = path.resolve('assets-source/fabrics/cw');
const output = path.resolve('public/images/fabrics/cw');
const slug = value => value.toLowerCase().replace(/%/g, 'percent').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const title = value => value.replace(/(^|[- ])\w/g, s => s.toUpperCase()).replace(/-/g, ' ');
async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)))).flat();
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage();
const samples = [];
try {
  await fs.mkdir(output, { recursive: true });
  for (const file of (await walk(root)).sort()) {
    const relative = path.relative(root, file).replace(/\\/g, '/');
    const parts = relative.split('/');
    const basename = path.parse(file).name;
    let collection, colour, product, type;
    if (parts[0] === 'ATLAS FABRICS') {
      collection = parts[1];
      colour = basename.slice(collection.length).trim();
      // Roller application confirmed by the owner; opacity mapping is separate.
      product = 'roller-blinds';
    } else if (parts[0] === '2. Venetian Blinds' && parts[2] === 'Colours') {
      product = 'venetian-blinds';
      collection = parts[1];
      colour = title(basename.replace(/^blinds-venetians-icons-(\d-)?/, '').replace(/3$/, ''));
    } else if (parts[0] === '5. Honeycomb' && parts[1] === 'Fabric Colours' && !basename.startsWith('icons-')) {
      product = 'honeycomb-blinds';
      collection = 'Honeycomb';
      type = parts[2] === 'Blockout' ? 'blockout' : parts[2] === 'Sheer' ? 'sheer' : 'lightfilter';
      colour = title(basename);
    } else if (parts[0] === '6. Roller Blind' && /^bottom rail colour /i.test(basename)) {
      product = 'roller-hardware';
      collection = 'Roller hardware';
      colour = title(basename.replace(/^bottom rail colour /i, ''));
    } else continue;
    const id = slug([collection, type, colour].filter(Boolean).join(' '));
    const bytes = await fs.readFile(file);
    const mime = path.extname(file).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    const generated = await page.evaluate(async source => {
      const img = new Image();
      img.src = source;
      await img.decode();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = canvas.height = 64;
      // Ignore borders and rounded corners when measuring the swatch colour.
      ctx.drawImage(img, img.width * .2, img.height * .2, img.width * .6, img.height * .6, 0, 0, 64, 64);
      const pixels = ctx.getImageData(0, 0, 64, 64).data;
      const channels = [[], [], []];
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] > 240) {
        channels.forEach((values, c) => values.push(pixels[i + c]));
      }
      const hex = '#' + channels.map(values => {
        values.sort((a, b) => a - b);
        return values[Math.floor(values.length / 2)].toString(16).padStart(2, '0');
      }).join('');
      const encode = size => {
        canvas.width = canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);
        return canvas.toDataURL('image/webp', .86).split(',')[1];
      };
      const thumb = encode(128);
      const texture = encode(Math.min(512, img.width));
      const weave = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let mean = 0;
      for (let i = 0; i < weave.data.length; i += 4) mean += .2126 * weave.data[i] + .7152 * weave.data[i + 1] + .0722 * weave.data[i + 2];
      mean /= weave.data.length / 4;
      for (let i = 0; i < weave.data.length; i += 4) {
        const value = 128 + (.2126 * weave.data[i] + .7152 * weave.data[i + 1] + .0722 * weave.data[i + 2] - mean) * 2;
        weave.data[i] = weave.data[i + 1] = weave.data[i + 2] = value;
      }
      ctx.putImageData(weave, 0, 0);
      return { hex, thumb, texture, weave: canvas.toDataURL('image/webp', .86).split(',')[1] };
    }, `data:${mime};base64,${bytes.toString('base64')}`);
    await fs.writeFile(path.join(output, `${id}.webp`), Buffer.from(generated.thumb, 'base64'));
    await fs.writeFile(path.join(output, `${id}-texture.webp`), Buffer.from(generated.texture, 'base64'));
    await fs.writeFile(path.join(output, `${id}-weave.webp`), Buffer.from(generated.weave, 'base64'));
    samples.push({ id, name: `${collection} ${colour}`, colour, collection, product, ...(type ? { type } : {}),
      hex: generated.hex, texture: `/images/fabrics/cw/${id}.webp`, renderTexture: `/images/fabrics/cw/${id}-texture.webp`,
      weaveTexture: `/images/fabrics/cw/${id}-weave.webp` });
  }
  await fs.mkdir('src/features/fabrics', { recursive: true });
  await fs.writeFile('src/features/fabrics/samples.json', JSON.stringify(samples, null, 2) + '\n');
  console.log(`Prepared ${samples.length} real swatches and textures.`);
} finally { await browser.close(); }

import fs from 'fs';
import path from 'path';
const ROOT = 'C:/Users/lathv/Klay-website-new';
process.chdir(ROOT);

const LAYERS = ['app', 'config', 'design-system', 'features', 'shared'];
const isLegacy = (p) => p.startsWith('src/') && !LAYERS.some((l) => p.startsWith('src/' + l + '/'))
  && p !== 'src/main.tsx' && p !== 'src/vite-env.d.ts';
const isFrozen = (p) => p.startsWith('src/visualiser/') || p.startsWith('src/visualiser-lab/');

function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(e.name)) acc.push(p.split(path.sep).join('/'));
  }
  return acc;
}
function resolve(from, spec) {
  if (spec.startsWith('@/')) {
    const map = { '@/app': 'src/app', '@/config': 'src/config', '@/ds': 'src/design-system',
      '@/features': 'src/features', '@/shared': 'src/shared' };
    for (const [a, real] of Object.entries(map)) {
      if (spec === a || spec.startsWith(a + '/')) {
        const rest = spec.slice(a.length).replace(/^\//, '');
        const base = rest ? real + '/' + rest : real + '/index';
        for (const c of [base + '.tsx', base + '.ts', base + '/index.tsx', base + '/index.ts'])
          if (fs.existsSync(c)) return c;
        return null;
      }
    }
    return null;
  }
  if (!spec.startsWith('.')) return null;
  const p = path.posix.normalize(path.posix.join(path.posix.dirname(from), spec)).replace(/\.tsx?$/, '');
  for (const c of [p + '.tsx', p + '.ts', p + '/index.tsx', p + '/index.ts']) if (fs.existsSync(c)) return c;
  return null;
}

const all = walk('src');
const featureFiles = all.filter((f) => f.startsWith('src/features/'));

// A) files inside features/ that still reach legacy
const edges = [];
for (const f of featureFiles) {
  const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const r = resolve(f, m[1]);
    if (r && isLegacy(r)) edges.push({ from: f, to: r, spec: m[1] });
  }
}

// B) the legacy files themselves, and whether anything in features/ still needs them
const legacyFiles = all.filter(isLegacy);
const stillNeeded = new Map();
for (const e of edges) stillNeeded.set(e.to, (stillNeeded.get(e.to) || 0) + 1);

console.log('=== feature -> legacy COUNTDOWN ===');
console.log('feature files reaching legacy : ' + new Set(edges.map((e) => e.from)).size);
console.log('distinct legacy targets       : ' + stillNeeded.size);
console.log('total edges                   : ' + edges.length);
console.log('\n--- legacy files still reachable through the allowance ---');
for (const [f, n] of [...stillNeeded].sort((a, b) => b[1] - a[1])) {
  console.log('  ' + String(n).padStart(3) + '  ' + f + (isFrozen(f) ? '   [FROZEN]' : ''));
}
console.log('\n--- which feature reaches what ---');
for (const e of edges.sort((a, b) => a.from.localeCompare(b.from))) {
  console.log('  ' + e.from.replace('src/features/', '') + '  ->  ' + e.to);
}
console.log('\n=== remaining legacy surface ===');
console.log('files still in src/ outside a layer: ' + legacyFiles.length);
const byDir = new Map();
for (const f of legacyFiles) {
  const d = f.split('/').slice(0, 2).join('/');
  byDir.set(d, (byDir.get(d) || 0) + 1);
}
for (const [d, n] of [...byDir].sort((a, b) => b[1] - a[1])) console.log('  ' + String(n).padStart(3) + '  ' + d + '/');

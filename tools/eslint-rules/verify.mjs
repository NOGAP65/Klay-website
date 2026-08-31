import { RuleTester } from 'eslint';
import klay from './index.js';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

let pass = 0;
const fail = [];
function check(name, rule, cases) {
  try {
    tester.run(name, rule, cases);
    pass++;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    fail.push(name);
    console.log(`  FAIL  ${name}\n        ${String(e.message).split('\n')[0]}`);
  }
}

console.log('\n=== klay/no-hardcoded-style-values ===');
check('no-hardcoded-style-values', klay.rules['no-hardcoded-style-values'], {
  valid: [
    { code: `const B = () => <div style={{ padding: space.md, color: tokens.ink, borderRadius: radius.md }} />;`, filename: 'src/pages/Thing.tsx' },
    { code: `const B = () => <div style={{ gap: 0, padding: 1 }} />;`, filename: 'src/pages/Thing.tsx' },
    { code: `const C = () => <div style={{ padding: 24, color: '#E5E5E5' }} />;`, filename: 'src/design-system/tokens/colour.ts' },
    { code: `const D = { padding: 24, color: '#E5E5E5' };`, filename: 'src/pages/Thing.tsx' },
  ],
  invalid: [
    { code: `const A = () => <div style={{ padding: 24 }} />;`, filename: 'src/pages/Thing.tsx', errors: 1 },
    { code: `const A = () => <div style={{ color: '#E5E5E5' }} />;`, filename: 'src/pages/Thing.tsx', errors: 1 },
    { code: `const A = () => <div style={{ fontSize: 13, borderRadius: 6 }} />;`, filename: 'src/pages/Thing.tsx', errors: 2 },
    { code: `const A = () => <div style={{ margin: '40px' }} />;`, filename: 'src/pages/Thing.tsx', errors: 1 },
    { code: `const A = () => <div style={{ boxShadow: \`0 8px 20px #000000\` }} />;`, filename: 'src/pages/Thing.tsx', errors: 1 },
  ],
});

console.log('\n=== klay/no-pure-black ===');
check('no-pure-black', klay.rules['no-pure-black'], {
  valid: [
    { code: `const ok = '#1D1D1D';`, filename: 'src/pages/Thing.tsx' },
    { code: `const ok = '#303030';`, filename: 'src/pages/Thing.tsx' },
    // The StepsBar case: the only two occurrences in the repo are in the
    // comment that forbids the colour. Comments are off by default.
    { code: `// Klay has no black — #000000 and #1A1A1A are banned outright.\nconst x = 1;`, filename: 'src/components/home/StepsBar.tsx' },
    { code: `const s = 'rgba(0,0,0,0.38)';`, filename: 'src/visualiser/KlayConfigurator.tsx' },
  ],
  invalid: [
    { code: `const a = '#000';`, filename: 'src/pages/Thing.tsx', errors: 1 },
    { code: `const b = "#000000";`, filename: 'src/pages/Thing.tsx', errors: 1 },
    { code: `const c = \`border: 1px solid #1A1A1A\`;`, filename: 'src/pages/Thing.tsx', errors: 1 },
    { code: `// #000000 and #1A1A1A here.\nconst x = 1;`, filename: 'src/x.tsx', options: [{ includeComments: true }], errors: 2 },
    { code: `const s = 'rgba(0,0,0,0.38)';`, filename: 'src/x.tsx', options: [{ flagRgbaBlack: true }], errors: 1 },
  ],
});

console.log('\n=== klay/no-direct-env-access ===');
check('no-direct-env-access', klay.rules['no-direct-env-access'], {
  valid: [
    { code: `const k = import.meta.env.VITE_TURNSTILE_SITE_KEY;`, filename: 'src/config/env.ts' },
    { code: `import { turnstileSiteKey } from '@/config';`, filename: 'src/components/Turnstile.tsx' },
    { code: `const u = import.meta.url;`, filename: 'src/components/Turnstile.tsx' },
  ],
  invalid: [
    { code: `const k = import.meta.env.VITE_TURNSTILE_SITE_KEY;`, filename: 'src/components/Turnstile.tsx', errors: 1 },
    { code: `const p = process.env.NODE_ENV;`, filename: 'src/components/Turnstile.tsx', errors: 1 },
    { code: `const e = import.meta.env;`, filename: 'src/pages/Thing.tsx', errors: 1 },
  ],
});

console.log(`\n${pass} rule suites passed, ${fail.length} failed${fail.length ? ': ' + fail.join(', ') : ''}`);
process.exit(fail.length ? 1 : 0);

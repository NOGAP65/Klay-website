/**
 * The Klay local ESLint plugin — the three rules that hold the design system
 * and the config boundary together.
 *
 * ---------------------------------------------------------------------------
 * THESE RULES ARE NOT WIRED IN YET, AND THAT IS DELIBERATE.
 *
 * `npm run lint` currently crashes before it lints a single file:
 *
 *   TypeError: Error while loading rule '@typescript-eslint/no-unused-expressions':
 *   Cannot read properties of undefined (reading 'allowShortCircuit')
 *
 * eslint 9.39.5 is installed against typescript-eslint 8.x and the
 * `no-unused-expressions` rule signature changed between them. Aligning those
 * two versions is task 1 of Phase 1.2; until it is done there is no working
 * lint run to attach these to, and no baseline can honestly be recorded.
 *
 * When 1.2 lands, add to eslint.config.js:
 *
 *   import klay from './tools/eslint-rules/index.js';
 *
 *   {
 *     files: ['src/**\/*.{ts,tsx}'],
 *     plugins: { klay },
 *     rules: {
 *       'klay/no-hardcoded-style-values': 'warn',
 *       'klay/no-pure-black': 'warn',
 *       'klay/no-direct-env-access': 'warn',
 *     },
 *   }
 *
 * ALL THREE START AT `warn`, per the migration plan. They flip to `error` in
 * Phase 6.1, and only the ones whose count has reached zero.
 * ---------------------------------------------------------------------------
 */

import noHardcodedStyleValues from './no-hardcoded-style-values.js';
import noPureBlack from './no-pure-black.js';
import noDirectEnvAccess from './no-direct-env-access.js';
import noBannedAbbreviations from './no-banned-abbreviations.js';
import oneVerbPerConcept from './one-verb-per-concept.js';

export default {
  meta: {
    name: 'eslint-plugin-klay',
    version: '0.1.0',
  },
  rules: {
    'no-hardcoded-style-values': noHardcodedStyleValues,
    'no-pure-black': noPureBlack,
    'no-direct-env-access': noDirectEnvAccess,
    // Phase 7's two, written BEFORE any rename so the pass can be measured.
    'no-banned-abbreviations': noBannedAbbreviations,
    'one-verb-per-concept': oneVerbPerConcept,
  },
};

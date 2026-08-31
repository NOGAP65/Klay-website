import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';
import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';
import klay from './tools/eslint-rules/index.js';

// ---------------------------------------------------------------------------
// KLAY ESLINT CONFIGURATION
// Implements SPECIFICATION.md §11. Read that section before changing anything.
//
// EVERY RULE IN THIS FILE IS `warn`. That is not timidity, it is §11:
//
//   "every new rule starts as warn with a recorded baseline count. The count
//    may go down; it may not go up. At zero it flips to error permanently.
//    Turning everything to error on day one produces 400 failures and the
//    rules get switched off."
//
// The baseline is recorded in docs/architecture/LINT_BASELINE.md. Rules flip to
// error in Phase 6.1, and only the ones that have reached zero.
//
// Consequence worth understanding: `eslint .` exits 0 while every rule is a
// warning, so the CI lint step passes. It is the BASELINE FILE, not the exit
// code, that holds the line during the migration. CI compares against it.
// ---------------------------------------------------------------------------

/** Rewrites a shared config's severities to `warn`. The recommended sets ship
 *  as `error`; §11 requires everything to enter at `warn`. */
const asWarnings = (configs) =>
  configs.map((config) => {
    if (!config.rules) return config;
    const rules = {};
    for (const [name, setting] of Object.entries(config.rules)) {
      if (Array.isArray(setting)) rules[name] = ['warn', ...setting.slice(1)];
      else if (setting === 'error' || setting === 2) rules[name] = 'warn';
      else rules[name] = setting;
    }
    return { ...config, rules };
  });

/** The four protected IP files — SPECIFICATION.md §12, E-01 to E-04.
 *  Exempt from size and complexity limits. They may be moved; their contents
 *  may not be edited, so a size warning on them is noise nobody may action. */
const PROTECTED_IP = [
  '**/homography.ts',
  '**/Canvas2DBlindRenderer.tsx',
  '**/CornerPinOverlay.tsx',
  '**/usePhotoUpload.ts',
];

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'docs', '.netlify'] },

  // --- base -----------------------------------------------------------------
  ...asWarnings([js.configs.recommended]),
  ...asWarnings(tseslint.configs.recommended),

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        // TYPED LINTING, and it is not optional here. §6 requires booleans to
        // carry an is/has/can/should prefix, and the only way a linter can know
        // a variable IS a boolean is to ask the typechecker. `projectService`
        // lets typescript-eslint reuse the same three-project setup tsc -b
        // already uses, rather than being handed a project list by hand.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
      boundaries,
      klay,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.app.json', './tsconfig.functions.json'],
          noWarnOnMultipleProjects: true,
        },
      },
      // ---------------------------------------------------------------------
      // THE LAYER MODEL — SPECIFICATION.md §2, as amended by ADR-014.
      //
      // Order matters: boundaries takes the FIRST pattern that matches, so the
      // more specific `features/*` must precede nothing broader, and the legacy
      // directories sit last as a catch-all for code the migration has not
      // moved yet.
      // ---------------------------------------------------------------------
      'boundaries/elements': [
        { type: 'core', pattern: 'shared-core/**' },
        { type: 'app', pattern: 'src/app/**' },
        { type: 'config', pattern: 'src/config/**' },
        { type: 'design-system', pattern: 'src/design-system/**' },
        { type: 'feature', pattern: 'src/features/*/**', capture: ['featureName'] },
        { type: 'shared', pattern: 'src/shared/**' },
        // Everything the migration has not relocated yet. Declared so that
        // boundaries can classify it rather than treating it as unknown; it has
        // no restrictions of its own, because restricting code that has not
        // reached its destination would report violations nobody can fix.
        { type: 'legacy', pattern: 'src/**' },
      ],
      'boundaries/ignore': ['**/*.test.{ts,tsx}'],
    },

    rules: {
      // --- react ------------------------------------------------------------
      ...Object.fromEntries(
        Object.entries(reactHooks.configs.recommended.rules ?? {}).map(([k]) => [k, 'warn']),
      ),
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // --- imports: §10 -----------------------------------------------------
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          pathGroups: [
            { pattern: '@/config/**', group: 'internal', position: 'before' },
            { pattern: '@/ds/**', group: 'internal', position: 'before' },
            { pattern: '@/core/**', group: 'internal', position: 'before' },
            { pattern: '@/shared/**', group: 'internal', position: 'before' },
            { pattern: '@/features/**', group: 'internal' },
            { pattern: '@/app/**', group: 'internal' },
          ],
          pathGroupsExcludedImportTypes: ['type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-cycle': ['warn', { maxDepth: Infinity, ignoreExternal: true }],
      'import/no-relative-parent-imports': 'warn',
      'import/no-self-import': 'warn',
      'import/no-useless-path-segments': 'warn',
      // Feature internals are private — §1 rule 3. Only the barrel is public.
      'import/no-internal-modules': [
        'warn',
        { allow: ['@/features/*', '@/ds/**', '@/shared/**', '@/config/**', '@/core/**', '**/node_modules/**'] },
      ],

      // --- layer direction: §2 + ADR-014 ------------------------------------
      'boundaries/element-types': [
        'warn',
        {
          default: 'disallow',
          rules: [
            { from: 'app', allow: ['feature', 'design-system', 'shared', 'config', 'core'] },
            { from: 'feature', allow: ['design-system', 'shared', 'config', 'core', ['feature', { featureName: '${from.featureName}' }]] },
            { from: 'design-system', allow: ['design-system'] },
            { from: 'shared', allow: ['shared', 'config'] },
            // ADR-014: shared-core imports NOTHING. Not src/, not netlify/,
            // not shared/. Zero dependencies in either direction — it is the
            // contract between two runtimes and may not depend on either.
            { from: 'core', allow: [] },
            // Not yet migrated. No restrictions until it lands somewhere.
            { from: 'legacy', allow: ['legacy', 'design-system', 'shared', 'config', 'core', 'feature', 'app'] },
          ],
        },
      ],

      // --- the three custom rules: §9, §11 ----------------------------------
      'klay/no-hardcoded-style-values': 'warn',
      'klay/no-pure-black': 'warn',
      'klay/no-direct-env-access': 'warn',

      // --- size and complexity: §8 ------------------------------------------
      // Error thresholds only. The warn thresholds in §8 are guidance for a
      // reader; two severities of the same rule is not expressible here, and
      // reporting at 200 as well as 300 would double the baseline for no gain.
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 60, skipBlankLines: true, skipComments: true }],
      'max-params': ['warn', 4],
      'max-depth': ['warn', 4],
      complexity: ['warn', 12],

      // --- naming: §6 -------------------------------------------------------
      '@typescript-eslint/naming-convention': [
        'warn',
        { selector: 'variable', modifiers: ['const'], types: ['boolean'], format: ['PascalCase'], prefix: ['is', 'has', 'can', 'should', 'was', 'will', 'did'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
      ],
    },
  },

  // --- §12 E-01..E-04: the protected IP files -------------------------------
  {
    files: PROTECTED_IP,
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      complexity: 'off',
      'max-depth': 'off',
      'max-params': 'off',
    },
  },

  // --- §12 E-06: tokens are the source of the literals ----------------------
  {
    files: ['src/design-system/tokens/**'],
    rules: { 'klay/no-hardcoded-style-values': 'off' },
  },

  // --- config/env.ts is the one file allowed to read the environment --------
  {
    files: ['src/config/env.ts'],
    rules: { 'klay/no-direct-env-access': 'off' },
  },

  // --- the server. Node globals, and no browser assumptions. ----------------
  {
    files: ['netlify/**/*.ts', 'shared-core/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      'klay/no-direct-env-access': 'off', // netlify/lib/env.ts owns process.env
      'react-hooks/rules-of-hooks': 'off',
    },
  },

  // --- tooling and config files ---------------------------------------------
  {
    files: ['*.config.{js,ts}', 'tools/**/*.{js,mjs}', 'research.mjs'],
    languageOptions: { globals: globals.node },
    rules: {
      'import/no-relative-parent-imports': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
    },
  },
);

import { defineConfig, devices } from '@playwright/test';

const variants = [
  { name: 'desktop', settings: { ...devices['Desktop Chrome'], channel: process.platform === 'win32' ? 'msedge' : undefined } },
  { name: 'android', settings: { ...devices['Pixel 7'], channel: process.platform === 'win32' ? 'msedge' : undefined } },
  { name: 'ios', settings: { ...devices['iPhone 13'], defaultBrowserType: 'webkit' as const } },
];
export default defineConfig({
  testDir: './tests',
  tsconfig: './tests/tsconfig.json',
  timeout: 90_000,
  expect: { timeout: 12_000 },
  workers: 2,
  fullyParallel: true,
  webServer: process.env.TEST_URL ? undefined : {
    command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI,
  },
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }], ['html', { open: 'never' }]],
  use: { baseURL: process.env.TEST_URL ?? 'http://127.0.0.1:4173', actionTimeout: 12_000, navigationTimeout: 25_000, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'performance', testMatch: '**/performance.spec.ts', use: { ...variants[0].settings, reducedMotion: 'reduce' } },
    { name: 'domain', testMatch: ['**/domain.spec.ts', '**/architecture.spec.ts', '**/joinery.spec.ts', '**/fabrics.spec.ts', '**/cart.spec.ts'] },
    { name: 'basic-android', testMatch: '**/visualiser-compatibility.spec.ts', use: { ...variants[1].settings, viewport: { width: 320, height: 640 }, deviceScaleFactor: 1, colorScheme: 'dark' } },
    { name: 'forced-dark-android', testMatch: ['**/visualiser-compatibility.spec.ts', '**/forced-dark.spec.ts'], use: { ...variants[1].settings, colorScheme: 'dark' } },
    ...variants.flatMap(({name, settings}) => (['light','dark'] as const).map(colorScheme => ({
      name: `${name}-${colorScheme}`, testMatch: ['**/site.spec.ts', '**/visualiser.spec.ts', '**/visualiser-compatibility.spec.ts', '**/shopping-experience.spec.ts', '**/reliability.spec.ts'], use: { ...settings, colorScheme },
    }))),
  ],
});

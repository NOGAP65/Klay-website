import { defineConfig, devices } from '@playwright/test';

const isWidgetTest = process.env.SECURITY_WIDGET_TEST === '1';
const localPort = isWidgetTest ? 4175 : 4173;
const localUrl = `http://127.0.0.1:${localPort}`;
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
    command: `node node_modules/vite/bin/vite.js ${isWidgetTest ? '' : 'preview'} --host 127.0.0.1 --port ${localPort} --strictPort`,
    ...(isWidgetTest ? { env: { VITE_TURNSTILE_SITE_KEY: '1x00000000000000000000AA' } } : {}),
    url: localUrl, reuseExistingServer: !process.env.CI && !isWidgetTest,
  },
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }], ['html', { open: 'never' }]],
  use: { baseURL: process.env.TEST_URL ?? localUrl, actionTimeout: 12_000, navigationTimeout: 25_000, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'security-widget', testMatch: '**/security-widget.spec.ts', use: { ...variants[0].settings } },
    { name: 'security-widget-android', testMatch: '**/security-widget.spec.ts', use: { ...variants[1].settings } },
    { name: 'security-widget-ios', testMatch: '**/security-widget.spec.ts', use: { ...variants[2].settings } },
    { name: 'performance', testMatch: '**/performance.spec.ts', use: { ...variants[0].settings, reducedMotion: 'reduce' } },
    { name: 'domain', testMatch: ['**/domain.spec.ts', '**/architecture.spec.ts', '**/joinery.spec.ts', '**/fabrics.spec.ts', '**/cart.spec.ts', '**/routes.spec.ts', '**/security.spec.ts', '**/security-hardening.spec.ts', '**/customer-validation.spec.ts'] },
    { name: 'basic-android', testMatch: ['**/visualiser-compatibility.spec.ts', '**/roller-preview.spec.ts'], use: { ...variants[1].settings, viewport: { width: 320, height: 640 }, deviceScaleFactor: 1, colorScheme: 'dark' } },
    { name: 'forced-dark-android', testMatch: ['**/visualiser-compatibility.spec.ts', '**/forced-dark.spec.ts', '**/roller-preview.spec.ts'], use: { ...variants[1].settings, colorScheme: 'dark' } },
    ...variants.flatMap(({name, settings}) => (['light','dark'] as const).map(colorScheme => ({
      name: `${name}-${colorScheme}`, testMatch: ['**/site.spec.ts', '**/visualiser.spec.ts', '**/visualiser-compatibility.spec.ts', '**/shopping-experience.spec.ts', '**/reliability.spec.ts', '**/loading.spec.ts', '**/form-validation.spec.ts', '**/joinery-preview.spec.ts', '**/roller-preview.spec.ts'], use: { ...settings, colorScheme },
    }))),
  ],
});

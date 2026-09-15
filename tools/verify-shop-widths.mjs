// Compatibility entry point; the maintained assertions run in the domain suite.
import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath, ['node_modules/playwright/cli.js', 'test', '--project=domain', '--grep', 'joinery width geometry'], { stdio: 'inherit', env: { ...process.env, TEST_URL: 'http://127.0.0.1:4173' } });
process.exitCode = result.status ?? 1;

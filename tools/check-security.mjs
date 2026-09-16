import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// High-confidence checks: report only paths and rule names, never secret values.
const rules = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['Stripe secret', /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{20,}\b/],
  ['webhook secret', /\bwhsec_[A-Za-z0-9]{20,}\b/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['npm token', /\bnpm_[A-Za-z0-9]{30,}\b/],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['Supabase secret key', /\bsb_secret_[A-Za-z0-9_-]{20,}\b/],
];
const failures = [];
for (const name of Object.keys(process.env)) {
  if (name.startsWith('VITE_') && /SECRET|PRIVATE|PASSWORD|TOKEN|SERVICE_ROLE/i.test(name)) {
    failures.push(`environment: ${name} must not have a public VITE_ prefix`);
  }
}
const secretNames = ['TURNSTILE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET', 'RESEND_API_KEY'];
function scan(file) {
  if (!existsSync(file) || !statSync(file).isFile()) return;
  const content = readFileSync(file);
  if (content.includes(0)) return; // Binary images/fonts are checked by asset validation.
  const text = content.toString('utf8');
  for (const name of secretNames) {
    const value = process.env[name];
    if (value && value.length >= 12 && text.includes(value)) failures.push(`${file}: contains configured ${name}`);
  }
  for (const [name, pattern] of rules) if (pattern.test(text)) failures.push(`${file}: ${name}`);
  for (const match of text.matchAll(/\beyJ[A-Za-z0-9_-]+\.(eyJ[A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+\b/g)) {
    try { if (JSON.parse(Buffer.from(match[1], 'base64url').toString()).role === 'service_role') failures.push(`${file}: service-role JWT`); } catch { /* Not a JWT. */ }
  }
}
const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
for (const file of tracked) {
  if (/(?:^|\/)\.env(?:$|\.)/.test(file) && !file.endsWith('.env.example')) failures.push(`${file}: tracked environment file`);
  scan(file);
}
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(item => item.isDirectory() ? walk(join(dir, item.name)) : [join(dir, item.name)]);
}
if (!existsSync('dist/index.html')) throw new Error('Build the production site before running the security check.');
const published = walk('dist');
for (const file of published) {
  if (/\.(?:map|sql|pem|key|ts|tsx|bak|log)$/i.test(file) || /(?:^|[\\/])\.(?:env|git|netlify)(?:[.\\/]|$)/.test(file)) {
    failures.push(`${file}: private/source file in published output`);
  }
  scan(file);
}
const headers = readFileSync('netlify.toml', 'utf8');
for (const directive of ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'none'", "script-src-attr 'none'", 'nosniff']) {
  if (!headers.includes(directive)) failures.push(`netlify.toml: missing ${directive}`);
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Security checks passed: ${tracked.length} tracked files, ${published.length} published files, no matching secret patterns or exposed source files.`);

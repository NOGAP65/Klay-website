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
for (const directive of ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'none'", "script-src-attr 'none'",
  "form-action 'self'", 'nosniff', 'Strict-Transport-Security', 'Cross-Origin-Opener-Policy = "same-origin"',
  'Cross-Origin-Resource-Policy = "same-origin"', 'report-uri /api/csp-report']) {
  if (!headers.includes(directive)) failures.push(`netlify.toml: missing ${directive}`);
}

// THE DIRECTIVE THAT DECIDES WHETHER INJECTED MARKUP CAN RUN. Everything else
// in the policy is depth; script-src is the control. 'unsafe-inline' or
// 'unsafe-eval' appearing here — most likely added to make some library work —
// would retire the site's main XSS defence without anybody noticing, so it
// fails the build rather than being left to code review. style-src is
// deliberately not checked: it carries 'unsafe-inline' by design, because the
// design system styles with React inline `style` props.
const enforced = /^\s*Content-Security-Policy\s*=\s*"([^"]*)"/m.exec(headers)?.[1] ?? '';
if (!enforced) failures.push('netlify.toml: no enforced Content-Security-Policy');
const scriptSrc = /(?:^|;)\s*script-src\s([^;]*)/.exec(enforced)?.[1] ?? '';
for (const unsafe of ["'unsafe-inline'", "'unsafe-eval'", "'strict-dynamic'", 'data:', '*']) {
  if (scriptSrc.split(/\s+/).includes(unsafe)) failures.push(`netlify.toml: script-src permits ${unsafe}`);
}

// The policy names a reporting path; something has to answer on it, or every
// violation the browser tries to report is quietly discarded.
const reportPath = /report-uri\s+(\S+?);/.exec(enforced)?.[1];
if (reportPath && !readFileSync('netlify/functions/csp-report.ts', 'utf8').includes(`path: '${reportPath}'`)) {
  failures.push(`netlify.toml: report-uri ${reportPath} has no function serving it`);
}

// RFC 9116 makes Expires mandatory, and an expired file is treated as absent.
// scripts/emit-security-txt.mjs renews it on every build; this is the check
// that the script actually ran and produced something still in date.
if (!existsSync('dist/.well-known/security.txt')) {
  failures.push('dist/.well-known/security.txt: not emitted by the build');
} else {
  const expires = /^Expires:\s*(\S+)$/m.exec(readFileSync('dist/.well-known/security.txt', 'utf8'))?.[1];
  const expiryDate = expires ? Date.parse(expires) : NaN;
  if (!Number.isFinite(expiryDate)) failures.push('dist/.well-known/security.txt: missing or unparseable Expires');
  else if (expiryDate <= Date.now()) failures.push('dist/.well-known/security.txt: already expired');
}

if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Security checks passed: ${tracked.length} tracked files, ${published.length} published files, no matching secret patterns or exposed source files.`);

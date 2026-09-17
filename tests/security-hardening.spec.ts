import { test, expect } from '@playwright/test';

import checkout from '../netlify/functions/create-checkout-session';
import cspReport from '../netlify/functions/csp-report';
import quote from '../netlify/functions/request-quote';
import { checkSameOrigin, json } from '../netlify/lib/http';
import { checkRateLimit, rateLimitKey } from '../netlify/lib/rateLimit';

// Abuse-resistance regressions: origin pinning, rate-limit bucketing, response
// hardening, the CSP collector, and the outbound-mail relay. Split out of
// security.spec.ts only because that file reached its length budget; these
// belong to the same suite and run in the same project.
test.describe.configure({ mode: 'serial' });
const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
const originalError = console.error;
const origin = 'https://klay-website.netlify.app';
const valid = { name: "Chloë O'Connor", email: 'customer@example.com', phone: '+61 412 345 678',
  address: '2/18 Smith Street', suburb: 'Epping', postcode: '3076',
  blindType: 'dual', windowSize: 'large', operation: 'motorised', quantity: 2 };
const request = (body: unknown = valid, path = '/api/request-quote', headers: Record<string, string> = {}) =>
  new Request(origin + path, { method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });

test.beforeEach(() => {
  process.env.NODE_ENV = 'production';
  process.env.NETLIFY = 'true';
  process.env.URL = origin;
  process.env.SITE_URL = origin;
  process.env.TURNSTILE_SECRET_KEY = 'unit-test-not-a-real-secret';
  delete process.env.TURNSTILE_ALLOWED_HOSTNAMES;
  delete process.env.TURNSTILE_LOCAL_BYPASS;
  console.error = () => undefined;
  globalThis.fetch = async () => { throw new Error('Unexpected network access in security test'); };
});
test.afterEach(() => {
  for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
  Object.assign(process.env, originalEnv);
  globalThis.fetch = originalFetch;
  console.error = originalError;
});

test('a forged Host cannot make a cross-origin post look same-origin', async () => {
  // The attacker controls both their page's Origin and, if any hop honours it,
  // the Host that builds req.url — so a check comparing those two to each other
  // agrees with itself. The allowlist comes from configuration instead.
  const forged = new Request('https://attacker.example/api/request-quote', {
    method: 'POST', headers: { origin: 'https://attacker.example', 'content-type': 'application/json' },
    body: JSON.stringify(valid),
  });
  expect(checkSameOrigin(forged)?.status).toBe(403);
  for (const handler of [quote, checkout]) expect((await handler(forged.clone())).status).toBe(403);

  // Netlify's own addresses for a branch or preview deploy stay usable.
  process.env.DEPLOY_PRIME_URL = 'https://deploy-preview-7--klay-website.netlify.app';
  const preview = new Request('https://deploy-preview-7--klay-website.netlify.app/api/request-quote', {
    method: 'POST', headers: { origin: 'https://deploy-preview-7--klay-website.netlify.app' },
  });
  expect(checkSameOrigin(preview)).toBeNull();
});

test('Sec-Fetch-Site is authoritative when the browser sends it', () => {
  // Unforgeable from script, so anything but a first-party fetch is refused
  // before the Origin header — which a non-browser client can set freely — is
  // even consulted.
  for (const site of ['cross-site', 'same-site', 'none']) {
    expect(checkSameOrigin(request(valid, '/api/test', { 'sec-fetch-site': site }))?.status, site).toBe(403);
  }
  expect(checkSameOrigin(request(valid, '/api/test', { 'sec-fetch-site': 'same-origin' }))).toBeNull();
});

test('IPv6 clients are limited by /64, so rotating the host part buys nothing', () => {
  const sameSubnet = ['2001:db8:1:2::1', '2001:db8:1:2:ffff:ffff:ffff:fffe', '2001:DB8:1:2:AAAA::9'];
  expect(new Set(sameSubnet.map(rateLimitKey)).size).toBe(1);
  expect(rateLimitKey('2001:db8:1:2::1')).not.toBe(rateLimitKey('2001:db8:1:3::1'));
  // IPv4 is counted whole, and an IPv4-mapped address is the same IPv4 host —
  // bucketing those by /64 would file every one of them under a single key.
  expect(rateLimitKey('203.0.113.10')).toBe('203.0.113.10');
  expect(rateLimitKey('::ffff:203.0.113.10')).toBe('203.0.113.10');
  expect(rateLimitKey('::ffff:203.0.113.11')).not.toBe(rateLimitKey('::ffff:203.0.113.10'));

  const hammer = (ip: string) => checkRateLimit(request({}, '/api/subnet-test'), ip);
  for (let n = 0; n < 10; n++) expect(hammer(`2001:db8:9:9::${n}`)).toBeNull();
  expect(hammer('2001:db8:9:9::beef')?.status).toBe(429);
  expect(hammer('2001:db8:9:10::1')).toBeNull();
});

test('a table full of attacker buckets does not lock out the next real visitor', () => {
  // Rejecting on a full table turns the memory bound into the denial of service
  // it was meant to prevent: 5000 rotated addresses, and everyone else is told
  // to come back later. The oldest bucket is evicted instead.
  for (let n = 0; n < 6000; n++) checkRateLimit(request({}, '/api/flood'), `198.51.${(n >> 8) & 255}.${n & 255}`);
  expect(checkRateLimit(request({}, '/api/flood'), '203.0.113.200')).toBeNull();
  expect(checkRateLimit(request({}, '/api/request-quote'), '203.0.113.201')).toBeNull();
});

test('API responses are typed as data and cannot be framed or rendered', () => {
  const headers = json({ ok: true }).headers;
  expect(headers.get('content-security-policy')).toContain("default-src 'none'");
  expect(headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
  expect(headers.get('x-frame-options')).toBe('DENY');
  expect(headers.get('x-content-type-options')).toBe('nosniff');
  expect(headers.get('cache-control')).toBe('no-store');
});

test('the CSP collector logs sanitised violations, answers 204 to everything, and never becomes an oracle', async () => {
  const logged: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => { logged.push(args.join(' ')); };
  try {
    const report = (body: string, headers: Record<string, string> = {}) =>
      new Request(`${origin}/api/csp-report`, { method: 'POST',
        headers: { 'content-type': 'application/csp-report', ...headers }, body });

    // Legacy report-uri shape.
    expect((await cspReport(report(JSON.stringify({ 'csp-report': {
      'effective-directive': 'script-src', 'blocked-uri': 'https://evil.example/x.js',
      'document-uri': `${origin}/book`, 'script-sample': 'alert(1)' } })), { ip: '203.0.113.90' })).status).toBe(204);
    expect(logged.join('\n')).toContain('blocked=https://evil.example/x.js');
    expect(logged.join('\n')).toContain('directive=script-src');

    // Reporting API shape.
    logged.length = 0;
    expect((await cspReport(report(JSON.stringify([{ type: 'csp-violation', body: {
      effectiveDirective: 'require-trusted-types-for', blockedURL: 'trusted-types-sink',
      disposition: 'report' } }])), { ip: '203.0.113.91' })).status).toBe(204);
    expect(logged.join('\n')).toContain('directive=require-trusted-types-for');
    expect(logged.join('\n')).toContain('disposition=report');

    // A report's fields echo page content, so they must not be able to forge a
    // second log line or bury the log under one entry.
    logged.length = 0;
    await cspReport(report(JSON.stringify({ 'csp-report': {
      'blocked-uri': 'a\nb\r[csp] directive=forged blocked=clean', 'script-sample': 'x'.repeat(5000) } })),
    { ip: '203.0.113.92' });
    expect(logged).toHaveLength(1);
    expect(logged[0]).not.toContain('\n');
    expect(logged[0]).not.toContain('\r');
    expect(logged[0].length).toBeLessThan(1200);

    // Malformed, oversized and wrong-method requests are indistinguishable from
    // accepted ones: there is nothing here worth telling anyone apart.
    for (const bad of ['not json at all', '', 'x'.repeat(17 * 1024)]) {
      expect((await cspReport(report(bad), { ip: '203.0.113.93' })).status).toBe(204);
    }
    expect((await cspReport(new Request(`${origin}/api/csp-report`))).status).toBe(204);

    // And it stays 204 once the limit is reached, rather than reporting 429.
    for (let n = 0; n < 80; n++) await cspReport(report('{}'), { ip: '203.0.113.94' });
    expect((await cspReport(report('{}'), { ip: '203.0.113.94' })).status).toBe(204);
  } finally { console.warn = originalWarn; }
});

test('the customer acknowledgement cannot be used as a phishing relay', async () => {
  // /api/request-quote is unauthenticated and takes the recipient from the
  // request body, so anything echoed into that email is attacker text sent to
  // an attacker-chosen inbox over Klay's own DKIM alignment. Measured before
  // the fix: 26,733 bytes of attacker content delivered that way.
  process.env.SUPABASE_URL = 'https://database.example';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-key';
  process.env.RESEND_API_KEY = 'unit-test-mail-key';
  const mails: { to: string[]; html: string }[] = [];
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.startsWith('https://challenges.cloudflare.com/')) {
      return Response.json({ success: true, hostname: new URL(origin).hostname, action: 'customer_form' });
    }
    if (url.startsWith('https://database.example/')) return Response.json({ id: 'unit-quote-id' });
    if (url.startsWith('https://api.resend.com/')) { mails.push(JSON.parse(String(init?.body))); return Response.json({ id: 'm' }); }
    throw new Error('Unexpected network destination');
  };

  const lure = 'Confirm your card at https://klay-billing.example/verify';
  const victim = 'victim@example.org';
  const response = await quote(request({ ...valid, email: victim, notes: lure,
    fabricColour: 'https://evil.example/f', hardwareColour: 'https://evil.example/h',
    items: [{ name: 'Shelving', quantity: 1, options: [{ label: 'Note', value: lure }] }],
    turnstileToken: 'unit-token' }), { ip: '203.0.113.77' });
  expect(response.status).toBe(200);

  const toCustomer = mails.find(mail => mail.to.includes(victim));
  const toKlay = mails.find(mail => !mail.to.includes(victim));
  expect(toCustomer).toBeTruthy();
  // Nothing the attacker wrote may reach the address they nominated.
  for (const payload of [lure, 'klay-billing.example', 'evil.example', 'Shelving']) {
    expect(toCustomer!.html, payload).not.toContain(payload);
  }
  expect(toCustomer!.html).toContain('this address was entered into an enquiry form');
  // The internal alert still carries the whole enquiry: it goes to a known
  // inbox, not one the request chose.
  expect(toKlay!.html).toContain('klay-billing.example');
  expect(toKlay!.html).toContain('Shelving');
});

test('rate-limit buckets cannot be reset by dressing up the request path', () => {
  // The path is attacker-supplied text. Keying buckets on it meant /API/...,
  // a trailing slash or a doubled slash each minted a fresh counter.
  const ip = '198.51.100.77';
  for (let n = 0; n < 10; n++) expect(checkRateLimit(request({}, '/api/request-quote'), ip)).toBeNull();
  for (const variant of ['/api/request-quote', '/API/request-quote', '/api/request-quote/',
    '/api/request-quote//', '/api/./request-quote', '/api/request-quote?x=1']) {
    expect(checkRateLimit(request({}, variant), ip)?.status, variant).toBe(429);
  }
});

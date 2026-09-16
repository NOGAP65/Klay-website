import { test, expect } from '@playwright/test';
import Stripe from 'stripe';

import checkout, { config as checkoutConfig } from '../netlify/functions/create-checkout-session';
import orderStatus, { config as statusConfig } from '../netlify/functions/order-status';
import quote, { config as quoteConfig } from '../netlify/functions/request-quote';
import webhook from '../netlify/functions/stripe-webhook';
import { verifyTurnstile } from '../netlify/lib/antispam';
import { parseBooking, bookingRow } from '../netlify/lib/booking';
import { checkSameOrigin, MAX_JSON_BYTES, readJson, notConfigured, serverError } from '../netlify/lib/http';
import { checkRateLimit, getClientIp } from '../netlify/lib/rateLimit';
import { isRasterPhoto } from '../shared-core/photoFile';
import { isQuoteItems } from '../shared-core/quoteItems';
import { createCheckoutSession } from '../src/features/booking/api';

test.describe.configure({ mode: 'serial' });
const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
const originalError = console.error;
const origin = 'https://klay-website.netlify.app';
const valid = { name: "Chloë O'Connor", email: 'customer@example.com', phone: '+61 412 345 678',
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

test('form APIs reject cross-origin, missing-origin and non-JSON submissions before integrations', async () => {
  for (const handler of [quote, checkout]) {
    expect((await handler(request(valid, '/api/test', { origin: 'https://attacker.example' }))).status).toBe(403);
    const noOrigin = request(); noOrigin.headers.delete('origin');
    expect((await handler(noOrigin)).status).toBe(403);
    expect((await handler(request(valid, '/api/test', { 'sec-fetch-site': 'cross-site' }))).status).toBe(403);
    expect((await handler(request(valid, '/api/test', { 'content-type': 'text/plain' }))).status).toBe(415);
  }
  expect(checkSameOrigin(request())).toBeNull();
  expect((await quote(new Request(origin))).status).toBe(405);
});

test('body limits count bytes even without or with a dishonest Content-Length', async () => {
  const cases: Record<string, string>[] = [{}, { 'content-length': '1' }, { 'content-length': String(MAX_JSON_BYTES + 1) }];
  for (const headers of cases) {
    const result = await readJson(request({ notes: 'x'.repeat(MAX_JSON_BYTES) }, '/api/test', headers));
    expect(result instanceof Response && result.status).toBe(413);
  }
  const result = await readJson(request({}, '/api/test', { 'content-encoding': 'gzip' }));
  expect(result instanceof Response && result.status).toBe(415);
  expect(await readJson(request({ name: '王丽', notes: 'a'.repeat(4000) }))).toEqual({ name: '王丽', notes: 'a'.repeat(4000) });
});

test('customer and product inputs reject wrong types, excess lengths, header injection and invalid quantities', () => {
  const invalid = [{ name: ['Customer'] }, { email: 'a@b.com\r\nBcc: victim@example.com' }, { notes: 'x'.repeat(2001) },
    { phone: '...' }, { address: { nested: true } }, { name: 'a\u0000b' }, { preferredDate: '2026-02-31' },
    { blindType: '__proto__' }, { operation: 'free' }, { windowSize: 'huge' }, { quantity: '2' },
    { quantity: 1.5 }, { quantity: -1 }, { quantity: 41 }, { quantity: true }, { quantity: null }];
  for (const extra of invalid) expect(parseBooking({ ...valid, ...extra }).ok, JSON.stringify(extra)).toBe(false);
  const safe = parseBooking({ ...valid, notes: 'Window < 5m & linen', price: 1, amount_cents: 1, status: 'paid', internal_notes: 'injected' });
  expect(safe.ok).toBe(true);
  if (!safe.ok) return;
  expect(safe.booking.priced.totalCents).toBe(138000);
  expect(bookingRow(safe.booking).notes).toBe('Window < 5m & linen');
  expect(bookingRow(safe.booking)).not.toHaveProperty('status');
  expect(bookingRow(safe.booking)).not.toHaveProperty('internal_notes');
});

test('basket text has an aggregate budget and cannot inject control characters', () => {
  const item = { name: 'Shelving', quantity: 1, options: [{ label: 'Colour', value: 'White' }] };
  expect(isQuoteItems([item])).toBe(true);
  expect(isQuoteItems([{ ...item, name: 'Shelving\nFAKE ORDER' }])).toBe(false);
  const large = { ...item, options: Array(20).fill({ label: 'x'.repeat(80), value: 'x'.repeat(240) }) };
  expect(isQuoteItems(Array(40).fill(large))).toBe(false);
});

test('captcha is mandatory on hosted deployments, rejects test secrets, and only bypasses explicitly on localhost', async () => {
  delete process.env.TURNSTILE_SECRET_KEY;
  expect((await verifyTurnstile({}, '', request()))?.status).toBe(503);
  process.env.TURNSTILE_SECRET_KEY = '1x0000000000000000000000000000000AA';
  expect((await verifyTurnstile({ turnstileToken: 'test' }, '', request()))?.status).toBe(503);
  process.env.TURNSTILE_LOCAL_BYPASS = 'true';
  const local = new Request('http://localhost:8888/api/request-quote');
  expect((await verifyTurnstile({}, '', local))?.status).toBe(503);
  process.env.NODE_ENV = 'development'; process.env.NETLIFY = 'false';
  expect(await verifyTurnstile({}, '', local)).toBeNull();
  delete process.env.TURNSTILE_SECRET_KEY;
  expect((await verifyTurnstile({}, '', request()))?.status).toBe(503);
});

test('captcha checks exact success, hostname and action; service failure never authorizes a request', async () => {
  for (const reply of [{ success: true, hostname: 'attacker.example', action: 'customer_form' },
    { success: true, hostname: new URL(origin).hostname, action: 'other_form' },
    { success: 'true', hostname: new URL(origin).hostname, action: 'customer_form' }, { success: false }]) {
    globalThis.fetch = async () => Response.json(reply);
    expect((await verifyTurnstile({ turnstileToken: 'token' }, '', request()))?.status).toBe(400);
  }
  globalThis.fetch = async () => { throw new Error('offline'); };
  expect((await verifyTurnstile({ turnstileToken: 'token' }, '', request()))?.status).toBe(503);
  globalThis.fetch = async () => Response.json({ success: true }, { status: 500 });
  expect((await verifyTurnstile({ turnstileToken: 'token' }, '', request()))?.status).toBe(503);
  let calls = 0;
  globalThis.fetch = async (_url, init) => {
    calls++; expect(init?.signal).toBeDefined();
    return Response.json({ success: true, hostname: new URL(origin).hostname, action: 'customer_form' });
  };
  expect((await verifyTurnstile({ turnstileToken: 'x'.repeat(2049) }, '', request()))?.status).toBe(400);
  expect(calls).toBe(0);
  expect(await verifyTurnstile({ turnstileToken: 'token' }, '', request())).toBeNull();
  expect(calls).toBe(1);
});

test('forged forwarded addresses cannot avoid the local limit; distributed limits protect the three customer APIs', () => {
  const incoming = request({}, '/api/rate-test', { 'x-forwarded-for': '1.1.1.1' });
  expect(getClientIp(incoming)).toBe('');
  expect(getClientIp(incoming, '203.0.113.10')).toBe('203.0.113.10');
  for (let n = 0; n < 10; n++) expect(checkRateLimit(incoming, '203.0.113.10')).toBeNull();
  incoming.headers.set('x-forwarded-for', '2.2.2.2');
  const limited = checkRateLimit(incoming, '203.0.113.10');
  expect(limited?.status).toBe(429);
  expect(Number(limited?.headers.get('retry-after'))).toBeGreaterThan(0);
  for (const config of [quoteConfig, checkoutConfig, statusConfig]) {
    expect(config.rateLimit?.aggregateBy).toEqual(['ip', 'domain']);
    expect(config.rateLimit?.windowSize).toBe(60);
  }
});

test('API failures disclose neither environment names nor private exception contents', async () => {
  const log: unknown[] = [];
  console.error = (...args: unknown[]) => { log.push(args); };
  const unavailable = await notConfigured(['PRIVATE_SECRET_NAME']).text();
  const failed = await serverError('test', new Error('private customer details')).text();
  expect(unavailable).not.toContain('PRIVATE_SECRET_NAME');
  expect(failed).not.toContain('private customer details');
  expect(JSON.stringify(log)).not.toContain('private customer details');
});

test('order status rejects malformed session identifiers before database access', async () => {
  for (const id of ['cs_', 'cs_x', 'cs_abc OR 1=1', 'cs_../../secret', 'x'.repeat(201)]) {
    expect((await orderStatus(new Request(`${origin}/api/order-status?session_id=${encodeURIComponent(id)}`))).status).toBe(400);
  }
});

test('webhook requires a valid raw-body signature and preserves valid signed event bytes', async () => {
  process.env.SUPABASE_URL = 'https://database.example';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-key';
  process.env.STRIPE_SECRET_KEY = 'sk_test_unit';
  process.env.STRIPE_WEBHOOK_SECRET = 'unit-test-signing-secret';
  expect((await webhook(request({}, '/api/stripe-webhook'))).status).toBe(400);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const payload = JSON.stringify({ id: 'evt_unit', type: 'unhandled.test', data: { object: {} } });
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });
  const eventRequest = (body: string) => new Request(origin + '/api/stripe-webhook', { method: 'POST', body, headers: { 'stripe-signature': signature } });
  expect((await webhook(eventRequest(payload + ' '))).status).toBe(400);
  expect((await webhook(eventRequest(payload))).status).toBe(200);
});

test('checkout redirects accept only the Stripe checkout origin', async () => {
  const payload = { ...valid, blindType: 'dual', windowSize: 'large', operation: 'motorised' } as const;
  for (const url of ['https://attacker.example', 'javascript:alert(1)', 'https://checkout.stripe.com.attacker.example',
    'https://checkout.stripe.com@attacker.example', 'https://attacker@checkout.stripe.com', 'https://checkout.stripe.com:444/pay']) {
    globalThis.fetch = async () => Response.json({ url, orderId: 'unit' });
    expect((await createCheckoutSession(payload)).ok, url).toBe(false);
  }
  globalThis.fetch = async () => Response.json({ url: 'https://checkout.stripe.com/c/pay/cs_test_example', orderId: 'unit' });
  expect((await createCheckoutSession(payload)).ok).toBe(true);
});

test('photo headers reject active documents even when renamed as photographs', () => {
  const bytes = (text: string) => new TextEncoder().encode(text);
  for (const body of ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    '<!doctype html><html>document</html>', '<?xml version="1.0"?><svg />', '%PDF-1.5 malicious image']) {
    expect(isRasterPhoto(bytes(body))).toBe(false);
  }
  expect(isRasterPhoto(new Uint8Array([0xff, 0xd8, 0xff, ...Array(12).fill(0)]))).toBe(true);
  expect(isRasterPhoto(bytes('RIFF1234WEBP1234'))).toBe(true);
});

test('checkout requires a complete configuration and HTTPS return URLs in production', async () => {
  expect((await checkout(request({ name: valid.name, email: valid.email }, '/api/create-checkout-session'))).status).toBe(400);
  process.env.SUPABASE_URL = 'https://database.example';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-key';
  process.env.STRIPE_SECRET_KEY = 'sk_test_unit';
  globalThis.fetch = async () => Response.json({ success: true, hostname: new URL(origin).hostname, action: 'customer_form' });
  for (const site of ['http://localhost:8888', 'ftp://localhost', 'https://user:password@example.com', 'invalid']) {
    process.env.SITE_URL = site;
    expect((await checkout(request({ ...valid, turnstileToken: 'unit-token' }, '/api/create-checkout-session'), { ip: '203.0.113.57' })).status).toBe(503);
  }
});

test('a verified enquiry stores only approved columns and escapes customer text in both emails', async () => {
  process.env.SUPABASE_URL = 'https://database.example';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-key';
  process.env.RESEND_API_KEY = 'unit-test-mail-key';
  const mails: string[] = [];
  let stored: Record<string, unknown> | undefined;
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.startsWith('https://challenges.cloudflare.com/')) {
      return Response.json({ success: true, hostname: new URL(origin).hostname, action: 'customer_form' });
    }
    if (url.startsWith('https://database.example/rest/v1/quote_requests')) {
      stored = JSON.parse(String(init?.body));
      return Response.json({ id: 'unit-quote-id' });
    }
    if (url.startsWith('https://api.resend.com/emails')) {
      mails.push(JSON.parse(String(init?.body)).html);
      return Response.json({ id: 'unit-mail-id' });
    }
    throw new Error('Unexpected network destination');
  };
  const result = await quote(request({ ...valid, name: '<img src=x onerror=alert(1)>', notes: '<script>alert(1)</script>',
    turnstileToken: 'unit-token', handled: true, internal_notes: 'forged' }), { ip: '203.0.113.55' });
  expect(result.status).toBe(200);
  expect(stored).not.toHaveProperty('handled');
  expect(stored).not.toHaveProperty('internal_notes');
  expect(mails).toHaveLength(2);
  for (const html of mails) {
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
  }
});

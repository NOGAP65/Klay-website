import isEmail from 'validator/lib/isEmail.js';

import { hasControlCharacters } from './plainText';

export type CustomerMode = 'installation' | 'contact';
export type CustomerErrors = Record<string, string>;
export type LocalityIndex = Record<string, string>;
export const CUSTOMER_LIMITS = { name: 120, email: 200, phone: 40, address: 240,
  suburb: 120, postcode: 4, preferredDate: 10, notes: 2000 } as const;
export type CustomerField = keyof typeof CUSTOMER_LIMITS;

export function customerText(value: unknown): string {
  return typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/g, ' ') : '';
}

/** Calendar dates use the business timezone, not the customer's device clock/zone. */
export function bookingDateBounds(now = new Date()): { min: string; max: string } {
  const parts = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne',
    year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  const today = Date.parse(`${part('year')}-${part('month')}-${part('day')}T00:00:00Z`);
  const day = 86_400_000;
  return { min: new Date(today + day).toISOString().slice(0, 10),
    max: new Date(today + 365 * day).toISOString().slice(0, 10) };
}

export function validPreferredDate(value: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return false;
  const bounds = bookingDateBounds(now);
  return value >= bounds.min && value <= bounds.max;
}

export function validCustomerName(value: string): boolean {
  if (!/^[\p{L}\p{M}]+\.?(?:[ '’-][\p{L}\p{M}]+\.?)*$/u.test(value)) return false;
  // Full names may contain accents, apostrophes and hyphens. Names written in
  // East Asian scripts need not use spaces between family and given names.
  return value.split(' ').length >= 2 || /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]{2,}$/u.test(value);
}

export function validAustralianPhone(value: string): boolean {
  if (!/^[+\d ().-]+$/.test(value)) return false;
  const digits = value.replace(/[ ().-]/g, '').replace(/^\+610?/, '0');
  return /^0[23478]\d{8}$/.test(digits) && !/^0[23478](\d)\1{7}$/.test(digits);
}

export function validStreetAddress(value: string): boolean {
  if (!/^[\p{L}\p{M}\d ,.'’/#&-]+$/u.test(value) || /\b(?:P\.?\s*O\.?\s*BOX|GPO\s*BOX|LOCKED\s*BAG)\b/i.test(value)) return false;
  const street = value.replace(/^(?:unit|apartment|apt|suite|level|shop|villa|townhouse)\s+[\da-z-]+\s*[,/]?\s+/i, '');
  return /^(?:lot\s+)?\d+[a-z]?(?:[-/]\d+[a-z]?)?\s+\p{L}[\p{L}\p{M}\d .'’&-]+$/iu.test(street);
}

function shapeErrors(body: Record<string, unknown>): CustomerErrors {
  const errors: CustomerErrors = {};
  for (const [key, limit] of Object.entries(CUSTOMER_LIMITS)) {
    const value = body[key];
    if (value === undefined || value === null) continue;
    if (typeof value !== 'string' || value.length > limit || hasControlCharacters(value, key === 'notes')) {
      errors[key] = `Please use text of ${limit} characters or fewer, without control characters.`;
    }
  }
  return errors;
}

function contactErrors(body: Record<string, unknown>, mode: CustomerMode): CustomerErrors {
  const errors: CustomerErrors = {};
  const name = customerText(body.name), email = customerText(body.email), phone = customerText(body.phone);
  if (!name) errors.name = 'Please tell us your name.';
  else if (!validCustomerName(name)) errors.name = 'Please enter your full name, using letters, spaces, hyphens or apostrophes.';
  if (!email) errors.email = 'We need an email to reply to.';
  else if (!isEmail(email, { allow_display_name: false, allow_ip_domain: false })) errors.email = 'Please enter a valid email address, such as name@example.com.';
  if ((mode === 'installation' || phone) && !validAustralianPhone(phone)) {
    errors.phone = 'Enter a 10-digit Australian mobile or landline, including the area code. +61 is also accepted.';
  }
  const notes = customerText(body.notes);
  if ((mode === 'contact' || notes) && notes.length < 10) errors.notes = 'Please add at least 10 characters so we can understand your request.';
  return errors;
}

function installationErrors(body: Record<string, unknown>, now: Date): CustomerErrors {
  const errors: CustomerErrors = {};
  if (!validStreetAddress(customerText(body.address))) errors.address = 'Enter the installation street number and street name, including the unit if needed.';
  const suburb = customerText(body.suburb);
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'’()-]+$/u.test(suburb)) errors.suburb = 'Please enter the installation suburb.';
  if (!/^\d{4}$/.test(customerText(body.postcode))) errors.postcode = 'Enter a four-digit Australian postcode.';
  const date = customerText(body.preferredDate);
  if (date && !validPreferredDate(date, now)) errors.preferredDate = 'Choose a real date from tomorrow to the next 365 days, or leave it blank.';
  return errors;
}

/** Identical browser/server rules; locality data is supplied separately to keep
 * the 229 KB address index out of the JavaScript startup bundle. */
export function validateCustomer(body: Record<string, unknown>, mode: CustomerMode, now = new Date()): CustomerErrors {
  return { ...contactErrors(body, mode), ...(mode === 'installation' ? installationErrors(body, now) : {}), ...shapeErrors(body) };
}

const localityKey = (value: string) => customerText(value).toUpperCase().replace(/\bST\.?\s/g, 'SAINT ').replace(/\bMT\.?\s/g, 'MOUNT ').replace(/['’.-]/g, '').replace(/\s+/g, ' ');

export function validateLocality(body: Record<string, unknown>, index: LocalityIndex): CustomerErrors {
  const postcode = customerText(body.postcode), suburb = customerText(body.suburb);
  if (!/^\d{4}$/.test(postcode) || !suburb) return {};
  const localities = Object.prototype.hasOwnProperty.call(index, postcode) ? index[postcode].split('|') : [];
  if (!localities.length) return { postcode: 'This postcode is not in our Australian locality list. Please check it.' };
  if (localities.some(place => localityKey(place) === localityKey(suburb))) return {};
  return { suburb: `This suburb does not match ${postcode}. Check both fields (for example, ${localities.slice(0, 3).join(', ')}).` };
}

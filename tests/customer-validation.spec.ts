import { test, expect } from '@playwright/test';

import checkout from '../netlify/functions/create-checkout-session';
import quote from '../netlify/functions/request-quote';
import { parseBooking, parseQuoteBooking } from '../netlify/lib/booking';
import { bookingDateBounds, validateCustomer, validPreferredDate, validAustralianPhone, validStreetAddress, validateLocality } from '../shared-core/customerValidation';
import localities from '../shared-core/data/au-localities.json' with { type: 'json' };

const valid = { name: "Chloë O'Connor", email: 'customer+curtains@example.com', phone: '+61 412 345 678',
  address: 'Unit 2, 18 Smith Street', suburb: 'Epping', postcode: '3076',
  blindType: 'blockout', windowSize: 'medium', operation: 'manual', quantity: 1 };

test('screenshot values are rejected at both API boundaries before verification or storage', async () => {
  const screenshot = { ...valid, name: 'faf', email: 'fafa@gmail.com', phone: '746449',
    address: 'fafa', suburb: 'fafa', postcode: '6059', preferredDate: '46448-04-06', notes: 'afaf' };
  for (const [handler, path] of [[quote, '/api/request-quote'], [checkout, '/api/create-checkout-session']] as const) {
    const response = await handler(new Request(`https://klay-website.netlify.app${path}`, {
      method: 'POST', headers: { origin: 'https://klay-website.netlify.app', 'content-type': 'application/json' }, body: JSON.stringify(screenshot),
    }), { ip: '203.0.113.71' });
    expect(response.status).toBe(400);
    const { fields } = await response.json();
    for (const field of ['name', 'phone', 'address', 'suburb', 'preferredDate', 'notes']) expect(fields[field], field).toBeTruthy();
    expect(fields.email).toBeUndefined(); // A plausible email is not proof of ownership.
  }
});

test('Australian mobiles and landlines allow common formats and reject incomplete or foreign numbers', () => {
  for (const phone of ['0412 345 678', '+61 412 345 678', '+61 (0) 412 345 678', '(03) 9123 4567', '08 8123 4567']) {
    expect(validAustralianPhone(phone), phone).toBe(true);
  }
  for (const phone of ['746449', '041234567', '04123456789', '0000000000', '0400000000', '+1 212 555 1234', '0412abc678', '++61412345678']) {
    expect(validAustralianPhone(phone), phone).toBe(false);
  }
});

test('dates enforce calendar validity and business-timezone boundaries, including leap years', () => {
  const now = new Date('2027-03-01T01:00:00Z');
  expect(bookingDateBounds(now)).toEqual({ min: '2027-03-02', max: '2028-02-29' });
  for (const date of ['2027-03-02', '2028-02-29']) expect(validPreferredDate(date, now), date).toBe(true);
  for (const date of ['2027-03-01', '2027-02-29', '2028-03-01', '9999-01-01', '46448-04-06', '2027-13-01']) {
    expect(validPreferredDate(date, now), date).toBe(false);
  }
  expect(bookingDateBounds(new Date('2026-09-16T15:00:00Z')).min).toBe('2026-09-18');
});

test('numbered installation addresses and postcode/suburb pairs are validated independently', () => {
  for (const address of ['18 Smith Street', '2/18 Smith St', '18A Smith Road', '18-20 Smith Road', 'Unit 2, 18 Smith Street', 'Lot 3 Smith Road']) {
    expect(validStreetAddress(address), address).toBe(true);
  }
  for (const address of ['fafa', '123', 'PO Box 123', '18 <script>alert(1)</script>']) expect(validStreetAddress(address), address).toBe(false);
  for (const [suburb, postcode] of [['Epping', '3076'], ['Dianella', '6059'], ['Darwin', '0800'], ['Sydney', '2000'], ['St Kilda', '3182']]) {
    expect(validateLocality({ suburb, postcode }, localities), suburb).toEqual({});
  }
  expect(validateLocality({ suburb: 'fafa', postcode: '6059' }, localities).suburb).toContain('Dianella');
  expect(validateLocality({ suburb: 'Sydney', postcode: '3076' }, localities).suburb).toBeTruthy();
  expect(validateLocality({ suburb: 'Epping', postcode: '9999' }, localities).postcode).toBeTruthy();
});

test('strict fields preserve legitimate names, email subaddresses, accents and apostrophes', () => {
  for (const name of ["Chloë O'Connor", 'Jean-Luc Dupont', 'A. Smith', '王丽', 'Al Li']) {
    expect(validateCustomer({ ...valid, name }, 'installation'), name).toEqual({});
  }
  for (const email of ['a..b@example.com', 'a@-example.com', 'a@example..com', 'a@example', 'a@example.com\r\nBcc:evil@example.com']) {
    expect(validateCustomer({ ...valid, email }, 'installation').email, email).toBeTruthy();
  }
  expect(parseBooking(valid).ok).toBe(true);
  for (const field of ['name', 'email', 'phone', 'address', 'suburb', 'postcode']) {
    expect(parseBooking({ ...valid, [field]: '' }).ok, field).toBe(false);
  }
});

test('contact remains address-free but cannot disguise an incomplete installation or checkout', () => {
  const contact = { enquiryType: 'contact', name: valid.name, email: valid.email, notes: 'Please help me choose curtains.' };
  expect(parseQuoteBooking(contact).ok).toBe(true);
  expect(parseQuoteBooking({ ...contact, notes: 'afaf' }).ok).toBe(false);
  expect(parseQuoteBooking({ ...contact, phone: '746449' }).ok).toBe(false);
  expect(parseQuoteBooking({ ...contact, items: [] }).ok).toBe(false);
  expect(parseQuoteBooking({ ...contact, address: valid.address }).ok).toBe(false);
  expect(parseQuoteBooking({ ...valid, enquiryType: ['contact'] }).ok).toBe(false);
  expect(parseBooking(contact).ok).toBe(false);
});

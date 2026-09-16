import { test, expect } from '@playwright/test';
import { normaliseQuantity, parseOrderConfig, priceOrder, pricePerBlind } from '../shared-core/pricing';
import { isQuoteItems, quoteItemsSummary } from '../shared-core/quoteItems';
import { parseBooking, bookingRow } from '../netlify/lib/booking';
import { readJson } from '../netlify/lib/http';
import { bookingDateBounds } from '../shared-core/customerValidation';

const customer = { name: 'Test Customer', email: 'test@example.com', phone: '0412 345 678',
  address: '18 Smith Street', suburb: 'Epping', postcode: '3076' };

test('all roller price combinations agree, with bounded quantities and no client price authority', () => {
  for (const blindType of ['blockout','sunscreen','lightfilter','dual'] as const)
    for (const windowSize of ['small','medium','large'] as const)
      for (const operation of ['manual','motorised'] as const)
        for (const quantity of [1,2,40]) {
          const config = {blindType, windowSize, operation, quantity};
          const price = priceOrder(config);
          expect(price.total).toBe(pricePerBlind(config) * quantity + Math.max(120, quantity*60));
          expect(price.totalCents).toBe(price.total*100);
          expect(price.quantity).toBe(quantity);
        }
  for (const value of [NaN, Infinity, -10, 'invalid', 0]) expect(normaliseQuantity(value)).toBe(1);
  expect(normaliseQuantity(10000)).toBe(40);
  expect(parseOrderConfig({blindType:'invalid', windowSize:'invalid'})).toMatchObject({blindType:'blockout',windowSize:'medium'});
  const result = parseBooking({...customer, price:1, amount:1});
  expect(result.ok && result.booking.priced.total).toBe(380);
});

test('basket configurations and every option survive validation and storage', () => {
  const items = [{name:'Forma 7 shelving', quantity:2, options:[{label:'Width',value:'1800 mm'}, {label:'Colour',value:'White'}]},
    {name:'Roller blinds',quantity:1,options:[{label:'Fabric',value:'Panorama 5% Graphite'}]}];
  expect(isQuoteItems(items)).toBe(true);
  const result = parseBooking({...customer,items,notes:'Please call first'});
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(bookingRow(result.booking).notes).toContain(quoteItemsSummary(items));
  expect(bookingRow(result.booking).notes).toContain('Please call first');
  for (const invalid of [[], null, [{...items[0],quantity:NaN}], [{...items[0],quantity:1.5}], [{...items[0],quantity:41}], Array(41).fill(items[0]), [{...items[0],options:[null]}]]) {
    expect(isQuoteItems(invalid)).toBe(false);
    expect(parseBooking({...customer,items:invalid}).ok).toBe(false);
  }
});

test('customer validation rejects malformed dates, emails and phone numbers', () => {
  for (const fields of [{email:'bad'}, {postcode:'123'}, {phone:'abc'}, {preferredDate:'2026-02-31'}, {preferredDate:'2026-13-01'}])
    expect(parseBooking({...customer,...fields}).ok).toBe(false);
  expect(parseBooking({...customer,preferredDate:bookingDateBounds().min}).ok).toBe(true);
});

test('HTTP parser accepts only JSON objects', async () => {
  const request = (value: string) => new Request('https://example.com', {method:'POST',body:value,headers:{'content-type':'application/json'}});
  for (const value of ['[]','null','false','"text"','not json']) {
    const result = await readJson(request(value));
    expect(result instanceof Response && result.status).toBe(400);
  }
  expect(await readJson(request('{"name":"Test"}'))).toEqual({name:'Test'});
});

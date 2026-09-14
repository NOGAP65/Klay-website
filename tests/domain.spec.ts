import { test, expect } from '@playwright/test';
import { normaliseQuantity, parseOrderConfig, priceOrder, pricePerBlind } from '../shared-core/pricing';
import { isQuoteItems, quoteItemsSummary } from '../shared-core/quoteItems';
import { parseBooking, bookingRow } from '../netlify/lib/booking';
import { readJson } from '../netlify/lib/http';

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
  const result = parseBooking({name:'Test', email:'test@example.com', price:1, amount:1});
  expect(result.ok && result.booking.priced.total).toBe(380);
});

test('basket configurations and every option survive validation and storage', () => {
  const items = [{name:'Forma 7 shelving', quantity:2, options:[{label:'Width',value:'1800 mm'}, {label:'Colour',value:'White'}]},
    {name:'Roller blinds',quantity:1,options:[{label:'Fabric',value:'Panorama 5% Graphite'}]}];
  expect(isQuoteItems(items)).toBe(true);
  const result = parseBooking({name:'Test Customer', email:'test@example.com',items,notes:'Please call first'});
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(bookingRow(result.booking).notes).toContain(quoteItemsSummary(items));
  expect(bookingRow(result.booking).notes).toContain('Please call first');
  for (const invalid of [[], null, [{...items[0],quantity:NaN}], [{...items[0],quantity:1.5}], [{...items[0],quantity:41}], Array(41).fill(items[0]), [{...items[0],options:[null]}]]) {
    expect(isQuoteItems(invalid)).toBe(false);
    expect(parseBooking({name:'Test',email:'test@example.com',items:invalid}).ok).toBe(false);
  }
});

test('customer validation rejects malformed dates, emails and phone numbers', () => {
  for (const fields of [{email:'bad'}, {postcode:'123'}, {phone:'abc'}, {preferredDate:'2026-02-31'}, {preferredDate:'2026-13-01'}])
    expect(parseBooking({name:'Test',email:'test@example.com',...fields}).ok).toBe(false);
  expect(parseBooking({name:'Test',email:'test@example.com',preferredDate:'2028-02-29'}).ok).toBe(true);
});

test('HTTP parser accepts only JSON objects', async () => {
  const request = (value: string) => new Request('https://example.com', {method:'POST',body:value});
  for (const value of ['[]','null','false','"text"','not json']) expect(await readJson(request(value))).toBeNull();
  expect(await readJson(request('{"name":"Test"}'))).toEqual({name:'Test'});
});

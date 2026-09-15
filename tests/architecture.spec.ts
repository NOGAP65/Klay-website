import { test, expect } from '@playwright/test';
import { AsyncLruCache } from '../src/shared/lib/asyncLruCache';
import { applyCheckoutEvent, type CheckoutPayment, type PaymentOrder, type PaymentRepository } from '../netlify/lib/paymentEvents';
import { fabricByName, fabricPalette, FABRIC_SAMPLES } from '../src/features/fabrics/library';
import { CATALOGUE } from '../src/features/catalogue/constants';
import { configuredLine, defaultSelection, fieldsFor, withChoice, type Selection } from '../src/features/catalogue/configOptions';
import { isQuoteItems } from '../shared-core/quoteItems';
import { visualiserQuoteItems } from '../src/features/visualiser/quoteConfiguration';
import { useVisualiserStore } from '../src/features/visualiser/useVisualiserStore';
import { quoteLink, quoteItemsFromLink } from '../src/features/booking/quoteLink';
import { persistedCartItems } from '../src/features/cart/store/persistedCart';

test('saved baskets reject malformed data while retaining valid configurations', () => {
  const line = {id:'line',name:'Roller Blinds',type:'blind',blindType:'blockout',fabricColour:'Essence Ice',hardwareColour:'White',windowSize:'small',operation:'manual',price:220,quantity:1,options:[{label:'Room',value:'Bedroom 2'}]};
  for (const invalid of [null, {}, {items:null}, {items:[null, {}, {...line,price:-1}, {...line,quantity:1.5}, {...line,quantity:41}, {...line,price:NaN}, {...line,options:[{label:5,value:null}]}]}]) {
    expect(persistedCartItems(invalid)).toEqual([]);
  }
  expect(persistedCartItems({items:[null,line],getTotal:'not a function'})).toEqual([line]);
});

test('decoded resources deduplicate, evict by recency/bytes and retry errors', async () => {
  const cache = new AsyncLruCache<number>(2, 10, value => value);
  let loads = 0;
  const load = async () => { loads++; return 4; };
  const first = cache.get('a',load);
  expect(cache.get('a',load)).toBe(first);
  await first;
  await cache.get('b',load);
  await cache.get('a',load);
  await cache.get('c',load);
  expect(loads).toBe(3);
  await cache.get('b',load);
  expect(loads).toBe(4);
  expect(cache.size).toBe(2);
  expect(cache.bytes).toBe(8);
  await cache.get('large',async()=>20);
  expect(cache.bytes).toBeLessThanOrEqual(10);
  await expect(cache.get('error',async()=>{throw Error('offline');})).rejects.toThrow('offline');
  expect(await cache.get('error',async()=>2)).toBe(2);
  let resolve!: (n:number)=>void;
  const pending=cache.get('old',()=>new Promise<number>(r=>{resolve=r;}));
  await Promise.resolve();
  cache.clear();
  resolve(8); await pending;
  expect(cache.bytes).toBe(0); expect(cache.size).toBe(0);
});

const session: CheckoutPayment = {id:'cs_test', payment_status:'paid', amount_total:38000, currency:'aud',
  client_reference_id:'order',payment_intent:'pi_test'};
const baseOrder: PaymentOrder = {id:'order',status:'pending_payment',stripe_session_id:'cs_test',amount_cents:38000,currency:'aud',
  name:'Test',email:'test@example.com',quantity:1,blind_type:'blockout',window_size:'medium'};
function fixture() {
  let order = {...baseOrder}; let notices = 0; let updates = 0;
  const repository: PaymentRepository = {
    find:async()=>({...order}),
    markPaid:async()=>{ if(order.status==='paid')return false; order={...order,status:'paid'};updates++;return true;},
    closePending:async(_id,status)=>{if(order.status==='pending_payment')order={...order,status};},
  };
  return {repository,notify:async()=>{notices++;},get state(){return {order,notices,updates};}};
}
test('payment events handle duplicates, concurrent deliveries and out-of-order closures',async()=>{
  const f=fixture();
  await Promise.all([1,2,3].map(()=>applyCheckoutEvent('checkout.session.completed',session,f.repository,f.notify)));
  await applyCheckoutEvent('checkout.session.expired',session,f.repository,f.notify);
  expect(f.state).toMatchObject({notices:1,updates:1,order:{status:'paid'}});
  const late=fixture();
  await applyCheckoutEvent('checkout.session.expired',session,late.repository,late.notify);
  await applyCheckoutEvent('checkout.session.async_payment_succeeded',session,late.repository,late.notify);
  expect(late.state).toMatchObject({notices:1,order:{status:'paid'}});
});
test('payment failures remain retryable; wrong amounts, currency and sessions never settle',async()=>{
  for(const patch of [{amount_total:1},{currency:'usd'},{id:'other'}]) {
    const f=fixture();
    await expect(applyCheckoutEvent('checkout.session.completed',{...session,...patch},f.repository,f.notify)).rejects.toThrow();
    expect(f.state.updates).toBe(0);expect(f.state.notices).toBe(0);
  }
  for(const method of ['find','markPaid','closePending'] as const){
    const f=fixture();f.repository[method]=async()=>{throw Error('database unavailable');};
    await expect(applyCheckoutEvent(method==='closePending'?'checkout.session.expired':'checkout.session.completed',session,f.repository,f.notify)).rejects.toThrow('database unavailable');
  }
  const f=fixture();
  await applyCheckoutEvent('checkout.session.completed',{...session,payment_status:'unpaid'},f.repository,f.notify);
  expect(f.state.updates).toBe(0);
});

test('fabric indexes match source data and keep stable palette references',()=>{
  for(const sample of FABRIC_SAMPLES.filter(s=>s.type!=='lightfilter'&&s.type!=='sheer')) expect(fabricByName(sample.name)).toBe(sample);
  for(const product of ['roller-blinds','venetian-blinds','honeycomb-blinds']) {
    const palette=fabricPalette(product);expect(palette.length).toBeGreaterThan(0);expect(fabricPalette(product)).toBe(palette);
    for(const sample of palette)expect(sample.product).toBe(product);
  }
});

for(const product of CATALOGUE) test(`catalogue dependent choices remain valid and survive quoting: ${product.id}`,()=>{
  const initial=defaultSelection(product);
  const seeds=[initial];
  // Every first-level choice plus every possible next choice. This exercises
  // ordered dependencies without multiplying independent options exponentially.
  for(const field of fieldsFor(product,initial))for(const choice of field.choices)seeds.push(withChoice(product,initial,field.id,choice.id));
  const check=(selection:Selection)=>{
    const fields=fieldsFor(product,selection);
    for(const field of fields)expect(field.choices.some(choice=>choice.id===selection[field.id]),`${product.id}:${field.id}=${selection[field.id]}`).toBe(true);
    const line=configuredLine(product,selection);
    expect(isQuoteItems([{name:line.name,quantity:1,options:line.options}])).toBe(true);
  };
  for(const seed of seeds){check(seed);for(const field of fieldsFor(product,seed))for(const choice of field.choices)check(withChoice(product,seed,field.id,choice.id));}
});

test('visualiser quotes preserve distinct windows and all product families through a refreshable link',()=>{
  const store=useVisualiserStore;
  store.setState(store.getInitialState(),true);
  store.getState().setWindowCount(2);
  store.getState().setActiveWindow(1);
  store.getState().setBlindType('sunscreen');
  for(const category of ['blind','curtain','wardrobe','shelving'] as const){
    store.getState().setProductCategory(category);
    const items=visualiserQuoteItems(store.getState());
    expect(isQuoteItems(items)).toBe(true);
    expect(quoteItemsFromLink(new URL(quoteLink(items),'https://example.com').searchParams.get('items'))).toEqual(items);
    if(category==='blind')expect(items[0].name).not.toBe(items[1].name);
    if(category==='curtain')expect(items.every(item=>item.name.includes('Curtains'))).toBe(true);
  }
  for(const invalid of ['null','[]','broken','x'.repeat(24001)])expect(quoteItemsFromLink(invalid)).toEqual([]);
  store.setState(store.getInitialState(),true);
});

import { test, expect } from '@playwright/test';

import { useCartStore } from '../src/features/cart/store/cartStore';
import { persistedCartItems } from '../src/features/cart/store/persistedCart';
import { visualiserCartItems } from '../src/features/visualiser/cartConfiguration';
import { useVisualiserStore } from '../src/features/visualiser/useVisualiserStore';

const line = { name: 'Roller Blinds', type: 'Roller Blind', blindType: 'blockout', fabricColour: 'Essence Ice',
  hardwareColour: 'White', windowSize: 'small' as const, operation: 'manual' as const, price: 220,
  options: [{ label: 'Location', value: 'Bedroom 2' }, { label: 'Fabric', value: 'Essence Ice' }] };

test.beforeEach(() => {
  useCartStore.getState().clearCart();
  useVisualiserStore.setState(useVisualiserStore.getInitialState(), true);
});
test.afterEach(() => { useVisualiserStore.setState(useVisualiserStore.getInitialState(), true); });

test('honeycomb follows per-window choices and carries its own types and unpriced configuration into cart', () => {
  useVisualiserStore.setState(useVisualiserStore.getInitialState(), true);
  const state = useVisualiserStore.getState;
  state().setProductCategory('honeycomb');
  state().setWindowCount(3);
  state().setHoneycombType('daynight');
  state().setFabricColour('Honeycomb Truffle');
  state().setOperation('motorised');
  state().setActiveWindow(2);
  state().setHoneycombType('blockout');
  state().setFabricColour('Honeycomb Regal Slate');
  const items = visualiserCartItems(state());
  expect(items[0]).toMatchObject({ name: 'Honeycomb Blinds', fabricColour: 'Honeycomb Truffle', priceOnMeasure: true, price: 0, operation: 'motorised' });
  expect(items[0].options).toContainEqual({ label: 'Fabric type', value: 'Day & Night' });
  expect(items[2].options).toContainEqual({ label: 'Fabric type', value: 'Blockout' });
  items.forEach(item => useCartStore.getState().addItem(item));
  expect(useCartStore.getState().items.map(item => item.quantity)).toEqual([2, 1]);
  expect(persistedCartItems({ items: useCartStore.getState().items })).toEqual(useCartStore.getState().items);
  state().setProductCategory('blind');
  expect(state().fabricColour).toBe('Essence Ice');
  expect(state().getCurrentPrice()).toBeGreaterThan(0);
  state().setProductCategory('honeycomb');
  expect(state().fabricColour.startsWith('Honeycomb ')).toBe(true);
});

test('adding a quantity is atomic, reports the real addition and respects the limit', () => {
  const cart = useCartStore.getState();
  expect(cart.addItem(line, 38)).toBe(38);
  expect(cart.addItem(line, 5)).toBe(2);
  expect(useCartStore.getState().items[0].quantity).toBe(40);
  expect(useCartStore.getState().feedback).toMatchObject({ kind: 'added', quantity: 2 });
  expect(cart.addItem(line)).toBe(0);
  expect(useCartStore.getState().feedback?.kind).toBe('limit');
  for (const invalid of [0, -1, NaN, Infinity]) expect(cart.addItem(line, invalid)).toBe(0);
  expect(useCartStore.getState().items[0].quantity).toBe(40);
});

test('undo restores the full configuration once and stale undo cannot override a newer action', () => {
  const cart = useCartStore.getState();
  cart.addItem(line, 3);
  const item = useCartStore.getState().items[0];
  cart.removeItem(item.id);
  const revision = useCartStore.getState().feedback!.revision;
  cart.undoRemoval(revision);
  cart.undoRemoval(revision);
  expect(useCartStore.getState().items).toEqual([item]);
  cart.removeItem(item.id);
  const oldRevision = useCartStore.getState().feedback!.revision;
  cart.addItem(line);
  cart.undoRemoval(oldRevision);
  expect(useCartStore.getState().items[0].quantity).toBe(1);
  cart.updateQuantity(item.id, 0);
  expect(useCartStore.getState().feedback?.kind).toBe('removed');
  cart.clearCart();
  cart.undoRemoval(useCartStore.getState().feedbackRevision);
  expect(useCartStore.getState().items).toEqual([]);
});

test('visualiser cart lines preserve curtain and joinery choices without inventing prices', () => {
  useVisualiserStore.setState(useVisualiserStore.getInitialState(), true);
  const state = useVisualiserStore.getState;
  const add = () => visualiserCartItems(state()).forEach(item => useCartStore.getState().addItem(item));
  state().setProductCategory('curtain');
  state().setCurtainSize('xl');
  state().setCurtainMount('ceiling');
  add();
  state().setCurtainMount('window');
  add();
  state().setProductCategory('wardrobe');
  add();
  state().setWardrobeKind('walk-in');
  for (const model of ['LS01', 'US01']) {
    state().setWardrobeModel(model);
    state().setWardrobeColour('Matt Natural Oak');
    add();
  }
  state().setProductCategory('shelving');
  add();
  const items = useCartStore.getState().items;
  expect(items).toHaveLength(6);
  expect(new Set(items.map(item => item.id)).size).toBe(6);
  expect(items.every(item => item.priceOnMeasure && item.price === 0)).toBe(true);
  expect(items[0].options).toEqual(expect.arrayContaining([{ label: 'Size', value: 'xl' }, { label: 'Mount', value: 'ceiling' }]));
  expect(items[1].options).toContainEqual({ label: 'Mount', value: 'window' });
  expect(items[4].name).toBe('Walk-in wardrobe — Forma 5');
  expect(items[4].options).toEqual(expect.arrayContaining([
    { label: 'Layout', value: 'U-shaped' }, { label: 'Footprint', value: '2400 × 2400 mm' },
    { label: 'Finish', value: 'Matt Natural Oak' },
  ]));
  expect(persistedCartItems({ items })).toEqual(items);
});

test('multiple visualiser windows merge matching blinds but retain distinct fabrics and prices', () => {
  useVisualiserStore.setState(useVisualiserStore.getInitialState(), true);
  const state = useVisualiserStore.getState;
  state().setWindowCount(3);
  state().setActiveWindow(2);
  state().setFabricColour('Essence Carbon');
  visualiserCartItems(state()).forEach(item => useCartStore.getState().addItem(item));
  const items = useCartStore.getState().items;
  expect(items).toHaveLength(2);
  expect(items.map(item => item.quantity)).toEqual([2, 1]);
  expect(items[1].fabricColour).toBe('Essence Carbon');
  expect(items.every(item => !item.priceOnMeasure)).toBe(true);
  expect(useCartStore.getState().getTotal()).toBe(state().getJobTotal());
  expect(persistedCartItems({ items })).toEqual(items);
});

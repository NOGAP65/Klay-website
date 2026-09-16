import { test, expect } from '@playwright/test';

import { useCartStore } from '../src/features/cart/store/cartStore';

const line = { name: 'Roller Blinds', type: 'Roller Blind', blindType: 'blockout', fabricColour: 'Essence Ice',
  hardwareColour: 'White', windowSize: 'small' as const, operation: 'manual' as const, price: 220,
  options: [{ label: 'Location', value: 'Bedroom 2' }, { label: 'Fabric', value: 'Essence Ice' }] };

test.beforeEach(() => { useCartStore.getState().clearCart(); });

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

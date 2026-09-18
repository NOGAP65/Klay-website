import { test, expect } from '@playwright/test';

import { MESH_COLOURS, SHUTTER_COLOURS } from '../src/features/fabrics';
import { visualiserCartItems } from '../src/features/visualiser/cartConfiguration';
import { shutterGeometry, zipGeometry } from '../src/features/visualiser/outdoorGeometry';
import { selectQuoteConfig } from '../src/features/visualiser/quoteConfiguration';
import { slattedPlane } from '../src/features/visualiser/slattedGeometry';
import { useVisualiserStore as store } from '../src/features/visualiser/useVisualiserStore';

import type { Point } from '../src/features/visualiser/homography';

test('shutter slats keep their pitch, retract into the box and seal at full drop', () => {
  const trace: Point[] = [[150, 120], [900, 240], [720, 800], [120, 900]];
  let previousCount = 0;
  for (const size of ['small', 'medium', 'large']) {
    const plane = slattedPlane(trace, size, [1000, 1000]);
    const full = shutterGeometry(plane, 1), half = shutterGeometry(plane, .5), open = shutterGeometry(plane, 0);
    expect(full.pitch * plane.heightMm).toBeCloseTo(42);
    expect(full.bottom + full.rail).toBeCloseTo(1);
    expect(open.slats).toHaveLength(0);
    expect(half.slats.length).toBeLessThan(full.slats.length);
    expect(half.slats[0] + half.pitch).toBeCloseTo(half.bottom);
    expect(full.slats.length).toBeGreaterThan(previousCount);
    previousCount = full.slats.length;
    for (const g of [open, half, full]) {
      expect(g.guide * plane.widthMm).toBeCloseTo(53);
      expect(plane.quad([-g.guide, -g.head, 1 + 2 * g.guide, g.head]).flat().every(Number.isFinite)).toBe(true);
    }
  }
});

test('zip mesh meets fixed side channels and the weight bar throughout travel', () => {
  const plane = slattedPlane([[0, 0], [900, 80], [850, 600], [40, 680]], 'medium', [1000, 800], 3600);
  for (const position of [0, .01, .5, 1]) {
    const g = zipGeometry(plane, position);
    expect(g.mesh[0]).toBe(g.guide);
    expect(g.mesh[0] + g.mesh[2]).toBeCloseTo(1 - g.guide);
    expect(g.mesh[1] + g.mesh[3]).toBeCloseTo(g.bottom);
    expect(g.head * plane.heightMm).toBeCloseTo(125);
    expect(g.bottom + g.rail).toBeLessThanOrEqual(1);
  }
  expect(zipGeometry(plane, 0).mesh[3]).toBe(0);
  expect(zipGeometry(plane, 1).bottom + zipGeometry(plane, 1).rail).toBeCloseTo(1);
});

test('outdoor palette, operation and hardware survive job and basket updates', () => {
  store.setState(store.getInitialState(), true);
  for (const category of ['roller-shutter', 'zip-screen'] as const) {
    store.getState().setProductCategory(category);
    for (const colour of category === 'roller-shutter' ? SHUTTER_COLOURS : MESH_COLOURS) {
      store.getState().setFabricColour(colour.name);
      store.getState().setOperation('motorised');
      expect(store.getState().getFabricColor()).toBe(colour.hex);
      expect(store.getState().getHardwareColor()).toBe(category === 'roller-shutter' ? colour.hex : '#333638');
      const item = visualiserCartItems(selectQuoteConfig(store.getState()))[0];
      expect(item.fabricColour).toBe(colour.name);
      expect(item.priceOnMeasure).toBe(true);
      expect(item.options).toContainEqual({ label: 'Operation', value: category === 'roller-shutter' ? 'Battery' : 'motorised' });
    }
  }
});

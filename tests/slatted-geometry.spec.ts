import assert from 'node:assert/strict';

import { test, expect } from '@playwright/test';

import { SLAT_COLOURS, VENETIAN_COLLECTIONS, fabricPalette, fabricByName } from '../src/features/fabrics';
import { visualiserCartItems } from '../src/features/visualiser/cartConfiguration';
import { selectQuoteConfig } from '../src/features/visualiser/quoteConfiguration';
import { slattedPlane, venetianSlats, plantationPanels, slatProfile } from '../src/features/visualiser/slattedGeometry';
import { surfaceGradient } from '../src/features/visualiser/slattedSurface';
import { useVisualiserStore as store } from '../src/features/visualiser/useVisualiserStore';

import type { Point } from '../src/features/visualiser/homography';

const traces: Point[][] = [
  [[80, 80], [600, 80], [600, 750], [80, 750]],
  [[150, 120], [900, 240], [720, 600], [120, 700]],
  [[90, 220], [400, 90], [460, 900], [60, 800]],
];
test.beforeEach(() => store.setState(store.getInitialState(), true));
const cases = traces.flatMap(trace => ['small', 'medium', 'large'].map(size => slattedPlane(trace, size)));

test('retired Venetian colours cannot re-enter the current configuration', () => {
  store.getState().setProductCategory('venetian');
  for (const colour of ['Basswood Walnut', 'Aluminium Frost']) {
    expect(fabricByName(colour)).toBeUndefined();
    store.getState().setFabricColour(colour);
    expect(store.getState().fabricColour).toBe('UltraSlat Coastal White');
  }
  expect(fabricPalette('venetian-blinds')).toHaveLength(5);
});

test('rigid Venetian slats keep their count and collect on the bottom rail throughout lift', () => {
  for (const plane of cases) {
    const lowered = venetianSlats(plane, { position: 1, tilt: 1 });
    let previousBottom = 0;
    for (let step = 0; step <= 100; step++) {
      const geometry = venetianSlats(plane, { position: step / 100, tilt: .82 });
      assert.equal(geometry.slats.length, lowered.slats.length);
      assert.ok(geometry.bottom >= previousBottom);
      assert.ok(geometry.bottom + geometry.rail <= 1.000001);
      assert.ok(geometry.slats.at(-1)!.centre < geometry.bottom);
      assert.ok(geometry.slats[0].centre > geometry.head);
      for (let i = 1; i < geometry.slats.length; i++) {
        const current = geometry.slats[i], previous = geometry.slats[i - 1];
        assert.ok(current.centre > previous.centre);
        assert.ok(current.angle <= previous.angle);
        assert.equal(current.widthMm, previous.widthMm);
      }
      previousBottom = geometry.bottom;
    }
    expect(lowered.bottom + lowered.rail).toBeCloseTo(1, 10);
  }
});

test('front frame remains exactly on every traced edge, with shading perpendicular to the slat', () => {
  for (const trace of traces) {
    const plane = slattedPlane(trace);
    plane.quad([0, 0, 1, 1]).forEach((point, i) => {
      expect(point[0]).toBeCloseTo(trace[i][0], 7);
      expect(point[1]).toBeCloseTo(trace[i][1], 7);
    });
    const quad = plane.quad([0, .4, 1, .02]);
    let coordinates: number[] = [];
    const ctx = { createLinearGradient: (...args: number[]) => {
      coordinates = args; return { addColorStop: () => {} };
    } } as unknown as CanvasRenderingContext2D;
    surfaceGradient(ctx, quad, [[0, '#dddddd'], [1, '#aaaaaa']]);
    const [x, y, endX, endY] = coordinates;
    const dx = quad[1][0] - quad[0][0], dy = quad[1][1] - quad[0][1];
    expect(dx * (endX - x) + dy * (endY - y)).toBeCloseTo(0, 7);
  }
});

test('shutter frames and blade pivots stay fixed while the rigid profiles rotate and close', () => {
  for (const plane of cases) {
    const opened = plantationPanels(plane, 0), closed = plantationPanels(plane, 1);
    expect(closed.panels.length).toBe(opened.panels.length);
    for (let p = 0; p < closed.panels.length; p++) {
      const open = opened.panels[p], shut = closed.panels[p];
      expect([shut.x, shut.width]).toEqual([open.x, open.width]);
      for (let s = 0; s < shut.sections.length; s++) {
        const section = shut.sections[s];
        expect(section.slats.map(slat => slat.centre)).toEqual(open.sections[s].slats.map(slat => slat.centre));
        let previousBottom = section.top;
        for (const slat of section.slats) {
          const profile = slatProfile(plane, slat);
          const top = Math.min(...profile.map(point => point.y)), bottom = Math.max(...profile.map(point => point.y));
          expect(top).toBeLessThanOrEqual(previousBottom);
          expect(profile.every(point => Number.isFinite(point.depth) && Number.isFinite(point.y))).toBe(true);
          previousBottom = bottom;
        }
        expect(previousBottom).toBeGreaterThanOrEqual(section.bottom);
      }
    }
  }
});

test('every slatted material and colour agrees with the shop, and independent windows retain their choices', () => {
  const state = () => store.getState();
  for (const category of ['venetian', 'plantation'] as const) {
    state().setProductCategory(category);
    const palette = category === 'plantation' ? SLAT_COLOURS : VENETIAN_COLLECTIONS.flatMap(material => fabricPalette('venetian-blinds', undefined, material));
    state().setWindowCount(3);
    state().setActiveWindow(1); state().setFabricColour(palette.at(-1)!.name);
    state().setActiveWindow(0);
    for (const colour of palette) {
      state().setFabricColour(colour.name);
      expect(state().getFabricColor().toLowerCase()).toBe(colour.hex.toLowerCase());
      const items = visualiserCartItems(selectQuoteConfig(state()));
      expect(items[0].fabricColour).toBe(colour.name);
      expect(items[2].fabricColour).toBe(colour.name);
      expect(items[1].fabricColour).toBe(palette.at(-1)!.name);
      expect(items.every(item => item.priceOnMeasure && item.price === 0)).toBe(true);
    }
    state().setWindowCount(1);
  }
});

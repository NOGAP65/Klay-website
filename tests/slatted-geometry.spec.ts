import assert from 'node:assert/strict';

import { test, expect } from '@playwright/test';

import { configuredLine, defaultSelection, fieldsFor } from '../src/features/catalogue/configOptions';
import { CATALOGUE } from '../src/features/catalogue/constants';
import { SLAT_COLOURS, VENETIAN_COLLECTIONS, fabricPalette, fabricByName } from '../src/features/fabrics';
import { visualiserCartItems } from '../src/features/visualiser/cartConfiguration';
import { plantationBladeLighting } from '../src/features/visualiser/plantationLighting';
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
test('plantation reconciles motorisation out of both window jobs and shop selections', () => {
  store.getState().setOperation('motorised');
  store.getState().setProductCategory('plantation');
  store.getState().setOperation('motorised');
  expect(store.getState().operation).toBe('manual');
  expect(store.getState().windows.every(window => window.operation === 'manual')).toBe(true);
  const product = CATALOGUE.find(item => item.id === 'plantation-shutters')!;
  expect(fieldsFor(product).some(field => field.id === 'operation')).toBe(false);
  expect(configuredLine(product, { ...defaultSelection(product), operation: 'motorised' }).operation).toBe('manual');
});
const cases = traces.flatMap(trace => ['small', 'medium', 'large'].map(size => slattedPlane(trace, size)));

test('depth matches a pinhole camera at opposite side angles and from above and below', () => {
  for (const yaw of [-.7, 0, .7]) for (const pitch of [-.25, 0, .25]) {
    const project = (x: number, y: number, depth: number): Point => {
      const dx = (x - .5) * 1800, dy = (y - .5) * 2000, dz = depth - 26;
      const px = Math.cos(yaw) * dx + Math.sin(yaw) * dz;
      const forward = Math.sin(yaw) * dx - Math.cos(yaw) * dz;
      const py = Math.cos(pitch) * dy - Math.sin(pitch) * forward;
      const pz = 4200 + Math.sin(pitch) * dy + Math.cos(pitch) * forward;
      return [500 + 900 * px / pz, 500 + 900 * py / pz];
    };
    const trace = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y]) => project(x, y, 26));
    const plane = slattedPlane(trace, 'medium', [1000, 1000]);
    expect(plane.heightMm).toBeCloseTo(2000, 6);
    for (const depth of [-30, 0, 26, 55]) for (const [x, y] of [[0, 0], [.25, .3], [.8, .75], [1, 1]]) {
      const expected = project(x, y, depth), actual = plane.project(x, y, depth);
      expect(actual[0]).toBeCloseTo(expected[0], 6);
      expect(actual[1]).toBeCloseTo(expected[1], 6);
    }
    // Side returns must swap when the viewing direction swaps, not simply
    // shear a front-on picture; a centred frontal camera has neither side.
    expect(plane.viewAt(.5, .5)[0]).toBeCloseTo(-Math.sin(yaw) * Math.cos(pitch), 6);
    if (yaw) expect(Math.abs(plane.project(.5, .5, -18)[0] - 500)).toBeGreaterThan(5);
  }
});

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

test('plantation sections stay elliptical and cast softer overlap shadows as they close', () => {
  const plane = slattedPlane([[100, 100], [900, 100], [900, 900], [100, 900]], 'medium', [1000, 1000]);
  const shadowDepth: number[] = [];
  for (const tilt of [0, .5, 1]) {
    const slats = plantationPanels(plane, tilt).panels[0].sections[0].slats;
    const slat = slats[3], profile = slatProfile(plane, slat, 48);
    const unblocked = plantationBladeLighting(plane, []);
    const occluded = plantationBladeLighting(plane, [slats[2], slats[4]]);
    const view = plane.viewAt(.25, slat.centre);
    for (const point of profile) {
      const y = (point.y - slat.centre) * plane.heightMm, z = point.depth - 14;
      const across = y * Math.sin(slat.angle) + z * Math.cos(slat.angle);
      const thickness = y * Math.cos(slat.angle) - z * Math.sin(slat.angle);
      expect((across / (slat.widthMm / 2)) ** 2 + (thickness / 7) ** 2).toBeCloseTo(1, 8);
      expect(Math.hypot(...point.normal)).toBeCloseTo(1, 8);
      expect(occluded(point, view).level).toBeGreaterThan(.49);
      expect(occluded(point, view).level).toBeLessThanOrEqual(unblocked(point, view).level);
    }
    shadowDepth.push(Math.max(...profile.map(point => unblocked(point, view).level - occluded(point, view).level)));
  }
  expect(shadowDepth[0], 'Fully separated horizontal blades have no neighbour shadow').toBeLessThan(.01);
  expect(shadowDepth[2], 'Closed overlaps must cast a visible contact shadow').toBeGreaterThan(.1);
});

test('taller shutters add rows, wider shutters add panels, and photographs do not resize the blade profile', () => {
  const layout = (size: string, widthMm: number, heightMm: number, pixels = 400) => {
    const h = pixels * heightMm / widthMm;
    const plane = slattedPlane([[100, 100], [100 + pixels, 100], [100 + pixels, 100 + h], [100, 100 + h]], size, [1600, 1600]);
    return plantationPanels(plane, .5);
  };
  const rows = (shutter: ReturnType<typeof plantationPanels>) => shutter.panels[0].sections.reduce((sum, section) => sum + section.slats.length, 0);
  const heights = [700, 1300, 1700, 2200, 2900];
  const shutters = heights.map(height => layout('medium', 1800, height));
  shutters.forEach((shutter, i) => {
    if (i) expect(rows(shutter)).toBeGreaterThan(rows(shutters[i - 1]));
    for (const panel of shutter.panels) for (const section of panel.sections) {
      for (const slat of section.slats) expect(slat.widthMm).toBe(89);
    }
    expect(rows(layout('medium', 1800, heights[i], 200))).toBe(rows(shutter));
    expect(rows(layout('medium', 1800, heights[i], 800))).toBe(rows(shutter));
  });
  const widths = [['small', 900], ['medium', 1800], ['large', 2700]] as const;
  widths.forEach(([size, width], i) => {
    const shutter = layout(size, width, 1500);
    expect(shutter.panels).toHaveLength(i + 1);
    expect(rows(shutter)).toBe(rows(layout('small', 900, 1500)));
  });
});

test('all plantation sizes retain 89 mm blades, 80 mm rails and 40 mm stiles', () => {
  for (const plane of cases) {
    const layout = plantationPanels(plane, .5);
    expect(layout.stile * plane.widthMm).toBeCloseTo(40, 8);
    expect(layout.rail * plane.heightMm).toBeCloseTo(80, 8);
    layout.panels.forEach((panel, i) => {
      const panelStart = i / layout.panels.length, panelEnd = (i + 1) / layout.panels.length;
      expect((panel.x - panelStart) * plane.widthMm).toBeCloseTo(40, 8);
      expect((panelEnd - panel.x - panel.width) * plane.widthMm).toBeCloseTo(40, 8);
      expect(panel.sections[0].top * plane.heightMm).toBeCloseTo(80, 8);
      expect((1 - panel.sections.at(-1)!.bottom) * plane.heightMm).toBeCloseTo(80, 8);
      for (const section of panel.sections) for (const slat of section.slats) expect(slat.widthMm).toBe(89);
    });
  }
});

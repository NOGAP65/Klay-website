import { test, expect } from '@playwright/test';

import { DEFAULT_SLIDING_DOOR, reconcileSlidingDoor, slidingMaterials, slidingMetals, slidingOpenings, slidingPanelMirrors } from '../src/features/joinery';
import { visualiserCartItems } from '../src/features/visualiser/cartConfiguration';
import { selectQuoteConfig } from '../src/features/visualiser/quoteConfiguration';
import { slidingDoorGeometry } from '../src/features/visualiser/slidingDoorGeometry';
import { useVisualiserStore as store } from '../src/features/visualiser/useVisualiserStore';

test.beforeEach(() => store.setState(store.getInitialState(), true));

test('all sold door configurations have continuous coverage, separate tracks and a fixed display height', () => {
  for (const style of ['framed', 'shaker'] as const) for (const panels of ['two', 'three'] as const) {
    for (const opening of slidingOpenings(style, panels)) for (const material of slidingMaterials(style)) {
      const config = reconcileSlidingDoor(DEFAULT_SLIDING_DOOR, { style, panels, opening: opening.id, material: material.name });
      const geometry = slidingDoorGeometry(config);
      expect(geometry.heightMm).toBe(2000);
      expect(geometry.panels.map(panel => panel.isMirror)).toEqual(slidingPanelMirrors(style, panels, material.name));
      expect(geometry.panels[0].x).toBe(0);
      const last = geometry.panels.at(-1)!;
      expect(last.x + last.width).toBeCloseTo(geometry.widthMm, 7);
      geometry.panels.forEach((panel, index) => {
        expect(panel.width - panel.stile * 2).toBeGreaterThan(100);
        if (index) {
          const previous = geometry.panels[index - 1];
          expect(previous.x + previous.width).toBeGreaterThan(panel.x);
          expect(Math.abs(previous.z - panel.z)).toBeGreaterThan(panel.thickness);
        }
      });
    }
  }
});

test('switching type reconciles dependent options and the cart retains the exact door specification', () => {
  expect(reconcileSlidingDoor(DEFAULT_SLIDING_DOOR, { style: 'framed' })).toBe(DEFAULT_SLIDING_DOOR);
  const state = () => store.getState();
  state().showSlidingDoors();
  state().setSlidingDoor({ style: 'shaker', panels: 'three', material: 'Mirror/Polar White', hardware: 'Polished Silver' });
  const door = state().slidingDoor;
  const item = visualiserCartItems(selectQuoteConfig(state()))[0];
  expect(item.name).toBe('Shaker Sliding Wardrobe Doors');
  expect(item.fabricColour).toBe('Mirror/Polar White');
  expect(item.hardwareColour).toBe('Polished Silver');
  expect(item.priceOnMeasure).toBe(true);
  expect(item.options).toContainEqual({ label: 'Doors', value: 'Three doors' });
  state().setSlidingDoor({ style: 'framed', material: '<script>', hardware: 'nope', opening: 'Infinity' });
  expect(slidingMaterials('framed').some(option => option.name === state().slidingDoor.material)).toBe(true);
  expect(slidingMetals('framed').some(option => option.name === state().slidingDoor.hardware)).toBe(true);
  expect(slidingOpenings('framed', 'three').some(option => option.id === state().slidingDoor.opening)).toBe(true);
  state().setWardrobeKind('walk-in');
  expect(state().wardrobeSliding).toBe(false);
  expect(visualiserCartItems(selectQuoteConfig(state()))[0].name).toContain('Walk-in wardrobe');
  state().showSlidingDoors();
  state().setSlidingDoor(door);
  expect(state().slidingDoor).toEqual(door);
});

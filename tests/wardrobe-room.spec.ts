import { test, expect } from '@playwright/test';
import * as THREE from 'three';

import { applyHomography, computeHomography, type Point } from '../src/features/visualiser/homography';
import { readRoomDimensions, wardrobeRoomFit, wardrobeRoomSize } from '../src/features/visualiser/wardrobeRoomFit';
import { wardrobeRoomCamera } from '../src/features/visualiser/wardrobeRoomProjection';

test('wardrobe fit uses measured width, height and depth, with no two-metre assumption', () => {
  const product = wardrobeRoomSize('SRSTDH02', 1800);
  expect(product).toEqual({ width: 1800, height: 2016, depth: 500 });
  expect(wardrobeRoomFit({ width: 1800, height: 2000, depth: 500 }, product)).toEqual({ fits: false, excess: [{ axis: 'height', mm: 16 }] });
  expect(wardrobeRoomFit({ width: 1500, height: 2400, depth: 450 }, product)).toEqual({ fits: false,
    excess: [{ axis: 'width', mm: 300 }, { axis: 'depth', mm: 50 }] });
  expect(wardrobeRoomFit(product, product).fits).toBe(true);
  for (const id of ['LS01', 'US01']) {
    const walkIn = wardrobeRoomSize(id, 1800);
    expect(walkIn).toEqual({ width: 2400, height: 2000, depth: 2400 });
    expect(wardrobeRoomFit({ width: 2400, height: 2400, depth: 2399 }, walkIn).fits).toBe(false);
  }
  for (const value of ['', '-1', '1e3', '2000.5', 'NaN', 'Infinity', '10001', '<script>']) {
    expect(readRoomDimensions({ width: value, height: '2400', depth: '600' })).toBeNull();
  }
  expect(readRoomDimensions({ width: '1800', height: '2400', depth: '600' })).toEqual({ width: 1800, height: 2400, depth: 600 });
});

test('wardrobe millimetre proportions survive angled, portrait, near and distant traces', () => {
  const room = { width: 2400, height: 2700, depth: 700 };
  const photo = { width: 1200, height: 900 };
  const traces: Point[][] = [
    [[100,100],[900,100],[900,800],[100,800]],
    [[300,250],[670,330],[610,650],[320,700]],
    [[400,350],[560,310],[580,550],[370,600]],
    [[140,40],[960,170],[1030,830],[40,690]],
  ];
  for (const corners of traces) {
    const camera = wardrobeRoomCamera(corners, room, photo);
    const inverse = computeHomography(corners, [[0,2700],[2400,2700],[2400,0],[0,0]]);
    for (const width of [1500,1800,2100,3000]) {
      const projected = new THREE.Vector3(width / 1000, 2.016, 0).project(camera);
      const pixel: Point = [(projected.x + 1) * photo.width / 2, (1 - projected.y) * photo.height / 2];
      const measured = applyHomography(inverse, pixel);
      expect(measured[0]).toBeCloseTo(width, 5);
      expect(measured[1]).toBeCloseTo(2016, 5);
    }
  }
});

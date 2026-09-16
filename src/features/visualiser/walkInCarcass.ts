import { WALK_IN_DEPTH_MM as D, WALK_IN_HEIGHT_MM as H, WALK_IN_FOOTPRINT_MM as W,
  BOARD_MM as B, MODULE_WIDTH_MM, type HardwareSpec } from '@/features/joinery';

import type { Box, Compartment } from './wardrobeCarcass';

type Bay = { width: number; fill: 'shelves' | 'drawers' | 'double-hang' | 'long-hang' };

/** A straight run in local coordinates: wall at z=0, shelf front at z=D. */
function run(bays: Bay[], hardware: HardwareSpec): Box[] {
  const boxes: Box[] = [];
  const width = bays.reduce((sum, bay) => sum + bay.width, 0);
  const board = (x: number, y: number, w: number, h: number) =>
    boxes.push({ x, y, z: 0, w, h, d: D, plain: true });
  board(0, H - B, width, B);
  board(0, 0, B, H - B);
  let x = B;
  bays.forEach((bay, index) => {
    const innerWidth = bay.width - B - (index === 0 ? B : 0);
    if (bay.fill === 'shelves') {
      for (let level = 0; level < 6; level++) board(x, 80 + level * 310, innerWidth, B);
    } else if (bay.fill === 'drawers') {
      drawerTower(boxes, x, innerWidth, hardware);
      for (const y of [960, 1300, 1640]) board(x, y, innerWidth, B);
    } else {
      const levels = bay.fill === 'double-hang' ? [950, H - 125] : [H - 125];
      for (const y of levels) boxes.push({ x, y, z: D * .5, w: innerWidth, h: 26, d: 26,
        metal: true, colour: hardware.rgb });
    }
    x += innerWidth;
    board(x, 0, B, H - B);
    x += B;
  });
  return boxes;
}

function drawerTower(boxes: Box[], x: number, width: number, hardware: HardwareSpec) {
  // Four drawer fronts with an 8mm reveal and one slim bar pull each.
  boxes.push({ x, y: 0, z: 0, w: width, h: B, d: D, plain: true });
  for (let row = 0; row < 4; row++) {
    const y = 24 + row * 232;
    boxes.push({ x: x + 3, y, z: D - B, w: width - 6, h: 224, d: B, plain: true });
    const pullWidth = Math.min(width * .46, 340);
    boxes.push({ x: x + (width - pullWidth) / 2, y: y + 105, z: D,
      w: pullWidth, h: 14, d: 10, metal: true, colour: hardware.rgb });
  }
}

/** Rotate each return into the room; corners meet without overlapping shelves.
 * The origin matches the existing viewer: floor at y=0, entrance at z=0. */
function placeRun(boxes: Box[], side: 'back' | 'left' | 'right'): Box[] {
  return boxes.map(box => {
    if (side === 'back') return { ...box, z: box.z - W };
    if (side === 'left') return { ...box, x: box.z, z: -box.x - box.w, w: box.d, d: box.w };
    return { ...box, x: W - box.z - box.d, z: -W + D + box.x, w: box.d, d: box.w };
  });
}

export function createWalkInCarcass(id: string, hardware: HardwareSpec): { boxes: Box[]; compartments: Compartment[] } {
  const tower = MODULE_WIDTH_MM;
  const hanging = W - D - tower;
  const boxes: Box[] = [];
  if (id === 'LS01') {
    boxes.push(...placeRun(run([
      { width: tower, fill: 'shelves' },
      { width: W - tower - 700, fill: 'double-hang' },
      { width: 700, fill: 'long-hang' },
    ], hardware), 'back'));
    boxes.push(...placeRun(run([
      { width: hanging, fill: 'double-hang' }, { width: tower, fill: 'drawers' },
    ], hardware), 'right'));
  } else {
    const end = (W - tower * 2) / 2;
    boxes.push(...placeRun(run([
      { width: end, fill: 'long-hang' }, { width: tower, fill: 'drawers' },
      { width: tower, fill: 'drawers' }, { width: end, fill: 'long-hang' },
    ], hardware), 'back'));
    boxes.push(...placeRun(run([
      { width: tower, fill: 'shelves' }, { width: hanging, fill: 'double-hang' },
    ], hardware), 'left'));
    boxes.push(...placeRun(run([
      { width: hanging, fill: 'double-hang' }, { width: tower, fill: 'shelves' },
    ], hardware), 'right'));
  }
  // A walk-in is a corner model, so it has no flat photograph compartments.
  return { boxes, compartments: [] };
}

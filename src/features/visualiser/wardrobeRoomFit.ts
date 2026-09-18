import { wardrobeModelById, wardrobeHeight, wardrobeDepth, WALK_IN_FOOTPRINT_MM } from '@/features/joinery';

export interface RoomDimensions { width: number; height: number; depth: number }
export type RoomMeasurements = Record<keyof RoomDimensions, string>;
export const ROOM_AXES = ['width', 'height', 'depth'] as const;

/** Dimensions are user measurements, never inferred from a photograph's pixels. */
export function readRoomDimensions(values: RoomMeasurements): RoomDimensions | null {
  if (ROOM_AXES.some(axis => !/^\d{3,5}$/.test(values[axis]))) return null;
  const dimensions = { width: Number(values.width), height: Number(values.height), depth: Number(values.depth) };
  return ROOM_AXES.every(axis => dimensions[axis] >= 100 && dimensions[axis] <= 10000)
    && dimensions.height >= 500 && dimensions.height <= 5000 ? dimensions : null;
}

export function wardrobeRoomSize(modelId: string, width: number): RoomDimensions {
  const model = wardrobeModelById(modelId);
  return { width: model.kind === 'walk-in' ? WALK_IN_FOOTPRINT_MM : width,
    height: wardrobeHeight(model), depth: model.kind === 'walk-in' ? WALK_IN_FOOTPRINT_MM : wardrobeDepth(model) };
}

export function wardrobeRoomFit(room: RoomDimensions, product: RoomDimensions) {
  const isValid = ROOM_AXES.every(axis => Number.isFinite(room[axis] + product[axis]) && room[axis] > 0 && product[axis] > 0);
  const excess = ROOM_AXES.filter(axis => product[axis] > room[axis])
    .map(axis => ({ axis, mm: Math.ceil(product[axis] - room[axis]) }));
  return { fits: isValid && excess.length === 0, excess };
}

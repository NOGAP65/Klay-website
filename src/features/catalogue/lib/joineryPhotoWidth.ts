import { BOARD_MM, columnsFor, sidePanelsFor } from '@/features/visualiser';

interface PhotoColumn {
  /** Photographed boundary at the centre of a shared divider. */
  end: number;
  leftReturn?: number;
  rightReturn?: number;
  posts?: { start: number; end: number }[];
}

export interface JoineryPhotoWidth {
  modelId: string;
  start: number;
  top: number;
  bottom: number;
  columns: PhotoColumn[];
}

export interface WidthSlice {
  sourceX: number; sourceWidth: number;
  x: number; width: number; scaleX: number; translateX: number;
}

export const JOINERY_HEIGHT_MM = 2000;
const FRAME_WIDTH = 1280;
const HEIGHT_PX = 640;
const PIXELS_PER_MM = HEIGHT_PX / JOINERY_HEIGHT_MM;

/** Share the visualizer's openings and 18mm dividers. Camera scale, floor
 * and 2m height stay fixed; only the horizontal spans change. */
export function joineryWidthSlices(photo: JoineryPhotoWidth, widthMm: number) {
  const columns = columnsFor(photo.modelId, widthMm);
  const sides = sidePanelsFor(photo.modelId);
  const scaleY = HEIGHT_PX / (photo.bottom - photo.top);
  const cabinetWidth = widthMm * PIXELS_PER_MM;
  const margin = (FRAME_WIDTH - cabinetWidth) / 2;
  const slices: WidthSlice[] = [];
  const add = (sourceX: number, sourceEnd: number, x: number, end: number) => {
    const sourceWidth = sourceEnd - sourceX;
    const width = end - x;
    const scaleX = width / sourceWidth;
    slices.push({ sourceX, sourceWidth, x, width, scaleX, translateX: x - sourceX * scaleX });
  };
  add(0, photo.start, 0, margin);
  let sourceStart = photo.start;
  let innerStart = sides.left ? BOARD_MM : 0;
  let start = margin;
  photo.columns.forEach((crop, index) => {
    const column = columns[index];
    const innerEnd = innerStart + column.widthMm;
    const end = index === columns.length - 1 ? margin + cabinetWidth
      : margin + (innerEnd + BOARD_MM / 2) * PIXELS_PER_MM;
    const left = (crop.leftReturn ?? 0) * scaleY;
    const right = (crop.rightReturn ?? 0) * scaleY;
    if (left) add(sourceStart, sourceStart + crop.leftReturn!, start, start + left);
    let sourceX = sourceStart + (crop.leftReturn ?? 0);
    let x = start + left;
    const posts = crop.posts ?? [];
    posts.forEach((post, postIndex) => {
      // Front supports sit in the first shelf run, exactly as buildCarcass.
      const centre = margin + (innerStart + column.widthMm * (postIndex + 1) / (posts.length + 1)) * PIXELS_PER_MM;
      const half = BOARD_MM * PIXELS_PER_MM / 2;
      add(sourceX, post.start, x, centre - half);
      add(post.start, post.end, centre - half, centre + half);
      sourceX = post.end;
      x = centre + half;
    });
    add(sourceX, crop.end - (crop.rightReturn ?? 0), x, end - right);
    if (right) add(crop.end - crop.rightReturn!, crop.end, end - right, end);
    sourceStart = crop.end;
    innerStart = innerEnd + BOARD_MM;
    start = end;
  });
  add(sourceStart, 1024, margin + cabinetWidth, FRAME_WIDTH);
  return { slices, width: FRAME_WIDTH, height: 1024, scaleY,
    cabinetWidth, cabinetHeight: HEIGHT_PX, rows: [
      { sourceY: 0, sourceHeight: photo.top, y: 0, height: 180 },
      { sourceY: photo.top, sourceHeight: photo.bottom - photo.top, y: 180, height: HEIGHT_PX },
      { sourceY: photo.bottom, sourceHeight: 1024 - photo.bottom, y: 820, height: 204 },
    ] };
}

/** Undo horizontal photo warping so wood grain keeps its physical scale. */
export function grainTransform(grain: string, scaleX = 1, translateX = 0): string {
  if (grain === 'vertical') return `matrix(${1 / scaleX} 0 0 1 ${-translateX / scaleX} 0)`;
  const depth = grain === 'surface' ? 0.18 : 1;
  return `matrix(0 ${depth} ${-1 / scaleX} 0 ${(1024 - translateX) / scaleX} 0)`;
}

import { slidingOpening, slidingPanelMirrors, type SlidingDoorStyle } from './slidingDoors';

export interface PhotoRect { x: number; y: number; w: number; h: number }
export interface PhotoSlice { source: PhotoRect; target: PhotoRect }
export const SLIDING_PHOTO_GEOMETRY = {
  framed: {
    frame: { x: 154, y: 56, w: 718, h: 777 },
    panel: { x: 168, y: 77, w: 347, h: 746 },
    face: { x: 181, y: 82, w: 323, h: 726 },
    guardX: 16, guardY: 17,
    metal: 'M166 60H859V78H166Z M168 77H181V823H168Z M504 77H516V823H504Z M181 808H504V823H181Z M844 77H858V823H844Z',
  },
  shaker: {
    frame: { x: 123, y: 33, w: 777, h: 831 },
    panel: { x: 137, y: 59, w: 372, h: 793 },
    face: { x: 138, y: 61, w: 369, h: 789 },
    guardX: 55, guardY: 61,
    metal: 'M134 43H890V58H134Z M137 850H889V858H137Z M496 483H503V538H496Z',
  },
};

/** Nine-slice the real joinery so rails and stiles retain their physical width. */
export function photoGrid(source: PhotoRect, target: PhotoRect, sourceEdges: [number, number], targetEdges: [number, number]): PhotoSlice[] {
  const [sx, sy] = sourceEdges, [tx, ty] = targetEdges;
  const xs = [source.x, source.x + sx, source.x + source.w - sx, source.x + source.w];
  const ys = [source.y, source.y + sy, source.y + source.h - sy, source.y + source.h];
  const xt = [target.x, target.x + tx, target.x + target.w - tx, target.x + target.w];
  const yt = [target.y, target.y + ty, target.y + target.h - ty, target.y + target.h];
  return Array.from({ length: 9 }, (_, i) => {
    const x = i % 3, y = Math.floor(i / 3);
    return { source: { x: xs[x], y: ys[y], w: xs[x + 1] - xs[x], h: ys[y + 1] - ys[y] },
      target: { x: xt[x], y: yt[y], w: xt[x + 1] - xt[x], h: yt[y + 1] - yt[y] } };
  });
}

export function slidingDoorPhotoPlan(style: SlidingDoorStyle, panels?: string, dimension?: string, material?: string) {
  const opening = slidingOpening(style, panels, dimension);
  const width = (opening.minWidth + opening.maxWidth) / 2;
  // A fixed camera and 2m display height: width must never zoom the whole product.
  const height = 2000;
  const viewportWidth = 1280;
  const scale = 0.32;
  const frame = { x: (viewportWidth - width * scale) / 2, y: 180, w: width * scale, h: height * scale };
  const source = SLIDING_PHOTO_GEOMETRY[style];
  const sourceFrame = source.frame;
  const verticalScale = frame.h / sourceFrame.h;
  const insetX = (source.panel.x - sourceFrame.x) * verticalScale;
  const insetY = (source.panel.y - sourceFrame.y) * verticalScale;
  const bottomInset = (sourceFrame.y + sourceFrame.h - source.panel.y - source.panel.h) * verticalScale;
  const mirrors = slidingPanelMirrors(style, panels, material);
  const panelWidth = (frame.w - 2 * insetX) / mirrors.length;
  const doors = mirrors.map((mirror, index) => {
    const rect = { x: frame.x + insetX + index * panelWidth, y: frame.y + insetY,
      w: panelWidth, h: frame.h - insetY - bottomInset };
    return { mirror, rect, slices: photoGrid(source.panel, rect,
      [source.guardX, source.guardY], [source.guardX * verticalScale, source.guardY * verticalScale]) };
  });
  const xs = [0, sourceFrame.x, sourceFrame.x + sourceFrame.w, 1024];
  const ys = [0, sourceFrame.y, sourceFrame.y + sourceFrame.h, 1024];
  const xt = [0, frame.x, frame.x + frame.w, viewportWidth];
  const yt = [0, frame.y, frame.y + frame.h, 1024];
  const room = Array.from({ length: 9 }, (_, i) => {
    const x = i % 3, y = Math.floor(i / 3);
    return { source: { x: xs[x], y: ys[y], w: xs[x + 1] - xs[x], h: ys[y + 1] - ys[y] },
      target: { x: xt[x], y: yt[y], w: xt[x + 1] - xt[x], h: yt[y + 1] - yt[y] } };
  });
  return { opening, width, height, viewportWidth, frame, doors, room, source, scale, verticalScale };
}

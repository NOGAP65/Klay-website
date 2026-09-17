import type { Point } from './homography';

export type Vector3 = [number, number, number];
export const dot3 = (a: Vector3, b: Vector3) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const length3 = (v: Vector3) => Math.hypot(...v);
const unit = (v: Vector3): Vector3 => v.map(n => n / Math.max(.000001, length3(v))) as Vector3;
const cross = (a: Vector3, b: Vector3): Vector3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Extend the exact traced homography into depth using a pinhole camera. A
 * photo has no calibrated lens data, so use a conservative focal estimate.
 * Unlike a screen-space offset, the normal vanishing point accounts for both
 * side views and views from above/below, including camera roll. */
export function slattedCamera(h: number[], corners: Point[], widthMm: number, photoSize?: Point) {
  const centre = corners.reduce((p, c) => [p[0] + c[0] / 4, p[1] + c[1] / 4] as Point, [0, 0] as Point);
  const cx = photoSize ? photoSize[0] / 2 : centre[0], cy = photoSize ? photoSize[1] / 2 : centre[1];
  const span = Math.max(...corners.map(p => Math.hypot(p[0] - centre[0], p[1] - centre[1]))) * 2;
  const focal = Math.max(1, photoSize ? Math.max(...photoSize) * .9 : span * 1.4);
  const column = (i: number): Vector3 => [(h[i] - cx * h[i + 6]) / focal, (h[i + 3] - cy * h[i + 6]) / focal, h[i + 6]];
  const horizontal = column(0), vertical = column(1), origin = column(2), xAxis = unit(horizontal), yAxis = unit(vertical);
  // x points right, y down, and positive depth points out of the window.
  const zAxis = unit(cross(yAxis, xAxis));
  const scale = length3(horizontal) / widthMm;
  const depthColumn = [(focal * zAxis[0] + cx * zAxis[2]) * scale,
    (focal * zAxis[1] + cy * zAxis[2]) * scale, zAxis[2] * scale];
  const viewAt = (x: number, y: number): Vector3 => {
    const ray = unit([-(horizontal[0] * x + vertical[0] * y + origin[0]),
      -(horizontal[1] * x + vertical[1] * y + origin[1]), -(h[6] * x + h[7] * y + 1)]);
    return unit([dot3(ray, xAxis), dot3(ray, yAxis), dot3(ray, zAxis)]);
  };
  const project = (x: number, y: number, depth = 26): Point => {
    const inset = depth - 26;
    const denominator = h[6] * x + h[7] * y + 1 + depthColumn[2] * inset;
    return [(h[0] * x + h[1] * y + h[2] + depthColumn[0] * inset) / denominator,
      (h[3] * x + h[4] * y + h[5] + depthColumn[1] * inset) / denominator];
  };
  // Broad room-side illumination, converted to the actual surface axes.
  const light = unit([-.3, -.5, -1]);
  const localLight = unit([dot3(light, xAxis), dot3(light, yAxis), dot3(light, zAxis)]);
  return { project, viewAt, light: localLight, heightMm: widthMm * length3(vertical) / length3(horizontal) };
}

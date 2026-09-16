import type { Point } from './homography';

/** A perspective opening must be a clockwise, convex, non-collapsed quad inside the photo. */
export function isValidTrace(corners: Point[], width: number, height: number): boolean {
  if (corners.length !== 4 || corners.some(([x, y]) => !Number.isFinite(x + y) || x < 0 || y < 0 || x > width || y > height)) return false;
  return corners.every(([x, y], i) => {
    const [nx, ny] = corners[(i + 1) % 4];
    const [tx, ty] = corners[(i + 2) % 4];
    return Math.hypot(nx - x, ny - y) >= 2 && (nx - x) * (ty - ny) - (ny - y) * (tx - nx) > 1;
  });
}

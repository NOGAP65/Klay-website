import { computeHomography, windowDepthProjection, type Point } from './homography';

/** Recover the opening's metric aspect before giving cloth a depth. A rotated
 * photo's axis-aligned bounding box is not the curtain's physical rectangle. */
export function curtainPlane(quad: Point[], width: number, height: number, focalHint = Math.max(width,height)*0.8) {
  const unit = computeHomography([[0, 1], [1, 1], [1, 0], [0, 0]], quad);
  const { focal } = windowDepthProjection(unit, width, height, focalHint);
  const axisLength = (column: number) => Math.hypot(
    (unit[column] - width * 0.5 * unit[column + 6]) / focal,
    (unit[column + 3] - height * 0.5 * unit[column + 6]) / focal,
    unit[column + 6],
  );
  const across = (Math.hypot(quad[1][0] - quad[0][0], quad[1][1] - quad[0][1])
    + Math.hypot(quad[2][0] - quad[3][0], quad[2][1] - quad[3][1])) / 2;
  const drop = across * axisLength(1) / axisLength(0);
  const cx = width / 2, cy = height / 2;
  const left = cx - across / 2, right = cx + across / 2;
  const top = cy + drop / 2, bottom = cy - drop / 2;
  const raw = computeHomography([[left, top], [right, top], [right, bottom], [left, bottom]], quad);
  const centreW = raw[6] * cx + raw[7] * cy + raw[8];
  const homography = raw.map(value => value / centreW);
  return { left, right, top, bottom, width: across, homography,
    projection: windowDepthProjection(homography, width, height, focalHint) };
}

/** An inextensible hanging strip rises slightly when it bows sideways. Its
 * vertical drop is determined by gravity and cloth length, never by z shading. */
export function hangingDrop(segmentLength: number, dx: number, dz: number): number {
  return Math.sqrt(Math.max(segmentLength * segmentLength * 0.01,
    segmentLength * segmentLength - dx * dx - dz * dz));
}

/** One full front/return wave spans two 80 mm carriers. Scale comes from the
 * measured drop and rectified aspect, never from the photo's framing. */
export function curtainScale(width: number, height: number, dropMm = 2400) {
  const drop = Math.max(400, Math.min(4500, Number.isFinite(dropMm) ? dropMm : 2400));
  const widthMm = width / height * drop;
  return { dropMm: drop, widthMm, waves: Math.max(2, Math.min(28, Math.round(widthMm / 320))) };
}

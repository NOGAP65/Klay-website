import { radius, shadow, space, tokens } from '@/ds';

import type { Point } from './homography';

/** A crop of the original photo, never of the tinted trace or rendered product.
 * The crosshair stays centred on the actual pin, including at photo edges. */
export function TraceMagnifier({ photoUrl, point, index, imageWidth, imageHeight, renderedWidth }: {
  photoUrl: string; point: Point; index: number; imageWidth: number;
  imageHeight: number; renderedWidth: number;
}) {
  const size = Math.min(112, renderedWidth * .38, renderedWidth * imageHeight / imageWidth * .4);
  const extent = size * imageWidth / Math.max(1, renderedWidth) / 3;
  const [x, y] = point;
  return <div data-trace-magnifier={index} aria-hidden="true" style={{
    position: 'absolute', pointerEvents: 'none', zIndex: 5,
    [x < imageWidth / 2 ? 'right' : 'left']: 8,
    [y < imageHeight / 2 ? 'bottom' : 'top']: 8,
    width: size, background: tokens.fillStrong, color: tokens.onDark,
    border: `2px solid ${tokens.accent}`, borderRadius: radius.md, overflow: 'hidden',
    boxShadow: shadow.restOnDark,
  }}>
    <svg width={size} height={size} viewBox={`${x - extent / 2} ${y - extent / 2} ${extent} ${extent}`}
      style={{ display: 'block', background: '#292929' }}>
      <image href={photoUrl} width={imageWidth} height={imageHeight} />
      <svg x={x - extent / 2} y={y - extent / 2} width={extent} height={extent} viewBox="0 0 100 100">
        {[['#111', 3], ['#fff', 1]].map(([stroke, width]) =>
          <path key={stroke} d="M50 30v15 M50 55v15 M30 50h15 M55 50h15"
            fill="none" stroke={String(stroke)} strokeWidth={Number(width)} />)}
      </svg>
    </svg>
    <div style={{ font: `11px ${tokens.body}`, textAlign: 'center', padding: `${space.xxs}px 0` }}>Corner {index + 1} · 3×</div>
  </div>;
}

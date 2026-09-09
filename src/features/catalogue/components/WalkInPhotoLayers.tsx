import { useId } from 'react';
import { photoColourCurves } from '../lib/photoColour';
import { WALK_IN_FOOTPRINT_MM, WALK_IN_HEIGHT_MM, WALK_IN_METAL, walkInLayout } from '../lib/walkInWardrobes';

export function WalkInPhotoLayers({ src, layoutId, hardware }: { src: string; layoutId: string; hardware: string }) {
  const id = `walkin-${useId().replace(/:/g, '')}`;
  const layout = walkInLayout(layoutId);
  const powderWhite = Array.from({ length: 256 }, (_, i) => {
    const value = i / 255;
    return value < 0.16 ? value * 1.8 : 0.288 + 0.69 * ((value - 0.16) / 0.84) ** 0.45;
  });
  const curves = hardware.toUpperCase() === '#F6F6F6'
    ? [powderWhite, powderWhite, powderWhite] : photoColourCurves(hardware, 'hardware');
  return <svg viewBox="0 0 1024 1024" role="img"
    aria-label={`${layout.name} — ${layout.shape} walk-in wardrobe, ${layout.drawers} drawers, ${WALK_IN_FOOTPRINT_MM} × ${WALK_IN_FOOTPRINT_MM}mm footprint, ${WALK_IN_HEIGHT_MM}mm high`}
    data-preview-layout={layout.id} data-preview-width={WALK_IN_FOOTPRINT_MM} data-preview-height={WALK_IN_HEIGHT_MM}
    style={{ width: '100%', height: '100%', display: 'block' }}>
    <defs>
      <clipPath id={`${id}-metal`}><path d={WALK_IN_METAL[layout.id]} /></clipPath>
      <filter id={`${id}-colour`} colorInterpolationFilters="sRGB"><feComponentTransfer>
        <feFuncR type="table" tableValues={curves[0].join(' ')} />
        <feFuncG type="table" tableValues={curves[1].join(' ')} />
        <feFuncB type="table" tableValues={curves[2].join(' ')} />
      </feComponentTransfer></filter>
    </defs>
    <image href={src} width="1024" height="1024" />
    <g clipPath={`url(#${id}-metal)`} filter={`url(#${id}-colour)`}>
      <image href={src} width="1024" height="1024" />
    </g>
  </svg>;
}

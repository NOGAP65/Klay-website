import { useId } from 'react';

import { SCREEN_HEIGHT_MM, SCREEN_WIDTHS } from '@/features/catalogue/constants';
import { photoColourCurves } from '@/features/catalogue/lib/photoColour';
import { showerPhotoWidth, type ShowerPhoto } from '@/features/catalogue/lib/showerPhotoWidth';
import { useMediaQuery } from '@/shared';

import { usePhotoTransition } from './usePhotoTransition';

interface Props { src: string; photo: ShowerPhoto; hardware: string; width?: string }

/** The glass and its reflections come from the generated product photograph.
 * A matching empty bathroom lets a narrower panel reveal the original room,
 * without stretching grout lines, the shower head, or the metal fittings. */
export function ShowerPhotoLayers({ src, photo, hardware, width }: Props) {
  const id = `shower-${useId().replace(/:/g, '')}`;
  const isReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const frame = usePhotoTransition({ colour: hardware, hardware }, isReduced);
  const curves = photoColourCurves(frame.hardware, 'hardware');
  const widthMm = SCREEN_WIDTHS.includes(Number(width)) ? Number(width) : SCREEN_WIDTHS[0];
  const panel = showerPhotoWidth(photo, widthMm);
  const shot = <image href={src} width="1024" height="1024" />;
  const mounting = photo.mounting === 'clip' ? 'Clip fixed' : 'Channel fixed';
  return <svg role="img" aria-label={`${mounting} shower screen — ${SCREEN_HEIGHT_MM} × ${widthMm}mm`}
    viewBox="0 0 1024 1024" data-preview-width={widthMm} data-preview-height={SCREEN_HEIGHT_MM}
    data-preview-mounting={photo.mounting} style={{ display: 'block', width: '100%', height: '100%' }}>
    <defs>
      <filter id={`${id}-finish`} colorInterpolationFilters="sRGB"><feComponentTransfer>
        <feFuncR type="table" tableValues={curves[0].join(' ')} />
        <feFuncG type="table" tableValues={curves[1].join(' ')} />
        <feFuncB type="table" tableValues={curves[2].join(' ')} />
      </feComponentTransfer></filter>
      <mask id={`${id}-glass`} maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
        <rect x={panel.left - 2} y={panel.top - 1} width={panel.width + 1} height={panel.height + 3} fill="white" />
        {photo.fittings.map((f, i) => <path key={i} d={f.footprint} fill="black" />)}
      </mask>
      <clipPath id={`${id}-free-edge`}>
        <rect x={photo.right - 1} y={photo.top - 1} width="3" height={panel.height + 3} />
      </clipPath>
      <clipPath id={`${id}-channel`}><path d={photo.channel ?? ''} /></clipPath>
      <clipPath id={`${id}-panel-width`}>
        <rect x={panel.left - 8} y={panel.top - 2} width={panel.width + 8} height={panel.height + 10} />
      </clipPath>
      {photo.fittings.map((f, i) => <g key={i}>
        <clipPath id={`${id}-fitting-${i}`}><path d={f.footprint} /></clipPath>
        <clipPath id={`${id}-metal-${i}`}><path d={f.metal} /></clipPath>
      </g>)}
    </defs>
    <image href={photo.background} width="1024" height="1024" data-shower-background="" />
    <g mask={`url(#${id}-glass)`}>{shot}</g>
    <g transform={`translate(${panel.edgeOffset} 0)`} data-shower-free-edge="">
      <g clipPath={`url(#${id}-free-edge)`}>{shot}</g>
    </g>
    {photo.channel && <g clipPath={`url(#${id}-panel-width)`}>
      <g clipPath={`url(#${id}-channel)`} filter={`url(#${id}-finish)`}>{shot}</g>
    </g>}
    {photo.fittings.map((f, i) => <g key={i} data-shower-fitting={f.anchor}
      transform={`translate(${f.anchor === 'free' ? panel.edgeOffset : 0} 0)`}>
      <g clipPath={`url(#${id}-fitting-${i})`}>{shot}</g>
      <g clipPath={`url(#${id}-metal-${i})`} filter={`url(#${id}-finish)`}>{shot}</g>
    </g>)}
  </svg>;
}

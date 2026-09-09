import { useId } from 'react';
import { useMediaQuery } from '@/shared';
import { flyscreenConfiguration } from '../lib/pleatedFlyscreens';
import { FLYSCREEN_PHOTO, flyscreenColourCurves } from '../lib/flyscreenPhoto';
import { usePhotoTransition } from './usePhotoTransition';

/** Copy a real aluminium extrusion without stretching its profile or handle. */
function Profile({ artwork, source, x, mirror = false }: {
  artwork: string; source: { x: number; y: number; w: number; h: number }; x: number; mirror?: boolean;
}) {
  const id = `fly-profile-${useId().replace(/:/g, '')}`;
  return <g>
    <defs><clipPath id={id}><rect x={x} y={source.y} width={source.w} height={source.h} /></clipPath></defs>
    <g clipPath={`url(#${id})`}>
      <use href={`#${artwork}`} transform={`translate(${mirror ? x + source.w : x} 0) scale(${mirror ? -1 : 1} 1) translate(${-source.x} 0)`} />
    </g>
  </g>;
}

export function FlyscreenPhotoLayers({ src, configuration, hardware, hardwareName }: {
  src: string; configuration?: string; hardware: string; hardwareName?: string;
}) {
  const id = `flyscreen-${useId().replace(/:/g, '')}`;
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const frame = usePhotoTransition({ colour: '#FFFFFF', hardware }, reduced);
  const curves = flyscreenColourCurves(frame.hardware);
  const selected = flyscreenConfiguration(configuration);
  const double = selected.id === 'double';
  const { handle, closingBar, cassette, rightCassetteX, meetingX } = FLYSCREEN_PHOTO;
  const shot = <image href={src} width="1024" height="1024" />;
  return <svg viewBox="0 0 1024 1024" role="img"
    aria-label={`${selected.name} pleated flyscreen — ${hardwareName ?? 'Black'} frame, ${double ? 'two mesh leaves with centre closing handles' : 'one mesh leaf with a side closing handle'}`}
    data-preview-configuration={selected.id} data-preview-leaves={double ? 2 : 1}
    data-preview-hardware={hardwareName} style={{ width: '100%', height: '100%', display: 'block' }}>
    <defs>
      <mask id={`${id}-metal`} maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
        <path d={FLYSCREEN_PHOTO.metal} fill="white" />
        <rect x={handle.x} y={handle.y} width={handle.w} height={handle.h} rx="6" fill="black" />
      </mask>
      <filter id={`${id}-colour`} colorInterpolationFilters="sRGB">
        <feComponentTransfer>
          <feFuncR type="table" tableValues={curves[0].join(' ')} />
          <feFuncG type="table" tableValues={curves[1].join(' ')} />
          <feFuncB type="table" tableValues={curves[2].join(' ')} />
        </feComponentTransfer>
      </filter>
      <g id={`${id}-artwork`}>
        {shot}
        <g mask={`url(#${id}-metal)`}><g filter={`url(#${id}-colour)`}>{shot}</g></g>
      </g>
    </defs>
    <use href={`#${id}-artwork`} />
    {double && <g data-preview-meeting-handles="2">
      {/* The opposite cassette replaces the single leaf's original side handle. */}
      <Profile artwork={`${id}-artwork`} source={cassette} x={rightCassetteX} mirror />
      <Profile artwork={`${id}-artwork`} source={closingBar} x={meetingX - closingBar.w} />
      <Profile artwork={`${id}-artwork`} source={closingBar} x={meetingX} mirror />
      <path d={`M${meetingX} ${closingBar.y}v${closingBar.h}`} stroke="#242828" strokeWidth="1.2" />
    </g>}
  </svg>;
}

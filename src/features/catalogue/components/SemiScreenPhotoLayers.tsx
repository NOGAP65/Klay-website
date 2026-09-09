import { useId } from 'react';

import { photoColourCurves } from '@/features/catalogue/lib/photoColour';
import { semiScreenPlan, type SemiScreenPhoto, type ScreenSlice } from '@/features/catalogue/lib/semiScreenPhoto';
import { useMediaQuery } from '@/shared';

import { usePhotoTransition } from './usePhotoTransition';

interface Props { src: string; photo: SemiScreenPhoto; width?: string; hardware: string }

function Slices({ slices, id, children }: { slices: ScreenSlice[]; id: string; children: React.ReactNode }) {
  return <>{slices.map((s, i) => <g key={i}
    transform={`matrix(${s.scaleX} 0 0 ${s.scaleY} ${s.x} ${s.y})`}>
    <defs><clipPath id={`${id}-${i}`}><rect x={s.start} y="0" width={s.end - s.start + 0.15} height="1024" /></clipPath></defs>
    <g clipPath={`url(#${id}-${i})`}>{children}</g>
  </g>)}</>;
}

export function SemiScreenPhotoLayers({ src, photo, hardware, width }: Props) {
  const id = `semi-${useId().replace(/:/g, '')}`;
  const isReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const frame = usePhotoTransition({ colour: hardware, hardware }, isReduced);
  const curves = photoColourCurves(frame.hardware, 'hardware');
  const plan = semiScreenPlan(photo, Number(width));
  const isFront = photo.layout === 'front-only';
  const slices = [...plan.front, ...plan.returns];
  const dimensions = `${plan.height}mm high × ${plan.width}mm front${plan.depth ? ` × ${plan.depth}mm return` : ''}`;
  return <svg role="img" aria-label={`Semi-frameless ${isFront ? 'front only' : 'front and return'} showerscreen — ${dimensions}`}
    viewBox="0 0 1024 1024" data-preview-width={plan.width} data-preview-height={plan.height}
    data-preview-depth={plan.depth} data-preview-layout={photo.layout}
    style={{ display: 'block', width: '100%', height: '100%', isolation: 'isolate' }}>
    <defs>
      <filter id={`${id}-finish`} colorInterpolationFilters="sRGB"><feComponentTransfer>
        <feFuncR type="table" tableValues={curves[0].join(' ')} />
        <feFuncG type="table" tableValues={curves[1].join(' ')} />
        <feFuncB type="table" tableValues={curves[2].join(' ')} />
      </feComponentTransfer></filter>
      <clipPath id={`${id}-metal`}><path d={photo.metal} /></clipPath>
      <clipPath id={`${id}-rails`}><path d={photo.rails} /></clipPath>
      <clipPath id={`${id}-door`}><path d={photo.doorEdge} /></clipPath>
      <clipPath id={`${id}-glass`}>
        <path d="M161 124L703 92V904L161 854Z" />
        {!isFront && <path d="M726 95L852 159V823L726 901Z" />}
      </clipPath>
      <mask id={`${id}-reflection`} maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
        <rect width="1024" height="1024" fill="white" /><path d={`${photo.metal} ${photo.rails}`} fill="black" />
        <path d="M401 100h9v790h-9Z" fill="black" />
      </mask>
      <linearGradient id={`${id}-wall-fade`}><stop offset="0.7" stopColor="white" /><stop offset="1" stopColor="black" /></linearGradient>
      <mask id={`${id}-wall`} maskUnits="userSpaceOnUse" x={photo.right} y="0" width={1024 - photo.right} height="1024">
        <rect x={photo.right} width={1024 - photo.right} height="1024" fill={`url(#${id}-wall-fade)`} />
      </mask>
    </defs>
    <image href={photo.background} width="1024" height="1024" data-shower-background="" />
    {isFront && <g transform={`translate(${plan.offset} 0)`}>
      <image href={photo.background} width="1024" height="1024" mask={`url(#${id}-wall)`} />
    </g>}
    <g style={{ mixBlendMode: 'screen' }} opacity="0.5">
      <Slices slices={slices} id={`${id}-reflection-slice`}>
        <g clipPath={`url(#${id}-glass)`} mask={`url(#${id}-reflection)`}>
          <image href={photo.reflections} width="1024" height="1024" />
        </g>
      </Slices>
    </g>
    <g transform={`matrix(${plan.railScale} 0 0 1 ${145 * (1 - plan.railScale)} 0)`}>
      <g clipPath={`url(#${id}-rails)`} filter={`url(#${id}-finish)`}><image href={src} width="1024" height="1024" /></g>
    </g>
    <Slices slices={slices} id={`${id}-frame-slice`}>
      <g clipPath={`url(#${id}-metal)`} filter={`url(#${id}-finish)`}>
        <image href={src} width="1024" height="1024" />
      </g>
    </Slices>
    <g transform={`matrix(1 0 0 ${plan.doorScaleY} 0 ${plan.doorY})`}>
      <g clipPath={`url(#${id}-door)`}><image href={src} width="1024" height="1024" /></g>
    </g>
  </svg>;
}

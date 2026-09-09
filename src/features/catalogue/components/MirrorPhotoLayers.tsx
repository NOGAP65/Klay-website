import { useId } from 'react';

import { mirrorPlan } from '@/features/catalogue/lib/mirrorPhoto';
import { useMediaQuery } from '@/shared';

import { usePhotoTransition } from './usePhotoTransition';

interface Props { src: string; framed: boolean; shape?: string; dimension?: string; hardware: string }

export function MirrorPhotoLayers({ src, framed, shape, dimension, hardware }: Props) {
  const id = `mirror-${useId().replace(/:/g, '')}`;
  const isReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const frame = usePhotoTransition({ colour: hardware, hardware }, isReduced);
  const plan = mirrorPlan(framed, shape, dimension);
  const rim = framed ? 4.1 : 1.25;
  // Keep a little doorway at the far edge so small mirrors still read as glass.
  const reflectionX = Math.max(512 + plan.w * 0.4 - 707 * 2, plan.x + plan.w - 738 * 2);
  return <svg role="img" aria-label={`${plan.label} ${framed ? 'framed' : 'frameless'} mirror — ${plan.height}mm high × ${plan.width}mm wide`}
    viewBox="0 0 1024 1024" data-preview-width={plan.width} data-preview-height={plan.height}
    data-preview-shape={plan.shape} data-preview-framed={framed}
    style={{ display: 'block', width: '100%', height: '100%', isolation: 'isolate' }}>
    <defs>
      <clipPath id={`${id}-glass`}><path d={plan.path} /></clipPath>
      {/* One photograph supplies the room, wall grain and quiet reflected wall. */}
      <clipPath id={`${id}-room-wall`}><rect width="1024" height="704" /></clipPath>
      <linearGradient id={`${id}-across`}><stop stopColor="black" /><stop offset="1" stopColor="white" /></linearGradient>
      <linearGradient id={`${id}-down`} x2="0" y2="1">
        <stop offset="0.975" stopColor="white" /><stop offset="1" stopColor="black" />
      </linearGradient>
      <mask id={`${id}-mix`}><rect width="1024" height="704" fill={`url(#${id}-across)`} /></mask>
      <mask id={`${id}-wall`}><rect width="1024" height="704" fill={`url(#${id}-down)`} /></mask>
      <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx={framed ? 4 : 2} dy={framed ? 6 : 3} stdDeviation={framed ? 5 : 3} floodColor="#25241E" floodOpacity="0.3" />
      </filter>
      <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="0.9" y2="1">
        <stop stopColor="#F8FCF7" /><stop offset="0.28" stopColor="#727D78" />
        <stop offset="0.52" stopColor="#E4EAE3" /><stop offset="1" stopColor="#90968A" />
      </linearGradient>
      <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="0.85">
        <stop stopColor="white" stopOpacity="0.6" /><stop offset="0.32" stopColor="white" stopOpacity="0" />
        <stop offset="0.65" stopColor="black" stopOpacity="0.35" /><stop offset="1" stopColor="white" stopOpacity="0.35" />
      </linearGradient>
    </defs>
    <image href={src} width="1024" height="1024" />
    <g mask={`url(#${id}-wall)`} clipPath={`url(#${id}-room-wall)`}>
      <g transform="scale(4.451 1)"><image href={src} width="1024" height="1024" /></g>
      <g mask={`url(#${id}-mix)`}>
        <g transform="matrix(4.451 0 0 1 -3534.094 0)"><image href={src} width="1024" height="1024" /></g>
      </g>
    </g>
    <path d={plan.path} fill="#A4A59A" filter={`url(#${id}-shadow)`} />
    {/* Preserve photographic proportions while framing the quiet reflection. */}
    <g clipPath={`url(#${id}-glass)`}>
      <image href={src} x={reflectionX} y="-665" width="2048" height="2048" />
    </g>
    {framed && <path d={plan.path} transform="translate(1.5 1.8)" fill="none" stroke={frame.hardware} strokeWidth={rim + 1.6} />}
    <path d={plan.path} fill="none" stroke={framed ? frame.hardware : `url(#${id}-edge)`} strokeWidth={rim} />
    {framed && <path d={plan.path} fill="none" stroke={`url(#${id}-shine)`} strokeWidth={rim} />}
  </svg>;
}

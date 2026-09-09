import { useId } from 'react';

import { cabinetMirrorPlan, cabinetMirrorSize } from '@/features/catalogue/lib/cabinetMirror';

export function CabinetMirrorPhotoLayers({ src, shape }: { src: string; shape?: string }) {
  const id = `cabinet-mirror-${useId().replace(/:/g, '')}`;
  const plan = cabinetMirrorPlan(shape);
  const reflectionX = plan.left + plan.projectedWidth * 0.12 - 319 * 2.5;
  return <svg role="img" aria-label={`${plan.label} mirror with white cabinet, door open showing two shelves — ${cabinetMirrorSize(shape)}`}
    viewBox="0 0 1024 1024" data-preview-shape={plan.shape} data-preview-width={plan.width}
    data-preview-height={plan.height} data-preview-depth={plan.depth}
    style={{ display: 'block', width: '100%', height: '100%' }}>
    <defs>
      <clipPath id={`${id}-wall-clip`}><rect width="1024" height="653" /></clipPath>
      <clipPath id={`${id}-glass`}><path d={plan.path} /></clipPath>
      <clipPath id={`${id}-cabinet`}><path d="M463 173L696 157V590L463 586Z" /></clipPath>
      <clipPath id={`${id}-hinges`}>
        <path d="M465 213H493V258H465ZM465 504H493V550H465Z" />
      </clipPath>
      <linearGradient id={`${id}-across`}><stop stopColor="black" /><stop offset="1" stopColor="white" /></linearGradient>
      <linearGradient id={`${id}-down`} x2="0" y2="1">
        <stop offset="0.98" stopColor="white" /><stop offset="1" stopColor="black" />
      </linearGradient>
      <mask id={`${id}-wall`}><rect width="1024" height="653" fill={`url(#${id}-down)`} /></mask>
      <mask id={`${id}-mix`}><rect width="1024" height="653" fill={`url(#${id}-across)`} /></mask>
      <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="-10" dy="10" stdDeviation="12" floodColor="#24251D" floodOpacity="0.3" />
      </filter>
      <filter id={`${id}-cabinet-shadow`} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="-4" dy="6" stdDeviation="6" floodColor="#24251D" floodOpacity="0.22" />
      </filter>
      <linearGradient id={`${id}-edge`}>
        <stop stopColor="#676D62" /><stop offset="0.5" stopColor="#FCFDF8" /><stop offset="1" stopColor="#B8BBAF" />
      </linearGradient>
    </defs>
    <image href={src} width="1024" height="1024" />
    <g mask={`url(#${id}-wall)`} clipPath={`url(#${id}-wall-clip)`}>
      <g transform="scale(4.451 1)"><image href={src} width="1024" height="1024" /></g>
      <g mask={`url(#${id}-mix)`}>
        <g transform="matrix(4.451 0 0 1 -3534.094 0)"><image href={src} width="1024" height="1024" /></g>
      </g>
    </g>
    {/* The photographic cabinet and hinges share the door's physical scale. */}
    <g transform={plan.cabinetTransform} filter={`url(#${id}-cabinet-shadow)`}>
      <g clipPath={`url(#${id}-cabinet)`}><image href={src} width="1024" height="1024" /></g>
    </g>
    <path d={plan.path} transform={`translate(${plan.backingDepth} 0)`} fill="#F0F0E9" stroke="#CFD0C7" strokeWidth="1"
      filter={`url(#${id}-shadow)`} />
    <g transform={plan.cabinetTransform} clipPath={`url(#${id}-hinges)`}>
      <image href={src} width="1024" height="1024" />
    </g>
    <g clipPath={`url(#${id}-glass)`}>
      <image href={src} x={reflectionX} y="-720" width="2560" height="2560" />
    </g>
    <path d={plan.path} fill="none" stroke={`url(#${id}-edge)`} strokeWidth="1.5" />
  </svg>;
}

import { useId } from 'react';
import { WALK_IN_FOOTPRINT_MM, WALK_IN_HEIGHT_MM, walkInLayout, walkInFinish, walkInHardware } from '../lib/walkInWardrobes';
import { WALK_IN_BOARDS, WALK_IN_FOREGROUND, WALK_IN_HANDLES, WALK_IN_RAILS } from '../lib/walkInPhoto';

export function WalkInPhotoLayers({ src, layoutId, colourName, hardwareName }: {
  src: string; layoutId: string; colourName?: string; hardwareName?: string;
}) {
  const id = `walkin-${useId().replace(/:/g, '')}`;
  const layout = walkInLayout(layoutId);
  const finish = walkInFinish(colourName);
  const handle = walkInHardware(hardwareName);
  const handles = WALK_IN_HANDLES[layout.id];
  const shot = <image href={src} width="1024" height="1024" />;
  return <svg viewBox="0 0 1024 1024" role="img"
    aria-label={`${layout.name} — ${layout.shape} walk-in wardrobe, ${finish.name}, ${handle.name}, ${WALK_IN_FOOTPRINT_MM} × ${WALK_IN_FOOTPRINT_MM}mm footprint, ${WALK_IN_HEIGHT_MM}mm high`}
    data-preview-layout={layout.id} data-preview-width={WALK_IN_FOOTPRINT_MM} data-preview-height={WALK_IN_HEIGHT_MM}
    data-preview-material={finish.name} data-preview-hardware={handle.name}
    style={{ width: '100%', height: '100%', display: 'block' }}>
    <defs>
      <clipPath id={`${id}-boards`}><path d={WALK_IN_BOARDS[layout.id].map(f => f.path).join(' ')} /></clipPath>
      <clipPath id={`${id}-rails`}><path d={WALK_IN_RAILS[layout.id]} /></clipPath>
      <clipPath id={`${id}-foreground`}><path d={WALK_IN_FOREGROUND[layout.id]} /></clipPath>
      <filter id={`${id}-light`} colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="linear" slope="1.1" /><feFuncG type="linear" slope="1.1" /><feFuncB type="linear" slope="1.1" />
        </feComponentTransfer>
      </filter>
      <linearGradient id={`${id}-handle`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={handle.hex} /><stop offset=".15" stopColor={handle.hex} />
        <stop offset=".45" stopColor={handle.hex} /><stop offset="1" stopColor="#161511" />
      </linearGradient>
      <g id={`${id}-clean`}>
        {shot}
        {handles.map((h, i) => <svg key={i} x={h.x - 4} y={h.y - 3} width={h.w + 10} height={14 + h.w * h.slope}
          viewBox={`${h.x - 4} ${h.y - 23} ${h.w + 10} ${14 + h.w * h.slope}`}>
          {shot}
        </svg>)}
      </g>
      {['vertical', 'horizontal'].map(grain => <pattern key={grain} id={`${id}-${grain}`} width="260" height="700"
        patternUnits="userSpaceOnUse" patternTransform={grain === 'horizontal' ? 'rotate(90)' : undefined}>
        <image href={finish.texture} width="260" height="700" preserveAspectRatio="none" />
      </pattern>)}
    </defs>
    <use href={`#${id}-clean`} />
    {finish.name !== 'Matt Wardrobe White' && <g clipPath={`url(#${id}-boards)`} style={{ isolation: 'isolate' }}>
      {WALK_IN_BOARDS[layout.id].map((f, i) => <path key={i} d={f.path} fill={`url(#${id}-${f.grain})`} />)}
      <g filter={`url(#${id}-light)`} style={{ mixBlendMode: 'multiply' }}><use href={`#${id}-clean`} /></g>
    </g>}
    <g clipPath={`url(#${id}-rails)`}>{shot}</g>
    <g clipPath={`url(#${id}-foreground)`}>{shot}</g>
    {handles.map((h, i) => {
      const width = h.w;
      return <g key={i} transform={`matrix(1 ${h.slope} 0 1 ${h.x} ${h.y})`}>
        <rect x="1" y="3" width={width} height="6" rx="1" fill="#302922" opacity=".25" />
        <path d={`M0 0H${width}V5L${width - 2} 7H1Z`} fill={`url(#${id}-handle)`} />
        <path d={`M1 .5H${width - 1}`} fill="none" stroke="#FFFFFF" strokeOpacity=".42" strokeWidth=".8" />
      </g>;
    })}
  </svg>;
}

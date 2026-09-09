import { useId } from 'react';
import { useMediaQuery } from '@/shared';
import { photoColourCurves } from '../lib/photoColour';
import { slidingDoorPhotoPlan, type PhotoRect, type PhotoSlice } from '../lib/slidingDoorPhoto';
import { slidingMaterial, slidingMaterials, type SlidingDoorStyle } from '../lib/slidingDoors';
import { usePhotoTransition } from './usePhotoTransition';

const rectPath = (r: PhotoRect) => `M${r.x} ${r.y}h${r.w}v${r.h}h${-r.w}Z`;
function Slice({ slice, artwork }: { slice: PhotoSlice; artwork: string }) {
  const clip = `slice-${useId().replace(/:/g, '')}`;
  const { source: s, target: t } = slice;
  return <g>
    <defs><clipPath id={clip}><rect x={t.x} y={t.y} width={t.w + 1} height={t.h + 1} shapeRendering="crispEdges" /></clipPath></defs>
    <g clipPath={`url(#${clip})`}>
      <use href={`#${artwork}`} transform={`translate(${t.x} ${t.y}) scale(${t.w / s.w} ${t.h / s.h}) translate(${-s.x} ${-s.y})`} />
    </g>
  </g>;
}

export function SlidingDoorPhotoLayers({ src, style, panels, dimension, materialName, hardware }: {
  src: string; style: SlidingDoorStyle; panels?: string; dimension?: string; materialName?: string; hardware: string;
}) {
  const id = `sliding-${useId().replace(/:/g, '')}`;
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const plan = slidingDoorPhotoPlan(style, panels, dimension, materialName);
  const material = slidingMaterial(style, materialName);
  const metal = usePhotoTransition({ colour: '#FFFFFF', hardware }, reduced);
  // White powder coat diffuses the silver base shot's reflections while retaining track grooves.
  const whiteCoat = Array.from({ length: 256 }, (_, i) => {
    const v = i / 255;
    return v < 0.16 ? v * 1.8 : 0.288 + 0.7 * ((v - 0.16) / 0.84) ** 0.45;
  });
  const curves = metal.hardware.toUpperCase() === '#FDFDFD' ? [whiteCoat, whiteCoat, whiteCoat] : photoColourCurves(metal.hardware, 'hardware');
  const { face, panel } = plan.source;
  const glass = style === 'shaker' ? { x: 192, y: 108, w: 266, h: 681 } : face;
  const baseMaterials = slidingMaterials(style).filter(m => m.mirror !== 'mixed' && m.texture);
  const activeTexture = material.texture;
  const shot = <image href={src} width="1024" height="1024" />;
  return <svg role="img" aria-label={`${style === 'framed' ? 'Framed' : 'Shaker'} sliding wardrobe doors — ${plan.doors.length} doors, ${material.name}, ${plan.opening.label}`}
    viewBox={`0 0 ${plan.viewportWidth} 1024`} data-preview-doors={plan.doors.length} data-preview-width={plan.width}
    data-preview-height={plan.height} data-preview-material={material.name}
    style={{ display: 'block', width: '100%', height: '100%' }}>
    <defs>
      <clipPath id={`${id}-face`}><path d={rectPath(face)} /></clipPath>
      <clipPath id={`${id}-glass`}><path d={rectPath(glass)} /></clipPath>
      <clipPath id={`${id}-metal`}><path d={plan.source.metal} /></clipPath>
      <filter id={`${id}-metal-colour`} colorInterpolationFilters="sRGB"><feComponentTransfer>
        <feFuncR type="table" tableValues={curves[0].join(' ')} />
        <feFuncG type="table" tableValues={curves[1].join(' ')} />
        <feFuncB type="table" tableValues={curves[2].join(' ')} />
      </feComponentTransfer></filter>
      <filter id={`${id}-light`} colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="linear" slope="1.19" /><feFuncG type="linear" slope="1.19" /><feFuncB type="linear" slope="1.19" />
        </feComponentTransfer>
      </filter>
      <g id={`${id}-room`}>
        {shot}
        <g clipPath={`url(#${id}-metal)`} filter={`url(#${id}-metal-colour)`}>{shot}</g>
      </g>
      {plan.doors.map((door, index) => <g id={`${id}-door-${index}`} key={index}>
        <g transform={style === 'shaker' && plan.doors.length === 2 && index === 1
          ? `translate(${2 * panel.x + panel.w} 0) scale(-1 1)` : undefined}>
        {shot}
        <g clipPath={`url(#${id}-face)`}>
          {baseMaterials.map((finish, fi) => <g key={finish.name} opacity={activeTexture === finish.texture ? 1 : 0}
            style={{ isolation: 'isolate', transition: reduced ? 'none' : 'opacity 320ms ease' }}>
            <defs>
              <pattern id={`${id}-${index}-texture-${fi}`} width="370" height="740" patternUnits="userSpaceOnUse"
                x={panel.x - index * 67} y={panel.y}>
                <image href={finish.texture} width="370" height="740" preserveAspectRatio="none" />
              </pattern>
              <pattern id={`${id}-${index}-rail-${fi}`} width="370" height="740" patternUnits="userSpaceOnUse"
                patternTransform="rotate(90)">
                <image href={finish.texture} width="370" height="740" preserveAspectRatio="none" />
              </pattern>
            </defs>
            <path d={rectPath(face)} fill={`url(#${id}-${index}-texture-${fi})`} />
            {style === 'shaker' && finish.grain && <>
              <rect x="190" y="61" width="269" height="44" fill={`url(#${id}-${index}-rail-${fi})`} />
              <rect x="190" y="792" width="269" height="58" fill={`url(#${id}-${index}-rail-${fi})`} />
            </>}
            <g filter={`url(#${id}-light)`} style={{ mixBlendMode: 'multiply' }}>{shot}</g>
          </g>)}
        </g>
        {door.mirror && <g clipPath={`url(#${id}-glass)`}>
          <svg x={glass.x} y={glass.y} width={glass.w} height={glass.h} preserveAspectRatio="none"
            viewBox={material.mirror === 'all'
              ? `${292 + 436 * index / plan.doors.length} 258 ${436 / plan.doors.length} 395`
              : '292 258 436 395'}>
            <image href="/images/shop/mirrors-quiet.webp" width="1024" height="1024" />
          </svg>
          <path d={rectPath(glass)} fill="none" stroke="#AEB3AA" strokeWidth="1.5" />
        </g>}
        <g clipPath={`url(#${id}-metal)`} filter={`url(#${id}-metal-colour)`}>{shot}</g>
        </g>
      </g>)}
    </defs>
    {plan.room.map((slice, index) => <Slice key={`room-${index}`} slice={slice} artwork={`${id}-room`} />)}
    {plan.doors.map((door, index) => <g key={index} data-preview-mirror={door.mirror}>
      {door.slices.map((slice, si) => <Slice key={si} slice={slice} artwork={`${id}-door-${index}`} />)}
    </g>)}
  </svg>;
}

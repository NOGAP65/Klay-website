import { useEffect, useId, useState } from 'react';

import { grainTransform, joineryWidthSlices, JOINERY_HEIGHT_MM, type WidthSlice } from '@/features/catalogue/lib/joineryPhotoWidth';
import { photoColourCurves } from '@/features/catalogue/lib/photoColour';
import type { PhotoMaterial, ShopPhoto } from '@/features/catalogue/shopPhotos';
import { FINISH_TEXTURE, FINISH_TILE_MM, WARDROBE_COLOURS, wardrobeModelById } from '@/features/visualiser';
import { useMediaQuery } from '@/shared';

import { ShowerPhotoLayers } from './ShowerPhotoLayers';
import { SemiScreenPhotoLayers } from './SemiScreenPhotoLayers';
import { MirrorPhotoLayers } from './MirrorPhotoLayers';
import { usePhotoTransition } from './usePhotoTransition';

interface Props { photo: ShopPhoto; colour: string; colourName?: string; hardware: string; width?: string; shape?: string; dimension?: string }
interface ArtworkProps {
  photo: ShopPhoto; id: string; finish: string; isReduced: boolean;
  slice: WidthSlice; index: number; scaleY: number;
}
const GRAINS = ['vertical', 'horizontal', 'surface'] as const;
const WHOLE: WidthSlice = { sourceX: 0, sourceWidth: 1024, x: 0, width: 1024, scaleX: 1, translateX: 0 };

function ColourFilter({ id, colour, material }: { id: string; colour: string; material: PhotoMaterial }) {
  const curves = photoColourCurves(colour, material);
  return <filter id={id} colorInterpolationFilters="sRGB"><feComponentTransfer>
    <feFuncR type="table" tableValues={curves[0].join(' ')} />
    <feFuncG type="table" tableValues={curves[1].join(' ')} />
    <feFuncB type="table" tableValues={curves[2].join(' ')} />
  </feComponentTransfer></filter>;
}

function PhotoDefinitions({ photo, id, colour, hardware }: Props & { id: string }) {
  return <defs>
    {photo.regions?.map((region, index) => <g key={index}>
      <clipPath id={`${id}-region-${index}`}><path d={region.path} /></clipPath>
      <ColourFilter id={`${id}-colour-${index}`} colour={colour} material={region.material} />
    </g>)}
    {photo.metal && <>
      <clipPath id={`${id}-metal`}><path d={photo.metal} /></clipPath>
      <ColourFilter id={`${id}-hardware`} colour={hardware} material="hardware" />
    </>}
    {photo.boards && <>
      <mask id={`${id}-boards`} maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
        {photo.boards.map((f, i) => <path key={i} d={f.path} fill="white" />)}
        {photo.metal && <path d={photo.metal} fill="black" />}
      </mask>
      <filter id={`${id}-lighting`} colorInterpolationFilters="sRGB"><feComponentTransfer>
        <feFuncR type="linear" slope={255 / 241} />
        <feFuncG type="linear" slope={255 / 239} />
        <feFuncB type="linear" slope={255 / 235} />
      </feComponentTransfer></filter>
    </>}
  </defs>;
}

function WoodLayers({ photo, id, finish, isReduced, slice, index, scaleY }: ArtworkProps) {
  const photoScale = photo.joinery ? (photo.joinery.bottom - photo.joinery.top) / JOINERY_HEIGHT_MM : photo.boardScale ?? 0.35;
  const tileW = FINISH_TILE_MM.w * photoScale;
  const tileH = FINISH_TILE_MM.h * photoScale;
  return <g mask={`url(#${id}-boards)`}>
    {Object.entries(FINISH_TEXTURE).map(([slug, texture]) => {
      const pattern = `${id}-${index}-${slug}`;
      return <g key={slug} opacity={finish === slug ? 1 : 0} style={{
        isolation: 'isolate', transition: isReduced ? 'none' : 'opacity 320ms ease',
      }}>
        <defs>{GRAINS.map(grain => <pattern key={grain} id={`${pattern}-${grain}`}
          patternUnits="userSpaceOnUse" width={tileW} height={tileH}
          patternTransform={grainTransform(grain, slice.scaleX / scaleY, slice.translateX / scaleY)}>
          <image href={texture} width={tileW} height={tileH} preserveAspectRatio="none" />
        </pattern>)}</defs>
        {photo.boards?.map((f, i) => <path key={i} d={f.path} fill={`url(#${pattern}-${f.grain})`} />)}
        <g filter={`url(#${id}-lighting)`} style={{ mixBlendMode: 'multiply' }}>
          <image href={photo.src} width="1024" height="1024" />
        </g>
      </g>;
    })}
  </g>;
}

function PhotoArtwork(props: ArtworkProps) {
  const { photo, id } = props;
  const shot = <image href={photo.src} width="1024" height="1024" />;
  return <>
    {shot}
    {photo.regions?.map((_, index) => <g key={index} clipPath={`url(#${id}-region-${index})`}>
      <g filter={`url(#${id}-colour-${index})`}>{shot}</g>
    </g>)}
    {photo.boards && <WoodLayers {...props} />}
    {photo.metal && <g clipPath={`url(#${id}-metal)`}>
      <g filter={`url(#${id}-hardware)`}>{shot}</g>
    </g>}
  </>;
}

function PhotoPreview({ photo, colour, colourName, hardware, width }: Props) {
  const id = `shop-photo-${useId().replace(/:/g, '')}`;
  const isReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isInstant = isReduced || !!photo.joinery;
  const model = photo.joinery ? wardrobeModelById(photo.joinery.modelId) : undefined;
  const widthMm = model?.widths.includes(Number(width)) ? Number(width) : model?.widths[0] ?? 0;
  const frame = usePhotoTransition({ colour, hardware }, isInstant);
  const finish = WARDROBE_COLOURS.find(c => c.name === colourName)?.slug ?? 'white';
  const plan = photo.joinery ? joineryWidthSlices(photo.joinery, widthMm) : {
    slices: [WHOLE], roomSlices: [WHOLE], width: 1024, scaleY: 1,
    rows: [{ sourceY: 0, sourceHeight: 1024, y: 0, height: 1024 }],
  };
  const description = `${photo.description} — ${colourName ?? ''}${model ? ` — ${widthMm}mm wide × ${JOINERY_HEIGHT_MM}mm high` : ''}`;
  return <svg role="img" aria-label={description} viewBox={`0 0 ${plan.width} 1024`}
    data-preview-width={model ? widthMm : undefined} data-preview-height={model ? JOINERY_HEIGHT_MM : undefined}
    style={{ width: '100%', height: '100%', display: 'block' }}>
    <PhotoDefinitions photo={photo} id={id} colour={frame.colour} hardware={frame.hardware} />
    {plan.rows.map((row, rowIndex) => <g key={rowIndex}>
      {(photo.joinery && rowIndex !== 1 ? plan.roomSlices : plan.slices).map((slice, index) => <svg key={index} x={slice.x} y={row.y}
        width={slice.width + 6} height={row.height + 6} overflow="hidden" preserveAspectRatio="none"
        viewBox={`${slice.sourceX} ${row.sourceY} ${slice.sourceWidth + 6 / slice.scaleX} ${row.sourceHeight + 6 * row.sourceHeight / row.height}`}>
        {photo.joinery && rowIndex !== 1 ? <image href={photo.src} width="1024" height="1024" />
          : <PhotoArtwork photo={photo} id={id} finish={finish} isReduced={isInstant}
            slice={slice} index={index} scaleY={plan.scaleY} />}
      </svg>)}
    </g>)}
  </svg>;
}

/** Decode a changed model before replacing both the image and its masks. */
export function ShopPhotoLayers({ photo: selectedPhoto, ...selection }: Props) {
  const [photo, setPhoto] = useState(selectedPhoto);
  useEffect(() => {
    let isCancelled = false;
    const sources = [selectedPhoto.src, selectedPhoto.shower?.background,
      selectedPhoto.semi?.background, selectedPhoto.semi?.reflections].filter((src): src is string => !!src);
    void Promise.all(sources.map(src => {
      const next = new Image();
      next.src = src;
      return next.decode();
    })).then(() => {
      if (!isCancelled) setPhoto(selectedPhoto);
    }).catch(() => { /* Retain the last complete preview on a failed request. */ });
    return () => { isCancelled = true; };
  }, [selectedPhoto]);
  if (photo.mirror) return <MirrorPhotoLayers src={photo.src} framed={photo.mirror.framed}
    shape={selection.shape} dimension={selection.dimension} hardware={selection.hardware} />;
  if (photo.semi) return <SemiScreenPhotoLayers key={photo.src} src={photo.src} photo={photo.semi}
    hardware={selection.hardware} width={selection.width} />;
  return photo.shower
    ? <ShowerPhotoLayers key={photo.src} src={photo.src} photo={photo.shower} hardware={selection.hardware} width={selection.width} />
    : <PhotoPreview key={photo.src} photo={photo} {...selection} />;
}

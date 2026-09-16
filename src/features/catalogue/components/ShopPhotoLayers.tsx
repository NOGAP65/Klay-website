import { useEffect, useId, useState } from 'react';

import { LoadingIndicator, space, tokens } from '@/ds';
import { grainTransform, joineryWidthSlices, JOINERY_HEIGHT_MM, type WidthSlice } from '@/features/catalogue/lib/joineryPhotoWidth';
import { photoColourCurves } from '@/features/catalogue/lib/photoColour';
import { FINISH_TEXTURE, FINISH_TILE_MM, WARDROBE_COLOURS, wardrobeModelById } from '@/features/joinery';
import { loadImage, useMediaQuery } from '@/shared';

import { CabinetMirrorPhotoLayers } from './CabinetMirrorPhotoLayers';
import { FlyscreenPhotoLayers } from './FlyscreenPhotoLayers';
import { MirrorPhotoLayers } from './MirrorPhotoLayers';
import { SemiScreenPhotoLayers } from './SemiScreenPhotoLayers';
import { ShowerPhotoLayers } from './ShowerPhotoLayers';
import { SlidingDoorPhotoLayers } from './SlidingDoorPhotoLayers';
import { usePhotoTransition } from './usePhotoTransition';
import { WalkInPhotoLayers } from './WalkInPhotoLayers';

import type { PhotoMaterial, ShopPhoto } from '@/features/catalogue/shopPhotos';

interface Props { photo: ShopPhoto; colour: string; dayColour?: string; colourName?: string; hardware: string; hardwareName?: string; width?: string; shape?: string; dimension?: string }
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

function PhotoDefinitions({ photo, id, colour, dayColour, hardware }: Props & { id: string }) {
  return <defs>
    {photo.regions?.map((region, index) => <g key={index}>
      <clipPath id={`${id}-region-${index}`}><path d={region.path} /></clipPath>
      <ColourFilter id={`${id}-colour-${index}`} colour={region.material === 'day' ? dayColour ?? colour : colour} material={region.material} />
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
    {WARDROBE_COLOURS.filter(board => board.slug !== 'white').map(({ slug, hex }) => {
      const texture = FINISH_TEXTURE[slug];
      const pattern = `${id}-${index}-${slug}`;
      return <g key={slug} opacity={finish === slug ? 1 : 0} style={{
        isolation: 'isolate', transition: isReduced ? 'none' : 'opacity 320ms ease',
      }}>
        <defs>{GRAINS.map(grain => <pattern key={grain} id={`${pattern}-${grain}`}
          patternUnits="userSpaceOnUse" width={tileW} height={tileH}
          patternTransform={grainTransform(grain, slice.scaleX / scaleY, slice.translateX / scaleY)}>
          <rect width={tileW} height={tileH} fill={hex} />
          {texture && <image href={texture} width={tileW} height={tileH} preserveAspectRatio="none" />}
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

function PhotoPreview({ photo, colour, dayColour, colourName, hardware, width }: Props) {
  const id = `shop-photo-${useId().replace(/:/g, '')}`;
  const isReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isInstant = isReduced || !!photo.joinery;
  const model = photo.joinery ? wardrobeModelById(photo.joinery.modelId) : undefined;
  const widthMm = model?.widths.includes(Number(width)) ? Number(width) : model?.widths[0] ?? 0;
  const frame = usePhotoTransition({ colour, hardware }, isInstant);
  const dayFrame = usePhotoTransition({ colour: dayColour ?? colour, hardware }, isInstant);
  const finish = WARDROBE_COLOURS.find(c => c.name === colourName)?.slug ?? 'white';
  const plan = photo.joinery ? joineryWidthSlices(photo.joinery, widthMm) : {
    slices: [WHOLE], roomSlices: [WHOLE], width: 1024, scaleY: 1,
    rows: [{ sourceY: 0, sourceHeight: 1024, y: 0, height: 1024 }],
  };
  const description = `${photo.description} — ${colourName ?? ''}${model ? ` — ${widthMm}mm wide × ${JOINERY_HEIGHT_MM}mm high` : ''}`;
  return <svg role="img" aria-label={description} viewBox={`0 0 ${plan.width} 1024`}
    data-preview-width={model ? widthMm : undefined} data-preview-height={model ? JOINERY_HEIGHT_MM : undefined}
    style={{ width: '100%', height: '100%', display: 'block' }}>
    <PhotoDefinitions photo={photo} id={id} colour={frame.colour} dayColour={dayFrame.colour} hardware={frame.hardware} />
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
  const [loaded, setLoaded] = useState<ShopPhoto | null>(null);
  const [failure, setFailure] = useState<ShopPhoto | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let isCancelled = false;
    const sources = [selectedPhoto.src, selectedPhoto.shower?.background,
      selectedPhoto.semi?.background, selectedPhoto.semi?.reflections].filter((src): src is string => !!src);
    void Promise.all(sources.map(src => loadImage(src))).then(() => {
      if (!isCancelled) setLoaded(selectedPhoto);
    }).catch(() => { if (!isCancelled) setFailure(selectedPhoto); });
    return () => { isCancelled = true; };
  }, [selectedPhoto, attempt]);
  const hasFailed = failure === selectedPhoto;
  return <div style={{ position: 'absolute', inset: 0 }} aria-busy={loaded !== selectedPhoto && !hasFailed}>
    {loaded && <LoadedPhotoLayers photo={loaded} {...selection} />}
    {hasFailed ? <div role="alert" style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', padding: space.group, gap: space.item, background: tokens.charcoal, color: tokens.onDark, textAlign: 'center' }}>
      <p>This photo couldn’t load.</p>
      <button type="button" onClick={() => { setFailure(null); setAttempt(value => value + 1); }} style={{ minHeight: 44, background: tokens.accent, color: tokens.onAccent, padding: `${space.snug}px ${space.group}px` }}>Retry photo</button>
    </div> : loaded !== selectedPhoto && <LoadingIndicator overlay delayed={!!loaded} label="Loading product" />}
  </div>;
}

function LoadedPhotoLayers({ photo, ...selection }: Props) {
  if (photo.slidingDoor) return <SlidingDoorPhotoLayers src={photo.src} style={photo.slidingDoor}
    panels={selection.shape} dimension={selection.dimension} materialName={selection.colourName} hardware={selection.hardware} />;
  if (photo.walkIn) return <WalkInPhotoLayers src={photo.src} layoutId={photo.walkIn}
    colourName={selection.colourName} hardwareName={selection.hardwareName} />;
  if (photo.flyscreen) return <FlyscreenPhotoLayers src={photo.src} configuration={selection.shape}
    hardware={selection.hardware} hardwareName={selection.hardwareName} />;
  if (photo.cabinetMirror) return <CabinetMirrorPhotoLayers src={photo.src} shape={selection.shape} />;
  if (photo.mirror) return <MirrorPhotoLayers src={photo.src} framed={photo.mirror.framed}
    shape={selection.shape} dimension={selection.dimension} hardware={selection.hardware} />;
  if (photo.semi) return <SemiScreenPhotoLayers key={photo.src} src={photo.src} photo={photo.semi}
    hardware={selection.hardware} width={selection.width} />;
  return photo.shower
    ? <ShowerPhotoLayers key={photo.src} src={photo.src} photo={photo.shower} hardware={selection.hardware} width={selection.width} />
    : <PhotoPreview key={photo.src} photo={photo} {...selection} />;
}

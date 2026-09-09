import { useEffect, useId, useState } from 'react';

import { photoColourCurves } from '@/features/catalogue/lib/photoColour';
import type { PhotoMaterial, ShopPhoto } from '@/features/catalogue/shopPhotos';
import { FINISH_TEXTURE, FINISH_TILE_MM, WARDROBE_COLOURS } from '@/features/visualiser';

interface Props { photo: ShopPhoto; colour: string; colourName?: string; hardware: string }

function ColourFilter({ id, colour, material }: { id: string; colour: string; material: PhotoMaterial }) {
  const curves = photoColourCurves(colour, material);
  return <filter id={id} colorInterpolationFilters="sRGB">
    <feComponentTransfer>
      <feFuncR type="table" tableValues={curves[0].join(' ')} />
      <feFuncG type="table" tableValues={curves[1].join(' ')} />
      <feFuncB type="table" tableValues={curves[2].join(' ')} />
    </feComponentTransfer>
  </filter>;
}

/** All layers use the same source coordinates, including on phones. The base
 * photograph supplies lighting; actual board decor supplies the wood grain. */
export function ShopPhotoLayers({ photo: selectedPhoto, colour, colourName, hardware }: Props) {
  const [photo, setPhoto] = useState(selectedPhoto);
  // Decode before changing the silhouette. Otherwise the browser briefly
  // paints the new model's texture on the previous model's cached photograph.
  useEffect(() => {
    let isCancelled = false;
    const next = new Image();
    next.src = selectedPhoto.src;
    void next.decode().then(() => {
      if (!isCancelled) setPhoto(selectedPhoto);
    }).catch(() => { /* Keep the last complete preview on a failed request. */ });
    return () => { isCancelled = true; };
  }, [selectedPhoto]);
  const id = `shop-photo-${useId().replace(/:/g, '')}`;
  const finish = WARDROBE_COLOURS.find(c => c.name === colourName);
  const texture = FINISH_TEXTURE[finish?.slug ?? 'white'];
  const boards = photo.boards ?? [];
  const tileW = FINISH_TILE_MM.w * (photo.boardScale ?? 0.35);
  const tileH = FINISH_TILE_MM.h * (photo.boardScale ?? 0.35);
  const shot = <image href={photo.src} width="1024" height="1024" />;
  return <>
    <img src={photo.src} alt={`${photo.description} — ${colourName ?? ''}`} style={{
      width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: 'center',
    }} />
    <svg aria-hidden="true" viewBox="0 0 1024 1024" style={{
    position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none',
  }}>
    <defs>
      {photo.regions?.map((region, index) => <g key={index}>
        <clipPath id={`${id}-region-${index}`}><path d={region.path} /></clipPath>
        <ColourFilter id={`${id}-colour-${index}`} colour={colour} material={region.material} />
      </g>)}
      {photo.metal && <>
        <clipPath id={`${id}-metal`}><path d={photo.metal} /></clipPath>
        <ColourFilter id={`${id}-hardware`} colour={hardware} material="hardware" />
      </>}
      {texture && <>
        <mask id={`${id}-boards`} maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
          {boards.map((f, i) => <path key={i} d={f.path} fill="white" />)}
          {photo.metal && <path d={photo.metal} fill="black" />}
        </mask>
        {(['vertical', 'horizontal', 'surface'] as const).map(grain => <pattern key={grain}
          id={`${id}-${grain}`} patternUnits="userSpaceOnUse" width={tileW} height={tileH}
          patternTransform={grain === 'vertical' ? undefined : grain === 'horizontal'
            ? 'matrix(0 1 -1 0 1024 0)' : 'matrix(0 0.18 -1 0 1024 0)'}>
          <image href={texture} width={tileW} height={tileH} preserveAspectRatio="none" />
        </pattern>)}
        <filter id={`${id}-lighting`} colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncR type="linear" slope={255 / 241} />
            <feFuncG type="linear" slope={255 / 239} />
            <feFuncB type="linear" slope={255 / 235} />
          </feComponentTransfer>
        </filter>
      </>}
    </defs>
    {photo.regions?.map((_, index) => <g key={index} clipPath={`url(#${id}-region-${index})`}>
      <g filter={`url(#${id}-colour-${index})`}>{shot}</g>
    </g>)}
    {texture && <g mask={`url(#${id}-boards)`} style={{ isolation: 'isolate' }}>
      {boards.map((f, i) => <path key={i} d={f.path} fill={`url(#${id}-${f.grain})`} />)}
      <g filter={`url(#${id}-lighting)`} style={{ mixBlendMode: 'multiply' }}>{shot}</g>
    </g>}
    {photo.metal && <g clipPath={`url(#${id}-metal)`}>
      <g filter={`url(#${id}-hardware)`}>{shot}</g>
    </g>}
  </svg></>;
}

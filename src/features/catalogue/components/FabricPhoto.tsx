import { useEffect, useRef, useState } from 'react';

import { LoadingIndicator, space, tokens, usePrefersReducedMotion } from '@/ds';
import { fabricScanInset } from '@/features/fabrics';
import { loadImage } from '@/shared';

import { FABRIC_SHOT_DIR, type FabricShot } from '../fabricShots';
import { paintFabricPhoto, type FabricPhotoImages } from '../lib/paintFabricPhoto';

import { usePhotoTransition } from './usePhotoTransition';

interface Props {
  shot: FabricShot; colour: string; hardware: string; weave?: string;
  alt: string; position: string; lifted: boolean;
}

export function FabricPhoto({ shot, colour, hardware, weave, alt, position, lifted }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const layer = useRef<HTMLCanvasElement | null>(null);
  const [loaded, setLoaded] = useState<{ key: string; images: FabricPhotoImages }>();
  const [failed, setFailed] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState('');
  const isReduced = usePrefersReducedMotion();
  const frame = usePhotoTransition({ colour, hardware }, isReduced);
  const key = [shot.file, shot.mask, shot.hardware, weave].join('|');
  useEffect(() => {
    let active = true;
    const source = (file: string | null) => file ? loadImage(`${FABRIC_SHOT_DIR}/${file}`) : undefined;
    void Promise.all([source(shot.file), source(shot.mask), source(shot.hardware), weave ? loadImage(weave) : undefined])
      .then(([photo, mask, hardwareImage, weaveImage]) => {
        if (active && photo) setLoaded({ key, images: { photo, mask, hardware: hardwareImage, weave: weaveImage } });
      }).catch(() => { if (active) setFailed(key); });
    return () => { active = false; };
  }, [key, shot.file, shot.mask, shot.hardware, weave, attempt]);
  useEffect(() => {
    if (!canvas.current || loaded?.key !== key) return;
    const request = requestAnimationFrame(() => {
      if (!canvas.current) return;
      try {
        layer.current ??= document.createElement('canvas');
        paintFabricPhoto(canvas.current, layer.current, loaded.images,
          { shot, colour: frame.colour, hardware: frame.hardware, cssWidth: canvas.current.clientWidth });
        setReady(key);
      } catch { setFailed(key); }
    });
    return () => cancelAnimationFrame(request);
  }, [loaded, key, shot, frame.colour, frame.hardware]);
  useEffect(() => () => { if (layer.current) layer.current.width = layer.current.height = 0; }, []);
  return <>
    <canvas ref={canvas} role="img" aria-label={alt} data-fabric-photo={shot.product}
      data-fabric-texture={weave} data-fabric-inset={fabricScanInset(weave) || undefined}
      data-render-ready={ready === key ? 'true' : 'false'}
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: position,
        colorScheme: 'only light', forcedColorAdjust: 'none',
        transform: lifted ? 'scale(1.04)' : 'scale(1)', transition: isReduced ? 'none' : 'transform .7s ease' }} />
    {failed === key ? <div role="alert" style={{ position: 'absolute', inset: 0, zIndex: 26, display: 'grid',
      placeContent: 'center', gap: space.item, padding: space.group, background: tokens.charcoal, color: tokens.onDark }}>
      <p>This photo couldn’t load.</p>
      <button type="button" onClick={() => { setFailed(''); setAttempt(value => value + 1); }}>Try again</button>
    </div> : ready !== key && <LoadingIndicator label="Loading product photo" overlay delayed={!!ready} />}
  </>;
}

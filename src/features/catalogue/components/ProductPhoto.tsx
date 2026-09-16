import { useEffect, useState, type CSSProperties } from 'react';

import { LoadingIndicator, space, tokens } from '@/ds';
import { loadImage } from '@/shared';

export function ProductPhoto({ src, alt, style }: { src?: string; alt: string; style: CSSProperties }) {
  const [loaded, setLoaded] = useState('');
  const [failed, setFailed] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!src) return;
    let isActive = true;
    void loadImage(src).then(() => { if (isActive) setLoaded(src); })
      .catch(() => { if (isActive) setFailed(src); });
    return () => { isActive = false; };
  }, [src, attempt]);
  return <>
    {loaded && <img src={loaded} alt={alt} style={style} />}
    {failed === src ? <div role="alert" style={{ position: 'absolute', inset: 0, zIndex: 26, display: 'grid', placeContent: 'center', gap: space.item, padding: space.group, background: tokens.charcoal, color: tokens.onDark }}>
      <p>This photo couldn’t load.</p>
      <button type="button" onClick={() => { setFailed(''); setAttempt(value => value + 1); }} style={{ minHeight: 44 }}>Retry photo</button>
    </div> : loaded !== src && <LoadingIndicator overlay delayed={!!loaded} label="Loading product" />}
  </>;
}

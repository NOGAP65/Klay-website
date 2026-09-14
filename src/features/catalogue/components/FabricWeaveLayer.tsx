import { useEffect, useState } from 'react';

import { fabricByName } from '@/features/fabrics';

/** A subtle, neutral weave over the existing photograph's lighting and mask. */
export function FabricWeaveLayer({ name, mask, position, lifted }: {
  name?: string; mask: string; position: string; lifted: boolean;
}) {
  const requested = fabricByName(name)?.weaveTexture;
  const [source, setSource] = useState<string>();
  useEffect(() => {
    let cancelled = false;
    if (!requested) return;
    const image = new Image();
    image.src = requested;
    void image.decode().then(() => { if (!cancelled) setSource(requested); })
      .catch(() => { if (!cancelled) setSource(undefined); });
    return () => { cancelled = true; };
  }, [requested]);
  if (!requested || !source) return null;
  return <div aria-hidden="true" data-fabric-texture={source} style={{
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: `url("${source}")`, backgroundSize: '140px 140px',
    mixBlendMode: 'soft-light', opacity: .24,
    maskImage: `url("${mask}")`, WebkitMaskImage: `url("${mask}")`,
    maskSize: 'cover', WebkitMaskSize: 'cover', maskPosition: position, WebkitMaskPosition: position,
    transform: lifted ? 'scale(1.04)' : 'scale(1)', transition: 'transform .7s ease',
  }} />;
}

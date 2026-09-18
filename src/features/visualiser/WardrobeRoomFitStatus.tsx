import { DANGER, space, tokens, type as typeScale } from '@/ds';

import { wardrobeRoomFit, type RoomDimensions } from './wardrobeRoomFit';

export function WardrobeRoomFitStatus({ room, product }: { room: RoomDimensions; product: RoomDimensions }) {
  const result = wardrobeRoomFit(room, product);
  const labels = { width: 'too wide', height: 'too tall', depth: 'too deep' };
  return <div role="status" data-room-fit={result.fits ? 'fits' : 'too-small'} style={{ padding: space.item,
    background: tokens.paper, color: tokens.ink, borderLeft: `3px solid ${result.fits ? tokens.accent : DANGER}` }}>
    <strong>{result.fits ? 'Within your measured space' : 'This wardrobe won’t fit'}</strong>
    {!result.fits && <p>{result.excess.map(({ axis, mm }) => `${mm.toLocaleString('en-AU')} mm ${labels[axis]}`).join(' · ')}. Choose a smaller model or check the measurements.</p>}
    <p style={{ marginTop: space.xs }}>Wardrobe: {product.width} W × {product.height} H × {product.depth} D mm.</p>
    <p style={{ fontSize: typeScale.label.fontSize, marginTop: space.xs }}>Based on the measurements you entered. Our professional check measure confirms installation clearance and access.</p>
  </div>;
}

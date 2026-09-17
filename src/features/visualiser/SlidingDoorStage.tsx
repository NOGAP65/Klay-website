import { tokens, radius } from '@/ds';
import { slidingPreviewDimensions } from '@/features/joinery';

import { useVisualiserStore } from './useVisualiserStore';
import WallColourChip from './WallColourChip';
import Wardrobe3D from './Wardrobe3D';

export default function SlidingDoorStage({ mediaMaxVh = 78 }: { mediaMaxVh?: number }) {
  const config = useVisualiserStore(state => state.slidingDoor);
  const wallColour = useVisualiserStore(state => state.wardrobeWallColour);
  const setWall = useVisualiserStore(state => state.setWardrobeWallColour);
  return <div data-sliding-door-preview={config.style} style={{ position: 'relative', width: '100%',
    height: `min(${mediaMaxVh}vh, 760px)`, minHeight: 340, background: tokens.cream, overflow: 'hidden', borderRadius: radius.lg }}>
    <WallColourChip value={wallColour} onChange={setWall} />
    <Wardrobe3D modelId="sliding" colourName={config.material} selectedWidthMm={slidingPreviewDimensions(config).widthMm}
      handleFinish={config.hardware} wallColour={wallColour} sliding={config} />
  </div>;
}

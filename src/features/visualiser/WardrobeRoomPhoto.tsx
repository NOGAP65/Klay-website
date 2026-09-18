import { useRef, useState } from 'react';

import { DANGER, space } from '@/ds';
import { wardrobeModelById, WALK_IN_FOOTPRINT_MM } from '@/features/joinery';

import CornerPinOverlay, { type CornerPinOverlayHandle } from './CornerPinOverlay';
import { isValidTrace } from './traceValidation';
import { readRoomDimensions, wardrobeRoomFit, wardrobeRoomSize, type RoomDimensions } from './wardrobeRoomFit';
import { WardrobeRoomFitStatus } from './WardrobeRoomFitStatus';
import { WardrobeRoomMeasurements } from './WardrobeRoomMeasurements';
import WardrobeRoomRenderer from './WardrobeRoomRenderer';

import type { Point } from './homography';
import type { RoomRenderSettings } from './wardrobeRoomEngine';

type Selection = Pick<RoomRenderSettings, 'modelId' | 'colourName' | 'widthMm' | 'handleFinish' | 'recessed'>;
export function WardrobeRoomPhoto({ photoUrl, bitmap, selection }: {
  photoUrl: string; bitmap: { width: number; height: number }; selection: Selection;
}) {
  const pins = useRef<CornerPinOverlayHandle>(null);
  const [values, setValues] = useState({ width: '', height: '2000', depth: '' });
  const [confirmed, setConfirmed] = useState<{ corners: Point[]; room: RoomDimensions } | null>(null);
  const [outline, setOutline] = useState<Point[] | undefined>();
  const [error, setError] = useState('');
  const isWalkIn = wardrobeModelById(selection.modelId).kind === 'walk-in';
  const product = wardrobeRoomSize(selection.modelId, selection.widthMm);
  const hasFit = confirmed && wardrobeRoomFit(confirmed.room, product).fits;
  const confirm = (corners: Point[]) => {
    const room = readRoomDimensions(values);
    if (!room) { setError('Enter whole millimetres: width/depth 100–10,000 and height 500–5,000.'); return; }
    if (!isValidTrace(corners, bitmap.width, bitmap.height)) { setError('Keep all four corners inside the photo and the outline uncrossed.'); return; }
    setError(''); setConfirmed({ corners, room });
  };
  const edit = () => {
    if (confirmed) setOutline(confirmed.corners.map(([x,y]) => [x / bitmap.width, y / bitmap.height]));
    setConfirmed(null);
  };
  return <>
    <p style={{ padding: space.item }}>{isWalkIn ? 'Trace the back wall, from floor to ceiling. Enter the room’s full width and clear depth.'
      : selection.recessed ? 'Trace the inside front edge of the recess, from floor to the top of the opening.' : 'Trace a measured rectangle on the wall, starting at the floor. Enter the available floor depth.'}</p>
    <div className="wardrobe-room-photo" style={{ aspectRatio: String(bitmap.width / bitmap.height),
      maxWidth: `calc(72vh * ${bitmap.width / bitmap.height})`, margin: '0 auto' }}>
      <img src={photoUrl} alt="Your wardrobe room" />
      {!confirmed ? <CornerPinOverlay ref={pins} photoUrl={photoUrl} imageWidth={bitmap.width} imageHeight={bitmap.height}
        initialCornersPct={outline} onConfirm={confirm} /> : hasFit ? <WardrobeRoomRenderer {...selection} photoUrl={photoUrl}
        room={confirmed.room} corners={confirmed.corners} offsetZ={isWalkIn ? WALK_IN_FOOTPRINT_MM : selection.recessed ? 0 : product.depth} />
        : <svg className="wardrobe-room-outline" viewBox={`0 0 ${bitmap.width} ${bitmap.height}`} aria-label="Measured space is too small">
          <polygon points={confirmed.corners.map(p => p.join(',')).join(' ')} fill="none" stroke={DANGER} strokeWidth="3" vectorEffect="non-scaling-stroke" />
        </svg>}
    </div>
    {!confirmed ? <form onSubmit={event => { event.preventDefault(); pins.current?.confirm(); }}>
      <WardrobeRoomMeasurements values={values} onChange={setValues} walkIn={isWalkIn} />
      {error && <p role="alert" style={{ padding: space.item }}>{error}</p>}
      <button className="wardrobe-room-button" type="submit">Confirm measurements & preview</button>
    </form> : <>
      <WardrobeRoomFitStatus room={confirmed.room} product={product} />
      <button className="wardrobe-room-button" type="button" onClick={edit}>Edit outline or measurements</button>
    </>}
  </>;
}

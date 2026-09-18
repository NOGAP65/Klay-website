import { Field, space, tokens, type as typeScale } from '@/ds';

import { ROOM_AXES, type RoomMeasurements } from './wardrobeRoomFit';

export function WardrobeRoomMeasurements({ values, onChange, walkIn }: {
  values: RoomMeasurements; onChange: (value: RoomMeasurements) => void; walkIn: boolean;
}) {
  return <div style={{ background: tokens.paper, color: tokens.ink, padding: space.item }}>
    <p style={{ marginBottom: space.item }}>{walkIn ? 'Measure the full room, not the doorway.' : 'Measure the usable space you outlined.'} Use the smallest clear measurements.</p>
    <div className="wardrobe-room-measurements">
      {ROOM_AXES.map(axis => <Field key={axis} label={`${axis[0].toUpperCase()}${axis.slice(1)} (mm)`}
        value={values[axis]} onChange={value => onChange({ ...values, [axis]: value })}
        required inputMode="numeric" maxLength={5} placeholder={axis === 'height' ? '2000' : 'Measured size'} />)}
    </div>
    <p style={{ fontSize: typeScale.label.fontSize, marginTop: space.snug }}>2,000 mm is a starting estimate for height. Confirm your actual measurement before previewing.</p>
  </div>;
}

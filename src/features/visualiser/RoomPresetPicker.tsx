import { radius, tokens } from '@/ds';

import type { WindowRoom } from './roomPresets';

export function RoomPresetPicker({ rooms, selectedUrl, onSelect }: {
  rooms: WindowRoom[];
  selectedUrl: string | null;
  onSelect: (url: string) => void;
}) {
  return (
    <div style={{ padding: '14px 16px', borderTop: `1px solid ${tokens.onDarkLine}` }}>
      <p style={{ margin: '0 0 10px', fontFamily: tokens.body, fontSize: 11, color: tokens.onDarkMuted }}>
        Try a room
      </p>
      <div role="group" aria-label="Sample rooms"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${rooms.length}, minmax(0, 1fr))`, gap: 8 }}>
        {rooms.map(room => (
          <button key={room.url} type="button" aria-label={`Preview ${room.name}`}
            aria-pressed={selectedUrl === room.url} onClick={() => onSelect(room.url)}
            style={{ minWidth: 0, padding: 0, overflow: 'hidden', borderRadius: radius.md,
              border: `1px solid ${selectedUrl === room.url ? tokens.paper : tokens.onDarkLine}`,
              background: selectedUrl === room.url ? tokens.ink : 'transparent', color: tokens.onDark,
              fontFamily: tokens.body, cursor: 'pointer' }}>
            <img src={room.url} alt="" loading="lazy" decoding="async" width="120" height="64"
              style={{ display: 'block', width: '100%', height: 64, objectFit: 'cover' }} />
            <span style={{ display: 'block', padding: '7px 4px', fontSize: 10, lineHeight: 1.4 }}>
              {room.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Room grid — 2x2, edge to edge, no gaps.
//
// This section sells the outcome, not the product: the customer sees a room
// they recognise rather than a swatch or a spec. It carries no headline for the
// same reason — four photographs of rooms with their names on them do not need
// to be introduced, and a headline above them would be the page explaining a
// picture.
//
// ON THE PHOTOGRAPHY. Two of these four are stand-ins, and the section is the
// place where that shows most. public/images has no home-office shot and no
// external/outdoor blind at all, so Home Office borrows an empty room carrying
// only a roller blind (neutral — it does not assert the wrong room) and Outdoor
// borrows the Eclipse shot for its deck and glazing. Living Room and Bedroom are
// truthful. Real photography for the other two is the gating item here.
//
// ON THE DESTINATIONS. /products?room=<slug>, resolved by ProductsPage to
// whatever can actually be shopped for that room — same arrangement as the
// product cards, and the same single place to change when room landing pages
// exist. Nothing here 404s.
// ---------------------------------------------------------------------------

import { tokens } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { PhotoTile } from './primitives';

const ROOMS = [
  {
    label: 'Living Room',
    room: 'living-room',
    image: '/images/room-4.png',
    objectPosition: '58% 46%',
  },
  {
    label: 'Bedroom',
    room: 'bedroom',
    image: '/images/Phoenix%20Blockout%20product%20image.png',
    objectPosition: 'center 42%',
  },
  {
    // PLACEHOLDER — see the note above. No office photograph exists.
    label: 'Home Office',
    room: 'home-office',
    image: '/images/room-2.png',
    objectPosition: '32% 42%',
  },
  {
    // PLACEHOLDER — see the note above. No external blind photograph exists.
    label: 'Outdoor',
    room: 'outdoor',
    image: '/images/Eclipse%20Dual%20Roller%20product%20image.png',
    objectPosition: 'center 55%',
  },
];

export function RoomGrid() {
  const isMobile = useIsMobile();

  return (
    <section style={{ background: tokens.charcoal }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          // Zero. The four photographs meet with nothing between them, which is
          // the whole look — any gap here turns a wall of rooms into four cards.
          gap: 0,
        }}
      >
        {ROOMS.map(room => (
          <PhotoTile
            key={room.room}
            to={`/products?room=${room.room}`}
            label={room.label}
            image={room.image}
            objectPosition={room.objectPosition}
            // Half the viewport each on desktop, so the 2x2 stands about one
            // screen tall and the block reads floor to ceiling.
            minHeight={isMobile ? 300 : 440}
          />
        ))}
      </div>
    </section>
  );
}

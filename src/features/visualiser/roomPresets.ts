import type { ProductCategory } from './useVisualiserStore';

export interface WindowRoom {
  url: string;
  name: string;
  // Normalised image coordinates, ordered TL, TR, BR, BL.
  corners: [number, number][];
}

export const WINDOW_ROOMS: Record<'blind' | 'curtain', WindowRoom[]> = {
  curtain: [
    {
      url: '/images/visualiser/rooms/curtain-shop-room.webp',
      name: 'Garden living room',
      corners: [[0.067, 0.057], [0.943, 0.057], [0.943, 0.790], [0.067, 0.790]],
    },
    {
      url: '/images/visualiser/rooms/curtain-bedroom.webp',
      name: 'Wall-to-wall bedroom',
      corners: [[0.052, 0.099], [0.946, 0.099], [0.946, 0.762], [0.052, 0.762]],
    },
  ],
  blind: [
    {
      url: '/images/visualiser/preview.webp',
      name: 'Original bedroom',
      corners: [[0.1918, 0.1989], [0.5841, 0.2492], [0.5830, 0.6382], [0.1864, 0.6699]],
    },
    {
      url: '/images/visualiser/rooms/blind-bedroom.webp',
      name: 'Coastal bedroom',
      corners: [[0.179, 0.143], [0.827, 0.143], [0.827, 0.581], [0.179, 0.581]],
    },
  ],
};

// Venetians follow the opening, including the recessed right jamb.
// Its top and bottom sit at different horizontal positions in this photo.
const VENETIAN_ROOM: WindowRoom = {
  ...WINDOW_ROOMS.blind[0],
  corners: [[.1826, .198], [.5780, .2530], [.5730, .6430], [.1802, .674]],
};
// The shutter's frame fits at the back of the reveal, inside all four edges.
// Preserve the photographed architrave, jamb depth and sill around it.
const PLANTATION_ROOM: WindowRoom = {
  ...WINDOW_ROOMS.blind[0],
  corners: [[.1915, .2135], [.5675, .2585], [.5640, .6340], [.1875, .6580]],
};
export function defaultWindowRoom(category: ProductCategory): WindowRoom {
  if (category === 'plantation') return PLANTATION_ROOM;
  if (category === 'venetian') return VENETIAN_ROOM;
  return WINDOW_ROOMS[category === 'curtain' ? 'curtain' : 'blind'][0];
}

export function windowRoomFor(url: string | null, category: ProductCategory): WindowRoom | undefined {
  const preset = defaultWindowRoom(category);
  return url === preset.url ? preset : Object.values(WINDOW_ROOMS).flat().find(room => room.url === url);
}

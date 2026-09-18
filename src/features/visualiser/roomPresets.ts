import type { ProductCategory } from './useVisualiserStore';

export interface WindowRoom {
  url: string;
  name: string;
  // Normalised image coordinates, ordered TL, TR, BR, BL.
  corners: [number, number][];
}

const WINDOW_ROOMS: Record<'blind' | 'curtain' | 'slatted' | 'roller-shutter' | 'zip-screen', WindowRoom[]> = {
  'roller-shutter': [{ url: '/images/visualiser/rooms/roller-shutter-exterior.webp', name: 'Exterior window',
    corners: [[366 / 1536, 124 / 1024], [1158 / 1536, 124 / 1024], [1158 / 1536, 735 / 1024], [366 / 1536, 735 / 1024]] }],
  'zip-screen': [{ url: '/images/visualiser/rooms/zip-screen-alfresco.webp', name: 'Garden alfresco',
    corners: [[134 / 1536, 128 / 1024], [1392 / 1536, 128 / 1024], [1392 / 1536, 793 / 1024], [134 / 1536, 793 / 1024]] }],
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
  slatted: [
    {
      url: '/images/visualiser/rooms/slatted-living-room-front.webp',
      name: 'Living room',
      // Front-on view, back of the reveal on the 1254px source. Cover the sash,
      // preserving the full photographed jambs and sill outside this plane.
      corners: [[193 / 1254, 156 / 1254], [1061 / 1254, 156 / 1254],
        [1061 / 1254, 825 / 1254], [193 / 1254, 825 / 1254]],
    },
  ],
};

export function windowRoomsFor(category: ProductCategory): WindowRoom[] {
  if (category === 'roller-shutter' || category === 'zip-screen') return WINDOW_ROOMS[category];
  if (category === 'plantation' || category === 'venetian') return WINDOW_ROOMS.slatted;
  return WINDOW_ROOMS[category === 'curtain' ? 'curtain' : 'blind'];
}

export function defaultWindowRoom(category: ProductCategory): WindowRoom {
  return windowRoomsFor(category)[0];
}

export function windowRoomFor(url: string | null, category: ProductCategory): WindowRoom | undefined {
  const preset = defaultWindowRoom(category);
  return url === preset.url ? preset : Object.values(WINDOW_ROOMS).flat().find(room => room.url === url);
}

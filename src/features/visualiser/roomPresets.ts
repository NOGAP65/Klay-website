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
      url: '/images/visualiser/rooms/curtain-living.webp',
      name: 'Garden living room',
      corners: [[0.085, 0.079], [0.915, 0.079], [0.915, 0.696], [0.085, 0.696]],
    },
    {
      url: '/images/visualiser/rooms/curtain-bedroom.webp',
      name: 'Wall-to-wall bedroom',
      corners: [[0.052, 0.099], [0.946, 0.099], [0.946, 0.762], [0.052, 0.762]],
    },
  ],
  blind: [
    {
      url: '/images/visualiser/rooms/blind-reading.webp',
      name: 'Courtyard reading room',
      corners: [[0.216, 0.144], [0.790, 0.144], [0.790, 0.606], [0.216, 0.606]],
    },
    {
      url: '/images/visualiser/rooms/blind-bedroom.webp',
      name: 'Coastal bedroom',
      corners: [[0.179, 0.143], [0.827, 0.143], [0.827, 0.581], [0.179, 0.581]],
    },
  ],
};

export const defaultWindowRoom = (category: ProductCategory): WindowRoom =>
  WINDOW_ROOMS[category === 'curtain' ? 'curtain' : 'blind'][0];

export const windowRoomFor = (url: string | null): WindowRoom | undefined =>
  Object.values(WINDOW_ROOMS).flat().find(room => room.url === url);

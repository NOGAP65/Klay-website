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
      url: '/images/visualiser/rooms/curtain-open-plan-living.webp',
      name: 'Living room sliding doors',
      corners: [[0.056, 0.055], [0.944, 0.055], [0.944, 0.748], [0.056, 0.748]],
    },
    {
      url: '/images/visualiser/rooms/curtain-bedroom.webp',
      name: 'Wall-to-wall bedroom',
      corners: [[0.052, 0.099], [0.946, 0.099], [0.946, 0.762], [0.052, 0.762]],
    },
  ],
  blind: [
    {
      url: '/images/visualiser/preview.png',
      name: 'Original bedroom',
      corners: [[0.1918, 0.1989], [0.5841, 0.2492], [0.5830, 0.6382], [0.1864, 0.6699]],
    },
    {
      url: '/images/visualiser/rooms/blind-courtyard-living.webp',
      name: 'Courtyard living room',
      corners: [[0.155, 0.138], [0.838, 0.138], [0.838, 0.605], [0.155, 0.605]],
    },
    {
      url: '/images/visualiser/rooms/blind-coastal-living.webp',
      name: 'Coastal living room',
      corners: [[0.172, 0.106], [0.860, 0.106], [0.860, 0.609], [0.172, 0.609]],
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

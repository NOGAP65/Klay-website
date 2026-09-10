import { FINISH_TEXTURE, WARDROBE_COLOURS } from '../../visualiser/wardrobes';

/** PDF layouts retained; finishes follow Stegbar's website at the user's request. */
export const WALK_IN_LAYOUTS = [
  { id: 'LS01', name: 'Forma 4', shape: 'L-shaped', drawers: 4,
    description: 'Shelf tower, double hanging and a drawer tower around a corner.' },
  { id: 'US01', name: 'Forma 5', shape: 'U-shaped', drawers: 8,
    description: 'Two shelf towers, double hanging and twin drawer towers at the back.' },
] as const;

// Share the three offered board finishes with built-in wardrobes.
export const WALK_IN_COLOURS = WARDROBE_COLOURS.map(finish => ({
  ...finish, texture: FINISH_TEXTURE[finish.slug],
}));
export const WALK_IN_HARDWARE = [
  { id: 'T23 Inox', name: 'Inox', hex: '#C5C6C4' },
  { id: 'T24 Brushed Matt Black', name: 'Brushed Matt Black', hex: '#292929' },
  { id: 'T25 Brushed Brass', name: 'Brushed Brass', hex: '#B8A080' },
];
export const walkInFinish = (name?: string) => WALK_IN_COLOURS.find(f => f.name === name) ?? WALK_IN_COLOURS[0];
export const walkInHardware = (id?: string) => WALK_IN_HARDWARE.find(f => f.id === id) ?? WALK_IN_HARDWARE[0];
export const WALK_IN_FOOTPRINT_MM = 2400;
// User's fixed 2m height overrides the supplier's 2016mm overall height.
export const WALK_IN_HEIGHT_MM = 2000;
export const WALK_IN_DEPTH_MM = 447;
export const walkInLayout = (id?: string) => WALK_IN_LAYOUTS.find(layout => layout.id === id) ?? WALK_IN_LAYOUTS[0];
export const walkInSpecifications = (id?: string) => [
  { label: 'Layout', value: walkInLayout(id).shape },
  { label: 'Footprint', value: `${WALK_IN_FOOTPRINT_MM} × ${WALK_IN_FOOTPRINT_MM} mm` },
  { label: 'Height', value: `${WALK_IN_HEIGHT_MM} mm` },
  { label: 'Shelf depth', value: `${WALK_IN_DEPTH_MM} mm` },
];

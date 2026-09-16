import { FINISH_TEXTURE, WARDROBE_COLOURS, WALK_IN_HARDWARE } from '@/features/joinery';

export { WALK_IN_LAYOUTS, WALK_IN_HARDWARE, WALK_IN_FOOTPRINT_MM, WALK_IN_HEIGHT_MM,
  WALK_IN_DEPTH_MM, walkInLayout, walkInSpecifications } from '@/features/joinery';

// Share the three offered board finishes with built-in wardrobes.
export const WALK_IN_COLOURS = WARDROBE_COLOURS.map(finish => ({
  ...finish, texture: FINISH_TEXTURE[finish.slug],
}));
export const walkInFinish = (name?: string) => WALK_IN_COLOURS.find(f => f.name === name) ?? WALK_IN_COLOURS[0];
export const walkInHardware = (id?: string) => WALK_IN_HARDWARE.find(f => f.id === id) ?? WALK_IN_HARDWARE[0];

/** Shared product specifications for the shop, visualiser and enquiries. */
export const WALK_IN_LAYOUTS = [
  { id: 'LS01', name: 'Forma 4', shape: 'L-shaped', drawers: 4,
    description: 'Shelf tower, double hanging and a drawer tower around a corner.' },
  { id: 'US01', name: 'Forma 5', shape: 'U-shaped', drawers: 8,
    description: 'Two shelf towers, double hanging and twin drawer towers at the back.' },
] as const;

export const WALK_IN_FOOTPRINT_MM = 2400;
export const WALK_IN_HEIGHT_MM = 2000;
export const WALK_IN_DEPTH_MM = 447;
export const walkInLayout = (id?: string) => WALK_IN_LAYOUTS.find(layout => layout.id === id) ?? WALK_IN_LAYOUTS[0];
export const walkInSpecifications = (id?: string) => [
  { label: 'Layout', value: walkInLayout(id).shape },
  { label: 'Footprint', value: `${WALK_IN_FOOTPRINT_MM} × ${WALK_IN_FOOTPRINT_MM} mm` },
  { label: 'Height', value: `${WALK_IN_HEIGHT_MM} mm` },
  { label: 'Shelf depth', value: `${WALK_IN_DEPTH_MM} mm` },
];

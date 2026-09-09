/** Signature PDF pp. 23–25 takes precedence over the separate Galleria DIY range. */
export const WALK_IN_LAYOUTS = [
  { id: 'LS01', name: 'Forma 4', shape: 'L-shaped', drawers: 4,
    description: 'Shelf tower, double hanging and a drawer tower around a corner.' },
  { id: 'US01', name: 'Forma 5', shape: 'U-shaped', drawers: 8,
    description: 'Two shelf towers, double hanging and twin drawer towers at the back.' },
] as const;

export const WALK_IN_COLOURS = [{ name: 'Whiteboard', hex: '#F6F6F6' }];
export const WALK_IN_HARDWARE = [
  { name: 'White', hex: '#F6F6F6' },
  { name: 'Polished Silver', hex: '#D3D7DB' },
  { name: 'Black', hex: '#2B2B2D' },
];
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

/** Traced metal only. The white plastic rail sockets remain white. */
export const WALK_IN_METAL: Record<string, string> = {
  LS01: [
    'M159 218L370 237V244L159 225Z', 'M392 241L510 251V258L392 248Z',
    'M543 258L606 237V244L543 265Z', 'M643 226L769 185V193L643 234Z',
    'M159 457L369 455V462L159 464Z', 'M644 461L769 467V474L644 469Z',
    'M821 488L870 490V496L821 494Z', 'M821 562L870 568V575L821 569Z',
    'M821 637L870 646V653L821 644Z', 'M821 713L870 727V734L821 720Z',
  ].join(' '),
  US01: [
    'M181 201L224 227V234L181 208Z', 'M252 243L270 255V262L252 250Z',
    'M285 260H402V266H285Z', 'M618 260H735V266H618Z',
    'M750 257L768 244V251L750 264Z', 'M796 228L838 201V209L796 235Z',
    'M181 444L223 440V447L181 452Z', 'M252 438L270 435V442L252 445Z',
    'M749 436L768 438V445L749 443Z', 'M796 440L839 445V452L796 448Z',
    ...[443,489,535,581].flatMap(y => [438,545].map(x => `M${x} ${y}h37v6h-37Z`)),
  ].join(' '),
};

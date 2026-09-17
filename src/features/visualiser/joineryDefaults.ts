import type { WardrobeKind } from '@/features/joinery';

export const joineryDefaults = (kind: WardrobeKind) => ({
  wardrobeKind: kind,
  wardrobeModel: kind === 'shelving' ? 'LIN02' : kind === 'walk-in' ? 'LS01' : 'SRSTDH02',
  wardrobeWidthMm: kind === 'walk-in' ? 2400 : 1800,
  wardrobeColour: 'Matt Polar White',
  wardrobeHandleFinish: kind === 'walk-in' ? 'Brushed Matt Black' : 'Black',
});

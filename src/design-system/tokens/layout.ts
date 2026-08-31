// ---------------------------------------------------------------------------
// LAYOUT RHYTHM AND CONTAINERS
//
// Extracted verbatim from src/theme.ts in Phase 2.2a of the architecture
// migration. Content is byte-identical to what it replaced — this was a move,
// not a rewrite, and the reasoning in the comments below is the original's.
// ---------------------------------------------------------------------------

import { space } from './space';

import type { Style } from './style';

/** Section rhythm. Both vertical values are scale steps: `xxl` (84) is the
 * standard section, `xxxl` (136) is reserved for the two focal sections. 80px
 * inline matches the hero's own inset so every section's copy starts on the
 * same vertical line. */
export const layout = {
  /** Content never runs edge to edge. */
  containerMax: 1200,
  /** Wider cap for image grids, where the photographs are the content and a
   * 1200px cap would shrink them below the point of being persuasive. */
  gridMax: 1440,
  /** The standard section. Mobile compresses the vertical — 84px of dead space
   * on a phone reads as a loading error rather than as luxury — but both values
   * stay on the scale. */
  sectionPad: (isMobile: boolean) =>
    isMobile ? `${space.section}px ${space.item}px` : `${space.band}px 80px`,
  /** The two focal sections: the visualiser and the closing CTA. */
  sectionPadFocal: (isMobile: boolean) =>
    isMobile ? `${space.band}px ${space.item}px` : `${space.focal}px 80px`,
  /** Every full-bleed section's content inset. Mobile was 24, which is not on
   * the scale; 20 is. */
  inlinePad: (isMobile: boolean) => (isMobile ? space.item : 80),
};

/** One container, centred. */
export const container = (max: number = layout.containerMax): Style => ({
  maxWidth: max,
  marginLeft: 'auto',
  marginRight: 'auto',
  width: '100%',
});

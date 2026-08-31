// ---------------------------------------------------------------------------
// INTERACTION TIMING, AND THE EASING HELPERS THAT GO WITH IT
//
// Extracted verbatim from src/theme.ts in Phase 2.2a of the architecture
// migration. Content is byte-identical to what it replaced — this was a move,
// not a rewrite, and the reasoning in the comments below is the original's.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Interaction timings — one duration per class of feedback, so hovers across
// the site feel like one system rather than fourteen independent guesses.
// ---------------------------------------------------------------------------

export const motion = {
  /** Cards: lift and scale. Slow enough to read as weight. */
  card: 'transform 0.4s ease, box-shadow 0.4s ease',
  /** Buttons: fast, so the click feels acknowledged immediately. */
  button: 'background 0.2s ease, opacity 0.2s ease, border-color 0.2s ease, color 0.2s ease',
  /** Links: colour only. */
  link: 'color 0.2s ease, border-color 0.2s ease',
};

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* lerp and easeOutCubic are general maths rather than design tokens, and
 * belong in shared/utils. They sit here for now because Phase 2 does not
 * create shared/ — see MIGRATION_MAP.md. lerp has ten call sites, all of
 * them inside the frozen visualiser. */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

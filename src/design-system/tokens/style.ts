// ---------------------------------------------------------------------------
// THE SHARED STYLE TYPE
//
// Extracted verbatim from src/theme.ts in Phase 2.2a of the architecture
// migration. Content is byte-identical to what it replaced — this was a move,
// not a rewrite, and the reasoning in the comments below is the original's.
// ---------------------------------------------------------------------------

/** A plain style object, spread at the point of use. Every token group that
 *  produces one imports this rather than redeclaring it. */
export type Style = Record<string, string | number>;

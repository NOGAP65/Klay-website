// ---------------------------------------------------------------------------
// THE DESIGN SYSTEM'S PUBLIC ENTRANCE — `@/ds`.
//
// SPECIFICATION.md §2: this layer may import nothing except itself. It knows
// nothing about blinds, prices or customers, and if a token here ever needs a
// domain noun to explain itself, it is not a token.
//
// Re-exports only. §4: "index.ts re-exports and contains no logic."
// ---------------------------------------------------------------------------

export * from './tokens';
export * from './primitives';

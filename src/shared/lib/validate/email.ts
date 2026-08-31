// ---------------------------------------------------------------------------
// Email shape validation.
//
// THIS EXISTS BECAUSE THERE WERE THREE COPIES OF THE SAME REGULAR EXPRESSION:
//
//   src/pages/BookInstallPage.tsx:120
//   src/pages/ContactPage.tsx:70
//   netlify/lib/booking.ts:48
//
// All three identical, all three written independently, none knowing about the
// others. That is The Silent Divergence — SPECIFICATION.md §13: "Two copies of
// the same constant, table or rule. Both correct when written, one updated six
// months later."
//
// The pattern is unchanged from what those three shared. Deliberately
// permissive: one @, no spaces, a dot in the domain. Anything stricter starts
// rejecting addresses that genuinely deliver, and the only real test of an
// email address is sending to it.
//
// ---------------------------------------------------------------------------
// THE THIRD COPY IS STILL THERE, AND IT HAS TO BE FOR NOW.
//
// netlify/lib/booking.ts is server-side, and this module is in src/shared/,
// which a Netlify function may not import — §2 gives `shared` no route into
// the server, and ADR-014 reserves cross-runtime code for shared-core/.
//
// So this de-duplicates the two CLIENT copies and leaves the server's alone.
// The server's is the authoritative one either way: the client checks are
// described in their own code as "courtesy, not the boundary".
//
// If a fourth copy is ever needed on both sides, the answer is shared-core/,
// not an import across the runtime boundary.
// ---------------------------------------------------------------------------

/** One @, no spaces, a dot in the domain. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

// ---------------------------------------------------------------------------
// scrollToId — smooth-scroll to an element id, as an event handler.
//
// Passes the 0.2 lift test outright: it names no Klay noun and would work
// unmodified in any project with anchors on a page.
//
// Split out of src/components/home/primitives.tsx at P4-6, decision F. That
// file was 811 lines and eleven exports doing four unrelated jobs: design
// primitives with no product knowledge, two section patterns, a scroll helper,
// and a catalogue tile that knows about prices and swatch rows. Content is
// unchanged — this was a move, and the reasoning in the comments is the
// original's.
// ---------------------------------------------------------------------------

/** Smooth-scrolls to a section on this page. Both hero CTAs and the closing
 * CTA point back into the page rather than navigating away — the visualiser is
 * the conversion surface and it is already here. */
export const scrollToId = (id: string) => () => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

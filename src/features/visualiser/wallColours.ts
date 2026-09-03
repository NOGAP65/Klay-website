// ---------------------------------------------------------------------------
// THE WALL THE JOINERY GOES AGAINST.
//
// The 3D view builds its own room — a wall with an opening in it, the back of
// the recess, a floor — and that room was one fixed off-white. Which is fine
// for showing the product and useless for the question a customer actually
// asks, which is not "what does this look like" but "what does this look like
// IN MY ROOM". A white robe against an off-white wall and a white robe against
// a deep green one are two very different pictures, and the second is the one
// that decides whether they buy.
//
// TWO WAYS IN, because there are two kinds of customer. Most people know their
// wall is "one of the whites" and want to click the nearest; some know exactly,
// because they have the tin. So there is a short list of the colours Australian
// walls are actually painted, and a full picker beside it for anyone who knows
// their own.
//
// WHY THESE EIGHT. They are the colours that turn up on the wall in an
// Australian house, in the order they turn up: four whites and off-whites that
// cover the great majority of interiors, two greys, one warm mid tone and one
// deep colour to stand for the feature wall. The names are the ones a customer
// will recognise from a swatch card.
//
// EDITORIAL, and worth saying plainly: these are read off published colour
// swatches rather than measured off a painted wall, and a paint chip
// photographs differently from two coats on plaster under a window. They are
// close enough to choose between, which is what they are for. They are not a
// colour match, and nothing here should be presented as one.
// ---------------------------------------------------------------------------

export interface WallColour {
  name: string;
  hex: string;
}

/** The short list. Lightest first, which is also commonest first. */
export const WALL_COLOURS: WallColour[] = [
  { name: 'Vivid White', hex: '#f8f8f5' },
  { name: 'Natural White', hex: '#f2efe6' },
  { name: 'Antique White', hex: '#ece5d7' },
  { name: 'Lexicon', hex: '#eef0f0' },
  { name: 'Silkwort', hex: '#ddd9d0' },
  { name: 'Tranquil Retreat', hex: '#c9c8c1' },
  { name: 'Hog Bristle', hex: '#cdc3ab' },
  { name: 'Domino', hex: '#5c5f5c' },
];

/** What the room opens on — the off-white the scene was fixed at before this
 * was a choice, so nothing about the default render changes. */
export const DEFAULT_WALL_COLOUR = '#f2efe6';

/** The name to show beside the swatch, or "Custom" for anything off the list.
 *
 * Compared case-insensitively on the hex, because the colour input hands back
 * lower case and the table is written in whatever case reads best. */
export const wallColourName = (hex: string): string =>
  WALL_COLOURS.find(c => c.hex.toLowerCase() === hex.toLowerCase())?.name ?? 'Custom';

// ---------------------------------------------------------------------------
// THE LIVE CHANNEL, and it exists because React is too expensive to put in a
// drag loop.
//
// Dragging the wheel fires a colour on every pointer move. Sent through the
// store, each one re-renders every component that reads it — and the visualiser
// components subscribe to the whole store rather than to a slice, so that is
// the configurator, the control panel and every pill and swatch in them.
// Measured at 4x CPU throttle: 97ms per colour, against a 16ms frame. The scene
// was not rebuilding by then; the cost was entirely React.
//
// So the drag does not go through React at all. The chip publishes here, the
// turntable subscribes and repaints the materials imperatively, and the store
// is written once when the drag settles — which is the only write anything
// needs to re-render for, because it is the only one that changes what is
// remembered.
//
// A Set of callbacks rather than an event target or a store: this is one value
// with one publisher, and anything more would be scaffolding around a
// three-line problem.
// ---------------------------------------------------------------------------

type WallColourListener = (hex: string) => void;
const listeners = new Set<WallColourListener>();

/** Push a colour straight at whatever is rendering, bypassing React. */
export const publishWallColour = (hex: string) => {
  for (const l of listeners) l(hex);
};

/** Listen for those. Returns its own unsubscribe, for an effect's cleanup. */
export const onWallColour = (l: WallColourListener) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};

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

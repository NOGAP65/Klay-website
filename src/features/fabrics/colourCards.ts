// Fabric and hardware colour cards shared by the catalogue and visualiser.
export const RYNAMIC_COLOURS = [
  { name: 'White', hex: '#F2F0EC' },
  { name: 'Surfmist', hex: '#E8E4DC' },
  { name: 'Light Grey', hex: '#C8C4BC' },
  { name: 'Dune', hex: '#C4A882' },
  { name: 'Cream', hex: '#EDE0C8' },
  { name: 'Sand', hex: '#D4BC98' },
  { name: 'Beige', hex: '#C8B090' },
  { name: 'Forest Green', hex: '#2C4A30' },
  { name: 'Red', hex: '#8C2820' },
  { name: 'Brown', hex: '#6C4830' },
  { name: 'Black', hex: '#303030' },
  { name: 'Deep Ocean Blue', hex: '#1C3048' },
  { name: 'Woodland Grey', hex: '#686460' },
  { name: 'Monument', hex: '#4C4844' },
]

// The CURTAIN colour card. Every hex here was SAMPLED, not chosen: each is the
// mean colour of the centre of a real fabric swatch photograph, measured off the
// swatch imagery of four ranges on the Australian market. Two things that came
// out of doing it by measurement rather than by eye, both worth recording
// because intuition gets them wrong:
//
//   1. THE RANGE IS NEUTRALS. Whites, greiges, greys, charcoals, blacks, and
//      essentially nothing else — not one range carried a green, a red or a
//      blue. Curtains are a large soft furnishing and are specified to disappear
//      into the wall, which is not how a blind is chosen.
//
//   2. FABRIC IS NEVER PAPER-WHITE. The lightest swatch found anywhere measured
//      0.905 luminance. Curtain cloth is woven and lined, and it always reads
//      slightly down from white.
//
// Ordered by luminance, brightest first, and alternating warm against cool
// wherever two sit close together — the real ranges do the same, because a
// customer choosing between two near-identical lightnesses is choosing on
// undertone. The ordering also matters to the renderer: sheer density is driven
// off this value, so an evenly spaced ramp is what exercises it evenly.
//
// The names are the trade's generic colour vocabulary — Ivory, Concrete, Pewter,
// Flint, Charcoal and so on. Deliberately none of the distinctive product names
// a particular range uses for its own patterns, which are its branding rather
// than descriptions of a colour.
/** SLAT AND LOUVRE COLOURS — venetians and plantation shutters.
 *
 * A different range from the fabrics, because these are painted or stained
 * boards rather than woven cloth: the neutrals run cooler and the timbers are
 * real timber rather than a print of one. Seven, which is what a slat range
 * usually is — a fabric book runs to dozens because cloth is cheap to dye and a
 * powder-coat line is not.
 *
 * NEEDS A COMMERCIAL CHECK. These are the colours the range plainly ought to
 * carry, not a list read off a supplier's card, and the two timbers in
 * particular are named rather than matched. A wrong hex here is a customer
 * choosing a colour Klay does not sell.
 */
export const SLAT_COLOURS = [
  { name: 'White', hex: '#F4F3F0' },
  { name: 'Ivory', hex: '#E9E4D9' },
  { name: 'Stone', hex: '#CFCCC6' },
  { name: 'Silver', hex: '#AFAFAD' },
  { name: 'Charcoal', hex: '#4A4A48' },
  { name: 'Light Oak', hex: '#C0A075' },
  { name: 'Walnut', hex: '#7A5638' },
]

export const CURTAIN_COLOURS = [
  { name: 'White', hex: '#E7E7E6' },     // 0.905
  { name: 'Whisper', hex: '#DEDFDD' },   // 0.872 · cool
  { name: 'Ivory', hex: '#D9D5CD' },     // 0.836 · warm
  { name: 'Sand', hex: '#D3CBBB' },      // 0.798 · warm
  { name: 'Mineral', hex: '#C8C8C6' },   // 0.783 · neutral
  { name: 'Concrete', hex: '#B8B8B8' },  // 0.722 · neutral
  { name: 'Barley', hex: '#BEB5A1' },    // 0.711 · warm
  { name: 'Truffle', hex: '#B2AD9E' },   // 0.678 · greige
  { name: 'Silver', hex: '#A7AAA5' },    // 0.661 · cool
  { name: 'Baltic', hex: '#9D9C9B' },    // 0.612 · neutral
  { name: 'Pewter', hex: '#908E8C' },    // 0.558 · warm
  { name: 'Dune', hex: '#8A7C73' },      // 0.499 · warm brown
  { name: 'Flint', hex: '#6F6F6E' },     // 0.435 · neutral
  { name: 'Wallaby', hex: '#554B44' },   // 0.303 · deep brown
  { name: 'Ebony', hex: '#3B3B3C' },     // 0.232
  { name: 'Charcoal', hex: '#2E2E2F' },  // 0.181
  { name: 'Black', hex: '#131415' },     // 0.078
]


// The three hardware finishes. Single source for the swatch UI, the store's
// hex lookup and the canvas renderer's flat fill — these were previously
// written out separately in all three places. Black is the brand charcoal.
export const HARDWARE_HEX = {
  white: '#EDEDED',
  black: '#303030',
  chrome: '#B0AEA8',
} as const

export const HARDWARE_OPTIONS = [
  { id: 'white', label: 'White' },
  { id: 'black', label: 'Black' },
  { id: 'chrome', label: 'Chrome' },
] as const

// D-07 — ONE SOURCE, RE-EXPORTED. This used to be a second declaration of 150,
// beside the one in lib/pricing.ts that the money actually uses. A price shown to
// a customer diverging from the price charged is a customer-facing failure, not a
// code-quality one, so it is re-exported rather than repeated: there is now one
// place to change the motorisation charge, and this file cannot disagree with it.
export { MOTORISED_ADDON } from '@/core/pricing'

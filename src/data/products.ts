// ---------------------------------------------------------------------------
// WHAT IS LEFT OF data/products.ts, AND WHY IT IS STILL HERE.
//
// This file used to hold three unrelated tables — the four roller SKUs, the
// fabric colour cards, and the hardware map. Decision H said to split it by
// consumer: SKUs to catalogue, colour cards and hardware to the visualiser.
//
// HALF OF THAT HAPPENED AT P4-5. The SKUs, the ranges and the counts moved to
// features/catalogue/products.ts, because nothing in the visualiser imports
// them. What is below could not move, and the reason is not architectural
// preference — it is ADR-020.
//
// SIX FILES IMPORT THESE FOUR SYMBOLS, AND ALL SIX ARE OUT OF SCOPE:
//
//   RYNAMIC_COLOURS    visualiser/useVisualiserStore.ts, visualiser-lab/ ditto
//   CURTAIN_COLOURS    visualiser/useVisualiserStore.ts, visualiser-lab/ ditto
//   HARDWARE_HEX       visualiser/Canvas2DBlindRenderer.tsx, useVisualiserStore.ts,
//                      VisualiserControls.tsx, and all three visualiser-lab twins
//   HARDWARE_OPTIONS   visualiser/VisualiserControls.tsx, visualiser-lab/ ditto
//
// ADR-020 removed the visualiser from this migration and withdrew permission to
// edit those files FOR ANY REASON — an import rewrite included. Moving this
// file would mean editing their import lines. So it stays exactly where it is,
// at exactly this path, under exactly this name. E-10.
//
// WHAT HAPPENS AT VISUALISER MIGRATION. These four go with it, into
// features/visualiser/, and the catalogue consumes the colour cards through the
// visualiser's barrel — the second half of decision H, unblocked by the same
// event that unblocks everything else in that zone. Until then, features/
// catalogue importing RYNAMIC_COLOURS and CURTAIN_COLOURS from this path is a
// permanent feature -> legacy edge, counted as such by tools/legacy-countdown.mjs
// and NOT expected to fall.
//
// DO NOT ADD ANYTHING TO THIS FILE. Its only remaining job is to be importable
// by frozen code. Anything new that looks like it belongs here belongs in
// features/catalogue/products.ts instead.
//
// AND THE ONE THING BELOW THAT IS NOT COLOUR DATA. MOTORISED_ADDON is a price,
// it has zero consumers, and src/lib/pricing.ts declares its own copy of the
// same 150 — which is the one the money actually uses. It did not move to
// catalogue with the rest, because a dead duplicate of a pricing constant does
// not become catalogue data by being relocated into a feature. D-07.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// FABRIC COLOURS — a separate range per product category
//
// Blinds and curtains are different cloth from different mills, so they do not
// share a colour card, and the two lists below are deliberately independent.
// Resolution is always by (category, name): see the visualiser store's
// coloursFor / getFabricColor.
//
// One consequence to keep in mind. A few names appear in BOTH lists at
// different hexes — Dune is a warm tan on a blind and a deep brown on a
// curtain, Sand and White differ slightly too. A colour name is therefore no
// longer unique on its own, so anything that persists or transmits a colour has
// to carry the category with it to be unambiguous. Cart lines and booking links
// both already record the product, so they resolve correctly; just do not add a
// lookup that takes a bare name and assumes it can find the hex.
// ---------------------------------------------------------------------------

// The authoritative Rynamic colour map, for ROLLER BLINDS. These hexes are the
// literal base colour the visualiser renders the fabric as (see
// Canvas2DBlindRenderer's fragment shader) as well as the swatch shown in the
// configurator controls — the two must never drift apart, so there is exactly
// one list.
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

export const MOTORISED_ADDON = 150

// ---------------------------------------------------------------------------
// THE FIVE BLIND TYPES — one listing page each, under /blinds/<slug>.
//
// data/categories.ts already names these five as Indoor subcategories; what it
// does not carry is anything a LISTING page needs — a hero, an intro, a filter
// set, what is actually on the shelf, or the questions a customer asks about
// that specific mechanism. That is what this file adds. The names and taglines
// are still read back out of the taxonomy so the two cannot disagree.
//
// TWO KINDS OF CARD, AND THE DIFFERENCE IS NOT COSMETIC.
//
//   `buyable` items carry a product slug and a from-price, and the card's button
//     is DESIGN YOURS → /products/<slug>, the configurator. Only roller blinds
//     have any: Dusk, Veil, Duo and Haze are the entire priced catalogue.
//
//   `enquiry` items carry neither. Venetian, roman, vertical and panel blinds are
//     products Klay sells and has never had a SKU list or a price grid for, so
//     their cards name the real finish or fabric, say PRICE ON MEASURE, and the
//     button is GET A QUOTE → /contact with the item named in the message.
//
// The alternative was to invent four price grids so every card could say "From
// $x", and a made-up price on a made-to-measure product is a number the business
// then has to honour. An item becomes buyable by gaining a `productSlug` and a
// `priceFrom` here and a matching entry in data/products.ts — nothing in the page
// changes.
//
// NO PHOTOGRAPHY EXISTS for venetian, roman, vertical or panel blinds. Every
// frame in public/images is a roller or a curtain. Those cards therefore render
// as a charcoal panel with the item's fabric named across it — the same way the
// homepage's Awnings and Screens tiles handle the same gap — rather than showing
// a photograph of a roller blind under the word "Venetian".
// ---------------------------------------------------------------------------

import { PRODUCTS } from './products'
import { getSubcategoryBySlug } from './categories'

export interface BlindItem {
  /** Unique within its type. Doubles as the React key and the enquiry subject. */
  id: string
  name: string
  /** The eyebrow above the name — the fabric or the finish, in caps on the card. */
  label: string
  tagline: string
  /** Which filter pill shows this item. Must be one of the type's `filters`. */
  filter: string
  /** Present only on buyable items — the /products/<slug> the card opens. */
  productSlug?: string
  /** Present only on buyable items. Cards without one say PRICE ON MEASURE. */
  priceFrom?: number
  /** Omitted where no photograph of this product exists, which is everything
   * that is not a roller. See the note at the top of the file. */
  image?: string
}

export interface BlindType {
  /** The URL: /blinds/<slug>. Matches the subcategory slug in categories.ts. */
  slug: string
  /** Read off the taxonomy — see `nameFor`. */
  name: string
  /** Under the H1 in the hero. One sentence on what this mechanism is for. */
  intro: string
  /** The hero photograph, where one exists — which today means rollers only.
   * Without it the hero is a charcoal band carrying the mechanism drawing (see
   * components/BlindGlyph) rather than a photograph of a roller blind under the
   * word "Venetian". */
  heroImage?: string
  heroPosition?: string
  /** The pills in the filter bar, in order. 'All' is prepended by the page, so
   * this is only the real distinctions within the type. */
  filters: { id: string; label: string }[]
  items: BlindItem[]
  /** Questions specific to this mechanism. The four generic ones — process,
   * lead time, coverage, warranty — are appended from SHARED_FAQS below, so
   * they are written once rather than five times. */
  faqs: { q: string; a: string }[]
}

/** Names and taglines come from the taxonomy rather than being retyped. A blind
 * type renamed in categories.ts renames here too. */
const nameFor = (slug: string, fallback: string) =>
  getSubcategoryBySlug('indoor', slug)?.name ?? fallback

const productItem = (slug: string, filter: string): BlindItem => {
  const p = PRODUCTS.find(x => x.slug === slug)
  if (!p) throw new Error(`blindTypes: no product "${slug}" in the catalogue`)
  return {
    id: p.slug,
    name: p.name,
    label: p.type,
    tagline: p.tagline,
    filter,
    productSlug: p.slug,
    priceFrom: p.priceFrom,
    image: p.image,
  }
}

/** The four questions every listing page asks, because the answer is about Klay
 * rather than about the mechanism. Appended after each type's own. */
const SHARED_FAQS = [
  {
    q: 'How does the process work?',
    a: 'Configure or enquire online. A technician measures at your home. We manufacture to those measurements. The same technician returns to install — no sales reps, no showroom trip.',
  },
  {
    q: 'How long does it take?',
    a: 'After your in-home measure, manufacturing typically takes 2–3 weeks. Installation is scheduled at a time that suits you.',
  },
  {
    q: 'Do you service my area?',
    a: 'We currently service all of metropolitan Melbourne and greater Victoria. Contact us for regional availability.',
  },
  {
    q: 'What warranty do you offer?',
    a: 'Five years on manufacturing defects, and our installation workmanship is guaranteed.',
  },
]

const TYPES: BlindType[] = [
  {
    slug: 'roller-blinds',
    name: nameFor('roller-blinds', 'Roller Blinds'),
    intro: 'Clean lines, simple elegance. Four fabric types for different ways of living with light.',
    heroImage: '/images/lifestyle/room-living.png',
    heroPosition: 'center',
    filters: [
      { id: 'blockout', label: 'Blockout' },
      { id: 'sunscreen', label: 'Sunscreen' },
      { id: 'lightfilter', label: 'Light Filter' },
      { id: 'dual', label: 'Dual' },
    ],
    items: [
      productItem('dusk', 'blockout'),
      productItem('veil', 'sunscreen'),
      productItem('duo', 'dual'),
      productItem('haze', 'lightfilter'),
    ],
    faqs: [
      {
        q: 'What are roller blinds?',
        a: 'The modern classic. A single panel of fabric on a spring-loaded or chain-operated roller. Clean, minimal, and effective at controlling light and privacy.',
      },
      {
        q: 'What fabric types are available?',
        a: 'Four: Blockout for total darkness, Sunscreen to keep the view while cutting glare, Light Filter for a soft diffused glow, and Dual, which carries a sunscreen and a blockout layer on the one bracket.',
      },
    ],
  },

  {
    slug: 'venetian-blinds',
    name: nameFor('venetian-blinds', 'Venetian Blinds'),
    intro: 'Horizontal slats that tilt. The only window covering that lets you keep the light and lose the view at the same time.',
    filters: [
      { id: 'aluminium', label: 'Aluminium' },
      { id: 'timber', label: 'Timber' },
      { id: 'faux', label: 'Faux Timber' },
    ],
    items: [
      {
        id: 'aluminium-25',
        name: '25mm Aluminium',
        label: 'Aluminium Venetian',
        tagline: 'Slim slats. The narrowest tilt we make.',
        filter: 'aluminium',
      },
      {
        id: 'aluminium-50',
        name: '50mm Aluminium',
        label: 'Aluminium Venetian',
        tagline: 'Wider slats, fewer lines across the glass.',
        filter: 'aluminium',
      },
      {
        id: 'timber-50',
        name: '50mm Basswood',
        label: 'Timber Venetian',
        tagline: 'Real timber, stained or painted.',
        filter: 'timber',
      },
      {
        id: 'timber-63',
        name: '63mm Basswood',
        label: 'Timber Venetian',
        tagline: 'The widest timber slat. Closest to a shutter.',
        filter: 'timber',
      },
      {
        id: 'faux-50',
        name: '50mm Faux Timber',
        label: 'Faux Timber Venetian',
        tagline: 'The timber look, built for wet rooms.',
        filter: 'faux',
      },
    ],
    faqs: [
      {
        q: 'What are venetian blinds?',
        a: 'Horizontal slats on a ladder cord, raised as one stack and tilted independently. Tilting is what makes them different from every other blind: you can hold privacy at eye level and still let the ceiling fill with daylight.',
      },
      {
        q: 'Timber or aluminium?',
        a: 'Timber is warmer and heavier, and it suits living and sleeping rooms. Aluminium is thinner, lighter and takes a wider span. Faux timber is the answer for bathrooms, laundries and above a kitchen sink, where real timber will eventually move.',
      },
    ],
  },

  {
    slug: 'roman-blinds',
    name: nameFor('roman-blinds', 'Roman Blinds'),
    intro: 'Soft folds that stack flat against the head of the window. The softest-looking blind, and the closest to a curtain.',
    filters: [
      { id: 'blockout', label: 'Blockout' },
      { id: 'lightfilter', label: 'Light Filter' },
      { id: 'textured', label: 'Textured' },
    ],
    items: [
      {
        id: 'roman-blockout',
        name: 'Blockout Lined',
        label: 'Roman Blind',
        tagline: 'Blockout backing behind the face fabric.',
        filter: 'blockout',
      },
      {
        id: 'roman-thermal',
        name: 'Thermal Lined',
        label: 'Roman Blind',
        tagline: 'An insulating interlining against heat and cold.',
        filter: 'blockout',
      },
      {
        id: 'roman-lightfilter',
        name: 'Light Filter',
        label: 'Roman Blind',
        tagline: 'Daylight through the weave, privacy intact.',
        filter: 'lightfilter',
      },
      {
        id: 'roman-linen',
        name: 'Linen Weave',
        label: 'Textured Roman',
        tagline: 'Open natural weave with visible slub.',
        filter: 'textured',
      },
    ],
    faqs: [
      {
        q: 'What are roman blinds?',
        a: 'A flat panel of fabric that draws up into even horizontal folds. Down, it reads as one clean sheet of cloth; up, it stacks into a soft pelmet at the top of the window.',
      },
      {
        q: 'Do they block light?',
        a: 'With a blockout lining, close to it — the fabric itself is opaque, though a little light will always find the edges of a blind fitted inside the reveal. Fitted outside the reveal, on the face of the wall, the gap effectively closes.',
      },
    ],
  },

  {
    slug: 'vertical-blinds',
    name: nameFor('vertical-blinds', 'Vertical Blinds'),
    intro: 'Vertical louvres that draw aside and rotate. Made for the windows nothing else covers well — sliding doors and long spans of glass.',
    filters: [
      { id: 'blockout', label: 'Blockout' },
      { id: 'lightfilter', label: 'Light Filter' },
      { id: 'sunscreen', label: 'Sunscreen' },
    ],
    items: [
      {
        id: 'vertical-89-blockout',
        name: '89mm Blockout',
        label: 'Vertical Blind',
        tagline: 'The standard louvre, in an opaque fabric.',
        filter: 'blockout',
      },
      {
        id: 'vertical-127-blockout',
        name: '127mm Blockout',
        label: 'Vertical Blind',
        tagline: 'Wider louvre, fewer joins across a long span.',
        filter: 'blockout',
      },
      {
        id: 'vertical-89-lightfilter',
        name: '89mm Light Filter',
        label: 'Vertical Blind',
        tagline: 'Softens the light without closing the room.',
        filter: 'lightfilter',
      },
      {
        id: 'vertical-89-sunscreen',
        name: '89mm Sunscreen',
        label: 'Vertical Blind',
        tagline: 'Open weave — cuts glare, keeps the view.',
        filter: 'sunscreen',
      },
    ],
    faqs: [
      {
        q: 'What are vertical blinds?',
        a: 'Fabric louvres hanging from a top track. They rotate to control light and stack to one side or split to the centre, which is why they suit a doorway you actually walk through.',
      },
      {
        q: 'Why choose them over a roller?',
        a: 'Span and access. A roller over a four-metre sliding door is one very heavy blind you have to raise entirely to get outside. Verticals draw aside like a curtain and go back with one pull.',
      },
    ],
  },

  {
    slug: 'panel-blinds',
    name: nameFor('panel-blinds', 'Panel Blinds'),
    intro: 'Wide flat panels that glide past one another on a track. The quietest way to cover a very large opening.',
    filters: [
      { id: 'blockout', label: 'Blockout' },
      { id: 'lightfilter', label: 'Light Filter' },
      { id: 'sunscreen', label: 'Sunscreen' },
    ],
    items: [
      {
        id: 'panel-blockout',
        name: 'Blockout Panel',
        label: 'Panel Glide',
        tagline: 'Opaque panels, edge to edge when closed.',
        filter: 'blockout',
      },
      {
        id: 'panel-lightfilter',
        name: 'Light Filter Panel',
        label: 'Panel Glide',
        tagline: 'An even wash of daylight across the glass.',
        filter: 'lightfilter',
      },
      {
        id: 'panel-sunscreen',
        name: 'Sunscreen Panel',
        label: 'Panel Glide',
        tagline: 'Holds the view through the whole opening.',
        filter: 'sunscreen',
      },
      {
        id: 'panel-room-divider',
        name: 'Room Divider',
        label: 'Panel Glide',
        tagline: 'The same track, used to split a room.',
        filter: 'blockout',
      },
    ],
    faqs: [
      {
        q: 'What are panel blinds?',
        a: 'Large flat panels of fabric on a multi-channel track, sliding behind one another like a wardrobe door. Stacked, they take up very little of the opening.',
      },
      {
        q: 'How wide can they go?',
        a: 'Wider than any other fabric system we make — the track simply gains channels as the opening grows. They are the usual answer to a full wall of glass or a stacker door.',
      },
    ],
  },
]

/** Every type, with the shared questions appended once rather than repeated in
 * each entry above. */
export const BLIND_TYPES: BlindType[] = TYPES.map(t => ({
  ...t,
  faqs: [...t.faqs, ...SHARED_FAQS],
}))

export const blindTypeBySlug = (slug: string | undefined): BlindType | undefined =>
  BLIND_TYPES.find(t => t.slug === slug)

/** The type strip that sits under the hero on every one of these pages — it is
 * how you get from one blind type to its siblings, and until these pages exist
 * in the nav it is the only way to reach four of the five. */
export const BLIND_TYPE_LINKS = BLIND_TYPES.map(t => ({ slug: t.slug, name: t.name }))

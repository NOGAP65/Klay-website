// ---------------------------------------------------------------------------
// THE CATEGORY TAXONOMY — Indoor, Outdoor, Wardrobes.
//
// This replaces a Blinds / Curtains / Wardrobes split. The three top-level
// categories are now where the product LIVES rather than what it is made of,
// because that is the question the customer arrives with: they know which side
// of the glass they are shopping for long before they know a roman from a
// roller. Blinds and curtains sit together under Indoor as a result.
//
// One category, one page: /indoor, /outdoor, /wardrobes, all rendered by
// CategoryPage from the data here. The homepage links straight to them.
//
// `columns` is per-category on purpose. These grids are gapless and edge to
// edge, so a row that doesn't fill leaves holes in the middle of the block —
// nine indoor types close a 3-wide grid, six outdoor types close it too, and
// four wardrobe types close a 2-wide one. Adding a type means checking it still
// divides.
//
// ON `available` AND `priceFrom`. Only roller blinds are routed and buyable
// today; everything else is available:false and resolves to an enquiry. The two
// curtain types carry a priceFrom because those figures were specified, but they
// have nowhere to be sold yet either. A type gains a real destination by getting
// available:true and a route — see ProductsPage, which is the one place that
// mapping lives.
// ---------------------------------------------------------------------------

export interface SubCategory {
  slug: string
  name: string
  tagline: string
  /** Omitted where no photograph of this product type exists — which is most of
   * them. A tile with no image renders as charcoal with its tagline and a
   * COMING SOON rather than borrowing a picture of a different product. */
  image?: string
  available: boolean
  priceFrom?: number
}

export interface Category {
  slug: string
  name: string
  /** One line under the name on the homepage tile. */
  blurb: string
  /** The category page's own headline. */
  headline: string
  /** Grid columns for this category's page. See the note above. */
  columns: number
  /** Full-bleed image behind the homepage tile and the page's band. */
  image: string
  objectPosition: string
  subcategories: SubCategory[]
}

export const CATEGORIES: Category[] = [
  {
    slug: 'indoor',
    name: 'Indoor',
    blurb: 'Blinds, curtains and shutters',
    headline: 'Everything inside the glass.',
    columns: 3,
    image: '/images/categories/indoor.jpg',
    objectPosition: '62% center',
    subcategories: [
      {
        slug: 'roller-blinds',
        name: 'Roller Blinds',
        tagline: 'Clean lines. Simple elegance.',
        image: '/images/lifestyle/room-kitchen.png',
        available: true,
        priceFrom: 220,
      },
      { slug: 'venetian-blinds', name: 'Venetian Blinds', tagline: 'Classic slats. Total control.', available: false },
      { slug: 'roman-blinds', name: 'Roman Blinds', tagline: 'Soft folds. Timeless style.', available: false },
      { slug: 'vertical-blinds', name: 'Vertical Blinds', tagline: 'Made for wide windows.', available: false },
      { slug: 'panel-blinds', name: 'Panel Blinds', tagline: 'Modern sliding panels.', available: false },
      {
        slug: 'sheer-curtains',
        name: 'Sheer Curtains',
        tagline: 'Light softened, not blocked.',
        image: '/images/range/sheer-curtains.jpg',
        available: false,
        priceFrom: 360,
      },
      {
        slug: 'blockout-curtains',
        name: 'Blockout Curtains',
        tagline: 'Total darkness, edge to edge.',
        image: '/images/curtains-room.jpg',
        available: false,
        priceFrom: 320,
      },
      { slug: 'lined-curtains', name: 'Lined Curtains', tagline: 'Insulated comfort.', available: false },
      { slug: 'plantation-shutters', name: 'Plantation Shutters', tagline: 'Louvred, and built to last.', available: false },
    ],
  },
  {
    slug: 'outdoor',
    name: 'Outdoor',
    blurb: 'Awnings, screens and alfresco',
    headline: 'Take the room outside.',
    columns: 3,
    image: '/images/categories/outdoor.jpg',
    objectPosition: '50% center',
    subcategories: [
      { slug: 'folding-arm-awnings', name: 'Folding Arm Awnings', tagline: 'Shade on demand, no posts.', available: false },
      { slug: 'straight-drop-awnings', name: 'Straight Drop Awnings', tagline: 'Drops straight, stops low sun.', available: false },
      { slug: 'zip-screens', name: 'Zip Screens', tagline: 'Tracked edges. No gaps, no flap.', available: false },
      { slug: 'cafe-blinds', name: 'Café Blinds', tagline: 'Close the deck in, keep the view.', available: false },
      { slug: 'outdoor-roller-blinds', name: 'Outdoor Roller Blinds', tagline: 'Built for weather.', available: false },
      { slug: 'louvre-roofs', name: 'Louvre Roofs', tagline: 'Angle the sky.', available: false },
    ],
  },
  {
    slug: 'wardrobes',
    name: 'Wardrobes',
    blurb: 'Built-in, walk-in and storage',
    headline: 'Storage that disappears.',
    columns: 2,
    image: '/images/categories/wardrobes.jpg',
    objectPosition: '54% center',
    subcategories: [
      {
        slug: 'built-in-wardrobes',
        name: 'Built-in Wardrobes',
        tagline: 'Fitted wall to wall.',
        image: '/images/categories/wardrobes.jpg',
        available: false,
      },
      {
        slug: 'walk-in-robes',
        name: 'Walk-in Robes',
        tagline: 'A room for your clothes.',
        image: '/images/range/wardrobes.jpg',
        available: false,
      },
      { slug: 'sliding-doors', name: 'Sliding Doors', tagline: 'Space-saving elegance.', available: false },
      { slug: 'shelving-storage', name: 'Shelving & Storage', tagline: 'Open shelving, drawers and racks.', available: false },
    ],
  },
]

export const getCategoryBySlug = (slug: string | undefined): Category | undefined =>
  CATEGORIES.find(c => c.slug === slug)

export const getSubcategoryBySlug = (categorySlug: string, subSlug: string): SubCategory | undefined =>
  getCategoryBySlug(categorySlug)?.subcategories.find(s => s.slug === subSlug)

/** Every subcategory slug, flattened — ProductsPage uses this to check that the
 * slugs it resolves and the slugs that exist have not drifted apart. */
export const ALL_SUBCATEGORY_SLUGS = CATEGORIES.flatMap(c => c.subcategories.map(s => s.slug))

// NAV_CATEGORIES used to live here — the projection the nav read to build three
// Indoor/Outdoor/Wardrobes dropdowns. The nav is four flat links now and the
// shop owns the taxonomy (data/catalogue.ts), so nothing consumed it.
//
// WHAT THIS FILE IS FOR NOW, since most of what it described has moved: it
// still backs the /indoor, /outdoor and /wardrobes category pages, and it is
// where blindTypes.ts reads product names and taglines from. It is NOT the
// product list — data/catalogue.ts is, and the two disagree deliberately: this
// one still carries Panel Blinds, Café Blinds and the rest, which the business
// does not sell. Trimming it is a separate job from listing the real range, and
// doing it means checking the category pages' grid maths still divides.

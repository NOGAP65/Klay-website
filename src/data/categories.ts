// ---------------------------------------------------------------------------
// CATEGORY STRUCTURE
//
// Main categories: Blinds, Curtains, Wardrobes
// Each has subcategories (product types)
// This mirrors DIY Blinds structure for scalability
// ---------------------------------------------------------------------------

export interface SubCategory {
  slug: string
  name: string
  tagline: string
  image: string
  available: boolean // false = "Coming Soon"
}

export interface Category {
  slug: string
  name: string
  description: string
  subcategories: SubCategory[]
}

// Placeholder images - will need real lifestyle shots
const ROLLER_IMAGE = '/images/Phoenix%20Blockout%20product%20image.png'
const VENETIAN_IMAGE = '/images/lifestyle/room-living.png'
const ROMAN_IMAGE = '/images/lifestyle/room-kitchen.png'
const CURTAIN_IMAGE = '/images/lifestyle/room-living.png'
const WARDROBE_IMAGE = '/images/lifestyle/room-kitchen.png'

export const CATEGORIES: Category[] = [
  {
    slug: 'blinds',
    name: 'Blinds',
    description: 'Made-to-measure blinds for every room',
    subcategories: [
      {
        slug: 'roller-blinds',
        name: 'Roller Blinds',
        tagline: 'Clean lines. Simple elegance.',
        image: ROLLER_IMAGE,
        available: true,
      },
      {
        slug: 'venetian-blinds',
        name: 'Venetian Blinds',
        tagline: 'Classic slats. Total control.',
        image: VENETIAN_IMAGE,
        available: false,
      },
      {
        slug: 'roman-blinds',
        name: 'Roman Blinds',
        tagline: 'Soft folds. Timeless style.',
        image: ROMAN_IMAGE,
        available: false,
      },
      {
        slug: 'vertical-blinds',
        name: 'Vertical Blinds',
        tagline: 'Perfect for wide windows.',
        image: VENETIAN_IMAGE,
        available: false,
      },
      {
        slug: 'panel-blinds',
        name: 'Panel Blinds',
        tagline: 'Modern sliding panels.',
        image: ROMAN_IMAGE,
        available: false,
      },
    ],
  },
  {
    slug: 'curtains',
    name: 'Curtains',
    description: 'Flowing fabrics for your home',
    subcategories: [
      {
        slug: 'sheer-curtains',
        name: 'Sheer Curtains',
        tagline: 'Light and airy.',
        image: CURTAIN_IMAGE,
        available: false,
      },
      {
        slug: 'blockout-curtains',
        name: 'Blockout Curtains',
        tagline: 'Total darkness.',
        image: CURTAIN_IMAGE,
        available: false,
      },
      {
        slug: 'lined-curtains',
        name: 'Lined Curtains',
        tagline: 'Insulated comfort.',
        image: CURTAIN_IMAGE,
        available: false,
      },
    ],
  },
  {
    slug: 'wardrobes',
    name: 'Wardrobes',
    description: 'Custom built-in wardrobes',
    subcategories: [
      {
        slug: 'sliding-doors',
        name: 'Sliding Doors',
        tagline: 'Space-saving elegance.',
        image: WARDROBE_IMAGE,
        available: false,
      },
      {
        slug: 'hinged-doors',
        name: 'Hinged Doors',
        tagline: 'Classic access.',
        image: WARDROBE_IMAGE,
        available: false,
      },
      {
        slug: 'walk-in',
        name: 'Walk-in Wardrobes',
        tagline: 'Your personal boutique.',
        image: WARDROBE_IMAGE,
        available: false,
      },
    ],
  },
]

export const getCategoryBySlug = (slug: string): Category | undefined =>
  CATEGORIES.find(c => c.slug === slug)

export const getSubcategoryBySlug = (categorySlug: string, subSlug: string): SubCategory | undefined => {
  const category = getCategoryBySlug(categorySlug)
  return category?.subcategories.find(s => s.slug === subSlug)
}

// For nav dropdown
export const NAV_CATEGORIES = CATEGORIES.map(c => ({
  name: c.name,
  slug: c.slug,
  subcategories: c.subcategories.map(s => ({
    name: s.name,
    slug: s.slug,
    available: s.available,
  })),
}))

export const SKU_CATALOGUE = [
  { sku: 'BR-01', name: 'Dusk White', type: 'BLOCKOUT ROLLER', hardware: 'White', price: { small: 220, medium: 260, large: 330 }, slug: 'dusk-white', image: '/images/Phoenix%20Blockout%20product%20image.png' },
  { sku: 'BR-02', name: 'Dusk Noir', type: 'BLOCKOUT ROLLER', hardware: 'Black', price: { small: 220, medium: 260, large: 330 }, slug: 'dusk-noir', image: '/images/Phoenix%20Blockout%20product%20image.png' },
  { sku: 'BR-03', name: 'Dusk Chrome', type: 'BLOCKOUT ROLLER', hardware: 'Chrome', price: { small: 220, medium: 260, large: 330 }, slug: 'dusk-chrome', image: '/images/Phoenix%20Blockout%20product%20image.png' },
  { sku: 'SR-01', name: 'Veil White', type: 'SUNSCREEN ROLLER', hardware: 'White', price: { small: 220, medium: 260, large: 330 }, slug: 'veil-white', image: '/images/Soleil%20Sunscreen%20product%20image.png' },
  { sku: 'SR-02', name: 'Veil Noir', type: 'SUNSCREEN ROLLER', hardware: 'Black', price: { small: 220, medium: 260, large: 330 }, slug: 'veil-noir', image: '/images/Soleil%20Sunscreen%20product%20image.png' },
  { sku: 'SR-03', name: 'Veil Chrome', type: 'SUNSCREEN ROLLER', hardware: 'Chrome', price: { small: 220, medium: 260, large: 330 }, slug: 'veil-chrome', image: '/images/Soleil%20Sunscreen%20product%20image.png' },
  { sku: 'DR-01', name: 'Duo White', type: 'DUAL ROLLER', hardware: 'White', price: { small: 320, medium: 380, large: 480 }, slug: 'duo-white', image: '/images/Eclipse%20Dual%20Roller%20product%20image.png' },
  { sku: 'DR-02', name: 'Duo Black', type: 'DUAL ROLLER', hardware: 'Black', price: { small: 320, medium: 380, large: 480 }, slug: 'duo-black', image: '/images/Eclipse%20Dual%20Roller%20product%20image.png' },
  { sku: 'DR-03', name: 'Duo Chrome', type: 'DUAL ROLLER', hardware: 'Chrome', price: { small: 320, medium: 380, large: 480 }, slug: 'duo-chrome', image: '/images/Eclipse%20Dual%20Roller%20product%20image.png' },
]

export const RANGES = [
  { name: 'Dusk', range: 'Blockout Roller', tagline: 'Complete darkness. Total privacy.', description: 'Three hardware finishes. Made to measure for every window.', price: 'from $220', slug: 'blockout', image: '/images/Phoenix%20Blockout%20product%20image.png', skus: SKU_CATALOGUE.filter(s => s.type === 'BLOCKOUT ROLLER') },
  { name: 'Veil', range: 'Sunscreen Roller', tagline: 'Soften the light. Keep the view.', description: 'Reduces glare without closing off the outside world.', price: 'from $220', slug: 'sunscreen', image: '/images/Soleil%20Sunscreen%20product%20image.png', skus: SKU_CATALOGUE.filter(s => s.type === 'SUNSCREEN ROLLER') },
  { name: 'Duo', range: 'Dual Roller', tagline: 'Day and night in one blind.', description: 'Sunscreen and blockout on the same window. Switch between them.', price: 'from $320', slug: 'dual', image: '/images/Eclipse%20Dual%20Roller%20product%20image.png', skus: SKU_CATALOGUE.filter(s => s.type === 'DUAL ROLLER') },
]

// The authoritative Rynamic colour map. These hexes are the literal base
// colour the visualiser renders the fabric as (see Canvas2DBlindRenderer's
// fragment shader) as well as the swatch shown in VisualiserControls — the
// two must never drift apart, so there is exactly one list.
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
  { name: 'Black', hex: '#2C2824' },
  { name: 'Deep Ocean Blue', hex: '#1C3048' },
  { name: 'Woodland Grey', hex: '#686460' },
  { name: 'Monument', hex: '#4C4844' },
]

// The three hardware finishes. Single source for the swatch UI, the store's
// hex lookup and the canvas renderer's flat fill — these were previously
// written out separately in all three places. Black is the brand charcoal.
export const HARDWARE_HEX = {
  white: '#E8E4DE',
  black: '#2C2824',
  chrome: '#B0AEA8',
} as const

export const HARDWARE_OPTIONS = [
  { id: 'white', label: 'White' },
  { id: 'black', label: 'Black' },
  { id: 'chrome', label: 'Chrome' },
] as const

export const MOTORISED_ADDON = 150

export const PRICING_NOTE = 'All prices include professional installation across Victoria. Motorised upgrade available on all products.'

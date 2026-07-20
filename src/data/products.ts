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

export const MOTORISED_ADDON = 150

export const PRICING_NOTE = 'All prices include professional installation across Victoria. Motorised upgrade available on all products.'

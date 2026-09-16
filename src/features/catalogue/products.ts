// Roller identities used by the visualiser basket and shop starting price.
// These are product metadata, not individually routed product pages.
import { RYNAMIC_COLOURS } from '@/features/fabrics'

type ProductBlindType = 'blockout' | 'sunscreen' | 'dual' | 'lightfilter'
interface Product {
  blindType: ProductBlindType
  name: string
  type: string
  priceFrom: number
}

export const PRODUCTS: Product[] = [
  { blindType: 'blockout', name: 'Dusk', type: 'Blockout Roller', priceFrom: 220 },
  { blindType: 'sunscreen', name: 'Veil', type: 'Sunscreen Roller', priceFrom: 220 },
  { blindType: 'dual', name: 'Duo', type: 'Dual Roller', priceFrom: 320 },
  { blindType: 'lightfilter', name: 'Haze', type: 'Light Filter Roller', priceFrom: 220 },
]

export const productByBlindType = (blindType: string | undefined): Product | undefined =>
  PRODUCTS.find(product => product.blindType === blindType)

export const PRODUCT_COUNT = PRODUCTS.length
export const COLOUR_COUNT = RYNAMIC_COLOURS.length

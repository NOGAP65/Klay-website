import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  type: string;
  blindType: string;
  fabricColour: string;
  hardwareColour: string;
  windowSize: 'small' | 'medium' | 'large';
  operation: 'manual' | 'motorised';
  price: number;
  quantity: number;
  /** A made-to-measure line with no price yet — most of the catalogue. It sits
   * in the cart as a measure request: the row prints PRICE ON MEASURE instead
   * of a figure and contributes nothing to the total, which is why `price` is
   * 0 on these rather than a guess. The cart checks out as a quote request, so
   * a priced line and a measure line can share the one basket. */
  priceOnMeasure?: boolean;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const id = `${item.blindType}-${item.fabricColour}-${item.hardwareColour}-${item.windowSize}-${item.operation}`;
        const existingItem = get().items.find(i => i.id === id);

        if (existingItem) {
          set({
            items: get().items.map(i =>
              i.id === id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({
            items: [...get().items, { ...item, id, quantity: 1 }],
          });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter(i => i.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
        } else {
          set({
            items: get().items.map(i =>
              i.id === id ? { ...i, quantity } : i
            ),
          });
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'klay-cart',
    }
  )
);

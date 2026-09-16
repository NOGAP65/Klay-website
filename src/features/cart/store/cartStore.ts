import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { MAX_QUANTITY } from '@/core/pricing';

import { persistedCartItems } from './persistedCart';

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
  /** The configuration exactly as it was chosen, ready to print — "Light
   * control: Blockout", "Slat: Timber". Present on anything added from the
   * range row's card configurator.
   *
   * It exists because the five fixed fields above cannot describe fourteen
   * different products: a wardrobe has no window size and a shower screen has
   * no operation, so printing all five would have the cart stating defaults
   * nobody chose. This lists only the questions that were actually asked. The
   * fields stay populated underneath — they are what the line id is built from
   * and what the quote reads. */
  options?: { label: string; value: string }[];
}

export type CartFeedback = {
  revision: number;
  kind: 'added' | 'removed' | 'restored' | 'limit';
  item: CartItem;
  quantity: number;
};

interface CartStore {
  items: CartItem[];
  feedback: CartFeedback | null;
  feedbackRevision: number;
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>, quantity?: number) => number;
  removeItem: (id: string) => void;
  undoRemoval: (revision: number) => void;
  dismissFeedback: () => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      feedback: null,
      feedbackRevision: 0,

      addItem: (item, quantity = 1) => {
        if (!Number.isFinite(quantity) || quantity < 1) return 0;
        const id = `${item.blindType}-${item.fabricColour}-${item.hardwareColour}-${item.windowSize}-${item.operation}`;
        const current = get();
        const existingItem = current.items.find(i => i.id === id);
        const added = Math.min(Math.floor(quantity), MAX_QUANTITY - (existingItem?.quantity ?? 0));
        const nextItem = { ...item, id, quantity: (existingItem?.quantity ?? 0) + added };
        const revision = current.feedbackRevision + 1;
        set({
          items: existingItem ? current.items.map(i => i.id === id ? nextItem : i) : [...current.items, nextItem],
          feedbackRevision: revision,
          feedback: { revision, kind: added ? 'added' : 'limit', item: nextItem, quantity: added },
        });
        return added;
      },

      removeItem: (id) => {
        const current = get();
        const item = current.items.find(i => i.id === id);
        if (!item) return;
        const revision = current.feedbackRevision + 1;
        set({ items: current.items.filter(i => i.id !== id), feedbackRevision: revision,
          feedback: { revision, kind: 'removed', item, quantity: item.quantity } });
      },

      // Undo is explicit and single-use; stale buttons cannot overwrite newer cart actions.
      undoRemoval: (revision) => {
        const current = get();
        const feedback = current.feedback;
        if (feedback?.kind !== 'removed' || feedback.revision !== revision) return;
        const existing = current.items.find(i => i.id === feedback.item.id);
        const item = { ...feedback.item, quantity: Math.min(MAX_QUANTITY, (existing?.quantity ?? 0) + feedback.quantity) };
        const nextRevision = current.feedbackRevision + 1;
        set({ items: existing ? current.items.map(i => i.id === item.id ? item : i) : [...current.items, item],
          feedbackRevision: nextRevision,
          feedback: { revision: nextRevision, kind: 'restored', item, quantity: item.quantity } });
      },

      dismissFeedback: () => set({ feedback: null }),

      updateQuantity: (id, quantity) => {
        if (!Number.isFinite(quantity)) return;
        quantity = Math.min(MAX_QUANTITY, Math.floor(quantity));
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
        set({ items: [], feedback: null });
      },

      getTotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'klay-cart',
      partialize: state => ({ items: state.items }),
      merge: (persisted, current) => ({ ...current, items: persistedCartItems(persisted) }),
    }
  )
);

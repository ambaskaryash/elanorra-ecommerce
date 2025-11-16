import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiProduct } from '@/lib/services/api';

interface CompareState {
  items: ApiProduct[];
  add: (product: ApiProduct) => void;
  remove: (productId: string) => void;
  toggle: (product: ApiProduct) => void;
  clear: () => void;
  isCompared: (productId: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (product: ApiProduct) => {
        const exists = get().items.some((p) => p.id === product.id);
        if (!exists) {
          set((state) => ({ items: [...state.items, product] }));
        }
      },

      remove: (productId: string) => {
        set((state) => ({ items: state.items.filter((p) => p.id !== productId) }));
      },

      toggle: (product: ApiProduct) => {
        const exists = get().isCompared(product.id);
        if (exists) {
          get().remove(product.id);
        } else {
          get().add(product);
        }
      },

      clear: () => set({ items: [] }),

      isCompared: (productId: string) => get().items.some((p) => p.id === productId),
    }),
    { name: 'app-compare-storage' }
  )
);
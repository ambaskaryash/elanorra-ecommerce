import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiProduct } from '@/lib/services/api';

interface WishlistState {
  items: ApiProduct[];
  isLoading: boolean;
  addToWishlist: (product: ApiProduct) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  toggleWishlist: (product: ApiProduct) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addToWishlist: (product: ApiProduct) => {
        const items = get().items;
        const existingItem = items.find(item => item.id === product.id);
        
        if (!existingItem) {
          set((state) => ({
            ...state,
            items: [...state.items, product],
          }));
        }
      },

      removeFromWishlist: (productId: string) => {
        set((state) => ({
          ...state,
          items: state.items.filter(item => item.id !== productId),
        }));
      },

      isInWishlist: (productId: string) => {
        return get().items.some(item => item.id === productId);
      },

      toggleWishlist: (product: ApiProduct) => {
        const isInWishlist = get().isInWishlist(product.id);
        
        if (isInWishlist) {
          get().removeFromWishlist(product.id);
        } else {
          get().addToWishlist(product);
        }
      },

      clearWishlist: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'studio13-wishlist-storage',
    }
  )
);
import { describe, it, expect, beforeEach } from 'vitest';
import { useWishlistStore } from '../wishlist-store';
import { ApiProduct } from '../../services/api';

const mockProduct: ApiProduct = {
  id: 'prod_1',
  name: 'Test Product',
  slug: 'test-product',
  description: 'Test Description',
  price: 1000,
  category: 'Test Category',
  tags: [],
  inStock: true,
  inventory: 10,
  avgRating: 4.5,
  reviewCount: 10,
  images: [{ id: 'img_1', src: 'test.jpg', alt: 'Test', position: 0 }],
  variants: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Wishlist Store', () => {
  beforeEach(() => {
    useWishlistStore.setState({
      items: [],
      isLoading: false,
    });
  });

  it('should add item to wishlist', () => {
    const store = useWishlistStore.getState();
    store.addToWishlist(mockProduct);

    const state = useWishlistStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe(mockProduct.id);
  });

  it('should not add duplicate item to wishlist', () => {
    const store = useWishlistStore.getState();
    store.addToWishlist(mockProduct);
    store.addToWishlist(mockProduct);

    const state = useWishlistStore.getState();
    expect(state.items).toHaveLength(1);
  });

  it('should remove item from wishlist', () => {
    const store = useWishlistStore.getState();
    store.addToWishlist(mockProduct);
    store.removeFromWishlist(mockProduct.id);

    const state = useWishlistStore.getState();
    expect(state.items).toHaveLength(0);
  });

  it('should check if item is in wishlist', () => {
    const store = useWishlistStore.getState();
    store.addToWishlist(mockProduct);

    expect(store.isInWishlist(mockProduct.id)).toBe(true);
    expect(store.isInWishlist('non-existent')).toBe(false);
  });

  it('should toggle item in wishlist', () => {
    const store = useWishlistStore.getState();
    
    // Add
    store.toggleWishlist(mockProduct);
    expect(useWishlistStore.getState().items).toHaveLength(1);
    
    // Remove
    store.toggleWishlist(mockProduct);
    expect(useWishlistStore.getState().items).toHaveLength(0);
  });

  it('should clear wishlist', () => {
    const store = useWishlistStore.getState();
    store.addToWishlist(mockProduct);
    store.clearWishlist();

    const state = useWishlistStore.getState();
    expect(state.items).toHaveLength(0);
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCartStore } from '../cart-store';
import { couponAPI, ApiProduct } from '../../services/api';

// Mock the API module
vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return {
    ...actual,
    couponAPI: {
      validateCoupon: vi.fn(),
    },
  };
});

// Mock product data
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

const mockProduct2: ApiProduct = {
  ...mockProduct,
  id: 'prod_2',
  name: 'Test Product 2',
  price: 2000,
};

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCartStore.setState({
      items: [],
      isOpen: false,
      totalItems: 0,
      totalPrice: 0,
      subtotalPrice: 0,
      discountAmount: 0,
      taxAmount: 0,
      shippingAmount: 0,
      appliedCoupon: null,
      appliedCouponType: undefined,
    });
    vi.clearAllMocks();
  });

  it('should add items to cart', () => {
    const store = useCartStore.getState();
    store.addItem(mockProduct, 1);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].productId).toBe(mockProduct.id);
    expect(state.items[0].quantity).toBe(1);
    expect(state.totalItems).toBe(1);
    // Subtotal: 1000, Tax: 180, Total: 1180
    expect(state.subtotalPrice).toBe(1000);
    expect(state.taxAmount).toBe(180);
    expect(state.totalPrice).toBe(1180);
  });

  it('should increment quantity when adding existing item', () => {
    const store = useCartStore.getState();
    store.addItem(mockProduct, 1);
    store.addItem(mockProduct, 2);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(3);
    expect(state.totalItems).toBe(3);
  });

  it('should remove items from cart', () => {
    const store = useCartStore.getState();
    store.addItem(mockProduct, 1);
    store.removeItem(mockProduct.id);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.totalItems).toBe(0);
    expect(state.totalPrice).toBe(0);
  });

  it('should update item quantity', () => {
    const store = useCartStore.getState();
    store.addItem(mockProduct, 1);
    store.updateQuantity(mockProduct.id, 5);

    const state = useCartStore.getState();
    expect(state.items[0].quantity).toBe(5);
    expect(state.subtotalPrice).toBe(5000);
  });

  it('should remove item when quantity is updated to 0', () => {
    const store = useCartStore.getState();
    store.addItem(mockProduct, 1);
    store.updateQuantity(mockProduct.id, 0);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
  });

  it('should apply percentage coupon correctly', async () => {
    // Setup cart with 1000 price
    useCartStore.getState().addItem(mockProduct, 1);

    // Mock successful coupon response
    vi.mocked(couponAPI.validateCoupon).mockResolvedValue({
      code: 'SAVE10',
      type: 'percentage',
      value: 10, // 10%
    });

    const result = await useCartStore.getState().applyCoupon('SAVE10');

    expect(result.success).toBe(true);
    expect(result.discount).toBe(100); // 10% of 1000

    const state = useCartStore.getState();
    expect(state.discountAmount).toBe(100);
    expect(state.appliedCoupon).toBe('SAVE10');
    // Subtotal: 1000, Discount: 100, Tax: 180 (18% of subtotal), Total: 1000 - 100 + 180 = 1080
    expect(state.totalPrice).toBe(1080);
  });

  it('should apply fixed amount coupon correctly', async () => {
    useCartStore.getState().addItem(mockProduct, 1); // 1000

    vi.mocked(couponAPI.validateCoupon).mockResolvedValue({
      code: 'FLAT50',
      type: 'fixed',
      value: 50,
    });

    await useCartStore.getState().applyCoupon('FLAT50');

    const state = useCartStore.getState();
    expect(state.discountAmount).toBe(50);
    // 1000 - 50 + 180 = 1130
    expect(state.totalPrice).toBe(1130);
  });

  it('should handle invalid coupon', async () => {
    vi.mocked(couponAPI.validateCoupon).mockResolvedValue({
      error: 'Invalid coupon',
    });

    const result = await useCartStore.getState().applyCoupon('INVALID');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid coupon');

    const state = useCartStore.getState();
    expect(state.appliedCoupon).toBeNull();
    expect(state.discountAmount).toBe(0);
  });

  it('should remove coupon', async () => {
    useCartStore.getState().addItem(mockProduct, 1);
    
    // Apply coupon first manually to state
    useCartStore.setState((state) => ({
      ...state,
      appliedCoupon: 'SAVE10',
      discountAmount: 100,
    }));

    useCartStore.getState().removeCoupon();

    const state = useCartStore.getState();
    expect(state.appliedCoupon).toBeNull();
    expect(state.discountAmount).toBe(0);
  });

  it('should clear cart', () => {
    const store = useCartStore.getState();
    store.addItem(mockProduct, 1);
    store.clearCart();

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.totalItems).toBe(0);
    expect(state.totalPrice).toBe(0);
  });
});

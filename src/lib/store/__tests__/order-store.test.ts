import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOrderStore } from '../order-store';
import { orderAPI } from '../../services/api';

vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return {
    ...actual,
    orderAPI: {
      createOrder: vi.fn(),
    },
  };
});

describe('Order Store', () => {
  beforeEach(() => {
    useOrderStore.setState({
      orders: [],
      currentOrder: null,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('should create an order successfully', async () => {
    const mockOrderData = {
      email: 'test@example.com',
      lineItems: [],
      shippingAddress: {},
      billingAddress: {},
      subtotal: 100,
      taxes: 10,
      shipping: 0,
      totalPrice: 110,
      currency: 'INR',
    };

    // The store implementation of createOrder actually mocks the API call with setTimeout
    // So we don't strictly need to mock the API response unless we change the store to use the real API.
    // Looking at order-store.ts content I read earlier:
    // createOrder: async (orderData) => {
    //   ...
    //   // Simulate API call
    //   await new Promise(resolve => setTimeout(resolve, 2000));
    //   ...
    // }
    
    // It seems the store mocks the API internally!
    // But I should test the store logic.
    // Since it uses setTimeout, I should use fake timers.

    vi.useFakeTimers();
    
    const promise = useOrderStore.getState().createOrder(mockOrderData as any);
    
    // Fast-forward time
    vi.advanceTimersByTime(2000);
    
    await promise;
    
    const state = useOrderStore.getState();
    expect(state.orders).toHaveLength(1);
    expect(state.currentOrder).not.toBeNull();
    expect(state.currentOrder?.email).toBe('test@example.com');
    expect(state.isLoading).toBe(false);

    vi.useRealTimers();
  });
});

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, OrderLineItem } from '@/types';
import { orderAPI, ApiError } from '@/lib/services/api';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  fetchOrders: (params?: { userId?: string; status?: string; page?: number; limit?: number }) => Promise<void>;
  createOrder: (orderData: CreateOrderData) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  getOrder: (orderId: string) => Order | undefined;
  updateOrderStatus: (orderId: string, status: Order['financialStatus'] | Order['fulfillmentStatus'], type: 'financial' | 'fulfillment') => void;
  clearOrders: () => void;
  clearError: () => void;
}

interface CreateOrderData {
  email: string;
  lineItems: OrderLineItem[];
  shippingAddress: any;
  billingAddress: any;
  subtotal: number;
  taxes: number;
  shipping: number;
  totalPrice: number;
  currency: string;
}

// Mock order statuses for demo
const financialStatuses = ['pending', 'paid', 'partially_paid', 'refunded', 'voided'] as const;
const fulfillmentStatuses = ['unfulfilled', 'partial', 'fulfilled', 'restocked'] as const;

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,
      isLoading: false,
      error: null,

      fetchOrders: async (params) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false, error: 'Failed to fetch orders' });
        }
      },

      createOrder: async (orderData: CreateOrderData) => {
        set({ isLoading: true });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const orderId = `EL${Date.now()}`;
          const orderNumber = `EL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
          
          const newOrder: Order = {
            id: orderId,
            orderNumber,
            email: orderData.email,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            totalPrice: orderData.totalPrice,
            subtotal: orderData.subtotal,
            taxes: orderData.taxes,
            shipping: orderData.shipping,
            discount: 0,
            currency: orderData.currency,
            financialStatus: 'pending',
            fulfillmentStatus: 'unfulfilled',
            items: orderData.lineItems.map(item => ({
              id: item.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              variants: {},
              product: {
                name: item.title,
                slug: item.productId,
                images: [{ src: item.image, alt: item.title }]
              }
            })),
            shippingAddress: orderData.shippingAddress,
            billingAddress: orderData.billingAddress,
          };

          set((state) => ({
            orders: [newOrder, ...state.orders],
            currentOrder: newOrder,
            isLoading: false,
          }));

          // Simulate order processing - update status after a delay
          setTimeout(() => {
            set((state) => ({
              orders: state.orders.map(order =>
                order.id === orderId
                  ? { ...order, financialStatus: 'paid' as const }
                  : order
              ),
            }));
          }, 3000);

          setTimeout(() => {
            set((state) => ({
              orders: state.orders.map(order =>
                order.id === orderId
                  ? { ...order, fulfillmentStatus: 'fulfilled' as const }
                  : order
              ),
            }));
          }, 8000);

          return { success: true, orderId };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Failed to create order' };
        }
      },

      getOrder: (orderId: string) => {
        return get().orders.find(order => order.id === orderId);
      },

      updateOrderStatus: (orderId: string, status: string, type: 'financial' | 'fulfillment') => {
        set((state) => ({
          orders: state.orders.map(order =>
            order.id === orderId
              ? {
                  ...order,
                  [type === 'financial' ? 'financialStatus' : 'fulfillmentStatus']: status,
                  updatedAt: new Date().toISOString(),
                }
              : order
          ),
        }));
      },

      clearOrders: () => {
        set({ orders: [], currentOrder: null });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'app-orders-storage',
      // Only persist orders, not loading state
      partialize: (state) => ({
        orders: state.orders,
      }),
    }
  )
);
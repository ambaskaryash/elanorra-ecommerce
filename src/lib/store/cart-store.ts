import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiProduct, couponAPI } from '@/lib/services/api';

interface CartItem {
  productId: string;
  quantity: number;
  product: ApiProduct;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  totalPrice: number;
  subtotalPrice: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  appliedCoupon: string | null;
  appliedCouponType?: 'percentage' | 'fixed' | 'free_shipping';
  addItem: (product: ApiProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyCoupon: (couponCode: string) => Promise<{ success: boolean; message: string; discount?: number }>; 
  removeCoupon: () => void;
  updateShipping: (amount: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
}

// Removed local mock coupons; using live validation API

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      totalItems: 0,
      totalPrice: 0,
      subtotalPrice: 0,
      discountAmount: 0,
      taxAmount: 0,
      shippingAmount: 0,
      appliedCoupon: null,

      addItem: (product: ApiProduct, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.productId === product.id);
          
          let newItems;
          if (existingItem) {
            newItems = state.items.map(item =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            newItems = [...state.items, {
              productId: product.id,
              quantity,
              product
            }];
          }

          const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
          const subtotalPrice = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
          const taxAmount = Math.round(subtotalPrice * 0.18); // 18% GST
          const totalPrice = subtotalPrice - state.discountAmount + taxAmount + state.shippingAmount;

          return {
            ...state,
            items: newItems,
            totalItems,
            subtotalPrice,
            taxAmount,
            totalPrice,
            isOpen: true // Open cart when item is added
          };
        });
      },

      removeItem: (productId: string) => {
        set((state) => {
          const newItems = state.items.filter(item => item.productId !== productId);
          const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
          const subtotalPrice = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
          const taxAmount = Math.round(subtotalPrice * 0.18);
          const totalPrice = subtotalPrice - state.discountAmount + taxAmount + state.shippingAmount;

          return {
            ...state,
            items: newItems,
            totalItems,
            subtotalPrice,
            taxAmount,
            totalPrice
          };
        });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => {
          const newItems = state.items.map(item =>
            item.productId === productId
              ? { ...item, quantity }
              : item
          );

          const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
          const subtotalPrice = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
          const taxAmount = Math.round(subtotalPrice * 0.18);
          const totalPrice = subtotalPrice - state.discountAmount + taxAmount + state.shippingAmount;

          return {
            ...state,
            items: newItems,
            totalItems,
            subtotalPrice,
            taxAmount,
            totalPrice
          };
        });
      },

      applyCoupon: async (couponCode: string) => {
        try {
          const state = get();
          const result = await couponAPI.validateCoupon(couponCode);
          if (result.error) {
            return { success: false, message: result.error };
          }
          const coupon = result as unknown as {
            code: string;
            type: 'percentage' | 'fixed' | 'free_shipping';
            value: number;
            minAmount?: number | null;
            maxDiscount?: number | null;
          };

          // Server already validates window and usage; compute discount client-side for UX
          let discountAmount = 0;
          let message = '';
          if (coupon.type === 'percentage') {
            discountAmount = Math.round(state.subtotalPrice * (coupon.value / 100));
            if (coupon.maxDiscount) {
              discountAmount = Math.min(discountAmount, coupon.maxDiscount);
            }
            message = `${coupon.value}% discount applied!`;
          } else if (coupon.type === 'fixed') {
            discountAmount = Math.round(coupon.value);
            if (coupon.maxDiscount) {
              discountAmount = Math.min(discountAmount, coupon.maxDiscount);
            }
            message = `₹${discountAmount} discount applied!`;
          } else if (coupon.type === 'free_shipping') {
            message = 'Free shipping applied!';
          }

          const taxAmount = Math.round(state.subtotalPrice * 0.18);
          const shippingAmount = coupon.type === 'free_shipping' ? 0 : state.shippingAmount;
          const totalPrice = state.subtotalPrice - discountAmount + taxAmount + shippingAmount;

          set({
            ...state,
            appliedCoupon: couponCode,
            appliedCouponType: coupon.type,
            discountAmount,
            taxAmount,
            shippingAmount,
            totalPrice,
          });

          return { success: true, message, discount: discountAmount };
        } catch (e: any) {
          return { success: false, message: e?.message || 'Failed to apply coupon' };
        }
      },
      
      removeCoupon: () => {
        set((state) => {
          const taxAmount = Math.round(state.subtotalPrice * 0.18);
          const totalPrice = state.subtotalPrice + taxAmount + state.shippingAmount;
          
          return {
            ...state,
            appliedCoupon: null,
            discountAmount: 0,
            totalPrice
          };
        });
      },
      
      updateShipping: (amount: number) => {
        set((state) => {
          // Check for free shipping coupon
          const isFreeShipping = state.appliedCouponType === 'free_shipping';
          const shippingAmount = isFreeShipping ? 0 : amount;
          const totalPrice = state.subtotalPrice - state.discountAmount + state.taxAmount + shippingAmount;
          
          return {
            ...state,
            shippingAmount,
            totalPrice
          };
        });
      },

      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          totalPrice: 0,
          subtotalPrice: 0,
          discountAmount: 0,
          taxAmount: 0,
          shippingAmount: 0,
          appliedCoupon: null,
        });
      },

      toggleCart: () => {
        set((state) => ({ ...state, isOpen: !state.isOpen }));
      }
    }),
    {
      name: 'app-cart-storage',
    }
  )
);
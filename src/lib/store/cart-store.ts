import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiProduct } from '@/lib/services/api';

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
  addItem: (product: ApiProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyCoupon: (couponCode: string) => Promise<{ success: boolean; message: string; discount?: number }>;
  removeCoupon: () => void;
  updateShipping: (amount: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
}

// Mock coupon codes
const COUPON_CODES = {
  'WELCOME10': { discount: 0.10, type: 'percentage', minAmount: 500 },
  'SAVE200': { discount: 200, type: 'fixed', minAmount: 1000 },
  'FREESHIP': { discount: 0, type: 'free_shipping', minAmount: 799 },
  'NEWUSER15': { discount: 0.15, type: 'percentage', minAmount: 1500 },
} as const;

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
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const coupon = COUPON_CODES[couponCode as keyof typeof COUPON_CODES];
        const state = get();
        
        if (!coupon) {
          return { success: false, message: 'Invalid coupon code' };
        }
        
        if (state.subtotalPrice < coupon.minAmount) {
          return { 
            success: false, 
            message: `Minimum order amount of ₹${coupon.minAmount} required` 
          };
        }
        
        let discountAmount = 0;
        let message = '';
        
        if (coupon.type === 'percentage') {
          discountAmount = Math.round(state.subtotalPrice * coupon.discount);
          message = `${coupon.discount * 100}% discount applied!`;
        } else if (coupon.type === 'fixed') {
          discountAmount = coupon.discount;
          message = `₹${coupon.discount} discount applied!`;
        } else if (coupon.type === 'free_shipping') {
          // Free shipping will be handled in shipping calculation
          message = 'Free shipping applied!';
        }
        
        const taxAmount = Math.round(state.subtotalPrice * 0.18);
        const totalPrice = state.subtotalPrice - discountAmount + taxAmount + state.shippingAmount;
        
        set({
          ...state,
          appliedCoupon: couponCode,
          discountAmount,
          totalPrice
        });
        
        return { success: true, message, discount: discountAmount };
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
          const isFreeShipping = state.appliedCoupon === 'FREESHIP';
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
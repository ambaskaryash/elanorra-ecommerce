import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiProduct, couponAPI } from '@/lib/services/api';
import { isMedusaCatalogEnabled } from '@/lib/medusa/config';
import * as medusaCart from '@/lib/medusa/cart';

interface CartItem {
  productId: string;
  variantId?: string;
  lineItemId?: string;
  quantity: number;
  product: ApiProduct;
}

interface CartState {
  cartId: string | null;
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
  initializeCart: (email?: string) => Promise<void>;
  addItem: (product: ApiProduct, quantity?: number, variantId?: string, email?: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  applyCoupon: (couponCode: string) => Promise<{ success: boolean; message: string; discount?: number }>; 
  removeCoupon: () => void;
  updateShipping: (amount: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  syncWithMedusa: (cart: any) => void;
}

// Removed local mock coupons; using live validation API

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartId: null,
      items: [],
      isOpen: false,
      totalItems: 0,
      totalPrice: 0,
      subtotalPrice: 0,
      discountAmount: 0,
      taxAmount: 0,
      shippingAmount: 0,
      appliedCoupon: null,

      initializeCart: async (email?: string) => {
        if (!isMedusaCatalogEnabled()) return;
        
        let cartId = get().cartId;
        try {
          if (!cartId) {
            const cart = await medusaCart.createCart();
            set({ cartId: cart.id });
            if (email) {
              await medusaCart.updateCart(cart.id, { email });
            }
            get().syncWithMedusa(cart);
          } else {
            const cart = await medusaCart.getCart(cartId);
            if (email && !cart.email) {
              await medusaCart.updateCart(cartId, { email });
            }
            get().syncWithMedusa(cart);
          }
        } catch (error) {
          console.error('Failed to initialize Medusa cart:', error);
          // Fallback to local cart if Medusa fails
          set({ cartId: null });
        }
      },

      addItem: async (product: ApiProduct, quantity = 1, variantId?: string, email?: string) => {
        const state = get();
        const selectedVariantId = variantId || product.variants?.[0]?.id || product.id;

        if (isMedusaCatalogEnabled()) {
          try {
            let cartId = state.cartId;
            if (!cartId) {
              const cart = await medusaCart.createCart();
              cartId = cart.id;
              set({ cartId });
              if (email) {
                await medusaCart.updateCart(cartId, { email });
              }
            }
            const cart = await medusaCart.addToCart(cartId, selectedVariantId, quantity);
            get().syncWithMedusa(cart);
            set({ isOpen: true });
            return;
          } catch (error) {
            console.error('Failed to add to Medusa cart:', error);
          }
        }

        // Local fallback
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
              variantId: selectedVariantId,
              quantity,
              product
            }];
          }

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
            totalPrice,
            isOpen: true
          };
        });
      },

      removeItem: async (productId: string) => {
        const state = get();
        if (isMedusaCatalogEnabled() && state.cartId) {
          try {
            const item = state.items.find(i => i.productId === productId);
            if (item?.lineItemId) {
              const cart = await medusaCart.deleteCartItem(state.cartId, item.lineItemId);
              get().syncWithMedusa(cart);
              return;
            }
          } catch (error) {
            console.error('Failed to remove from Medusa cart:', error);
          }
        }

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

      updateQuantity: async (productId: string, quantity: number) => {
        if (quantity <= 0) {
          await get().removeItem(productId);
          return;
        }

        const state = get();
        if (isMedusaCatalogEnabled() && state.cartId) {
          try {
            const item = state.items.find(i => i.productId === productId);
            if (item?.lineItemId) {
              const cart = await medusaCart.updateCartItem(state.cartId, item.lineItemId, quantity);
              get().syncWithMedusa(cart);
              return;
            }
          } catch (error) {
            console.error('Failed to update Medusa cart quantity:', error);
          }
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

      syncWithMedusa: (cart: any) => {
        if (!cart) return;

        const items = cart.items?.map((item: any) => ({
          productId: item.product_id,
          variantId: item.variant_id,
          lineItemId: item.id,
          quantity: item.quantity,
          product: {
            id: item.product_id,
            name: item.title,
            slug: item.handle || item.product?.handle || '',
            description: item.description || '',
            price: item.unit_price,
            images: item.thumbnail ? [{ id: item.id, src: item.thumbnail, alt: item.title, position: 0 }] : [],
            category: 'medusa',
            tags: [],
            inStock: true,
            inventory: item.variant?.inventory_quantity || 999,
            avgRating: 0,
            reviewCount: 0,
            variants: [],
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          } as ApiProduct,
        })) || [];

        // Map promotions to appliedCoupon
        const appliedCoupon = cart.promotions?.[0]?.code || null;

        set({
          items,
          totalItems: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
          subtotalPrice: (cart.subtotal || 0) / 100,
          taxAmount: (cart.tax_total || 0) / 100,
          shippingAmount: (cart.shipping_total || 0) / 100,
          discountAmount: (cart.discount_total || 0) / 100,
          totalPrice: (cart.total || 0) / 100,
          appliedCoupon,
        });
      },

      applyCoupon: async (couponCode: string) => {
        const state = get();
        if (isMedusaCatalogEnabled() && state.cartId) {
          try {
            const cart = await medusaCart.addPromotions(state.cartId, [couponCode]);
            get().syncWithMedusa(cart);
            return { success: true, message: 'Coupon applied successfully', discount: cart.discount_total };
          } catch (error) {
            console.error('Failed to apply Medusa coupon:', error);
            return { success: false, message: 'Invalid or expired coupon' };
          }
        }

        try {
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

      removeCoupon: async () => {
        const state = get();
        if (isMedusaCatalogEnabled() && state.cartId && state.appliedCoupon) {
          try {
            const cart = await medusaCart.removePromotions(state.cartId, [state.appliedCoupon]);
            get().syncWithMedusa(cart);
            return;
          } catch (error) {
            console.error('Failed to remove Medusa coupon:', error);
          }
        }

        set((state) => {
          const taxAmount = Math.round(state.subtotalPrice * 0.18);
          const totalPrice = state.subtotalPrice + taxAmount + state.shippingAmount;
          
          return {
            ...state,
            appliedCoupon: null,
            appliedCouponType: undefined,
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
          cartId: null,   // ← critical: reset so a fresh Medusa cart is created next time
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
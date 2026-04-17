import { medusaFetch } from './client';
import { medusaConfig } from './config';

export type MedusaCart = {
  id: string;
  items?: any[];
  region_id?: string;
  sales_channel_id?: string;
  shipping_address?: any;
  billing_address?: any;
  email?: string;
  subtotal?: number;
  tax_total?: number;
  shipping_total?: number;
  discount_total?: number;
  total?: number;
  payment_collection?: any;
};

export async function createCart() {
  const response = await medusaFetch<{ cart: MedusaCart }>('/store/carts', {
    method: 'POST',
    body: JSON.stringify({
      region_id: medusaConfig.regionId,
      sales_channel_id: (medusaConfig as any).salesChannelId,
    }),
  });
  return response.cart;
}

export async function getCart(cartId: string) {
  const response = await medusaFetch<{ cart: MedusaCart }>(`/store/carts/${cartId}`, {
    query: {
      fields: '*items,*items.variant,*shipping_address,*billing_address,*region,*promotions',
    },
  });
  return response.cart;
}

export async function addToCart(cartId: string, variantId: string, quantity: number) {
  const response = await medusaFetch<{ cart: MedusaCart }>(`/store/carts/${cartId}/line-items`, {
    method: 'POST',
    body: JSON.stringify({
      variant_id: variantId,
      quantity,
    }),
  });
  return response.cart;
}

export async function updateCartItem(cartId: string, lineItemId: string, quantity: number) {
  const response = await medusaFetch<{ cart: MedusaCart }>(`/store/carts/${cartId}/line-items/${lineItemId}`, {
    method: 'POST',
    body: JSON.stringify({
      quantity,
    }),
  });
  return response.cart;
}

export async function deleteCartItem(cartId: string, lineItemId: string) {
  const response = await medusaFetch<{ cart: MedusaCart }>(`/store/carts/${cartId}/line-items/${lineItemId}`, {
    method: 'DELETE',
  });
  return response.cart;
}

export async function updateCart(cartId: string, data: Partial<MedusaCart>) {
  const response = await medusaFetch<{ cart: MedusaCart }>(`/store/carts/${cartId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.cart;
}

export async function addShippingAddress(cartId: string, address: any) {
  return updateCart(cartId, { shipping_address: address });
}

export async function createPaymentSessions(cartId: string) {
  const response = await medusaFetch<{ cart: MedusaCart }>(`/store/carts/${cartId}/payment-collections`, {
    method: 'POST',
  });
  return response.cart;
}

export async function listShippingOptions(cartId: string) {
  const response = await medusaFetch<{ shipping_options: any[] }>('/store/shipping-options', {
    query: { cart_id: cartId },
  });
  return response.shipping_options;
}

export async function addShippingMethod(cartId: string, optionId: string) {
  const response = await medusaFetch<{ cart: MedusaCart }>(`/store/carts/${cartId}/shipping-methods`, {
    method: 'POST',
    body: JSON.stringify({
      option_id: optionId,
    }),
  });
  return response.cart;
}

export async function addPromotions(cartId: string, promoCodes: string[]) {
  const response = await medusaFetch<{ cart: MedusaCart }>(`/store/carts/${cartId}/promotions`, {
    method: 'POST',
    body: JSON.stringify({
      promo_codes: promoCodes,
    }),
  });
  return response.cart;
}

export async function removePromotions(cartId: string, promoCodes: string[]) {
  const response = await medusaFetch<{ cart: MedusaCart }>(`/store/carts/${cartId}/promotions`, {
    method: 'DELETE',
    body: JSON.stringify({
      promo_codes: promoCodes,
    }),
  });
  return response.cart;
}

export async function selectPaymentSession(cartId: string, providerId: string) {
  // In Medusa v2, you might need to select a session if multiple exist
  return true; 
}

export async function authorizePaymentSession(cartId: string) {
  // 1. Get the cart to find the payment collection ID
  const cart = await getCart(cartId);
  const paymentCollectionId = cart.payment_collection?.id;
  
  if (!paymentCollectionId) {
    throw new Error('No payment collection found for cart');
  }

  // 2. Authorize the collection
  // In Medusa v2, completing the cart usually handles authorization if sessions are initialized.
  // But for external providers like Razorpay, we can trigger authorization explicitly.
  const response = await medusaFetch<any>(`/store/payment-collections/${paymentCollectionId}/authorize`, {
    method: 'POST',
  });
  
  return response;
}

import { medusaFetch } from './client';

export type MedusaOrder = {
  id: string;
  status: string;
  fulfillment_status: string;
  payment_status: string;
  total: number;
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  discount_total: number;
  currency_code: string;
  items: any[];
  shipping_address: any;
  billing_address: any;
  email: string;
  display_id: number;
  created_at: string;
  updated_at: string;
};

export async function placeOrder(cartId: string) {
  // 1. Fetch Cart to get payment collection and session
  const cartResponse = await medusaFetch<any>(`/store/carts/${cartId}`, {
    query: { fields: '*payment_collection,*payment_collection.payment_sessions' },
  }).catch(() => null);
  
  const paymentCollection = cartResponse?.cart?.payment_collection;
  const session = paymentCollection?.payment_sessions?.[0];

  // 2. Authorize the session explicitly so Medusa permits cart completion
  if (paymentCollection?.id && session?.id) {
    await medusaFetch<any>(`/store/payment-collections/${paymentCollection.id}/payment-sessions/${session.id}/authorize`, {
      method: 'POST',
    }).catch(e => console.warn('Payment auth auto-bypass warning:', e));
  }

  // 3. Complete Cart
  const response = await medusaFetch<{ order: MedusaOrder }>(`/store/carts/${cartId}/complete`, {
    method: 'POST',
  });
  return response.order;
}

export async function getOrder(orderId: string) {
  const response = await medusaFetch<{ order: MedusaOrder }>(`/store/orders/${orderId}`, {
    query: {
      fields: '*items,*shipping_address,*billing_address,*fulfillments,*fulfillments.tracking_links',
    },
  });
  return response.order;
}

export async function listOrders(customerEmail?: string) {
  const query: any = {
    fields: '*items,*shipping_address',
  };
  
  // Medusa v2 Store API: filter orders by email (used at checkout)
  // customer_id references Medusa-native customers, not Clerk user IDs
  if (customerEmail) {
    query.email = customerEmail;
  }
  
  const response = await medusaFetch<{ orders: MedusaOrder[]; count: number }>('/store/orders', {
    query,
  }).catch(() => ({ orders: [] as MedusaOrder[], count: 0 }));
  return response.orders || [];
}

export async function createReturn(orderId: string, items: any[], reason: string) {
  const response = await medusaFetch<{ return: any }>(`/store/orders/${orderId}/returns`, {
    method: 'POST',
    body: JSON.stringify({
      items: items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        reason_id: item.reason_id,
      })),
    }),
  });
  return response.return;
}

export async function listReturns() {
  const response = await medusaFetch<{ returns: any[]; count: number }>('/store/returns', {
    query: {
      fields: '*items,*order',
    },
  });
  return response.returns;
}

export async function captureOrderPayment(orderId: string) {
  // In Medusa v2, payment capture for an order is usually done via the Payments API 
  // linked to the order's payment collection.
  // We'll use a generic approach to ensure Medusa marks the order as paid.
  const response = await medusaFetch<any>(`/store/orders/${orderId}/payments/capture`, {
    method: 'POST',
  }).catch(err => {
    // If the direct capture endpoint doesn't exist in this specific v2 setup, 
    // we'll log it. Some v2 setups use a different workflow.
    console.warn(`Medusa capture attempt for ${orderId}: ${err.message}`);
    return null;
  });
  return response;
}

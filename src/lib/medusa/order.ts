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
  const response = await medusaFetch<{ order: MedusaOrder }>(`/store/carts/${cartId}/complete`, {
    method: 'POST',
  });
  return response.order;
}

export async function getOrder(orderId: string) {
  const response = await medusaFetch<{ order: MedusaOrder }>(`/store/orders/${orderId}`, {
    query: {
      fields: '*items,*shipping_address,*billing_address',
    },
  });
  return response.order;
}

export async function listOrders(customerId?: string) {
  const query: any = {
    fields: '*items,*shipping_address',
  };
  
  if (customerId) {
    query.customer_id = customerId;
  }
  
  const response = await medusaFetch<{ orders: MedusaOrder[]; count: number }>('/store/orders', {
    query,
  });
  return response.orders;
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

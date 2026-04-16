import { Order } from '@/types';
import { MedusaOrder } from './order';

export function mapMedusaOrderToOrder(order: MedusaOrder): Order {
  return {
    id: order.id,
    orderNumber: `EL-${order.display_id}`,
    email: order.email,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    totalPrice: order.total / 100,
    subtotal: order.subtotal / 100,
    taxes: order.tax_total / 100,
    shipping: order.shipping_total / 100,
    discount: order.discount_total / 100,
    currency: order.currency_code?.toUpperCase() || 'INR',
    financialStatus: order.payment_status === 'captured' ? 'paid' : 'pending',
    fulfillmentStatus: order.fulfillment_status === 'fulfilled' ? 'fulfilled' : 'unfulfilled',
    items: order.items?.map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      quantity: item.quantity,
      price: item.unit_price / 100,
      variants: {},
      product: {
        name: item.title,
        slug: item.product?.handle || '',
        images: item.thumbnail ? [{ src: item.thumbnail, alt: item.title }] : []
      }
    })) || [],
    shippingAddress: {
      firstName: order.shipping_address?.first_name || '',
      lastName: order.shipping_address?.last_name || '',
      company: order.shipping_address?.company || '',
      address1: order.shipping_address?.address_1 || '',
      address2: order.shipping_address?.address_2 || '',
      city: order.shipping_address?.city || '',
      state: order.shipping_address?.province || '',
      zipCode: order.shipping_address?.postal_code || '',
      country: order.shipping_address?.country_code || '',
      phone: order.shipping_address?.phone || '',
    },
    billingAddress: {
      firstName: order.billing_address?.first_name || '',
      lastName: order.billing_address?.last_name || '',
      company: order.billing_address?.company || '',
      address1: order.billing_address?.address_1 || '',
      address2: order.billing_address?.address_2 || '',
      city: order.billing_address?.city || '',
      state: order.billing_address?.province || '',
      zipCode: order.billing_address?.postal_code || '',
      country: order.billing_address?.country_code || '',
      phone: order.billing_address?.phone || '',
    },
  };
}

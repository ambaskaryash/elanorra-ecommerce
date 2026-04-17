import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import * as medusaOrder from '@/lib/medusa/order';
import * as emailService from '@/lib/email';
import { isMedusaCatalogEnabled } from '@/lib/medusa/config';

/**
 * Medusa Webhook Handler
 * Listen for fulfillment events to trigger shipping notifications
 */
export async function POST(request: NextRequest) {
  if (!isMedusaCatalogEnabled()) {
    return NextResponse.json({ message: 'Medusa integration not enabled' }, { status: 200 });
  }

  try {
    const body = await request.json();
    const { event_name, data } = body;

    logger.info('Received Medusa Webhook', { event_name, data });

    // 1. Order Confirmation (Fallback if not handled elsewhere)
    // In our current setup, Razorpay handles the initial confirmation.
    // However, listening for 'order.placed' can be a good safety net.
    
    // 2. Shipping Notifications
    if (event_name === 'order.fulfillment_created' || event_name === 'order.shipped') {
      const orderId = data.id || data.order_id;
      if (!orderId) {
        return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
      }

      // Fetch full order details including fulfillments and tracking
      const order = await medusaOrder.getOrder(orderId);
      if (!order) {
        logger.error('Failed to fetch order for shipping notification', { orderId });
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Check if there are fulfillments with tracking links
      const fulfillment = (order as any).fulfillments?.[0];
      const tracking = fulfillment?.tracking_links?.[0];

      if (fulfillment) {
        await emailService.sendShippingNotificationEmail({
          email: order.email,
          orderNumber: `${order.display_id}`,
          orderId: order.id,
          customerName: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`,
          trackingNumber: tracking?.tracking_number,
          carrier: tracking?.metadata?.carrier || 'Delhivery', // Fallback to our primary carrier
          estimatedDelivery: '3-7 business days',
          shippingAddress: {
            firstName: order.shipping_address.first_name,
            lastName: order.shipping_address.last_name,
            address1: order.shipping_address.address_1,
            address2: order.shipping_address.address_2,
            city: order.shipping_address.city,
            state: order.shipping_address.province,
            zipCode: order.shipping_address.postal_code,
            country: order.shipping_address.country_code,
            phone: order.shipping_address.phone,
          },
          items: order.items.map(item => ({
            name: item.title,
            quantity: item.quantity,
            image: item.thumbnail,
          })),
        });

        logger.info('Shipping notification sent', { orderId, email: order.email });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Medusa Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { prisma } from '@/lib/prisma';
import { OdooClient } from './client';
import { logger } from '@/lib/logger';

// Initialize Odoo Client
const getOdooClient = () => {
  const url = process.env.ODOO_URL;
  const db = process.env.ODOO_DB;
  const username = process.env.ODOO_USERNAME;
  const password = process.env.ODOO_PASSWORD;

  if (!url || !db || !username || !password) {
    // Only log warning, don't throw, to allow fail-safe execution
    logger.warn('Odoo environment variables missing. Skipping Odoo push.');
    return null;
  }

  return new OdooClient({ url, db, username, password });
};

export async function pushOrderToOdoo(orderId: string) {
  const odoo = getOdooClient();
  if (!odoo) return;

  try {
    // 1. Fetch full order details with items and user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        user: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      logger.error(`Order ${orderId} not found for Odoo push`);
      return;
    }

    if (order.odooId) {
      logger.info(`Order ${orderId} already synced to Odoo (ID: ${order.odooId})`);
      return;
    }

    await odoo.connect();

    // 2. Find or Create Partner (Customer)
    let partnerId = order.user?.odooId;

    if (!partnerId) {
      // Search by email first
      const partners = await odoo.searchRead('res.partner', [['email', '=', order.email]], { fields: ['id'], limit: 1 });
      
      if (partners.length > 0) {
        partnerId = partners[0].id;
      } else {
        // Create new partner
        partnerId = await odoo.create('res.partner', {
          name: order.shippingAddress?.firstName + ' ' + order.shippingAddress?.lastName || 'Guest User',
          email: order.email,
          phone: order.shippingAddress?.phone,
          street: order.shippingAddress?.address1,
          street2: order.shippingAddress?.address2,
          city: order.shippingAddress?.city,
          zip: order.shippingAddress?.zipCode,
          // country_id lookup would be needed here ideally
        });
        logger.info(`Created new Odoo partner: ${partnerId}`);
      }

      // Link user if exists
      if (order.userId) {
        await prisma.user.update({
          where: { id: order.userId },
          data: { odooId: partnerId },
        });
      }
    }

    // 3. Prepare Order Lines
    const orderLines = [];
    for (const item of order.items) {
      let productOdooId = item.product.odooId;

      if (!productOdooId) {
        // Fallback: If product isn't linked, try to find it by name/SKU
        // For now, we skip or log warning. In production, maybe create a placeholder?
        logger.warn(`Product ${item.product.name} not linked to Odoo. Skipping line item.`);
        continue;
      }

      orderLines.push([0, 0, {
        product_id: productOdooId, // Note: Odoo uses product.product ID, not template. This is a simplification.
        // In Odoo: product.template is the generic product, product.product is the variant.
        // If we only have 1 variant per template, template_id might not work directly in sale order line.
        // We might need to fetch the product.product ID from the template ID.
        product_uom_qty: item.quantity,
        price_unit: item.price,
      }]);
    }

    // 4. Create Sale Order
    const odooOrderId = await odoo.create('sale.order', {
      partner_id: partnerId,
      date_order: order.createdAt.toISOString().split('T')[0],
      client_order_ref: order.orderNumber,
      order_line: orderLines,
      state: 'sale', // Confirm order immediately
    });

    logger.info(`Created Odoo Sales Order: ${odooOrderId}`);

    // 5. Update local order with Odoo ID
    await prisma.order.update({
      where: { id: order.id },
      data: { odooId: odooOrderId },
    });

  } catch (error) {
    // Log but do NOT throw - we don't want to break the webhook response
    logger.error('Failed to push order to Odoo', error);
  }
}

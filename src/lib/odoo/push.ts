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
    const templateIds = order.items
      .map((item: any) => item.product.odooId)
      .filter((id: any): id is number => typeof id === 'number');

    // Batch fetch variants for these templates
    // Sale Order requires product.product ID (variant), not product.template ID
    const variantMap = new Map<number, number>();
    if (templateIds.length > 0) {
      try {
        const variants = await odoo.searchRead(
          'product.product',
          [['product_tmpl_id', 'in', templateIds]],
          { fields: ['id', 'product_tmpl_id'] }
        );
        
        for (const v of variants) {
          // Store mapping: Template ID -> Variant ID
          // Note: If multiple variants exist, this picks the last one processed. 
          // For simple products (1 variant), this is correct.
          if (Array.isArray(v.product_tmpl_id)) {
             variantMap.set(v.product_tmpl_id[0], v.id);
          }
        }
      } catch (e) {
        logger.error('Failed to fetch product variants from Odoo', e);
      }
    }

    const orderLines = [];
    for (const item of order.items) {
      const templateId = item.product.odooId;

      if (!templateId) {
        logger.warn(`Product ${item.product.name} not linked to Odoo. Skipping.`);
        continue;
      }

      const variantId = variantMap.get(templateId);

      if (!variantId) {
        logger.warn(`No Odoo variant found for product ${item.product.name} (Template ID: ${templateId}). Skipping.`);
        continue;
      }

      orderLines.push([0, 0, {
        product_id: variantId, 
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

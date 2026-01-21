import { prisma } from '@/lib/prisma';
import { OdooClient } from './client';
import { logger } from '@/lib/logger';
import slugify from 'slugify';

// Initialize Odoo Client
const getOdooClient = () => {
  const url = process.env.ODOO_URL;
  const db = process.env.ODOO_DB;
  const username = process.env.ODOO_USERNAME;
  const password = process.env.ODOO_PASSWORD;

  if (!url || !db || !username || !password) {
    throw new Error('Odoo environment variables are missing');
  }

  return new OdooClient({ url, db, username, password });
};

export async function syncProductsFromOdoo() {
  const odoo = getOdooClient();
  
  try {
    logger.info('Starting Odoo product sync...');
    
    // Connect to Odoo
    await odoo.connect();
    
    // Fetch products from Odoo
    // We use 'product.template' which represents the unique product (ignoring variants for now)
    // Domain: [['sale_ok', '=', true]] -> Only products that can be sold
    const fields = [
      'id', 
      'name', 
      'default_code', // often used as SKU or reference
      'list_price', 
      'description_sale', // description
      'qty_available', 
      'weight',
      'categ_id', // category [id, name]
      'image_1920', // Main image (base64) - Warning: Heavy!
    ];

    const products = await odoo.searchRead(
      'product.template', 
      [['sale_ok', '=', true]], 
      { fields, limit: 100 } // Limit to 100 for safety in this iteration
    );

    logger.info(`Fetched ${products.length} products from Odoo.`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const p of products) {
      try {
        // Generate a slug if default_code (SKU) is missing
        const slugCandidate = p.default_code || slugify(p.name, { lower: true, strict: true });
        
        // 1. Try to find existing product by Odoo ID
        let existingProduct = await prisma.product.findUnique({
          where: { odooId: p.id },
        });

        // 2. If not found, try to link by Slug (Prevent Duplicates/Errors)
        if (!existingProduct) {
          existingProduct = await prisma.product.findUnique({
            where: { slug: slugCandidate },
          });
          
          if (existingProduct) {
            logger.info(`Linking existing product "${existingProduct.name}" to Odoo ID ${p.id}`);
          }
        }

        const productData = {
          odooId: p.id,
          name: p.name,
          slug: slugCandidate,
          description: p.description_sale || p.name,
          price: p.list_price || 0,
          category: Array.isArray(p.categ_id) ? p.categ_id[1] : 'Uncategorized',
          inStock: p.qty_available > 0,
          inventory: Math.floor(p.qty_available || 0),
          weight: p.weight || 0,
        };

        if (existingProduct) {
          // UPDATE existing product
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              ...productData,
              updatedAt: new Date(),
            },
          });
        } else {
          // CREATE new product
          await prisma.product.create({
            data: {
              ...productData,
              tags: [],
              avgRating: 0,
              reviewCount: 0,
            },
          });
        }
        
        syncedCount++;
      } catch (err) {
        logger.error(`Failed to sync product ${p.name} (Odoo ID: ${p.id})`, err);
        errorCount++;
      }
    }

    return { success: true, synced: syncedCount, errors: errorCount };
    
  } catch (error) {
    logger.error('Odoo sync failed', error);
    throw error;
  }
}

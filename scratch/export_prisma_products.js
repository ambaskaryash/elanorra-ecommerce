import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  try {
    const products = await prisma.product.findMany({
      include: {
        images: {
          orderBy: {
            position: 'asc'
          }
        },
        variants: true,
        collections: {
          include: {
            collection: true
          }
        }
      }
    });
    
    fs.writeFileSync('prisma_products.json', JSON.stringify(products, null, 2));
    console.log(`Exported ${products.length} products to prisma_products.json`);
    
    // Also get categories
    const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    console.log('Categories found:', categories);
    
  } catch (error) {
    console.error('Error during export:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
